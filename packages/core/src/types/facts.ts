/** Facts a playbook needs before it can say anything useful. */

export type FactId = string;

export type FactKind = 'date' | 'money' | 'boolean' | 'text' | 'enum';

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
  /** Required facts block assessment; optional ones only refine it. */
  readonly required: boolean;
}
