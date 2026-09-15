import type { Playbook } from '../types/playbook.js';

/**
 * Builder has not handed over possession by the promised date.
 *
 * RERA changed this materially: the buyer can either withdraw and get the money
 * back with interest, or stay in and claim interest for every month of delay.
 * Most buyers are never told the second option exists.
 */
export const societyBuilderDelay: Playbook = {
  id: 'society.builder_delay',
  domain: 'housing-society',
  title: 'My builder has not given possession on time',
  summary:
    'A flat you booked was promised by a date that has passed, and possession has still not been handed over.',
  examplePrompt:
    'I booked a flat in 2023 and the builder promised possession by December 2025. It is still not ready and he keeps giving me new dates.',

  decisiveFacts: [
    {
      id: 'state',
      kind: 'text',
      question: 'Which state is the project in?',
      why: 'RERA is administered by a separate authority in each state, and that is where a complaint is filed.',
      required: true,
    },
    {
      id: 'promisedPossessionDate',
      kind: 'date',
      question: 'What possession date does your agreement promise?',
      why: 'Everything turns on this date — interest for delay runs from it.',
      required: true,
    },
    {
      id: 'amountPaidInr',
      kind: 'money',
      question: 'How much have you paid so far?',
      why: 'It is the sum interest is calculated on, and it decides which forum is proportionate.',
      required: true,
    },
    {
      id: 'reraRegistered',
      kind: 'boolean',
      question: 'Is the project registered with RERA?',
      why: 'The RERA route needs a registered project. An unregistered one is itself an offence, and changes your approach.',
      required: true,
    },
    {
      id: 'writtenAgreementForSale',
      kind: 'boolean',
      question: 'Do you have a registered agreement for sale?',
      why: 'It is the document that fixes the promised date. An allotment letter alone is weaker.',
      required: true,
    },
    {
      id: 'wantToWithdraw',
      kind: 'boolean',
      question: 'Would you rather get your money back than wait for the flat?',
      why: 'RERA gives you both options, and they lead to different claims — a refund with interest, or interest for every month of delay.',
      required: true,
    },
    {
      id: 'tookHomeLoan',
      kind: 'boolean',
      question: 'Are you paying EMIs on a home loan for it?',
      why: 'Paying both rent and an EMI on an undelivered flat is a recognised head of compensation.',
      required: false,
    },
  ],

  derivedFacts: [],
  amountAtStakeFact: 'amountPaidInr',
  lawyerSpecialisation: 'RERA and real estate law',

  governingLaw: [
    {
      act: 'Real Estate (Regulation and Development) Act',
      year: 2016,
      provision: 's.18(1)',
      note: 'If the promoter fails to hand over by the agreed date, the buyer may withdraw and be repaid with interest, or stay and be paid interest for every month of delay.',
    },
    {
      act: 'Real Estate (Regulation and Development) Act',
      year: 2016,
      provision: 's.31',
      note: 'Lets an aggrieved person complain directly to the state Real Estate Regulatory Authority.',
    },
    {
      act: 'Real Estate (Regulation and Development) Act',
      year: 2016,
      provision: 's.71',
      note: 'An adjudicating officer decides claims for compensation, separately from interest for delay.',
    },
    {
      act: 'Real Estate (Regulation and Development) Act',
      year: 2016,
      provision: 's.3',
      note: 'A project of the qualifying size cannot be advertised or sold without registration. Non-registration is itself a breach.',
    },
    {
      act: 'Consumer Protection Act',
      year: 2019,
      provision: 's.2(11)',
      note: 'Delay in handing over possession is also deficiency in service, so the consumer forum remains available as an alternative.',
    },
    {
      act: 'Limitation Act',
      year: 1963,
      provision: 'Art.55',
      note: 'Three years to sue on the agreement, running from the breach.',
    },
  ],

  limitations: [
    {
      id: 'society.builder_contract_claim',
      description: 'Suing on the agreement for sale',
      reference: {
        act: 'Limitation Act',
        year: 1963,
        provision: 'Art.55',
        note: 'Three years from the promised possession date.',
      },
      fromFact: 'promisedPossessionDate',
      durationDays: 1095,
      appliesWhen: null,
    },
    {
      id: 'society.builder_consumer_claim',
      description: 'Filing a consumer complaint about the delay',
      reference: {
        act: 'Consumer Protection Act',
        year: 2019,
        provision: 's.69',
        note: 'Two years from the cause of action, though a continuing delay can restart it.',
      },
      fromFact: 'promisedPossessionDate',
      durationDays: 730,
      appliesWhen: null,
    },
  ],

  redFlags: [
    {
      id: 'society.unregistered_project',
      when: { op: 'isFalse', fact: 'reraRegistered' },
      message:
        'An unregistered project is a serious problem on the builder’s side, not yours — but it also closes the straightforward RERA complaint route. Get advice on whether to complain about the non-registration itself before choosing a forum.',
      lawyerSpecialisation: 'RERA and real estate law',
    },
  ],

  routes: [
    {
      id: 'written-demand',
      label: 'Send a written demand to the builder',
      forum: 'Direct to the promoter, by registered post',
      costInr: 0,
      costNote: 'Free. State whether you want possession with interest, or a refund.',
      minDays: 15,
      maxDays: 45,
      effort: 'low',
    },
    {
      id: 'rera-complaint',
      label: 'File a RERA complaint',
      forum: 'State Real Estate Regulatory Authority',
      costInr: 1_000,
      costNote: 'Modest filing fee, and the process is designed to be used without a lawyer.',
      minDays: 60,
      maxDays: 180,
      effort: 'medium',
      availableWhen: { op: 'isTrue', fact: 'reraRegistered' },
      unavailableReason:
        'A RERA complaint needs a registered project. If it is not registered, that is itself a breach worth raising — but the route runs differently.',
    },
    {
      id: 'consumer-commission',
      label: 'File a consumer complaint',
      forum: 'Consumer Commission, by value; online via e-Daakhil',
      costInr: 2_000,
      costNote:
        'Filing fee scales with the amount. Useful where compensation beyond interest is wanted.',
      minDays: 120,
      maxDays: 365,
      effort: 'medium',
    },
    {
      id: 'civil-suit',
      label: 'Sue on the agreement',
      forum: 'Civil court',
      costInr: 50_000,
      costNote:
        'Slowest and most expensive. Usually only where RERA and consumer routes are both closed.',
      minDays: 365,
      maxDays: 1460,
      effort: 'high',
    },
  ],

  artifacts: ['demand-notice', 'evidence-checklist', 'next-steps-timeline', 'lawyer-brief'],
};
