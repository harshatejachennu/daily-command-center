// Server-only Gmail bridge.
//
// Flow: a ChatGPT Scheduled Task emails the daily report to a Gmail address with
// the report JSON wrapped between marker lines. This module finds the latest such
// email, extracts the JSON, validates it, and saves it via the existing
// report-store. It uses the Gmail REST API directly with a stored OAuth refresh
// token (read-only scope) — no heavy SDK, no client exposure, no token logging.

import "server-only";

import type { DailyReport } from "@/types/report";
import { normalizeReport } from "@/lib/validate-report";
import {
  isStorageConfigured,
  saveReport,
  StorageNotConfiguredError,
} from "@/lib/report-store";

export const BEGIN_MARKER = "---BEGIN_DAILY_COMMAND_CENTER_JSON---";
export const END_MARKER = "---END_DAILY_COMMAND_CENTER_JSON---";

const DEFAULT_QUERY =
  "to:harshateja.chennu00+dailycommand@gmail.com subject:DAILY_COMMAND_CENTER_REPORT newer_than:3d";

export type GmailImportErrorCode =
  | "gmail_not_configured"
  | "auth_failed"
  | "gmail_api_error"
  | "no_email"
  | "no_markers"
  | "invalid_json"
  | "invalid_shape"
  | "storage_not_configured"
  | "storage_failed";

export interface GmailImportSuccess {
  ok: true;
  report: DailyReport;
  emailSubject?: string;
  emailDate?: string;
}
export interface GmailImportFailure {
  ok: false;
  code: GmailImportErrorCode;
  error: string;
}
export type GmailImportResult = GmailImportSuccess | GmailImportFailure;

interface GmailEnv {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  query: string;
  label?: string;
}

function readGmailEnv(): GmailEnv | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  const placeholder = (v?: string) =>
    !v || v.startsWith("replace_with_");

  if (placeholder(clientId) || placeholder(clientSecret) || placeholder(refreshToken)) {
    return null;
  }

  return {
    clientId: clientId!,
    clientSecret: clientSecret!,
    refreshToken: refreshToken!,
    query: process.env.GMAIL_REPORT_QUERY || DEFAULT_QUERY,
    label: process.env.GMAIL_REPORT_LABEL || undefined,
  };
}

export function isGmailConfigured(): boolean {
  return readGmailEnv() !== null;
}

/** Exchange the refresh token for a short-lived access token. Never logged. */
async function getAccessToken(env: GmailEnv): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.clientId,
      client_secret: env.clientSecret,
      refresh_token: env.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    // Surface Google's error type without echoing any secret material.
    let detail = "";
    try {
      const body = (await res.json()) as { error?: string };
      detail = body.error ? ` (${body.error})` : "";
    } catch {
      /* ignore */
    }
    throw new GmailApiError("auth_failed", `Google token exchange failed${detail}.`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new GmailApiError("auth_failed", "Google did not return an access token.");
  }
  return json.access_token;
}

class GmailApiError extends Error {
  code: GmailImportErrorCode;
  constructor(code: GmailImportErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

async function gmailApi<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new GmailApiError(
      "gmail_api_error",
      `Gmail API request failed (${res.status}).`,
    );
  }
  return (await res.json()) as T;
}

interface GmailMessageRef {
  id: string;
  threadId: string;
}
interface GmailListResponse {
  messages?: GmailMessageRef[];
}
interface GmailPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
}
interface GmailMessage {
  id: string;
  internalDate?: string;
  payload?: GmailPart & { headers?: { name: string; value: string }[] };
}

/** Find the newest message id matching the query, preferring the label if set. */
async function findLatestMessageId(env: GmailEnv, token: string): Promise<string | null> {
  const queries: string[] = [];
  if (env.label) queries.push(`label:"${env.label}" ${env.query}`);
  queries.push(env.query);

  for (const q of queries) {
    const data = await gmailApi<GmailListResponse>(
      `messages?maxResults=1&q=${encodeURIComponent(q)}`,
      token,
    );
    if (data.messages && data.messages.length > 0) {
      return data.messages[0].id;
    }
  }
  return null;
}

function decodeBase64Url(data: string): string {
  return Buffer.from(
    data.replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  ).toString("utf8");
}

