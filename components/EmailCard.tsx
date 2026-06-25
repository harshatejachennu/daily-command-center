import { CalendarClock, ExternalLink, Mail } from "lucide-react";
import type { ReportItem } from "@/types/report";
import { Card } from "@/components/Card";
import { Badge, type BadgeTone, PriorityBadge } from "@/components/Badge";
import { formatDeadline } from "@/lib/format";

/** Map a free-form email category to a friendly label + badge tone. */
function categoryMeta(category?: string): { label: string; tone: BadgeTone } | null {
  if (!category) return null;
  const c = category.toLowerCase();
  if (c.includes("school") || c.includes("college"))
    return { label: "School / College", tone: "info" };
  if (c.includes("intern") || c.includes("professor") || c.includes("research"))
    return { label: "Internship / Professor", tone: "strong" };
  if (
    c.includes("volunteer") ||
    c.includes("diksuchi") ||
    c.includes("atmiya")
  )
    return { label: "Volunteer / Diksuchi / Atmiya", tone: "primary" };
  if (c.includes("application") || c.includes("opportunit"))
    return { label: "Applications / Opportunities", tone: "medium" };
  return { label: category, tone: "neutral" };
}

export function EmailCard({ item }: { item: ReportItem }) {
  const cat = categoryMeta(item.category);
  const text = item.summary ?? item.body;
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {item.source && (
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
              <Mail className="size-3.5" strokeWidth={1.8} />
              <span className="truncate">{item.source}</span>
            </div>
          )}
          <h3 className="mt-0.5 text-[15px] font-semibold leading-snug text-foreground">
            {item.title}
          </h3>
        </div>
        {item.priority && <PriorityBadge priority={item.priority} />}
      </div>

      {text && (
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{text}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted">
        {cat && <Badge tone={cat.tone}>{cat.label}</Badge>}
        {item.deadline && (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3.5" strokeWidth={1.8} />
            {formatDeadline(item.deadline)}
          </span>
        )}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Open <ExternalLink className="size-3" strokeWidth={2} />
          </a>
        )}
      </div>
    </Card>
  );
}
