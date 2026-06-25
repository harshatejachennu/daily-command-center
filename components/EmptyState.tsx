import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  icon,
  children,
  className,
  compact = false,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface/50 text-center",
        compact ? "px-4 py-8" : "px-6 py-14",
        className,
      )}
    >
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-black/[0.04] text-muted dark:bg-white/[0.06]">
        {icon ?? <Inbox className="size-5" strokeWidth={1.75} />}
      </div>
      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      {children && <div className="mt-4 w-full max-w-md">{children}</div>}
    </div>
  );
}
