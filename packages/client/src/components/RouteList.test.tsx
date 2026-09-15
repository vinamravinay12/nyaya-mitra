import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Route, RouteAvailability } from '@nyaya-mitra/core';
import { RouteList } from './RouteList.js';
import { expectNoViolations } from '../test-utils/axe.js';

const route = (overrides: Partial<Route> = {}): Route => ({
  id: 'demand-notice',
  label: 'Send a written demand notice',
  forum: 'Direct to the landlord',
  costInr: 0,
  costNote: 'Free if you send it yourself.',
  minDays: 7,
  maxDays: 21,
  effort: 'low',
  ...overrides,
});

const open: RouteAvailability = { route: route(), available: true };
const closed: RouteAvailability = {
  route: route({ id: 'summary-suit', label: 'File a summary suit', costInr: 15_000 }),
  available: false,
  reason: 'The summary-suit route needs a written contract.',
};

describe('RouteList', () => {
  it('shows cost, time and effort for an open route', () => {
    render(<RouteList routes={[open]} />);
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('7–21 days')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
  });

  it('formats a real cost in rupees', () => {
    render(<RouteList routes={[{ route: route({ costInr: 15_000 }), available: true }]} />);
    expect(screen.getByText('₹15,000')).toBeInTheDocument();
  });

  it('keeps a closed route visible and explains why it is closed', () => {
    render(<RouteList routes={[open, closed]} />);
    expect(screen.getByText(/File a summary suit/)).toBeInTheDocument();
    expect(screen.getByText('(not open to you)')).toBeInTheDocument();
    expect(screen.getByText(/needs a written contract/)).toBeInTheDocument();
  });

  it('does not show cost figures for a route the user cannot take', () => {
    render(<RouteList routes={[closed]} />);
    expect(screen.queryByText('₹15,000')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<RouteList routes={[open, closed]} />);
    await expectNoViolations(container);
  });
});
