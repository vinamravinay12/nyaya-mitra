import type { LimitationAssessment } from '@nyaya-mitra/core';
import { formatDaysRemaining } from '../format/format-values.js';

const STATUS_TEXT: Record<LimitationAssessment['status'], string> = {
  expired: 'Window closed',
  critical: 'Closing soon',
  approaching: 'Worth planning for',
  comfortable: 'Plenty of time',
  unknown: 'Needs a date',
};

export function DeadlineList({
  limitations,
}: {
  readonly limitations: readonly LimitationAssessment[];
}): React.JSX.Element | null {
  if (limitations.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="deadlines-heading">
      <h2 id="deadlines-heading" className="text-xl font-semibold text-ink">
        Your deadlines
      </h2>
      <ul className="mt-3 space-y-3">
        {limitations.map((limitation) => (
          <li key={limitation.rule.id} className="rounded-md border border-line p-4">
            <p className="font-medium text-ink">{limitation.rule.description}</p>
            <p className="mt-1 text-sm text-muted">
              {STATUS_TEXT[limitation.status]}
              {limitation.status === 'unknown'
                ? ` — ${limitation.reason}`
                : ` — ${formatDaysRemaining(limitation.daysRemaining)}, until ${limitation.deadline}`}
            </p>
            <p className="mt-1 text-sm text-muted">
              {limitation.rule.reference.act} {limitation.rule.reference.year},{' '}
              {limitation.rule.reference.provision}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
