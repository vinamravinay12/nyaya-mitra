import { describe, expect, it } from 'vitest';
import { assessCase } from './assess-case.js';
import { rentalDepositWithheld } from '../playbooks/rental-deposit-withheld.js';
import type { CaseFacts } from '../types/facts.js';

const TODAY = '2026-09-14';

const completeCase: CaseFacts = {
  state: 'Karnataka',
  vacateDate: '2026-07-01',
  depositAmountInr: 80_000,
  amountWithheldInr: 80_000,
  writtenAgreement: true,
  itemisedDamagesGiven: false,
  writtenDemandSent: false,
  stateAdoptedModelTenancyAct: false,
};

describe('assessCase', () => {
  it('reports a case as not ready while required facts are outstanding', () => {
    const assessment = assessCase(rentalDepositWithheld, {}, TODAY);
    expect(assessment.ready).toBe(false);
    expect(assessment.missingFacts.length).toBeGreaterThan(0);
  });

  it('still answers on an incomplete case rather than refusing', () => {
    const assessment = assessCase(rentalDepositWithheld, {}, TODAY);
    expect(assessment.routes.length).toBeGreaterThan(0);
    expect(assessment.triage.band).toBe('self-serve');
  });

  it('raises a red flag before the questionnaire is finished', () => {
    const assessment = assessCase(rentalDepositWithheld, { landlordChangedLocks: true }, TODAY);
    expect(assessment.ready).toBe(false);
    expect(assessment.triage.band).toBe('urgent');
  });

  it('becomes ready once every required fact is answered', () => {
    const assessment = assessCase(rentalDepositWithheld, completeCase, TODAY);
    expect(assessment.ready).toBe(true);
    expect(assessment.missingFacts).toEqual([]);
    expect(assessment.optionalGaps.map((fact) => fact.id)).toEqual([
      'landlordChangedLocks',
      'courtSummonsReceived',
    ]);
  });

  it('assembles deadlines, triage, routes and citations together', () => {
    const assessment = assessCase(rentalDepositWithheld, completeCase, TODAY);

    expect(assessment.limitations[0]?.status).toBe('comfortable');
    expect(assessment.routes.some((route) => route.available)).toBe(true);
    expect(assessment.governingLaw).toBe(rentalDepositWithheld.governingLaw);
  });

  it('tells a well-documented ₹80,000 claimant they do not need a lawyer yet', () => {
    // The flagship scenario: deposit withheld, no itemised damages, no lockout,
    // three years still on the clock. Self-help is the proportionate answer.
    const assessment = assessCase(rentalDepositWithheld, completeCase, TODAY);
    expect(assessment.triage.band).toBe('self-serve');
    expect(assessment.triage.lawyerSpecialisation).toBeUndefined();
    expect(assessment.routes[0]?.route.id).toBe('demand-notice');
  });

  it('shows only the deadlines that are relevant to this case', () => {
    const noLockout = assessCase(rentalDepositWithheld, completeCase, TODAY);
    expect(noLockout.limitations.map((result) => result.rule.id)).toEqual([
      'rental.deposit.contract_claim',
    ]);

    const lockout = assessCase(
      rentalDepositWithheld,
      { ...completeCase, landlordChangedLocks: true },
      TODAY,
    );
    expect(lockout.limitations.map((result) => result.rule.id)).toContain(
      'rental.deposit.dispossession_claim',
    );
  });

  it('closes the Rent Authority route in a state that has not adopted the Act', () => {
    const assessment = assessCase(rentalDepositWithheld, completeCase, TODAY);
    const rentAuthority = assessment.routes.find((route) => route.route.id === 'rent-authority');
    expect(rentAuthority?.available).toBe(false);
  });

  it('gives the same answer for the same case and date', () => {
    expect(assessCase(rentalDepositWithheld, completeCase, TODAY)).toEqual(
      assessCase(rentalDepositWithheld, completeCase, TODAY),
    );
  });

  it('escalates once the limitation period has run out', () => {
    const inTime = assessCase(rentalDepositWithheld, completeCase, '2026-07-02');
    const tooLate = assessCase(rentalDepositWithheld, completeCase, '2029-07-02');

    expect(inTime.triage.band).toBe('self-serve');
    expect(tooLate.triage.band).toBe('lawyer-recommended');
    expect(tooLate.triage.reasons[0]?.message).toContain('Limitation Act');
  });
});
