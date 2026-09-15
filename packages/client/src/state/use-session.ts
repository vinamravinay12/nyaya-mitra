import { useCallback, useEffect, useReducer } from 'react';
import type { FactId, FactValue } from '@nyaya-mitra/core';
import { classifyScenario, requestAssessment } from '../api/client.js';
import { ApiError } from '../api/types.js';
import { todayInIndia } from '../format/today-in-india.js';
import {
  currentQuestion,
  initialState,
  isIntakeComplete,
  sessionReducer,
  type SessionState,
} from './session-reducer.js';
import type { DecisiveFact } from '@nyaya-mitra/core';

const messageOf = (error: unknown): string =>
  error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';

export interface Session {
  readonly state: SessionState;
  readonly question: DecisiveFact | undefined;
  readonly setScenario: (scenario: string) => void;
  readonly submitScenario: () => void;
  readonly answer: (factId: FactId, value: FactValue) => void;
  readonly restart: () => void;
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
  // Undefined until the last required fact lands, at which point it names the
  // playbook to assess. One value, so there is no unreachable second guard.
  const pendingPlaybookId =
    state.stage === 'answering' && isIntakeComplete(state) ? state.playbook?.id : undefined;

  const submitScenario = useCallback((): void => {
    dispatch({ type: 'request-started' });
    classifyScenario(state.scenario)
      .then((response) => {
        dispatch({ type: 'classified', response });
      })
      .catch((error: unknown) => {
        dispatch({ type: 'failed', message: messageOf(error) });
      });
  }, [state.scenario]);

  useEffect(() => {
    if (pendingPlaybookId === undefined) {
      return;
    }
    dispatch({ type: 'request-started' });
    requestAssessment(pendingPlaybookId, state.facts, todayInIndia(new Date()))
      .then((assessment) => {
        dispatch({ type: 'assessed', assessment });
      })
      .catch((error: unknown) => {
        dispatch({ type: 'failed', message: messageOf(error) });
      });
  }, [pendingPlaybookId, state.facts]);

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

  return { state, question, setScenario, submitScenario, answer, restart };
}
