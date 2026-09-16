export interface UploadedDocument {
  readonly name: string;
  readonly mimeType: string;
  /** Base64, with no `data:` prefix. */
  readonly data: string;
}

/**
 * What we accept.
 *
 * Gemini reads these natively, so no parser is needed — which matters here
 * because real Indian agreements are very often a photograph of stamp paper
 * rather than a text PDF, and a text extractor would return nothing at all.
 */
export const ALLOWED_MIME_TYPES: readonly string[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
];

/**
 * Large photographs are downscaled in the browser before they are sent, so a
 * real document comfortably fits well under this. Lowered from 4 MB once that
 * landed: a smaller accepted body is a smaller thing to abuse.
 */
export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;

export const isAllowedMimeType = (mimeType: string): boolean =>
  ALLOWED_MIME_TYPES.includes(mimeType);

/**
 * Decoded size of a base64 payload, without decoding it.
 *
 * Decoding first would mean materialising the whole document in memory before
 * discovering it is too large, which is exactly what the limit exists to avoid.
 */
export function decodedByteLength(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export const isWithinSizeLimit = (base64: string): boolean =>
  decodedByteLength(base64) <= MAX_DOCUMENT_BYTES;
