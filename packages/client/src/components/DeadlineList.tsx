import type { LimitationAssessment } from '@nyaya-mitra/core';
import { formatDaysRemaining } from '../format/format-values.js';
import { ClockIcon } from '../icons/index.js';

interface StatusStyle {
  readonly text: string;
  readonly chip: string;
}

const STATUS: Record<LimitationAssessment['status'], StatusStyle> = {
  expired: { text: 'Window closed', chip: 'bg-danger-bg text-danger-fg' },
  critical: { text: 'Closing soon', chip: 'bg-danger-bg text-danger-fg' },
  approaching: { text: 'Worth planning for', chip: 'bg-warn-bg text-warn-fg' },
  comfortable: { text: 'Plenty of time', chip: 'bg-ok-bg text-ok-fg' },
  unknown: { text: 'Needs a date', chip: 'bg-surface text-muted' },
};

function Deadline({
  limitation,
}: {
  readonly limitation: LimitationAssessment;
}): React.JSX.Element {
  const status = STATUS[limitation.status];

  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="font-semibold text-ink">{limitation.rule.description}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.chip}`}>
          {status.text}
        </span>
      </div>

      {limitation.status === 'unknown' ? (
        <p className="mt-2 text-sm text-muted">{limitation.reason}</p>
      ) : (
        <p className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-ink">
            {formatDaysRemaining(limitation.daysRemaining)}
          </span>
          <span className="text-sm text-muted">until {limitation.deadline}</span>
        </p>
      )}

      <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
        {limitation.rule.reference.act} {limitation.rule.reference.year},{' '}
        {limitation.rule.reference.provision}
      </p>
    </li>
  );
}

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
      <h2 id="deadlines-heading" className="flex items-center gap-2 text-xl font-semibold text-ink">
        <ClockIcon className="size-5 text-brand" />
        Your deadlines
      </h2>
      <ul className="mt-4 space-y-3">
        {limitations.map((limitation) => (
          <Deadline key={limitation.rule.id} limitation={limitation} />
        ))}
      </ul>
    </section>
  );
}
