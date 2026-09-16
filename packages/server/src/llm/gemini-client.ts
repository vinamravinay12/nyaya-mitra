import { GoogleGenAI } from '@google/genai';
import { logWarning } from '../logging/log.js';
import { LlmQuotaExceededError, type LlmClient, LlmUnavailableError } from './llm-client.js';
import { isQuotaExceeded, withRetry, type RetryOptions } from './retry.js';

/** Gemini returns 503 "high demand" often enough that one attempt is not enough. */
export const RETRY_ATTEMPTS = 3;
export const RETRY_BASE_DELAY_MS = 600;

/** Exported so the default backoff is exercised directly rather than by waiting. */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const DEFAULT_RETRY: RetryOptions = {
  attempts: RETRY_ATTEMPTS,
  baseDelayMs: RETRY_BASE_DELAY_MS,
  delay: sleep,
};

const asError = (cause: unknown): Error =>
  cause instanceof Error ? cause : new Error('Gemini request failed');

/**
 * Adapter over the Gemini Developer API.
 *
 * The key lives here, in the server process, and is never sent to the browser:
 * the client calls our endpoints, and we call Gemini.
 *
 * Models are tried in order. Capacity spikes ("this model is currently
 * experiencing high demand") hit one model at a time, and the free tier's daily
 * quota is also counted per model — so moving to the next one turns both of the
 * failures we actually see in production into an answer rather than an error.
 */
export function createGeminiClient(
  apiKey: string,
  models: readonly string[],
  retry: RetryOptions = DEFAULT_RETRY,
): LlmClient {
  const genai = new GoogleGenAI({ apiKey });

  const callModel = (model: string, prompt: string): Promise<string> =>
    withRetry(
      () =>
        genai.models
          .generateContent({
            model,
            contents: prompt,
            config: { temperature: 0.2, responseMimeType: 'application/json' },
          })
          .then((response) => response.text ?? ''),
      retry,
    );

  return {
    async complete(prompt: string): Promise<string> {
      let lastError: unknown;

      for (const model of models) {
        try {
          return await callModel(model, prompt);
        } catch (cause) {
          lastError = cause;
          // Logged in full here; the caller only ever tells the user "unavailable".
          logWarning(`Gemini request failed on ${model}`, cause);
        }
      }

      const message = asError(lastError).message;
      throw isQuotaExceeded(lastError)
        ? new LlmQuotaExceededError(message)
        : new LlmUnavailableError(message);
    },
  };
}
