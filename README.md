# Daily Command Center

A polished, private, mobile-first PWA that **receives** a daily report (JSON) pushed from a
ChatGPT Scheduled Task, stores it in Supabase, and displays it on an iPhone-friendly dashboard.
It does **not** generate the report itself and does **not** use Vercel Cron — it only ingests and
displays. A manual paste-import page is the fallback for when ChatGPT can't POST automatically.

---

## 1) What this is / what was built

- **Next.js 15 (App Router) + TypeScript + Tailwind CSS v4**, Vercel-ready, with PWA support.
- **Secure ingestion endpoint** (`POST /api/ingest-report`) protected by a bearer secret.
- **Supabase persistence** behind a clean storage abstraction (`lib/report-store.ts`).
- **7 tabs**: Today, Emails, Opportunities, Countdowns, AI/CS, News, Archive.
- **Polished, Apple/Swiss-inspired UI**: rounded cards, hairline borders, soft shadows, light/dark
  mode, bottom navigation, priority badges, and a standout **Golden Opportunity** treatment.
- **No fake data**: if no report has been pushed/imported (or storage isn't configured), you get a
  clean empty state with the endpoint URL, a curl example, and a link to manual import.
- **Manual import** at `/admin/import` (paste JSON → validate → preview → save).

### Project structure
```
app/
  layout.tsx            Root layout, metadata, PWA + no-FOUC theme script
  page.tsx              Server component: loads latest + recent, renders <Dashboard>
  manifest.ts           Web app manifest (PWA)
  globals.css           Tailwind v4 + design tokens (light/dark)
  icon.png              Favicon (auto-used by Next)
  admin/import/page.tsx Manual JSON import (client)
  admin/import/actions.ts  Server action that saves via the storage layer
  api/ingest-report/route.ts   POST: receive pushed reports (secret-protected)
  api/reports/latest/route.ts  GET latest report
  api/reports/route.ts         GET recent reports (≤7)
  api/health/route.ts          GET environment health (booleans only)
components/             AppShell, BottomNav, cards, badges, ReportSectionView, etc.
lib/                    supabase, report-store, validate-report, auth, sections, format, tabs
types/report.ts         DailyReport / ReportSection / ReportItem + metadata types
data/sample-report.json Sample report (testing/import only — never auto-displayed)
supabase/schema.sql     Table + index + RLS
scripts/gen-icons.mjs   Zero-dependency PNG icon generator
```

---

## 2) Run locally

```bash
npm install
cp .env.example .env.local       # then edit values (see §5)
npm run gen:icons                # already generated, but safe to re-run
npm run dev                      # http://localhost:3000
```

Without Supabase configured you'll see the polished empty/setup state — that's expected.

**Try the full UI locally before Supabase** (optional, dev-only): set `DEV_MEMORY_STORE=1` in
`.env.local`, restart `npm run dev`, then import `data/sample-report.json` at `/admin/import`.
This in-memory store is **hard-disabled in production** and never runs on Vercel.

---

## 3) Set up Supabase

1. Create a free project at https://supabase.com.
2. Open **Project → SQL Editor → New query**, paste `supabase/schema.sql`, and **Run** (see §4).
3. Open **Project → Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose it)

---

## 4) SQL table to create

```sql
create table if not exists public.daily_reports (
  id text primary key,
  date text not null,
  generated_at text not null,
  summary text,
  report_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists daily_reports_created_at_idx
  on public.daily_reports (created_at desc);

alter table public.daily_reports enable row level security;
```

RLS is enabled with **no public policies**, so the anon key can't touch the table. The app reaches
it only from server code using the service role key (which bypasses RLS).

---

## 5) Environment variables (local — `.env.local`)

```
REPORT_INGEST_SECRET=<run: openssl rand -hex 32>
NEXT_PUBLIC_APP_NAME=Daily Command Center
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
# DEV_MEMORY_STORE=1   # optional, local-only convenience
```

Rules: the service role key and `REPORT_INGEST_SECRET` are **server-only** — they are never sent to
the browser. Only `NEXT_PUBLIC_*` values are exposed to the client. Never commit `.env.local`.

---

## 6) Environment variables (Vercel)

In **Vercel → Project → Settings → Environment Variables**, add the same four (Production +
Preview), **omitting** `DEV_MEMORY_STORE`:

| Name | Value | Notes |
|------|-------|-------|
| `REPORT_INGEST_SECRET` | random 32-byte hex | server-only |
| `NEXT_PUBLIC_APP_NAME` | `Daily Command Center` | public |
| `NEXT_PUBLIC_SUPABASE_URL` | your project URL | public |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | server-only |

Redeploy after adding/changing env vars.

---

## 7) Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel, **Add New → Project**, import the repo (Next.js is auto-detected).
3. Add the env vars from §6.
4. Deploy. Your app will be at `https://YOUR-APP.vercel.app`.
5. Verify with `GET https://YOUR-APP.vercel.app/api/health` (see §9).

(No GitHub required is also fine — `vercel` CLI works too.)

---

