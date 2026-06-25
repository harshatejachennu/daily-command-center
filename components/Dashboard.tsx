"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ChevronLeft, RefreshCw, Upload } from "lucide-react";
import type { DailyReport } from "@/types/report";
import type { TabId } from "@/lib/tabs";
import { TABS } from "@/lib/tabs";
import { AppShell } from "@/components/AppShell";
import { ReportSectionView } from "@/components/ReportSectionView";
import { ArchiveList } from "@/components/ArchiveList";
import { NoReportState } from "@/components/NoReportState";
import { EmptyState } from "@/components/EmptyState";
import { SectionHeader } from "@/components/SectionHeader";
import { CountdownCard } from "@/components/CountdownCard";
import { getItems, sortCountdowns } from "@/lib/report-helpers";
import { formatReportDate } from "@/lib/format";
import { cn } from "@/lib/cn";

interface DashboardProps {
  initialReport: DailyReport | null;
  initialRecent: DailyReport[];
  storageConfigured: boolean;
}

export function Dashboard({
  initialReport,
  initialRecent,
  storageConfigured,
}: DashboardProps) {
  const [latest, setLatest] = useState<DailyReport | null>(initialReport);
  const [recent, setRecent] = useState<DailyReport[]>(initialRecent);
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [latestRes, recentRes] = await Promise.all([
        fetch("/api/reports/latest", { cache: "no-store" }),
        fetch("/api/reports", { cache: "no-store" }),
      ]);
      const latestJson = await latestRes.json();
      const recentJson = await recentRes.json();
      setLatest(latestJson.report ?? null);
      setRecent(recentJson.reports ?? []);
      setSelectedId(null);
    } catch {
      /* keep existing data on failure */
    } finally {
      setRefreshing(false);
    }
  }, []);

  const displayed = selectedId
    ? (recent.find((r) => r.id === selectedId) ?? latest)
    : latest;
  const isArchivedView = Boolean(
    displayed && latest && displayed.id !== latest.id,
  );

  const handleTabChange = (tab: TabId) => {
    if (tab !== "archive") setSelectedId(null);
    setActiveTab(tab);
  };

  const handleSelectArchived = (report: DailyReport) => {
    setSelectedId(report.id);
    setActiveTab("today");
  };

  const headerRight = (
    <>
      <Link
        href="/admin/import"
        aria-label="Import a report"
        className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-surface-2 active:scale-95"
      >
        <Upload className="size-[18px]" strokeWidth={1.9} />
      </Link>
      <button
        type="button"
        onClick={refresh}
        disabled={refreshing}
        aria-label="Refresh"
        className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-surface-2 active:scale-95 disabled:opacity-60"
      >
        <RefreshCw
          className={cn("size-[18px]", refreshing && "animate-spin")}
          strokeWidth={1.9}
        />
      </button>
    </>
  );

  const tabTitle = TABS.find((t) => t.id === activeTab)?.title ?? "Today";

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={handleTabChange}
      headerRight={headerRight}
    >
      {!storageConfigured || !latest ? (
        <NoReportState storageConfigured={storageConfigured} />
      ) : (
        <div
          className={cn(
            "transition-opacity",
            refreshing && "pointer-events-none opacity-60",
          )}
        >
          {/* Tab title + report date */}
          <div className="mb-4">
            <h1 className="text-[26px] font-bold tracking-tight text-foreground">
              {tabTitle}
            </h1>
            {displayed && (
              <p className="mt-0.5 text-[13px] text-muted">
                {formatReportDate(displayed.date)}
              </p>
            )}
          </div>

          {isArchivedView && displayed && (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="mb-4 flex w-full items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left text-[13px] text-foreground"
            >
              <ChevronLeft className="size-4 text-amber-600 dark:text-amber-400" strokeWidth={2} />
              <span>
                Viewing archived report from{" "}
                <span className="font-semibold">
                  {formatReportDate(displayed.date)}
                </span>{" "}
                · tap to return to latest
              </span>
            </button>
          )}

          <TabContent
            tab={activeTab}
            report={displayed}
            recent={recent}
            currentId={displayed?.id}
            onSelectArchived={handleSelectArchived}
            onGoToCountdowns={() => setActiveTab("countdowns")}
          />
        </div>
      )}
    </AppShell>
  );
}

function TabContent({
  tab,
  report,
  recent,
  currentId,
  onSelectArchived,
  onGoToCountdowns,
}: {
  tab: TabId;
  report: DailyReport | null;
  recent: DailyReport[];
  currentId?: string;
  onSelectArchived: (report: DailyReport) => void;
  onGoToCountdowns: () => void;
}) {
  switch (tab) {
    case "today":
      return (
        <div className="space-y-7">
          <ReportSectionView report={report} sectionId="top_things" />
          <ReportSectionView report={report} sectionId="needs_attention" />
          <ReportSectionView report={report} sectionId="automation_updates" />
          <ReportSectionView report={report} sectionId="weather" />
          <CountdownPreview report={report} onGoToCountdowns={onGoToCountdowns} />
          <FilteredOutCollapsible report={report} />
        </div>
      );
    case "emails":
      return (
        <ReportSectionView
          report={report}
          sectionId="important_emails"
          showHeader={false}
          emptyText="No important emails in this report."
        />
      );
    case "opportunities":
      return (
        <ReportSectionView
          report={report}
          sectionId="opportunities"
          showHeader={false}
          emptyText="No opportunities in this report."
        />
      );
    case "countdowns":
      return (
        <ReportSectionView
          report={report}
          sectionId="countdowns"
          showHeader={false}
          emptyText="No countdowns in this report."
        />
      );
    case "ai_cs":
      return (
        <ReportSectionView
          report={report}
          sectionId="ai_cs_updates"
          showHeader={false}
          emptyText="No AI / CS updates in this report."
        />
      );
    case "news":
      return (
        <ReportSectionView
          report={report}
          sectionId="important_news"
          showHeader={false}
          emptyText="No news in this report."
        />
      );
    case "archive":
      return recent.length === 0 ? (
        <EmptyState
          title="No archived reports yet"
          description="Previous reports will appear here as they're pushed or imported."
        />
      ) : (
        <ArchiveList
          reports={recent}
          currentId={currentId}
          onSelect={onSelectArchived}
        />
      );
    default:
      return null;
  }
}

function CountdownPreview({
  report,
  onGoToCountdowns,
}: {
  report: DailyReport | null;
  onGoToCountdowns: () => void;
}) {
  const items = sortCountdowns(getItems(report, "countdowns")).slice(0, 2);
  if (items.length === 0) return null;
  return (
    <section>
      <SectionHeader
        title="Upcoming"
        action={
          <button
            type="button"
            onClick={onGoToCountdowns}
            className="text-[13px] font-medium text-primary hover:underline"
          >
            View all
          </button>
        }
      />
      <div className="space-y-3">
        {items.map((item) => (
          <CountdownCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function FilteredOutCollapsible({ report }: { report: DailyReport | null }) {
  const items = getItems(report, "filtered_out");
  if (items.length === 0) return null;
  return (
    <details className="group rounded-2xl border border-border bg-surface/60">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[13.5px] font-medium text-muted">
        <span>Filtered Out / Nothing Important · {items.length}</span>
        <ChevronLeft className="size-4 -rotate-90 transition-transform group-open:rotate-90" strokeWidth={2} />
      </summary>
      <div className="px-4 pb-4">
        <ReportSectionView
          report={report}
          sectionId="filtered_out"
          showHeader={false}
        />
      </div>
    </details>
  );
}
