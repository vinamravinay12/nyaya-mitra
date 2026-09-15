import { z } from 'zod';

export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const factValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const factsSchema = z.record(z.string(), factValueSchema);

/** Shape the model is asked to return. Anything else is rejected, not coerced. */
export const classificationSchema = z.object({
  playbookId: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  outOfScope: z.boolean(),
  outOfScopeReason: z.string().nullable(),
  extractedFacts: factsSchema,
});

export const classifyRequestSchema = z.object({
  scenario: z.string().trim().min(10).max(5000),
});

export const assessRequestSchema = z.object({
  playbookId: z.string().min(1),
  facts: factsSchema,
  today: z.string().regex(ISO_DATE_REGEX),
});

export type Classification = z.infer<typeof classificationSchema>;
