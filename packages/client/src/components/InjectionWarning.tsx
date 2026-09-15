import type { InjectionFinding } from '../api/types.js';

/**
 * Shown when the user's own text contains something that reads as an
 * instruction to the assistant — usually because it was pasted from a document
 * they did not write.
 */
export function InjectionWarning({
  findings,
}: {
  readonly findings: readonly InjectionFinding[];
}): React.JSX.Element | null {
  if (findings.length === 0) {
    return null;
  }

  return (
    <aside
      aria-labelledby="injection-heading"
      className="rounded-md border border-amber-600 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <h2 id="injection-heading" className="font-medium">
        Something in that text looked like an instruction
      </h2>
      <p className="mt-1">
        We read your description as an account of events, not as instructions. You may want to check
        where this wording came from:
      </p>
      <ul className="mt-2 list-disc pl-5">
        {findings.map((finding) => (
          <li key={finding.rule}>
            <q>{finding.excerpt}</q>
          </li>
        ))}
      </ul>
    </aside>
  );
}
