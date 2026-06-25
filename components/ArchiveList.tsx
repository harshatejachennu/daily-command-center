"use client";

import { ChevronRight, Clock, FileText } from "lucide-react";
import type { DailyReport } from "@/types/report";
import { formatReportDate, relativeTime } from "@/lib/format";
import { totalItemCount } from "@/lib/report-helpers";
import { cn } from "@/lib/cn";

export function ArchiveList({
  reports,
  currentId,
  onSelect,
}: {
  reports: DailyReport[];
  currentId?: string;
  onSelect: (report: DailyReport) => void;
}) {
  return (
    <div className="space-y-2.5">
      {reports.map((report) => {
        const active = report.id === currentId;
        return (
          <button
            key={report.id}
            type="button"
            onClick={() => onSelect(report)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border bg-surface p-4 text-left shadow-card transition-colors",
              active
                ? "border-[color:var(--primary)] ring-1 ring-inset ring-[color:var(--primary)]/30"
                : "border-border hover:bg-surface-2",
            )}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-[18px]" strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[14px] font-semibold text-foreground">
                  {formatReportDate(report.date)}
                </span>
                {active && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    Viewing
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
                <Clock className="size-3" strokeWidth={1.8} />
                <span>{relativeTime(report.generatedAt)}</span>
                <span>·</span>
                <span>{totalItemCount(report)} items</span>
              </div>
              {report.summary && (
                <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted">
                  {report.summary}
                </p>
              )}
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
