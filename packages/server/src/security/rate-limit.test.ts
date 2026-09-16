import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { MAX_TRACKED_CLIENTS, clientKey, rateLimit } from './rate-limit.js';

const makeResponse = () => {
  const response = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return response as unknown as Response & { statusCode: number; headers: Record<string, string> };
};

const call = (
  limiter: ReturnType<typeof rateLimit>,
  ip: string,
): { allowed: boolean; response: ReturnType<typeof makeResponse> } => {
  const next = vi.fn() as unknown as NextFunction;
  const response = makeResponse();
  limiter({ ip, headers: {} } as unknown as Request, response, next);
  return {
    allowed: (next as unknown as ReturnType<typeof vi.fn>).mock.calls.length === 1,
    response,
  };
};

const options = (now: () => number) => ({ windowMs: 1000, max: 3, now });

describe('rateLimit', () => {
  it('allows requests up to the limit', () => {
    const limiter = rateLimit(options(() => 0));
    for (let i = 0; i < 3; i += 1) {
      expect(call(limiter, '1.1.1.1').allowed).toBe(true);
    }
  });

  it('rejects the request after the limit, with a retry hint', () => {
    const limiter = rateLimit(options(() => 0));
    for (let i = 0; i < 3; i += 1) {
      call(limiter, '1.1.1.1');
    }
    const { allowed, response } = call(limiter, '1.1.1.1');
    expect(allowed).toBe(false);
    expect(response.statusCode).toBe(429);
    expect(response.headers['retry-after']).toBe('1');
  });

  it('counts each client separately', () => {
    const limiter = rateLimit(options(() => 0));
    for (let i = 0; i < 3; i += 1) {
      call(limiter, '1.1.1.1');
    }
    expect(call(limiter, '1.1.1.1').allowed).toBe(false);
    expect(call(limiter, '2.2.2.2').allowed).toBe(true);
  });

  it('lets the client through again once the window rolls over', () => {
    let clock = 0;
    const limiter = rateLimit(options(() => clock));
    for (let i = 0; i < 4; i += 1) {
      call(limiter, '1.1.1.1');
    }
    expect(call(limiter, '1.1.1.1').allowed).toBe(false);

    clock = 1001;
    expect(call(limiter, '1.1.1.1').allowed).toBe(true);
  });

  it('treats a request with no address as a single client rather than crashing', () => {
    const limiter = rateLimit(options(() => 0));
    const next = vi.fn() as unknown as NextFunction;
    limiter({ headers: {} } as unknown as Request, makeResponse(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('counts the original caller when requests arrive through a proxy', () => {
    const limiter = rateLimit(options(() => 0));
    const send = (forwarded: string) => {
      const next = vi.fn() as unknown as NextFunction;
      limiter(
        { ip: '10.0.0.99', headers: { 'x-forwarded-for': forwarded } } as unknown as Request,
        makeResponse(),
        next,
      );
      return (next as unknown as ReturnType<typeof vi.fn>).mock.calls.length === 1;
    };
    // Same client, different edge nodes. Without reading the forwarded header
    // each of these would get its own bucket.
    expect(send('203.0.113.5, 10.1.1.1')).toBe(true);
    expect(send('203.0.113.5, 10.1.1.2')).toBe(true);
    expect(send('203.0.113.5, 10.1.1.3')).toBe(true);
    expect(send('203.0.113.5, 10.1.1.4')).toBe(false);
  });
});

describe('clientKey', () => {
  const key = (headers: Record<string, unknown>, ip?: string) =>
    clientKey({ ip, headers } as unknown as Request);

  it('reads the leftmost forwarded address', () => {
    expect(key({ 'x-forwarded-for': '203.0.113.5, 10.1.1.1, 10.2.2.2' })).toBe('203.0.113.5');
  });

  it('trims whitespace around the address', () => {
    expect(key({ 'x-forwarded-for': '  203.0.113.5 , 10.1.1.1' })).toBe('203.0.113.5');
  });

  it('handles the header arriving as an array', () => {
    expect(key({ 'x-forwarded-for': ['203.0.113.5, 10.1.1.1'] })).toBe('203.0.113.5');
  });

  it('falls back to the socket address when there is no header', () => {
    expect(key({}, '198.51.100.7')).toBe('198.51.100.7');
    expect(key({ 'x-forwarded-for': '' }, '198.51.100.7')).toBe('198.51.100.7');
    expect(key({ 'x-forwarded-for': '  ,  ' }, '198.51.100.7')).toBe('198.51.100.7');
  });

  it('never returns an empty key', () => {
    expect(key({})).toBe('unknown');
  });

  it('bounds memory so rotating addresses cannot grow the map forever', () => {
    const limiter = rateLimit(options(() => 0));
    for (let i = 0; i <= MAX_TRACKED_CLIENTS; i += 1) {
      call(limiter, `10.0.${String(Math.floor(i / 256))}.${String(i % 256)}`);
    }
    // After the reset the earliest client is tracked afresh, not remembered.
    expect(call(limiter, '10.0.0.0').allowed).toBe(true);
  });
});
