import type { CaseAssessment, CaseFacts } from '@nyaya-mitra/core';
import { ApiError, type ClassifyResponse } from './types.js';

function messageForStatus(status: number): string {
  if (status === 429) {
    return 'The assistant has reached its usage limit for today. Please try again tomorrow.';
  }
  if (status === 503) {
    return 'The assistant is busy right now. Please try again in a moment.';
  }
  return 'Something went wrong handling that. Please try again.';
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError('We could not reach the service. Check your connection and try again.');
  }

  if (!response.ok) {
    throw new ApiError(messageForStatus(response.status));
  }

  return (await response.json()) as T;
}

export function classifyScenario(scenario: string): Promise<ClassifyResponse> {
  return postJson<ClassifyResponse>('/api/classify', { scenario });
}

export function requestAssessment(
  playbookId: string,
  facts: CaseFacts,
  today: string,
): Promise<CaseAssessment> {
  return postJson<CaseAssessment>('/api/assess', { playbookId, facts, today });
}
