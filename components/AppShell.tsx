"use client";

import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { TabId } from "@/lib/tabs";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Daily Command Center";

/** App frame: sticky header + scrollable content + fixed bottom nav. */
export function AppShell({
  activeTab,
  onTabChange,
  headerRight,
  children,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl pt-safe">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-primary-fg">
              C
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              {APP_NAME}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {headerRight}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pt-4 pb-28">{children}</main>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
}
