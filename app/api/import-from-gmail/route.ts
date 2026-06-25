// POST endpoint that imports the latest report email from Gmail.
//
//   POST /api/import-from-gmail
//   Authorization: Bearer <GMAIL_IMPORT_SECRET>
//
// Used by the cron route and for manual/curl testing. The admin UI button uses a
// server action instead (so the secret never reaches the browser).

import { NextResponse } from "next/server";
import { checkGmailImportAuth } from "@/lib/auth";
import {
  importLatestReportFromGmail,
  type GmailImportErrorCode,
} from "@/lib/gmail-report-importer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function statusForCode(code: GmailImportErrorCode): number {
  switch (code) {
    case "gmail_not_configured":
    case "storage_not_configured":
      return 503;
    case "auth_failed":
    case "gmail_api_error":
      return 502;
    case "no_email":
      return 404;
    case "no_markers":
    case "invalid_json":
    case "invalid_shape":
      return 422;
    case "storage_failed":
    default:
      return 500;
  }
}

export async function POST(request: Request) {
  const auth = checkGmailImportAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.message }, { status: auth.status });
  }

  const result = await importLatestReportFromGmail();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: result.code, error: result.error },
      { status: statusForCode(result.code) },
    );
  }

  return NextResponse.json({
    ok: true,
    id: result.report.id,
    date: result.report.date,
    emailSubject: result.emailSubject,
    emailDate: result.emailDate,
  });
}

export function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed. Use POST." },
    { status: 405 },
  );
}
