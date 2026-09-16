import { useCallback, type Dispatch } from 'react';
import { isTooLarge, readDocument } from '../documents/read-file.js';
import type { SessionAction } from './session-state.js';

export interface DocumentActions {
  readonly attachDocument: (file: File) => void;
  readonly clearDocument: () => void;
}

/**
 * Attaching and removing the optional file.
 *
 * Size is checked here as well as on the server, so the user is told before a
 * multi-megabyte upload is attempted rather than after it fails.
 */
export function useDocument(dispatch: Dispatch<SessionAction>): DocumentActions {
  const attachDocument = useCallback(
    (file: File): void => {
      if (isTooLarge(file)) {
        dispatch({
          type: 'document-rejected',
          message: 'That file is too large. The limit is 4 MB.',
        });
        return;
      }
      void readDocument(file).then((result) => {
        dispatch(
          result.ok
            ? { type: 'document-attached', document: result.document, size: file.size }
            : { type: 'document-rejected', message: result.message },
        );
      });
    },
    [dispatch],
  );

  const clearDocument = useCallback((): void => {
    dispatch({ type: 'document-cleared' });
  }, [dispatch]);

  return { attachDocument, clearDocument };
}
