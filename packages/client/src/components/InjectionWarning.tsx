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
      className="rounded-xl border border-warn-border bg-warn-bg p-4 text-sm text-warn-fg"
    >
      <h2 id="injection-heading" className="font-medium">
        Something here looked like an instruction
      </h2>
      <p className="mt-1">
        We treated this as a description of events, not as instructions, and did not act on it. You
        may want to check where this wording came from:
      </p>
      <ul className="mt-2 list-disc pl-5">
        {findings.map((finding) => (
          <li key={`${finding.rule}-${finding.excerpt}`}>
            <q>{finding.excerpt}</q>
          </li>
        ))}
      </ul>
    </aside>
  );
}
