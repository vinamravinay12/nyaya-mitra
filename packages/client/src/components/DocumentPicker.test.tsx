import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DocumentPicker } from './DocumentPicker.js';
import { expectNoViolations } from '../test-utils/axe.js';

const document = { name: 'agreement.pdf', mimeType: 'application/pdf', data: 'QUJD' };

const setup = (overrides: Partial<Parameters<typeof DocumentPicker>[0]> = {}) => {
  const onPick = vi.fn();
  const onClear = vi.fn();
  const view = render(
    <DocumentPicker
      document={null}
      fileSize={0}
      error={null}
      busy={false}
      onPick={onPick}
      onClear={onClear}
      {...overrides}
    />,
  );
  return { ...view, onPick, onClear };
};

describe('DocumentPicker', () => {
  it('is clearly optional, so nobody is blocked without a document', () => {
    setup();
    expect(screen.getByText('Optional')).toBeInTheDocument();
  });

  it('says what can be attached and that a photo is fine', () => {
    setup();
    const field = screen.getByLabelText(/Have the document/);
    expect(field).toHaveAccessibleDescription(/clear photo is fine/);
    expect(field).toHaveAccessibleDescription(/never stored/);
  });

  it('accepts only the types the server will read', () => {
    setup();
    expect(screen.getByLabelText(/Have the document/)).toHaveAttribute(
      'accept',
      'application/pdf,image/jpeg,image/png,image/webp,text/plain',
    );
  });

  it('offers the camera on a phone', () => {
    setup();
    expect(screen.getByLabelText(/Have the document/)).toHaveAttribute('capture', 'environment');
  });

  it('reports the chosen file', async () => {
    const { onPick } = setup();
    const file = new File(['x'], 'agreement.pdf', { type: 'application/pdf' });
    await userEvent.upload(screen.getByLabelText(/Have the document/), file);
    expect(onPick).toHaveBeenCalledWith(file);
  });

  it('does nothing when the picker is dismissed without choosing a file', () => {
    const { onPick } = setup();
    fireEvent.change(screen.getByLabelText(/Have the document/), { target: { files: [] } });
    expect(onPick).not.toHaveBeenCalled();
  });

  it('is disabled while a request is in flight', () => {
    setup({ busy: true });
    expect(screen.getByLabelText(/Have the document/)).toBeDisabled();
  });

  it('shows the attached file with its size and a way to remove it', async () => {
    const { onClear } = setup({ document, fileSize: 2 * 1024 * 1024 });
    expect(screen.getByText('agreement.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Remove/ }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('announces a rejected file', () => {
    setup({ error: 'That file is too large. The limit is 4 MB.' });
    expect(screen.getByRole('alert')).toHaveTextContent('4 MB');
  });

  it('has no accessibility violations in either state', async () => {
    const empty = setup();
    await expectNoViolations(empty.container);
    empty.unmount();

    const filled = setup({ document, fileSize: 1024 });
    await expectNoViolations(filled.container);
  });
});
