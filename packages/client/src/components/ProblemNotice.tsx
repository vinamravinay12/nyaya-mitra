import type { CoveredSituation } from '../api/types.js';

interface ProblemNoticeProps {
  readonly refused: boolean;
  readonly message: string;
  /** Non-empty when we simply do not cover the situation yet. */
  readonly covered: readonly CoveredSituation[];
}

const headingFor = (refused: boolean, hasCatalogue: boolean): string => {
  if (refused) {
    return 'This needs a professional';
  }
  return hasCatalogue ? 'We do not cover this yet' : 'We could not help here';
};

/**
 * A refusal, an unsupported situation and a failure are three different things.
 *
 * Only the first is a judgement about the case. The second is a gap in this
 * product, so it says what the gap is rather than implying the user did
 * something wrong.
 */
export function ProblemNotice({
  refused,
  message,
  covered,
}: ProblemNoticeProps): React.JSX.Element {
  const hasCatalogue = covered.length > 0;

  return (
    <div role="alert" className="rounded-lg border-2 border-amber-700 bg-amber-50 p-5">
      <h1 className="text-xl font-semibold text-amber-900">{headingFor(refused, hasCatalogue)}</h1>
      <p className="mt-2 text-amber-900">{message}</p>
      {hasCatalogue && (
        <>
          <h2 className="mt-4 font-medium text-amber-900">What we can help with today</h2>
          <ul className="mt-2 list-disc pl-5 text-amber-900">
            {covered.map((situation) => (
              <li key={situation.id}>{situation.title}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
