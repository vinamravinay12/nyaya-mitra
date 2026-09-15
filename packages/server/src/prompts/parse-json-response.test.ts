import { describe, expect, it } from 'vitest';
import { parseJsonResponse } from './parse-json-response.js';

describe('parseJsonResponse', () => {
  it('parses a bare JSON object', () => {
    expect(parseJsonResponse('{"playbookId":"rental.deposit_withheld"}')).toEqual({
      playbookId: 'rental.deposit_withheld',
    });
  });

  it('parses JSON wrapped in a code fence', () => {
    const raw = '```json\n{"confidence":0.8}\n```';
    expect(parseJsonResponse(raw)).toEqual({ confidence: 0.8 });
  });

  it('parses JSON surrounded by prose', () => {
    const raw = 'Here is the result:\n{"ok":true}\nLet me know if you need more.';
    expect(parseJsonResponse(raw)).toEqual({ ok: true });
  });

  it('keeps nested objects intact', () => {
    const raw = 'x {"facts":{"state":"Karnataka","deposit":{"amount":80000}}} y';
    expect(parseJsonResponse(raw)).toEqual({
      facts: { state: 'Karnataka', deposit: { amount: 80_000 } },
    });
  });

  it('is not confused by braces inside strings', () => {
    expect(parseJsonResponse('{"note":"clause {6.3} applies"}')).toEqual({
      note: 'clause {6.3} applies',
    });
  });

  it('is not confused by escaped quotes inside strings', () => {
    expect(parseJsonResponse('{"note":"they said \\"no refund\\" to me"}')).toEqual({
      note: 'they said "no refund" to me',
    });
  });

  it('is not confused by an escaped backslash before a quote', () => {
    expect(parseJsonResponse('{"path":"C:\\\\temp\\\\"}')).toEqual({ path: 'C:\\temp\\' });
  });

  it('returns undefined when there is no object at all', () => {
    expect(parseJsonResponse('I could not determine the situation.')).toBeUndefined();
    expect(parseJsonResponse('')).toBeUndefined();
  });

  it('returns undefined for an unbalanced object', () => {
    expect(parseJsonResponse('{"playbookId":"rental"')).toBeUndefined();
  });

  it('returns undefined for a balanced but malformed object', () => {
    expect(parseJsonResponse('{playbookId: rental,}')).toBeUndefined();
  });
});
