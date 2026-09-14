/**
 * A Situation Playbook: everything the engine knows about one kind of everyday
 * legal problem, expressed as data.
 *
 * The model classifies a scenario into a playbook and extracts facts for it. It
 * never supplies the governing law, the deadlines or the routes — those come
 * from here, so they can be reviewed by a human and cited with confidence.
 */
import type { Condition } from './condition.js';
import type { DecisiveFact, FactId } from './facts.js';
import type { LegalReference, LimitationRule } from './legal.js';
import type { Route } from './route.js';

export type Domain = 'rental' | 'employment' | 'consumer' | 'cyber-fraud' | 'money-recovery';

export type ArtifactKind =
  'demand-notice' | 'evidence-checklist' | 'lawyer-brief' | 'next-steps-timeline';

/** A fact pattern that overrides normal triage and escalates immediately. */
export interface RedFlag {
  readonly id: string;
  readonly when: Condition;
  /** Shown to the user as the reason for escalation. */
  readonly message: string;
  readonly lawyerSpecialisation: string;
}

export interface Playbook {
  readonly id: string;
  readonly domain: Domain;
  readonly title: string;
  /** One line the user should recognise their own situation in. */
  readonly summary: string;
  readonly decisiveFacts: readonly DecisiveFact[];
  /** Facts the engine computes rather than asks — e.g. whether a state adopted an Act. */
  readonly derivedFacts: readonly FactId[];
  readonly governingLaw: readonly LegalReference[];
  readonly limitations: readonly LimitationRule[];
  readonly redFlags: readonly RedFlag[];
  readonly routes: readonly Route[];
  readonly artifacts: readonly ArtifactKind[];
}