/** Recursively collect decoded text/plain and text/html bodies from a message. */
function collectText(part: GmailPart | undefined, acc: { plain: string; html: string }) {
  if (!part) return;
  const mime = part.mimeType ?? "";
  if (part.body?.data) {
    const text = decodeBase64Url(part.body.data);
    if (mime.startsWith("text/plain")) acc.plain += text + "\n";
    else if (mime.startsWith("text/html")) acc.html += text + "\n";
  }
  if (part.parts) for (const child of part.parts) collectText(child, acc);
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""),
  );
}

/**
 * Pull the JSON object out of the text between the BEGIN/END markers.
 * Exported for direct unit testing.
 */
export function extractReportJson(
  text: string,
): { ok: true; value: unknown } | { ok: false; code: "no_markers" | "invalid_json" } {
  const start = text.indexOf(BEGIN_MARKER);
  if (start === -1) return { ok: false, code: "no_markers" };
  const from = start + BEGIN_MARKER.length;
  const end = text.indexOf(END_MARKER, from);
  if (end === -1) return { ok: false, code: "no_markers" };

  let raw = text.slice(from, end).trim();
  // Tolerate the JSON being wrapped in a markdown code fence.
  raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    try {
      return { ok: true, value: JSON.parse(decodeHtmlEntities(raw)) };
    } catch {
      return { ok: false, code: "invalid_json" };
    }
  }
}

function getHeader(msg: GmailMessage, name: string): string | undefined {
  return msg.payload?.headers?.find(
    (h) => h.name.toLowerCase() === name.toLowerCase(),
  )?.value;
}

/**
 * Import the latest report email from Gmail, validate it, and save it.
 * Returns a typed result with a stable error code on any failure.
 */
export async function importLatestReportFromGmail(): Promise<GmailImportResult> {
  const env = readGmailEnv();
  if (!env) {
    return {
      ok: false,
      code: "gmail_not_configured",
      error:
        "Gmail is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.",
    };
  }

  if (!isStorageConfigured()) {
    return {
      ok: false,
      code: "storage_not_configured",
      error:
        "Storage is not configured. Add Supabase env vars before importing.",
    };
  }

  let token: string;
  let messageId: string | null;
  let message: GmailMessage;
  try {
    token = await getAccessToken(env);
    messageId = await findLatestMessageId(env, token);
    if (!messageId) {
      return {
        ok: false,
        code: "no_email",
        error:
          "No matching report email found. Check the address, subject, and that it arrived in the last 3 days.",
      };
    }
    message = await gmailApi<GmailMessage>(
      `messages/${messageId}?format=full`,
      token,
    );
  } catch (err) {
    if (err instanceof GmailApiError) {
      return { ok: false, code: err.code, error: err.message };
    }
    return {
      ok: false,
      code: "gmail_api_error",
      error: err instanceof Error ? err.message : "Gmail request failed.",
    };
  }

  const acc = { plain: "", html: "" };
  collectText(message.payload, acc);
  const text = acc.plain.includes(BEGIN_MARKER)
    ? acc.plain
    : acc.plain || stripHtml(acc.html);

  const extracted = extractReportJson(text);
  if (!extracted.ok) {
    return {
      ok: false,
      code: extracted.code,
      error:
        extracted.code === "no_markers"
          ? "Found the email but no JSON between the BEGIN/END markers."
          : "The text between the markers was not valid JSON.",
    };
  }

  const normalized = normalizeReport(extracted.value);
  if (!normalized.ok) {
    return {
      ok: false,
      code: "invalid_shape",
      error: `Invalid report shape: ${normalized.error}`,
    };
  }

  const emailSubject = getHeader(message, "Subject");
  const emailDate =
    getHeader(message, "Date") ??
    (message.internalDate
      ? new Date(Number(message.internalDate)).toISOString()
      : undefined);

  try {
    const saved = await saveReport(normalized.report);
    return { ok: true, report: saved, emailSubject, emailDate };
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return { ok: false, code: "storage_not_configured", error: err.message };
    }
    return {
      ok: false,
      code: "storage_failed",
      error: err instanceof Error ? err.message : "Failed to save report.",
    };
  }
}
