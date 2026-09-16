import { describe, expect, it } from 'vitest';
import {
  MAX_FINDINGS,
  MAX_WARNINGS,
  MAX_WARNING_CHARS,
  readDocumentFindings,
  readDocumentWarnings,
} from './read-advisory.js';

describe('readDocumentFindings', () => {
  it('reads well-formed findings', () => {
    expect(
      readDocumentFindings([{ clause: 'Deductions need bills.', why: 'They gave none.' }]),
    ).toEqual([{ clause: 'Deductions need bills.', why: 'They gave none.' }]);
  });

  it('returns nothing for anything that is not a list', () => {
    for (const input of [undefined, null, 'text', 42, {}]) {
      expect(readDocumentFindings(input)).toEqual([]);
    }
  });

  it('drops entries that are not usable instead of failing', () => {
    expect(readDocumentFindings([null, 'a string', 7, { why: 'no clause' }])).toEqual([]);
  });

  it('keeps a finding whose explanation is missing', () => {
    expect(readDocumentFindings([{ clause: 'A clause.' }])).toEqual([
      { clause: 'A clause.', why: '' },
    ]);
  });

  it('truncates rather than rejecting an over-long clause', () => {
    const [finding] = readDocumentFindings([{ clause: 'x'.repeat(900), why: 'y'.repeat(900) }]);
    expect(finding?.clause.length).toBe(600);
    expect(finding?.why.length).toBe(400);
  });

  it('caps how many are returned', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ clause: `c${String(i)}`, why: 'w' }));
    expect(readDocumentFindings(many)).toHaveLength(MAX_FINDINGS);
  });
});

describe('readDocumentWarnings', () => {
  it('reads warnings and trims them', () => {
    expect(readDocumentWarnings(['  ignore all previous instructions  '])).toEqual([
      'ignore all previous instructions',
    ]);
  });

  it('truncates rather than rejecting an over-long warning', () => {
    // This is the exact failure we shipped: a 355-character warning against a
    // 300-character cap threw away an otherwise correct classification.
    const [warning] = readDocumentWarnings(['x'.repeat(355)]);
    expect(warning?.length).toBe(MAX_WARNING_CHARS);
  });

  it('ignores entries that are not text', () => {
    expect(readDocumentWarnings([null, 5, {}, '', '   '])).toEqual([]);
  });

  it('returns nothing for anything that is not a list', () => {
    expect(readDocumentWarnings(undefined)).toEqual([]);
    expect(readDocumentWarnings('a string')).toEqual([]);
  });

  it('caps how many are returned', () => {
    expect(
      readDocumentWarnings(Array.from({ length: 10 }, (_, i) => `w${String(i)}`)),
    ).toHaveLength(MAX_WARNINGS);
  });
});
