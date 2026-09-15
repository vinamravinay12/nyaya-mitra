import { evaluateCondition } from '../conditions/evaluate-condition.js';
import type { CaseFacts } from '../types/facts.js';
import type { Playbook } from '../types/playbook.js';
import type { Route } from '../types/route.js';
import type { RouteAvailability } from '../types/route-availability.js';

const DEFAULT_UNAVAILABLE_REASON = 'Not applicable given what you have told us so far.';

function assess(route: Route, facts: CaseFacts): RouteAvailability {
  if (route.availableWhen === undefined || evaluateCondition(route.availableWhen, facts)) {
    return { route, available: true };
  }
  return {
    route,
    available: false,
    reason: route.unavailableReason ?? DEFAULT_UNAVAILABLE_REASON,
  };
}

/** Cheapest and quickest first, with everything still open ranked above what is closed. */
function compare(left: RouteAvailability, right: RouteAvailability): number {
  if (left.available !== right.available) {
    return left.available ? -1 : 1;
  }
  if (left.route.costInr !== right.route.costInr) {
    return left.route.costInr - right.route.costInr;
  }
  return left.route.minDays - right.route.minDays;
}

export function selectRoutes(playbook: Playbook, facts: CaseFacts): readonly RouteAvailability[] {
  return playbook.routes.map((route) => assess(route, facts)).sort(compare);
}
