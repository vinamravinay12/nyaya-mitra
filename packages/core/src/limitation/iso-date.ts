/**
 * Calendar arithmetic for limitation periods.
 *
 * Dates are handled as UTC midnight timestamps rather than `Date` objects so
 * that a user in IST and a server in UTC compute the same deadline. A one-day
 * drift here can be the difference between a live claim and a dead one.
 */

export const MS_PER_DAY = 86_400_000;

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses a strict `YYYY-MM-DD` date, rejecting impossible calendar dates. */
export function parseIsoDate(value: string): number | undefined {
  const match = ISO_DATE_PATTERN.exec(value);
  if (match === null) {
    return undefined;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  // Date.UTC rolls 2026-02-30 forward into March; compare back to reject it.
  const isRealDate =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
  return isRealDate ? timestamp : undefined;
}

export function toIsoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function addDays(timestamp: number, days: number): number {
  return timestamp + days * MS_PER_DAY;
}

/** Whole days from `from` to `to`; negative when `to` is in the past. */
export function differenceInDays(to: number, from: number): number {
  return Math.round((to - from) / MS_PER_DAY);
}
