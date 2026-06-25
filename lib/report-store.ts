// Storage abstraction for daily reports.
//
// Primary backend: Supabase (table `daily_reports`). This is the only backend
// that is treated as production-ready.
//
// Optional DEV-ONLY fallback: an in-process memory array, enabled ONLY when all
// of the following are true:
//   - NODE_ENV !== "production"
//   - Supabase is not configured
//   - DEV_MEMORY_STORE=1
// It is hard-disabled in production and can never run on Vercel. It exists so
// the full UI can be exercised locally before Supabase is wired up.

import "server-only";

import type { DailyReport } from "@/types/report";
import {
  DAILY_REPORTS_TABLE,
  getSupabaseAdmin,
  getSupabaseEnv,
} from "@/lib/supabase";

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, " +
        "or (local dev only) set DEV_MEMORY_STORE=1.",
    );
    this.name = "StorageNotConfiguredError";
  }
}

// ---------------------------------------------------------------------------
// Dev-only in-memory backend
// ---------------------------------------------------------------------------

interface MemoryRow {
  report: DailyReport;
  createdAt: number;
}

// Persist across hot reloads in dev using a global.
const globalForMemory = globalThis as unknown as {
  __dailyReportsMemory?: MemoryRow[];
};

function memoryEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_MEMORY_STORE === "1" &&
    !supabaseConfigured()
  );
}

function memoryStore(): MemoryRow[] {
  if (!globalForMemory.__dailyReportsMemory) {
    globalForMemory.__dailyReportsMemory = [];
    // eslint-disable-next-line no-console
    console.warn(
      "[report-store] DEV_MEMORY_STORE active — reports are kept in memory and will be lost on restart. " +
        "This never runs in production.",
    );
  }
  return globalForMemory.__dailyReportsMemory;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function supabaseConfigured(): boolean {
  const { hasUrl, hasServiceKey } = getSupabaseEnv();
  return hasUrl && hasServiceKey;
}

/** Whether any usable storage backend is available. */
export function isStorageConfigured(): boolean {
  return supabaseConfigured() || memoryEnabled();
}

/** Save (upsert) a report. Returns the stored report. */
export async function saveReport(report: DailyReport): Promise<DailyReport> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { error } = await supabase.from(DAILY_REPORTS_TABLE).upsert(
      {
        id: report.id,
        date: report.date,
        generated_at: report.generatedAt,
        summary: report.summary ?? null,
        report_json: report,
      },
      { onConflict: "id" },
    );
    if (error) {
      throw new Error(`Supabase save failed: ${error.message}`);
    }
    return report;
  }

  if (memoryEnabled()) {
    const store = memoryStore();
    const existing = store.findIndex((r) => r.report.id === report.id);
    const row: MemoryRow = { report, createdAt: Date.now() };
    if (existing >= 0) store[existing] = row;
    else store.push(row);
    return report;
  }

  throw new StorageNotConfiguredError();
}

/** Get the most recently created report, or null if none exists. */
export async function getLatestReport(): Promise<DailyReport | null> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from(DAILY_REPORTS_TABLE)
      .select("report_json")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    return (data?.report_json as DailyReport | undefined) ?? null;
  }

  if (memoryEnabled()) {
    const store = memoryStore();
    if (store.length === 0) return null;
    return [...store].sort((a, b) => b.createdAt - a.createdAt)[0].report;
  }

  throw new StorageNotConfiguredError();
}

/** Get the most recent reports (default 7), newest first. */
export async function getRecentReports(limit = 7): Promise<DailyReport[]> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from(DAILY_REPORTS_TABLE)
      .select("report_json")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    return (data ?? []).map((row) => row.report_json as DailyReport);
  }

  if (memoryEnabled()) {
    const store = memoryStore();
    return [...store]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .map((r) => r.report);
  }

  throw new StorageNotConfiguredError();
}
