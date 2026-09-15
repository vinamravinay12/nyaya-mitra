import { describe, expect, it } from 'vitest';
import { HIGH_VALUE_INR, MODERATE_VALUE_INR, scoreTriage } from './score-triage.js';
import { rentalDepositWithheld } from '../playbooks/rental-deposit-withheld.js';
import type { LimitationAssessment } from '../types/limitation.js';
import type { LimitationRule } from '../types/legal.js';

const rule: LimitationRule = {
  id: 'clock',
  description: 'Recovering the deposit',
  reference: { act: 'Limitation Act', year: 1963, provision: 'Art.55', note: 'Three years.' },
  fromFact: 'vacateDate',
  durationDays: 1095,
  appliesWhen: null,
};

const comfortable: LimitationAssessment = {
  rule,
  status: 'comfortable',
  deadline: '2029-01-01',
  daysRemaining: 800,
};
const critical: LimitationAssessment = {
  rule,
  status: 'critical',
  deadline: '2026-09-30',
  daysRemaining: 16,
};
const expired: LimitationAssessment = {
  rule,
  status: 'expired',
  deadline: '2025-01-01',
  daysRemaining: -60,
};

const codes = (result: { reasons: readonly { code: string }[] }): string[] =>
  result.reasons.map((reason) => reason.code);

describe('scoreTriage', () => {
  it('leaves a small, unhurried, unflagged case self-serve', () => {
    const result = scoreTriage(rentalDepositWithheld, { amountWithheldInr: 20_000 }, [comfortable]);
    expect(result.band).toBe('self-serve');
    expect(codes(result)).toEqual(['no-escalating-factors']);
    expect(result.lawyerSpecialisation).toBeUndefined();
  });

  it('names no lawyer when none is needed', () => {
    const result = scoreTriage(rentalDepositWithheld, {}, []);
    expect(result.band).toBe('self-serve');
    expect(result.lawyerSpecialisation).toBeUndefined();
  });

  it('moves a moderate amount to guided without recommending a lawyer', () => {
    const result = scoreTriage(
      rentalDepositWithheld,
      { amountWithheldInr: MODERATE_VALUE_INR },
      [],
    );
    expect(result.band).toBe('guided');
    expect(codes(result)).toContain('moderate-value');
    expect(result.lawyerSpecialisation).toBeUndefined();
  });

  it('recommends a lawyer once enough money is at stake', () => {
    const result = scoreTriage(rentalDepositWithheld, { amountWithheldInr: HIGH_VALUE_INR }, []);
    expect(result.band).toBe('lawyer-recommended');
    expect(result.lawyerSpecialisation).toBe(rentalDepositWithheld.lawyerSpecialisation);
  });

  it('formats amounts in the Indian numbering system', () => {
    const result = scoreTriage(rentalDepositWithheld, { amountWithheldInr: 500_000 }, []);
    expect(result.reasons[0]?.message).toContain('5,00,000');
  });

  it('ignores the amount when it was never collected or is not a number', () => {
    expect(scoreTriage(rentalDepositWithheld, {}, []).band).toBe('self-serve');
    expect(scoreTriage(rentalDepositWithheld, { amountWithheldInr: null }, []).band).toBe(
      'self-serve',
    );
  });

  it('ignores the amount for a playbook that declares no money fact', () => {
    const noMoney = { ...rentalDepositWithheld, amountAtStakeFact: null };
    expect(scoreTriage(noMoney, { amountWithheldInr: 900_000 }, []).band).toBe('self-serve');
  });

  it('treats a closing deadline as urgent and quotes the days left', () => {
    const result = scoreTriage(rentalDepositWithheld, {}, [critical]);
    expect(result.band).toBe('urgent');
    expect(result.reasons[0]?.message).toContain('16 days');
    expect(result.reasons[0]?.message).toContain('2026-09-30');
  });

  it('sends an expired claim to a lawyer rather than declaring it dead', () => {
    const result = scoreTriage(rentalDepositWithheld, {}, [expired]);
    expect(result.band).toBe('lawyer-recommended');
    expect(result.reasons[0]?.message).toContain('Limitation Act');
    expect(result.lawyerSpecialisation).toBe(rentalDepositWithheld.lawyerSpecialisation);
  });

  it('ignores clocks that are neither critical nor expired', () => {
    const unknown: LimitationAssessment = { rule, status: 'unknown', reason: 'no date' };
    expect(scoreTriage(rentalDepositWithheld, {}, [comfortable, unknown]).band).toBe('self-serve');
  });

  it('escalates a red flag to urgent and uses its own specialisation', () => {
    const result = scoreTriage(rentalDepositWithheld, { landlordChangedLocks: true }, []);
    expect(result.band).toBe('urgent');
    expect(result.lawyerSpecialisation).toBe('Civil litigation (property)');
    expect(codes(result)).toContain('rental.illegal_dispossession');
  });

  it('keeps the first red flag specialisation when several fire', () => {
    const result = scoreTriage(
      rentalDepositWithheld,
      { landlordChangedLocks: true, courtSummonsReceived: true },
      [],
    );
    expect(result.band).toBe('urgent');
    expect(result.lawyerSpecialisation).toBe('Civil litigation (property)');
    expect(result.reasons).toHaveLength(2);
  });

  it('never de-escalates a serious case because of a milder later signal', () => {
    const result = scoreTriage(
      rentalDepositWithheld,
      { landlordChangedLocks: true, amountWithheldInr: MODERATE_VALUE_INR },
      [comfortable],
    );
    expect(result.band).toBe('urgent');
  });
});
