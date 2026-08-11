// Centralizes all timezone handling for appointment scheduling.
//
// THE BUG: `new Date("2026-08-15T14:00:00")` (no offset) is parsed in
// whatever timezone the *server process* happens to be running in — not
// necessarily the salon's timezone. If the app is deployed to a host in a
// different region, appointments silently save at the wrong time.
//
// THE FIX: always attach an explicit UTC offset when building a Date from
// a "yyyy-mm-dd" + "HH:mm" pair, so parsing is unambiguous regardless of
// server locale. Sri Lanka has one fixed offset year-round (no DST), so a
// hardcoded offset is safe here — no timezone library required.

export const SALON_TIMEZONE = "Asia/Colombo";
const SALON_UTC_OFFSET = "+05:30";

/** Combines a "yyyy-mm-dd" date and "HH:mm" time into an absolute Date,
 *  correctly anchored to the salon's timezone regardless of server locale. */
export function combineDateAndTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${SALON_UTC_OFFSET}`);
}

/** Midnight of the given date, in the salon's timezone. */
export function startOfDayInSalonTz(date: string): Date {
  return new Date(`${date}T00:00:00${SALON_UTC_OFFSET}`);
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
