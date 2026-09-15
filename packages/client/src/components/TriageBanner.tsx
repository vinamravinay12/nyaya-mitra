import type { TriageResult } from '@nyaya-mitra/core';
import { describeBand } from '../format/format-values.js';

/**
 * Colour is paired with a word and an icon in every case: the band must be
 * readable to someone who cannot distinguish the colours.
 */
const BAND_STYLE: Record<TriageResult['band'], { readonly box: string; readonly mark: string }> = {
  'self-serve': { box: 'border-green-600 bg-green-50 text-green-900', mark: '✓' },
  guided: { box: 'border-amber-600 bg-amber-50 text-amber-900', mark: '!' },
  'lawyer-recommended': { box: 'border-orange-600 bg-orange-50 text-orange-900', mark: '⚑' },
  urgent: { box: 'border-red-700 bg-red-50 text-red-900', mark: '⚠' },
};

export function TriageBanner({ triage }: { readonly triage: TriageResult }): React.JSX.Element {
  const style = BAND_STYLE[triage.band];

  return (
    <section aria-labelledby="triage-heading" className={`rounded-lg border-2 p-5 ${style.box}`}>
      <h2 id="triage-heading" className="text-xl font-semibold">
        <span aria-hidden="true">{style.mark} </span>
        {describeBand(triage.band)}
      </h2>
      <ul className="mt-3 space-y-2">
        {triage.reasons.map((reason) => (
          <li key={reason.code}>{reason.message}</li>
        ))}
      </ul>
      {triage.lawyerSpecialisation !== undefined && (
        <p className="mt-3 font-medium">Look for: {triage.lawyerSpecialisation}</p>
      )}
    </section>
  );
}
