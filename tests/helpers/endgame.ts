import { EVE_QUEST, THRONE_PROOF, ACT5_ENCOUNTERS } from '../../src/engine/map/act5-admission';
import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '../../src/engine/types/save';

/** Qualified source-graph fixture; this does not represent an earned campaign playthrough. */
export function campaignEvidence() {
  const encounter = ACT5_ENCOUNTERS.find(row => row.questId === EVE_QUEST);
  if (!encounter) throw new Error('Missing canonical Eve contract');
  return {
    questProgress: { [EVE_QUEST]: { id: EVE_QUEST, status: 'completed', rewardClaimed: true,
      objectives: { 'obj-throne-waves': true, 'obj-kill-baal': true } } } satisfies Record<string, QuestProgressData>,
    questReceipts: { [THRONE_PROOF]: true, [encounter.proof]: true } satisfies QuestActionReceipts,
    questItems: {} satisfies QuestItemLedger
  };
}
