import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { DecisiveFact } from '@nyaya-mitra/core';
import { AnswerSummary } from './AnswerSummary.js';
import { expectNoViolations } from '../test-utils/axe.js';

const fact = (over: Partial<DecisiveFact>): DecisiveFact => ({
  id: 'state',
  kind: 'text',
  question: 'Which state was the property in?',
  why: 'w',
  required: true,
  ...over,
});

const facts = [
  fact({}),
  fact({ id: 'depositAmountInr', kind: 'money', question: 'How much deposit did you pay?' }),
  fact({ id: 'writtenAgreement', kind: 'boolean', question: 'Do you have a written agreement?' }),
  fact({ id: 'vacateDate', kind: 'date', question: 'When did you hand over possession?' }),
  fact({
    id: 'restrictionMonths',
    kind: 'number',
    unit: 'months',
    question: 'For how many months does it apply?',
  }),
  fact({ id: 'unanswered', question: 'Not answered yet?' }),
];

const answers = {
  state: 'Karnataka',
  depositAmountInr: 80_000,
  writtenAgreement: false,
  vacateDate: '2026-07-01',
  restrictionMonths: 12,
};

describe('AnswerSummary', () => {
  it('renders nothing before anything is answered', () => {
    const { container } = render(<AnswerSummary facts={facts} answers={{}} onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows each answer the way the user gave it', () => {
    render(<AnswerSummary facts={facts} answers={answers} onChange={vi.fn()} />);
    expect(screen.getByText('Karnataka')).toBeInTheDocument();
    expect(screen.getByText('₹80,000')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('2026-07-01')).toBeInTheDocument();
    // A duration must not be rendered as currency.
    expect(screen.getByText('12 months')).toBeInTheDocument();
    expect(screen.queryByText('₹12')).not.toBeInTheDocument();
  });

  it('lists only questions that have been answered', () => {
    render(<AnswerSummary facts={facts} answers={answers} onChange={vi.fn()} />);
    expect(screen.queryByText('Not answered yet?')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('treats a cleared answer as unanswered', () => {
    render(
      <AnswerSummary facts={facts} answers={{ ...answers, state: null }} onChange={vi.fn()} />,
    );
    expect(screen.queryByText('Karnataka')).not.toBeInTheDocument();
  });

  it('asks to re-open the exact fact that was clicked', async () => {
    const onChange = vi.fn();
    render(<AnswerSummary facts={facts} answers={answers} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /How much deposit did you pay/ }));
    expect(onChange).toHaveBeenCalledWith('depositAmountInr');
  });

  it('distinguishes the change buttons for a screen reader', () => {
    render(<AnswerSummary facts={facts} answers={answers} onChange={vi.fn()} />);
    // Every button reads "Change" visually, so each needs its question appended.
    expect(
      screen.getByRole('button', { name: /Which state was the property in/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Do you have a written agreement/ }),
    ).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <AnswerSummary facts={facts} answers={answers} onChange={vi.fn()} />,
    );
    await expectNoViolations(container);
  });
});
