// Canonical section definitions: the fixed order, display titles, and a set of
// aliases so loosely-labeled incoming sections can be normalized to known ids.

export type SectionId =
  | "top_things"
  | "needs_attention"
  | "important_emails"
  | "opportunities"
  | "automation_updates"
  | "weather"
  | "ai_cs_updates"
  | "important_news"
  | "filtered_out"
  | "countdowns";

export interface SectionDef {
  id: SectionId;
  title: string;
  /** Short description shown under the section header where helpful. */
  description?: string;
  /** Lowercased aliases (ids or titles) that should map to this section. */
  aliases: string[];
}

// IMPORTANT: order here is the canonical render order and enforces the rules:
// weather before AI/CS, weather before news, countdowns last.
export const SECTION_DEFS: SectionDef[] = [
  {
    id: "top_things",
    title: "Top Things I Need To Know Today",
    aliases: ["top", "top things", "top_things", "top_priorities", "headlines"],
  },
  {
    id: "needs_attention",
    title: "Needs Attention Today / Soon",
    aliases: [
      "needs attention",
      "needs_attention",
      "attention",
      "action items",
      "todo",
      "to do",
    ],
  },
  {
    id: "important_emails",
    title: "Important Emails",
    aliases: ["emails", "important emails", "important_emails", "inbox", "email"],
  },
  {
    id: "opportunities",
    title: "Opportunities",
    aliases: ["opportunities", "opps", "opportunity"],
  },
  {
    id: "automation_updates",
    title: "Scheduled Task / Automation Updates",
    aliases: [
      "automation",
      "automation updates",
      "automation_updates",
      "scheduled task",
      "scheduled_task",
      "task updates",
      "system",
    ],
  },
  {
    id: "weather",
    title: "Weather",
    aliases: ["weather", "forecast"],
  },
  {
    id: "ai_cs_updates",
    title: "AI / CS Updates",
    aliases: [
      "ai",
      "cs",
      "ai cs",
      "ai/cs",
      "ai cs updates",
      "ai_cs_updates",
      "ai updates",
      "tech updates",
    ],
  },
  {
    id: "important_news",
    title: "Important News Worth Knowing",
    aliases: ["news", "important news", "important_news", "world news"],
  },
  {
    id: "filtered_out",
    title: "Filtered Out / Nothing Important",
    aliases: [
      "filtered",
      "filtered out",
      "filtered_out",
      "nothing important",
      "ignored",
      "noise",
    ],
  },
  {
    id: "countdowns",
    title: "Countdowns & Upcoming Important Dates",
    aliases: [
      "countdowns",
      "countdown",
      "upcoming",
      "important dates",
      "dates",
      "deadlines",
    ],
  },
];

export const SECTION_ORDER: SectionId[] = SECTION_DEFS.map((s) => s.id);

const DEF_BY_ID = new Map<string, SectionDef>(
  SECTION_DEFS.map((s) => [s.id, s]),
);

const ALIAS_TO_ID = new Map<string, SectionId>();
for (const def of SECTION_DEFS) {
  ALIAS_TO_ID.set(def.id, def.id);
  for (const alias of def.aliases) {
    ALIAS_TO_ID.set(alias, def.id);
  }
}

/** Resolve a loose id/title to a canonical SectionId, or null if unknown. */
export function resolveSectionId(raw: string | undefined | null): SectionId | null {
  if (!raw) return null;
  const key = raw.toString().trim().toLowerCase();
  if (ALIAS_TO_ID.has(key)) return ALIAS_TO_ID.get(key)!;
  // Try a normalized form (spaces/slashes/dashes -> underscores).
  const normalized = key.replace(/[\s/-]+/g, "_");
  return ALIAS_TO_ID.get(normalized) ?? null;
}

export function getSectionDef(id: SectionId): SectionDef {
  return DEF_BY_ID.get(id)!;
}

export function getSectionTitle(id: string): string {
  const def = DEF_BY_ID.get(id);
  return def ? def.title : id;
}

/** Index used to sort sections into canonical order (unknown ids go last). */
export function sectionOrderIndex(id: string): number {
  const i = SECTION_ORDER.indexOf(id as SectionId);
  return i === -1 ? SECTION_ORDER.length : i;
}
