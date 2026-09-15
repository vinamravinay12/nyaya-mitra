import { describe, expect, it } from 'vitest';
import { playbooks, type CaseAssessment } from '@nyaya-mitra/core';
import {
  currentQuestion,
  initialState,
  isIntakeComplete,
  sessionReducer,
  type SessionState,
} from './session-reducer.js';

const playbook = playbooks[0];
if (playbook === undefined) {
  throw new Error('expected at least one playbook');
}

const matched = {
  kind: 'matched',
  playbook,
  confidence: 0.9,
  facts: { state: 'Karnataka' },
  injectionFindings: [],
} as const;

const answering: SessionState = sessionReducer(initialState, {
  type: 'classified',
  response: matched,
});

describe('sessionReducer', () => {
  it('records the scenario as it is typed without changing stage', () => {
    const next = sessionReducer(initialState, { type: 'scenario-changed', scenario: 'hello' });
    expect(next.scenario).toBe('hello');
    expect(next.stage).toBe('describe');
  });

  it('marks the session busy and clears any previous message', () => {
    const failed = sessionReducer(initialState, { type: 'failed', message: 'boom' });
    const next = sessionReducer(failed, { type: 'request-started' });
    expect(next.busy).toBe(true);
    expect(next.message).toBeNull();
  });

  it('moves to questions on a match, carrying the extracted facts', () => {
    expect(answering.stage).toBe('answering');
    expect(answering.playbook?.id).toBe(playbook.id);
    expect(answering.facts).toEqual({ state: 'Karnataka' });
    expect(answering.busy).toBe(false);
  });

  it('refuses an out-of-scope situation with its reason', () => {
    const next = sessionReducer(initialState, {
      type: 'classified',
      response: { kind: 'out-of-scope', reason: 'Criminal matter.' },
    });
    expect(next.stage).toBe('refused');
    expect(next.message).toBe('Criminal matter.');
  });

  it('treats an unrecognised situation as an error, not a refusal', () => {
    const next = sessionReducer(initialState, {
      type: 'classified',
      response: {
        kind: 'unrecognised',
        reason: 'No match.',
        covered: [{ id: 'rental.deposit_withheld', title: 'Deposit withheld' }],
      },
    });
    expect(next.stage).toBe('error');
    expect(next.covered).toHaveLength(1);
  });

  it('carries no catalogue on a refusal', () => {
    const next = sessionReducer(initialState, {
      type: 'classified',
      response: { kind: 'out-of-scope', reason: 'Criminal matter.' },
    });
    expect(next.covered).toEqual([]);
  });

  it('records an answer without disturbing the others', () => {
    const next = sessionReducer(answering, {
      type: 'answered',
      factId: 'writtenAgreement',
      value: true,
    });
    expect(next.facts).toEqual({ state: 'Karnataka', writtenAgreement: true });
  });

  it('overwrites an answer when it is given again', () => {
    const once = sessionReducer(answering, { type: 'answered', factId: 'state', value: 'Goa' });
    expect(once.facts.state).toBe('Goa');
  });

  it('stores the assessment and shows the result', () => {
    const assessment = { ready: true } as unknown as CaseAssessment;
    const next = sessionReducer(answering, { type: 'assessed', assessment });
    expect(next.stage).toBe('result');
    expect(next.assessment).toBe(assessment);
    expect(next.busy).toBe(false);
  });

  it('surfaces a failure and stops the spinner', () => {
    const next = sessionReducer({ ...answering, busy: true }, { type: 'failed', message: 'oops' });
    expect(next).toMatchObject({ stage: 'error', message: 'oops', busy: false });
  });

  it('returns to a clean slate on restart', () => {
    expect(sessionReducer(answering, { type: 'restarted' })).toEqual(initialState);
  });
});

describe('currentQuestion and isIntakeComplete', () => {
  it('asks nothing before a playbook is chosen', () => {
    expect(currentQuestion(initialState)).toBeUndefined();
    expect(isIntakeComplete(initialState)).toBe(false);
  });

  it('asks the first unanswered required question', () => {
    expect(currentQuestion(answering)?.id).toBe('vacateDate');
  });

  it('is complete once every required fact is answered', () => {
    const facts = Object.fromEntries(
      playbook.decisiveFacts.filter((fact) => fact.required).map((fact) => [fact.id, 'x']),
    );
    const complete: SessionState = { ...answering, facts };
    expect(currentQuestion(complete)).toBeUndefined();
    expect(isIntakeComplete(complete)).toBe(true);
  });
});
