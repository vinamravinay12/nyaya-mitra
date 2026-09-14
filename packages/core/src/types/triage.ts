/** Whether this is something the user can handle alone — and how urgently. */

export type TriageBand = 'self-serve' | 'guided' | 'lawyer-recommended' | 'urgent';

export interface TriageReason {
  readonly code: string;
  /** Plain-language justification shown to the user, never a bare score. */
  readonly message: string;
}

export interface TriageResult {
  readonly band: TriageBand;
  readonly reasons: readonly TriageReason[];
  /** Populated for 'lawyer-recommended' and 'urgent'. */
  readonly lawyerSpecialisation?: string;
}
