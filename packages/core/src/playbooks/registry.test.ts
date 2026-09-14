import { describe, expect, it } from 'vitest';
import { findPlaybook, playbooks } from './registry.js';
import { collectConditionFacts } from '../conditions/collect-condition-facts.js';
import type { Playbook } from '../types/playbook.js';

const declaredFacts = (playbook: Playbook): ReadonlySet<string> =>
  new Set([...playbook.decisiveFacts.map((fact) => fact.id), ...playbook.derivedFacts]);

describe('playbook registry', () => {
  it('exposes at least one playbook', () => {
    expect(playbooks.length).toBeGreaterThan(0);
  });

  it('has unique playbook ids', () => {
    const ids = playbooks.map((playbook) => playbook.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('finds a playbook by id and returns undefined for an unknown one', () => {
    expect(findPlaybook('rental.deposit_withheld')?.domain).toBe('rental');
    expect(findPlaybook('nope')).toBeUndefined();
  });
});

describe.each(playbooks.map((playbook) => [playbook.id, playbook] as const))(
  'playbook %s',
  (_id, playbook) => {
    it('declares unique decisive facts', () => {
      const ids = playbook.decisiveFacts.map((fact) => fact.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('gives every fact a question and a reason it is being asked', () => {
      for (const fact of playbook.decisiveFacts) {
        expect(fact.question.length).toBeGreaterThan(0);
        expect(fact.why.length).toBeGreaterThan(0);
      }
    });

    it('declares options for enum facts and only for enum facts', () => {
      for (const fact of playbook.decisiveFacts) {
        if (fact.kind === 'enum') {
          expect(fact.options?.length ?? 0).toBeGreaterThan(0);
        } else {
          expect(fact.options).toBeUndefined();
        }
      }
    });

    it('only branches on facts it asks for or derives', () => {
      const known = declaredFacts(playbook);
      const referenced = [
        ...playbook.redFlags.flatMap((flag) => collectConditionFacts(flag.when)),
        ...playbook.routes.flatMap((route) =>
          route.availableWhen ? collectConditionFacts(route.availableWhen) : [],
        ),
      ];
      for (const factId of referenced) {
        expect(known, `condition references undeclared fact "${factId}"`).toContain(factId);
      }
    });

    it('runs every limitation clock from a date fact it collects', () => {
      const dateFacts = new Set(
        playbook.decisiveFacts.filter((fact) => fact.kind === 'date').map((fact) => fact.id),
      );
      for (const limitation of playbook.limitations) {
        expect(dateFacts).toContain(limitation.fromFact);
        expect(limitation.durationDays).toBeGreaterThan(0);
      }
    });

    it('describes routes with coherent costs and timelines', () => {
      const ids = playbook.routes.map((route) => route.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const route of playbook.routes) {
        expect(route.costInr).toBeGreaterThanOrEqual(0);
        expect(route.minDays).toBeLessThanOrEqual(route.maxDays);
        expect(route.costNote.length).toBeGreaterThan(0);
      }
    });

    it('only explains unavailability for routes that can be unavailable', () => {
      for (const route of playbook.routes) {
        if (route.unavailableReason !== undefined) {
          expect(route.availableWhen).toBeDefined();
        }
      }
    });

    it('escalates every red flag to a named specialisation', () => {
      for (const flag of playbook.redFlags) {
        expect(flag.message.length).toBeGreaterThan(0);
        expect(flag.lawyerSpecialisation.length).toBeGreaterThan(0);
      }
    });

    it('cites governing law with an act, year and provision', () => {
      expect(playbook.governingLaw.length).toBeGreaterThan(0);
      for (const reference of playbook.governingLaw) {
        expect(reference.act.length).toBeGreaterThan(0);
        expect(reference.year).toBeGreaterThan(1800);
        expect(reference.provision.length).toBeGreaterThan(0);
        expect(reference.note.length).toBeGreaterThan(0);
      }
    });
  },
);
