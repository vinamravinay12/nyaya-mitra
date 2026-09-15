import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StageView } from './StageView.js';
import { initialState, type SessionState } from '../state/session-reducer.js';
import type { Session } from '../state/use-session.js';
import { buildAssessment, rentalPlaybook } from '../test-utils/fixtures.js';

const session = (state: Partial<SessionState>): Session => ({
  state: { ...initialState, ...state },
  question: undefined,
  setScenario: vi.fn(),
  submitScenario: vi.fn(),
  answer: vi.fn(),
  restart: vi.fn(),
});

describe('StageView', () => {
  it('opens on the scenario form', () => {
    render(<StageView session={session({ stage: 'describe' })} />);
    expect(screen.getByLabelText('What happened?')).toBeInTheDocument();
  });

  it('shows the current question while answering', () => {
    const base = session({ stage: 'answering', playbook: rentalPlaybook });
    render(<StageView session={{ ...base, question: rentalPlaybook.decisiveFacts[0] }} />);
    expect(screen.getByLabelText('Which state was the property in?')).toBeInTheDocument();
  });

  it('warns about injected instructions found in the user text', () => {
    render(
      <StageView
        session={session({
          stage: 'answering',
          injectionFindings: [{ rule: 'override-instructions', excerpt: 'ignore instructions' }],
        })}
      />,
    );
    expect(screen.getByText(/looked like an instruction/)).toBeInTheDocument();
  });

  it('renders the assessment once there is one', () => {
    render(<StageView session={session({ stage: 'result', assessment: buildAssessment() })} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('security deposit');
  });

  it('renders nothing if the result stage is reached without an assessment', () => {
    const { container } = render(<StageView session={session({ stage: 'result' })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a refusal and an error differently', () => {
    const refused = render(
      <StageView session={session({ stage: 'refused', message: 'Criminal matter.' })} />,
    );
    expect(screen.getByRole('heading')).toHaveTextContent('This needs a professional');
    refused.unmount();

    render(<StageView session={session({ stage: 'error', message: 'No match.' })} />);
    expect(screen.getByRole('heading')).toHaveTextContent('We could not help here');
  });

  it('tolerates an error stage with no message', () => {
    render(<StageView session={session({ stage: 'error' })} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
