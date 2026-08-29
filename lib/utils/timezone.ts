export const SALON_TIMEZONE = process.env.SALON_TIMEZONE || "Asia/Colombo";
const SALON_UTC_OFFSET = process.env.SALON_UTC_OFFSET || "+05:30";

/** Combines a "yyyy-mm-dd" date and "HH:mm" time into an absolute Date,
 *  correctly anchored to the salon's timezone regardless of server locale. */
export function combineDateAndTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${SALON_UTC_OFFSET}`);
}

/** Midnight of the given date, in the salon's timezone. */
export function startOfDayInSalonTz(date: string): Date {
  return new Date(`${date}T00:00:00${SALON_UTC_OFFSET}`);
}

/**
 * End of the given date, in the salon's timezone.
 * Returns 23:59:59.999 Sri Lanka time as an absolute Date.
 */
export function endOfDayInSalonTz(date: string): Date {
  return new Date(`${date}T23:59:59.999${SALON_UTC_OFFSET}`);
}

/** Today's date as "yyyy-mm-dd", read in the salon's timezone — NOT the
 *  server's local timezone. Safe to call from both client and server. */
export function todayInSalonTz(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SALON_TIMEZONE }).format(
    new Date(),
  );
}

/** Current time as "HH:mm" (24-hour), in the salon's timezone. */
export function nowTimeInSalonTz(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SALON_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function getTodayRangeInSalonTz() {
  const today = todayInSalonTz();

  const start = startOfDayInSalonTz(today);
  const end = endOfDayInSalonTz(today);

  return { start, end };
}

/** Formats a stored UTC instant back to "yyyy-mm-dd" for a date input,
 *  in the salon's timezone (not the browser's or server's local timezone). */
export function toDateInputInSalonTz(d: string | Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SALON_TIMEZONE }).format(
    new Date(d),
  );
}

/** Formats a stored UTC instant back to "HH:mm" (24-hour) for a time input,
 *  in the salon's timezone. */
export function toTimeInputInSalonTz(d: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SALON_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(d));
}

/** Formats a stored UTC instant as "DD Mon YYYY" in the salon's timezone —
 *  use this anywhere a date is DISPLAYED (tables, lists, etc). Never
 *  format a raw Date without an explicit timeZone, or it silently uses
 *  whatever zone the server/runtime happens to default to. */
export function formatDateInSalonTz(d: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: SALON_TIMEZONE,
  }).format(new Date(d));
}

/** Formats a stored UTC instant as "HH:mm" (24-hour) in the salon's
 *  timezone — use this anywhere a time is DISPLAYED. */
export function formatTimeInSalonTz(d: Date | string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SALON_TIMEZONE,
  }).format(new Date(d));
}

/** Formats a stored UTC instant back to "yyyy-mm" in the salon's timezone —
 *  used for monthly bucketing in reports/charts. Uses formatToParts rather
 *  than trusting a locale's default punctuation, so the output shape is
 *  guaranteed regardless of ICU/locale quirks. */
export function toMonthInSalonTz(d: Date | string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SALON_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(d));
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  return `${year}-${month}`;
}

export type DashboardRangeType = "today" | "week" | "month" | "year" | "custom";

/** Shifts a "yyyy-mm-dd" string by N calendar days. Pure date-arithmetic,
 *  done in a fixed UTC anchor — safe because we only care about the
 *  calendar date, never the actual instant. */
function shiftDateString(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing the given "yyyy-mm-dd" date. */
function getWeekStartDateString(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sun ... 6 = Sat
  const diffFromMonday = day === 0 ? 6 : day - 1;
  return shiftDateString(dateStr, -diffFromMonday);
}

/** First day of the month containing the given "yyyy-mm-dd" date. */
function getMonthStartDateString(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}

/** First day of the year containing the given "yyyy-mm-dd" date. */
function getYearStartDateString(dateStr: string): string {
  return `${dateStr.slice(0, 4)}-01-01`;
}

export function getDashboardDateRange(
  rangeType: DashboardRangeType,
  customFrom?: string,
  customTo?: string,
): { start: Date; end: Date; from: string; to: string } {
  const today = todayInSalonTz();

  if (rangeType === "custom") {
    if (!customFrom || !customTo) {
      throw new Error("Custom range requires both 'from' and 'to' dates");
    }
    return {
      start: startOfDayInSalonTz(customFrom),
      end: endOfDayInSalonTz(customTo),
      from: customFrom,
      to: customTo,
    };
  }

  let from: string;
  const to: string = today;

  switch (rangeType) {
    case "today":
      from = today;
      break;
    case "week":
      from = getWeekStartDateString(today);
      break;
    case "year":
      from = getYearStartDateString(today);
      break;
    case "month":
    default:
      from = getMonthStartDateString(today);
      break;
  }

  return {
    start: startOfDayInSalonTz(from),
    end: endOfDayInSalonTz(to),
    from,
    to,
  };
}
