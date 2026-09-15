import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateContent = vi.fn();
const constructed = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent };
    constructor(options: unknown) {
      constructed(options);
    }
  },
}));

const { DEFAULT_RETRY, RETRY_ATTEMPTS, createGeminiClient, sleep } =
  await import('./gemini-client.js');
const { LlmQuotaExceededError, LlmUnavailableError } = await import('./llm-client.js');

describe('createGeminiClient', () => {
  beforeEach(() => {
    generateContent.mockReset();
    constructed.mockReset();
  });

  it('passes the key to the SDK, not to the caller', () => {
    createGeminiClient('secret-key', 'gemini-3.1-flash-lite');
    expect(constructed).toHaveBeenCalledWith({ apiKey: 'secret-key' });
  });

  it('sends the prompt and returns the text', async () => {
    generateContent.mockResolvedValue({ text: '{"ok":true}' });
    const client = createGeminiClient('k', 'gemini-3.1-flash-lite');

    await expect(client.complete('prompt text')).resolves.toBe('{"ok":true}');
    expect(generateContent).toHaveBeenCalledWith({
      model: 'gemini-3.1-flash-lite',
      contents: 'prompt text',
      config: { temperature: 0.2, responseMimeType: 'application/json' },
    });
  });

  it('treats a response with no text as empty rather than crashing', async () => {
    generateContent.mockResolvedValue({});
    const client = createGeminiClient('k', 'gemini-3.1-flash-lite');
    await expect(client.complete('x')).resolves.toBe('');
  });

  it('retries a transient upstream failure and succeeds', async () => {
    const retry = { attempts: 3, baseDelayMs: 1, delay: () => Promise.resolve() };
    generateContent
      .mockRejectedValueOnce(new Error(JSON.stringify({ error: { code: 503 } })))
      .mockResolvedValue({ text: '{"ok":true}' });

    const client = createGeminiClient('k', 'gemini-3.1-flash-lite', retry);
    await expect(client.complete('x')).resolves.toBe('{"ok":true}');
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('gives up after exhausting retries on a persistent outage', async () => {
    const retry = { attempts: 2, baseDelayMs: 1, delay: () => Promise.resolve() };
    generateContent.mockRejectedValue(new Error(JSON.stringify({ error: { code: 503 } })));

    const client = createGeminiClient('k', 'gemini-3.1-flash-lite', retry);
    await expect(client.complete('x')).rejects.toBeInstanceOf(LlmUnavailableError);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('defaults to a real backoff of several attempts', async () => {
    expect(DEFAULT_RETRY.attempts).toBe(RETRY_ATTEMPTS);
    await expect(sleep(1)).resolves.toBeUndefined();
  });

  it('wraps a failure so callers can answer 503 instead of leaking it', async () => {
    generateContent.mockRejectedValue(new Error('429 quota exceeded'));
    const client = createGeminiClient('k', 'gemini-3.1-flash-lite');
    await expect(client.complete('x')).rejects.toBeInstanceOf(LlmUnavailableError);
  });

  it('reports a spent quota distinctly and without retrying', async () => {
    generateContent.mockRejectedValue(new Error(JSON.stringify({ error: { code: 429 } })));
    const client = createGeminiClient('k', 'gemini-3.1-flash-lite', {
      attempts: 3,
      baseDelayMs: 1,
      delay: () => Promise.resolve(),
    });

    await expect(client.complete('x')).rejects.toBeInstanceOf(LlmQuotaExceededError);
    // Retrying a daily quota rejection would spend the requests the user has left.
    expect(generateContent).toHaveBeenCalledOnce();
  });

  it('handles a rejection that is not an Error', async () => {
    generateContent.mockRejectedValue('socket hang up');
    const client = createGeminiClient('k', 'gemini-3.1-flash-lite');
    await expect(client.complete('x')).rejects.toThrow('Gemini request failed');
  });
});
