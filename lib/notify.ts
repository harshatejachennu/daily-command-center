// Server-only push notifications via ntfy (https://ntfy.sh).
//
// After a report is imported, we POST a short summary to an ntfy topic; the
// ntfy app on the phone shows it. Best-effort: a notification failure never
// breaks the import. Configured via NTFY_TOPIC (and optional NTFY_SERVER).

import "server-only";

import type { DailyReport } from "@/types/report";
import { getSection } from "@/lib/report-helpers";

interface NtfyConfig {
  topic: string;
  server: string;
  appUrl?: string;
}

function ntfyConfig(): NtfyConfig | null {
  const topic = process.env.NTFY_TOPIC;
  if (!topic || topic.startsWith("replace_with_")) return null;
  const server = (process.env.NTFY_SERVER || "https://ntfy.sh").replace(/\/+$/, "");
  return { topic, server, appUrl: process.env.NEXT_PUBLIC_APP_URL || undefined };
}

export function isNotifyConfigured(): boolean {
  return ntfyConfig() !== null;
}

/** Build a short title + bulleted body from a report. Title is kept ASCII. */
export function buildReportSummary(report: DailyReport): {
  title: string;
  body: string;
} {
  const title = report.date ? `Daily Report ${report.date}` : "Daily Report";

  const lines: string[] = [];
  if (report.summary) lines.push(report.summary);

  const top = getSection(report, "top_things");
  const bullets = (top?.items ?? []).slice(0, 4).map((i) => `• ${i.title}`);
  if (bullets.length) {
    if (lines.length) lines.push("");
    lines.push(...bullets);
  }

  return { title, body: lines.join("\n") || "Your daily report is ready." };
}

/**
 * Send the report summary as an ntfy push. Never throws and is skipped silently
 * when NTFY_TOPIC is not configured.
 */
export async function sendReportNotification(report: DailyReport): Promise<void> {
  const cfg = ntfyConfig();
  if (!cfg) return;

  const { title, body } = buildReportSummary(report);
  const headers: Record<string, string> = {
    Title: title,
    Tags: "calendar",
    Priority: "default",
  };
  if (cfg.appUrl) headers.Click = cfg.appUrl; // tap notification → open dashboard

  try {
    await fetch(`${cfg.server}/${encodeURIComponent(cfg.topic)}`, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Best-effort: never let a notification failure affect the import.
  }
}
