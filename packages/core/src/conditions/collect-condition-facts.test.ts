import { describe, expect, it } from 'vitest';
import { collectConditionFacts } from './collect-condition-facts.js';

describe('collectConditionFacts', () => {
  it('returns the single fact a leaf condition depends on', () => {
    expect(collectConditionFacts({ op: 'isTrue', fact: 'writtenAgreement' })).toEqual([
      'writtenAgreement',
    ]);
    expect(collectConditionFacts({ op: 'gt', fact: 'depositAmountInr', value: 1 })).toEqual([
      'depositAmountInr',
    ]);
  });

  it('unwraps a negation', () => {
    expect(
      collectConditionFacts({ op: 'not', condition: { op: 'isFalse', fact: 'noticeSent' } }),
    ).toEqual(['noticeSent']);
  });

  it('flattens nested combinators, preserving duplicates', () => {
    const facts = collectConditionFacts({
      op: 'allOf',
      conditions: [
        { op: 'isTrue', fact: 'a' },
        {
          op: 'anyOf',
          conditions: [
            { op: 'isFalse', fact: 'b' },
            { op: 'isKnown', fact: 'a' },
          ],
        },
      ],
    });
    expect(facts).toEqual(['a', 'b', 'a']);
  });

  it('returns nothing for an empty combinator', () => {
    expect(collectConditionFacts({ op: 'anyOf', conditions: [] })).toEqual([]);
  });
});
