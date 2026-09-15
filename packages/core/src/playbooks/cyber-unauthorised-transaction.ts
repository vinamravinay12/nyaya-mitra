import type { Playbook } from '../types/playbook.js';

/**
 * Money taken from an account without authorisation — UPI fraud, card misuse,
 * net-banking compromise.
 *
 * This is the sharpest deadline in the whole system. Under the RBI's limited
 * liability framework, reporting within three working days can mean zero
 * liability; past that, the customer starts bearing part of the loss. The clock
 * here counts calendar days, which is deliberately conservative — it will never
 * tell someone they have longer than they really do.
 */
export const cyberUnauthorisedTransaction: Playbook = {
  id: 'cyber-fraud.unauthorised_transaction',
  domain: 'cyber-fraud',
  title: 'Money was taken from my account without my permission',
  summary: 'An unauthorised UPI, card or net-banking transaction has debited your account.',

  decisiveFacts: [
    {
      id: 'transactionDate',
      kind: 'date',
      question: 'When did the transaction happen?',
      why: 'Reporting within three working days can leave you with zero liability. This is the most time-sensitive thing here.',
      required: true,
    },
    {
      id: 'amountLostInr',
      kind: 'money',
      question: 'How much was taken?',
      why: 'It decides whether the Ombudsman route is worth it and what a bank is likely to settle.',
      required: true,
    },
    {
      id: 'reportedToBank',
      kind: 'boolean',
      question: 'Have you reported it to your bank yet?',
      why: 'Everything depends on this. The bank’s liability framework only starts once you have told them.',
      required: true,
    },
    {
      id: 'reportedToCybercrimePortal',
      kind: 'boolean',
      question: 'Have you reported it on cybercrime.gov.in or the 1930 helpline?',
      why: 'Reporting early gives the best chance of the money being frozen before it moves on.',
      required: true,
    },
    {
      id: 'sharedCredentials',
      kind: 'boolean',
      question: 'Did you share an OTP, PIN or password with anyone?',
      why: 'It changes how liability is assessed. Be honest here — it does not end your claim, but hiding it will.',
      required: true,
    },
    {
      id: 'bankResolvedIt',
      kind: 'boolean',
      question: 'Has the bank resolved your complaint?',
      why: 'The Ombudsman only takes a case once the bank has failed to resolve it.',
      required: false,
    },
  ],

  derivedFacts: [],
  amountAtStakeFact: 'amountLostInr',
  lawyerSpecialisation: 'Banking and cyber law',

  governingLaw: [
    {
      act: 'RBI Customer Protection Circular',
      year: 2017,
      provision: 'Limiting Liability of Customers in Unauthorised Electronic Banking Transactions',
      note: 'Where the loss is due to third-party breach and the customer reports within three working days, customer liability is zero.',
    },
    {
      act: 'Information Technology Act',
      year: 2000,
      provision: 's.43 and s.66',
      note: 'Make unauthorised access to and dishonest use of a computer resource actionable, with compensation payable to the affected person.',
    },
    {
      act: 'Information Technology Act',
      year: 2000,
      provision: 's.66C and s.66D',
      note: 'Cover identity theft and cheating by personation using a computer resource.',
    },
    {
      act: 'Bharatiya Nyaya Sanhita',
      year: 2023,
      provision: 's.318',
      note: 'Cheating. The BNS replaced the Indian Penal Code from 1 July 2024, so older references to IPC s.420 are out of date.',
    },
    {
      act: 'RBI Integrated Ombudsman Scheme',
      year: 2021,
      provision: 'cl.10',
      note: 'A complaint can go to the Ombudsman once the bank has rejected it or failed to reply within 30 days.',
    },
  ],

  limitations: [
    {
      id: 'cyber.zero_liability_window',
      description: 'Reporting to the bank for zero liability',
      reference: {
        act: 'RBI Customer Protection Circular',
        year: 2017,
        provision: 'Limiting Liability of Customers',
        note: 'Three working days from receiving the bank’s communication about the transaction.',
      },
      fromFact: 'transactionDate',
      durationDays: 3,
      appliesWhen: { op: 'isFalse', fact: 'reportedToBank' },
    },
    {
      id: 'cyber.ombudsman_window',
      description: 'Taking the complaint to the RBI Ombudsman',
      reference: {
        act: 'RBI Integrated Ombudsman Scheme',
        year: 2021,
        provision: 'cl.10',
        note: 'Within one year of the bank’s reply, or of the 30 days expiring.',
      },
      fromFact: 'transactionDate',
      durationDays: 365,
      appliesWhen: null,
    },
  ],

  redFlags: [
    {
      id: 'cyber.not_reported_to_bank',
      when: { op: 'isFalse', fact: 'reportedToBank' },
      message:
        'Report this to your bank in writing today. Under the RBI framework, reporting within three working days can mean you bear none of the loss — and every day after that increases what you may have to bear yourself.',
      lawyerSpecialisation: 'Banking and cyber law',
    },
    {
      id: 'cyber.not_reported_to_police',
      when: { op: 'isFalse', fact: 'reportedToCybercrimePortal' },
      message:
        'Also report it on cybercrime.gov.in or call 1930. The earlier this is logged, the better the chance of the money being frozen before it is withdrawn.',
      lawyerSpecialisation: 'Banking and cyber law',
    },
  ],

  routes: [
    {
      id: 'report-to-bank',
      label: 'Report to your bank in writing',
      forum: 'Your bank’s fraud helpline, followed by email',
      costInr: 0,
      costNote: 'Free. Keep the acknowledgement — it fixes your reporting date.',
      minDays: 1,
      maxDays: 90,
      effort: 'low',
      availableWhen: { op: 'isFalse', fact: 'reportedToBank' },
    },
    {
      id: 'cybercrime-portal',
      label: 'File a cybercrime report',
      forum: 'cybercrime.gov.in, or the 1930 helpline',
      costInr: 0,
      costNote: 'Free.',
      minDays: 1,
      maxDays: 60,
      effort: 'low',
      availableWhen: { op: 'isFalse', fact: 'reportedToCybercrimePortal' },
    },
    {
      id: 'rbi-ombudsman',
      label: 'Escalate to the RBI Ombudsman',
      forum: 'RBI Integrated Ombudsman Scheme, cms.rbi.org.in',
      costInr: 0,
      costNote: 'Free, and designed to be used without a lawyer.',
      minDays: 30,
      maxDays: 120,
      effort: 'medium',
      availableWhen: { op: 'isFalse', fact: 'bankResolvedIt' },
      unavailableReason:
        'The Ombudsman only steps in where the bank has not resolved your complaint.',
    },
  ],

  artifacts: ['evidence-checklist', 'next-steps-timeline', 'demand-notice'],
};
