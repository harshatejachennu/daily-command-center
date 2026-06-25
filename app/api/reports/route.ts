// GET recent stored reports for the Archive tab (newest first, up to 7).

import { NextResponse } from "next/server";
import { getRecentReports, isStorageConfigured } from "@/lib/report-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const storageConfigured = isStorageConfigured();

  if (!storageConfigured) {
    return NextResponse.json({ reports: [], storageConfigured: false });
  }

  try {
    const reports = await getRecentReports(7);
    return NextResponse.json({ reports, storageConfigured: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read reports.";
    return NextResponse.json(
      { reports: [], storageConfigured: true, error: message },
      { status: 500 },
    );
  }
}
