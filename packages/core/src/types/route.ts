/** The practical options open to a user, with what each actually costs them. */

import type { Condition } from './condition.js';

export type Effort = 'low' | 'medium' | 'high';

export interface Route {
  readonly id: string;
  readonly label: string;
  /** Where this happens, e.g. 'District Consumer Commission (e-Daakhil)'. */
  readonly forum: string;
  /** Indicative out-of-pocket rupees; 0 for routes the user can run themselves. */
  readonly costInr: number;
  readonly costNote: string;
  readonly minDays: number;
  readonly maxDays: number;
  readonly effort: Effort;
  /** Shown only when this holds. Absent means always applicable. */
  readonly availableWhen?: Condition;
  /** Surfaced as an explicit "not this one, and here is why" when unavailable. */
  readonly unavailableReason?: string;
}
