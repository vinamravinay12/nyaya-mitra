import { describe, expect, it } from 'vitest';
import { selectRoutes } from './select-routes.js';
import { rentalDepositWithheld } from '../playbooks/rental-deposit-withheld.js';
import type { Playbook } from '../types/playbook.js';

const idsOf = (results: readonly { route: { id: string } }[]): string[] =>
  results.map((result) => result.route.id);

describe('selectRoutes', () => {
  it('keeps unavailable routes and explains why they are closed', () => {
    const results = selectRoutes(rentalDepositWithheld, {
      writtenAgreement: false,
      stateAdoptedModelTenancyAct: false,
      writtenDemandSent: false,
    });
    const summary = new Map(results.map((result) => [result.route.id, result]));

    expect(summary.get('summary-suit')?.available).toBe(false);
    expect(summary.get('rent-authority')?.available).toBe(false);
    const suit = summary.get('summary-suit');
    expect(suit?.available === false && suit.reason).toContain('written contract');
  });

  it('opens routes once their preconditions hold', () => {
    const results = selectRoutes(rentalDepositWithheld, {
      writtenAgreement: true,
      stateAdoptedModelTenancyAct: true,
      writtenDemandSent: false,
    });
    expect(results.every((result) => result.available)).toBe(true);
  });

  it('always offers routes that have no precondition', () => {
    const results = selectRoutes(rentalDepositWithheld, {});
    const lokAdalat = results.find((result) => result.route.id === 'lok-adalat');
    expect(lokAdalat?.available).toBe(true);
  });

  it('closes the demand notice once one has already been sent', () => {
    const results = selectRoutes(rentalDepositWithheld, { writtenDemandSent: true });
    const notice = results.find((result) => result.route.id === 'demand-notice');
    expect(notice?.available).toBe(false);
  });

  it('ranks available routes ahead of closed ones', () => {
    const results = selectRoutes(rentalDepositWithheld, { writtenAgreement: false });
    const firstClosed = results.findIndex((result) => !result.available);
    const lastOpen = results.map((result) => result.available).lastIndexOf(true);
    expect(firstClosed).toBeGreaterThan(lastOpen);
  });

  it('puts the cheapest route first, breaking ties on speed', () => {
    const results = selectRoutes(rentalDepositWithheld, {
      writtenAgreement: true,
      stateAdoptedModelTenancyAct: true,
      writtenDemandSent: false,
    });
    expect(idsOf(results)).toEqual([
      'demand-notice',
      'lok-adalat',
      'rent-authority',
      'summary-suit',
    ]);
  });

  it('falls back to a generic explanation when a route gives no reason', () => {
    const playbook: Playbook = {
      ...rentalDepositWithheld,
      routes: [
        {
          id: 'bare',
          label: 'Bare route',
          forum: 'Somewhere',
          costInr: 0,
          costNote: 'Free',
          minDays: 1,
          maxDays: 2,
          effort: 'low',
          availableWhen: { op: 'isTrue', fact: 'neverSet' },
        },
      ],
    };
    const result = selectRoutes(playbook, {})[0];
    expect(result?.available).toBe(false);
    expect(result?.available === false && result.reason).toContain('Not applicable');
  });

  it('returns nothing for a playbook with no routes', () => {
    expect(selectRoutes({ ...rentalDepositWithheld, routes: [] }, {})).toEqual([]);
  });
});
