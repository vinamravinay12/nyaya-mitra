/** The outcome of running a limitation clock against the facts of a case. */

import type { LimitationRule } from './legal.js';

export type LimitationStatus = 'expired' | 'critical' | 'approaching' | 'comfortable';

export type LimitationAssessment =
  | {
      readonly rule: LimitationRule;
      readonly status: 'unknown';
      /** Why the clock could not be run — shown so the user can supply the date. */
      readonly reason: string;
    }
  | {
      readonly rule: LimitationRule;
      readonly status: LimitationStatus;
      readonly deadline: string;
      /** Negative once the deadline has passed. */
      readonly daysRemaining: number;
    };
