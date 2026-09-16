import type { DecisiveFact, FactValue, TriageBand } from '@nyaya-mitra/core';

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

/**
 * Renders an answer the way the user gave it, for the review list.
 *
 * Only a `money` fact gets a rupee sign. A plain quantity gets its unit, so a
 * twelve-month restriction reads "12 months" rather than "₹12".
 */
export function formatFactValue(fact: DecisiveFact, value: FactValue): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    if (fact.kind === 'money') {
      return formatRupees(value);
    }
    return fact.unit === undefined ? String(value) : `${String(value)} ${fact.unit}`;
  }
  return value ?? '';
}
