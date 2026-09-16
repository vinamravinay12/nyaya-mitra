import { describe, expect, it } from 'vitest';
import { looksLikeText, matchesDeclaredType, sniffMimeType } from './sniff-type.js';

const asBase64 = (bytes: readonly number[], tail = 16): string =>
  Buffer.concat([Buffer.from(bytes), Buffer.alloc(tail, 0x41)]).toString('base64');

const PDF = asBase64([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
const PNG = asBase64([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = asBase64([0xff, 0xd8, 0xff, 0xe0]);
const WEBP = asBase64([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
const TEXT = Buffer.from('RENTAL AGREEMENT. Clause 1.').toString('base64');
const EXECUTABLE = asBase64([0x4d, 0x5a, 0x90, 0x00, 0x03]);

describe('sniffMimeType', () => {
  it('identifies each binary format from its signature', () => {
    expect(sniffMimeType(PDF)).toBe('application/pdf');
    expect(sniffMimeType(PNG)).toBe('image/png');
    expect(sniffMimeType(JPEG)).toBe('image/jpeg');
    expect(sniffMimeType(WEBP)).toBe('image/webp');
  });

  it('does not mistake a bare RIFF container for WebP', () => {
    const avi = asBase64([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20]);
    expect(sniffMimeType(avi)).toBeUndefined();
  });

  it('returns nothing for plain text or an unknown format', () => {
    expect(sniffMimeType(TEXT)).toBeUndefined();
    expect(sniffMimeType(EXECUTABLE)).toBeUndefined();
  });
});

describe('looksLikeText', () => {
  it('accepts readable text', () => {
    expect(looksLikeText(TEXT)).toBe(true);
  });

  it('rejects anything with a known binary signature', () => {
    expect(looksLikeText(PDF)).toBe(false);
    expect(looksLikeText(PNG)).toBe(false);
  });

  it('rejects bytes containing a NUL', () => {
    expect(looksLikeText(asBase64([0x41, 0x00, 0x42, 0x43], 0))).toBe(false);
  });
});

describe('matchesDeclaredType', () => {
  it('accepts a file that is what it says it is', () => {
    expect(matchesDeclaredType(PDF, 'application/pdf')).toBe(true);
    expect(matchesDeclaredType(JPEG, 'image/jpeg')).toBe(true);
    expect(matchesDeclaredType(TEXT, 'text/plain')).toBe(true);
  });

  it('rejects a file whose bytes disagree with its declared type', () => {
    // The browser derives File.type from the extension, so this is forgeable:
    // renaming a file to agreement.pdf must not get it through.
    expect(matchesDeclaredType(TEXT, 'application/pdf')).toBe(false);
    expect(matchesDeclaredType(PNG, 'image/jpeg')).toBe(false);
    expect(matchesDeclaredType(PDF, 'text/plain')).toBe(false);
  });

  it('rejects an unknown binary claiming to be an allowed type', () => {
    expect(matchesDeclaredType(EXECUTABLE, 'application/pdf')).toBe(false);
    expect(matchesDeclaredType(EXECUTABLE, 'text/plain')).toBe(false);
  });
});
