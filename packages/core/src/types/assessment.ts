import type { DecisiveFact } from './facts.js';
import type { LimitationAssessment } from './limitation.js';
import type { Playbook } from './playbook.js';
import type { RouteAvailability } from './route-availability.js';
import type { TriageResult } from './triage.js';

/** Everything the engine can say about a case at its current level of detail. */
export interface CaseAssessment {
  readonly playbook: Playbook;
  /** False while required facts are outstanding; the rest is provisional until then. */
  readonly ready: boolean;
  readonly missingFacts: readonly DecisiveFact[];
  readonly optionalGaps: readonly DecisiveFact[];
  readonly limitations: readonly LimitationAssessment[];
  readonly triage: TriageResult;
  readonly routes: readonly RouteAvailability[];
  readonly governingLaw: Playbook['governingLaw'];
}
