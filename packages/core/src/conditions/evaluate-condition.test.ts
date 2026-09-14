import { describe, expect, it } from 'vitest';
import { evaluateCondition } from './evaluate-condition.js';
import type { CaseFacts } from '../types/facts.js';

const facts: CaseFacts = {
  itemisedDamagesGiven: false,
  writtenAgreement: true,
  depositAmountInr: 80_000,
  state: 'Karnataka',
  vacateDate: null,
};

describe('evaluateCondition', () => {
  it('resolves isTrue and isFalse against booleans only', () => {
    expect(evaluateCondition({ op: 'isTrue', fact: 'writtenAgreement' }, facts)).toBe(true);
    expect(evaluateCondition({ op: 'isTrue', fact: 'itemisedDamagesGiven' }, facts)).toBe(false);
    expect(evaluateCondition({ op: 'isFalse', fact: 'itemisedDamagesGiven' }, facts)).toBe(true);
    expect(evaluateCondition({ op: 'isFalse', fact: 'depositAmountInr' }, facts)).toBe(false);
  });

  it('treats an explicit null as unknown, not as a value', () => {
    expect(evaluateCondition({ op: 'isKnown', fact: 'vacateDate' }, facts)).toBe(false);
    expect(evaluateCondition({ op: 'isUnknown', fact: 'vacateDate' }, facts)).toBe(true);
  });

  it('treats a never-collected fact as unknown', () => {
    expect(evaluateCondition({ op: 'isKnown', fact: 'noticeServed' }, facts)).toBe(false);
    expect(evaluateCondition({ op: 'isUnknown', fact: 'noticeServed' }, facts)).toBe(true);
  });

  it('compares numbers and ignores non-numeric facts', () => {
    expect(evaluateCondition({ op: 'gt', fact: 'depositAmountInr', value: 50_000 }, facts)).toBe(
      true,
    );
    expect(evaluateCondition({ op: 'gt', fact: 'depositAmountInr', value: 80_000 }, facts)).toBe(
      false,
    );
    expect(evaluateCondition({ op: 'lt', fact: 'depositAmountInr', value: 100_000 }, facts)).toBe(
      true,
    );
    expect(evaluateCondition({ op: 'lt', fact: 'state', value: 100 }, facts)).toBe(false);
    expect(evaluateCondition({ op: 'gt', fact: 'state', value: 0 }, facts)).toBe(false);
  });

  it('matches equals across value types', () => {
    expect(evaluateCondition({ op: 'equals', fact: 'state', value: 'Karnataka' }, facts)).toBe(
      true,
    );
    expect(evaluateCondition({ op: 'equals', fact: 'state', value: 'Kerala' }, facts)).toBe(false);
    expect(
      evaluateCondition({ op: 'equals', fact: 'depositAmountInr', value: 80_000 }, facts),
    ).toBe(true);
    expect(evaluateCondition({ op: 'equals', fact: 'writtenAgreement', value: true }, facts)).toBe(
      true,
    );
  });

  it('combines nested conditions', () => {
    const strongCase = {
      op: 'allOf',
      conditions: [
        { op: 'isTrue', fact: 'writtenAgreement' },
        { op: 'isFalse', fact: 'itemisedDamagesGiven' },
        {
          op: 'anyOf',
          conditions: [
            { op: 'gt', fact: 'depositAmountInr', value: 500_000 },
            { op: 'equals', fact: 'state', value: 'Karnataka' },
          ],
        },
      ],
    } as const;

    expect(evaluateCondition(strongCase, facts)).toBe(true);
    expect(evaluateCondition({ op: 'not', condition: strongCase }, facts)).toBe(false);
  });

  it('returns false for an anyOf with no satisfied branch', () => {
    expect(
      evaluateCondition(
        { op: 'anyOf', conditions: [{ op: 'isTrue', fact: 'itemisedDamagesGiven' }] },
        facts,
      ),
    ).toBe(false);
  });

  it('treats an empty allOf as vacuously true and an empty anyOf as false', () => {
    expect(evaluateCondition({ op: 'allOf', conditions: [] }, facts)).toBe(true);
    expect(evaluateCondition({ op: 'anyOf', conditions: [] }, facts)).toBe(false);
  });
});
