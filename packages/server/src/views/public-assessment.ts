import type { CaseAssessment, DecisiveFact, Playbook, RouteAvailability } from '@nyaya-mitra/core';

/**
 * What the browser is actually sent.
 *
 * The engine's own structures carry the conditions that drive routes, red flags
 * and limitation clocks. None of it is rendered, all of it is internal logic,
 * and shipping it both bloats the payload and hands out the engine's reasoning.
 * These views send the fields the UI reads and nothing else.
 */

export interface PublicPlaybook {
  readonly id: string;
  readonly domain: string;
  readonly title: string;
  readonly summary: string;
  readonly decisiveFacts: readonly DecisiveFact[];
}

export interface PublicRoute {
  readonly id: string;
  readonly label: string;
  readonly forum: string;
  readonly costInr: number;
  readonly costNote: string;
  readonly minDays: number;
  readonly maxDays: number;
  readonly effort: string;
}

export type PublicRouteAvailability =
  | { readonly route: PublicRoute; readonly available: true }
  | { readonly route: PublicRoute; readonly available: false; readonly reason: string };

export function toPublicPlaybook(playbook: Playbook): PublicPlaybook {
  const { id, domain, title, summary, decisiveFacts } = playbook;
  return { id, domain, title, summary, decisiveFacts };
}

function toPublicRoute(entry: RouteAvailability): PublicRouteAvailability {
  const { id, label, forum, costInr, costNote, minDays, maxDays, effort } = entry.route;
  const route: PublicRoute = { id, label, forum, costInr, costNote, minDays, maxDays, effort };
  return entry.available
    ? { route, available: true }
    : { route, available: false, reason: entry.reason };
}

export function toPublicAssessment(assessment: CaseAssessment) {
  return {
    playbook: toPublicPlaybook(assessment.playbook),
    ready: assessment.ready,
    missingFacts: assessment.missingFacts,
    optionalGaps: assessment.optionalGaps,
    // `rule.appliesWhen` and `rule.fromFact` drive the engine and are not shown.
    limitations: assessment.limitations.map((limitation) => ({
      ...limitation,
      rule: {
        id: limitation.rule.id,
        description: limitation.rule.description,
        reference: limitation.rule.reference,
      },
    })),
    triage: assessment.triage,
    routes: assessment.routes.map(toPublicRoute),
    governingLaw: assessment.governingLaw,
  };
}
