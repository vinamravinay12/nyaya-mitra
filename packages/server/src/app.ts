import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import type { ServerConfig } from './config.js';
import type { LlmClient } from './llm/llm-client.js';
import { assessRouter } from './routes/assess.js';
import { classifyRouter } from './routes/classify.js';
import { healthRouter } from './routes/health.js';
import { playbooksRouter } from './routes/playbooks.js';
import { securityHeaders } from './security/security-headers.js';

/** Large enough for a pasted agreement, small enough not to be a memory target. */
const BODY_LIMIT = '256kb';

export interface AppDependencies {
  readonly llm: LlmClient;
  readonly config: ServerConfig;
  readonly usingStub: boolean;
}

function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  const isBadJson = error instanceof SyntaxError && 'body' in error;
  // Never surface an internal message: it can leak configuration detail.
  response.status(isBadJson ? 400 : 500).json({
    error: isBadJson ? 'Request body must be valid JSON.' : 'Something went wrong.',
  });
}

export function createApp({ llm, config, usingStub }: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(securityHeaders(config.allowedOrigin));
  app.use(express.json({ limit: BODY_LIMIT }));

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
