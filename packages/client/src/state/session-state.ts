import type { CaseAssessment, CaseFacts, FactId, FactValue, Playbook } from '@nyaya-mitra/core';
import type {
  ClassifyResponse,
  CoveredSituation,
  DocumentFinding,
  InjectionFinding,
  PlaybookSummary,
} from '../api/types.js';
import type { UploadedDocument } from '../documents/read-file.js';

export type Stage = 'describe' | 'answering' | 'result' | 'refused' | 'error';

export interface SessionState {
  readonly stage: Stage;
  readonly busy: boolean;
  readonly scenario: string;
  readonly playbook: Playbook | null;
  readonly facts: CaseFacts;
  readonly assessment: CaseAssessment | null;
  /** User-facing explanation for a refusal or a failure. */
  readonly message: string | null;
  readonly injectionFindings: readonly InjectionFinding[];
  /** The attached file, held in memory for one request and never stored. */
  readonly document: UploadedDocument | null;
  readonly documentSize: number;
  readonly documentError: string | null;
  /** Clauses from the document that bear on this dispute. */
  readonly documentFindings: readonly DocumentFinding[];
  /**
   * Facts answered here, in the order they were given.
   *
   * Facts extracted from the scenario are deliberately absent: "back" should
   * undo something the user did, not silently discard what they wrote.
   */
  readonly answerOrder: readonly FactId[];
  /** Populated on a miss, so the user is told what we do cover. */
  readonly covered: readonly CoveredSituation[];
  /**
   * The situation catalogue for the landing-page examples.
   *
   * `null` means the fetch has not settled yet, which is distinct from an empty
   * array meaning it settled with nothing. The UI reserves layout space while
   * this is null so the examples do not shove the page down when they arrive.
   */
  readonly catalogue: readonly PlaybookSummary[] | null;
}

export type SessionAction =
  | { readonly type: 'scenario-changed'; readonly scenario: string }
  | { readonly type: 'request-started' }
  | { readonly type: 'classified'; readonly response: ClassifyResponse }
  | { readonly type: 'answered'; readonly factId: FactId; readonly value: FactValue }
  | { readonly type: 'answer-cleared'; readonly factId: FactId }
  | { readonly type: 'assessed'; readonly assessment: CaseAssessment }
  | { readonly type: 'failed'; readonly message: string }
  | {
      readonly type: 'document-attached';
      readonly document: UploadedDocument;
      readonly size: number;
    }
  | { readonly type: 'document-cleared' }
  | { readonly type: 'document-rejected'; readonly message: string }
  | { readonly type: 'catalogue-loaded'; readonly catalogue: readonly PlaybookSummary[] }
  | { readonly type: 'match-rejected' }
  | { readonly type: 'restarted' };

export const initialState: SessionState = {
  stage: 'describe',
  busy: false,
  scenario: '',
  playbook: null,
  facts: {},
  assessment: null,
  message: null,
  injectionFindings: [],
  document: null,
  documentSize: 0,
  documentError: null,
  documentFindings: [],
  answerOrder: [],
  covered: [],
  catalogue: null,
};
