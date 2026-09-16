import { afterEach, describe, expect, it, vi } from 'vitest';
import { classifyScenario, fetchPlaybooks, requestAssessment } from './client.js';
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
    await expect(classifyScenario('I was arrested', null)).resolves.toEqual({
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
    await expect(classifyScenario('x', null)).rejects.toBeInstanceOf(ApiError);
    await expect(classifyScenario('x', null)).rejects.toThrow('could not reach');
  });

  it('distinguishes a busy service from a generic failure', async () => {
    mockFetch(() => jsonResponse({}, 503));
    await expect(classifyScenario('x', null)).rejects.toThrow('busy right now');

    mockFetch(() => jsonResponse({}, 500));
    await expect(classifyScenario('x', null)).rejects.toThrow('Something went wrong');
  });

  it('explains an oversized upload rather than showing a generic failure', async () => {
    mockFetch(() => jsonResponse({}, 413));
    await expect(classifyScenario('x', null)).rejects.toThrow('too large');
  });

  it('sends the document alongside the scenario when one is attached', async () => {
    mockFetch(() => jsonResponse({ kind: 'unrecognised', reason: 'x', covered: [] }));
    const document = { name: 'a.pdf', mimeType: 'application/pdf', data: 'QUJD' };
    await classifyScenario('My landlord kept my deposit', document);
    expect(fetch).toHaveBeenCalledWith(
      '/api/classify',
      expect.objectContaining({
        body: JSON.stringify({ scenario: 'My landlord kept my deposit', document }),
      }),
    );
  });

  it('omits the document key entirely when there is none', async () => {
    mockFetch(() => jsonResponse({ kind: 'unrecognised', reason: 'x', covered: [] }));
    await classifyScenario('My landlord kept my deposit', null);
    expect(fetch).toHaveBeenCalledWith(
      '/api/classify',
      expect.objectContaining({
        body: JSON.stringify({ scenario: 'My landlord kept my deposit' }),
      }),
    );
  });

  it('tells the user plainly when the daily quota is gone', async () => {
    mockFetch(() => jsonResponse({}, 429));
    await expect(classifyScenario('x', null)).rejects.toThrow('usage limit for today');
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

describe('fetchPlaybooks', () => {
  it('returns the catalogue', async () => {
    const playbooks = [{ id: 'rental.deposit_withheld', title: 'Deposit withheld' }];
    mockFetch(() => jsonResponse({ playbooks }));
    await expect(fetchPlaybooks()).resolves.toEqual(playbooks);
  });

  it('returns nothing rather than throwing when the catalogue is unavailable', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    await expect(fetchPlaybooks()).resolves.toEqual([]);

    mockFetch(() => jsonResponse({}, 500));
    await expect(fetchPlaybooks()).resolves.toEqual([]);
  });

  it('survives a response body that is not JSON', async () => {
    mockFetch(() => new Response('<html>gateway</html>', { status: 200 }));
    await expect(fetchPlaybooks()).resolves.toEqual([]);
  });

  it('survives a JSON body with no playbooks key', async () => {
    mockFetch(() => jsonResponse({ unexpected: true }));
    await expect(fetchPlaybooks()).resolves.toEqual([]);
  });
});
