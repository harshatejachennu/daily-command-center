"use client";

import { TABS, type TabId } from "@/lib/tabs";
import { cn } from "@/lib/cn";

export function BottomNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/85 backdrop-blur-xl pb-safe">
      <div className="mx-auto flex w-full max-w-2xl items-stretch px-1">
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 px-0.5 pt-2 pb-1.5 transition-colors",
                active ? "text-primary" : "text-muted hover:text-foreground",
              )}
            >
              <Icon
                className="size-[22px]"
                strokeWidth={active ? 2.2 : 1.8}
                aria-hidden
              />
              <span
                className={cn(
                  "text-[10px] leading-none tracking-tight",
                  active ? "font-semibold" : "font-medium",
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
