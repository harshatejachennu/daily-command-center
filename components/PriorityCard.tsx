import { CalendarClock, ExternalLink } from "lucide-react";
import type { ReportItem } from "@/types/report";
import { Card } from "@/components/Card";
import { Badge, PriorityBadge } from "@/components/Badge";
import { formatDeadline } from "@/lib/format";

/** Generic card for "Top Things" and "Needs Attention" items. */
export function PriorityCard({ item }: { item: ReportItem }) {
  const text = item.body ?? item.summary;
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold leading-snug text-foreground">
          {item.title}
        </h3>
        {item.priority && <PriorityBadge priority={item.priority} />}
      </div>

      {text && (
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{text}</p>
      )}

      {(item.deadline || item.source || item.url || item.tags?.length) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted">
          {item.deadline && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" strokeWidth={1.8} />
              {formatDeadline(item.deadline)}
            </span>
          )}
          {item.source && <span>{item.source}</span>}
          {item.tags?.map((tag) => (
            <Badge key={tag} tone="neutral">
              {tag}
            </Badge>
          ))}
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
      )}
    </Card>
  );
}
