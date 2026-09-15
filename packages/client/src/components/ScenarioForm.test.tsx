import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ScenarioForm } from './ScenarioForm.js';
import { expectNoViolations } from '../test-utils/axe.js';

const setup = (overrides: Partial<Parameters<typeof ScenarioForm>[0]> = {}) => {
  const onSubmit = vi.fn();
  const onScenarioChange = vi.fn();
  const view = render(
    <ScenarioForm
      scenario=""
      busy={false}
      onScenarioChange={onScenarioChange}
      onSubmit={onSubmit}
      {...overrides}
    />,
  );
  return { ...view, onSubmit, onScenarioChange };
};

describe('ScenarioForm', () => {
  it('associates the label and the help text with the field', () => {
    setup();
    const field = screen.getByLabelText('What happened?');
    expect(field).toHaveAccessibleDescription(/Describe it in your own words/);
  });

  it('reports what the user types', async () => {
    const { onScenarioChange } = setup();
    await userEvent.type(screen.getByLabelText('What happened?'), 'Hi');
    expect(onScenarioChange).toHaveBeenCalled();
  });

  it('will not submit a scenario that is too short to classify', async () => {
    const { onSubmit } = setup({ scenario: 'short' });
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('ignores a form submit that bypasses the disabled button', () => {
    const { onSubmit, container } = setup({ scenario: 'short' });
    const form = container.querySelector('form');
    if (form === null) {
      throw new Error('expected the scenario form to render');
    }
    fireEvent.submit(form);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits once the scenario is long enough', async () => {
    const { onSubmit } = setup({ scenario: 'My landlord kept my deposit.' });
    await userEvent.click(screen.getByRole('button', { name: 'Find out where I stand' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('blocks a second submit while one is in flight', async () => {
    const { onSubmit } = setup({ scenario: 'My landlord kept my deposit.', busy: true });
    const button = screen.getByRole('button', { name: 'Working…' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const { container } = setup({ scenario: 'My landlord kept my deposit.' });
    await expectNoViolations(container);
  });
});
