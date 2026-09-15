import type { Playbook } from '../types/playbook.js';

/**
 * Goods or a service that failed, and the seller will not refund or repair.
 *
 * e-Daakhil made consumer filing genuinely self-serve, so for most everyday
 * amounts the honest answer is that no lawyer is needed.
 */
export const consumerDefectivePurchase: Playbook = {
  id: 'consumer.defective_purchase',
  domain: 'consumer',
  title: 'What I bought is faulty and they will not refund it',
  summary:
    'A product or service was defective and the seller is refusing a refund, repair or replacement.',

  decisiveFacts: [
    {
      id: 'purchaseDate',
      kind: 'date',
      question: 'When did you buy it?',
      why: 'A consumer complaint must be filed within two years of the problem arising.',
      required: true,
    },
    {
      id: 'amountPaidInr',
      kind: 'money',
      question: 'How much did you pay?',
      why: 'The amount decides which Commission can hear it — District, State or National.',
      required: true,
    },
    {
      id: 'boughtOnline',
      kind: 'boolean',
      question: 'Did you buy it online?',
      why: 'The E-Commerce Rules add duties on the platform itself, not only the seller.',
      required: true,
    },
    {
      id: 'haveProofOfPurchase',
      kind: 'boolean',
      question: 'Do you have an invoice, bill or order confirmation?',
      why: 'It is the single most important document. Without it the claim gets much harder.',
      required: true,
    },
    {
      id: 'writtenComplaintSent',
      kind: 'boolean',
      question: 'Have you complained to the seller in writing?',
      why: 'The Commission expects you to have given the seller a chance to fix it first.',
      required: true,
    },
    {
      id: 'sellerResponded',
      kind: 'boolean',
      question: 'Did they respond?',
      why: 'Silence is itself evidence of deficiency, and it strengthens your complaint.',
      required: false,
    },
  ],

  derivedFacts: [],
  amountAtStakeFact: 'amountPaidInr',
  lawyerSpecialisation: 'Consumer law',

  governingLaw: [
    {
      act: 'Consumer Protection Act',
      year: 2019,
      provision: 's.2(11)',
      note: 'Defines deficiency in service — the failure to perform to the standard promised or required.',
    },
    {
      act: 'Consumer Protection Act',
      year: 2019,
      provision: 's.34',
      note: 'A District Commission hears complaints where the value does not exceed ₹50 lakh.',
    },
    {
      act: 'Consumer Protection Act',
      year: 2019,
      provision: 's.69',
      note: 'A complaint must be filed within two years of the cause of action arising.',
    },
    {
      act: 'Consumer Protection (E-Commerce) Rules',
      year: 2020,
      provision: 'r.4–r.6',
      note: 'Put duties on marketplaces and sellers, including published return and refund terms and a grievance officer.',
    },
  ],

  limitations: [
    {
      id: 'consumer.complaint_window',
      description: 'Filing a consumer complaint',
      reference: {
        act: 'Consumer Protection Act',
        year: 2019,
        provision: 's.69',
        note: 'Two years from the cause of action; a Commission may condone delay for sufficient cause.',
      },
      fromFact: 'purchaseDate',
      durationDays: 730,
      appliesWhen: null,
    },
  ],

  redFlags: [],

  routes: [
    {
      id: 'written-complaint',
      label: 'Complain to the seller in writing',
      forum: 'Seller or the platform’s grievance officer',
      costInr: 0,
      costNote: 'Free, and it creates the paper trail the Commission expects.',
      minDays: 7,
      maxDays: 30,
      effort: 'low',
      availableWhen: { op: 'isFalse', fact: 'writtenComplaintSent' },
    },
    {
      id: 'national-consumer-helpline',
      label: 'Raise it with the National Consumer Helpline',
      forum: 'NCH, 1915 or consumerhelpline.gov.in',
      costInr: 0,
      costNote: 'Free mediation. Many sellers settle at this stage.',
      minDays: 7,
      maxDays: 45,
      effort: 'low',
    },
    {
      id: 'district-commission',
      label: 'File a consumer complaint',
      forum: 'District Consumer Commission, online via e-Daakhil',
      costInr: 200,
      costNote: 'Filing fee scales with the claim and is a few hundred rupees at this level.',
      minDays: 90,
      maxDays: 270,
      effort: 'medium',
      availableWhen: { op: 'isTrue', fact: 'haveProofOfPurchase' },
      unavailableReason:
        'You will struggle to file without an invoice or order confirmation. Try to retrieve it from your email or bank statement first.',
    },
  ],

  artifacts: ['demand-notice', 'evidence-checklist', 'next-steps-timeline'],
};
