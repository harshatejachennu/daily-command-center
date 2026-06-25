import { ExternalLink, Newspaper } from "lucide-react";
import type { ReportItem } from "@/types/report";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";

export function NewsCard({ item }: { item: ReportItem }) {
  const text = item.summary ?? item.body;
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-muted dark:bg-white/[0.06]">
          <Newspaper className="size-4" strokeWidth={1.7} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[14.5px] font-semibold leading-snug text-foreground">
            {item.title}
          </h3>
          {text && (
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{text}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
            {item.source && <Badge tone="neutral">{item.source}</Badge>}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Read <ExternalLink className="size-3" strokeWidth={2} />
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
