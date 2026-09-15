import { describe, expect, it } from 'vitest';
import { DEFAULT_MODEL, DEFAULT_PORT, loadConfig } from './config.js';

describe('loadConfig', () => {
  it('falls back to documented defaults', () => {
    const config = loadConfig({});
    expect(config.port).toBe(DEFAULT_PORT);
    expect(config.model).toBe(DEFAULT_MODEL);
    expect(config.allowedOrigin).toBe('*');
    expect(config.geminiApiKey).toBeNull();
  });

  it('reads and trims the supplied values', () => {
    const config = loadConfig({
      PORT: '3000',
      GEMINI_API_KEY: '  secret-key  ',
      GEMINI_MODEL: ' gemini-2.5-pro ',
      ALLOWED_ORIGIN: ' https://nyaya-mitra.web.app ',
    });
    expect(config.port).toBe(3000);
    expect(config.geminiApiKey).toBe('secret-key');
    expect(config.model).toBe('gemini-2.5-pro');
    expect(config.allowedOrigin).toBe('https://nyaya-mitra.web.app');
  });

  it('ignores a port that is not a usable number', () => {
    for (const port of ['abc', '0', '-1', '70000', '80.5', '']) {
      expect(loadConfig({ PORT: port }).port, port).toBe(DEFAULT_PORT);
    }
  });

  it('treats a blank key as absent', () => {
    expect(loadConfig({ GEMINI_API_KEY: '   ' }).geminiApiKey).toBeNull();
  });

  it('refuses to start in production without a key', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow('GEMINI_API_KEY');
    expect(() => loadConfig({ NODE_ENV: 'production', GEMINI_API_KEY: '  ' })).toThrow(
      'GEMINI_API_KEY',
    );
  });

  it('starts in production when the key is present', () => {
    expect(loadConfig({ NODE_ENV: 'production', GEMINI_API_KEY: 'k' }).geminiApiKey).toBe('k');
  });
});
