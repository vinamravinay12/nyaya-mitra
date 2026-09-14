import type { Condition } from '../types/condition.js';
import type { FactId } from '../types/facts.js';

/**
 * Every fact id a condition tree depends on.
 *
 * Used to validate that a playbook never branches on a fact it neither asks for
 * nor derives — the failure mode where a route silently never becomes available.
 */
export function collectConditionFacts(condition: Condition): readonly FactId[] {
  switch (condition.op) {
    case 'anyOf':
    case 'allOf':
      return condition.conditions.flatMap(collectConditionFacts);
    case 'not':
      return collectConditionFacts(condition.condition);
    default:
      return [condition.fact];
  }
}
