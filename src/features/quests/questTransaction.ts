import { assertIronGolemOwnershipMutationAllowed } from '@/stores/waveTransitionGuard';

let inProgress = false;

/** Serialize synchronous Claim, Read and Recover grants through all rollback attempts. */
export function withQuestTransaction<T>(operation: () => T): T | 'claim-in-progress' {
  assertIronGolemOwnershipMutationAllowed();
  if (inProgress) return 'claim-in-progress';
  inProgress = true;
  try { return operation(); } finally { inProgress = false; }
}
