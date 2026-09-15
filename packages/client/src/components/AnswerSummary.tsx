import type { CaseFacts, DecisiveFact } from '@nyaya-mitra/core';
import { formatFactValue } from '../format/format-values.js';

interface AnswerSummaryProps {
  readonly facts: readonly DecisiveFact[];
  readonly answers: CaseFacts;
  readonly onChange: (factId: string) => void;
}

/**
 * What has been answered so far, with each answer changeable.
 *
 * Clearing an answer is all it takes to revisit it: the engine always asks for
 * the first outstanding required fact, so a cleared one becomes the next
 * question. That also covers facts pulled out of the original description, which
 * the user never explicitly confirmed and may well want to correct.
 */
export function AnswerSummary({
  facts,
  answers,
  onChange,
}: AnswerSummaryProps): React.JSX.Element | null {
  // Carry the value along with the fact so it arrives narrowed. Filtering and
  // then re-reading would leave a `?? null` fallback that cannot be reached.
  const answered = facts.flatMap((fact) => {
    const value = answers[fact.id];
    return value === undefined || value === null ? [] : [{ fact, value }];
  });

  if (answered.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="answers-heading" className="card p-5">
      <h2
        id="answers-heading"
        className="text-xs font-semibold tracking-widest text-muted uppercase"
      >
        Your answers so far
      </h2>
      <ul className="mt-3 divide-y divide-line">
        {answered.map(({ fact, value }) => (
          <li key={fact.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <span className="min-w-0">
              <span className="block text-sm text-muted">{fact.question}</span>
              <span className="block font-medium text-ink">
                {formatFactValue(fact.kind, value)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                onChange(fact.id);
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Change
              <span className="sr-only"> your answer to: {fact.question}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
