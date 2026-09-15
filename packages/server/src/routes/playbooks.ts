import { Router } from 'express';
import { playbooks } from '@nyaya-mitra/core';

/** The situation catalogue, trimmed to what the UI needs to render a chooser. */
export function playbooksRouter(): Router {
  const router = Router();
  router.get('/playbooks', (_request, response) => {
    response.json({
      playbooks: playbooks.map((playbook) => ({
        id: playbook.id,
        domain: playbook.domain,
        title: playbook.title,
        summary: playbook.summary,
      })),
    });
  });
  return router;
}
