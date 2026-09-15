interface ScenarioFormProps {
  readonly scenario: string;
  readonly busy: boolean;
  readonly onScenarioChange: (scenario: string) => void;
  readonly onSubmit: () => void;
}

const MIN_LENGTH = 10;

export function ScenarioForm({
  scenario,
  busy,
  onScenarioChange,
  onSubmit,
}: ScenarioFormProps): React.JSX.Element {
  const tooShort = scenario.trim().length < MIN_LENGTH;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!tooShort && !busy) {
          onSubmit();
        }
      }}
    >
      <label htmlFor="scenario" className="block text-lg font-medium text-ink">
        What happened?
      </label>
      <p id="scenario-help" className="mt-1 text-sm text-muted">
        Describe it in your own words — who was involved, what they did, and roughly when.
      </p>
      <textarea
        id="scenario"
        name="scenario"
        aria-describedby="scenario-help"
        required
        rows={6}
        value={scenario}
        onChange={(event) => {
          onScenarioChange(event.target.value);
        }}
        className="mt-3 w-full rounded-md border border-line bg-white p-3 text-ink focus:border-brand focus:outline-2 focus:outline-brand"
        placeholder="My landlord has not returned my deposit since I moved out in July…"
      />
      <button
        type="submit"
        disabled={tooShort || busy}
        className="mt-3 rounded-md bg-brand px-5 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? 'Working…' : 'Find out where I stand'}
      </button>
    </form>
  );
}
