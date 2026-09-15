import type { TriageResult } from '@nyaya-mitra/core';
import { describeBand } from '../format/format-values.js';
import { AlertIcon, CheckIcon, ClockIcon, FlagIcon } from '../icons/index.js';

interface BandStyle {
  readonly box: string;
  readonly chip: string;
  readonly Icon: typeof CheckIcon;
  readonly kicker: string;
}

/**
 * Colour is paired with an icon and a sentence in every case: the band must be
 * readable to someone who cannot distinguish the colours.
 */
const BAND_STYLE: Record<TriageResult['band'], BandStyle> = {
  'self-serve': {
    box: 'border-ok-border bg-ok-bg text-ok-fg',
    chip: 'bg-ok-solid',
    Icon: CheckIcon,
    kicker: 'Our read',
  },
  guided: {
    box: 'border-warn-border bg-warn-bg text-warn-fg',
    chip: 'bg-warn-solid',
    Icon: ClockIcon,
    kicker: 'Our read',
  },
  'lawyer-recommended': {
    box: 'border-alert-border bg-alert-bg text-alert-fg',
    chip: 'bg-alert-solid',
    Icon: FlagIcon,
    kicker: 'Our read',
  },
  urgent: {
    box: 'border-danger-border bg-danger-bg text-danger-fg',
    chip: 'bg-danger-solid',
    Icon: AlertIcon,
    kicker: 'Time matters here',
  },
};

export function TriageBanner({ triage }: { readonly triage: TriageResult }): React.JSX.Element {
  const style = BAND_STYLE[triage.band];

  return (
    <section
      aria-labelledby="triage-heading"
      className={`rounded-2xl border-2 p-6 sm:p-7 ${style.box}`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-card ${style.chip}`}
        >
          <style.Icon className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest uppercase opacity-80">
            {style.kicker}
          </p>
          <h2 id="triage-heading" className="mt-1 text-2xl font-semibold text-balance">
            {describeBand(triage.band)}
          </h2>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {triage.reasons.map((reason) => (
          <li key={reason.code} className="flex gap-3 leading-relaxed">
            <span
              aria-hidden="true"
              className={`mt-2 size-1.5 shrink-0 rounded-full ${style.chip}`}
            />
            {reason.message}
          </li>
        ))}
      </ul>

      {triage.lawyerSpecialisation !== undefined && (
        <p className="mt-5 rounded-xl border border-line bg-card px-4 py-3 text-sm">
          <span className="font-semibold text-ink">Look for: </span>
          <span className="text-ink-soft">{triage.lawyerSpecialisation}</span>
        </p>
      )}
    </section>
  );
}
