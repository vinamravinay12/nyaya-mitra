import type { Playbook } from '../types/playbook.js';

/**
 * Dismissed without proper notice, compensation or a hearing.
 *
 * The decisive question in India is usually whether the person is a "workman"
 * under the Industrial Disputes Act — that single classification decides whether
 * the cheap Labour Court route is open or whether it is an ordinary contract
 * claim, so the playbook asks about the role rather than assuming.
 */
export const employmentWrongfulTermination: Playbook = {
  id: 'employment.wrongful_termination',
  domain: 'employment',
  title: 'I was fired unfairly',
  summary:
    'You were dismissed, retrenched or forced to resign, and the process or compensation looks wrong.',
  examplePrompt:
    'I was let go last month after four years with no notice and no reason given. They just asked me to hand in my laptop.',

  decisiveFacts: [
    {
      id: 'state',
      kind: 'text',
      question: 'Which state were you working in?',
      why: 'Notice and severance rules for non-workmen come from your state’s Shops and Establishments Act.',
      required: true,
    },
    {
      id: 'terminationDate',
      kind: 'date',
      question: 'What was your last working day?',
      why: 'This starts the clock on raising an industrial dispute.',
      required: true,
    },
    {
      id: 'completedYears',
      kind: 'number',
      unit: 'years',
      question: 'How many complete years had you worked there?',
      why: 'Past one year of continuous service, retrenchment compensation becomes payable.',
      required: true,
    },
    {
      id: 'monthlySalaryInr',
      kind: 'money',
      question: 'What was your monthly salary?',
      why: 'Notice pay and retrenchment compensation are both calculated from it.',
      required: true,
    },
    {
      id: 'roleType',
      kind: 'enum',
      question: 'Was your role mainly managerial or supervisory?',
      why: 'Managerial and supervisory staff usually fall outside the Industrial Disputes Act, which decides whether the cheap Labour Court route is open to you.',
      options: ['mainly managerial or supervisory', 'not managerial or supervisory', 'not sure'],
      required: true,
    },
    {
      id: 'writtenNoticeGiven',
      kind: 'boolean',
      question: 'Did they give you written notice or notice pay?',
      why: 'Termination without either is the most common defect, and the easiest to prove.',
      required: true,
    },
    {
      id: 'reasonGivenInWriting',
      kind: 'boolean',
      question: 'Did they give a reason in writing?',
      why: 'A dismissal for alleged misconduct requires a fair process. No written reason weakens their position.',
      required: true,
    },
    {
      id: 'courtSummonsReceived',
      kind: 'boolean',
      question: 'Has your employer started any legal proceeding against you?',
      why: 'An active case has response deadlines that override everything else here.',
      required: false,
    },
  ],

  derivedFacts: [],
  amountAtStakeFact: 'monthlySalaryInr',
  lawyerSpecialisation: 'Employment and labour law',

  governingLaw: [
    {
      act: 'Industrial Disputes Act',
      year: 1947,
      provision: 's.25F',
      note: 'A workman with at least a year of continuous service cannot be retrenched without one month’s notice or pay in lieu, plus compensation of 15 days’ average pay for each completed year.',
    },
    {
      act: 'Industrial Disputes Act',
      year: 1947,
      provision: 's.2(s)',
      note: 'Defines "workman". People employed mainly in a managerial or administrative capacity are excluded, and so cannot use the Labour Court route.',
    },
    {
      act: 'Industrial Disputes Act',
      year: 1947,
      provision: 's.2A',
      note: 'Lets an individual workman raise a dispute about their own discharge or dismissal directly, without union backing.',
    },
    {
      act: 'Industrial Disputes Act',
      year: 1947,
      provision: 's.2A(3)',
      note: 'An application to the Labour Court must be made within three years of the date of discharge.',
    },
    {
      act: 'Shops and Establishments Act',
      year: 1953,
      provision: 'state legislation',
      note: 'Sets minimum notice for shop and office employees who fall outside the Industrial Disputes Act — commonly one month after a qualifying period.',
      stateSpecific: true,
    },
    {
      act: 'Specific Relief Act',
      year: 1963,
      provision: 's.14',
      note: 'A contract of personal service is not specifically enforceable, so the usual remedy is compensation rather than reinstatement outside the industrial framework.',
    },
  ],

  limitations: [
    {
      id: 'employment.industrial_dispute',
      description: 'Raising an industrial dispute over the dismissal',
      reference: {
        act: 'Industrial Disputes Act',
        year: 1947,
        provision: 's.2A(3)',
        note: 'Three years from the date of discharge, dismissal or retrenchment.',
      },
      fromFact: 'terminationDate',
      durationDays: 1095,
      appliesWhen: {
        op: 'not',
        condition: { op: 'equals', fact: 'roleType', value: 'mainly managerial or supervisory' },
      },
    },
    {
      id: 'employment.contract_claim',
      description: 'Suing on the contract for notice pay and dues',
      reference: {
        act: 'Limitation Act',
        year: 1963,
        provision: 'Art.55',
        note: 'Three years from the breach.',
      },
      fromFact: 'terminationDate',
      durationDays: 1095,
      appliesWhen: null,
    },
  ],

  redFlags: [
    {
      id: 'employment.termination_proceeding',
      when: { op: 'isTrue', fact: 'courtSummonsReceived' },
      message:
        'Your employer has started a proceeding against you. Response deadlines apply and missing one can mean an order passed without you being heard.',
      lawyerSpecialisation: 'Employment litigation',
    },
  ],

  routes: [
    {
      id: 'written-representation',
      label: 'Send a written representation',
      forum: 'Direct to the employer, by email and registered post',
      costInr: 0,
      costNote: 'Free. Ask for the reason in writing and for your dues to be computed.',
      minDays: 7,
      maxDays: 21,
      effort: 'low',
    },
    {
      id: 'labour-commissioner',
      label: 'Complain to the Labour Commissioner',
      forum: 'Office of the Labour Commissioner for your state',
      costInr: 0,
      costNote: 'No fee. Conciliation is designed to be used without a lawyer.',
      minDays: 30,
      maxDays: 120,
      effort: 'medium',
    },
    {
      id: 'labour-court',
      label: 'Raise an industrial dispute',
      forum: 'Labour Court under s.2A of the Industrial Disputes Act',
      costInr: 5_000,
      costNote:
        'Low court fees. Reinstatement with back wages is possible here, unlike a civil suit.',
      minDays: 180,
      maxDays: 730,
      effort: 'high',
      availableWhen: {
        op: 'not',
        condition: { op: 'equals', fact: 'roleType', value: 'mainly managerial or supervisory' },
      },
      unavailableReason:
        'This route is for "workmen". A mainly managerial or supervisory role falls outside the Industrial Disputes Act, so the claim is an ordinary contract claim instead.',
    },
    {
      id: 'civil-suit',
      label: 'Sue for notice pay and dues',
      forum: 'Civil court',
      costInr: 20_000,
      costNote:
        'Court fee scales with the amount claimed, plus lawyer fees. Compensation only — not your job back.',
      minDays: 365,
      maxDays: 1095,
      effort: 'high',
    },
  ],

  artifacts: ['demand-notice', 'evidence-checklist', 'next-steps-timeline', 'lawyer-brief'],
};
