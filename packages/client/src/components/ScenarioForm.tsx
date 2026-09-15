interface ScenarioFormProps {
  readonly scenario: string;
  readonly busy: boolean;
  readonly onScenarioChange: (scenario: string) => void;
  readonly onSubmit: () => void;
  /** Lets the page move focus here after an example is picked. */
  readonly textareaRef?: React.Ref<HTMLTextAreaElement>;
}

const MIN_LENGTH = 10;

export function ScenarioForm({
  scenario,
  busy,
  onScenarioChange,
  onSubmit,
  textareaRef,
}: ScenarioFormProps): React.JSX.Element {
  const tooShort = scenario.trim().length < MIN_LENGTH;

  return (
    <form
      className="card p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!tooShort && !busy) {
          onSubmit();
        }
      }}
    >
      <label htmlFor="scenario" className="block text-lg font-semibold text-ink">
        What happened?
      </label>
      <p id="scenario-help" className="mt-1 text-sm text-muted">
        Describe it in your own words — who was involved, what they did, and roughly when.
      </p>
      <textarea
        id="scenario"
        ref={textareaRef}
        name="scenario"
        aria-describedby="scenario-help"
        required
        rows={5}
        value={scenario}
        onChange={(event) => {
          onScenarioChange(event.target.value);
        }}
        className="mt-4 w-full resize-y rounded-xl border border-line bg-surface/60 p-4 leading-relaxed text-ink placeholder:text-muted/70 focus:border-brand focus:bg-card focus:outline-2 focus:outline-offset-1 focus:outline-brand"
        placeholder="My landlord has not returned my deposit since I moved out in July…"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={tooShort || busy}
          className="rounded-xl bg-brand px-6 py-3 font-semibold text-card transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Working…' : 'Find out where I stand'}
        </button>
        <p className="text-sm text-muted">Free. Nothing is saved.</p>
      </div>
    </form>
  );
}
