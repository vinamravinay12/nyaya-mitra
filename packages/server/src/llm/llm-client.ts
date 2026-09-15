/**
 * The entire surface the app needs from a language model.
 *
 * Kept to one method so prompt construction and response parsing stay in pure,
 * fully tested modules, and the only untested part is the network call itself.
 */
export interface LlmClient {
  complete(prompt: string): Promise<string>;
}

export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmUnavailableError';
  }
}

/**
 * The API key has run out of quota.
 *
 * Distinct from unavailability because the remedy is different: waiting will
 * not help within a session, so the user should be told plainly rather than
 * invited to try again.
 */
export class LlmQuotaExceededError extends LlmUnavailableError {
  constructor(message: string) {
    super(message);
    this.name = 'LlmQuotaExceededError';
  }
}
