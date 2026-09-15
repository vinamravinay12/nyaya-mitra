import type { Playbook } from '../types/playbook.js';

/**
 * Provident fund deducted from salary but not deposited with EPFO.
 *
 * This is money already taken from the employee, so it is treated seriously:
 * EPFO can recover it with damages and interest, and the employer's liability
 * does not fade with time the way an ordinary contract claim does.
 */
export const employmentPfNotDeposited: Playbook = {
  id: 'employment.pf_not_deposited',
  domain: 'employment',
  title: 'My PF was deducted but never deposited',
  summary: 'Provident fund was taken out of your salary but is not showing in your EPFO account.',
  examplePrompt:
    'My payslips show PF being deducted every month but my EPFO passbook has had no credits for the last eight months.',

  decisiveFacts: [
    {
      id: 'state',
      kind: 'text',
      question: 'Which state is the employer registered in?',
      why: 'It decides which Regional PF Commissioner handles the complaint.',
      required: true,
    },
    {
      id: 'firstMissingMonthDate',
      kind: 'date',
      question: 'From roughly when did the credits stop? Use the first of that month.',
      why: 'It sets the period EPFO will investigate.',
      required: true,
    },
    {
      id: 'amountDeductedInr',
      kind: 'money',
      question: 'Roughly how much has been deducted in total since then?',
      why: 'It is the amount EPFO will seek to recover on your behalf.',
      required: true,
    },
    {
      id: 'payslipsShowDeduction',
      kind: 'boolean',
      question: 'Do your payslips show the PF deduction?',
      why: 'This is the core evidence. Deduction without deposit is a far stronger case than non-enrolment.',
      required: true,
    },
    {
      id: 'uanKnown',
      kind: 'boolean',
      question: 'Do you know your UAN?',
      why: 'You need it to check the passbook and to file a grievance.',
      required: true,
    },
    {
      id: 'grievanceFiled',
      kind: 'boolean',
      question: 'Have you filed an EPFO grievance yet?',
      why: 'The online grievance is free and is the normal first step before an inquiry.',
      required: true,
    },
    {
      id: 'stillEmployed',
      kind: 'boolean',
      question: 'Are you still working there?',
      why: 'It changes how you are likely to want to raise it, not what you are entitled to.',
      required: false,
    },
  ],

  derivedFacts: [],
  amountAtStakeFact: 'amountDeductedInr',
  lawyerSpecialisation: 'Employment and provident fund matters',

  governingLaw: [
    {
      act: 'Employees’ Provident Funds and Miscellaneous Provisions Act',
      year: 1952,
      provision: 's.6',
      note: 'Requires the employer to pay both the employee’s deducted contribution and its own share into the fund.',
    },
    {
      act: 'Employees’ Provident Funds and Miscellaneous Provisions Act',
      year: 1952,
      provision: 's.7A',
      note: 'Lets the PF Commissioner hold an inquiry and determine the amount due from an employer.',
    },
    {
      act: 'Employees’ Provident Funds and Miscellaneous Provisions Act',
      year: 1952,
      provision: 's.7Q and s.14B',
      note: 'Interest and damages are payable by the employer on top of the unpaid contributions.',
    },
    {
      act: 'Employees’ Provident Funds and Miscellaneous Provisions Act',
      year: 1952,
      provision: 's.14',
      note: 'Makes default in payment an offence, in addition to the recovery of the money itself.',
    },
    {
      act: 'Bharatiya Nyaya Sanhita',
      year: 2023,
      provision: 's.316',
      note: 'Criminal breach of trust. Money deducted from wages and not deposited can be treated as entrusted property.',
    },
  ],

  limitations: [
    {
      id: 'employment.pf_civil_claim',
      description: 'A civil claim for the deducted amount',
      reference: {
        act: 'Limitation Act',
        year: 1963,
        provision: 'Art.55',
        note: 'Three years for a contract claim. EPFO’s own recovery powers are not limited in the same way, so raising it with EPFO is the stronger route.',
      },
      fromFact: 'firstMissingMonthDate',
      durationDays: 1095,
      appliesWhen: null,
    },
  ],

  redFlags: [],

  routes: [
    {
      id: 'epfo-grievance',
      label: 'File an EPFO grievance',
      forum: 'EPFiGMS, the EPFO online grievance portal',
      costInr: 0,
      costNote: 'Free, online, and designed to be used without a lawyer.',
      minDays: 15,
      maxDays: 60,
      effort: 'low',
      availableWhen: { op: 'isFalse', fact: 'grievanceFiled' },
    },
    {
      id: 'rpfc-complaint',
      label: 'Complain to the Regional PF Commissioner',
      forum: 'Regional PF Office, seeking an inquiry under s.7A',
      costInr: 0,
      costNote: 'Free. EPFO recovers the money from the employer, with interest and damages.',
      minDays: 60,
      maxDays: 240,
      effort: 'medium',
    },
    {
      id: 'written-demand',
      label: 'Raise it with your employer in writing',
      forum: 'HR and payroll, by email',
      costInr: 0,
      costNote: 'Free, and creates the record you will rely on later.',
      minDays: 7,
      maxDays: 30,
      effort: 'low',
    },
  ],

  artifacts: ['evidence-checklist', 'next-steps-timeline', 'demand-notice'],
};
