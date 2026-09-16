import type { NextFunction, Request, Response } from 'express';

export const WINDOW_MS = 60_000;
/** Generous for a person working through one problem; far below scripted abuse. */
export const MAX_REQUESTS_PER_WINDOW = 20;
/** Bounds memory: an attacker rotating addresses cannot grow the map forever. */
export const MAX_TRACKED_CLIENTS = 10_000;

interface Window {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  readonly windowMs: number;
  readonly max: number;
  /** Injected so tests do not depend on the wall clock. */
  readonly now: () => number;
}

export const defaultOptions: RateLimitOptions = {
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS_PER_WINDOW,
  now: () => Date.now(),
};

/**
 * The caller to count against.
 *
 * Requests arrive through Firebase Hosting, so `request.ip` resolves to a Google
 * edge address that differs per request — which gave every request its own
 * bucket and defeated the limit entirely. The leftmost X-Forwarded-For entry is
 * the original client regardless of how many proxies sit in between.
 *
 * That entry is client-settable, so a determined attacker can rotate it. This
 * limiter exists to stop one ordinary client exhausting the shared upstream
 * model quota, not to withstand a deliberate attack; a shared store keyed on
 * something stronger would be the next step if that changed.
 */
export function clientKey(request: Pick<Request, 'ip' | 'headers'>): string {
  const forwarded = request.headers['x-forwarded-for'];
  const header = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const first = header?.split(',')[0]?.trim();
  return first !== undefined && first.length > 0 ? first : (request.ip ?? 'unknown');
}

/**
 * Fixed-window limiter, held in memory.
 *
 * Cloud Run can run several instances, so this bounds each instance rather than
 * the service as a whole. That is deliberate: the goal is to stop one client
 * exhausting the upstream model quota that everyone else shares, not to be a
 * precise global counter. A shared store would be the next step if it mattered.
 */
export function rateLimit(options: RateLimitOptions = defaultOptions) {
  const windows = new Map<string, Window>();

  return (request: Request, response: Response, next: NextFunction): void => {
    const key = clientKey(request);
    const now = options.now();
    const existing = windows.get(key);

    if (existing === undefined || now >= existing.resetAt) {
      if (windows.size >= MAX_TRACKED_CLIENTS) {
        windows.clear();
      }
      windows.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > options.max) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      response.setHeader('Retry-After', String(retryAfter));
      response.status(429).json({ error: 'Too many requests. Please wait a moment and retry.' });
      return;
    }
    next();
  };
}
