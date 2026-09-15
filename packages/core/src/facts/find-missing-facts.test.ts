import { describe, expect, it } from 'vitest';
import {
  findMissingFacts,
  findOptionalGaps,
  isReadyToAssess,
  nextQuestion,
} from './find-missing-facts.js';
import { rentalDepositWithheld } from '../playbooks/rental-deposit-withheld.js';
import type { CaseFacts } from '../types/facts.js';

const allRequired: CaseFacts = {
  state: 'Karnataka',
  vacateDate: '2026-07-01',
  depositAmountInr: 80_000,
  amountWithheldInr: 80_000,
  writtenAgreement: true,
  itemisedDamagesGiven: false,
  writtenDemandSent: false,
};

describe('findMissingFacts', () => {
  it('lists every required fact when nothing has been collected', () => {
    const missing = findMissingFacts(rentalDepositWithheld, {});
    expect(missing.every((fact) => fact.required)).toBe(true);
    expect(missing.map((fact) => fact.id)).toEqual(Object.keys(allRequired));
  });

  it('preserves the order the playbook asks in', () => {
    const missing = findMissingFacts(rentalDepositWithheld, { state: 'Kerala' });
    expect(missing[0]?.id).toBe('vacateDate');
  });

  it('treats a cleared answer as still missing', () => {
    const missing = findMissingFacts(rentalDepositWithheld, { ...allRequired, vacateDate: null });
    expect(missing.map((fact) => fact.id)).toEqual(['vacateDate']);
  });

  it('counts false and zero as real answers', () => {
    const missing = findMissingFacts(rentalDepositWithheld, {
      ...allRequired,
      writtenAgreement: false,
      amountWithheldInr: 0,
    });
    expect(missing).toEqual([]);
  });

  it('never blocks on optional facts', () => {
    expect(findMissingFacts(rentalDepositWithheld, allRequired)).toEqual([]);
  });
});

describe('findOptionalGaps', () => {
  it('reports the refining questions separately', () => {
    const optional = findOptionalGaps(rentalDepositWithheld, allRequired);
    expect(optional.map((fact) => fact.id)).toEqual([
      'landlordChangedLocks',
      'courtSummonsReceived',
    ]);
  });

  it('empties as they are answered', () => {
    const optional = findOptionalGaps(rentalDepositWithheld, {
      ...allRequired,
      landlordChangedLocks: false,
      courtSummonsReceived: false,
    });
    expect(optional).toEqual([]);
  });
});

describe('nextQuestion and isReadyToAssess', () => {
  it('offers one question at a time', () => {
    expect(nextQuestion(rentalDepositWithheld, {})?.id).toBe('state');
    expect(nextQuestion(rentalDepositWithheld, { state: 'Karnataka' })?.id).toBe('vacateDate');
  });

  it('stops asking once every required fact is in', () => {
    expect(nextQuestion(rentalDepositWithheld, allRequired)).toBeUndefined();
    expect(isReadyToAssess(rentalDepositWithheld, allRequired)).toBe(true);
  });

  it('is not ready while anything required is outstanding', () => {
    expect(isReadyToAssess(rentalDepositWithheld, {})).toBe(false);
  });
});
