import type { CaseAssessment } from '@nyaya-mitra/core';
import { DeadlineList } from './DeadlineList.js';
import { GoverningLawList } from './GoverningLawList.js';
import { RouteList } from './RouteList.js';
import { TriageBanner } from './TriageBanner.js';

export function AssessmentView({
  assessment,
}: {
  readonly assessment: CaseAssessment;
}): React.JSX.Element {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{assessment.playbook.title}</h1>
        <p className="mt-1 text-muted">{assessment.playbook.summary}</p>
      </div>
      <TriageBanner triage={assessment.triage} />
      <DeadlineList limitations={assessment.limitations} />
      <RouteList routes={assessment.routes} />
      <GoverningLawList references={assessment.governingLaw} />
    </div>
  );
}
