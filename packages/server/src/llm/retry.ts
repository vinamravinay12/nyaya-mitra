/**
 * Upstream statuses that mean "try again", not "this request is wrong".
 *
 * 429 is deliberately absent. Gemini's free tier caps requests per *day*, so a
 * quota rejection will not clear within a backoff window — retrying it just
 * spends two more of the requests the user has left.
 */
const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);

export const QUOTA_EXCEEDED_STATUS = 429;

export function isQuotaExceeded(error: unknown): boolean {
  return statusCodeOf(error) === QUOTA_EXCEEDED_STATUS;
}

export interface RetryOptions {
  readonly attempts: number;
  readonly baseDelayMs: number;
  /** Injected so tests do not wait in real time. */
  readonly delay: (ms: number) => Promise<void>;
}

/**
 * Digs the HTTP status out of an SDK error.
 *
 * The Gemini SDK surfaces the upstream failure as a JSON string inside
 * `message` rather than as a typed field, so we read both shapes.
 */
export function statusCodeOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  const { status, message } = error as { status?: unknown; message?: unknown };
  if (typeof status === 'number') {
    return status;
  }
  if (typeof message !== 'string') {
    return undefined;
  }
  const match = /"code"\s*:\s*(\d{3})/.exec(message);
  return match === null ? undefined : Number(match[1]);
}

export function isRetryable(error: unknown): boolean {
  const status = statusCodeOf(error);
  return status !== undefined && RETRYABLE_STATUSES.has(status);
}

/**
 * Retries a transient upstream failure with exponential backoff.
 *
 * Gemini returns 503 "high demand" often enough that a single attempt fails a
 * noticeable share of requests. A non-retryable error is rethrown immediately
 * so a genuinely bad request is not retried three times.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  { attempts, baseDelayMs, delay }: RetryOptions,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === attempts - 1) {
        throw error;
      }
      await delay(baseDelayMs * 2 ** attempt);
    }
  }

  throw lastError;
}
