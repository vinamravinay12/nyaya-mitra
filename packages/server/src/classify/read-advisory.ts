/**
 * Best-effort reading of the model's advisory output.
 *
 * The core of a classification — which playbook, which facts — is validated
 * strictly, because a failure there genuinely means we cannot proceed. These
 * extras are different: quoted clauses and injection warnings are helpful but
 * not load-bearing, and rejecting an otherwise good classification because one
 * of them ran a few characters long is the wrong trade.
 *
 * We shipped exactly that bug: a 355-character warning against a 300-character
 * limit discarded a correct answer. These readers truncate and drop instead.
 */

export interface DocumentFinding {
  readonly clause: string;
  readonly why: string;
}

export const MAX_FINDINGS = 8;
export const MAX_WARNINGS = 4;
export const MAX_CLAUSE_CHARS = 600;
export const MAX_WHY_CHARS = 400;
export const MAX_WARNING_CHARS = 300;

const asArray = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : []);

const text = (value: unknown, limit: number): string =>
  typeof value === 'string' ? value.trim().slice(0, limit) : '';

export function readDocumentFindings(raw: unknown): readonly DocumentFinding[] {
  return asArray(raw)
    .flatMap((entry): DocumentFinding[] => {
      if (typeof entry !== 'object' || entry === null) {
        return [];
      }
      const { clause, why } = entry as { clause?: unknown; why?: unknown };
      const finding = {
        clause: text(clause, MAX_CLAUSE_CHARS),
        why: text(why, MAX_WHY_CHARS),
      };
      return finding.clause.length > 0 ? [finding] : [];
    })
    .slice(0, MAX_FINDINGS);
}

export function readDocumentWarnings(raw: unknown): readonly string[] {
  return asArray(raw)
    .map((entry) => text(entry, MAX_WARNING_CHARS))
    .filter((entry) => entry.length > 0)
    .slice(0, MAX_WARNINGS);
}
