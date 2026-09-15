import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Hero } from './Hero.js';
import { expectNoViolations } from '../test-utils/axe.js';

describe('Hero', () => {
  it('leads with what the user gets, as the page heading', () => {
    render(<Hero situationCount={12} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Find out where you stand');
  });

  it('says what the answer will contain', () => {
    render(<Hero situationCount={12} />);
    const body = screen.getByText(/Describe an everyday legal problem/);
    expect(body).toHaveTextContent('what they cost');
    expect(body).toHaveTextContent('whether you actually need a');
  });

  it('reports the number of situations it actually covers', () => {
    render(<Hero situationCount={12} />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows a placeholder rather than a wrong number while loading', () => {
    render(<Hero situationCount={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Hero situationCount={12} />);
    await expectNoViolations(container);
  });
});
