import { Cloud, Droplets, MapPin } from "lucide-react";
import type { ReportItem } from "@/types/report";
import { Card } from "@/components/Card";

/** Compact weather card. Reads WeatherMeta fields, falls back to body text. */
export function WeatherCard({ item }: { item: ReportItem }) {
  const meta = item.metadata ?? {};
  const temp = meta.tempF;
  const high = meta.highF;
  const low = meta.lowF;
  const condition = meta.condition ?? item.title;
  const location = meta.location;
  const precip = meta.precipChance;
  const fallback = item.body ?? item.summary;

  return (
    <Card className="flex items-center gap-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Cloud className="size-6" strokeWidth={1.6} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          {typeof temp === "number" && (
            <span className="text-[26px] font-bold leading-none tracking-tight text-foreground tabular-nums">
              {Math.round(temp)}°
            </span>
          )}
          {condition && (
            <span className="truncate text-[14px] font-medium text-foreground">
              {condition}
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-muted">
          {(typeof high === "number" || typeof low === "number") && (
            <span className="tabular-nums">
              {typeof high === "number" ? `H ${Math.round(high)}°` : ""}
              {typeof high === "number" && typeof low === "number" ? "  " : ""}
              {typeof low === "number" ? `L ${Math.round(low)}°` : ""}
            </span>
          )}
          {typeof precip === "number" && (
            <span className="inline-flex items-center gap-1">
              <Droplets className="size-3.5" strokeWidth={1.8} />
              {precip}%
            </span>
          )}
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" strokeWidth={1.8} />
              {location}
            </span>
          )}
        </div>

        {!temp && !condition && fallback && (
          <p className="mt-1 text-[13px] text-muted">{fallback}</p>
        )}
      </div>
    </Card>
  );
}
