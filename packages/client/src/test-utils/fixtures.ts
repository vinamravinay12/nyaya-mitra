import {
  assessCase,
  playbooks,
  type CaseAssessment,
  type CaseFacts,
  type Playbook,
} from '@nyaya-mitra/core';

const [firstPlaybook] = playbooks;
if (firstPlaybook === undefined) {
  throw new Error('expected at least one playbook');
}

/** Narrowed at the boundary so every test can use it without re-checking. */
export const rentalPlaybook: Playbook = firstPlaybook;

/** A complete, well-documented deposit claim — the self-serve path. */
export const completeFacts: CaseFacts = {
  state: 'Karnataka',
  vacateDate: '2026-07-01',
  depositAmountInr: 80_000,
  amountWithheldInr: 80_000,
  writtenAgreement: true,
  itemisedDamagesGiven: false,
  writtenDemandSent: false,
  stateAdoptedModelTenancyAct: false,
};

export function buildAssessment(extraFacts: CaseFacts = {}, today = '2026-09-15'): CaseAssessment {
  return assessCase(rentalPlaybook, { ...completeFacts, ...extraFacts }, today);
}
