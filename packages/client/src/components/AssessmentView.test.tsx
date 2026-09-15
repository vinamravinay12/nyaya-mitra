import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AssessmentView } from './AssessmentView.js';
import { buildAssessment } from '../test-utils/fixtures.js';
import { expectNoViolations } from '../test-utils/axe.js';

describe('AssessmentView', () => {
  it('leads with the situation it matched', () => {
    render(<AssessmentView assessment={buildAssessment()} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Landlord is withholding my security deposit',
    );
  });

  it('shows the verdict, the deadlines, the options and the law', () => {
    render(<AssessmentView assessment={buildAssessment()} />);
    for (const heading of ['Your deadlines', 'Your options', 'The law this rests on']) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    }
    expect(screen.getByText('You can handle this yourself')).toBeInTheDocument();
  });

  it('escalates visibly when the landlord changed the locks', () => {
    render(<AssessmentView assessment={buildAssessment({ landlordChangedLocks: true })} />);
    expect(screen.getByText('Act now')).toBeInTheDocument();
    expect(screen.getByText(/Civil litigation \(property\)/)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<AssessmentView assessment={buildAssessment()} />);
    await expectNoViolations(container);
  });
});
