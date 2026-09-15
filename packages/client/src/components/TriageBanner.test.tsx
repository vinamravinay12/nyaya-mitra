import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TriageResult } from '@nyaya-mitra/core';
import { TriageBanner } from './TriageBanner.js';
import { expectNoViolations } from '../test-utils/axe.js';

const triage = (overrides: Partial<TriageResult> = {}): TriageResult => ({
  band: 'self-serve',
  reasons: [{ code: 'a', message: 'Nothing here needs a lawyer yet.' }],
  ...overrides,
});

describe('TriageBanner', () => {
  it('states the verdict in words, not only colour', () => {
    render(<TriageBanner triage={triage()} />);
    expect(screen.getByRole('heading')).toHaveTextContent('You can handle this yourself');
  });

  it('lists every reason behind the verdict', () => {
    render(
      <TriageBanner
        triage={triage({
          reasons: [
            { code: 'a', message: 'First reason.' },
            { code: 'b', message: 'Second reason.' },
          ],
        })}
      />,
    );
    expect(screen.getByText('First reason.')).toBeInTheDocument();
    expect(screen.getByText('Second reason.')).toBeInTheDocument();
  });

  it('names the kind of lawyer only when one is recommended', () => {
    const { unmount } = render(<TriageBanner triage={triage()} />);
    expect(screen.queryByText(/Look for:/)).not.toBeInTheDocument();
    unmount();

    render(
      <TriageBanner
        triage={triage({ band: 'urgent', lawyerSpecialisation: 'Civil litigation (property)' })}
      />,
    );
    expect(screen.getByText(/Civil litigation \(property\)/)).toBeInTheDocument();
  });

  it('renders every band without accessibility violations', async () => {
    for (const band of ['self-serve', 'guided', 'lawyer-recommended', 'urgent'] as const) {
      const view = render(<TriageBanner triage={triage({ band })} />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
      await expectNoViolations(view.container);
      view.unmount();
    }
  });
});
