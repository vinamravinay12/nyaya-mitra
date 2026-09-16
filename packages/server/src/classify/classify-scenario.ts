import {
  parseIsoDate,
  type CaseFacts,
  type DecisiveFact,
  type FactValue,
  type Playbook,
} from '@nyaya-mitra/core';
import type { LlmClient } from '../llm/llm-client.js';
import { buildClassificationPrompt } from '../prompts/build-classification-prompt.js';
import { parseJsonResponse } from '../prompts/parse-json-response.js';
import { classificationSchema } from '../validation/schemas.js';
import {
  readDocumentFindings,
  readDocumentWarnings,
  type DocumentFinding,
} from './read-advisory.js';
import type { UploadedDocument } from '../documents/document.js';
import { toPublicPlaybook, type PublicPlaybook } from '../views/public-assessment.js';
import {
  detectPromptInjection,
  type InjectionFinding,
} from '../security/detect-prompt-injection.js';

/**
 * Below this the match is too weak to present as an answer.
 *
 * Raised from 0.3 after the classifier stretched an airline refund into the
 * defective-purchase playbook at 0.8. A wrong match is expensive — the user is
 * walked through an irrelevant questionnaire and shown deadlines that do not
 * apply — while a miss costs them one screen that says what we do cover.
 */
export const MIN_CONFIDENCE = 0.6;

/** What the engine can handle, sent back so a miss can say so constructively. */
export type { DocumentFinding };

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
      readonly playbook: PublicPlaybook;
      readonly confidence: number;
      readonly facts: CaseFacts;
      readonly injectionFindings: readonly InjectionFinding[];
      readonly documentFindings: readonly DocumentFinding[];
    };

/**
 * Whether an extracted value is usable for the fact it claims to answer.
 *
 * Checking the field name is not enough. A model will answer an enum question
 * with its own wording — "non-compete" instead of one of the listed options — and
 * that value then matches no condition in the playbook, so routes and red flags
 * silently never fire while the question shows as answered. Dropping it means
 * the user is simply asked properly.
 */
export function isValidForFact(fact: DecisiveFact, value: FactValue): boolean {
  switch (fact.kind) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'money':
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'date':
      return typeof value === 'string' && parseIsoDate(value) !== undefined;
    case 'enum':
      return typeof value === 'string' && (fact.options ?? []).includes(value);
    case 'text':
      return typeof value === 'string' && value.trim().length > 0;
  }
}

/**
 * Keeps only facts the chosen playbook asks for, and only where the value is
 * actually usable for that fact.
 *
 * A model will happily invent plausible-sounding fields and plausible-sounding
 * values. Both are dropped rather than carried into the assessment.
 */
export function retainDeclaredFacts(playbook: Playbook, facts: CaseFacts): CaseFacts {
  const declared = new Map(playbook.decisiveFacts.map((fact) => [fact.id, fact]));
  const derived = new Set(playbook.derivedFacts);

  return Object.fromEntries(
    Object.entries(facts).filter(([key, value]) => {
      const fact = declared.get(key);
      return fact === undefined ? derived.has(key) : isValidForFact(fact, value);
    }),
  );
}

export async function classifyScenario(
  llm: LlmClient,
  playbooks: readonly Playbook[],
  scenario: string,
  document?: UploadedDocument,
): Promise<ClassificationOutcome> {
  const prompt = buildClassificationPrompt(playbooks, scenario, document !== undefined);
  const raw = await llm.complete(prompt, document);
  const body = parseJsonResponse(raw);
  const parsed = classificationSchema.safeParse(body);
  // Read separately and leniently: these must never invalidate a good match.
  const advisory = body as { documentFindings?: unknown; documentWarnings?: unknown } | undefined;
  const findings = readDocumentFindings(advisory?.documentFindings);
  const warnings = readDocumentWarnings(advisory?.documentWarnings);
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
    playbook: toPublicPlaybook(playbook),
    confidence: result.confidence,
    facts: retainDeclaredFacts(playbook, result.extractedFacts),
    // The scenario is the user's own words. The document was written by the
    // other side, so its quoted clauses are screened too.
    injectionFindings: [
      ...detectPromptInjection(scenario),
      ...findings.flatMap((finding) => detectPromptInjection(finding.clause)),
      // The model is asked to report text in the document aimed at an assistant.
      // It already refuses to act on it; this is so the user is told it was there.
      ...warnings.map((excerpt) => ({ rule: 'document-instruction', excerpt })),
    ],
    documentFindings: document === undefined ? [] : findings,
  };
}
