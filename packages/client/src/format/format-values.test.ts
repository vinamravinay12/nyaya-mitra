import { describe, expect, it } from 'vitest';
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
  it('renders a boolean as the word the user chose', () => {
    expect(formatFactValue('boolean', true)).toBe('Yes');
    expect(formatFactValue('boolean', false)).toBe('No');
  });

  it('renders money in rupees but plain numbers as themselves', () => {
    expect(formatFactValue('money', 80_000)).toBe('₹80,000');
    expect(formatFactValue('text', 12)).toBe('12');
  });

  it('passes text and dates through unchanged', () => {
    expect(formatFactValue('text', 'Karnataka')).toBe('Karnataka');
    expect(formatFactValue('date', '2026-07-01')).toBe('2026-07-01');
  });

  it('renders a cleared answer as nothing rather than "null"', () => {
    expect(formatFactValue('text', null)).toBe('');
  });
});
