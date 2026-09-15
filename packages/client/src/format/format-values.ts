import type { TriageBand } from '@nyaya-mitra/core';

/** Indian grouping: ₹5,00,000 rather than ₹500,000. */
export function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDayRange(minDays: number, maxDays: number): string {
  const asUnit = (days: number): string =>
    days >= 365 ? `${String(Math.round(days / 365))} yr` : `${String(days)} days`;
  return minDays === maxDays ? asUnit(minDays) : `${String(minDays)}–${asUnit(maxDays)}`;
}

const BAND_LABELS: Record<TriageBand, string> = {
  'self-serve': 'You can handle this yourself',
  guided: 'You can do this yourself, with care',
  'lawyer-recommended': 'A lawyer is worth it here',
  urgent: 'Act now',
};

export function describeBand(band: TriageBand): string {
  return BAND_LABELS[band];
}

export function formatDaysRemaining(daysRemaining: number): string {
  if (daysRemaining < 0) {
    return `${String(Math.abs(daysRemaining))} days ago`;
  }
  return daysRemaining === 0 ? 'today' : `${String(daysRemaining)} days left`;
}
