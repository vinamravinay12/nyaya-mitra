import type { NextFunction, Request, Response } from 'express';

/**
 * The API returns JSON only, so the policy is as closed as it can be: no
 * scripts, no frames, no embedding. The client is served separately by Firebase
 * Hosting, which carries its own policy.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

export function securityHeaders(allowedOrigin: string) {
  return (request: Request, response: Response, next: NextFunction): void => {
    response.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    response.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
    response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (request.method === 'OPTIONS') {
      response.status(204).end();
      return;
    }
    next();
  };
}
