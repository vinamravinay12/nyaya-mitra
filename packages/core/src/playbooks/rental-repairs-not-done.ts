import type { Playbook } from '../types/playbook.js';

/**
 * Landlord will not carry out repairs the tenancy requires.
 *
 * The under-known remedy here is s.108(f): where the landlord fails to repair
 * within a reasonable time after notice, the tenant may do it and deduct the
 * cost from rent — which is far faster than any forum.
 */
export const rentalRepairsNotDone: Playbook = {
  id: 'rental.repairs_not_done',
  domain: 'rental',
  title: 'My landlord will not fix things',
  summary:
    'Repairs the landlord is responsible for are not being done, or supplies have been left broken.',
  examplePrompt:
    'There has been a water leak in my rented flat for two months. I have told my landlord many times and he keeps ignoring it.',

  decisiveFacts: [
    {
      id: 'state',
      kind: 'text',
      question: 'Which state is the property in?',
      why: 'Repair duties are split between landlord and tenant differently under each state’s rent law.',
      required: true,
    },
    {
      id: 'problemStartDate',
      kind: 'date',
      question: 'Roughly when did the problem start?',
      why: 'It shows how long the landlord has had to act, which is what "reasonable time" is measured against.',
      required: true,
    },
    {
      id: 'monthlyRentInr',
      kind: 'money',
      question: 'What is your monthly rent?',
      why: 'If you end up repairing and deducting, the deduction is capped by reference to rent.',
      required: true,
    },
    {
      id: 'writtenRequestSent',
      kind: 'boolean',
      question: 'Have you asked for the repair in writing?',
      why: 'Written notice is what starts the clock. Without it the repair-and-deduct route is not open.',
      required: true,
    },
    {
      id: 'essentialServiceAffected',
      kind: 'boolean',
      question: 'Is water, electricity or sanitation affected?',
      why: 'Essential supplies are treated far more urgently than cosmetic repairs.',
      required: true,
    },
    {
      id: 'rentPaidUpToDate',
      kind: 'boolean',
      question: 'Is your rent fully paid up to date?',
      why: 'Withholding rent before you are entitled to weakens an otherwise strong case.',
      required: true,
    },
    {
      id: 'propertyUninhabitable',
      kind: 'boolean',
      question: 'Has it made the place unsafe or unliveable?',
      why: 'That changes the remedy — it can justify leaving without forfeiting your deposit.',
      required: false,
    },
  ],

  derivedFacts: [],
  amountAtStakeFact: 'monthlyRentInr',
  lawyerSpecialisation: 'Civil litigation (landlord–tenant)',

  governingLaw: [
    {
      act: 'Transfer of Property Act',
      year: 1882,
      provision: 's.108(f)',
      note: 'If the landlord fails to make a repair he is bound to make within a reasonable time of notice, the tenant may make it and deduct the cost from rent.',
    },
    {
      act: 'Transfer of Property Act',
      year: 1882,
      provision: 's.108(e)',
      note: 'If the property becomes substantially unfit for the purpose it was let for, the lease may be treated as void at the tenant’s option.',
    },
    {
      act: 'Model Tenancy Act',
      year: 2021,
      provision: 's.15',
      note: 'Splits repair duties: structural repairs to the landlord, day-to-day maintenance to the tenant, in states that have adopted the Act.',
      stateSpecific: true,
    },
    {
      act: 'Model Tenancy Act',
      year: 2021,
      provision: 's.20',
      note: 'A landlord must not withhold essential supplies such as water and electricity.',
      stateSpecific: true,
    },
    {
      act: 'Limitation Act',
      year: 1963,
      provision: 'Art.55',
      note: 'Three years to sue for breach of the tenancy terms.',
    },
  ],

  limitations: [
    {
      id: 'rental.repairs_claim',
      description: 'Claiming the cost of repairs from the landlord',
      reference: {
        act: 'Limitation Act',
        year: 1963,
        provision: 'Art.55',
        note: 'Three years from the landlord’s failure to repair.',
      },
      fromFact: 'problemStartDate',
      durationDays: 1095,
      appliesWhen: null,
    },
  ],

  redFlags: [
    {
      id: 'rental.uninhabitable',
      when: { op: 'isTrue', fact: 'propertyUninhabitable' },
      message:
        'If the property has become genuinely unsafe or unliveable, you may be able to treat the lease as void and leave without forfeiting your deposit. Get that assessed before you move out, because doing it in the wrong order can cost you the deposit.',
      lawyerSpecialisation: 'Civil litigation (property)',
    },
  ],

  routes: [
    {
      id: 'written-repair-notice',
      label: 'Send a written repair notice',
      forum: 'Direct to the landlord, by email and registered post',
      costInr: 0,
      costNote: 'Free, and it is the step that unlocks repair-and-deduct.',
      minDays: 7,
      maxDays: 30,
      effort: 'low',
      availableWhen: { op: 'isFalse', fact: 'writtenRequestSent' },
    },
    {
      id: 'repair-and-deduct',
      label: 'Repair it yourself and deduct from rent',
      forum: 'Under s.108(f) of the Transfer of Property Act',
      costInr: 0,
      costNote:
        'You pay upfront and recover it from rent. Keep every bill and photograph the work.',
      minDays: 7,
      maxDays: 45,
      effort: 'medium',
      availableWhen: { op: 'isTrue', fact: 'writtenRequestSent' },
      unavailableReason:
        'This route only opens once the landlord has had written notice and a reasonable time to act. Send the notice first.',
    },
    {
      id: 'rent-authority',
      label: 'Apply to the Rent Authority',
      forum: 'State Rent Authority under the Model Tenancy Act',
      costInr: 500,
      costNote:
        'Nominal fee, designed to be used without a lawyer — where your state has adopted the Act.',
      minDays: 30,
      maxDays: 180,
      effort: 'medium',
    },
    {
      id: 'civil-suit',
      label: 'Sue for the repair cost',
      forum: 'Civil court',
      costInr: 15_000,
      costNote: 'Rarely proportionate unless the sums are large or the property is uninhabitable.',
      minDays: 180,
      maxDays: 730,
      effort: 'high',
    },
  ],

  artifacts: ['demand-notice', 'evidence-checklist', 'next-steps-timeline'],
};
