import {
  Archive,
  Cpu,
  Home,
  Mail,
  Newspaper,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react";

export type TabId =
  | "today"
  | "emails"
  | "opportunities"
  | "countdowns"
  | "ai_cs"
  | "news"
  | "archive";

export interface TabDef {
  id: TabId;
  /** Short label used in the bottom nav. */
  label: string;
  /** Full title shown at the top of the tab. */
  title: string;
  icon: LucideIcon;
}

export const TABS: TabDef[] = [
  { id: "today", label: "Today", title: "Today", icon: Home },
  { id: "emails", label: "Emails", title: "Important Emails", icon: Mail },
  { id: "opportunities", label: "Opps", title: "Opportunities", icon: Sparkles },
  { id: "countdowns", label: "Dates", title: "Countdowns", icon: Timer },
  { id: "ai_cs", label: "AI/CS", title: "AI / CS Updates", icon: Cpu },
  { id: "news", label: "News", title: "Important News", icon: Newspaper },
  { id: "archive", label: "Archive", title: "Archive", icon: Archive },
];
