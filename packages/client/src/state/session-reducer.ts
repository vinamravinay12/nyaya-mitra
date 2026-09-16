import { nextQuestion, type DecisiveFact } from '@nyaya-mitra/core';
import type { ClassifyResponse } from '../api/types.js';
import { initialState, type SessionAction, type SessionState } from './session-state.js';

export { initialState };
export type { SessionAction, SessionState, Stage } from './session-state.js';

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
      // Defaulted rather than trusted: this crosses the network, and a missing
      // field should not take the page down.
      documentFindings: response.documentFindings ?? [],
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

type DocumentAction = Extract<
  SessionAction,
  { type: 'document-attached' | 'document-cleared' | 'document-rejected' }
>;

function applyDocumentAction(state: SessionState, action: DocumentAction): SessionState {
  switch (action.type) {
    case 'document-attached':
      return {
        ...state,
        document: action.document,
        documentSize: action.size,
        documentError: null,
      };
    case 'document-cleared':
      return { ...state, document: null, documentSize: 0, documentError: null };
    case 'document-rejected':
      return { ...state, document: null, documentSize: 0, documentError: action.message };
  }
}

type FlowAction = Exclude<SessionAction, DocumentAction>;

function applyFlowAction(state: SessionState, action: FlowAction): SessionState {
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

/**
 * Dispatches to one of two handlers.
 *
 * A reducer's cyclomatic complexity is simply how many actions the app has, and
 * a single flat switch over all of them exceeded the project's ceiling. Splitting
 * by concern keeps both halves comfortably inside it, rather than raising the
 * limit for reducers and quietly losing the check everywhere else.
 */
export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'document-attached':
    case 'document-cleared':
    case 'document-rejected':
      return applyDocumentAction(state, action);
    default:
      return applyFlowAction(state, action);
  }
}
