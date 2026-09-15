import { useEffect, type Dispatch } from 'react';
import type { CaseFacts } from '@nyaya-mitra/core';
import { fetchPlaybooks, requestAssessment } from '../api/client.js';
import { ApiError } from '../api/types.js';
import { todayInIndia } from '../format/today-in-india.js';
import type { SessionAction } from './session-reducer.js';

export const messageOf = (error: unknown): string =>
  error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';

/**
 * Loads the situation catalogue once.
 *
 * A failure is silent: the examples are an enhancement, not a precondition for
 * using the app, and an error banner about them would be noise.
 */
export function useCatalogue(dispatch: Dispatch<SessionAction>): void {
  useEffect(() => {
    void fetchPlaybooks().then((catalogue) => {
      dispatch({ type: 'catalogue-loaded', catalogue });
    });
  }, [dispatch]);
}

/**
 * Runs the assessment as soon as the last required fact lands.
 *
 * `playbookId` is undefined until the intake is complete, so the user never has
 * to press a "done" button they might not understand.
 */
export function useAutoAssess(
  dispatch: Dispatch<SessionAction>,
  playbookId: string | undefined,
  facts: CaseFacts,
): void {
  useEffect(() => {
    if (playbookId === undefined) {
      return;
    }
    dispatch({ type: 'request-started' });
    requestAssessment(playbookId, facts, todayInIndia(new Date()))
      .then((assessment) => {
        dispatch({ type: 'assessed', assessment });
      })
      .catch((error: unknown) => {
        dispatch({ type: 'failed', message: messageOf(error) });
      });
  }, [dispatch, playbookId, facts]);
}
