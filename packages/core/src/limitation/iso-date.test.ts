import { describe, expect, it } from 'vitest';
import { MS_PER_DAY, addDays, differenceInDays, parseIsoDate, toIsoDate } from './iso-date.js';

describe('parseIsoDate', () => {
  it('parses a valid date as UTC midnight', () => {
    expect(parseIsoDate('2026-03-15')).toBe(Date.UTC(2026, 2, 15));
  });

  it('accepts a leap day in a leap year', () => {
    expect(parseIsoDate('2024-02-29')).toBe(Date.UTC(2024, 1, 29));
  });

  it('rejects a leap day in a non-leap year', () => {
    expect(parseIsoDate('2026-02-29')).toBeUndefined();
  });

  it('rejects dates that roll over into the next month', () => {
    expect(parseIsoDate('2026-04-31')).toBeUndefined();
    expect(parseIsoDate('2026-13-01')).toBeUndefined();
    expect(parseIsoDate('2026-00-10')).toBeUndefined();
  });

  it('rejects anything that is not strict YYYY-MM-DD', () => {
    expect(parseIsoDate('15-03-2026')).toBeUndefined();
    expect(parseIsoDate('2026-3-15')).toBeUndefined();
    expect(parseIsoDate('2026-03-15T00:00:00Z')).toBeUndefined();
    expect(parseIsoDate('')).toBeUndefined();
    expect(parseIsoDate('yesterday')).toBeUndefined();
  });
});

describe('date arithmetic', () => {
  it('round-trips through toIsoDate', () => {
    const timestamp = parseIsoDate('2026-09-14');
    expect(timestamp).toBeDefined();
    expect(toIsoDate(timestamp ?? 0)).toBe('2026-09-14');
  });

  it('adds days across a month boundary', () => {
    const start = Date.UTC(2026, 0, 30);
    expect(toIsoDate(addDays(start, 3))).toBe('2026-02-02');
  });

  it('adds days across a leap year boundary', () => {
    expect(toIsoDate(addDays(Date.UTC(2024, 1, 28), 1))).toBe('2024-02-29');
  });

  it('measures whole days in both directions', () => {
    const from = Date.UTC(2026, 0, 1);
    expect(differenceInDays(addDays(from, 45), from)).toBe(45);
    expect(differenceInDays(from, addDays(from, 45))).toBe(-45);
    expect(differenceInDays(from, from)).toBe(0);
  });

  it('exposes a day in milliseconds', () => {
    expect(MS_PER_DAY).toBe(24 * 60 * 60 * 1000);
  });
});
