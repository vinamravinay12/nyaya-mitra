import { describe, expect, it } from 'vitest';
import {
  ALLOWED_MIME_TYPES,
  MAX_DOCUMENT_BYTES,
  decodedByteLength,
  isAllowedMimeType,
  isWithinSizeLimit,
} from './document.js';

const base64OfBytes = (count: number): string => Buffer.alloc(count).toString('base64');

describe('isAllowedMimeType', () => {
  it('accepts the formats Gemini can read directly', () => {
    for (const mimeType of ALLOWED_MIME_TYPES) {
      expect(isAllowedMimeType(mimeType)).toBe(true);
    }
    // Scans and photos matter most: Indian agreements are often stamp paper.
    expect(isAllowedMimeType('image/jpeg')).toBe(true);
    expect(isAllowedMimeType('application/pdf')).toBe(true);
  });

  it('rejects anything executable or unexpected', () => {
    for (const mimeType of [
      'application/javascript',
      'text/html',
      'application/zip',
      'application/x-msdownload',
      '',
    ]) {
      expect(isAllowedMimeType(mimeType), mimeType).toBe(false);
    }
  });
});

describe('decodedByteLength', () => {
  it('measures the real size without decoding', () => {
    expect(decodedByteLength(Buffer.from('ABC').toString('base64'))).toBe(3);
    expect(decodedByteLength(Buffer.from('ABCD').toString('base64'))).toBe(4);
    expect(decodedByteLength(Buffer.from('ABCDE').toString('base64'))).toBe(5);
  });

  it('accounts for padding in both forms', () => {
    expect(decodedByteLength('QQ==')).toBe(1);
    expect(decodedByteLength('QUI=')).toBe(2);
    expect(decodedByteLength('QUJD')).toBe(3);
  });

  it('handles an empty payload', () => {
    expect(decodedByteLength('')).toBe(0);
  });
});

describe('isWithinSizeLimit', () => {
  it('accepts a document at the limit', () => {
    expect(isWithinSizeLimit(base64OfBytes(MAX_DOCUMENT_BYTES))).toBe(true);
  });

  it('rejects a document over the limit', () => {
    expect(isWithinSizeLimit(base64OfBytes(MAX_DOCUMENT_BYTES + 1))).toBe(false);
  });

  it('accepts a small document', () => {
    expect(isWithinSizeLimit(base64OfBytes(1024))).toBe(true);
  });
});
