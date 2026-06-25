// Server-only Supabase admin client.
//
// Reads env at call time (NOT at module load) so the app builds fine without
// credentials. Uses the SERVICE ROLE key, which must never reach the client —
// this module must only be imported from server code (API routes, server
// actions, server components).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const hasUrl = Boolean(url && url !== "replace_with_supabase_project_url");
  const hasServiceKey = Boolean(
    serviceKey && serviceKey !== "replace_with_supabase_service_role_key",
  );

  return { url, serviceKey, hasUrl, hasServiceKey };
}

/** Returns a Supabase admin client, or null if env vars are not configured. */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (cached) return cached;

  const { url, serviceKey, hasUrl, hasServiceKey } = getSupabaseEnv();
  if (!hasUrl || !hasServiceKey || !url || !serviceKey) {
    return null;
  }

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export const DAILY_REPORTS_TABLE = "daily_reports";
