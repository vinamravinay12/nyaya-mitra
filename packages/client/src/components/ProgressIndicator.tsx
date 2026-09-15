interface ProgressIndicatorProps {
  readonly answered: number;
  readonly total: number;
}

/**
 * Tells the user how much is left.
 *
 * An open-ended sequence of questions is where people give up; a visible end
 * point is the cheapest way to stop that.
 *
 * Uses a native `<progress>` element rather than a styled div: it carries the
 * right semantics without any ARIA, and it avoids an inline width style.
 */
export function ProgressIndicator({ answered, total }: ProgressIndicatorProps): React.JSX.Element {
  const current = Math.min(answered + 1, total);

  return (
    <div>
      <label
        htmlFor="intake-progress"
        className="text-xs font-semibold tracking-widest text-muted uppercase"
      >
        Question {current} of {total}
      </label>
      <progress
        id="intake-progress"
        value={answered}
        max={total}
        className="mt-2 block h-2 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-brand [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-line [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-brand"
      >
        {answered} of {total}
      </progress>
    </div>
  );
}
