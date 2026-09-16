import { describe, expect, it } from 'vitest';
import type { DecisiveFact } from '@nyaya-mitra/core';
import {
  describeBand,
  formatDayRange,
  formatDaysRemaining,
  formatFactValue,
  formatRupees,
} from './format-values.js';

describe('formatRupees', () => {
  it('uses Indian digit grouping', () => {
    expect(formatRupees(500_000)).toBe('₹5,00,000');
    expect(formatRupees(80_000)).toBe('₹80,000');
    expect(formatRupees(0)).toBe('₹0');
  });
});

describe('formatDayRange', () => {
  it('collapses an identical range', () => {
    expect(formatDayRange(15, 15)).toBe('15 days');
  });

  it('shows a range in days', () => {
    expect(formatDayRange(7, 21)).toBe('7–21 days');
  });

  it('switches to years once the upper bound is long', () => {
    expect(formatDayRange(180, 730)).toBe('180–2 yr');
    expect(formatDayRange(365, 365)).toBe('1 yr');
  });
});

describe('formatDaysRemaining', () => {
  it('reads naturally in each direction', () => {
    expect(formatDaysRemaining(16)).toBe('16 days left');
    expect(formatDaysRemaining(0)).toBe('today');
    expect(formatDaysRemaining(-60)).toBe('60 days ago');
  });
});

describe('describeBand', () => {
  it('describes every band in plain language', () => {
    expect(describeBand('self-serve')).toBe('You can handle this yourself');
    expect(describeBand('guided')).toContain('with care');
    expect(describeBand('lawyer-recommended')).toContain('lawyer');
    expect(describeBand('urgent')).toBe('Act now');
  });
});

describe('formatFactValue', () => {
  const fact = (over: Partial<DecisiveFact>): DecisiveFact => ({
    id: 'f',
    kind: 'text',
    question: 'q',
    why: 'w',
    required: true,
    ...over,
  });

  it('renders a boolean as the word the user chose', () => {
    expect(formatFactValue(fact({ kind: 'boolean' }), true)).toBe('Yes');
    expect(formatFactValue(fact({ kind: 'boolean' }), false)).toBe('No');
  });

  it('renders money in rupees', () => {
    expect(formatFactValue(fact({ kind: 'money' }), 80_000)).toBe('₹80,000');
  });

  it('renders a quantity with its unit, not a rupee sign', () => {
    // The bug this replaced showed a twelve-month restriction as "₹12".
    expect(formatFactValue(fact({ kind: 'number', unit: 'months' }), 12)).toBe('12 months');
    expect(formatFactValue(fact({ kind: 'number', unit: 'days' }), 90)).toBe('90 days');
  });

  it('renders a quantity with no unit as a bare number', () => {
    expect(formatFactValue(fact({ kind: 'number' }), 12)).toBe('12');
  });

  it('passes text and dates through unchanged', () => {
    expect(formatFactValue(fact({}), 'Karnataka')).toBe('Karnataka');
    expect(formatFactValue(fact({ kind: 'date' }), '2026-07-01')).toBe('2026-07-01');
  });

  it('renders a cleared answer as nothing rather than "null"', () => {
    expect(formatFactValue(fact({}), null)).toBe('');
  });
});
