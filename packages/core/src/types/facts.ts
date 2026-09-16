/** Facts a playbook needs before it can say anything useful. */

export type FactId = string;

/**
 * `money` is rupees and is rendered as such. Plain quantities — months, days,
 * years — are `number`; conflating the two put a rupee sign on a duration.
 */
export type FactKind = 'date' | 'money' | 'number' | 'boolean' | 'text' | 'enum';

/** `null` means explicitly unknown; absent means never asked. */
export type FactValue = string | number | boolean | null;

export type CaseFacts = Readonly<Record<FactId, FactValue>>;

export interface DecisiveFact {
  readonly id: FactId;
  readonly kind: FactKind;
  /** Asked verbatim, so it must read like a person speaking. */
  readonly question: string;
  /** Shown alongside the question — the user should see why it is being asked. */
  readonly why: string;
  /** Permitted values when `kind` is `'enum'`. */
  readonly options?: readonly string[];
  /** Unit for a `number` fact, shown alongside the answer — "12 months". */
  readonly unit?: string;
  /** Required facts block assessment; optional ones only refine it. */
  readonly required: boolean;
}
