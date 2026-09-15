import type { Playbook } from '../types/playbook.js';

/**
 * Landlord is withholding all or part of a security deposit after the tenant
 * vacated — the single most common everyday housing dispute in India.
 *
 * Note on forum: pure landlord–tenant deposit recovery is generally NOT
 * entertained as a consumer dispute, so no consumer-commission route appears
 * here. Where a state has adopted the Model Tenancy Act, the Rent Authority is
 * the cheap route; otherwise it is a money-recovery suit.
 */
export const rentalDepositWithheld: Playbook = {
  id: 'rental.deposit_withheld',
  domain: 'rental',
  title: 'Landlord is withholding my security deposit',
  summary:
    'You have moved out and the landlord has not returned the deposit, or has deducted from it.',

  decisiveFacts: [
    {
      id: 'state',
      kind: 'text',
      question: 'Which state was the property in?',
      why: 'Rent law is state-specific. It decides which Act applies and whether a Rent Authority is available to you.',
      required: true,
    },
    {
      id: 'vacateDate',
      kind: 'date',
      question: 'When did you hand over possession?',
      why: 'This starts the limitation clock. Once it runs out the claim cannot be filed at all.',
      required: true,
    },
    {
      id: 'depositAmountInr',
      kind: 'money',
      question: 'How much deposit did you pay?',
      why: 'The amount decides which forum can hear it, and whether a lawyer costs more than the claim is worth.',
      required: true,
    },
    {
      id: 'amountWithheldInr',
      kind: 'money',
      question: 'How much of it is still unpaid?',
      why: 'A partial deduction and a total refusal are argued differently.',
      required: true,
    },
    {
      id: 'writtenAgreement',
      kind: 'boolean',
      question: 'Do you have a written rental agreement?',
      why: 'A written agreement is what makes the fast summary-suit route available, and it usually fixes the refund timeline.',
      required: true,
    },
    {
      id: 'itemisedDamagesGiven',
      kind: 'boolean',
      question: 'Did the landlord give you an itemised list of damages or bills?',
      why: 'A deduction claimed without itemisation is the weakest part of most landlords’ positions.',
      required: true,
    },
    {
      id: 'writtenDemandSent',
      kind: 'boolean',
      question: 'Have you asked for it in writing yet?',
      why: 'Every forum expects a written demand first. Without one you will usually be sent back to make it.',
      required: true,
    },
    {
      id: 'landlordChangedLocks',
      kind: 'boolean',
      question: 'Did the landlord lock you out or remove your belongings without a court order?',
      why: 'That is illegal dispossession, which is urgent and time-limited — it changes what you should do today.',
      required: false,
    },
    {
      id: 'courtSummonsReceived',
      kind: 'boolean',
      question: 'Have you received any court notice or summons about this?',
      why: 'An active case has response deadlines that override everything else here.',
      required: false,
    },
  ],

  derivedFacts: ['stateAdoptedModelTenancyAct'],
  amountAtStakeFact: 'amountWithheldInr',
  lawyerSpecialisation: 'Civil litigation (landlord–tenant)',

  governingLaw: [
    {
      act: 'Transfer of Property Act',
      year: 1882,
      provision: 's.108',
      note: 'Sets the baseline rights and liabilities of landlord and tenant, including return of what is due on handing back possession.',
    },
    {
      act: 'Model Tenancy Act',
      year: 2021,
      provision: 's.11',
      note: 'Caps a residential security deposit at two months’ rent and requires refund within one month of vacating — but only in states that have adopted it.',
      stateSpecific: true,
    },
    {
      act: 'Registration Act',
      year: 1908,
      provision: 's.17',
      note: 'Leases of a year or more must be registered. This is why Indian rental agreements are almost always exactly 11 months.',
    },
    {
      act: 'Limitation Act',
      year: 1963,
      provision: 'Art.55',
      note: 'Three years to sue for compensation for breach of contract, running from the date of the breach.',
    },
    {
      act: 'Specific Relief Act',
      year: 1963,
      provision: 's.6',
      note: 'A person dispossessed of immovable property without due process may sue to recover it — but only within six months.',
    },
  ],

  limitations: [
    {
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
    },
    {
      id: 'rental.deposit.dispossession_claim',
      description: 'Suing to recover possession after an illegal lockout',
      reference: {
        act: 'Specific Relief Act',
        year: 1963,
        provision: 's.6',
        note: 'Six months from the date of dispossession, and no appeal lies from the decree.',
      },
      fromFact: 'vacateDate',
      durationDays: 182,
      // Only relevant if there was actually a lockout.
      appliesWhen: { op: 'isTrue', fact: 'landlordChangedLocks' },
    },
  ],

  redFlags: [
    {
      id: 'rental.illegal_dispossession',
      when: { op: 'isTrue', fact: 'landlordChangedLocks' },
      message:
        'Being locked out without a court order is illegal dispossession. The six-month window under s.6 of the Specific Relief Act is short and cannot be extended — see a lawyer now, not after the deposit issue resolves.',
      lawyerSpecialisation: 'Civil litigation (property)',
    },
    {
      id: 'rental.active_proceeding',
      when: { op: 'isTrue', fact: 'courtSummonsReceived' },
      message:
        'There is already a case on foot. Response deadlines apply and missing one can mean an order passed without you being heard.',
      lawyerSpecialisation: 'Civil litigation',
    },
  ],

  routes: [
    {
      id: 'demand-notice',
      label: 'Send a written demand notice',
      forum: 'Direct to the landlord, by registered post or email',
      costInr: 0,
      costNote: 'Free if you send it yourself; ₹1,000–3,000 if a lawyer signs it.',
      minDays: 7,
      maxDays: 21,
      effort: 'low',
      availableWhen: { op: 'isFalse', fact: 'writtenDemandSent' },
    },
    {
      id: 'rent-authority',
      label: 'Apply to the Rent Authority',
      forum: 'State Rent Authority under the Model Tenancy Act',
      costInr: 500,
      costNote: 'Nominal application fee; designed to be used without a lawyer.',
      minDays: 60,
      maxDays: 180,
      effort: 'medium',
      availableWhen: { op: 'isTrue', fact: 'stateAdoptedModelTenancyAct' },
      // We do not yet derive adoption from the state, so this must not assert
      // that the state has *not* adopted it — only that we cannot confirm it.
      unavailableReason:
        'This route only exists where the state has adopted the Model Tenancy Act. We have not confirmed that for your state — ask your local Rent Authority before ruling it out.',
    },
    {
      id: 'lok-adalat',
      label: 'Refer it to Lok Adalat',
      forum: 'District Legal Services Authority',
      costInr: 0,
      costNote: 'No court fee, and any fee already paid is refunded on settlement.',
      minDays: 30,
      maxDays: 120,
      effort: 'low',
    },
    {
      id: 'summary-suit',
      label: 'File a summary suit for recovery',
      forum: 'Civil court, Order XXXVII CPC',
      costInr: 15_000,
      costNote: 'Court fee scales with the amount claimed, plus lawyer fees.',
      minDays: 180,
      maxDays: 730,
      effort: 'high',
      availableWhen: { op: 'isTrue', fact: 'writtenAgreement' },
      unavailableReason:
        'The summary-suit route needs a written contract. Without one this becomes an ordinary civil suit, which is slower.',
    },
  ],

  artifacts: ['demand-notice', 'evidence-checklist', 'next-steps-timeline', 'lawyer-brief'],
};
