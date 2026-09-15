import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LegalReference } from '@nyaya-mitra/core';
import { GoverningLawList } from './GoverningLawList.js';
import { expectNoViolations } from '../test-utils/axe.js';

const references: readonly LegalReference[] = [
  {
    act: 'Limitation Act',
    year: 1963,
    provision: 'Art.55',
    note: 'Three years to sue for breach of contract.',
  },
  {
    act: 'Model Tenancy Act',
    year: 2021,
    provision: 's.11',
    note: 'Caps a residential deposit at two months’ rent.',
    stateSpecific: true,
  },
];

describe('GoverningLawList', () => {
  it('cites the act, year and provision', () => {
    render(<GoverningLawList references={references} />);
    expect(screen.getByText(/Limitation Act 1963, Art.55/)).toBeInTheDocument();
    expect(screen.getByText('Three years to sue for breach of contract.')).toBeInTheDocument();
  });

  it('warns where the law differs by state', () => {
    render(<GoverningLawList references={references} />);
    expect(screen.getByText('(varies by state)')).toBeInTheDocument();
  });

  it('does not warn where it does not', () => {
    const [nationwide] = references;
    if (nationwide === undefined) {
      throw new Error('expected a reference fixture');
    }
    render(<GoverningLawList references={[nationwide]} />);
    expect(screen.queryByText('(varies by state)')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<GoverningLawList references={references} />);
    await expectNoViolations(container);
  });
});
