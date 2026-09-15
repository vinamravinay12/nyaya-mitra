import { describe, expect, it } from 'vitest';
import { todayInIndia } from './today-in-india.js';

describe('todayInIndia', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(todayInIndia(new Date('2026-09-15T06:00:00Z'))).toBe('2026-09-15');
  });

  it('is already tomorrow in India when it is still late evening in UTC', () => {
    // 19:00 UTC is 00:30 IST the next day — the limitation clock has moved on.
    expect(todayInIndia(new Date('2026-09-15T19:00:00Z'))).toBe('2026-09-16');
  });

  it('is still today in India just before the IST rollover', () => {
    expect(todayInIndia(new Date('2026-09-15T18:20:00Z'))).toBe('2026-09-15');
  });

  it('handles a year boundary', () => {
    expect(todayInIndia(new Date('2026-12-31T20:00:00Z'))).toBe('2027-01-01');
  });
});
