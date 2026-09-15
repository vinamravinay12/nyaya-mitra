import type { LegalReference } from '@nyaya-mitra/core';
import { ScaleIcon } from '../icons/index.js';

export function GoverningLawList({
  references,
}: {
  readonly references: readonly LegalReference[];
}): React.JSX.Element {
  return (
    <section aria-labelledby="law-heading">
      <h2 id="law-heading" className="flex items-center gap-2 text-xl font-semibold text-ink">
        <ScaleIcon className="size-5 text-brand" />
        The law this rests on
      </h2>
      <ul className="mt-4 space-y-4 border-l-2 border-line pl-5">
        {references.map((reference) => (
          <li key={`${reference.act}-${reference.provision}`}>
            <p className="font-semibold text-ink">
              {reference.act} {reference.year}
              <span className="ml-2 rounded bg-brand-soft px-1.5 py-0.5 font-mono text-sm text-brand">
                {reference.provision}
              </span>
              {reference.stateSpecific === true && (
                <span className="ml-2 text-sm font-normal text-accent">varies by state</span>
              )}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{reference.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
