import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ExampleScenarios } from './ExampleScenarios.js';
import { expectNoViolations } from '../test-utils/axe.js';
import type { PlaybookSummary } from '../api/types.js';

const playbook = (over: Partial<PlaybookSummary>): PlaybookSummary => ({
  id: 'rental.deposit_withheld',
  domain: 'rental',
  title: 'Landlord is withholding my security deposit',
  summary: 'The deposit has not come back.',
  examplePrompt: 'My landlord has not returned my deposit since I moved out in July.',
  ...over,
});

const playbooks: readonly PlaybookSummary[] = [
  playbook({}),
  playbook({
    id: 'rental.illegal_eviction',
    examplePrompt: 'My landlord switched off the water to force me out.',
  }),
  playbook({
    id: 'employment.unpaid_salary',
    domain: 'employment',
    examplePrompt: 'My employer has not paid me for three months.',
  }),
  playbook({
    id: 'unknown.thing',
    domain: 'something-new',
    examplePrompt: 'Something we have not categorised yet happened to me.',
  }),
];

describe('ExampleScenarios', () => {
  it('renders nothing when the catalogue loaded but was empty', () => {
    const { container } = render(<ExampleScenarios playbooks={[]} onPick={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('reserves layout while the catalogue is still loading', () => {
    const { container } = render(<ExampleScenarios playbooks={null} onPick={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Things people ask us' })).toBeInTheDocument();
    // Placeholders occupy the space so the real examples do not shove the page
    // down when they arrive.
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('groups examples under a plain-language heading per domain', () => {
    render(<ExampleScenarios playbooks={playbooks} onPick={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /Renting a home/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Work and employers/ })).toBeInTheDocument();
  });

  it('puts every example for a domain under its own heading', () => {
    render(<ExampleScenarios playbooks={playbooks} onPick={vi.fn()} />);
    const renting = screen.getByRole('heading', { name: /Renting a home/ }).parentElement;
    if (renting === null) {
      throw new Error('expected the domain heading to sit inside its group');
    }
    expect(within(renting).getAllByRole('button')).toHaveLength(2);
  });

  it('falls back to the raw domain when there is no friendly label yet', () => {
    render(<ExampleScenarios playbooks={playbooks} onPick={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'something-new' })).toBeInTheDocument();
  });

  it('shows a sentence a person would actually type, not a category name', () => {
    render(<ExampleScenarios playbooks={playbooks} onPick={vi.fn()} />);
    expect(screen.getByText(/My landlord has not returned my deposit/)).toBeInTheDocument();
  });

  it('hands the full example text back when one is picked', async () => {
    const onPick = vi.fn();
    render(<ExampleScenarios playbooks={playbooks} onPick={onPick} />);
    await userEvent.click(screen.getByRole('button', { name: /My landlord has not returned/ }));
    expect(onPick).toHaveBeenCalledWith(playbooks[0]?.examplePrompt);
  });

  it('exposes each example as a real button, so it is keyboard reachable', async () => {
    const onPick = vi.fn();
    render(<ExampleScenarios playbooks={playbooks} onPick={onPick} />);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onPick).toHaveBeenCalledOnce();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ExampleScenarios playbooks={playbooks} onPick={vi.fn()} />);
    await expectNoViolations(container);
  });
});
