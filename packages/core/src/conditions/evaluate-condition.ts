import type { CaseFacts, FactId, FactValue } from '../types/facts.js';
import type { Condition } from '../types/condition.js';

/** The condition variants that test a single fact directly. */
type LeafCondition = Extract<Condition, { readonly fact: FactId }>;

/** A fact is "known" only if it was collected and not explicitly cleared. */
const isKnown = (value: FactValue | undefined): value is string | number | boolean =>
  value !== undefined && value !== null;

const asNumber = (value: FactValue | undefined): number | undefined =>
  typeof value === 'number' ? value : undefined;

function evaluateLeaf(condition: LeafCondition, facts: CaseFacts): boolean {
  const value = facts[condition.fact];
  switch (condition.op) {
    case 'isTrue':
      return value === true;
    case 'isFalse':
      return value === false;
    case 'isKnown':
      return isKnown(value);
    case 'isUnknown':
      return !isKnown(value);
    case 'gt': {
      const numeric = asNumber(value);
      return numeric !== undefined && numeric > condition.value;
    }
    case 'lt': {
      const numeric = asNumber(value);
      return numeric !== undefined && numeric < condition.value;
    }
    case 'equals':
      return value === condition.value;
  }
}

/**
 * Evaluates a playbook condition against the facts collected so far.
 *
 * Unknown facts are falsy rather than an error: the engine is expected to run
 * against a partly-filled case and narrow as the user answers more questions.
 */
export function evaluateCondition(condition: Condition, facts: CaseFacts): boolean {
  switch (condition.op) {
    case 'anyOf':
      return condition.conditions.some((inner) => evaluateCondition(inner, facts));
    case 'allOf':
      return condition.conditions.every((inner) => evaluateCondition(inner, facts));
    case 'not':
      return !evaluateCondition(condition.condition, facts);
    default:
      return evaluateLeaf(condition, facts);
  }
}
