import {
  nextQuestion,
  type CaseAssessment,
  type CaseFacts,
  type DecisiveFact,
  type FactId,
  type FactValue,
  type Playbook,
} from '@nyaya-mitra/core';
import type { ClassifyResponse, CoveredSituation, InjectionFinding } from '../api/types.js';

export type Stage = 'describe' | 'answering' | 'result' | 'refused' | 'error';

export interface SessionState {
  readonly stage: Stage;
  readonly busy: boolean;
  readonly scenario: string;
  readonly playbook: Playbook | null;
  readonly facts: CaseFacts;
  readonly assessment: CaseAssessment | null;
  /** User-facing explanation for a refusal or a failure. */
  readonly message: string | null;
  readonly injectionFindings: readonly InjectionFinding[];
  /** Populated on a miss, so the user is told what we do cover. */
  readonly covered: readonly CoveredSituation[];
}

export type SessionAction =
  | { readonly type: 'scenario-changed'; readonly scenario: string }
  | { readonly type: 'request-started' }
  | { readonly type: 'classified'; readonly response: ClassifyResponse }
  | { readonly type: 'answered'; readonly factId: FactId; readonly value: FactValue }
  | { readonly type: 'assessed'; readonly assessment: CaseAssessment }
  | { readonly type: 'failed'; readonly message: string }
  | { readonly type: 'restarted' };

export const initialState: SessionState = {
  stage: 'describe',
  busy: false,
  scenario: '',
  playbook: null,
  facts: {},
  assessment: null,
  message: null,
  injectionFindings: [],
  covered: [],
};

function applyClassification(state: SessionState, response: ClassifyResponse): SessionState {
  if (response.kind === 'matched') {
    return {
      ...state,
      busy: false,
      stage: 'answering',
      playbook: response.playbook,
      facts: response.facts,
      injectionFindings: response.injectionFindings,
      message: null,
    };
  }
  return {
    ...state,
    busy: false,
    stage: response.kind === 'out-of-scope' ? 'refused' : 'error',
    message: response.reason,
    covered: response.kind === 'unrecognised' ? response.covered : [],
  };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'scenario-changed':
      return { ...state, scenario: action.scenario };
    case 'request-started':
      return { ...state, busy: true, message: null };
    case 'classified':
      return applyClassification(state, action.response);
    case 'answered':
      return { ...state, facts: { ...state.facts, [action.factId]: action.value } };
    case 'assessed':
      return { ...state, busy: false, stage: 'result', assessment: action.assessment };
    case 'failed':
      return { ...state, busy: false, stage: 'error', message: action.message };
    case 'restarted':
      return initialState;
  }
}

/** The question to put on screen, or undefined when the intake is complete. */
export function currentQuestion(state: SessionState): DecisiveFact | undefined {
  return state.playbook === null ? undefined : nextQuestion(state.playbook, state.facts);
}

export function isIntakeComplete(state: SessionState): boolean {
  return state.playbook !== null && currentQuestion(state) === undefined;
}
