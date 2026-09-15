import { GoogleGenAI } from '@google/genai';
import { logWarning } from '../logging/log.js';
import { LlmQuotaExceededError, type LlmClient, LlmUnavailableError } from './llm-client.js';
import { isQuotaExceeded, withRetry, type RetryOptions } from './retry.js';

/** Gemini returns 503 "high demand" often enough that one attempt is not enough. */
export const RETRY_ATTEMPTS = 3;
export const RETRY_BASE_DELAY_MS = 500;

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

/**
 * Adapter over the Gemini Developer API.
 *
 * The key lives here, in the server process, and is never sent to the browser:
 * the client calls our endpoints, and we call Gemini.
 */
export function createGeminiClient(
  apiKey: string,
  model: string,
  retry: RetryOptions = DEFAULT_RETRY,
): LlmClient {
  const genai = new GoogleGenAI({ apiKey });

  return {
    async complete(prompt: string): Promise<string> {
      try {
        const response = await withRetry(
          () =>
            genai.models.generateContent({
              model,
              contents: prompt,
              config: { temperature: 0.2, responseMimeType: 'application/json' },
            }),
          retry,
        );
        return response.text ?? '';
      } catch (cause) {
        // Logged in full here; the caller only ever tells the user "unavailable".
        logWarning('Gemini request failed', cause);
        const message = cause instanceof Error ? cause.message : 'Gemini request failed';
        throw isQuotaExceeded(cause)
          ? new LlmQuotaExceededError(message)
          : new LlmUnavailableError(message);
      }
    },
  };
}
