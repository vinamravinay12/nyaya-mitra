import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DecisiveFact } from '@nyaya-mitra/core';
import { QuestionCard } from './QuestionCard.js';
import { expectNoViolations } from '../test-utils/axe.js';

const fact = (overrides: Partial<DecisiveFact>): DecisiveFact => ({
  id: 'vacateDate',
  kind: 'date',
  question: 'When did you hand over possession?',
  why: 'This starts the limitation clock.',
  required: true,
  ...overrides,
});

describe('QuestionCard', () => {
  it('shows the question and why it is being asked', () => {
    render(<QuestionCard fact={fact({})} onAnswer={vi.fn()} />);
    expect(screen.getByLabelText('When did you hand over possession?')).toHaveAccessibleDescription(
      'This starts the limitation clock.',
    );
  });

  it('uses a date input for a date fact', () => {
    render(<QuestionCard fact={fact({})} onAnswer={vi.fn()} />);
    expect(screen.getByLabelText(/When did you/)).toHaveAttribute('type', 'date');
  });

  it('groups a yes/no question so it is announced as one question', () => {
    render(
      <QuestionCard
        fact={fact({ id: 'writtenAgreement', kind: 'boolean', question: 'Written agreement?' })}
        onAnswer={vi.fn()}
      />,
    );
    const group = screen.getByRole('group', { name: 'Written agreement?' });
    expect(group).toHaveAccessibleDescription('This starts the limitation clock.');
  });

  it('returns money as a number, not a string', async () => {
    const onAnswer = vi.fn();
    render(
      <QuestionCard
        fact={fact({ id: 'depositAmountInr', kind: 'money', question: 'How much?' })}
        onAnswer={onAnswer}
      />,
    );
    await userEvent.type(screen.getByLabelText('How much?'), '80000');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onAnswer).toHaveBeenCalledWith(80_000);
  });

  it('returns trimmed text for a text fact', async () => {
    const onAnswer = vi.fn();
    render(
      <QuestionCard
        fact={fact({ id: 'state', kind: 'text', question: 'Which state?' })}
        onAnswer={onAnswer}
      />,
    );
    await userEvent.type(screen.getByLabelText('Which state?'), '  Karnataka  ');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onAnswer).toHaveBeenCalledWith('Karnataka');
  });

  it('ignores an empty submission', async () => {
    const onAnswer = vi.fn();
    render(
      <QuestionCard
        fact={fact({ id: 'state', kind: 'text', question: 'Which state?' })}
        onAnswer={onAnswer}
      />,
    );
    await userEvent.type(screen.getByLabelText('Which state?'), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('offers yes and no for a boolean fact', async () => {
    const onAnswer = vi.fn();
    render(
      <QuestionCard
        fact={fact({ id: 'writtenAgreement', kind: 'boolean', question: 'Written agreement?' })}
        onAnswer={onAnswer}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onAnswer).toHaveBeenCalledWith(true);

    await userEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(onAnswer).toHaveBeenLastCalledWith(false);
  });

  it('has no accessibility violations for either input style', async () => {
    const text = render(<QuestionCard fact={fact({})} onAnswer={vi.fn()} />);
    await expectNoViolations(text.container);
    text.unmount();

    const boolean = render(<QuestionCard fact={fact({ kind: 'boolean' })} onAnswer={vi.fn()} />);
    await expectNoViolations(boolean.container);
  });
});
