import type { CaseFacts, Playbook } from '@nyaya-mitra/core';

export interface DocumentFinding {
  readonly clause: string;
  readonly why: string;
}

export interface InjectionFinding {
  readonly rule: string;
  readonly excerpt: string;
}

export interface CoveredSituation {
  readonly id: string;
  readonly title: string;
}

/** The catalogue entry the landing page renders. */
export interface PlaybookSummary extends CoveredSituation {
  readonly domain: string;
  readonly summary: string;
  readonly examplePrompt: string;
}

export type ClassifyResponse =
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
      /** Optional on the wire: a response without it must not break the page. */
      readonly documentFindings?: readonly DocumentFinding[];
    };

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
