import Ajv2020 from 'ajv/dist/2020';
import mainDocument from '@/data/quests/main.json';
import sideDocument from '@/data/quests/side.json';
import { compileAuthoredValidator } from '@/data/authored-validators';
import type { DialogueDoc } from '@/data/loaders/dialogue';
import { dialogues } from '@/data';
import { loadQuests } from '@/data/loaders/quests';
import { loadTownNpcs } from '@/data/loaders/towns';
import { FARA, FARA_DOMAIN, validateFaraQuestGraph } from '@/engine/map/fara-quest';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import type { Player } from '@/engine/types/entities';
import { countedActorContinuity } from './countedQuestRollback';
import { assertCountedData, sameCountedData, snapshotCountedData } from './countedQuestContract';

const validateDialogue = compileAuthoredValidator<DialogueDoc>(new Ajv2020({ strict: true, allErrors: true }), 'dialogue');
function onlyKeys(value: object, required: readonly string[], optional: readonly string[] = []): boolean {
  return required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key));
}
/** Pin complete canonical Talk, dialogue, NPC and prerequisite authoring before any publication. */
export function captureFaraAuthority() {
  assertCountedData(mainDocument); assertCountedData(sideDocument); assertCountedData(dialogues);
  const quests = snapshotCountedData(loadQuests()), candidates = snapshotCountedData(dialogues).filter(doc => doc.id === FARA.dialogueId);
  const matches = quests.filter(quest => quest.id === FARA.quest), main = quests.filter(quest => quest.id === FARA.prerequisite.quest);
  const quest = matches[0], prerequisite = main[0], objective = quest?.objectives[0], mainObjective = prerequisite?.objectives[0], dialogue = candidates[0];
  if (matches.length !== 1 || main.length !== 1 || candidates.length !== 1 || !quest || !prerequisite || !objective || !mainObjective || !dialogue ||
    !onlyKeys(quest, ['id', 'name', 'type', 'actId', 'giver', 'description', 'objectives', 'rewards', 'prerequisites'], ['order']) ||
    quest.type !== 'side' || quest.actId !== FARA.actId || quest.giver !== FARA.npc || quest.objectives.length !== 1 ||
    !onlyKeys(objective, ['id', 'type', 'npcId', 'description']) || objective.id !== FARA.objective || objective.type !== 'talk' || objective.npcId !== FARA.npc ||
    !sameCountedData(quest.prerequisites, [FARA.prerequisite.quest]) || !sameCountedData(quest.rewards, { gemShards: 1, wishstones: 10 }) ||
    prerequisite.type !== 'main' || prerequisite.actId !== FARA.actId || prerequisite.giver !== 'npc/atma' || prerequisite.objectives.length !== 1 ||
    prerequisite.prerequisites !== undefined || prerequisite.objectiveStages !== undefined ||
    !onlyKeys(mainObjective, ['id', 'type', 'targetId', 'areaId', 'description']) ||
    mainObjective.id !== FARA.prerequisite.objectiveIds[0] || mainObjective.type !== 'kill' || mainObjective.targetId !== 'monsters/act2.radament' || mainObjective.areaId !== 'areas/act2-far-oasis' ||
    !validateDialogue(dialogue) || !onlyKeys(dialogue, ['id', 'npcId', 'greetings', 'services']) || dialogue.npcId !== 'fara' ||
    dialogue.greetings.length < 1 || dialogue.services.length !== 0 || !dialogue.greetings.every(greeting => greeting.text.length > 0 && greeting.textKey === FARA.greetingKey) ||
    loadTownNpcs(2).filter(npc => npc.id === FARA.npc).length !== 1) throw new Error('Fara exact authored authority changed');
  return { quest, prerequisite, dialogue: snapshotCountedData(dialogue), npc: snapshotCountedData(loadTownNpcs(2).find(npc => npc.id === FARA.npc)) };
}
/** Canonical definitions must remain unchanged after each observable publication. */
export function sameFaraAuthority(before: ReturnType<typeof captureFaraAuthority>): boolean {
  try { return sameCountedData(captureFaraAuthority(), before); } catch { return false; }
}
/** Validate this finite source plus the shared live quest graph at the ordinary boundary. */
export function validateLiveFaraGraph(): void {
  const map = useMapStore.getState();
  validateFaraQuestGraph(map.questProgress, map.questReceipts, FARA_DOMAIN);
  validateQuestItemLedger(useInventoryStore.getState().questItems, map.questProgress, map.questReceipts);
}
/** Ordinary readiness reads accepted caches without recomposing or publishing actors. */
export function faraOrdinaryReady(): boolean {
  try {
    const hero = usePlayerStore.getState().player; assertCountedData(hero);
    return hero !== null && hero.derivedStats.life > 0 && useHydrationStore.getState().status === 'ready' &&
      !isReplacingSave() && !hasActiveSubAreaRun() && !useCombatStore.getState().inCombat;
  } catch { return false; }
}
/** Read-only actor continuity permits independently earned progression and settings. */
export function sameFaraActor(witness: { readonly hero: Player; readonly id: string }): boolean {
  const hero = usePlayerStore.getState().player;
  return hero !== null && hero.id === witness.id && (hero === witness.hero || countedActorContinuity(hero, witness.hero, witness.id));
}
