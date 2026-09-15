import { ScaleIcon } from '../icons/index.js';

interface HeroProps {
  /** `null` while the catalogue is loading. Derived, never hard-coded, so the
   *  headline count cannot drift from what the engine actually covers. */
  readonly situationCount: number | null;
}

export function Hero({ situationCount }: HeroProps): React.JSX.Element {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-deep px-6 py-10 text-brand-onDeep sm:px-10 sm:py-14">
      {/* Decorative wash; kept behind content and hidden from the accessibility tree. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-brand opacity-40 blur-3xl"
      />
      <div className="relative">
        <p className="flex items-center gap-2 text-sm font-medium tracking-wide text-brand-onDeep/70 uppercase">
          <ScaleIcon className="size-4" />
          Indian law, in plain language
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          Find out where you stand.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-pretty text-brand-onDeep/80">
          Describe an everyday legal problem in your own words. We will tell you what your options
          are, what they cost, how long you have — and whether you actually need a lawyer.
        </p>
        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
          {[
            [situationCount === null ? '—' : String(situationCount), 'situations covered'],
            ['3–4', 'questions, usually'],
            ['₹0', 'to find out'],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="block text-2xl font-semibold">{value}</span>
                <span className="text-sm text-brand-onDeep/70">{label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
