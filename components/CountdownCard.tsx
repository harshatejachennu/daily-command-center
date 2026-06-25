import { ArrowRight, CalendarDays } from "lucide-react";
import type { ReportItem } from "@/types/report";
import { Card } from "@/components/Card";
import { countdownParts, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export function CountdownCard({ item }: { item: ReportItem }) {
  const meta = item.metadata ?? {};
  const parts = countdownParts(
    meta.dateTime ?? item.deadline,
    meta.daysRemaining,
    meta.hoursRemaining,
  );
  const why = meta.whyItMatters ?? item.body ?? item.summary;
  const when = meta.dateTime ?? item.deadline;

  const urgent = parts ? !parts.isPast && parts.days <= 3 : false;

  return (
    <Card className={cn(urgent && "ring-1 ring-inset ring-red-500/20")}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug text-foreground">
            {item.title}
          </h3>
          {when && (
            <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted">
              <CalendarDays className="size-3.5" strokeWidth={1.8} />
              {formatDateTime(when)}
            </div>
          )}
        </div>

        {parts && (
          <div
            className={cn(
              "shrink-0 rounded-xl px-3 py-1.5 text-right",
              parts.isPast
                ? "bg-black/[0.04] dark:bg-white/[0.06]"
                : urgent
                  ? "bg-red-500/10"
                  : "bg-primary/10",
            )}
          >
            <div
              className={cn(
                "text-[18px] font-bold leading-none tracking-tight tabular-nums",
                parts.isPast
                  ? "text-muted"
                  : urgent
                    ? "text-red-600 dark:text-red-400"
                    : "text-primary",
              )}
            >
              {parts.label}
            </div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
              {parts.isPast ? "passed" : "remaining"}
            </div>
          </div>
        )}
      </div>

      {why && (
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{why}</p>
      )}

      {meta.nextStep && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface-2 px-3 py-2 text-[13px] text-foreground">
          <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={2} />
          <span>
            <span className="font-medium">Next step: </span>
            {meta.nextStep}
          </span>
        </div>
      )}
    </Card>
  );
}
