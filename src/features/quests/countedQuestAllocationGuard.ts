import { WaveGuardError } from '@/stores/waveTransitionGuard';

let blocked = false;

/** Fence point investments across counted Claim publication and every restoration. */
export function beginCountedQuestAllocationFence(): () => void {
  if (blocked) throw new WaveGuardError('questBusy');
  blocked = true;
  let released = false;
  return () => { if (!released) { released = true; blocked = false; } };
}

/** Refuse grant-dependent investments before any read, debit or publication. */
export function assertCountedQuestAllocationAllowed(): void {
  if (blocked) throw new WaveGuardError('questBusy');
}
