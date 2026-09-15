import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Disclaimer } from './Disclaimer.js';
import { expectNoViolations } from '../test-utils/axe.js';

describe('Disclaimer', () => {
  it('states plainly that it is not a lawyer', () => {
    render(<Disclaimer />);
    expect(screen.getByText(/is not a lawyer/i)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Disclaimer />);
    await expectNoViolations(container);
  });
});
