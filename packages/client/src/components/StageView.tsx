import type { Session } from '../state/use-session.js';
import { AssessmentView } from './AssessmentView.js';
import { InjectionWarning } from './InjectionWarning.js';
import { ProblemNotice } from './ProblemNotice.js';
import { QuestionCard } from './QuestionCard.js';
import { ScenarioForm } from './ScenarioForm.js';

/** Renders whichever step of the conversation the session is on. */
export function StageView({ session }: { readonly session: Session }): React.JSX.Element | null {
  const { state, question, setScenario, submitScenario, answer } = session;

  switch (state.stage) {
    case 'describe':
      return (
        <>
          <h1 className="text-2xl font-semibold text-ink">Tell us what happened</h1>
          <ScenarioForm
            scenario={state.scenario}
            busy={state.busy}
            onScenarioChange={setScenario}
            onSubmit={submitScenario}
          />
        </>
      );
    case 'answering':
      return (
        <>
          <InjectionWarning findings={state.injectionFindings} />
          {question !== undefined && (
            <QuestionCard
              fact={question}
              onAnswer={(value) => {
                answer(question.id, value);
              }}
            />
          )}
        </>
      );
    case 'result':
      return state.assessment === null ? null : <AssessmentView assessment={state.assessment} />;
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
