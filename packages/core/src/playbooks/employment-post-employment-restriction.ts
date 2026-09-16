import type { Playbook } from '../types/playbook.js';

/**
 * A non-compete, non-solicit or similar restriction imposed after employment
 * ends — very often buried in a separation agreement signed on the way out.
 *
 * The point people are almost never told: s.27 of the Contract Act voids
 * restraints on practising a lawful profession, and you cannot contract out of
 * it. Having signed the document does not make the restraint enforceable.
 *
 * The playbook deliberately separates the kinds of restriction, because they are
 * treated very differently: a blanket bar on joining a competitor is the
 * clearest case of a void restraint, client non-solicitation is genuinely
 * contested in the courts, and a confidentiality obligation is ordinarily
 * enforceable and is not a restraint of trade at all.
 */
export const employmentPostEmploymentRestriction: Playbook = {
  id: 'employment.post_employment_restriction',
  domain: 'employment',
  title: 'I have been made to sign a non-compete',
  summary:
    'A separation agreement or contract says you cannot join a competitor, approach clients or hire ex-colleagues after leaving.',
  examplePrompt:
    'I was laid off and made to sign a separation document saying I cannot work with the client directly or through a competitor for one year. Can they enforce that?',

  decisiveFacts: [
    {
      id: 'state',
      kind: 'text',
      question: 'Which state were you employed in?',
      why: 'It decides which High Court’s view applies, and courts differ most on client non-solicitation.',
      required: true,
    },
    {
      id: 'employmentEndDate',
      kind: 'date',
      question: 'When did your employment end, or when will it?',
      why: 'A restriction that operates only during employment is treated completely differently from one that bites after you leave.',
      required: true,
    },
    {
      id: 'restrictionType',
      kind: 'enum',
      question: 'What does the clause stop you doing?',
      why: 'This is the whole question. These are not treated alike — one of them is ordinarily enforceable and the others usually are not.',
      options: [
        'joining a competitor or working in the same field',
        'approaching or working with former clients',
        'hiring former colleagues',
        'using or disclosing confidential information',
        'several of these',
      ],
      required: true,
    },
    {
      id: 'restrictionMonths',
      kind: 'number',
      unit: 'months',
      question: 'For how many months does it apply?',
      why: 'Duration and breadth are what a court weighs if the clause is arguable rather than plainly void.',
      required: true,
    },
    {
      id: 'signedAtExit',
      kind: 'boolean',
      question: 'Did you sign it at the time you left, rather than when you joined?',
      why: 'A document signed under exit pressure, often to release a settlement, carries less weight — and either way you cannot contract out of s.27.',
      required: true,
    },
    {
      id: 'severanceAmountInr',
      kind: 'money',
      question: 'How much severance were you paid for signing? Enter 0 if none.',
      why: 'If the employer paid specifically for the restriction, they may try to claw it back — a separate question from whether the restraint binds you.',
      required: true,
    },
    {
      id: 'employerSentLegalNotice',
      kind: 'boolean',
      question: 'Has the employer sent you a legal notice about it?',
      why: 'A notice has a response window, and answering it badly can create problems that the clause itself never would.',
      required: true,
    },
    {
      id: 'blockingAJobOffer',
      kind: 'boolean',
      question: 'Is this blocking a job offer right now?',
      why: 'A live offer makes this time-critical, and it changes what is worth doing about it.',
      required: false,
    },
  ],

  derivedFacts: [],
  amountAtStakeFact: 'severanceAmountInr',
  lawyerSpecialisation: 'Employment law (restrictive covenants)',

  governingLaw: [
    {
      act: 'Indian Contract Act',
      year: 1872,
      provision: 's.27',
      note: 'Every agreement restraining anyone from exercising a lawful profession, trade or business is void to that extent. Indian courts apply this strictly to restraints operating after employment ends, and agreeing to the clause does not cure it — you cannot contract out of s.27.',
    },
    {
      act: 'Specific Relief Act',
      year: 1963,
      provision: 's.14',
      note: 'A contract of personal service cannot be specifically enforced, so no court will order you to keep working for, or stay away from working for, anyone.',
    },
    {
      act: 'Specific Relief Act',
      year: 1963,
      provision: 's.41(e)',
      note: 'An injunction cannot be granted to prevent the breach of a contract which would not itself be specifically enforced.',
    },
    {
      act: 'Indian Contract Act',
      year: 1872,
      provision: 's.74',
      note: 'Where the agreement fixes a sum payable on breach, only reasonable compensation is recoverable — a penalty figure is not enforceable as written.',
    },
    {
      act: 'Indian Contract Act',
      year: 1872,
      provision: 's.16',
      note: 'An agreement signed under undue influence is voidable. Relevant where a settlement was made conditional on signing at exit.',
    },
    {
      act: 'Limitation Act',
      year: 1963,
      provision: 'Art.113',
      note: 'Three years to bring a suit for a declaration, running from when the right to sue accrues.',
    },
  ],

  limitations: [
    {
      id: 'employment.restriction_declaration',
      description: 'Seeking a declaration that the clause does not bind you',
      reference: {
        act: 'Limitation Act',
        year: 1963,
        provision: 'Art.113',
        note: 'Three years from when the right to sue accrues.',
      },
      fromFact: 'employmentEndDate',
      durationDays: 1095,
      appliesWhen: null,
    },
  ],

  redFlags: [
    {
      id: 'employment.restriction_notice',
      when: { op: 'isTrue', fact: 'employerSentLegalNotice' },
      message:
        'A legal notice has a response window, and what you write back matters more than the clause itself. Do not reply off the cuff, and do not ignore it — get the reply drafted.',
      lawyerSpecialisation: 'Employment law (restrictive covenants)',
    },
    {
      id: 'employment.restriction_blocking_offer',
      when: { op: 'isTrue', fact: 'blockingAJobOffer' },
      message:
        'An offer on the table makes this urgent in a way the clause alone is not. Get the specific wording assessed quickly rather than letting the offer lapse over a clause that may well be void.',
      lawyerSpecialisation: 'Employment law (restrictive covenants)',
    },
  ],

  routes: [
    {
      id: 'get-clause-assessed',
      label: 'Have the exact wording assessed',
      forum: 'An employment lawyer, usually a single paid consultation',
      costInr: 3_000,
      costNote:
        'The answer turns entirely on how the clause is worded. An hour of advice is cheap next to turning down work you were free to take.',
      minDays: 1,
      maxDays: 14,
      effort: 'low',
    },
    {
      id: 'reply-to-notice',
      label: 'Reply to the legal notice',
      forum: 'To the employer’s counsel, in writing',
      costInr: 5_000,
      costNote: 'Usually lawyer-drafted. A careful reply frequently ends the matter.',
      minDays: 7,
      maxDays: 30,
      effort: 'medium',
      availableWhen: { op: 'isTrue', fact: 'employerSentLegalNotice' },
      unavailableReason: 'No notice has been sent, so there is nothing to reply to yet.',
    },
    {
      id: 'declaratory-suit',
      label: 'Ask a court to declare the clause void',
      forum: 'Civil court, suit for declaration',
      costInr: 40_000,
      costNote:
        'Rarely necessary. Most people simply proceed, because the burden sits on the employer to obtain an injunction — and under s.41(e) they usually cannot.',
      minDays: 180,
      maxDays: 1095,
      effort: 'high',
    },
    {
      id: 'negotiate-release',
      label: 'Negotiate a written release or narrowing',
      forum: 'Direct with the former employer',
      costInr: 0,
      costNote:
        'Often the quickest path where you want the relationship preserved, or where a client is nervous about the clause.',
      minDays: 7,
      maxDays: 45,
      effort: 'low',
    },
  ],

  artifacts: ['evidence-checklist', 'lawyer-brief', 'next-steps-timeline'],
};
