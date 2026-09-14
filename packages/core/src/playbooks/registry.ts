import type { Playbook } from '../types/playbook.js';
import { rentalDepositWithheld } from './rental-deposit-withheld.js';

/** Every situation the engine can handle. Anything else routes to a professional. */
export const playbooks: readonly Playbook[] = [rentalDepositWithheld];

export function findPlaybook(id: string): Playbook | undefined {
  return playbooks.find((playbook) => playbook.id === id);
}
