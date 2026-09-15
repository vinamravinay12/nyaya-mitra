import type { LegalReference } from '@nyaya-mitra/core';

export function GoverningLawList({
  references,
}: {
  readonly references: readonly LegalReference[];
}): React.JSX.Element {
  return (
    <section aria-labelledby="law-heading">
      <h2 id="law-heading" className="text-xl font-semibold text-ink">
        The law this rests on
      </h2>
      <ul className="mt-3 space-y-3">
        {references.map((reference) => (
          <li key={`${reference.act}-${reference.provision}`} className="text-sm">
            <p className="font-medium text-ink">
              {reference.act} {reference.year}, {reference.provision}
              {reference.stateSpecific === true && (
                <span className="ml-2 font-normal text-muted">(varies by state)</span>
              )}
            </p>
            <p className="text-muted">{reference.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
