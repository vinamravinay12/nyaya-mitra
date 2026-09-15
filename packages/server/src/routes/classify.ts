import { Router } from 'express';
import { playbooks } from '@nyaya-mitra/core';
import { classifyScenario } from '../classify/classify-scenario.js';
import { LlmQuotaExceededError, LlmUnavailableError, type LlmClient } from '../llm/llm-client.js';
import { classifyRequestSchema } from '../validation/schemas.js';

export function classifyRouter(llm: LlmClient): Router {
  const router = Router();

  router.post('/classify', async (request, response) => {
    const parsed = classifyRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: 'Describe your situation in 10 to 5000 characters.' });
      return;
    }

    try {
      const outcome = await classifyScenario(llm, playbooks, parsed.data.scenario);
      response.json(outcome);
    } catch (cause) {
      if (cause instanceof LlmQuotaExceededError) {
        response
          .status(429)
          .json({ error: 'The assistant has reached its usage limit for today.' });
        return;
      }
      if (cause instanceof LlmUnavailableError) {
        response.status(503).json({ error: 'The assistant is unavailable right now.' });
        return;
      }
      throw cause;
    }
  });

  return router;
}
