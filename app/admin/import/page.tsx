"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileJson,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { normalizeReport } from "@/lib/validate-report";
import { getSectionTitle } from "@/lib/sections";
import { importReportAction, type ImportResult } from "./actions";
import sampleReport from "@/data/sample-report.json";

type ParseState =
  | { status: "empty" }
  | { status: "error"; error: string }
  | {
      status: "ok";
      date: string;
      generatedAt: string;
      summary?: string;
      sections: { id: string; title: string; count: number }[];
    };

export default function ImportPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const parse = useMemo<ParseState>(() => {
    if (!text.trim()) return { status: "empty" };
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return {
        status: "error",
        error: `Invalid JSON: ${e instanceof Error ? e.message : "could not parse"}`,
      };
    }
    const norm = normalizeReport(json);
    if (!norm.ok) return { status: "error", error: norm.error };
    return {
      status: "ok",
      date: norm.report.date,
      generatedAt: norm.report.generatedAt,
      summary: norm.report.summary,
      sections: norm.report.sections.map((s) => ({
        id: s.id,
        title: getSectionTitle(s.id),
        count: s.items.length,
      })),
    };
  }, [text]);

  const canImport = parse.status === "ok" && !isPending;

  function handleImport() {
    setResult(null);
    startTransition(async () => {
      const res = await importReportAction(text);
      setResult(res);
    });
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl pt-safe">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[14px] font-medium text-foreground hover:opacity-80"
          >
            <ArrowLeft className="size-4" strokeWidth={2} />
            Dashboard
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-5 px-4 py-5 pb-16">
        <div>
          <h1 className="flex items-center gap-2 text-[24px] font-bold tracking-tight text-foreground">
            <FileJson className="size-6 text-primary" strokeWidth={1.8} />
            Manual Import
          </h1>
          <p className="mt-1 text-[14px] leading-relaxed text-muted">
            Fallback for when ChatGPT can&apos;t POST automatically. Copy the
            daily report JSON from ChatGPT, paste it below, preview it, and save
            it. It&apos;s stored exactly like a pushed report.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5">
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
            strokeWidth={1.9}
          />
          <p className="text-[13px] leading-relaxed text-foreground">
            <span className="font-semibold">No authentication yet.</span> This
            page is open for now — keep the deployment private and add real auth
            before sharing the URL. (TODO in the code.)
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="report-json"
              className="text-[13px] font-medium text-foreground"
            >
              Report JSON
            </label>
            <div className="flex items-center gap-2 text-[12px]">
              <button
                type="button"
                onClick={() =>
                  setText(JSON.stringify(sampleReport, null, 2))
                }
                className="rounded-lg border border-border bg-surface px-2.5 py-1 font-medium text-foreground hover:bg-surface-2"
              >
                Load sample
              </button>
              {text && (
                <button
                  type="button"
                  onClick={() => {
                    setText("");
                    setResult(null);
                  }}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 font-medium text-muted hover:bg-surface-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <textarea
            id="report-json"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setResult(null);
            }}
            spellCheck={false}
            placeholder='{ "date": "2026-06-24", "generatedAt": "2026-06-24T09:00:00-04:00", "sections": [ ... ] }'
            className="h-64 w-full resize-y rounded-2xl border border-border bg-surface p-3.5 font-mono text-[12.5px] leading-relaxed text-foreground outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20"
          />
        </div>

        {/* Live validation / preview */}
        {parse.status === "error" && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-[13px] text-foreground">
            <XCircle
              className="mt-0.5 size-[18px] shrink-0 text-red-500"
              strokeWidth={2}
            />
            <span>{parse.error}</span>
          </div>
        )}

        {parse.status === "ok" && (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" strokeWidth={2} />
              Valid report — preview
            </div>
            <dl className="space-y-1 text-[13px]">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted">Date</dt>
                <dd className="text-foreground">{parse.date}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted">Generated</dt>
                <dd className="text-foreground">{parse.generatedAt}</dd>
              </div>
              {parse.summary && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted">Summary</dt>
                  <dd className="text-foreground">{parse.summary}</dd>
                </div>
              )}
            </dl>
            <div className="mt-3 border-t border-border pt-3">
              <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted">
                Sections ({parse.sections.length})
              </div>
              <ul className="space-y-1">
                {parse.sections.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between text-[13px]"
                  >
                    <span className="text-foreground">{s.title}</span>
                    <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] font-medium text-muted dark:bg-white/[0.08]">
                      {s.count} {s.count === 1 ? "item" : "items"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleImport}
          disabled={!canImport}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-[15px] font-semibold text-primary-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? (
            <Loader2 className="size-[18px] animate-spin" strokeWidth={2} />
          ) : (
            <Upload className="size-[18px]" strokeWidth={2} />
          )}
          {isPending ? "Saving…" : "Import & Save Report"}
        </button>

        {result && (
          <div
            className={
              result.ok
                ? "flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-[13px] text-foreground"
                : "flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-[13px] text-foreground"
            }
          >
            {result.ok ? (
              <CheckCircle2
                className="mt-0.5 size-[18px] shrink-0 text-emerald-500"
                strokeWidth={2}
              />
            ) : (
              <XCircle
                className="mt-0.5 size-[18px] shrink-0 text-red-500"
                strokeWidth={2}
              />
            )}
            {result.ok ? (
              <span>
                Saved report{" "}
                <span className="font-semibold">{result.id}</span> for{" "}
                <span className="font-semibold">{result.date}</span>.{" "}
                <Link href="/" className="font-semibold text-primary underline">
                  Open dashboard →
                </Link>
              </span>
            ) : (
              <span>{result.error}</span>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
