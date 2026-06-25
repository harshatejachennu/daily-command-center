// Core data model for the Daily Command Center.
// The report is pushed (or imported) as JSON; these types describe its shape
// after normalization. Keep this file dependency-free so it can be imported
// from both server and client code.

export type Priority = "urgent" | "high" | "medium" | "low" | "info";

export type OpportunityLabel = "golden" | "strong" | "maybe" | "ignore";

/** Metadata used by Opportunity items. */
export interface OpportunityMeta {
  label?: OpportunityLabel;
  cost?: string;
  location?: string;
  online?: boolean;
  deadline?: string;
  fitReason?: string;
  realisticForMe?: boolean;
}

/** Metadata used by Countdown items. */
export interface CountdownMeta {
  dateTime?: string;
  daysRemaining?: number;
  hoursRemaining?: number;
  whyItMatters?: string;
  nextStep?: string;
}

/** Metadata used by the (compact) Weather item. */
export interface WeatherMeta {
  tempF?: number;
  highF?: number;
  lowF?: number;
  condition?: string;
  location?: string;
  precipChance?: number;
}

/** A union of all known metadata fields plus an open-ended bag for the future. */
export type ItemMetadata = OpportunityMeta &
  CountdownMeta &
  WeatherMeta &
  Record<string, unknown>;

export interface ReportItem {
  id: string;
  title: string;
  body?: string;
  summary?: string;
  priority?: Priority;
  category?: string;
  source?: string;
  deadline?: string;
  url?: string;
  tags?: string[];
  metadata?: ItemMetadata;
}

export interface ReportSection {
  id: string;
  title: string;
  description?: string;
  items: ReportItem[];
}

export interface DailyReport {
  id: string;
  date: string;
  generatedAt: string;
  summary?: string;
  sections: ReportSection[];
}
