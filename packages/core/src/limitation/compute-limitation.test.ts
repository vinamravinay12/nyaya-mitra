import { describe, expect, it } from 'vitest';
import {
  APPROACHING_DAYS,
  CRITICAL_DAYS,
  assessLimitation,
  assessLimitations,
  classifyDaysRemaining,
  limitationApplies,
} from './compute-limitation.js';
import type { LimitationRule } from '../types/legal.js';

const contractClaim: LimitationRule = {
  id: 'rental.deposit.contract_claim',
  description: 'Recovering the deposit as a breach of the rental agreement',
  reference: {
    act: 'Limitation Act',
    year: 1963,
    provision: 'Art.55',
    note: 'Three years from the date the deposit became refundable.',
  },
  fromFact: 'vacateDate',
  durationDays: 1095,
  appliesWhen: null,
};

const dispossessionClaim: LimitationRule = {
  ...contractClaim,
  id: 'rental.deposit.dispossession_claim',
  description: 'Suing to recover possession after an illegal lockout',
  durationDays: 182,
};

describe('classifyDaysRemaining', () => {
  it('treats a passed deadline as expired', () => {
    expect(classifyDaysRemaining(-1)).toBe('expired');
    expect(classifyDaysRemaining(-500)).toBe('expired');
  });

  it('treats the deadline day itself as still live', () => {
    expect(classifyDaysRemaining(0)).toBe('critical');
  });

  it('bands the remaining time at the documented boundaries', () => {
    expect(classifyDaysRemaining(CRITICAL_DAYS)).toBe('critical');
    expect(classifyDaysRemaining(CRITICAL_DAYS + 1)).toBe('approaching');
    expect(classifyDaysRemaining(APPROACHING_DAYS)).toBe('approaching');
    expect(classifyDaysRemaining(APPROACHING_DAYS + 1)).toBe('comfortable');
  });
});

describe('assessLimitation', () => {
  it('computes the deadline and days left from the start fact', () => {
    const result = assessLimitation(contractClaim, { vacateDate: '2026-01-01' }, '2026-09-14');
    expect(result.status).toBe('comfortable');
    if (result.status === 'unknown') {
      throw new Error('expected a computed assessment');
    }
    expect(result.deadline).toBe('2028-12-31');
    expect(result.daysRemaining).toBe(839);
  });

  it('reports an expired claim with a negative day count', () => {
    const result = assessLimitation(dispossessionClaim, { vacateDate: '2025-01-01' }, '2026-09-14');
    expect(result.status).toBe('expired');
    if (result.status === 'unknown') {
      throw new Error('expected a computed assessment');
    }
    expect(result.daysRemaining).toBeLessThan(0);
  });

  it('flags a claim inside the critical window', () => {
    // 182-day clock from 2026-04-01 expires 2026-09-30, i.e. 16 days out.
    const result = assessLimitation(dispossessionClaim, { vacateDate: '2026-04-01' }, '2026-09-14');
    expect(result.status).toBe('critical');
  });

  it('cannot run without the start fact', () => {
    const result = assessLimitation(contractClaim, {}, '2026-09-14');
    expect(result.status).toBe('unknown');
    if (result.status !== 'unknown') {
      throw new Error('expected an unknown assessment');
    }
    expect(result.reason).toContain('vacateDate');
  });

  it('cannot run when the start fact is not a string', () => {
    expect(assessLimitation(contractClaim, { vacateDate: null }, '2026-09-14').status).toBe(
      'unknown',
    );
    expect(assessLimitation(contractClaim, { vacateDate: 20_260_101 }, '2026-09-14').status).toBe(
      'unknown',
    );
  });

  it('cannot run on an unparseable start date or an unparseable today', () => {
    const badStart = assessLimitation(contractClaim, { vacateDate: 'last April' }, '2026-09-14');
    expect(badStart.status).toBe('unknown');
    if (badStart.status !== 'unknown') {
      throw new Error('expected an unknown assessment');
    }
    expect(badStart.reason).toContain('last April');
    expect(assessLimitation(contractClaim, { vacateDate: '2026-01-01' }, 'today').status).toBe(
      'unknown',
    );
  });
});

describe('assessLimitations', () => {
  it('orders the soonest deadline first and pushes unknowns last', () => {
    const withoutDate: LimitationRule = { ...contractClaim, id: 'no-date', fromFact: 'missing' };
    const results = assessLimitations(
      [contractClaim, withoutDate, dispossessionClaim],
      { vacateDate: '2026-04-01' },
      '2026-09-14',
    );
    expect(results.map((result) => result.rule.id)).toEqual([
      'rental.deposit.dispossession_claim',
      'rental.deposit.contract_claim',
      'no-date',
    ]);
  });

  it('returns nothing for a playbook with no clocks', () => {
    expect(assessLimitations([], {}, '2026-09-14')).toEqual([]);
  });

  it('leaves out clocks whose precondition does not hold', () => {
    const conditional: LimitationRule = {
      ...dispossessionClaim,
      id: 'only-on-lockout',
      appliesWhen: { op: 'isTrue', fact: 'landlordChangedLocks' },
    };
    const withoutLockout = assessLimitations(
      [contractClaim, conditional],
      { vacateDate: '2026-04-01' },
      '2026-09-14',
    );
    expect(withoutLockout.map((result) => result.rule.id)).toEqual([
      'rental.deposit.contract_claim',
    ]);

    const withLockout = assessLimitations(
      [contractClaim, conditional],
      { vacateDate: '2026-04-01', landlordChangedLocks: true },
      '2026-09-14',
    );
    expect(withLockout.map((result) => result.rule.id)).toContain('only-on-lockout');
  });
});

describe('limitationApplies', () => {
  it('always applies a clock with no precondition', () => {
    expect(limitationApplies(contractClaim, {})).toBe(true);
  });

  it('applies a conditional clock only when the condition holds', () => {
    const conditional: LimitationRule = {
      ...contractClaim,
      appliesWhen: { op: 'isTrue', fact: 'landlordChangedLocks' },
    };
    expect(limitationApplies(conditional, {})).toBe(false);
    expect(limitationApplies(conditional, { landlordChangedLocks: true })).toBe(true);
  });
});
