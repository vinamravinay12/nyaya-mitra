import { useCallback, useRef } from 'react';
import type { Session } from '../state/use-session.js';
import { AnswerSummary } from './AnswerSummary.js';
import { AssessmentView } from './AssessmentView.js';
import { ExampleScenarios } from './ExampleScenarios.js';
import { Hero } from './Hero.js';
import { HowItWorks } from './HowItWorks.js';
import { InjectionWarning } from './InjectionWarning.js';
import { ProblemNotice } from './ProblemNotice.js';
import { ProgressIndicator } from './ProgressIndicator.js';
import { QuestionCard } from './QuestionCard.js';
import { ScenarioForm } from './ScenarioForm.js';
import { ScopeNote } from './ScopeNote.js';

function DescribeStage({ session }: { readonly session: Session }): React.JSX.Element {
  const { state, setScenario, submitScenario } = session;
  const textarea = useRef<HTMLTextAreaElement>(null);

  // The examples sit below the form, so picking one would otherwise leave the
  // user scrolled past the box that just filled. Focusing scrolls it back into
  // view and puts the cursor where they can edit it.
  const pickExample = useCallback(
    (scenario: string): void => {
      setScenario(scenario);
      textarea.current?.focus();
    },
    [setScenario],
  );

  return (
    <div className="space-y-10">
      <Hero situationCount={state.catalogue?.length ?? null} />
      <ScenarioForm
        scenario={state.scenario}
        busy={state.busy}
        onScenarioChange={setScenario}
        onSubmit={submitScenario}
        textareaRef={textarea}
      />
      <ExampleScenarios playbooks={state.catalogue} onPick={pickExample} />
      <HowItWorks />
      <ScopeNote />
    </div>
  );
}

function AnsweringStage({ session }: { readonly session: Session }): React.JSX.Element {
  const { state, question, progress, answer, rejectMatch, changeAnswer, goBack } = session;
  return (
    <div className="space-y-6">
      {state.playbook !== null && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-wide text-brand uppercase">
              {state.playbook.title}
            </p>
            <p className="mt-1 text-sm text-muted">
              A few questions so we can be specific. We only ask what changes the answer.
            </p>
          </div>
          <button
            type="button"
            onClick={rejectMatch}
            className="rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-brand/40 hover:text-brand"
          >
            Not your situation?
          </button>
        </div>
      )}
      <ProgressIndicator answered={progress.answered} total={progress.total} />
      <InjectionWarning findings={state.injectionFindings} />
      {question !== undefined && (
        <QuestionCard
          // Keyed by fact so React remounts on each question. Without this the
          // component instance is reused and the previous answer stays in the box.
          key={question.id}
          fact={question}
          onAnswer={(value) => {
            answer(question.id, value);
          }}
        />
      )}

      {goBack !== undefined && (
        <button
          type="button"
          onClick={goBack}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          ← Back to the previous question
        </button>
      )}

      {state.playbook !== null && (
        <AnswerSummary
          facts={state.playbook.decisiveFacts}
          answers={state.facts}
          onChange={changeAnswer}
        />
      )}
    </div>
  );
}

/** Renders whichever step of the conversation the session is on. */
export function StageView({ session }: { readonly session: Session }): React.JSX.Element | null {
  const { state } = session;

  switch (state.stage) {
    case 'describe':
      return <DescribeStage session={session} />;
    case 'answering':
      return <AnsweringStage session={session} />;
    case 'result':
      return state.assessment === null ? null : (
        <div className="space-y-8">
          <AssessmentView assessment={state.assessment} />
          {/* Changing an answer here sends the user back to that one question and
              then straight to a fresh assessment. */}
          <AnswerSummary
            facts={state.assessment.playbook.decisiveFacts}
            answers={state.facts}
            onChange={session.changeAnswer}
          />
        </div>
      );
    case 'refused':
    case 'error':
      return (
        <ProblemNotice
          refused={state.stage === 'refused'}
          message={state.message ?? ''}
          covered={state.covered}
        />
      );
  }
}
