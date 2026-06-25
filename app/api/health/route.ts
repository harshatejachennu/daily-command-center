// GET a deployment/environment health check.
// Reports only booleans about presence of secrets — never their values.

import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase";
import { isStorageConfigured } from "@/lib/report-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const { hasUrl, hasServiceKey } = getSupabaseEnv();
  const secret = process.env.REPORT_INGEST_SECRET;
  const hasIngestSecret = Boolean(
    secret && secret !== "replace_with_random_secret",
  );

  return NextResponse.json({
    ok: true,
    time: new Date().toISOString(),
    hasIngestSecret,
    hasSupabaseUrl: hasUrl,
    hasSupabaseServiceKey: hasServiceKey,
    storageConfigured: isStorageConfigured(),
  });
}
