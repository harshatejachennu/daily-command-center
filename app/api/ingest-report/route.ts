// POST endpoint that receives reports pushed from ChatGPT Scheduled Tasks.
//
//   POST /api/ingest-report
//   Authorization: Bearer <REPORT_INGEST_SECRET>
//   Content-Type: application/json
//   Body: DailyReport JSON

import { NextResponse } from "next/server";
import { checkIngestAuth } from "@/lib/auth";
import { normalizeReport } from "@/lib/validate-report";
import {
  isStorageConfigured,
  saveReport,
  StorageNotConfiguredError,
} from "@/lib/report-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1) Auth
  const auth = checkIngestAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  // 2) Parse JSON body
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  // 3) Validate + normalize
  const result = normalizeReport(raw);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: `Invalid report shape: ${result.error}` },
      { status: 400 },
    );
  }

  // 4) Storage availability
  if (!isStorageConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Storage is not configured. Add Supabase env vars (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) and redeploy.",
      },
      { status: 503 },
    );
  }

  // 5) Save
  try {
    const saved = await saveReport(result.report);
    return NextResponse.json({ ok: true, id: saved.id, date: saved.date });
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Failed to save report.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// Anything other than POST gets a clear 405.
export function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed. Use POST." },
    { status: 405 },
  );
}
