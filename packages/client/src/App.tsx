import { Disclaimer } from './components/Disclaimer.js';
import { SkipLink } from './components/SkipLink.js';
import { StageView } from './components/StageView.js';
import { useSession } from './state/use-session.js';

export function App(): React.JSX.Element {
  const session = useSession();

  return (
    <>
      <SkipLink />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <p className="text-sm font-medium tracking-wide text-brand uppercase">Nyaya Mitra</p>
          <p className="text-muted">Everyday legal problems in India, explained.</p>
        </header>

        <main id="main" className="space-y-8">
          <p aria-live="polite" className="sr-only">
            {session.state.busy ? 'Working on your answer' : ''}
          </p>

          <StageView session={session} />

          {session.state.stage !== 'describe' && (
            <button
              type="button"
              onClick={session.restart}
              className="rounded-md border border-line px-4 py-2 text-ink"
            >
              Start again
            </button>
          )}

          <Disclaimer />
        </main>
      </div>
    </>
  );
}
