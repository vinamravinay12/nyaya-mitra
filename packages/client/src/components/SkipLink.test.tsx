import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SkipLink } from './SkipLink.js';
import { expectNoViolations } from '../test-utils/axe.js';

describe('SkipLink', () => {
  it('points at the main landmark', () => {
    render(<SkipLink />);
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main',
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<SkipLink />);
    await expectNoViolations(container);
  });
});
