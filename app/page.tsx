import { Dashboard } from "@/components/Dashboard";
import {
  getLatestReport,
  getRecentReports,
  isStorageConfigured,
} from "@/lib/report-store";
import type { DailyReport } from "@/types/report";

export const dynamic = "force-dynamic";

export default async function Home() {
  const storageConfigured = isStorageConfigured();

  let latest: DailyReport | null = null;
  let recent: DailyReport[] = [];

  if (storageConfigured) {
    try {
      [latest, recent] = await Promise.all([
        getLatestReport(),
        getRecentReports(7),
      ]);
    } catch {
      // Leave empty; the Dashboard renders a clean empty/setup state.
    }
  }

  return (
    <Dashboard
      initialReport={latest}
      initialRecent={recent}
      storageConfigured={storageConfigured}
    />
  );
}
