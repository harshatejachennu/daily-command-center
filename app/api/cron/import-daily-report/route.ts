// Cron route: pull the latest report email from Gmail and save it.
//
// This is the path that makes the whole pipeline hands-off:
//   9:00 AM  ChatGPT Scheduled Task emails the report to Gmail
//   9:10 AM  this cron route runs, imports the email, saves to Supabase
//   dashboard shows the new report automatically
//
// It is NOT active until you add a schedule to vercel.json, e.g.:
//   {
//     "crons": [
//       { "path": "/api/cron/import-daily-report", "schedule": "10 13 * * *" }
//     ]
//   }
// (Vercel cron schedules are in UTC — "10 13 * * *" is ~9:10 AM US Eastern in
// summer / EDT. Adjust for your timezone.)
//
// Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>` when the
// CRON_SECRET env var is set, so this route is protected by CRON_SECRET (or, for
// manual triggering, GMAIL_IMPORT_SECRET).

import { NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/auth";
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
    default:
      return 500;
  }
}

export async function GET(request: Request) {
  const auth = checkCronAuth(request);
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
  });
}
