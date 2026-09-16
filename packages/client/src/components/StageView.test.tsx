import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StageView } from './StageView.js';
import { initialState, type SessionState } from '../state/session-reducer.js';
import type { Session } from '../state/use-session.js';
import { buildAssessment, rentalPlaybook } from '../test-utils/fixtures.js';

const session = (state: Partial<SessionState>): Session => ({
  state: { ...initialState, ...state },
  question: undefined,
  progress: { answered: 0, total: 7 },
  setScenario: vi.fn(),
  submitScenario: vi.fn(),
  answer: vi.fn(),
  restart: vi.fn(),
  rejectMatch: vi.fn(),
  changeAnswer: vi.fn(),
  attachDocument: vi.fn(),
  clearDocument: vi.fn(),
  goBack: undefined,
});

describe('StageView', () => {
  it('opens on the scenario form with the walkthrough around it', () => {
    render(<StageView session={session({ stage: 'describe' })} />);
    expect(screen.getByLabelText('What happened?')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Find out where you stand');
    expect(screen.getByRole('heading', { name: 'How it works' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What we do not cover' })).toBeInTheDocument();
  });

  it('reserves space for examples before the catalogue arrives', () => {
    render(<StageView session={session({ stage: 'describe', catalogue: null })} />);
    expect(screen.getByRole('heading', { name: 'Things people ask us' })).toBeInTheDocument();
  });

  it('offers examples once the catalogue has loaded', () => {
    render(
      <StageView
        session={session({
          stage: 'describe',
          catalogue: [
            {
              id: 'rental.deposit_withheld',
              domain: 'rental',
              title: 'Deposit withheld',
              summary: 'x',
              examplePrompt: 'My landlord has not returned my deposit since July.',
            },
          ],
        })}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Things people ask us' })).toBeInTheDocument();
  });

  it('moves focus to the box when an example is picked, so it is visible', async () => {
    const base = session({
      stage: 'describe',
      catalogue: [
        {
          id: 'rental.deposit_withheld',
          domain: 'rental',
          title: 'Deposit withheld',
          summary: 'x',
          examplePrompt: 'My landlord has not returned my deposit since July.',
        },
      ],
    });
    render(<StageView session={base} />);
    await userEvent.click(screen.getByRole('button', { name: /My landlord/ }));
    expect(base.setScenario).toHaveBeenCalledWith(
      'My landlord has not returned my deposit since July.',
    );
    expect(screen.getByLabelText('What happened?')).toHaveFocus();
  });

  it('lets the user reject a wrong match without losing what they wrote', async () => {
    const base = session({ stage: 'answering', playbook: rentalPlaybook });
    render(<StageView session={{ ...base, question: rentalPlaybook.decisiveFacts[0] }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Not your situation?' }));
    expect(base.rejectMatch).toHaveBeenCalledOnce();
  });

  it('shows the current question, the situation and the progress while answering', () => {
    const base = session({ stage: 'answering', playbook: rentalPlaybook });
    render(
      <StageView
        session={{
          ...base,
          question: rentalPlaybook.decisiveFacts[0],
          progress: { answered: 2, total: 7 },
        }}
      />,
    );
    expect(screen.getByLabelText('Which state was the property in?')).toBeInTheDocument();
    expect(screen.getByText(rentalPlaybook.title)).toBeInTheDocument();
    expect(screen.getByText('Question 3 of 7')).toBeInTheDocument();
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

  it('renders the assessment once there is one', async () => {
    render(<StageView session={session({ stage: 'result', assessment: buildAssessment() })} />);
    // The results view is code-split, so it resolves a tick after render.
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('security deposit');
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
