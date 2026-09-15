import {
  nextQuestion,
  type CaseAssessment,
  type CaseFacts,
  type DecisiveFact,
  type FactId,
  type FactValue,
  type Playbook,
} from '@nyaya-mitra/core';
import type {
  ClassifyResponse,
  CoveredSituation,
  InjectionFinding,
  PlaybookSummary,
} from '../api/types.js';

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
  /**
   * Facts answered here, in the order they were given.
   *
   * Facts extracted from the scenario are deliberately absent: "back" should
   * undo something the user did, not silently discard what they wrote.
   */
  readonly answerOrder: readonly FactId[];
  /** Populated on a miss, so the user is told what we do cover. */
  readonly covered: readonly CoveredSituation[];
  /**
   * The situation catalogue for the landing-page examples.
   *
   * `null` means the fetch has not settled yet, which is distinct from an empty
   * array meaning it settled with nothing. The UI reserves layout space while
   * this is null so the examples do not shove the page down when they arrive.
   */
  readonly catalogue: readonly PlaybookSummary[] | null;
}

export type SessionAction =
  | { readonly type: 'scenario-changed'; readonly scenario: string }
  | { readonly type: 'request-started' }
  | { readonly type: 'classified'; readonly response: ClassifyResponse }
  | { readonly type: 'answered'; readonly factId: FactId; readonly value: FactValue }
  | { readonly type: 'answer-cleared'; readonly factId: FactId }
  | { readonly type: 'assessed'; readonly assessment: CaseAssessment }
  | { readonly type: 'failed'; readonly message: string }
  | { readonly type: 'catalogue-loaded'; readonly catalogue: readonly PlaybookSummary[] }
  | { readonly type: 'match-rejected' }
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
  answerOrder: [],
  covered: [],
  catalogue: null,
};

function applyClassification(state: SessionState, response: ClassifyResponse): SessionState {
  if (response.kind === 'matched') {
    return {
      ...state,
      busy: false,
      stage: 'answering',
      playbook: response.playbook,
      facts: response.facts,
      answerOrder: [],
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
      return {
        ...state,
        facts: { ...state.facts, [action.factId]: action.value },
        answerOrder: state.answerOrder.includes(action.factId)
          ? state.answerOrder
          : [...state.answerOrder, action.factId],
      };
    case 'answer-cleared': {
      // Removing the fact is all it takes: the engine asks for the first
      // outstanding required fact, so a cleared answer becomes the next question.
      const { [action.factId]: _cleared, ...remaining } = state.facts;
      return {
        ...state,
        facts: remaining,
        answerOrder: state.answerOrder.filter((id) => id !== action.factId),
        stage: 'answering',
        assessment: null,
      };
    }
    case 'assessed':
      return { ...state, busy: false, stage: 'result', assessment: action.assessment };
    case 'failed':
      return { ...state, busy: false, stage: 'error', message: action.message };
    case 'catalogue-loaded':
      return { ...state, catalogue: action.catalogue };
    case 'match-rejected':
      // Back to the description, keeping what they wrote so they can reword it
      // rather than retype it. The matched playbook and any facts drawn from it
      // are discarded — they belong to a situation the user has just told us is
      // not theirs.
      return {
        ...state,
        stage: 'describe',
        playbook: null,
        facts: {},
        answerOrder: [],
        assessment: null,
        injectionFindings: [],
        message: null,
      };
    case 'restarted':
      // The catalogue is not part of the case, so it survives a restart.
      return { ...initialState, catalogue: state.catalogue };
  }
}

/** The question to put on screen, or undefined when the intake is complete. */
export function currentQuestion(state: SessionState): DecisiveFact | undefined {
  return state.playbook === null ? undefined : nextQuestion(state.playbook, state.facts);
}

export function isIntakeComplete(state: SessionState): boolean {
  return state.playbook !== null && currentQuestion(state) === undefined;
}
