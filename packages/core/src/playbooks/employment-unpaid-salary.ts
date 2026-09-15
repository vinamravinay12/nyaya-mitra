import type { Playbook } from '../types/playbook.js';

/**
 * Employer has not paid salary, dues or a full-and-final settlement.
 *
 * The non-compete reference matters more than it looks: s.27 of the Contract
 * Act makes post-employment restraints void, yet they appear in most Indian
 * offer letters and stop people leaving jobs they are entitled to leave.
 */
export const employmentUnpaidSalary: Playbook = {
  id: 'employment.unpaid_salary',
  domain: 'employment',
  title: 'My employer has not paid me',
  summary: 'Salary, dues or your full-and-final settlement have not been paid.',

  decisiveFacts: [
    {
      id: 'state',
      kind: 'text',
      question: 'Which state were you working in?',
      why: 'Shops and Establishments rules are state law, and they set the payment deadlines that apply to you.',
      required: true,
    },
    {
      id: 'lastPaidDate',
      kind: 'date',
      question: 'When were you last paid?',
      why: 'This starts the limitation clock on a wages claim.',
      required: true,
    },
    {
      id: 'amountOwedInr',
      kind: 'money',
      question: 'Roughly how much is owed to you?',
      why: 'It decides which forum is proportionate and whether a lawyer costs more than the claim.',
      required: true,
    },
    {
      id: 'employmentStatus',
      kind: 'enum',
      question: 'Are you still employed there?',
      why: 'Resigning, being terminated and still working each open different routes.',
      options: ['still employed', 'resigned', 'terminated'],
      required: true,
    },
    {
      id: 'writtenContract',
      kind: 'boolean',
      question: 'Do you have an offer letter or written contract?',
      why: 'It is what proves the agreed pay, and it opens the faster civil recovery route.',
      required: true,
    },
    {
      id: 'writtenDemandSent',
      kind: 'boolean',
      question: 'Have you asked for the money in writing?',
      why: 'Every forum expects a written demand first, and email is enough.',
      required: true,
    },
    {
      id: 'nonCompeteClause',
      kind: 'boolean',
      question: 'Does your contract stop you joining a competitor after leaving?',
      why: 'Post-employment non-competes are void in India. If one is being used to pressure you, it has no force.',
      required: false,
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
  amountAtStakeFact: 'amountOwedInr',
  lawyerSpecialisation: 'Employment and labour law',

  governingLaw: [
    {
      act: 'Code on Wages',
      year: 2019,
      provision: 's.17',
      note: 'Sets when wages must be paid, and requires dues to be settled within two working days where employment ends.',
    },
    {
      act: 'Payment of Wages Act',
      year: 1936,
      provision: 's.5',
      note: 'Fixes wage periods and payment deadlines for covered employees.',
    },
    {
      act: 'Industrial Disputes Act',
      year: 1947,
      provision: 's.2A',
      note: 'Lets an individual workman raise a dispute over discharge or termination directly.',
    },
    {
      act: 'Indian Contract Act',
      year: 1872,
      provision: 's.27',
      note: 'An agreement restraining anyone from exercising a lawful profession is void. Post-employment non-compete clauses are therefore unenforceable in India.',
    },
    {
      act: 'Shops and Establishments Act',
      year: 1953,
      provision: 'state legislation',
      note: 'Each state has its own Act governing notice, wages and working conditions for shop and office employees.',
      stateSpecific: true,
    },
    {
      act: 'Limitation Act',
      year: 1963,
      provision: 'Art.7',
      note: 'Three years to sue for wages, running from when they fell due.',
    },
  ],

  limitations: [
    {
      id: 'employment.wages_claim',
      description: 'Recovering unpaid wages',
      reference: {
        act: 'Limitation Act',
        year: 1963,
        provision: 'Art.7',
        note: 'Three years from the date the wages fell due.',
      },
      fromFact: 'lastPaidDate',
      durationDays: 1095,
      appliesWhen: null,
    },
  ],

  redFlags: [
    {
      id: 'employment.active_proceeding',
      when: { op: 'isTrue', fact: 'courtSummonsReceived' },
      message:
        'Your employer has started a proceeding against you. Response deadlines apply and missing one can mean an order passed without you being heard.',
      lawyerSpecialisation: 'Employment litigation',
    },
  ],

  routes: [
    {
      id: 'written-demand',
      label: 'Send a written demand for your dues',
      forum: 'Direct to the employer, by email and registered post',
      costInr: 0,
      costNote: 'Free if you send it yourself; ₹1,000–3,000 if a lawyer signs it.',
      minDays: 7,
      maxDays: 21,
      effort: 'low',
      availableWhen: { op: 'isFalse', fact: 'writtenDemandSent' },
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
      forum: 'Labour Court or Industrial Tribunal',
      costInr: 5_000,
      costNote: 'Low court fees; lawyer fees vary widely.',
      minDays: 180,
      maxDays: 730,
      effort: 'high',
      availableWhen: { op: 'equals', fact: 'employmentStatus', value: 'terminated' },
      unavailableReason:
        'This route is for people who were terminated. Unpaid wages while employed or after resigning go through the Labour Commissioner instead.',
    },
    {
      id: 'civil-recovery',
      label: 'File a civil suit for recovery',
      forum: 'Civil court, Order XXXVII CPC where the contract is written',
      costInr: 15_000,
      costNote: 'Court fee scales with the amount claimed, plus lawyer fees.',
      minDays: 180,
      maxDays: 730,
      effort: 'high',
      availableWhen: { op: 'isTrue', fact: 'writtenContract' },
      unavailableReason:
        'The fast summary-suit route needs a written contract. Without one this becomes an ordinary civil suit, which is slower.',
    },
  ],

  artifacts: ['demand-notice', 'evidence-checklist', 'next-steps-timeline', 'lawyer-brief'],
};
