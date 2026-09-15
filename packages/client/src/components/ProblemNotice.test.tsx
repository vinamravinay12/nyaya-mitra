import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProblemNotice } from './ProblemNotice.js';
import { expectNoViolations } from '../test-utils/axe.js';

const covered = [
  { id: 'rental.deposit_withheld', title: 'Landlord is withholding my security deposit' },
  { id: 'employment.unpaid_salary', title: 'My employer has not paid me' },
];

describe('ProblemNotice', () => {
  it('frames a refusal as needing a professional', () => {
    render(<ProblemNotice refused message="This is a criminal matter." covered={[]} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'This needs a professional',
    );
    expect(screen.getByText('This is a criminal matter.')).toBeInTheDocument();
  });

  it('never lists the catalogue on a refusal, which is a judgement not a gap', () => {
    render(<ProblemNotice refused message="Criminal matter." covered={[]} />);
    expect(screen.queryByText('What we can help with today')).not.toBeInTheDocument();
  });

  it('frames an unsupported situation as a gap in the product', () => {
    render(<ProblemNotice refused={false} message="No match." covered={covered} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('We do not cover this yet');
  });

  it('tells the user what it can help with instead of stopping dead', () => {
    render(<ProblemNotice refused={false} message="No match." covered={covered} />);
    expect(screen.getByText('What we can help with today')).toBeInTheDocument();
    for (const situation of covered) {
      expect(screen.getByText(situation.title)).toBeInTheDocument();
    }
  });

  it('falls back to a plain failure when there is no catalogue to offer', () => {
    render(<ProblemNotice refused={false} message="Service failed." covered={[]} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('We could not help here');
  });

  it('announces itself to assistive technology', () => {
    render(<ProblemNotice refused message="x" covered={[]} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('has no accessibility violations in either shape', async () => {
    const refusal = render(<ProblemNotice refused message="x" covered={[]} />);
    await expectNoViolations(refusal.container);
    refusal.unmount();

    const gap = render(<ProblemNotice refused={false} message="x" covered={covered} />);
    await expectNoViolations(gap.container);
  });
});
