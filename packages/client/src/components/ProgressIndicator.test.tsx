import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressIndicator } from './ProgressIndicator.js';
import { expectNoViolations } from '../test-utils/axe.js';

describe('ProgressIndicator', () => {
  it('counts the question being asked, not the ones answered', () => {
    render(<ProgressIndicator answered={0} total={6} />);
    expect(screen.getByText('Question 1 of 6')).toBeInTheDocument();
  });

  it('advances with each answer', () => {
    render(<ProgressIndicator answered={2} total={6} />);
    expect(screen.getByText('Question 3 of 6')).toBeInTheDocument();
  });

  it('does not count past the end when every question is answered', () => {
    render(<ProgressIndicator answered={6} total={6} />);
    expect(screen.getByText('Question 6 of 6')).toBeInTheDocument();
  });

  it('exposes progress to assistive technology', () => {
    render(<ProgressIndicator answered={2} total={6} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('value', '2');
    expect(bar).toHaveAttribute('max', '6');
  });

  it('survives a zero total without dividing by it', () => {
    render(<ProgressIndicator answered={0} total={0} />);
    expect(screen.getByText('Question 0 of 0')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ProgressIndicator answered={2} total={6} />);
    await expectNoViolations(container);
  });
});
