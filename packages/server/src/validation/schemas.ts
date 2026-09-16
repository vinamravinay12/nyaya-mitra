import { z } from 'zod';
import { isAllowedMimeType, isWithinSizeLimit } from '../documents/document.js';
import { matchesDeclaredType } from '../documents/sniff-type.js';

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

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export const documentSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    mimeType: z.string().refine(isAllowedMimeType, 'Unsupported file type'),
    data: z
      .string()
      .regex(BASE64, 'Not valid base64')
      .refine(isWithinSizeLimit, 'File is too large'),
  })
  // The browser's File.type comes from the extension and is forgeable, so the
  // bytes themselves must agree with what the upload claims to be.
  .refine(
    (document) => matchesDeclaredType(document.data, document.mimeType),
    'That file does not look like the type it claims to be',
  );

export const classifyRequestSchema = z.object({
  scenario: z.string().trim().min(10).max(5000),
  document: documentSchema.optional(),
});

export const assessRequestSchema = z.object({
  playbookId: z.string().min(1),
  facts: factsSchema,
  today: z.string().regex(ISO_DATE_REGEX),
});

export type Classification = z.infer<typeof classificationSchema>;
