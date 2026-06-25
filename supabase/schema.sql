-- Daily Command Center — Supabase schema
-- Run this in the Supabase dashboard:  Project → SQL Editor → New query → Run.

create table if not exists public.daily_reports (
  id text primary key,
  date text not null,
  generated_at text not null,
  summary text,
  report_json jsonb not null,
  created_at timestamptz not null default now()
);

-- Fast "latest first" lookups for the dashboard and archive.
create index if not exists daily_reports_created_at_idx
  on public.daily_reports (created_at desc);

-- The app talks to Supabase ONLY with the service role key from server code,
-- which bypasses Row Level Security. We still enable RLS and add no public
-- policies, so the anon/public key cannot read or write this table.
alter table public.daily_reports enable row level security;
