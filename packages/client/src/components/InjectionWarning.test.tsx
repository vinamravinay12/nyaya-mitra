import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InjectionWarning } from './InjectionWarning.js';
import { expectNoViolations } from '../test-utils/axe.js';

describe('InjectionWarning', () => {
  it('renders nothing when the text was clean', () => {
    const { container } = render(<InjectionWarning findings={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('quotes what was flagged so the user can judge it', () => {
    render(
      <InjectionWarning
        findings={[{ rule: 'override-instructions', excerpt: 'ignore all previous instructions' }]}
      />,
    );
    expect(screen.getByText(/ignore all previous instructions/)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <InjectionWarning findings={[{ rule: 'r', excerpt: 'suspicious text' }]} />,
    );
    await expectNoViolations(container);
  });
});
