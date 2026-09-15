/* eslint-disable no-console -- the one place the server is allowed to write to stdio */

/**
 * Server-side diagnostics.
 *
 * Responses to the browser stay deliberately vague so they cannot leak
 * configuration, but the operator still needs to know why something failed.
 */
export function logWarning(message: string, cause: unknown): void {
  const detail = cause instanceof Error ? cause.message : String(cause);
  console.warn(`[nyaya-mitra] ${message}: ${detail}`);
}
