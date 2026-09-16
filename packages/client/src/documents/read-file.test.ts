import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_DOCUMENT_BYTES, describeSize, isTooLarge, readDocument } from './read-file.js';

const fileOf = (content: string, type = 'application/pdf', name = 'agreement.pdf'): File =>
  new File([content], name, { type });

describe('isTooLarge', () => {
  it('accepts a file at the limit and rejects one over it', () => {
    expect(isTooLarge({ size: MAX_DOCUMENT_BYTES } as File)).toBe(false);
    expect(isTooLarge({ size: MAX_DOCUMENT_BYTES + 1 } as File)).toBe(true);
  });
});

describe('describeSize', () => {
  it('reads in megabytes once it is worth it, kilobytes below', () => {
    expect(describeSize(2 * 1024 * 1024)).toBe('2.0 MB');
    expect(describeSize(300 * 1024)).toBe('300 KB');
  });

  it('never reports a real file as 0 KB', () => {
    expect(describeSize(12)).toBe('1 KB');
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readDocument', () => {
  const expectOk = async (file: File) => {
    const result = await readDocument(file);
    if (!result.ok) {
      throw new Error(`expected a successful read, got: ${result.message}`);
    }
    return result.document;
  };

  it('returns the base64 payload without the data URL prefix', async () => {
    const document = await expectOk(fileOf('hello'));
    expect(document.name).toBe('agreement.pdf');
    expect(document.mimeType).toBe('application/pdf');
    // The prefix would be rejected by the server's base64 check.
    expect(document.data).not.toContain('data:');
    expect(document.data).not.toContain(',');
    expect(atob(document.data)).toBe('hello');
  });

  it('keeps the original file name for display', async () => {
    const document = await expectOk(fileOf('x', 'image/jpeg', 'stamp paper.jpg'));
    expect(document.name).toBe('stamp paper.jpg');
    expect(document.mimeType).toBe('image/jpeg');
  });

  it('reports an empty file rather than sending nothing', async () => {
    const result = await readDocument(fileOf(''));
    expect(result).toEqual({ ok: false, message: 'That file appears to be empty.' });
  });
});

describe('readDocument when the browser cannot read the file', () => {
  it('rejects with a message the user can act on', async () => {
    class FailingReader {
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;
      result: string | null = null;
      readAsDataURL() {
        this.onerror?.();
      }
    }
    vi.stubGlobal('FileReader', FailingReader);
    const result = await readDocument(fileOf('x'));
    expect(result).toEqual({ ok: false, message: 'That file could not be read.' });
  });

  it('reports a read that returns something other than text', async () => {
    class BinaryReader {
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;
      result: ArrayBuffer | null = new ArrayBuffer(8);
      readAsDataURL() {
        this.onload?.();
      }
    }
    vi.stubGlobal('FileReader', BinaryReader);
    const result = await readDocument(fileOf('x'));
    expect(result.ok).toBe(false);
  });
});
