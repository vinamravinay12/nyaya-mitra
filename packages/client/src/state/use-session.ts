import { useCallback, useReducer } from 'react';
import {
  intakeProgress,
  type DecisiveFact,
  type FactId,
  type FactValue,
  type IntakeProgress,
} from '@nyaya-mitra/core';
import { classifyScenario } from '../api/client.js';
import { useDocument } from './use-document.js';
import { messageOf, useAutoAssess, useCatalogue } from './use-session-effects.js';
import {
  currentQuestion,
  initialState,
  isIntakeComplete,
  sessionReducer,
  type SessionState,
} from './session-reducer.js';

export interface Session {
  readonly state: SessionState;
  readonly question: DecisiveFact | undefined;
  readonly progress: IntakeProgress;
  readonly setScenario: (scenario: string) => void;
  readonly submitScenario: () => void;
  readonly answer: (factId: FactId, value: FactValue) => void;
  readonly restart: () => void;
  /** "This is not my situation" — go back to the description, keeping the text. */
  readonly rejectMatch: () => void;
  /** Re-ask a fact that has already been answered. */
  readonly changeAnswer: (factId: FactId) => void;
  readonly attachDocument: (file: File) => void;
  readonly clearDocument: () => void;
  /** Undo the last answer given here, or undefined when there is nothing to undo. */
  readonly goBack: (() => void) | undefined;
}

/**
 * Owns the conversation: classify, then collect facts, then assess.
 *
 * The assessment fires on its own as soon as the last required fact arrives, so
 * the user never has to press a "done" button they might not understand.
 */
export function useSession(): Session {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const question = currentQuestion(state);

  useCatalogue(dispatch);

  // Undefined until the last required fact lands, at which point it names the
  // playbook to assess. One value, so there is no unreachable second guard.
  const pendingPlaybookId =
    state.stage === 'answering' && isIntakeComplete(state) ? state.playbook?.id : undefined;
  useAutoAssess(dispatch, pendingPlaybookId, state.facts);

  const submitScenario = useCallback((): void => {
    dispatch({ type: 'request-started' });
    classifyScenario(state.scenario, state.document)
      .then((response) => {
        dispatch({ type: 'classified', response });
      })
      .catch((error: unknown) => {
        dispatch({ type: 'failed', message: messageOf(error) });
      });
  }, [state.scenario, state.document]);

  const setScenario = useCallback((scenario: string): void => {
    dispatch({ type: 'scenario-changed', scenario });
  }, []);

  // The caller supplies the fact id, so there is no guard here for a question
  // that cannot be absent at the point this is called.
  const answer = useCallback((factId: FactId, value: FactValue): void => {
    dispatch({ type: 'answered', factId, value });
  }, []);

  const restart = useCallback((): void => {
    dispatch({ type: 'restarted' });
  }, []);

  const rejectMatch = useCallback((): void => {
    dispatch({ type: 'match-rejected' });
  }, []);

  const changeAnswer = useCallback((factId: FactId): void => {
    dispatch({ type: 'answer-cleared', factId });
  }, []);

  const { attachDocument, clearDocument } = useDocument(dispatch);

  const previousFactId = state.answerOrder.at(-1);

  const progress =
    state.playbook === null
      ? { answered: 0, total: 0 }
      : intakeProgress(state.playbook, state.facts);

  return {
    state,
    question,
    progress,
    setScenario,
    submitScenario,
    answer,
    restart,
    rejectMatch,
    changeAnswer,
    attachDocument,
    clearDocument,
    // Undefined rather than a no-op, so the UI cannot render a dead button — and
    // so there is no unreachable "is there a previous question" guard inside it.
    goBack:
      previousFactId === undefined
        ? undefined
        : () => {
            changeAnswer(previousFactId);
          },
  };
}
