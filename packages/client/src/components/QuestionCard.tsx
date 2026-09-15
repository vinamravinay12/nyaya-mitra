import { useState } from 'react';
import type { DecisiveFact, FactKind, FactValue } from '@nyaya-mitra/core';

interface QuestionCardProps {
  readonly fact: DecisiveFact;
  readonly onAnswer: (value: FactValue) => void;
}

/** Total over every kind, so there is no fallback branch that cannot be reached. */
const INPUT_TYPES: Record<FactKind, string> = {
  date: 'date',
  money: 'number',
  text: 'text',
  enum: 'text',
  boolean: 'text',
};

const CARD = 'card p-6 sm:p-7';
const HELP = 'mt-2 text-sm leading-relaxed text-muted';
const PROMPT = 'text-xl font-semibold text-balance text-ink';

/** Yes/no gets a fieldset so the pair is announced as one grouped question. */
function BooleanQuestion({ fact, onAnswer }: QuestionCardProps): React.JSX.Element {
  const helpId = `${fact.id}-why`;
  return (
    <div className={CARD}>
      <fieldset aria-describedby={helpId}>
        <legend className={PROMPT}>{fact.question}</legend>
        <p id={helpId} className={HELP}>
          {fact.why}
        </p>
        <div className="mt-4 flex gap-3">
          {[true, false].map((value) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => {
                onAnswer(value);
              }}
              className="min-w-24 rounded-xl border border-line bg-card px-6 py-3 font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {value ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function ValueQuestion({ fact, onAnswer }: QuestionCardProps): React.JSX.Element {
  const [value, setValue] = useState('');
  const helpId = `${fact.id}-why`;
  return (
    <div className={CARD}>
      <label htmlFor={fact.id} className={`block ${PROMPT}`}>
        {fact.question}
      </label>
      <p id={helpId} className={HELP}>
        {fact.why}
      </p>
      <form
        className="mt-4 flex gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const raw = value.trim();
          if (raw.length > 0) {
            onAnswer(fact.kind === 'money' ? Number(raw) : raw);
          }
        }}
      >
        <input
          id={fact.id}
          name={fact.id}
          type={INPUT_TYPES[fact.kind]}
          aria-describedby={helpId}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          required
          className="flex-1 rounded-xl border border-line bg-surface/60 px-4 py-3 text-ink focus:border-brand focus:bg-card focus:outline-2 focus:outline-offset-1 focus:outline-brand"
        />
        <button
          type="submit"
          className="rounded-xl bg-brand px-6 py-3 font-semibold text-card transition-colors hover:bg-brand-deep"
        >
          Next
        </button>
      </form>
    </div>
  );
}

/** One question at a time, always shown with the reason it is being asked. */
export function QuestionCard(props: QuestionCardProps): React.JSX.Element {
  return props.fact.kind === 'boolean' ? (
    <BooleanQuestion {...props} />
  ) : (
    <ValueQuestion {...props} />
  );
}
