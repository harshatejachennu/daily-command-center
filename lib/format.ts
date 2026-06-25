// Small date/countdown formatting helpers. Safe to use on client and server.

import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

/** Parse a date-ish string into a Date, or null if it can't be parsed. */
export function toDate(value?: string | null): Date | null {
  if (!value) return null;
  // Try ISO first, then the native parser as a fallback.
  const iso = parseISO(value);
  if (isValid(iso)) return iso;
  const native = new Date(value);
  return isValid(native) ? native : null;
}

/** e.g. "Tuesday, June 24, 2026" */
export function formatReportDate(value?: string | null): string {
  const d = toDate(value);
  if (!d) return value ?? "";
  return format(d, "EEEE, MMMM d, yyyy");
}

/** e.g. "Jun 24, 9:00 AM" */
export function formatDateTime(value?: string | null): string {
  const d = toDate(value);
  if (!d) return value ?? "";
  return format(d, "MMM d, h:mm a");
}

/** e.g. "Due Jun 30" or the raw string if unparseable. */
export function formatDeadline(value?: string | null): string {
  const d = toDate(value);
  if (!d) return value ?? "";
  return format(d, "MMM d, yyyy");
}

export interface CountdownParts {
  totalMs: number;
  days: number;
  hours: number;
  isPast: boolean;
  /** Short label, e.g. "3d 4h", "5h", "Today", or "Passed". */
  label: string;
}

/**
 * Compute days/hours remaining relative to now. Prefers a concrete dateTime;
 * falls back to provided days/hours when no parseable date is available.
 */
export function countdownParts(
  dateTime?: string | null,
  fallbackDays?: number,
  fallbackHours?: number,
): CountdownParts | null {
  const target = toDate(dateTime);

  if (!target) {
    if (fallbackDays == null && fallbackHours == null) return null;
    const days = fallbackDays ?? 0;
    const hours = fallbackHours ?? 0;
    return {
      totalMs: (days * 24 + hours) * 3600_000,
      days,
      hours,
      isPast: days <= 0 && hours <= 0,
      label: buildLabel(days, hours, days <= 0 && hours <= 0),
    };
  }

  const totalMs = target.getTime() - Date.now();
  const isPast = totalMs <= 0;
  const abs = Math.abs(totalMs);
  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor((abs % 86_400_000) / 3_600_000);

  return { totalMs, days, hours, isPast, label: buildLabel(days, hours, isPast) };
}

function buildLabel(days: number, hours: number, isPast: boolean): string {
  if (isPast) return "Passed";
  if (days === 0 && hours === 0) return "Now";
  if (days === 0) return `${hours}h`;
  if (hours === 0) return `${days}d`;
  return `${days}d ${hours}h`;
}

/** e.g. "in 3 days" / "2 hours ago" */
export function relativeTime(value?: string | null): string {
  const d = toDate(value);
  if (!d) return "";
  return formatDistanceToNowStrict(d, { addSuffix: true });
}
