import type { PlaybookSummary } from '../api/types.js';
import {
  BagIcon,
  BriefcaseIcon,
  BuildingIcon,
  HomeIcon,
  NoteIcon,
  ShieldIcon,
} from '../icons/index.js';

interface ExampleScenariosProps {
  /** `null` while the catalogue is still loading. */
  readonly playbooks: readonly PlaybookSummary[] | null;
  readonly onPick: (scenario: string) => void;
}

interface DomainStyle {
  readonly label: string;
  readonly Icon: typeof HomeIcon;
}

const DOMAINS: Record<string, DomainStyle> = {
  rental: { label: 'Renting a home', Icon: HomeIcon },
  'housing-society': { label: 'Society and builders', Icon: BuildingIcon },
  employment: { label: 'Work and employers', Icon: BriefcaseIcon },
  consumer: { label: 'Shopping and services', Icon: BagIcon },
  'cyber-fraud': { label: 'Fraud and scams', Icon: ShieldIcon },
  'money-recovery': { label: 'Money owed to you', Icon: NoteIcon },
};

/** Matched on the real card and the placeholder, so nothing moves on load. */
const CARD = 'card min-h-28 p-4';
const EXPECTED_GROUPS = 4;

/** Groups in catalogue order, which the registry keeps sorted by domain. */
function groupByDomain(
  playbooks: readonly PlaybookSummary[],
): readonly (readonly [string, readonly PlaybookSummary[]])[] {
  const groups = new Map<string, PlaybookSummary[]>();
  for (const playbook of playbooks) {
    const existing = groups.get(playbook.domain);
    if (existing === undefined) {
      groups.set(playbook.domain, [playbook]);
    } else {
      existing.push(playbook);
    }
  }
  return [...groups.entries()];
}

function Placeholder(): React.JSX.Element {
  return (
    <div className="mt-5 space-y-6" aria-hidden="true">
      {Array.from({ length: EXPECTED_GROUPS }, (_, group) => (
        <div key={group}>
          <div className="h-3.5 w-36 rounded-full bg-line" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }, (_, card) => (
              <div key={card} className={CARD}>
                <div className="h-3 w-full rounded-full bg-surface" />
                <div className="mt-2.5 h-3 w-4/5 rounded-full bg-surface" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DomainGroup({
  domain,
  playbooks,
  onPick,
}: {
  readonly domain: string;
  readonly playbooks: readonly PlaybookSummary[];
  readonly onPick: (scenario: string) => void;
}): React.JSX.Element {
  const style = DOMAINS[domain];

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
        {style !== undefined && <style.Icon className="size-4 text-brand" />}
        {style?.label ?? domain}
      </h3>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {playbooks.map((playbook) => (
          <li key={playbook.id}>
            <button
              type="button"
              onClick={() => {
                onPick(playbook.examplePrompt);
              }}
              className={`${CARD} card-interactive hover:card-interactive-hover h-full w-full text-left text-sm leading-relaxed text-ink-soft hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand`}
            >
              “{playbook.examplePrompt}”
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * One-click examples drawn from the playbooks themselves, grouped by domain.
 *
 * Grouping does double duty: it keeps twelve examples scannable, and the group
 * headings themselves communicate what the product covers.
 */
export function ExampleScenarios({
  playbooks,
  onPick,
}: ExampleScenariosProps): React.JSX.Element | null {
  if (playbooks !== null && playbooks.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="examples-heading">
      <h2
        id="examples-heading"
        className="text-xs font-semibold tracking-widest text-muted uppercase"
      >
        Things people ask us
      </h2>
      <p className="mt-2 text-sm text-muted">Pick one to try it, or write your own above.</p>
      {playbooks === null ? (
        <Placeholder />
      ) : (
        <div className="mt-5 space-y-6">
          {groupByDomain(playbooks).map(([domain, group]) => (
            <DomainGroup key={domain} domain={domain} playbooks={group} onPick={onPick} />
          ))}
        </div>
      )}
    </section>
  );
}
