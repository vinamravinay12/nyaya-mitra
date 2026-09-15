import { describe, expect, it, vi } from 'vitest';
import { isQuotaExceeded, isRetryable, statusCodeOf, withRetry } from './retry.js';

const geminiError = (code: number): Error =>
  new Error(JSON.stringify({ error: { code, message: 'upstream', status: 'UNAVAILABLE' } }));

const noDelay = (): ReturnType<typeof vi.fn<(ms: number) => Promise<void>>> =>
  vi.fn<(ms: number) => Promise<void>>(() => Promise.resolve());

const options = { attempts: 3, baseDelayMs: 10, delay: noDelay() };

describe('statusCodeOf', () => {
  it('reads a numeric status field', () => {
    expect(statusCodeOf({ status: 429 })).toBe(429);
  });

  it('reads the code out of the SDK’s JSON message', () => {
    expect(statusCodeOf(geminiError(503))).toBe(503);
  });

  it('returns undefined when there is no status to find', () => {
    expect(statusCodeOf(new Error('socket hang up'))).toBeUndefined();
    expect(statusCodeOf({ message: 42 })).toBeUndefined();
    expect(statusCodeOf('a string')).toBeUndefined();
    expect(statusCodeOf(null)).toBeUndefined();
  });
});

describe('isRetryable', () => {
  it('retries upstream capacity failures', () => {
    for (const code of [500, 502, 503, 504]) {
      expect(isRetryable(geminiError(code)), String(code)).toBe(true);
    }
  });

  it('never retries a quota rejection, which would spend the remaining quota', () => {
    expect(isRetryable(geminiError(429))).toBe(false);
  });

  it('does not retry a request that is simply wrong', () => {
    for (const code of [400, 401, 403, 404]) {
      expect(isRetryable(geminiError(code)), String(code)).toBe(false);
    }
    expect(isRetryable(new Error('no status'))).toBe(false);
  });
});

describe('isQuotaExceeded', () => {
  it('recognises a 429 and nothing else', () => {
    expect(isQuotaExceeded(geminiError(429))).toBe(true);
    expect(isQuotaExceeded(geminiError(503))).toBe(false);
    expect(isQuotaExceeded(new Error('no status'))).toBe(false);
  });
});

describe('withRetry', () => {
  it('returns the first successful result without delaying', async () => {
    const delay = noDelay();
    const operation = vi.fn(() => Promise.resolve('ok'));
    await expect(withRetry(operation, { ...options, delay })).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledOnce();
    expect(delay).not.toHaveBeenCalled();
  });

  it('recovers from a transient failure', async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(geminiError(503))
      .mockResolvedValue('ok');
    await expect(withRetry(operation, options)).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('backs off exponentially between attempts', async () => {
    const delay = noDelay();
    const operation = vi.fn(() => Promise.reject(geminiError(503)));
    await expect(withRetry(operation, { ...options, delay })).rejects.toThrow();
    expect(delay.mock.calls.map(([ms]) => ms)).toEqual([10, 20]);
  });

  it('gives up after the last attempt and rethrows', async () => {
    const operation = vi.fn(() => Promise.reject(geminiError(503)));
    await expect(withRetry(operation, options)).rejects.toThrow('503');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('does not retry a non-retryable failure', async () => {
    const operation = vi.fn(() => Promise.reject(geminiError(400)));
    await expect(withRetry(operation, options)).rejects.toThrow('400');
    expect(operation).toHaveBeenCalledOnce();

    const quota = vi.fn(() => Promise.reject(geminiError(429)));
    await expect(withRetry(quota, options)).rejects.toThrow('429');
    expect(quota).toHaveBeenCalledOnce();
  });

  it('rethrows the last error if the loop is configured with no attempts', async () => {
    const operation = vi.fn(() => Promise.resolve('never'));
    await expect(withRetry(operation, { ...options, attempts: 0 })).rejects.toBeUndefined();
  });
});
