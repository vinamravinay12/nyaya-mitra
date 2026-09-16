export interface UploadedDocument {
  readonly name: string;
  readonly mimeType: string;
  /** Base64, with no `data:` prefix. */
  readonly data: string;
}

export const ACCEPTED_TYPES = 'application/pdf,image/jpeg,image/png,image/webp,text/plain';
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;

export const isTooLarge = (file: File): boolean => file.size > MAX_DOCUMENT_BYTES;

export function describeSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${String(Math.max(1, Math.round(bytes / 1024)))} KB`;
}

export type ReadResult =
  | { readonly ok: true; readonly document: UploadedDocument }
  | { readonly ok: false; readonly message: string };

/**
 * Reads a file into the shape the API expects.
 *
 * `readAsDataURL` gives `data:<type>;base64,<payload>`; only the payload is
 * sent. The file is never written anywhere — it goes straight from the input to
 * one request and is held only in memory.
 */
export function readDocument(file: File): Promise<ReadResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    const fail = (message: string) => () => {
      resolve({ ok: false, message });
    };

    reader.onerror = fail('That file could not be read.');
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        resolve({ ok: false, message: 'That file could not be read.' });
        return;
      }
      const data = result.slice(result.indexOf(',') + 1);
      if (data.length === 0) {
        resolve({ ok: false, message: 'That file appears to be empty.' });
        return;
      }
      resolve({ ok: true, document: { name: file.name, mimeType: file.type, data } });
    };
    reader.readAsDataURL(file);
  });
}
