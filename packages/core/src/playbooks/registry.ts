import type { Playbook } from '../types/playbook.js';
import { consumerDefectivePurchase } from './consumer-defective-purchase.js';
import { cyberUnauthorisedTransaction } from './cyber-unauthorised-transaction.js';
import { employmentUnpaidSalary } from './employment-unpaid-salary.js';
import { moneyChequeBounced } from './money-cheque-bounced.js';
import { rentalDepositWithheld } from './rental-deposit-withheld.js';

/** Every situation the engine can handle. Anything else routes to a professional. */
export const playbooks: readonly Playbook[] = [
  rentalDepositWithheld,
  employmentUnpaidSalary,
  consumerDefectivePurchase,
  cyberUnauthorisedTransaction,
  moneyChequeBounced,
];

export function findPlaybook(id: string): Playbook | undefined {
  return playbooks.find((playbook) => playbook.id === id);
}
