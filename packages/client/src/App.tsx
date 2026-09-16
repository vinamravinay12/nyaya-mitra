import { Disclaimer } from './components/Disclaimer.js';
import { ThemeToggle } from './components/ThemeToggle.js';
import { ScaleIcon } from './icons/index.js';
import { SkipLink } from './components/SkipLink.js';
import { StageView } from './components/StageView.js';
import { useSession } from './state/use-session.js';
import { useTheme } from './state/use-theme.js';

export function App(): React.JSX.Element {
  const session = useSession();
  const theme = useTheme();

  return (
    <>
      <SkipLink />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-brand text-card">
            <ScaleIcon className="size-5" />
          </span>
          <span className="mr-auto">
            <span className="block leading-tight font-semibold text-ink">Nyaya Mitra</span>
            <span className="block text-xs leading-tight text-muted">
              Everyday legal problems in India
            </span>
          </span>
          <ThemeToggle preference={theme.preference} onChange={theme.setPreference} />
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
              className="rounded-xl border border-line bg-card px-5 py-2.5 font-medium text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
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
