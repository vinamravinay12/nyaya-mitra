const STEPS = [
  {
    n: '1',
    title: 'Tell us what happened',
    body: 'Plain language, the way you would explain it to a friend. No legal terms needed.',
  },
  {
    n: '2',
    title: 'Answer a few questions',
    body: 'Only the ones that change the answer — usually three or four. We say why we are asking each.',
  },
  {
    n: '3',
    title: 'See where you stand',
    body: 'Your options with real costs and timelines, the deadlines that apply, and whether a lawyer is worth it.',
  },
] as const;

export function HowItWorks(): React.JSX.Element {
  return (
    <section aria-labelledby="how-heading">
      <h2 id="how-heading" className="text-xs font-semibold tracking-widest text-muted uppercase">
        How it works
      </h2>
      <ol className="mt-5 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.n} className="card relative p-5 pt-6">
            <span
              aria-hidden="true"
              className="absolute -top-3 left-5 inline-flex size-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-card shadow-sm"
            >
              {step.n}
            </span>
            <h3 className="font-semibold text-ink">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
