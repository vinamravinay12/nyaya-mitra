import { Router } from 'express';
import { assessCase, findPlaybook } from '@nyaya-mitra/core';
import { assessRequestSchema } from '../validation/schemas.js';

/**
 * Runs the engine. No model is involved: given the same facts and date this
 * endpoint always returns the same assessment.
 */
export function assessRouter(): Router {
  const router = Router();

  router.post('/assess', (request, response) => {
    const parsed = assessRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      response
        .status(400)
        .json({ error: 'A playbookId, facts object and YYYY-MM-DD date are required.' });
      return;
    }

    const playbook = findPlaybook(parsed.data.playbookId);
    if (playbook === undefined) {
      response.status(404).json({ error: 'Unknown situation.' });
      return;
    }

    response.json(assessCase(playbook, parsed.data.facts, parsed.data.today));
  });

  return router;
}
