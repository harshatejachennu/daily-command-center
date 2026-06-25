import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionHeader({
  title,
  description,
  count,
  action,
  className,
}: {
  title: string;
  description?: string;
  count?: number;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground">
          <span className="truncate">{title}</span>
          {typeof count === "number" && (
            <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[11px] font-medium text-muted dark:bg-white/[0.08]">
              {count}
            </span>
          )}
        </h2>
        {description && (
          <p className="mt-0.5 text-[13px] leading-snug text-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
