"use server";

import { normalizeReport } from "@/lib/validate-report";
import {
  isStorageConfigured,
  saveReport,
  StorageNotConfiguredError,
} from "@/lib/report-store";

export interface ImportResult {
  ok: boolean;
  id?: string;
  date?: string;
  error?: string;
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
