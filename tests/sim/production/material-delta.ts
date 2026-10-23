import { isMaterialLedger, type MaterialLedger } from '@/engine/loot/materials';

/** Actual signed changes, including spent or removed identities; never synthesize shard income. */
export function materialDelta(before: MaterialLedger, after: MaterialLedger): Record<string, number> {
  if (!isMaterialLedger(before) || !isMaterialLedger(after)) throw new Error('Invalid observed material ledger');
  return Object.fromEntries([...new Set([...Object.keys(before), ...Object.keys(after)])].sort()
    .map(id => [id, (after[id] ?? 0) - (before[id] ?? 0)] as const)
    .filter(([, count]) => count !== 0));
}

/** Reward aggregates only grow; omit zero entries so the result remains a concrete ledger. */
export function materialRewardDelta(before: MaterialLedger, after: MaterialLedger): MaterialLedger {
  const entries = Object.entries(materialDelta(before, after)).filter(([, count]) => count !== 0);
  if (entries.some(([, count]) => !Number.isSafeInteger(count) || count < 0)) {
    throw new Error('Production material rewards shrank or became unsafe during award');
  }
  return Object.fromEntries(entries);
}
