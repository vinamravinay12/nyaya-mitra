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
    createGeminiClient('secret-key', ['gemini-3.1-flash-lite']);
    expect(constructed).toHaveBeenCalledWith({ apiKey: 'secret-key' });
  });

  it('sends the prompt and returns the text', async () => {
    generateContent.mockResolvedValue({ text: '{"ok":true}' });
    const client = createGeminiClient('k', ['gemini-3.1-flash-lite']);

    await expect(client.complete('prompt text')).resolves.toBe('{"ok":true}');
    expect(generateContent).toHaveBeenCalledWith({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: 'prompt text' }] }],
      config: { temperature: 0.2, responseMimeType: 'application/json' },
    });
  });

  it('attaches an uploaded document alongside the prompt', async () => {
    generateContent.mockResolvedValue({ text: '{}' });
    const client = createGeminiClient('k', ['gemini-3.1-flash-lite']);

    await client.complete('prompt text', {
      name: 'agreement.pdf',
      mimeType: 'application/pdf',
      data: 'QUJD',
    });

    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'prompt text' },
              { inlineData: { mimeType: 'application/pdf', data: 'QUJD' } },
            ],
          },
        ],
      }),
    );
  });

  it('treats a response with no text as empty rather than crashing', async () => {
    generateContent.mockResolvedValue({});
    const client = createGeminiClient('k', ['gemini-3.1-flash-lite']);
    await expect(client.complete('x')).resolves.toBe('');
  });

  it('retries a transient upstream failure and succeeds', async () => {
    const retry = { attempts: 3, baseDelayMs: 1, delay: () => Promise.resolve() };
    generateContent
      .mockRejectedValueOnce(new Error(JSON.stringify({ error: { code: 503 } })))
      .mockResolvedValue({ text: '{"ok":true}' });

    const client = createGeminiClient('k', ['gemini-3.1-flash-lite'], retry);
    await expect(client.complete('x')).resolves.toBe('{"ok":true}');
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('gives up after exhausting retries on a persistent outage', async () => {
    const retry = { attempts: 2, baseDelayMs: 1, delay: () => Promise.resolve() };
    generateContent.mockRejectedValue(new Error(JSON.stringify({ error: { code: 503 } })));

    const client = createGeminiClient('k', ['gemini-3.1-flash-lite'], retry);
    await expect(client.complete('x')).rejects.toBeInstanceOf(LlmUnavailableError);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('defaults to a real backoff of several attempts', async () => {
    expect(DEFAULT_RETRY.attempts).toBe(RETRY_ATTEMPTS);
    await expect(sleep(1)).resolves.toBeUndefined();
  });

  it('wraps a failure so callers can answer 503 instead of leaking it', async () => {
    generateContent.mockRejectedValue(new Error('429 quota exceeded'));
    const client = createGeminiClient('k', ['gemini-3.1-flash-lite']);
    await expect(client.complete('x')).rejects.toBeInstanceOf(LlmUnavailableError);
  });

  it('falls back to the next model when the first is overloaded', async () => {
    const overloaded = new Error(JSON.stringify({ error: { code: 503 } }));
    generateContent.mockRejectedValueOnce(overloaded).mockResolvedValue({ text: '{"ok":true}' });

    const client = createGeminiClient('k', ['primary', 'backup'], {
      attempts: 1,
      baseDelayMs: 1,
      delay: () => Promise.resolve(),
    });

    await expect(client.complete('x')).resolves.toBe('{"ok":true}');
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(generateContent.mock.calls[0]?.[0]).toMatchObject({ model: 'primary' });
    expect(generateContent.mock.calls[1]?.[0]).toMatchObject({ model: 'backup' });
  });

  it('falls back to the next model when the first is out of quota', async () => {
    // Free-tier quota is counted per model, so the next one has its own budget.
    generateContent
      .mockRejectedValueOnce(new Error(JSON.stringify({ error: { code: 429 } })))
      .mockResolvedValue({ text: '{"ok":true}' });

    const client = createGeminiClient('k', ['primary', 'backup'], {
      attempts: 1,
      baseDelayMs: 1,
      delay: () => Promise.resolve(),
    });
    await expect(client.complete('x')).resolves.toBe('{"ok":true}');
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it('gives up only after every model has been tried', async () => {
    generateContent.mockRejectedValue(new Error(JSON.stringify({ error: { code: 503 } })));
    const client = createGeminiClient('k', ['one', 'two', 'three'], {
      attempts: 1,
      baseDelayMs: 1,
      delay: () => Promise.resolve(),
    });

    await expect(client.complete('x')).rejects.toBeInstanceOf(LlmUnavailableError);
    expect(generateContent).toHaveBeenCalledTimes(3);
  });

  it('reports a spent quota distinctly and without retrying', async () => {
    generateContent.mockRejectedValue(new Error(JSON.stringify({ error: { code: 429 } })));
    const client = createGeminiClient('k', ['only-model'], {
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
    const client = createGeminiClient('k', ['gemini-3.1-flash-lite']);
    await expect(client.complete('x')).rejects.toThrow('Gemini request failed');
  });
});
