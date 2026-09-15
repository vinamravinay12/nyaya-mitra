import { Router } from 'express';

export function healthRouter(usingStub: boolean): Router {
  const router = Router();
  router.get('/health', (_request, response) => {
    // Deliberately does not report the key itself, only whether one is in use.
    response.json({ status: 'ok', mode: usingStub ? 'stub' : 'gemini' });
  });
  return router;
}
