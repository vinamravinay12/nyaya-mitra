import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LimitationAssessment, LimitationRule } from '@nyaya-mitra/core';
import { DeadlineList } from './DeadlineList.js';
import { expectNoViolations } from '../test-utils/axe.js';

const rule: LimitationRule = {
  id: 'clock',
  description: 'Recovering the deposit',
  reference: { act: 'Limitation Act', year: 1963, provision: 'Art.55', note: 'Three years.' },
  fromFact: 'vacateDate',
  durationDays: 1095,
  appliesWhen: null,
};

describe('DeadlineList', () => {
  it('renders nothing when no clock applies', () => {
    const { container } = render(<DeadlineList limitations={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the date, the days left and the citation', () => {
    const limitation: LimitationAssessment = {
      rule,
      status: 'critical',
      deadline: '2026-09-30',
      daysRemaining: 16,
    };
    render(<DeadlineList limitations={[limitation]} />);
    expect(screen.getByText(/Closing soon/)).toBeInTheDocument();
    expect(screen.getByText(/16 days left/)).toBeInTheDocument();
    expect(screen.getByText(/2026-09-30/)).toBeInTheDocument();
    expect(screen.getByText(/Limitation Act 1963, Art.55/)).toBeInTheDocument();
  });

  it('says what is missing when the clock cannot be run', () => {
    const limitation: LimitationAssessment = {
      rule,
      status: 'unknown',
      reason: 'We still need to know: vacateDate',
    };
    render(<DeadlineList limitations={[limitation]} />);
    expect(screen.getByText(/Needs a date/)).toBeInTheDocument();
    expect(screen.getByText(/We still need to know/)).toBeInTheDocument();
  });

  it('reads an expired window in the past tense', () => {
    render(
      <DeadlineList
        limitations={[{ rule, status: 'expired', deadline: '2025-01-01', daysRemaining: -60 }]}
      />,
    );
    expect(screen.getByText(/Window closed/)).toBeInTheDocument();
    expect(screen.getByText(/60 days ago/)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <DeadlineList
        limitations={[{ rule, status: 'comfortable', deadline: '2029-06-30', daysRemaining: 900 }]}
      />,
    );
    await expectNoViolations(container);
  });
});
