import type { Effort, RouteAvailability } from '@nyaya-mitra/core';
import { formatDayRange, formatRupees } from '../format/format-values.js';
import { FlagIcon } from '../icons/index.js';

/** Total over every effort level, so there is no unreachable fallback. */
const EFFORT_STYLE: Record<Effort, string> = {
  low: 'bg-ok-bg text-ok-fg',
  medium: 'bg-warn-bg text-warn-fg',
  high: 'bg-alert-bg text-alert-fg',
};

function Stat({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}): React.JSX.Element {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
    </div>
  );
}

function OpenRoute({ entry }: { readonly entry: RouteAvailability }): React.JSX.Element {
  const { route } = entry;
  return (
    <li className="card p-5">
      <h3 className="font-semibold text-ink">{route.label}</h3>
      <p className="mt-1 text-sm text-muted">{route.forum}</p>
      <dl className="mt-4 grid grid-cols-3 gap-4 border-t border-line pt-4">
        <Stat label="Cost" value={route.costInr === 0 ? 'Free' : formatRupees(route.costInr)} />
        <Stat label="Time" value={formatDayRange(route.minDays, route.maxDays)} />
        <div>
          <dt className="text-xs tracking-wide text-muted uppercase">Effort</dt>
          <dd className="mt-0.5">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-sm font-semibold ${EFFORT_STYLE[route.effort]}`}
            >
              {route.effort}
            </span>
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-sm leading-relaxed text-muted">{route.costNote}</p>
    </li>
  );
}

/** Narrowed, so there is no unreachable "what if it is available" branch here. */
type ClosedEntry = Extract<RouteAvailability, { readonly available: false }>;

function ClosedRoute({ entry }: { readonly entry: ClosedEntry }): React.JSX.Element {
  return (
    <li className="rounded-card border border-dashed border-line bg-surface/60 p-5">
      <h3 className="font-medium text-ink-soft">
        {entry.route.label}
        <span className="ml-2 text-sm font-normal text-muted">— not open to you</span>
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{entry.reason}</p>
    </li>
  );
}

export function RouteList({
  routes,
}: {
  readonly routes: readonly RouteAvailability[];
}): React.JSX.Element {
  const open = routes.filter((entry) => entry.available);
  const closed = routes.filter((entry): entry is ClosedEntry => !entry.available);

  return (
    <section aria-labelledby="routes-heading">
      <h2 id="routes-heading" className="flex items-center gap-2 text-xl font-semibold text-ink">
        <FlagIcon className="size-5 text-brand" />
        Your options
      </h2>
      <p className="mt-1 text-sm text-muted">Cheapest and quickest first.</p>

      <ul className="mt-4 space-y-3">
        {open.map((entry) => (
          <OpenRoute key={entry.route.id} entry={entry} />
        ))}
      </ul>

      {closed.length > 0 && (
        <ul className="mt-3 space-y-3">
          {closed.map((entry) => (
            <ClosedRoute key={entry.route.id} entry={entry} />
          ))}
        </ul>
      )}
    </section>
  );
}
