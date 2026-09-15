import { evaluateCondition } from '../conditions/evaluate-condition.js';
import type { CaseFacts } from '../types/facts.js';
import type { LimitationRule } from '../types/legal.js';
import type { LimitationAssessment, LimitationStatus } from '../types/limitation.js';
import { addDays, differenceInDays, parseIsoDate, toIsoDate } from './iso-date.js';

/** Inside this window the user should act now rather than research further. */
export const CRITICAL_DAYS = 30;
/** Inside this window the deadline is worth surfacing prominently. */
export const APPROACHING_DAYS = 90;

export function classifyDaysRemaining(daysRemaining: number): LimitationStatus {
  if (daysRemaining < 0) {
    return 'expired';
  }
  if (daysRemaining <= CRITICAL_DAYS) {
    return 'critical';
  }
  if (daysRemaining <= APPROACHING_DAYS) {
    return 'approaching';
  }
  return 'comfortable';
}

/**
 * Runs one limitation clock.
 *
 * `today` is injected rather than read from the system clock so that the result
 * is reproducible and the behaviour near a boundary can be tested directly.
 */
export function assessLimitation(
  rule: LimitationRule,
  facts: CaseFacts,
  today: string,
): LimitationAssessment {
  const startValue = facts[rule.fromFact];
  if (typeof startValue !== 'string') {
    return { rule, status: 'unknown', reason: `We still need to know: ${rule.fromFact}` };
  }

  const start = parseIsoDate(startValue);
  const now = parseIsoDate(today);
  if (start === undefined || now === undefined) {
    return { rule, status: 'unknown', reason: `"${startValue}" is not a usable date` };
  }

  const deadlineTimestamp = addDays(start, rule.durationDays);
  const daysRemaining = differenceInDays(deadlineTimestamp, now);
  return {
    rule,
    status: classifyDaysRemaining(daysRemaining),
    deadline: toIsoDate(deadlineTimestamp),
    daysRemaining,
  };
}

/** Whether a clock is relevant to this case at all. */
export function limitationApplies(rule: LimitationRule, facts: CaseFacts): boolean {
  return rule.appliesWhen === null || evaluateCondition(rule.appliesWhen, facts);
}

/** Runs every clock that applies to this case, soonest deadline first. */
export function assessLimitations(
  rules: readonly LimitationRule[],
  facts: CaseFacts,
  today: string,
): readonly LimitationAssessment[] {
  return rules
    .filter((rule) => limitationApplies(rule, facts))
    .map((rule) => assessLimitation(rule, facts, today))
    .sort((left, right) => {
      const leftDays = left.status === 'unknown' ? Number.MAX_SAFE_INTEGER : left.daysRemaining;
      const rightDays = right.status === 'unknown' ? Number.MAX_SAFE_INTEGER : right.daysRemaining;
      return leftDays - rightDays;
    });
}
