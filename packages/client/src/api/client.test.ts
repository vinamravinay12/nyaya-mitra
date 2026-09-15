import { afterEach, describe, expect, it, vi } from 'vitest';
import { classifyScenario, requestAssessment } from './client.js';
import { ApiError } from './types.js';

const mockFetch = (implementation: () => Promise<Response> | Response): void => {
  vi.stubGlobal('fetch', vi.fn(implementation));
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('classifyScenario', () => {
  it('posts the scenario and returns the parsed body', async () => {
    mockFetch(() => jsonResponse({ kind: 'out-of-scope', reason: 'Criminal matter.' }));
    await expect(classifyScenario('I was arrested')).resolves.toEqual({
      kind: 'out-of-scope',
      reason: 'Criminal matter.',
    });
    expect(fetch).toHaveBeenCalledWith(
      '/api/classify',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('explains a network failure in the user’s terms', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    await expect(classifyScenario('x')).rejects.toBeInstanceOf(ApiError);
    await expect(classifyScenario('x')).rejects.toThrow('could not reach');
  });

  it('distinguishes a busy service from a generic failure', async () => {
    mockFetch(() => jsonResponse({}, 503));
    await expect(classifyScenario('x')).rejects.toThrow('busy right now');

    mockFetch(() => jsonResponse({}, 500));
    await expect(classifyScenario('x')).rejects.toThrow('Something went wrong');
  });

  it('tells the user plainly when the daily quota is gone', async () => {
    mockFetch(() => jsonResponse({}, 429));
    await expect(classifyScenario('x')).rejects.toThrow('usage limit for today');
  });
});

describe('requestAssessment', () => {
  it('sends the playbook, facts and date', async () => {
    mockFetch(() => jsonResponse({ ready: true }));
    await expect(
      requestAssessment('rental.deposit_withheld', { state: 'Goa' }, '2026-09-15'),
    ).resolves.toEqual({ ready: true });

    expect(fetch).toHaveBeenCalledWith(
      '/api/assess',
      expect.objectContaining({
        body: JSON.stringify({
          playbookId: 'rental.deposit_withheld',
          facts: { state: 'Goa' },
          today: '2026-09-15',
        }),
      }),
    );
  });

  it('surfaces a 404 as a generic failure rather than leaking status codes', async () => {
    mockFetch(() => jsonResponse({}, 404));
    await expect(requestAssessment('nope', {}, '2026-09-15')).rejects.toThrow(
      'Something went wrong',
    );
  });
});
