// GET the latest stored report for the dashboard.

import { NextResponse } from "next/server";
import { getLatestReport, isStorageConfigured } from "@/lib/report-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const storageConfigured = isStorageConfigured();

  if (!storageConfigured) {
    return NextResponse.json({ report: null, storageConfigured: false });
  }

  try {
    const report = await getLatestReport();
    return NextResponse.json({ report, storageConfigured: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read report.";
    return NextResponse.json(
      { report: null, storageConfigured: true, error: message },
      { status: 500 },
    );
  }
}