## 8) How the ChatGPT push endpoint works

```
POST https://YOUR-APP.vercel.app/api/ingest-report
Authorization: Bearer <REPORT_INGEST_SECRET>
Content-Type: application/json

<DailyReport JSON>
```

- The route checks the `Authorization` header (constant-time compare). Missing/wrong → **401**.
- The body is parsed (bad JSON → **400**) and validated: it must have `date`, `generatedAt`, and a
  `sections` array (bad shape → **400** with the reason).
- Section ids are normalized to canonical ids and reordered into the fixed order; missing item ids
  are filled in.
- The report is saved via `lib/report-store.ts`. Success → `{ ok: true, id, date }`.
- The secret is never logged or returned.

### Report shape (summary)
`DailyReport { id, date, generatedAt, summary?, sections: ReportSection[] }`,
`ReportSection { id, title, description?, items: ReportItem[] }`,
`ReportItem { id, title, body?/summary?, priority?, category?, source?, deadline?, url?, tags?, metadata? }`.

Canonical section ids in order:
`top_things, needs_attention, important_emails, opportunities, automation_updates, weather,
ai_cs_updates, important_news, filtered_out, countdowns`.

See `data/sample-report.json` for a complete, realistic example (including Opportunity metadata
`{ label: golden|strong|maybe|ignore, cost, location, online, deadline, fitReason, realisticForMe }`
and Countdown metadata `{ dateTime, daysRemaining, hoursRemaining, whyItMatters, nextStep }`).

---

## 9) Test with curl

```bash
# Health check (booleans only, never reveals secrets)
curl https://YOUR-APP.vercel.app/api/health

# Successful POST (with Authorization header)
curl -X POST https://YOUR-APP.vercel.app/api/ingest-report \
  -H "Authorization: Bearer $REPORT_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  --data-binary @data/sample-report.json

# Failed POST (no Authorization header) → 401
curl -i -X POST https://YOUR-APP.vercel.app/api/ingest-report \
  -H "Content-Type: application/json" \
  --data-binary @data/sample-report.json

# Get the latest report
curl https://YOUR-APP.vercel.app/api/reports/latest

# Get recent reports (archive)
curl https://YOUR-APP.vercel.app/api/reports
```

Locally, replace the host with `http://localhost:3000` and export the secret first:
`export REPORT_INGEST_SECRET=...`.

---

## 10) Use `/admin/import` (manual fallback)

If ChatGPT can't POST automatically:

1. Ask ChatGPT to print the report as JSON in your Scheduled Task chat.
2. Copy it.
3. Open `https://YOUR-APP.vercel.app/admin/import`.
4. Paste into the textarea (or click **Load sample** to try it).
5. The page validates live and shows a **preview** (date, sections, item counts).
6. Click **Import & Save Report** → it's stored exactly like a pushed report.

> ⚠️ This page has **no authentication yet** (there's a `TODO` in the code). Keep the deployment
> private and add real auth before sharing the URL publicly.

---

## 11) Add to your iPhone home screen

1. Open `https://YOUR-APP.vercel.app` in **Safari** (must be Safari for install).
2. Tap the **Share** button → **Add to Home Screen** → **Add**.
3. Launch it from the home screen — it opens full-screen (standalone), like an app.

The manifest, theme color, and `apple-touch-icon` are already configured. Replace the placeholder
icons in `public/` (and `app/icon.png`) with real artwork anytime — keep the same filenames.

---

## 12) Update your ChatGPT Scheduled Task after deploy

In your 9 AM Scheduled Task, instruct it to finish by POSTing the report. Use a prompt like:

> After generating my daily report, also output it as a single JSON object matching the
> DailyReport schema (fields: `date`, `generatedAt`, `sections[]`, each section with `id`, `title`,
> `items[]`). Then POST it to `https://YOUR-APP.vercel.app/api/ingest-report` with header
> `Authorization: Bearer <REPORT_INGEST_SECRET>` and `Content-Type: application/json`.

If ChatGPT Scheduled Tasks can't make outbound POST requests in your setup, fall back to **§10**:
have it print the JSON and paste it into `/admin/import`. (You can always confirm the secret is set
via `/api/health`.)

---

## 13) What to build next

- **Auth on `/admin/import`** (and optionally the whole app) before any public exposure.
- **Push notifications** when a new report lands.
- **Per-item read/done state** and pinning.
- **Search/filter** across archived reports; retention/cleanup policy.
- **Let the app generate the report** (or move to Vercel Cron) once the push flow is proven.
- **Real icons / app polish**, plus a small set of unit tests around `normalizeReport`.

---

### Scripts
```bash
npm run dev         # start dev server
npm run build       # production build
npm run start       # run the production build
npm run lint        # eslint
npm run gen:icons   # regenerate placeholder icons
```

### Security notes
- `REPORT_INGEST_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are server-only and never exposed.
- The ingest route returns 401 on missing/invalid auth and never logs the secret.
- Supabase RLS is on with no public policies; only server code (service role) reads/writes.
- The app shows **no private data** until a real report is pushed or imported.
