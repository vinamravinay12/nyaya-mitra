import compression from 'compression';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import type { ServerConfig } from './config.js';
import type { LlmClient } from './llm/llm-client.js';
import { assessRouter } from './routes/assess.js';
import { classifyRouter } from './routes/classify.js';
import { healthRouter } from './routes/health.js';
import { playbooksRouter } from './routes/playbooks.js';
import { rateLimit } from './security/rate-limit.js';
import { securityHeaders } from './security/security-headers.js';

/**
 * Sized for one base64-encoded document and nothing more.
 *
 * Base64 inflates by about a third, so the 2 MB file limit needs roughly 2.8 MB
 * of body. The document limit itself is enforced in the schema, which rejects an
 * oversized file with a message rather than a bare 413.
 */
const BODY_LIMIT = '3mb';

export interface AppDependencies {
  readonly llm: LlmClient;
  readonly config: ServerConfig;
  readonly usingStub: boolean;
}

/** Body-parser failures carry a `type`; anything else is genuinely unexpected. */
export function describeBodyError(error: unknown): { status: number; message: string } | undefined {
  if (error instanceof SyntaxError && 'body' in error) {
    return { status: 400, message: 'Request body must be valid JSON.' };
  }
  if (typeof error === 'object' && error !== null && 'type' in error) {
    const { type } = error as { type?: unknown };
    if (type === 'entity.too.large') {
      // Reached before validation runs, so it needs its own clear message
      // rather than the opaque 500 an unhandled parser error would produce.
      return { status: 413, message: 'That file is too large. The limit is 2 MB.' };
    }
  }
  return undefined;
}

function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  const known = describeBodyError(error);
  // Never surface an internal message: it can leak configuration detail.
  response.status(known?.status ?? 500).json({ error: known?.message ?? 'Something went wrong.' });
}

export function createApp({ llm, config, usingStub }: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  // Cloud Run terminates TLS upstream, so the client address arrives in
  // X-Forwarded-For. Trusting one hop lets the limiter see the real caller.
  app.set('trust proxy', 1);
  // JSON assessments are several kilobytes and compress by roughly 80%.
  app.use(compression());
  app.use(securityHeaders(config.allowedOrigin));
  app.use(express.json({ limit: BODY_LIMIT }));

  // Applied to the model-backed and engine endpoints, not to health checks.
  app.use('/api/classify', rateLimit());
  app.use('/api/assess', rateLimit());

  app.use('/api', healthRouter(usingStub));
  app.use('/api', playbooksRouter());
  app.use('/api', classifyRouter(llm));
  app.use('/api', assessRouter());

  app.use((_request, response) => {
    response.status(404).json({ error: 'Not found.' });
  });
  app.use(errorHandler);

  return app;
}
