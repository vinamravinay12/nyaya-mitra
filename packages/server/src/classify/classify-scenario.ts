import type { CaseFacts, Playbook } from '@nyaya-mitra/core';
import type { LlmClient } from '../llm/llm-client.js';
import { buildClassificationPrompt } from '../prompts/build-classification-prompt.js';
import { parseJsonResponse } from '../prompts/parse-json-response.js';
import { classificationSchema } from '../validation/schemas.js';
import {
  detectPromptInjection,
  type InjectionFinding,
} from '../security/detect-prompt-injection.js';

/** Below this the match is too weak to present as an answer. */
export const MIN_CONFIDENCE = 0.3;

/** What the engine can handle, sent back so a miss can say so constructively. */
export interface CoveredSituation {
  readonly id: string;
  readonly title: string;
}

export type ClassificationOutcome =
  | { readonly kind: 'out-of-scope'; readonly reason: string }
  | {
      readonly kind: 'unrecognised';
      readonly reason: string;
      readonly covered: readonly CoveredSituation[];
    }
  | {
      readonly kind: 'matched';
      readonly playbook: Playbook;
      readonly confidence: number;
      readonly facts: CaseFacts;
      readonly injectionFindings: readonly InjectionFinding[];
    };

/**
 * Keeps only facts the chosen playbook actually asks for.
 *
 * A model will happily invent plausible-sounding fields. Anything not declared
 * by the playbook is dropped rather than carried into the assessment.
 */
export function retainDeclaredFacts(playbook: Playbook, facts: CaseFacts): CaseFacts {
  const declared = new Set([
    ...playbook.decisiveFacts.map((fact) => fact.id),
    ...playbook.derivedFacts,
  ]);
  return Object.fromEntries(Object.entries(facts).filter(([key]) => declared.has(key)));
}

export async function classifyScenario(
  llm: LlmClient,
  playbooks: readonly Playbook[],
  scenario: string,
): Promise<ClassificationOutcome> {
  const raw = await llm.complete(buildClassificationPrompt(playbooks, scenario));
  const parsed = classificationSchema.safeParse(parseJsonResponse(raw));
  const covered = playbooks.map(({ id, title }) => ({ id, title }));

  if (!parsed.success) {
    return {
      kind: 'unrecognised',
      reason: 'We could not interpret that. Try describing what happened in a sentence or two.',
      covered,
    };
  }

  const result = parsed.data;
  if (result.outOfScope) {
    return {
      kind: 'out-of-scope',
      reason:
        result.outOfScopeReason ??
        'This is outside what we can help with. Please speak to a qualified lawyer.',
    };
  }

  // A hallucinated id must never reach the engine: the registry is the authority.
  const playbook = playbooks.find((candidate) => candidate.id === result.playbookId);
  if (playbook === undefined || result.confidence < MIN_CONFIDENCE) {
    return {
      kind: 'unrecognised',
      reason:
        'We could not match what you described to a situation we cover. These are the areas we can help with today — if yours is not among them, a lawyer or your nearest Legal Services Authority can point you to the right place.',
      covered,
    };
  }

  return {
    kind: 'matched',
    playbook,
    confidence: result.confidence,
    facts: retainDeclaredFacts(playbook, result.extractedFacts),
    injectionFindings: detectPromptInjection(scenario),
  };
}
