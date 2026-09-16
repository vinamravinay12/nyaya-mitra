import type { DocumentFinding } from '../api/types.js';
import { ScaleIcon } from '../icons/index.js';

/**
 * What the uploaded document actually says about this dispute.
 *
 * Deliberately not a summary of the document. The clauses shown are the ones
 * that bear on the user's situation, which is the difference between "here is
 * what your agreement says" and "here is the part that helps you".
 */
export function DocumentFindings({
  findings,
}: {
  readonly findings: readonly DocumentFinding[];
}): React.JSX.Element | null {
  if (findings.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="document-heading" className="card p-5">
      <h2 id="document-heading" className="flex items-center gap-2 font-semibold text-ink">
        <ScaleIcon className="size-5 text-brand" />
        From your document
      </h2>
      <p className="mt-1 text-sm text-muted">
        The parts that matter for this situation, not a summary of the whole thing.
      </p>
      <ul className="mt-4 space-y-4">
        {findings.map((finding) => (
          <li key={finding.clause} className="border-l-2 border-brand/40 pl-4">
            <blockquote className="text-sm leading-relaxed text-ink-soft italic">
              “{finding.clause}”
            </blockquote>
            <p className="mt-1.5 text-sm font-medium text-ink">{finding.why}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
