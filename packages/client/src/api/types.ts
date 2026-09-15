import type { CaseFacts, Playbook } from '@nyaya-mitra/core';

export interface InjectionFinding {
  readonly rule: string;
  readonly excerpt: string;
}

export interface CoveredSituation {
  readonly id: string;
  readonly title: string;
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
    };

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
