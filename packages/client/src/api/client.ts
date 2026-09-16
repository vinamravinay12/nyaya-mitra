import type { CaseAssessment, CaseFacts } from '@nyaya-mitra/core';
import type { UploadedDocument } from '../documents/read-file.js';
import { ApiError, type ClassifyResponse, type PlaybookSummary } from './types.js';

function messageForStatus(status: number): string {
  if (status === 413) {
    return 'That file is too large. The limit is 2 MB.';
  }
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

export function classifyScenario(
  scenario: string,
  document: UploadedDocument | null,
): Promise<ClassifyResponse> {
  return postJson<ClassifyResponse>(
    '/api/classify',
    document === null ? { scenario } : { scenario, document },
  );
}

export function requestAssessment(
  playbookId: string,
  facts: CaseFacts,
  today: string,
): Promise<CaseAssessment> {
  return postJson<CaseAssessment>('/api/assess', { playbookId, facts, today });
}

/**
 * The situation catalogue.
 *
 * Fetched rather than hard-coded so the examples on screen always match what the
 * engine can actually handle.
 */
export async function fetchPlaybooks(): Promise<readonly PlaybookSummary[]> {
  // Every failure path returns an empty catalogue rather than throwing: the
  // examples are an enhancement, and a broken response must not take the page
  // down or surface an error the user cannot act on.
  try {
    const response = await fetch('/api/playbooks');
    if (!response.ok) {
      return [];
    }
    const body = (await response.json()) as { playbooks?: readonly PlaybookSummary[] };
    return body.playbooks ?? [];
  } catch {
    return [];
  }
}
