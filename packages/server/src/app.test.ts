import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp, describeBodyError } from './app.js';
import { loadConfig } from './config.js';
import { createStubClient } from './llm/stub-client.js';
import { LlmQuotaExceededError, LlmUnavailableError, type LlmClient } from './llm/llm-client.js';

const config = loadConfig({});

const appWith = (llm: LlmClient = createStubClient()) =>
  createApp({ llm, config, usingStub: true });

const completeFacts = {
  state: 'Karnataka',
  vacateDate: '2026-07-01',
  depositAmountInr: 80_000,
  amountWithheldInr: 80_000,
  writtenAgreement: true,
  itemisedDamagesGiven: false,
  writtenDemandSent: false,
};

describe('GET /api/health', () => {
  it('reports the mode without leaking the key', async () => {
    const response = await request(appWith()).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', mode: 'stub' });
  });

  it('reports gemini mode when a real client is wired in', async () => {
    const app = createApp({ llm: createStubClient(), config, usingStub: false });
    const response = await request(app).get('/api/health');
    expect(response.body.mode).toBe('gemini');
  });
});

describe('security headers', () => {
  it('sets a closed policy on every response', async () => {
    const response = await request(appWith()).get('/api/health');
    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(response.headers['x-permitted-cross-domain-policies']).toBe('none');
    expect(response.headers['strict-transport-security']).toContain('max-age=');
  });

  it('does not advertise the framework', async () => {
    const response = await request(appWith()).get('/api/health');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('answers a preflight without running a handler', async () => {
    const response = await request(appWith()).options('/api/classify');
    expect(response.status).toBe(204);
  });
});

describe('compression', () => {
  it('compresses a response when the client asks for it', async () => {
    const response = await request(appWith())
      .post('/api/assess')
      .set('Accept-Encoding', 'gzip')
      .send({ playbookId: 'rental.deposit_withheld', facts: {}, today: '2026-09-16' });
    expect(response.headers['content-encoding']).toBe('gzip');
  });
});

describe('GET /api/playbooks', () => {
  it('lists the catalogue without exposing internal legal data', async () => {
    const response = await request(appWith()).get('/api/playbooks');
    expect(response.status).toBe(200);
    expect(response.body.playbooks.length).toBeGreaterThan(0);
    expect(response.body.playbooks[0]).toHaveProperty('title');
    expect(response.body.playbooks[0]).not.toHaveProperty('governingLaw');
  });
});

describe('POST /api/classify', () => {
  it('classifies a described scenario', async () => {
    const response = await request(appWith())
      .post('/api/classify')
      .send({ scenario: 'My landlord is keeping my deposit after I moved out.' });
    expect(response.status).toBe(200);
    expect(response.body.kind).toBe('matched');
  });

  it('routes an out-of-scope situation away rather than guessing', async () => {
    const response = await request(appWith())
      .post('/api/classify')
      .send({ scenario: 'I have been arrested and need bail urgently.' });
    expect(response.status).toBe(200);
    expect(response.body.kind).toBe('out-of-scope');
  });

  it('rejects a scenario that is too short or missing', async () => {
    for (const body of [{ scenario: 'help' }, {}, { scenario: 123 }]) {
      const response = await request(appWith()).post('/api/classify').send(body);
      expect(response.status).toBe(400);
    }
  });

  it('reports the assistant as unavailable rather than failing opaquely', async () => {
    const failing: LlmClient = {
      complete: () => Promise.reject(new LlmUnavailableError('quota exhausted')),
    };
    const response = await request(appWith(failing))
      .post('/api/classify')
      .send({ scenario: 'My landlord is keeping my deposit after I moved out.' });
    expect(response.status).toBe(503);
    expect(response.body.error).not.toContain('quota');
  });

  it('distinguishes a spent quota from a busy service', async () => {
    const outOfQuota: LlmClient = {
      complete: () => Promise.reject(new LlmQuotaExceededError('free_tier_requests limit: 20')),
    };
    const response = await request(appWith(outOfQuota))
      .post('/api/classify')
      .send({ scenario: 'My landlord is keeping my deposit after I moved out.' });
    expect(response.status).toBe(429);
    expect(response.body.error).toContain('usage limit');
    expect(response.body.error).not.toContain('20');
  });

  it('does not leak an unexpected internal error', async () => {
    const broken: LlmClient = { complete: () => Promise.reject(new Error('DB_PASSWORD=hunter2')) };
    const response = await request(appWith(broken))
      .post('/api/classify')
      .send({ scenario: 'My landlord is keeping my deposit after I moved out.' });
    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain('hunter2');
  });
});

describe('POST /api/assess', () => {
  it('returns a full assessment', async () => {
    const response = await request(appWith()).post('/api/assess').send({
      playbookId: 'rental.deposit_withheld',
      facts: completeFacts,
      today: '2026-09-14',
    });
    expect(response.status).toBe(200);
    expect(response.body.ready).toBe(true);
    expect(response.body.triage.band).toBe('self-serve');
    expect(response.body.routes.length).toBeGreaterThan(0);
  });

  it('is deterministic for the same input', async () => {
    const send = () =>
      request(appWith())
        .post('/api/assess')
        .send({ playbookId: 'rental.deposit_withheld', facts: completeFacts, today: '2026-09-14' });
    const [first, second] = await Promise.all([send(), send()]);
    expect(first.body).toEqual(second.body);
  });

  it('rejects a malformed request', async () => {
    for (const body of [
      {},
      { playbookId: 'rental.deposit_withheld', facts: {} },
      { playbookId: 'rental.deposit_withheld', facts: {}, today: '14-09-2026' },
      { playbookId: '', facts: {}, today: '2026-09-14' },
    ]) {
      const response = await request(appWith()).post('/api/assess').send(body);
      expect(response.status).toBe(400);
    }
  });

  it('returns 404 for a situation it does not handle', async () => {
    const response = await request(appWith())
      .post('/api/assess')
      .send({ playbookId: 'nope', facts: {}, today: '2026-09-14' });
    expect(response.status).toBe(404);
  });
});

describe('POST /api/classify with a document', () => {
  // A real %PDF header: the server verifies bytes against the declared type.
  const PDF_BYTES = 'JVBERi0xLjcKMSAwIG9iago8PD4+CmVuZG9iago=';
  const pdf = { name: 'agreement.pdf', mimeType: 'application/pdf', data: PDF_BYTES };
  const scenario = 'My landlord is keeping my deposit after I moved out.';

  it('accepts a supported document alongside the scenario', async () => {
    const response = await request(appWith())
      .post('/api/classify')
      .send({ scenario, document: pdf });
    expect(response.status).toBe(200);
  });

  it('rejects a file type we cannot safely read', async () => {
    const response = await request(appWith())
      .post('/api/classify')
      .send({ scenario, document: { ...pdf, name: 'x.html', mimeType: 'text/html' } });
    expect(response.status).toBe(400);
  });

  it('rejects a file whose bytes contradict its declared type', async () => {
    // Renaming a text file to .pdf must not get it through.
    const text = Buffer.from('this is not a pdf').toString('base64');
    const response = await request(appWith())
      .post('/api/classify')
      .send({ scenario, document: { ...pdf, data: text } });
    expect(response.status).toBe(400);
  });

  it('rejects a file just over the document limit with a clear message', async () => {
    const overLimit = Buffer.concat([
      Buffer.from('%PDF-1.7'),
      Buffer.alloc(2 * 1024 * 1024 + 1024),
    ]).toString('base64');
    const response = await request(appWith())
      .post('/api/classify')
      .send({ scenario, document: { ...pdf, data: overLimit } });
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('2 MB');
  });

  it('explains an upload too large to even parse, rather than failing opaquely', async () => {
    const huge = Buffer.alloc(4 * 1024 * 1024).toString('base64');
    const response = await request(appWith())
      .post('/api/classify')
      .send({ scenario, document: { ...pdf, data: huge } });
    expect(response.status).toBe(413);
    expect(response.body.error).toContain('too large');
  });

  it('rejects data that is not base64', async () => {
    const response = await request(appWith())
      .post('/api/classify')
      .send({ scenario, document: { ...pdf, data: 'not base64!!' } });
    expect(response.status).toBe(400);
  });

  it('still works with no document attached', async () => {
    const response = await request(appWith()).post('/api/classify').send({ scenario });
    expect(response.status).toBe(200);
  });
});

describe('rate limiting', () => {
  it('turns away a client that floods the assessment endpoint', async () => {
    const app = appWith();
    const send = () =>
      request(app)
        .post('/api/assess')
        .send({ playbookId: 'rental.deposit_withheld', facts: {}, today: '2026-09-16' });

    let limited: number | undefined;
    for (let i = 0; i < 25; i += 1) {
      const response = await send();
      if (response.status === 429) {
        limited = i;
        break;
      }
    }
    expect(limited).toBeDefined();
  });

  it('never rate limits the health check', async () => {
    const app = appWith();
    for (let i = 0; i < 25; i += 1) {
      await request(app).get('/api/health');
    }
    expect((await request(app).get('/api/health')).status).toBe(200);
  });
});

describe('describeBodyError', () => {
  it('recognises a malformed JSON body', () => {
    const error = Object.assign(new SyntaxError('bad json'), { body: '{' });
    expect(describeBodyError(error)).toEqual({
      status: 400,
      message: 'Request body must be valid JSON.',
    });
  });

  it('recognises a body too large to parse', () => {
    expect(describeBodyError({ type: 'entity.too.large' })?.status).toBe(413);
  });

  it('does not mistake another parser failure for an oversized upload', () => {
    // Anything else must fall through to a generic 500, not a misleading 413.
    expect(describeBodyError({ type: 'encoding.unsupported' })).toBeUndefined();
    expect(describeBodyError({ type: 'charset.unsupported' })).toBeUndefined();
  });

  it('does not recognise an ordinary error', () => {
    expect(describeBodyError(new Error('boom'))).toBeUndefined();
    expect(describeBodyError(null)).toBeUndefined();
    expect(describeBodyError('a string')).toBeUndefined();
    expect(describeBodyError(new SyntaxError('no body property'))).toBeUndefined();
  });
});

describe('error handling', () => {
  it('returns 404 for an unknown route', async () => {
    const response = await request(appWith()).get('/api/nothing-here');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not found.');
  });

  it('returns 400 for a malformed JSON body', async () => {
    const response = await request(appWith())
      .post('/api/classify')
      .set('Content-Type', 'application/json')
      .send('{"scenario": ');
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('valid JSON');
  });
});
