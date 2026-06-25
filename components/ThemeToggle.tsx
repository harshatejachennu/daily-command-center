"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "dcc-theme";

export function ThemeToggle() {
  // Start as null until mounted to avoid a hydration mismatch; the no-FOUC
  // script in layout.tsx already applied the correct class before paint.
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // ignore storage errors (private mode, etc.)
    }
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-surface-2 active:scale-95"
    >
      {isDark ? (
        <Sun className="size-[18px]" strokeWidth={1.9} />
      ) : (
        <Moon className="size-[18px]" strokeWidth={1.9} />
      )}
    </button>
  );
}
