/**
 * Present on every screen, not buried at the end.
 *
 * The product deliberately tells some users they do not need a lawyer; that
 * only works if the limits of the advice are visible at the same moment.
 */
export function Disclaimer(): React.JSX.Element {
  return (
    <p className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-muted">
      Nyaya Mitra explains general legal information about Indian law. It is not a lawyer and does
      not give legal advice. For anything that matters to you, confirm it with a qualified
      professional.
    </p>
  );
}
