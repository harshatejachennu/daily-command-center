import type { ReactNode } from "react";
import type { DailyReport, ReportItem } from "@/types/report";
import type { SectionId } from "@/lib/sections";
import { getSectionDef } from "@/lib/sections";
import { getSection, sortCountdowns, sortOpportunities } from "@/lib/report-helpers";
import { SectionHeader } from "@/components/SectionHeader";
import { EmptyState } from "@/components/EmptyState";
import { PriorityCard } from "@/components/PriorityCard";
import { EmailCard } from "@/components/EmailCard";
import { OpportunityCard } from "@/components/OpportunityCard";
import { CountdownCard } from "@/components/CountdownCard";
import { WeatherCard } from "@/components/WeatherCard";
import { NewsCard } from "@/components/NewsCard";
import { UpdateCard } from "@/components/UpdateCard";

function renderItem(sectionId: SectionId, item: ReportItem): ReactNode {
  switch (sectionId) {
    case "top_things":
    case "needs_attention":
      return <PriorityCard key={item.id} item={item} />;
    case "important_emails":
      return <EmailCard key={item.id} item={item} />;
    case "opportunities":
      return <OpportunityCard key={item.id} item={item} />;
    case "automation_updates":
      return <UpdateCard key={item.id} item={item} variant="automation" />;
    case "weather":
      return <WeatherCard key={item.id} item={item} />;
    case "ai_cs_updates":
      return <UpdateCard key={item.id} item={item} variant="ai" />;
    case "important_news":
      return <NewsCard key={item.id} item={item} />;
    case "countdowns":
      return <CountdownCard key={item.id} item={item} />;
    case "filtered_out":
      return (
        <li
          key={item.id}
          className="flex items-start gap-2 px-1 text-[13px] text-muted"
        >
          <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted/60" />
          <span>
            <span className="text-foreground/70">{item.title}</span>
            {(item.body || item.summary) && (
              <span> — {item.body ?? item.summary}</span>
            )}
          </span>
        </li>
      );
    default:
      return <PriorityCard key={item.id} item={item} />;
  }
}

function orderItems(sectionId: SectionId, items: ReportItem[]): ReportItem[] {
  if (sectionId === "opportunities") return sortOpportunities(items);
  if (sectionId === "countdowns") return sortCountdowns(items);
  return items;
}

/**
 * Renders a single report section: a header plus the appropriate card type for
 * each item, or a compact empty state when the section has no items.
 */
export function ReportSectionView({
  report,
  sectionId,
  showHeader = true,
  emptyText,
}: {
  report: DailyReport | null | undefined;
  sectionId: SectionId;
  showHeader?: boolean;
  emptyText?: string;
}) {
  const def = getSectionDef(sectionId);
  const section = getSection(report, sectionId);
  const items = orderItems(sectionId, section?.items ?? []);

  if (sectionId === "filtered_out") {
    // Rendered as a muted list rather than full cards.
    return (
      <section>
        {showHeader && <SectionHeader title={def.title} count={items.length} />}
        {items.length === 0 ? (
          <EmptyState compact title="Nothing was filtered out." />
        ) : (
          <ul className="space-y-1.5">
            {items.map((item) => renderItem(sectionId, item))}
          </ul>
        )}
      </section>
    );
  }

  return (
    <section>
      {showHeader && (
        <SectionHeader
          title={def.title}
          description={section?.description}
          count={items.length}
        />
      )}
      {items.length === 0 ? (
        <EmptyState
          compact
          title={emptyText ?? `No items in ${def.title}.`}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => renderItem(sectionId, item))}
        </div>
      )}
    </section>
  );
}
