"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Inbox,
  Send,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-surface-2"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-500" strokeWidth={2.2} />
      ) : (
        <Copy className="size-3.5" strokeWidth={2} />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}

export function NoReportState({
  storageConfigured,
}: {
  storageConfigured: boolean;
}) {
  const [origin, setOrigin] = useState("https://your-app.vercel.app");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const endpoint = `${origin}/api/ingest-report`;
  const curl = `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer $REPORT_INGEST_SECRET" \\
  -H "Content-Type: application/json" \\
  --data-binary @data/sample-report.json`;

  return (
    <div className="space-y-4">
      {!storageConfigured && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle
            className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
            strokeWidth={1.9}
          />
          <div className="text-[13px] leading-relaxed text-foreground">
            <p className="font-semibold">Storage is not configured yet.</p>
            <p className="mt-1 text-muted">
              Add{" "}
              <code className="rounded bg-black/[0.06] px-1 py-0.5 text-[12px] dark:bg-white/[0.1]">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              and{" "}
              <code className="rounded bg-black/[0.06] px-1 py-0.5 text-[12px] dark:bg-white/[0.1]">
                SUPABASE_SERVICE_ROLE_KEY
              </code>{" "}
              (see the README) so pushed reports can be saved.
            </p>
          </div>
        </div>
      )}

      <EmptyState
        icon={<Inbox className="size-5" strokeWidth={1.75} />}
        title="No report received yet"
        description="Your dashboard will fill in automatically once your ChatGPT Scheduled Task pushes today's report — or you can import one manually."
      >
        <div className="space-y-4 text-left">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-foreground">
              <Send className="size-4 text-primary" strokeWidth={1.9} />
              Ingest endpoint
            </div>
            <div className="flex items-center justify-between gap-2">
              <code className="truncate rounded-lg bg-black/[0.05] px-2 py-1.5 text-[12px] text-foreground dark:bg-white/[0.08]">
                {endpoint}
              </code>
              <CopyButton value={endpoint} label="Copy" />
            </div>

            <div className="mt-3 mb-1.5 text-[12px] font-medium text-muted">
              Test it with curl:
            </div>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-black/[0.05] p-3 text-[11.5px] leading-relaxed text-foreground no-scrollbar dark:bg-white/[0.06]">
                <code>{curl}</code>
              </pre>
              <div className="mt-2">
                <CopyButton value={curl} label="Copy curl" />
              </div>
            </div>
          </div>

          <Link
            href="/admin/import"
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-[14px] font-semibold text-primary-fg transition-opacity hover:opacity-90"
          >
            <Upload className="size-4" strokeWidth={2} />
            Import a report manually
          </Link>
        </div>
      </EmptyState>
    </div>
  );
}
