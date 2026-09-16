import { ACCEPTED_TYPES, describeSize, type UploadedDocument } from '../documents/read-file.js';

interface DocumentPickerProps {
  readonly document: UploadedDocument | null;
  readonly fileSize: number;
  readonly error: string | null;
  readonly busy: boolean;
  readonly onPick: (file: File) => void;
  readonly onClear: () => void;
}

/**
 * Optional file input.
 *
 * Framed as "if you have it" rather than a required step: most people asking
 * about a deposit do not have the agreement to hand, and a mandatory upload
 * would stop them before they start.
 */
export function DocumentPicker({
  document,
  fileSize,
  error,
  busy,
  onPick,
  onClear,
}: DocumentPickerProps): React.JSX.Element {
  return (
    <div className="mt-4 border-t border-line pt-4">
      <label htmlFor="document" className="block font-medium text-ink">
        Have the document? Add it
        <span className="ml-2 text-sm font-normal text-muted">Optional</span>
      </label>
      <p id="document-help" className="mt-1 text-sm text-muted">
        An agreement, offer letter, notice or bill. A clear photo is fine. PDF, image or text, up to
        4 MB. It is used for this answer only and is never stored.
      </p>

      {document === null ? (
        <input
          id="document"
          type="file"
          accept={ACCEPTED_TYPES}
          capture="environment"
          aria-describedby="document-help"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file !== undefined) {
              onPick(file);
            }
          }}
          className="mt-3 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-card file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink-soft hover:file:border-brand hover:file:text-brand"
        />
      ) : (
        <p className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface/60 px-4 py-2.5">
          <span className="min-w-0 truncate text-sm text-ink">{document.name}</span>
          <span className="text-sm text-muted">{describeSize(fileSize)}</span>
          <button
            type="button"
            onClick={onClear}
            className="ml-auto rounded-lg px-3 py-1 text-sm font-medium text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Remove
            <span className="sr-only"> the attached file {document.name}</span>
          </button>
        </p>
      )}

      {error !== null && (
        <p role="alert" className="mt-2 text-sm font-medium text-danger-fg">
          {error}
        </p>
      )}
    </div>
  );
}
