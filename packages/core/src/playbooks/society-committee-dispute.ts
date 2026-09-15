import type { Playbook } from '../types/playbook.js';

/**
 * Dispute with a housing society or RWA managing committee — arbitrary charges,
 * withheld NOCs, denied facilities, or accounts that are never shown.
 *
 * Co-operative society law is state law and varies more than almost anything
 * else here, so this playbook leans on the Registrar route, which exists in
 * every state, rather than naming one state's court.
 */
export const societyCommitteeDispute: Playbook = {
  id: 'society.committee_dispute',
  domain: 'housing-society',
  title: 'My housing society is treating me unfairly',
  summary:
    'Your society or RWA is charging arbitrarily, withholding an NOC, denying facilities, or refusing to show accounts.',
  examplePrompt:
    'My housing society has suddenly doubled my maintenance charge without any meeting, and they are refusing to give me an NOC to sell my flat.',

  decisiveFacts: [
    {
      id: 'state',
      kind: 'text',
      question: 'Which state is the society in?',
      why: 'Co-operative society law is state law, and it decides which Registrar and which forum handle this.',
      required: true,
    },
    {
      id: 'issueType',
      kind: 'enum',
      question: 'What is the society doing?',
      why: 'Each of these has a different route, and some are much faster than others.',
      options: [
        'charging arbitrarily',
        'withholding an NOC',
        'denying facilities or access',
        'refusing to show accounts',
        'penalising or targeting me',
      ],
      required: true,
    },
    {
      id: 'issueStartDate',
      kind: 'date',
      question: 'Roughly when did this start?',
      why: 'It starts the limitation clock on a society dispute.',
      required: true,
    },
    {
      id: 'amountDisputedInr',
      kind: 'money',
      question: 'How much money is in dispute? Enter 0 if none.',
      why: 'It decides whether the Registrar route or a consumer complaint is more proportionate.',
      required: true,
    },
    {
      id: 'isMember',
      kind: 'boolean',
      question: 'Are you a registered member of the society?',
      why: 'Members can use the co-operative dispute machinery. Tenants usually have to go through the owner.',
      required: true,
    },
    {
      id: 'writtenComplaintSent',
      kind: 'boolean',
      question: 'Have you written to the managing committee?',
      why: 'The Registrar will expect you to have raised it internally first.',
      required: true,
    },
    {
      id: 'duesPaidUpToDate',
      kind: 'boolean',
      question: 'Are your maintenance dues paid up to date?',
      why: 'Arrears are the society’s usual answer to any complaint. Being paid up removes it — pay under protest if you dispute the amount.',
      required: true,
    },
    {
      id: 'generalBodyResolution',
      kind: 'boolean',
      question: 'Was the decision taken at a general body meeting?',
      why: 'A charge imposed by the committee alone, without the general body, is far easier to challenge.',
      required: false,
    },
  ],

  derivedFacts: [],
  amountAtStakeFact: 'amountDisputedInr',
  lawyerSpecialisation: 'Co-operative society and property law',

  governingLaw: [
    {
      act: 'Co-operative Societies Act',
      year: 1912,
      provision: 'state legislation',
      note: 'Every state has its own Co-operative Societies Act and rules. They govern how a society may levy charges, hold meetings and keep accounts.',
      stateSpecific: true,
    },
    {
      act: 'Constitution of India',
      year: 1950,
      provision: 'Art.243ZH–243ZT',
      note: 'The 97th Amendment set out principles for co-operative societies, including member rights to information and regular elections.',
    },
    {
      act: 'Consumer Protection Act',
      year: 2019,
      provision: 's.2(42)',
      note: 'A society providing services to its members can be treated as a service provider, which opens the consumer forum for deficiency in service.',
    },
    {
      act: 'Real Estate (Regulation and Development) Act',
      year: 2016,
      provision: 's.11(4)(e)',
      note: 'Where the society has not yet been formed or handed over, obligations may still sit with the promoter rather than the residents.',
    },
    {
      act: 'Limitation Act',
      year: 1963,
      provision: 'Art.113',
      note: 'Three years for a suit for which no specific period is provided, running from when the right to sue accrues.',
    },
  ],

  limitations: [
    {
      id: 'society.dispute_claim',
      description: 'Raising the dispute formally',
      reference: {
        act: 'Limitation Act',
        year: 1963,
        provision: 'Art.113',
        note: 'Three years from when the right to sue accrued. State co-operative Acts may set shorter periods for specific disputes.',
      },
      fromFact: 'issueStartDate',
      durationDays: 1095,
      appliesWhen: null,
    },
  ],

  redFlags: [],

  routes: [
    {
      id: 'written-to-committee',
      label: 'Write to the managing committee',
      forum: 'Society secretary and chairperson, by email and letter',
      costInr: 0,
      costNote: 'Free. Ask for the resolution and the accounts the charge is based on.',
      minDays: 7,
      maxDays: 30,
      effort: 'low',
      availableWhen: { op: 'isFalse', fact: 'writtenComplaintSent' },
    },
    {
      id: 'registrar-complaint',
      label: 'Complain to the Registrar of Co-operative Societies',
      forum: 'Deputy or Assistant Registrar for your area',
      costInr: 500,
      costNote:
        'Nominal fee. The Registrar can direct the society and order an inquiry into its accounts.',
      minDays: 45,
      maxDays: 180,
      effort: 'medium',
      availableWhen: { op: 'isTrue', fact: 'isMember' },
      unavailableReason:
        'The co-operative dispute machinery is for members. As a tenant you will usually need the flat owner to raise it, or to go through the consumer route.',
    },
    {
      id: 'consumer-commission',
      label: 'File a consumer complaint',
      forum: 'District Consumer Commission, online via e-Daakhil',
      costInr: 200,
      costNote:
        'Low filing fee. Works where the society has failed to provide a service you pay for.',
      minDays: 90,
      maxDays: 270,
      effort: 'medium',
    },
    {
      id: 'civil-injunction',
      label: 'Apply for an injunction',
      forum: 'Civil court',
      costInr: 25_000,
      costNote:
        'Lawyer-led. Worth it mainly where access or an NOC is being blocked and a deal is at risk.',
      minDays: 30,
      maxDays: 730,
      effort: 'high',
    },
  ],

  artifacts: ['demand-notice', 'evidence-checklist', 'next-steps-timeline', 'lawyer-brief'],
};
