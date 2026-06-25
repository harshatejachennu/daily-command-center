import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Base rounded card surface used across the app. */
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}
