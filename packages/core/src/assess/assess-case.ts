import { findMissingFacts, findOptionalGaps } from '../facts/find-missing-facts.js';
import { assessLimitations } from '../limitation/compute-limitation.js';
import { selectRoutes } from '../routes/select-routes.js';
import { scoreTriage } from '../triage/score-triage.js';
import type { CaseAssessment } from '../types/assessment.js';
import type { CaseFacts } from '../types/facts.js';
import type { Playbook } from '../types/playbook.js';

/**
 * Runs the whole engine over a case.
 *
 * Deliberately callable against an incomplete case: red flags and deadlines are
 * the things a user most needs to hear early, so we surface them as soon as the
 * relevant fact arrives rather than waiting for the questionnaire to finish.
 * `ready` tells the caller whether the picture is complete.
 *
 * `today` is injected rather than read from the clock so an assessment is
 * reproducible — the same case and the same date always give the same answer.
 */
export function assessCase(playbook: Playbook, facts: CaseFacts, today: string): CaseAssessment {
  const limitations = assessLimitations(playbook.limitations, facts, today);
  const missingFacts = findMissingFacts(playbook, facts);

  return {
    playbook,
    ready: missingFacts.length === 0,
    missingFacts,
    optionalGaps: findOptionalGaps(playbook, facts),
    limitations,
    triage: scoreTriage(playbook, facts, limitations),
    routes: selectRoutes(playbook, facts),
    governingLaw: playbook.governingLaw,
  };
}
