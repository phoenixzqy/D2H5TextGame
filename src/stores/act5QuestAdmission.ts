import { loadQuests } from '@/data/loaders/quests';
import { EVE_QUEST, PRISON_QUEST, THRONE_PROOF, hasOriginalAct5Victory, isAct5AdmissionEligible } from '@/engine/map/act5-admission';
import type { QuestProgressData } from '@/engine/types/save';
import { validateQuestActionReceipts } from '@/engine/save/validate';
import { publishQuestItemChange, withQuestTransaction } from '@/features/quests/questTransaction';
import type { RecordedWaveBinding } from './recordedWaveReceipt';
import type { ActiveRun } from './combatRunLifecycle';
import { useMapStore } from './mapStore';
import { useInventoryStore } from './inventoryStore';

const sequences = new WeakMap<ActiveRun, { count: number; row: QuestProgressData }>();
/** Capture pre-income eligibility once, then publish only at accepted settlement. */
export function prepareAct5Settlement(binding: RecordedWaveBinding): () => void {
  const run = binding.candidateRun, encounter = binding.act5ThroneWave ?? binding.act5Encounter;
  const outcome = binding.recording.outcome, map = useMapStore.getState();
  if (outcome.winner !== 'player') sequences.delete(run);
  if (!encounter || run.plan.replayProfileId === 'nightmare') return () => undefined;
  const row = map.questProgress[encounter.contract.questId];
  let eligible = isAct5AdmissionEligible(encounter.contract, map.questProgress);
  if (encounter.contract.questId === PRISON_QUEST && !Object.hasOwn(map.questReceipts, `${PRISON_QUEST}#action:thaw-anya`)) eligible = false;
  if (encounter.contract.questId === EVE_QUEST && !binding.act5ThroneWave && !Object.hasOwn(map.questReceipts, THRONE_PROOF)) eligible = false;
  try { validateQuestActionReceipts(map.questReceipts, map.questProgress, useInventoryStore.getState().questItems); }
  catch { eligible = false; }
  return () => {
    if (!eligible || !row || useMapStore.getState().questProgress[encounter.contract.questId] !== row ||
      !hasOriginalAct5Victory(encounter, binding.heroId, outcome)) { sequences.delete(run); return; }
    if (binding.act5ThroneWave) {
      if (run.plan.questSourceProjection !== 'act5-throne' || run.mode !== 'manual') return;
      const sequence = sequences.get(run) ?? { count: 0, row };
      if (sequence.row !== row || binding.act5ThroneWave.ordinal !== sequence.count + 1) { sequences.delete(run); return; }
      if (sequence.count < 4) { sequences.set(run, { count: sequence.count + 1, row }); return; }
    } else if (encounter.contract.source.kind === 'chapterBoss' &&
      (binding.targetWaveIdx + 1 !== binding.publication.totalWaves ||
        binding.recording.chapterBoss?.unitId !== encounter.originalMemberIds[0] ||
        binding.recording.chapterBoss?.archetypeId !== encounter.contract.members[0]?.archetypeId)) return;
    const result = withQuestTransaction(() => {
      const current = useMapStore.getState();
      if (current.questProgress[encounter.contract.questId] !== row ||
        !isAct5AdmissionEligible(encounter.contract, current.questProgress)) return 'not-eligible';
      const quest = loadQuests().find(def => def.id === encounter.contract.questId);
      if (!quest) throw new Error('Missing Act V quest contract');
      const objectives = { ...row.objectives, [encounter.contract.objectiveId]: true };
      return publishQuestItemChange(quest.id, { ...row, objectives,
        status: quest.objectives.every(objective => objectives[objective.id]) ? 'completed' : 'inProgress' },
      useInventoryStore.getState().questItems, { ...current.questReceipts, [encounter.contract.proof]: true });
    });
    if (result !== 'ok') throw new Error(`Act V victory publication refused: ${result}`);
    if (binding.act5ThroneWave) sequences.delete(run);
  };
}
