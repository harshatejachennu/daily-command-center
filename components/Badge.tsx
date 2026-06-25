import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { OpportunityLabel, Priority } from "@/types/report";

export type BadgeTone =
  | "neutral"
  | "urgent"
  | "high"
  | "medium"
  | "low"
  | "info"
  | "golden"
  | "strong"
  | "maybe"
  | "ignore"
  | "primary";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral:
    "bg-black/[0.05] text-muted dark:bg-white/[0.08] dark:text-muted",
  urgent:
    "bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-inset ring-red-500/20",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-inset ring-orange-500/20",
  medium:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20",
  low: "bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-1 ring-inset ring-slate-500/20",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20",
  golden:
    "bg-[var(--gold-bg)] text-[var(--gold)] ring-1 ring-inset ring-amber-400/40 font-semibold",
  strong:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
  maybe:
    "bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-1 ring-inset ring-slate-500/20",
  ignore:
    "bg-black/[0.04] text-muted dark:bg-white/[0.06] line-through decoration-1",
  primary: "bg-primary/10 text-primary ring-1 ring-inset ring-[color:var(--primary)]/20",
};

export function Badge({
  children,
  tone = "neutral",
  icon,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={priority}>{PRIORITY_LABEL[priority]}</Badge>;
}

const LABEL_TEXT: Record<OpportunityLabel, string> = {
  golden: "Golden Opportunity",
  strong: "Strong Opportunity",
  maybe: "Maybe",
  ignore: "Ignore / Filtered",
};

export function OpportunityBadge({ label }: { label: OpportunityLabel }) {
  return <Badge tone={label}>{LABEL_TEXT[label]}</Badge>;
}
