import type { RouteAvailability } from '@nyaya-mitra/core';
import { formatDayRange, formatRupees } from '../format/format-values.js';

function RouteRow({ entry }: { readonly entry: RouteAvailability }): React.JSX.Element {
  const { route } = entry;
  return (
    <li
      className={`rounded-md border p-4 ${entry.available ? 'border-line' : 'border-dashed border-line opacity-70'}`}
    >
      <h3 className="font-medium text-ink">
        {route.label}
        {!entry.available && <span className="ml-2 text-sm text-muted">(not open to you)</span>}
      </h3>
      <p className="mt-1 text-sm text-muted">{route.forum}</p>
      {entry.available ? (
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink">
          <div>
            <dt className="inline font-medium">Cost: </dt>
            <dd className="inline">{route.costInr === 0 ? 'Free' : formatRupees(route.costInr)}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Time: </dt>
            <dd className="inline">{formatDayRange(route.minDays, route.maxDays)}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Effort: </dt>
            <dd className="inline">{route.effort}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-2 text-sm text-ink">{entry.reason}</p>
      )}
      {entry.available && <p className="mt-2 text-sm text-muted">{route.costNote}</p>}
    </li>
  );
}

export function RouteList({
  routes,
}: {
  readonly routes: readonly RouteAvailability[];
}): React.JSX.Element {
  return (
    <section aria-labelledby="routes-heading">
      <h2 id="routes-heading" className="text-xl font-semibold text-ink">
        Your options
      </h2>
      <ul className="mt-3 space-y-3">
        {routes.map((entry) => (
          <RouteRow key={entry.route.id} entry={entry} />
        ))}
      </ul>
    </section>
  );
}
