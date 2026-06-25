import {
  CalendarClock,
  CircleDollarSign,
  ExternalLink,
  Globe,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";
import type { OpportunityLabel, ReportItem } from "@/types/report";
import { Badge, OpportunityBadge } from "@/components/Badge";
import { cn } from "@/lib/cn";
import { formatDeadline } from "@/lib/format";

function MetaRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-muted">{icon}</span>
      {children}
    </span>
  );
}

export function OpportunityCard({ item }: { item: ReportItem }) {
  const meta = item.metadata ?? {};
  const label = (meta.label ?? "maybe") as OpportunityLabel;
  const isGolden = label === "golden";

  const type = item.category;
  const reason = meta.fitReason ?? item.summary ?? item.body;
  const deadline = meta.deadline ?? item.deadline;
  const cost = meta.cost;
  const location = meta.location;
  const online = meta.online === true;

  const inner = (
    <div
      className={cn(
        "rounded-[15px] bg-surface p-4",
        isGolden && "bg-gradient-to-br from-[var(--gold-bg)] to-transparent",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <OpportunityBadge label={label} />
            {isGolden && (
              <Star
                className="size-4 fill-[var(--gold)] text-[var(--gold)]"
                strokeWidth={1.5}
              />
            )}
            {meta.realisticForMe && (
              <Badge tone="neutral" icon={<Sparkles className="size-3" />}>
                Realistic for me
              </Badge>
            )}
          </div>
          <h3 className="text-[15.5px] font-semibold leading-snug text-foreground">
            {item.title}
          </h3>
          {type && (
            <p className="mt-0.5 text-[12.5px] font-medium uppercase tracking-wide text-muted">
              {type}
            </p>
          )}
        </div>
        {item.priority && (
          <Badge tone={item.priority} className="shrink-0">
            {item.priority}
          </Badge>
        )}
      </div>

      {reason && (
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{reason}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[12.5px] text-foreground/80">
        {deadline && (
          <MetaRow icon={<CalendarClock className="size-3.5" strokeWidth={1.8} />}>
            {formatDeadline(deadline)}
          </MetaRow>
        )}
        {cost && (
          <MetaRow icon={<CircleDollarSign className="size-3.5" strokeWidth={1.8} />}>
            {cost}
          </MetaRow>
        )}
        {(location || online) && (
          <MetaRow
            icon={
              online ? (
                <Globe className="size-3.5" strokeWidth={1.8} />
              ) : (
                <MapPin className="size-3.5" strokeWidth={1.8} />
              )
            }
          >
            {location ?? (online ? "Online" : "")}
            {location && online ? " · Online" : ""}
          </MetaRow>
        )}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Details <ExternalLink className="size-3" strokeWidth={2} />
          </a>
        )}
      </div>
    </div>
  );

  if (isGolden) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-amber-300/70 via-amber-200/40 to-amber-400/70 p-[1.5px] shadow-[0_4px_24px_rgba(245,197,66,0.25)]">
        {inner}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border shadow-card">{inner}</div>
  );
}
