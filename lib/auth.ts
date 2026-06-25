// Authentication helpers for protected server routes.
// Server-only. Never logs or returns secret values.

import { timingSafeEqual } from "node:crypto";

export type AuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; message: string };

/** Constant-time string comparison that tolerates differing lengths. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still do a comparison to avoid early-exit timing differences.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function getBearer(request: Request): string | undefined {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function isUnset(secret: string | undefined): boolean {
  return !secret || secret.startsWith("replace_with_");
}

/**
 * Validate the Authorization header against a single configured secret.
 * Missing server secret -> 500 (misconfig). Missing/wrong client token -> 401.
 */
function checkBearer(
  request: Request,
  secret: string | undefined,
  envName: string,
): AuthResult {
  if (isUnset(secret)) {
    return {
      ok: false,
      status: 500,
      message: `Server is missing ${envName}. Set it in your environment.`,
    };
  }
  const provided = getBearer(request);
  if (!provided || !safeEqual(provided, secret!)) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
  return { ok: true };
}

/** Auth for the direct push endpoint: `Authorization: Bearer <REPORT_INGEST_SECRET>`. */
export function checkIngestAuth(request: Request): AuthResult {
  return checkBearer(request, process.env.REPORT_INGEST_SECRET, "REPORT_INGEST_SECRET");
}

/** Auth for the Gmail import endpoint: `Authorization: Bearer <GMAIL_IMPORT_SECRET>`. */
export function checkGmailImportAuth(request: Request): AuthResult {
  return checkBearer(request, process.env.GMAIL_IMPORT_SECRET, "GMAIL_IMPORT_SECRET");
}

/**
 * Auth for the cron route. Accepts EITHER CRON_SECRET (sent automatically by
 * Vercel Cron) OR GMAIL_IMPORT_SECRET (for manual triggering).
 */
export function checkCronAuth(request: Request): AuthResult {
  const cronSecret = process.env.CRON_SECRET;
  const gmailSecret = process.env.GMAIL_IMPORT_SECRET;

  if (isUnset(cronSecret) && isUnset(gmailSecret)) {
    return {
      ok: false,
      status: 500,
      message: "Server is missing CRON_SECRET and GMAIL_IMPORT_SECRET.",
    };
  }

  const provided = getBearer(request);
  if (provided) {
    if (!isUnset(cronSecret) && safeEqual(provided, cronSecret!)) return { ok: true };
    if (!isUnset(gmailSecret) && safeEqual(provided, gmailSecret!)) return { ok: true };
  }
  return { ok: false, status: 401, message: "Unauthorized" };
}
