import { extractFencedContent } from '../prompts/fence-untrusted.js';
import type { LlmClient } from './llm-client.js';

/**
 * A deterministic stand-in used by tests and by local runs with no API key.
 *
 * It performs a crude keyword match so the app is demonstrable end to end
 * without credentials. It is never used when a key is configured.
 */
export function createStubClient(): LlmClient {
  return {
    complete(prompt: string): Promise<string> {
      // Only the user's own words, never our instructions — the prompt itself
      // lists the out-of-scope areas and would otherwise match every time.
      const lowered = extractFencedContent(prompt).toLowerCase();
      if (/\b(divorce|custody|arrest|bail|criminal|deportation|visa)\b/.test(lowered)) {
        return Promise.resolve(
          JSON.stringify({
            playbookId: null,
            confidence: 0,
            outOfScope: true,
            outOfScopeReason: 'This needs a qualified professional rather than a triage tool.',
            extractedFacts: {},
          }),
        );
      }
      return Promise.resolve(
        JSON.stringify({
          playbookId: 'rental.deposit_withheld',
          confidence: 0.55,
          outOfScope: false,
          outOfScopeReason: null,
          extractedFacts: {},
        }),
      );
    },
  };
}
