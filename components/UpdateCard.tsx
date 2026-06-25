import { Cpu, ExternalLink, RefreshCw } from "lucide-react";
import type { ReportItem } from "@/types/report";
import { Card } from "@/components/Card";
import { Badge, PriorityBadge } from "@/components/Badge";

/** Used for "Automation Updates" and "AI / CS Updates". */
export function UpdateCard({
  item,
  variant = "ai",
}: {
  item: ReportItem;
  variant?: "ai" | "automation";
}) {
  const text = item.summary ?? item.body;
  const Icon = variant === "automation" ? RefreshCw : Cpu;
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" strokeWidth={1.7} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[14.5px] font-semibold leading-snug text-foreground">
              {item.title}
            </h3>
            {item.priority && <PriorityBadge priority={item.priority} />}
          </div>
          {text && (
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{text}</p>
          )}
          {(item.source || item.url || item.tags?.length) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
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
        </div>
      </div>
    </Card>
  );
}
