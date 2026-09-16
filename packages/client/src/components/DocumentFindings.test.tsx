import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocumentFindings } from './DocumentFindings.js';
import { expectNoViolations } from '../test-utils/axe.js';

const findings = [
  {
    clause: 'Any deduction from the security deposit shall be supported by itemised bills.',
    why: 'They deducted without bills, so this is your strongest point.',
  },
  { clause: 'The lease term is eleven months.', why: 'Explains why it was never registered.' },
];

describe('DocumentFindings', () => {
  it('renders nothing when no document was read', () => {
    const { container } = render(<DocumentFindings findings={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('quotes the clause and says why it matters', () => {
    render(<DocumentFindings findings={findings} />);
    expect(screen.getByText(/supported by itemised bills/)).toBeInTheDocument();
    expect(screen.getByText(/your strongest point/)).toBeInTheDocument();
  });

  it('frames it as the relevant parts, not a summary', () => {
    render(<DocumentFindings findings={findings} />);
    expect(screen.getByText(/not a summary of the whole thing/)).toBeInTheDocument();
  });

  it('marks quoted clauses as quotations', () => {
    const { container } = render(<DocumentFindings findings={findings} />);
    expect(container.querySelectorAll('blockquote')).toHaveLength(2);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<DocumentFindings findings={findings} />);
    await expectNoViolations(container);
  });
});
