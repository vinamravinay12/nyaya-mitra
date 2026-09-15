import { evaluateCondition } from '../conditions/evaluate-condition.js';
import type { CaseFacts } from '../types/facts.js';
import type { LimitationAssessment } from '../types/limitation.js';
import type { Playbook } from '../types/playbook.js';
import type { TriageBand, TriageReason, TriageResult } from '../types/triage.js';

/** Above this, a lawyer's fee is small relative to what is at risk. */
export const HIGH_VALUE_INR = 500_000;
/** Above this, self-help is still reasonable but mistakes start to cost real money. */
export const MODERATE_VALUE_INR = 100_000;

const SEVERITY: Record<TriageBand, number> = {
  'self-serve': 0,
  guided: 1,
  'lawyer-recommended': 2,
  urgent: 3,
};

const escalate = (current: TriageBand, candidate: TriageBand): TriageBand =>
  SEVERITY[candidate] > SEVERITY[current] ? candidate : current;

function amountReason(playbook: Playbook, facts: CaseFacts): TriageReason | undefined {
  const factId = playbook.amountAtStakeFact;
  const amount = factId === null ? undefined : facts[factId];
  if (typeof amount !== 'number') {
    return undefined;
  }
  if (amount >= HIGH_VALUE_INR) {
    return {
      code: 'high-value',
      message: `₹${amount.toLocaleString('en-IN')} is enough at stake that professional representation usually pays for itself.`,
    };
  }
  if (amount >= MODERATE_VALUE_INR) {
    return {
      code: 'moderate-value',
      message: `₹${amount.toLocaleString('en-IN')} is worth pursuing yourself, but get the paperwork right the first time.`,
    };
  }
  return undefined;
}

function limitationReasons(limitations: readonly LimitationAssessment[]): readonly TriageReason[] {
  return limitations.flatMap((assessment): TriageReason[] => {
    if (assessment.status === 'critical') {
      return [
        {
          code: 'deadline-critical',
          message: `${assessment.rule.description}: only ${String(assessment.daysRemaining)} days left, until ${assessment.deadline}.`,
        },
      ];
    }
    if (assessment.status === 'expired') {
      return [
        {
          code: 'deadline-expired',
          message: `${assessment.rule.description}: the ${assessment.rule.reference.act} window closed on ${assessment.deadline}. Only a lawyer can tell you whether an exception applies.`,
        },
      ];
    }
    return [];
  });
}

/**
 * Decides how much help this situation needs.
 *
 * Escalation is monotonic — the most serious signal wins — and every band is
 * returned with the reasons that produced it, because a bare verdict is not
 * something a user can act on or disagree with.
 */
export function scoreTriage(
  playbook: Playbook,
  facts: CaseFacts,
  limitations: readonly LimitationAssessment[],
): TriageResult {
  const reasons: TriageReason[] = [];
  let band: TriageBand = 'self-serve';
  let specialisation = playbook.lawyerSpecialisation;

  for (const flag of playbook.redFlags) {
    if (evaluateCondition(flag.when, facts)) {
      if (band !== 'urgent') {
        // The first flag to fire is the most specific description of the danger.
        specialisation = flag.lawyerSpecialisation;
      }
      band = escalate(band, 'urgent');
      reasons.push({ code: flag.id, message: flag.message });
    }
  }

  for (const reason of limitationReasons(limitations)) {
    band = escalate(band, reason.code === 'deadline-critical' ? 'urgent' : 'lawyer-recommended');
    reasons.push(reason);
  }

  const money = amountReason(playbook, facts);
  if (money !== undefined) {
    band = escalate(band, money.code === 'high-value' ? 'lawyer-recommended' : 'guided');
    reasons.push(money);
  }

  if (reasons.length === 0) {
    reasons.push({
      code: 'no-escalating-factors',
      message:
        'Nothing here needs a lawyer yet. The self-help route is the proportionate first step.',
    });
  }

  return SEVERITY[band] >= SEVERITY['lawyer-recommended']
    ? { band, reasons, lawyerSpecialisation: specialisation }
    : { band, reasons };
}
