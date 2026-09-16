import type { Playbook } from '../types/playbook.js';

/**
 * Being held to a notice period, or asked to buy it out, on the way out.
 *
 * Two points do most of the work here and are rarely known. A contract of
 * personal service cannot be specifically enforced, so nobody can be compelled
 * to keep working. And where a state's Shops and Establishments Act fixes a
 * notice period, a longer one written into a contract does not simply override
 * it.
 */
export const employmentNoticePeriod: Playbook = {
  id: 'employment.notice_period',
  domain: 'employment',
  title: 'I am being held to a long notice period',
  summary:
    'You want to leave and the employer is insisting on a long notice period, refusing to release you, or demanding a buyout.',
  examplePrompt:
    'My company says I have to serve a 90 day notice period before I can leave, and they want two months salary if I go earlier.',

  decisiveFacts: [
    {
      id: 'state',
      kind: 'text',
      question: 'Which state are you employed in?',
      why: 'Your state’s Shops and Establishments Act sets a statutory notice period, which is often shorter than the one in your contract.',
      required: true,
    },
    {
      id: 'resignationDate',
      kind: 'date',
      question: 'When did you resign, or when do you plan to?',
      why: 'The notice period runs from here, and it fixes when your dues fall due.',
      required: true,
    },
    {
      id: 'contractNoticeDays',
      kind: 'number',
      unit: 'days',
      question: 'How many days notice does your contract require?',
      why: 'A period far beyond the statutory norm is the part most open to challenge.',
      required: true,
    },
    {
      id: 'buyoutDemandedInr',
      kind: 'money',
      question: 'How much are they asking for to release you early? Enter 0 if nothing.',
      why: 'A sum beyond the employer’s real loss is a penalty, and only reasonable compensation is recoverable.',
      required: true,
    },
    {
      id: 'writtenResignationSent',
      kind: 'boolean',
      question: 'Have you resigned in writing?',
      why: 'A dated written resignation is what starts the clock and what every later argument rests on.',
      required: true,
    },
    {
      id: 'employerRefusingRelease',
      kind: 'boolean',
      question: 'Are they refusing to accept the resignation or release you?',
      why: 'Refusing to accept a resignation does not keep you employed indefinitely, but it does change what you should put in writing.',
      required: true,
    },
    {
      id: 'joiningDateFixed',
      kind: 'boolean',
      question: 'Do you have a confirmed joining date elsewhere?',
      why: 'A fixed date makes this time-critical, and it changes what is worth negotiating versus arguing.',
      required: false,
    },
  ],

  derivedFacts: [],
  amountAtStakeFact: 'buyoutDemandedInr',
  lawyerSpecialisation: 'Employment and labour law',

  governingLaw: [
    {
      act: 'Specific Relief Act',
      year: 1963,
      provision: 's.14',
      note: 'A contract of personal service cannot be specifically enforced. No court will order you to continue working, whatever the notice clause says.',
    },
    {
      act: 'Shops and Establishments Act',
      year: 1953,
      provision: 'state legislation',
      note: 'Each state fixes a notice period for shop and office employees — commonly around 30 days. A contract cannot reduce a protection the statute gives you.',
      stateSpecific: true,
    },
    {
      act: 'Indian Contract Act',
      year: 1872,
      provision: 's.74',
      note: 'Where a sum is named as payable on breach, only reasonable compensation is recoverable. A buyout far above the employer’s actual loss is a penalty.',
    },
    {
      act: 'Indian Contract Act',
      year: 1872,
      provision: 's.27',
      note: 'Any part of the clause that also restrains you from joining a competitor afterwards is void, separately from the notice question.',
    },
    {
      act: 'Industrial Disputes Act',
      year: 1947,
      provision: 's.2A',
      note: 'Where you qualify as a workman, a dispute about the terms of your exit can be raised directly without union backing.',
    },
    {
      act: 'Limitation Act',
      year: 1963,
      provision: 'Art.55',
      note: 'Three years to sue on the contract, running from the breach.',
    },
  ],

  limitations: [
    {
      id: 'employment.notice_contract_claim',
      description: 'Any claim arising from how the exit was handled',
      reference: {
        act: 'Limitation Act',
        year: 1963,
        provision: 'Art.55',
        note: 'Three years from the breach.',
      },
      fromFact: 'resignationDate',
      durationDays: 1095,
      appliesWhen: null,
    },
  ],

  redFlags: [
    {
      id: 'employment.joining_date_pressure',
      when: { op: 'isTrue', fact: 'joiningDateFixed' },
      message:
        'With a joining date already fixed, time is the binding constraint rather than the clause. Put your last working day in writing now, and treat the buyout as a negotiation rather than a debt you owe.',
      lawyerSpecialisation: 'Employment and labour law',
    },
  ],

  routes: [
    {
      id: 'written-resignation',
      label: 'Resign in writing with a stated last working day',
      forum: 'HR and your reporting manager, by email',
      costInr: 0,
      costNote: 'Free, and it is what every later step depends on. Keep the delivery receipt.',
      minDays: 1,
      maxDays: 7,
      effort: 'low',
      availableWhen: { op: 'isFalse', fact: 'writtenResignationSent' },
      unavailableReason: 'You have already resigned in writing, which is the important part.',
    },
    {
      id: 'negotiate-shortfall',
      label: 'Negotiate the notice down or the buyout lower',
      forum: 'Direct with HR',
      costInr: 0,
      costNote:
        'Usually the fastest route. Leave on good terms where you can — a reference outlives the argument.',
      minDays: 3,
      maxDays: 30,
      effort: 'low',
    },
    {
      id: 'labour-commissioner',
      label: 'Complain to the Labour Commissioner',
      forum: 'Office of the Labour Commissioner for your state',
      costInr: 0,
      costNote: 'No fee. Useful where dues are being withheld to enforce the notice period.',
      minDays: 30,
      maxDays: 120,
      effort: 'medium',
    },
    {
      id: 'civil-suit',
      label: 'Contest it in court',
      forum: 'Civil court',
      costInr: 25_000,
      costNote:
        'Rarely proportionate. The employer would have to sue you, and they cannot get an order making you work.',
      minDays: 365,
      maxDays: 1095,
      effort: 'high',
    },
  ],

  artifacts: ['demand-notice', 'evidence-checklist', 'next-steps-timeline'],
};
