import type { CaseFacts, DecisiveFact } from '../types/facts.js';
import type { Playbook } from '../types/playbook.js';

const isAnswered = (facts: CaseFacts, id: string): boolean =>
  facts[id] !== undefined && facts[id] !== null;

/**
 * The facts still standing between us and an assessment, in the order a person
 * would naturally be asked them.
 *
 * Only required facts block an assessment. Optional facts refine it, so they are
 * returned separately and can be skipped without stalling the conversation.
 */
export function findMissingFacts(playbook: Playbook, facts: CaseFacts): readonly DecisiveFact[] {
  return playbook.decisiveFacts.filter((fact) => fact.required && !isAnswered(facts, fact.id));
}

export function findOptionalGaps(playbook: Playbook, facts: CaseFacts): readonly DecisiveFact[] {
  return playbook.decisiveFacts.filter((fact) => !fact.required && !isAnswered(facts, fact.id));
}

/** The single next question to put to the user, or `undefined` when ready. */
export function nextQuestion(playbook: Playbook, facts: CaseFacts): DecisiveFact | undefined {
  return findMissingFacts(playbook, facts)[0];
}

export function isReadyToAssess(playbook: Playbook, facts: CaseFacts): boolean {
  return findMissingFacts(playbook, facts).length === 0;
}

export interface IntakeProgress {
  readonly answered: number;
  readonly total: number;
}

/**
 * How far through the required questions the user is.
 *
 * Counts only required facts: optional ones never block, so including them would
 * show a total the user can never reach.
 */
export function intakeProgress(playbook: Playbook, facts: CaseFacts): IntakeProgress {
  const required = playbook.decisiveFacts.filter((fact) => fact.required);
  const outstanding = required.filter((fact) => !isAnswered(facts, fact.id)).length;
  return { answered: required.length - outstanding, total: required.length };
}
