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

  it('records the order answers were given in', () => {
    const one = sessionReducer(answering, { type: 'answered', factId: 'vacateDate', value: 'x' });
    const two = sessionReducer(one, { type: 'answered', factId: 'writtenAgreement', value: true });
    expect(two.answerOrder).toEqual(['vacateDate', 'writtenAgreement']);
  });

  it('does not record a fact twice when it is answered again', () => {
    const one = sessionReducer(answering, { type: 'answered', factId: 'vacateDate', value: 'x' });
    const again = sessionReducer(one, { type: 'answered', factId: 'vacateDate', value: 'y' });
    expect(again.answerOrder).toEqual(['vacateDate']);
    expect(again.facts.vacateDate).toBe('y');
  });

  it('does not treat extracted facts as answers the user can undo', () => {
    // `answering` came from a classification that supplied `state`.
    expect(answering.facts.state).toBe('Karnataka');
    expect(answering.answerOrder).toEqual([]);
  });

  it('clearing an answer removes the fact so it is asked again', () => {
    const answered = sessionReducer(answering, {
      type: 'answered',
      factId: 'vacateDate',
      value: '2026-07-01',
    });
    const cleared = sessionReducer(answered, { type: 'answer-cleared', factId: 'vacateDate' });

    expect(cleared.facts).not.toHaveProperty('vacateDate');
    expect(cleared.answerOrder).toEqual([]);
    expect(currentQuestion(cleared)?.id).toBe('vacateDate');
  });

  it('clearing an answer from the result returns to the questions', () => {
    const assessment = { ready: true } as unknown as CaseAssessment;
    const done = sessionReducer(answering, { type: 'assessed', assessment });
    const cleared = sessionReducer(done, { type: 'answer-cleared', factId: 'state' });

    expect(cleared.stage).toBe('answering');
    expect(cleared.assessment).toBeNull();
    expect(cleared.facts).not.toHaveProperty('state');
  });

  it('can clear a fact that was extracted rather than answered here', () => {
    const cleared = sessionReducer(answering, { type: 'answer-cleared', factId: 'state' });
    expect(cleared.facts).not.toHaveProperty('state');
    expect(cleared.answerOrder).toEqual([]);
  });

  it('goes back to the description when the match is rejected, keeping the text', () => {
    const typed = sessionReducer(
      { ...answering, scenario: 'what I actually asked about' },
      { type: 'answered', factId: 'state', value: 'Goa' },
    );
    const next = sessionReducer(typed, { type: 'match-rejected' });

    expect(next.stage).toBe('describe');
    expect(next.scenario).toBe('what I actually asked about');
    // Facts and the playbook belonged to a situation the user says is not theirs.
    expect(next.playbook).toBeNull();
    expect(next.facts).toEqual({});
    expect(next.injectionFindings).toEqual([]);
    expect(next.answerOrder).toEqual([]);
  });

  it('keeps the catalogue when a match is rejected, so examples still render', () => {
    const withCatalogue = {
      ...answering,
      catalogue: [{ id: 'a', domain: 'rental', title: 'T', summary: 'S', examplePrompt: 'E' }],
    };
    expect(sessionReducer(withCatalogue, { type: 'match-rejected' }).catalogue).toHaveLength(1);
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
