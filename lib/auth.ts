// Authentication helper for the ingest endpoint.
// Server-only. Never logs or returns the secret value.

import { timingSafeEqual } from "node:crypto";

export type AuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; message: string };

/** Constant-time string comparison that tolerates differing lengths. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still do a comparison to avoid early-exit timing differences.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Validate the Authorization header against REPORT_INGEST_SECRET.
 * Expects: `Authorization: Bearer <REPORT_INGEST_SECRET>`.
 */
export function checkIngestAuth(request: Request): AuthResult {
  const secret = process.env.REPORT_INGEST_SECRET;

  if (!secret || secret === "replace_with_random_secret") {
    // Misconfiguration, not a client error. Do not reveal the secret.
    return {
      ok: false,
      status: 500,
      message:
        "Server is missing REPORT_INGEST_SECRET. Set it in your environment before pushing reports.",
    };
  }

  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  const provided = match?.[1]?.trim();

  if (!provided || !safeEqual(provided, secret)) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  return { ok: true };
}
