import type { Playbook } from '../types/playbook.js';

/**
 * Relieving letter, experience certificate or Form 16 withheld — usually as
 * leverage over a notice period or a training bond.
 *
 * The legally important point, and the one almost nobody is told, is that a
 * contract of personal service cannot be specifically enforced: an employer
 * cannot compel someone to keep working, and a bond is only enforceable to the
 * extent of genuine training cost actually incurred.
 */
export const employmentDocumentsWithheld: Playbook = {
  id: 'employment.documents_withheld',
  domain: 'employment',
  title: 'My employer is withholding my relieving letter',
  summary:
    'Relieving letter, experience certificate, Form 16 or dues are being held back, often over a notice period or a bond.',
  examplePrompt:
    'I resigned and served one month but my company will not give me a relieving letter unless I pay them two months of salary for the notice period.',

  decisiveFacts: [
    {
      id: 'state',
      kind: 'text',
      question: 'Which state were you working in?',
      why: 'Your state’s Shops and Establishments Act sets the notice rules that apply to you.',
      required: true,
    },
    {
      id: 'lastWorkingDate',
      kind: 'date',
      question: 'What was your last working day?',
      why: 'It starts the limitation clock and fixes when your dues fell due.',
      required: true,
    },
    {
      id: 'servedFullNotice',
      kind: 'boolean',
      question: 'Did you serve the full notice period in your contract?',
      why: 'If you did, there is nothing left to withhold the documents over.',
      required: true,
    },
    {
      id: 'amountDemandedInr',
      kind: 'money',
      question: 'How much are they demanding from you? Enter 0 if nothing.',
      why: 'A demand far beyond any real cost to the employer is a penalty, and penalties are not enforceable.',
      required: true,
    },
    {
      id: 'bondSigned',
      kind: 'boolean',
      question: 'Did you sign a bond or minimum-service agreement?',
      why: 'A bond is only enforceable up to the genuine training cost the employer actually spent on you.',
      required: true,
    },
    {
      id: 'employerPaidForTraining',
      kind: 'boolean',
      question: 'Did they actually pay for specific training for you?',
      why: 'Without real expenditure there is nothing for a bond to recover, and the restraint is void.',
      required: false,
    },
    {
      id: 'writtenRequestSent',
      kind: 'boolean',
      question: 'Have you asked for the documents in writing?',
      why: 'Every forum expects a written request first, and email is enough.',
      required: true,
    },
  ],

  derivedFacts: [],
  amountAtStakeFact: 'amountDemandedInr',
  lawyerSpecialisation: 'Employment and labour law',

  governingLaw: [
    {
      act: 'Indian Contract Act',
      year: 1872,
      provision: 's.27',
      note: 'An agreement restraining anyone from exercising a lawful profession is void. A clause stopping you joining another employer is unenforceable in India.',
    },
    {
      act: 'Indian Contract Act',
      year: 1872,
      provision: 's.74',
      note: 'Compensation for breach is limited to reasonable compensation, not a penalty. A bond figure far above actual training cost is not recoverable in full.',
    },
    {
      act: 'Specific Relief Act',
      year: 1963,
      provision: 's.14',
      note: 'A contract of personal service cannot be specifically enforced. An employer cannot compel you to continue working for them.',
    },
    {
      act: 'Income-tax Act',
      year: 1961,
      provision: 's.203',
      note: 'An employer who has deducted tax must issue Form 16. It is a statutory duty, not a bargaining chip.',
    },
    {
      act: 'Shops and Establishments Act',
      year: 1953,
      provision: 'state legislation',
      note: 'Sets the notice period that actually applies, which is often shorter than the one written into the contract.',
      stateSpecific: true,
    },
    {
      act: 'Limitation Act',
      year: 1963,
      provision: 'Art.55',
      note: 'Three years to sue for breach of contract, running from the breach.',
    },
  ],

  limitations: [
    {
      id: 'employment.documents_claim',
      description: 'Suing for your documents and dues',
      reference: {
        act: 'Limitation Act',
        year: 1963,
        provision: 'Art.55',
        note: 'Three years from when the documents were due.',
      },
      fromFact: 'lastWorkingDate',
      durationDays: 1095,
      appliesWhen: null,
    },
  ],

  redFlags: [],

  routes: [
    {
      id: 'written-demand',
      label: 'Send a written demand for your documents',
      forum: 'HR and the reporting manager, by email and registered post',
      costInr: 0,
      costNote: 'Free. Cite s.27 and s.74 — many employers release the papers at this stage.',
      minDays: 7,
      maxDays: 21,
      effort: 'low',
      availableWhen: { op: 'isFalse', fact: 'writtenRequestSent' },
    },
    {
      id: 'labour-commissioner',
      label: 'Complain to the Labour Commissioner',
      forum: 'Office of the Labour Commissioner for your state',
      costInr: 0,
      costNote: 'No fee, and conciliation is designed to be used without a lawyer.',
      minDays: 30,
      maxDays: 120,
      effort: 'medium',
    },
    {
      id: 'form16-grievance',
      label: 'Raise a Form 16 grievance with the tax department',
      forum: 'Income-tax e-filing grievance portal',
      costInr: 0,
      costNote: 'Free. Applies only to the tax certificate, not the relieving letter.',
      minDays: 15,
      maxDays: 60,
      effort: 'low',
    },
    {
      id: 'civil-suit',
      label: 'Sue for the documents and your dues',
      forum: 'Civil court',
      costInr: 20_000,
      costNote:
        'Court fee plus lawyer fees. Usually only worth it alongside a substantial money claim.',
      minDays: 365,
      maxDays: 1095,
      effort: 'high',
    },
  ],

  artifacts: ['demand-notice', 'evidence-checklist', 'next-steps-timeline'],
};
