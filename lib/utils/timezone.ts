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

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

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
