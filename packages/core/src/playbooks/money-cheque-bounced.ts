import type { Playbook } from '../types/playbook.js';

/**
 * A cheque given to you was dishonoured.
 *
 * s.138 of the NI Act is a cascade of hard deadlines — 30 days to send the
 * notice, 15 days for the drawer to pay, then 30 days to file. Miss the first
 * and the criminal remedy is gone entirely, leaving only a slower civil suit.
 * That makes this the clearest case for the deadline engine in the product.
 */
export const moneyChequeBounced: Playbook = {
  id: 'money-recovery.cheque_bounced',
  domain: 'money-recovery',
  title: 'A cheque given to me has bounced',
  summary: 'A cheque was returned unpaid and the person who gave it is not making good on it.',

  decisiveFacts: [
    {
      id: 'bankMemoDate',
      kind: 'date',
      question: 'What date is on the bank’s cheque return memo?',
      why: 'Every deadline under s.138 runs from this date, not from when the cheque was written.',
      required: true,
    },
    {
      id: 'chequeAmountInr',
      kind: 'money',
      question: 'What is the cheque for?',
      why: 'It sets what you can claim and whether a lawyer is proportionate.',
      required: true,
    },
    {
      id: 'haveReturnMemo',
      kind: 'boolean',
      question: 'Do you have the return memo from the bank?',
      why: 'Without it the s.138 route does not get off the ground. Ask your bank for a duplicate if you have lost it.',
      required: true,
    },
    {
      id: 'demandNoticeSent',
      kind: 'boolean',
      question: 'Have you sent a formal demand notice?',
      why: 'The notice must go within 30 days of the memo. It is the step that keeps the criminal remedy alive.',
      required: true,
    },
    {
      id: 'writtenAgreement',
      kind: 'boolean',
      question: 'Is there a written record of why the money was owed?',
      why: 'A loan note, invoice or agreement opens the faster summary-suit route on the civil side.',
      required: true,
    },
  ],

  derivedFacts: [],
  amountAtStakeFact: 'chequeAmountInr',
  lawyerSpecialisation: 'Cheque dishonour (NI Act s.138) and civil recovery',

  governingLaw: [
    {
      act: 'Negotiable Instruments Act',
      year: 1881,
      provision: 's.138',
      note: 'Makes dishonour of a cheque for insufficiency of funds an offence, subject to the notice and payment conditions in its provisos.',
    },
    {
      act: 'Negotiable Instruments Act',
      year: 1881,
      provision: 's.138 proviso (b)',
      note: 'A written demand must be made within 30 days of receiving information about the dishonour.',
    },
    {
      act: 'Negotiable Instruments Act',
      year: 1881,
      provision: 's.138 proviso (c)',
      note: 'The drawer then has 15 days from receiving the notice to pay.',
    },
    {
      act: 'Negotiable Instruments Act',
      year: 1881,
      provision: 's.142(1)(b)',
      note: 'The complaint must be filed within 30 days of the 15-day period expiring.',
    },
    {
      act: 'Negotiable Instruments Act',
      year: 1881,
      provision: 's.143A',
      note: 'A court may order the drawer to pay interim compensation of up to 20 per cent while the case runs.',
    },
    {
      act: 'Limitation Act',
      year: 1963,
      provision: 'Art.55',
      note: 'Three years to bring an ordinary civil suit to recover the debt itself.',
    },
  ],

  limitations: [
    {
      id: 'money.s138_notice_window',
      description: 'Sending the s.138 demand notice',
      reference: {
        act: 'Negotiable Instruments Act',
        year: 1881,
        provision: 's.138 proviso (b)',
        note: 'Thirty days from the cheque return memo. Miss it and the criminal remedy is lost.',
      },
      fromFact: 'bankMemoDate',
      durationDays: 30,
      appliesWhen: { op: 'isFalse', fact: 'demandNoticeSent' },
    },
    {
      id: 'money.s138_complaint_window',
      description: 'Filing the s.138 complaint',
      reference: {
        act: 'Negotiable Instruments Act',
        year: 1881,
        provision: 's.142(1)(b)',
        note: 'Thirty days after the drawer’s 15-day payment window closes. Shown from the memo date as the outer limit.',
      },
      fromFact: 'bankMemoDate',
      durationDays: 75,
      appliesWhen: null,
    },
    {
      id: 'money.civil_recovery',
      description: 'Suing civilly to recover the debt',
      reference: {
        act: 'Limitation Act',
        year: 1963,
        provision: 'Art.55',
        note: 'Three years from when the money became payable.',
      },
      fromFact: 'bankMemoDate',
      durationDays: 1095,
      appliesWhen: null,
    },
  ],

  redFlags: [
    {
      id: 'money.notice_not_sent',
      when: { op: 'isFalse', fact: 'demandNoticeSent' },
      message:
        'The 30-day window to send the demand notice cannot be extended. If it closes, the s.138 criminal route is gone for good and only a slower civil suit remains. Send the notice before anything else.',
      lawyerSpecialisation: 'Cheque dishonour (NI Act s.138)',
    },
  ],

  routes: [
    {
      id: 's138-notice',
      label: 'Send the s.138 demand notice',
      forum: 'To the drawer, by registered post with acknowledgement due',
      costInr: 2_000,
      costNote: 'Usually drafted by a lawyer for ₹1,000–3,000. Worth it — the wording matters.',
      minDays: 15,
      maxDays: 45,
      effort: 'low',
      availableWhen: { op: 'isFalse', fact: 'demandNoticeSent' },
    },
    {
      id: 's138-complaint',
      label: 'File a s.138 complaint',
      forum: 'Judicial Magistrate',
      costInr: 20_000,
      costNote:
        'Lawyer-led. Interim compensation of up to 20 per cent may be ordered under s.143A.',
      minDays: 180,
      maxDays: 730,
      effort: 'high',
      availableWhen: { op: 'isTrue', fact: 'haveReturnMemo' },
      unavailableReason:
        'The complaint needs the bank’s return memo as proof of dishonour. Ask your bank for a duplicate.',
    },
    {
      id: 'lok-adalat',
      label: 'Refer it to Lok Adalat',
      forum: 'District Legal Services Authority',
      costInr: 0,
      costNote: 'No court fee, and cheque cases are routinely settled here.',
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
        'The fast summary-suit route needs a written record of the debt. Without one this becomes an ordinary civil suit.',
    },
  ],

  artifacts: ['demand-notice', 'evidence-checklist', 'next-steps-timeline', 'lawyer-brief'],
};
