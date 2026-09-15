import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HowItWorks } from './HowItWorks.js';
import { expectNoViolations } from '../test-utils/axe.js';

describe('HowItWorks', () => {
  it('describes the three steps in order', () => {
    render(<HowItWorks />);
    const steps = screen.getAllByRole('listitem');
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent('Tell us what happened');
    expect(steps[1]).toHaveTextContent('Answer a few questions');
    expect(steps[2]).toHaveTextContent('See where you stand');
  });

  it('uses an ordered list, so the sequence is conveyed structurally', () => {
    const { container } = render(<HowItWorks />);
    expect(container.querySelector('ol')).not.toBeNull();
  });

  it('sets expectations about how many questions to expect', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/usually three or four/)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<HowItWorks />);
    await expectNoViolations(container);
  });
});
