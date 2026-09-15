import { ShieldIcon } from '../icons/index.js';

const OUT_OF_SCOPE = [
  'Criminal defence',
  'Divorce, custody and family matters',
  'Immigration and visas',
  'Anything already before a court',
] as const;

/**
 * Stated up front rather than discovered after typing.
 *
 * Someone with a custody question should find that out before describing
 * something painful to a tool that cannot help them.
 */
export function ScopeNote(): React.JSX.Element {
  return (
    <section aria-labelledby="scope-heading" className="card bg-accent-soft/60 p-5">
      <h2 id="scope-heading" className="flex items-center gap-2 font-semibold text-ink">
        <ShieldIcon className="size-5 text-accent" />
        What we do not cover
      </h2>
      <p className="mt-1.5 text-sm text-muted">
        These need a qualified professional, and we will say so rather than guess:
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {OUT_OF_SCOPE.map((item) => (
          <li
            key={item}
            className="rounded-full border border-line bg-card px-3 py-1 text-sm text-ink-soft"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
