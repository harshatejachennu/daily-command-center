// Validation + normalization for incoming reports (push or manual import).
// Accepts loosely-shaped JSON, validates the required fields, fills in missing
// ids, normalizes section ids to canonical values, and reorders sections.

import type {
  DailyReport,
  ItemMetadata,
  Priority,
  ReportItem,
  ReportSection,
} from "@/types/report";
import {
  getSectionTitle,
  resolveSectionId,
  sectionOrderIndex,
} from "@/lib/sections";

export type NormalizeResult =
  | { ok: true; report: DailyReport }
  | { ok: false; error: string };

const VALID_PRIORITIES: Priority[] = [
  "urgent",
  "high",
  "medium",
  "low",
  "info",
];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "item"
  );
}

function normalizePriority(v: unknown): Priority | undefined {
  const s = asString(v)?.toLowerCase();
  if (s && (VALID_PRIORITIES as string[]).includes(s)) return s as Priority;
  return undefined;
}

function normalizeItem(raw: unknown, index: number, sectionId: string): ReportItem {
  const obj = isObject(raw) ? raw : {};

  const title =
    asString(obj.title) ??
    asString(obj.name) ??
    asString(obj.subject) ??
    asString(obj.event) ??
    "Untitled";

  const id =
    asString(obj.id) ?? `${sectionId}-${index + 1}-${slugify(title)}`;

  // Accept either `body` or `summary`/`description`/`details` for the main text.
  const body =
    asString(obj.body) ??
    asString(obj.description) ??
    asString(obj.details) ??
    undefined;
  const summary = asString(obj.summary) ?? undefined;

  const tags = Array.isArray(obj.tags)
    ? obj.tags.map((t) => asString(t)).filter((t): t is string => Boolean(t))
    : undefined;

  const metadata: ItemMetadata | undefined = isObject(obj.metadata)
    ? (obj.metadata as ItemMetadata)
    : undefined;

  const item: ReportItem = {
    id,
    title,
    body,
    summary,
    priority: normalizePriority(obj.priority),
    category: asString(obj.category),
    source: asString(obj.source) ?? asString(obj.from),
    deadline: asString(obj.deadline) ?? asString(obj.due),
    url: asString(obj.url) ?? asString(obj.link),
    tags,
    metadata,
  };

  // Drop undefined keys for a cleaner stored object.
  return JSON.parse(JSON.stringify(item)) as ReportItem;
}

function normalizeSection(raw: unknown, index: number): ReportSection | null {
  if (!isObject(raw)) return null;

  const rawId = asString(raw.id) ?? asString(raw.key) ?? asString(raw.title);
  const canonical = resolveSectionId(rawId);
  const id = canonical ?? (rawId ? slugify(rawId) : `section-${index + 1}`);

  const title =
    asString(raw.title) ?? (canonical ? getSectionTitle(canonical) : id);

  const rawItems = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.entries)
      ? raw.entries
      : [];

  const items = rawItems.map((it, i) => normalizeItem(it, i, id));

  return {
    id,
    title,
    description: asString(raw.description),
    items,
  };
}

/**
 * Validate + normalize an arbitrary parsed JSON value into a DailyReport.
 * Required: `date`, `generatedAt`, and `sections` (an array).
 */
export function normalizeReport(raw: unknown): NormalizeResult {
  if (!isObject(raw)) {
    return { ok: false, error: "Report must be a JSON object." };
  }

  const date = asString(raw.date);
  if (!date) {
    return { ok: false, error: "Missing required field: date" };
  }

  const generatedAt =
    asString(raw.generatedAt) ?? asString(raw.generated_at);
  if (!generatedAt) {
    return { ok: false, error: "Missing required field: generatedAt" };
  }

  if (!Array.isArray(raw.sections)) {
    return { ok: false, error: "Missing required field: sections (must be an array)" };
  }

  const sections = raw.sections
    .map((s, i) => normalizeSection(s, i))
    .filter((s): s is ReportSection => s !== null);

  // Stable sort into canonical order; unknown sections keep relative order at end.
  sections.sort((a, b) => sectionOrderIndex(a.id) - sectionOrderIndex(b.id));

  const fallbackId =
    `${date}-${generatedAt}`.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80) ||
    `${date}-${Date.now()}`;
  const id = asString(raw.id) ?? fallbackId;

  const report: DailyReport = {
    id,
    date,
    generatedAt,
    summary: asString(raw.summary),
    sections,
  };

  return { ok: true, report };
}
