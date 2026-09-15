import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScopeNote } from './ScopeNote.js';
import { expectNoViolations } from '../test-utils/axe.js';

describe('ScopeNote', () => {
  it('states the limits before the user types anything', () => {
    render(<ScopeNote />);
    expect(screen.getByRole('heading')).toHaveTextContent('What we do not cover');
    for (const area of [
      'Criminal defence',
      'Divorce, custody and family matters',
      'Immigration and visas',
      'Anything already before a court',
    ]) {
      expect(screen.getByText(area)).toBeInTheDocument();
    }
  });

  it('frames the exclusions as a referral, not a rejection', () => {
    render(<ScopeNote />);
    expect(screen.getByText(/need a qualified professional/)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ScopeNote />);
    await expectNoViolations(container);
  });
});
