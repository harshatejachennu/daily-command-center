"use server";

import { normalizeReport } from "@/lib/validate-report";
import {
  isStorageConfigured,
  saveReport,
  StorageNotConfiguredError,
} from "@/lib/report-store";
import { importLatestReportFromGmail } from "@/lib/gmail-report-importer";

export interface ImportResult {
  ok: boolean;
  id?: string;
  date?: string;
  error?: string;
}

export interface GmailImportActionResult extends ImportResult {
  emailSubject?: string;
  emailDate?: string;
}

/**
 * Server action behind the "Import latest report from Gmail" button.
 *
 * Runs the Gmail import server-side and saves via the shared storage layer, so
 * GMAIL_IMPORT_SECRET and Google credentials never reach the browser. The
 * secret-protected /api/import-from-gmail route exists separately for cron/curl.
 *
 * TODO: add real authentication to this admin page before public exposure.
 */
export async function importFromGmailAction(): Promise<GmailImportActionResult> {
  const result = await importLatestReportFromGmail();
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return {
    ok: true,
    id: result.report.id,
    date: result.report.date,
    emailSubject: result.emailSubject,
    emailDate: result.emailDate,
  };
}

/**
 * Save a manually-pasted report using the same storage layer as the push
 * endpoint.
 *
 * TODO: add real authentication before exposing this page publicly. For now
 * the admin import page is unauthenticated and intended for local/private use.
 */
export async function importReportAction(rawJson: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { ok: false, error: "Invalid JSON — could not parse the pasted text." };
  }

  const result = normalizeReport(parsed);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  if (!isStorageConfigured()) {
    return {
      ok: false,
      error:
        "Storage is not configured. Add Supabase env vars (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  try {
    const saved = await saveReport(result.report);
    return { ok: true, id: saved.id, date: saved.date };
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return { ok: false, error: err.message };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save report.",
    };
  }
}
