export interface InjectionFinding {
  readonly rule: string;
  /** The matched text, truncated, so the user can be shown what was flagged. */
  readonly excerpt: string;
}

const EXCERPT_LIMIT = 80;

/**
 * Patterns are anchored to second-person address wherever possible.
 *
 * Contracts are full of imperatives — "the Tenant shall not sublet", "the
 * Landlord must respond within 15 days" — so a rule that merely looks for
 * commands would flag every genuine agreement. What distinguishes an injection
 * is that it addresses the reader as an assistant.
 */
const RULES: readonly (readonly [string, RegExp])[] = [
  [
    'override-instructions',
    /\b(ignore|disregard|forget)\b[^.\n]{0,40}\b(instruction|prompt|rule)s?\b/i,
  ],
  ['identity-reassignment', /\b(you are now|pretend to be|act as if you|from now on,? you)\b/i],
  [
    'system-prompt-probe',
    /\b(system prompt|developer message|reveal your (prompt|instructions))\b/i,
  ],
  ['injected-directive', /\b(new|updated|revised) instructions?\s*[:-]/i],
  [
    'output-coercion',
    /\byou (must|should|shall|will|are to) (say|reply|respond|answer|output|tell|report)\b/i,
  ],
];

/**
 * Flags text that appears to be addressing the model rather than describing a
 * situation.
 *
 * This informs; it does not block. The real defence is that untrusted text is
 * always fenced and labelled as data in the prompt — this detector exists so the
 * user can be told when their own document contains something suspicious.
 */
export function detectPromptInjection(text: string): readonly InjectionFinding[] {
  return RULES.flatMap(([rule, pattern]): InjectionFinding[] => {
    const match = pattern.exec(text);
    return match === null ? [] : [{ rule, excerpt: match[0].slice(0, EXCERPT_LIMIT) }];
  });
}
