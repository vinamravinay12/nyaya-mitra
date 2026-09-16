import type { Playbook } from '../types/playbook.js';
import { consumerDefectivePurchase } from './consumer-defective-purchase.js';
import { cyberUnauthorisedTransaction } from './cyber-unauthorised-transaction.js';
import { employmentDocumentsWithheld } from './employment-documents-withheld.js';
import { employmentNoticePeriod } from './employment-notice-period.js';
import { employmentPfNotDeposited } from './employment-pf-not-deposited.js';
import { employmentPostEmploymentRestriction } from './employment-post-employment-restriction.js';
import { employmentUnpaidSalary } from './employment-unpaid-salary.js';
import { employmentWrongfulTermination } from './employment-wrongful-termination.js';
import { moneyChequeBounced } from './money-cheque-bounced.js';
import { rentalDepositWithheld } from './rental-deposit-withheld.js';
import { rentalIllegalEviction } from './rental-illegal-eviction.js';
import { rentalRepairsNotDone } from './rental-repairs-not-done.js';
import { societyBuilderDelay } from './society-builder-delay.js';
import { societyCommitteeDispute } from './society-committee-dispute.js';

/**
 * Every situation the engine can handle. Anything else routes to a professional.
 *
 * Ordered by domain so the landing page groups sensibly.
 */
export const playbooks: readonly Playbook[] = [
  rentalDepositWithheld,
  rentalIllegalEviction,
  rentalRepairsNotDone,
  societyCommitteeDispute,
  societyBuilderDelay,
  employmentUnpaidSalary,
  employmentWrongfulTermination,
  employmentNoticePeriod,
  employmentDocumentsWithheld,
  employmentPfNotDeposited,
  employmentPostEmploymentRestriction,
  consumerDefectivePurchase,
  cyberUnauthorisedTransaction,
  moneyChequeBounced,
];

export function findPlaybook(id: string): Playbook | undefined {
  return playbooks.find((playbook) => playbook.id === id);
}
