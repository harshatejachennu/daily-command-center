import type {
  DailyReport,
  OpportunityLabel,
  ReportItem,
  ReportSection,
} from "@/types/report";
import { countdownParts } from "@/lib/format";

export function getSection(
  report: DailyReport | null | undefined,
  id: string,
): ReportSection | undefined {
  return report?.sections.find((s) => s.id === id);
}

export function getItems(
  report: DailyReport | null | undefined,
  id: string,
): ReportItem[] {
  return getSection(report, id)?.items ?? [];
}

export function totalItemCount(report: DailyReport | null | undefined): number {
  return (report?.sections ?? []).reduce((sum, s) => sum + s.items.length, 0);
}

const LABEL_ORDER: Record<OpportunityLabel, number> = {
  golden: 0,
  strong: 1,
  maybe: 2,
  ignore: 3,
};

export function sortOpportunities(items: ReportItem[]): ReportItem[] {
  return [...items].sort((a, b) => {
    const la = LABEL_ORDER[(a.metadata?.label as OpportunityLabel) ?? "maybe"] ?? 2;
    const lb = LABEL_ORDER[(b.metadata?.label as OpportunityLabel) ?? "maybe"] ?? 2;
    return la - lb;
  });
}

/** Sort key: upcoming soonest first, then passed (recent first), then unknown. */
function countdownSortKey(item: ReportItem): [number, number] {
  const p = countdownParts(
    item.metadata?.dateTime ?? item.deadline,
    item.metadata?.daysRemaining,
    item.metadata?.hoursRemaining,
  );
  if (!p) return [2, Number.POSITIVE_INFINITY];
  if (p.isPast) return [1, -p.totalMs];
  return [0, p.totalMs];
}

export function sortCountdowns(items: ReportItem[]): ReportItem[] {
  return [...items].sort((a, b) => {
    const [ga, va] = countdownSortKey(a);
    const [gb, vb] = countdownSortKey(b);
    return ga !== gb ? ga - gb : va - vb;
  });
}
