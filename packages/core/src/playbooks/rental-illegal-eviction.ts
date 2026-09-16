import type { Playbook } from '../types/playbook.js';

/**
 * Being pushed out of a tenancy — by notice, by lockout, or by cutting off
 * water and power.
 *
 * The urgent distinction is between an eviction being *sought* (which is a
 * process, and slow) and one being *carried out* without a court order (which is
 * illegal, and has a six-month window that cannot be extended).
 */
export const rentalIllegalEviction: Playbook = {
  id: 'rental.illegal_eviction',
  domain: 'rental',
  title: 'My landlord is trying to evict me',
  summary:
    'You are being asked to leave, locked out, or having essential services cut off to force you out.',
  examplePrompt:
    'My landlord told me to vacate in a week and yesterday he switched off the water supply to my flat to force me out.',

  decisiveFacts: [
    {
      id: 'state',
      kind: 'text',
      question: 'Which state is the property in?',
      why: 'Rent law is state law, and it decides what notice you are owed and which forum hears it.',
      required: true,
    },
    {
      id: 'writtenAgreement',
      kind: 'boolean',
      question: 'Do you have a written rental agreement?',
      why: 'It usually fixes the notice period, and without one the statutory default applies instead.',
      required: true,
    },
    {
      id: 'rentPaidUpToDate',
      kind: 'boolean',
      question: 'Is your rent fully paid up to date?',
      why: 'Arrears are the strongest ground a landlord has. Being paid up removes it.',
      required: true,
    },
    {
      id: 'noticeReceivedDate',
      kind: 'date',
      question: 'When did you receive notice to vacate? Use today’s date if none was given.',
      why: 'The notice period runs from here, and a short notice is itself a defect.',
      required: true,
    },
    {
      id: 'noticeDaysGiven',
      kind: 'number',
      unit: 'days',
      question: 'How many days were you given?',
      why: 'Month-to-month tenancies usually attract at least fifteen days, and agreements often more.',
      required: true,
    },
    {
      id: 'lockedOut',
      kind: 'boolean',
      question: 'Have you been locked out or had your belongings removed?',
      why: 'Being put out without a court order is illegal dispossession, and the window to act on it is short.',
      required: true,
    },
    {
      id: 'essentialServicesCut',
      kind: 'boolean',
      question: 'Has water or electricity been cut off?',
      why: 'Cutting essential supplies to force a tenant out is specifically prohibited, and can be stopped quickly.',
      required: true,
    },
    {
      id: 'courtOrderExists',
      kind: 'boolean',
      question: 'Is there a court or Rent Authority order against you?',
      why: 'An order changes everything — there are deadlines to respond to and appeal.',
      required: false,
    },
  ],

  derivedFacts: [],
  amountAtStakeFact: null,
  lawyerSpecialisation: 'Civil litigation (landlord–tenant)',

  governingLaw: [
    {
      act: 'Transfer of Property Act',
      year: 1882,
      provision: 's.106',
      note: 'A month-to-month lease ends on fifteen days’ notice expiring with the end of a month of the tenancy, unless the agreement says otherwise.',
    },
    {
      act: 'Transfer of Property Act',
      year: 1882,
      provision: 's.108',
      note: 'Sets out the parties’ rights during the lease, including the tenant’s right to quiet enjoyment of the property.',
    },
    {
      act: 'Specific Relief Act',
      year: 1963,
      provision: 's.6',
      note: 'A person dispossessed of immovable property without due process may sue to recover possession — but only within six months, and no appeal lies from the decree.',
    },
    {
      act: 'Model Tenancy Act',
      year: 2021,
      provision: 's.21',
      note: 'A tenant cannot be evicted except by an order of the Rent Court, in states that have adopted the Act.',
      stateSpecific: true,
    },
    {
      act: 'Model Tenancy Act',
      year: 2021,
      provision: 's.20',
      note: 'A landlord must not withhold essential supplies such as water and electricity, whatever the dispute.',
      stateSpecific: true,
    },
  ],

  limitations: [
    {
      id: 'rental.dispossession_suit',
      description: 'Suing to recover possession after being put out',
      reference: {
        act: 'Specific Relief Act',
        year: 1963,
        provision: 's.6',
        note: 'Six months from dispossession. The window cannot be extended.',
      },
      fromFact: 'noticeReceivedDate',
      durationDays: 182,
      appliesWhen: { op: 'isTrue', fact: 'lockedOut' },
    },
  ],

  redFlags: [
    {
      id: 'rental.locked_out',
      when: { op: 'isTrue', fact: 'lockedOut' },
      message:
        'Being put out without a court order is illegal dispossession. The six-month window under s.6 of the Specific Relief Act is short and cannot be extended — act on this now, not after the rest is resolved.',
      lawyerSpecialisation: 'Civil litigation (property)',
    },
    {
      id: 'rental.services_cut',
      when: { op: 'isTrue', fact: 'essentialServicesCut' },
      message:
        'Cutting off water or electricity to force a tenant out is prohibited. This can usually be restored quickly by an urgent application, and it strengthens everything else in your case.',
      lawyerSpecialisation: 'Civil litigation (property)',
    },
    {
      id: 'rental.eviction_order',
      when: { op: 'isTrue', fact: 'courtOrderExists' },
      message:
        'There is already an order against you. Response and appeal deadlines apply and are short — see a lawyer about this specific order before doing anything else.',
      lawyerSpecialisation: 'Civil litigation (property)',
    },
  ],

  routes: [
    {
      id: 'written-reply',
      label: 'Reply to the notice in writing',
      forum: 'Direct to the landlord, by registered post',
      costInr: 0,
      costNote: 'Free. Record that you dispute the notice and that rent is paid up.',
      minDays: 7,
      maxDays: 21,
      effort: 'low',
    },
    {
      id: 'police-complaint',
      label: 'Report the lockout to the police',
      forum: 'Local police station',
      costInr: 0,
      costNote:
        'Free. Police will often restore possession on the spot where there is no court order.',
      minDays: 1,
      maxDays: 15,
      effort: 'low',
      availableWhen: {
        op: 'anyOf',
        conditions: [
          { op: 'isTrue', fact: 'lockedOut' },
          { op: 'isTrue', fact: 'essentialServicesCut' },
        ],
      },
      unavailableReason:
        'This route is for a lockout or cut supplies. A notice to vacate on its own is a civil matter, and the police will not intervene.',
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
      id: 'injunction-suit',
      label: 'Apply for an injunction',
      forum: 'Civil court',
      costInr: 20_000,
      costNote: 'Lawyer-led, but an interim order restraining eviction can come within days.',
      minDays: 7,
      maxDays: 365,
      effort: 'high',
    },
  ],

  artifacts: ['demand-notice', 'evidence-checklist', 'next-steps-timeline', 'lawyer-brief'],
};
