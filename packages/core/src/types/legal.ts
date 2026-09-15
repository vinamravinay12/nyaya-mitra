/** References into the statute corpus, and the clocks that run against a claim. */

import type { Condition } from './condition.js';
import type { FactId } from './facts.js';

export interface LegalReference {
  /** Short act name as it appears in the corpus index, e.g. 'Limitation Act'. */
  readonly act: string;
  readonly year: number;
  /** Section, article or rule, e.g. 's.27' or 'Art.55'. */
  readonly provision: string;
  /** One plain-language line on what it does for this situation. */
  readonly note: string;
  /** True when the governing text differs by state and the state must be known. */
  readonly stateSpecific?: boolean;
}

/**
 * A deadline that can extinguish a remedy entirely. Computed from a date the
 * user supplies, which is why `fromFact` points at a `kind: 'date'` fact.
 */
export interface LimitationRule {
  readonly id: string;
  readonly description: string;
  readonly reference: LegalReference;
  readonly fromFact: FactId;
  readonly durationDays: number;
  /**
   * When this clock is relevant at all. `null` means always.
   *
   * Without this, a playbook shows every deadline it knows about to every user
   * — including remedies their facts rule out, which is noise at best and
   * needlessly alarming at worst.
   */
  readonly appliesWhen: Condition | null;
}
