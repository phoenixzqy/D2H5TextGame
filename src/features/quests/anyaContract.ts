import Ajv2020 from 'ajv/dist/2020';
import mainDocument from '@/data/quests/main.json';
import sideDocument from '@/data/quests/side.json';
import { compileAuthoredValidator } from '@/data/authored-validators';
import type { DialogueDoc } from '@/data/loaders/dialogue';
import { dialogues } from '@/data';
import { loadQuests } from '@/data/loaders/quests';
import { loadTownNpcs } from '@/data/loaders/towns';
import { ANYA, ANYA_DOMAIN, validateAnyaQuestGraph } from '@/engine/map/anya-quest';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { validateNative24CurrentCampaignRewards } from '@/engine/save/current-campaign';
import type { QuestActionReceipts, QuestItemLedger, QuestProgressData } from '@/engine/types/save';
import type { QuestServiceLedger } from '@/engine/services/quest-services';
import type { Player } from '@/engine/types/entities';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { countedActorContinuity } from './countedQuestRollback';
import { assertCountedData, sameCountedData, snapshotCountedData } from './countedQuestContract';

const validateDialogue = compileAuthoredValidator<DialogueDoc>(new Ajv2020({ strict: true, allErrors: true }), 'dialogue');
function onlyKeys(value: object, required: readonly string[], optional: readonly string[] = []): boolean {
  return required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key));
}
/** Pin complete side rewards, actual canonical dialogue/NPC and the unchanged Prison objective source. */
export function captureAnyaAuthority() {
  assertCountedData(mainDocument); assertCountedData(sideDocument); assertCountedData(dialogues);
  const quests = snapshotCountedData(loadQuests()), candidates = snapshotCountedData(dialogues).filter(doc => doc.id === ANYA.dialogueId);
  const matches = quests.filter(row => row.id === ANYA.quest), mains = quests.filter(row => row.id === ANYA.prerequisite.quest);
  const quest = matches[0], main = mains[0], objective = quest?.objectives[0], dialogue = candidates[0];
  const mainObjectives = main?.objectives.map(({ description: _description, ...identity }) => identity);
  const npcs = snapshotCountedData(loadTownNpcs(5)).filter(npc => npc.id === ANYA.npc);
  if (matches.length !== 1 || mains.length !== 1 || candidates.length !== 1 || npcs.length !== 1 || !quest || !main || !objective || !dialogue ||
    !onlyKeys(quest, ['id', 'name', 'type', 'actId', 'giver', 'description', 'objectives', 'rewards', 'prerequisites'], ['order']) ||
    quest.type !== 'side' || quest.actId !== ANYA.actId || quest.giver !== ANYA.npc || quest.objectives.length !== 1 ||
    !onlyKeys(objective, ['id', 'type', 'npcId', 'description']) || objective.id !== ANYA.objective || objective.type !== 'talk' || objective.npcId !== ANYA.npc ||
    !sameCountedData(quest.prerequisites, [ANYA.prerequisite.quest]) ||
    !sameCountedData(quest.rewards, { stat: { all_resist: 10 }, service: 'personalize_item', vendorUnlock: ANYA.vendorId, wishstones: 10 }) ||
    main.type !== 'main' || main.actId !== ANYA.actId || main.giver !== 'npc/malah' ||
    !sameCountedData(mainObjectives, [
      { id: 'obj-find-anya', type: 'interact', targetId: 'objects/frozen_anya', areaId: 'areas/act5-crystalline-passage' },
      { id: 'obj-thaw', type: 'use-item', itemId: 'quest/malahs_potion' },
      { id: 'obj-kill-nihlathak', type: 'kill', targetId: 'monsters/act5.warped-shaman', areaId: 'areas/act5-crystalline-passage' }
    ]) || !validateDialogue(dialogue) || !onlyKeys(dialogue, ['id', 'npcId', 'greetings', 'services']) ||
    dialogue.npcId !== 'anya' || dialogue.services.length !== 0 || dialogue.greetings.length < 1 ||
    !dialogue.greetings.every(greeting => greeting.text.length > 0 && greeting.textKey === ANYA.greetingKey)) {
    throw new Error('Anya exact authored authority changed');
  }
  return { quest, prerequisite: main, dialogue, npc: npcs[0] };
}
/** Retained authority must remain identical through every observable write. */
export function sameAnyaAuthority(before: ReturnType<typeof captureAnyaAuthority>): boolean {
  try { return sameCountedData(captureAnyaAuthority(), before); } catch { return false; }
}
/** Validate actual source, services and earned profile; prospective publishers supply coherent owned rows. */
export function validateAnyaState(progress: Readonly<Record<string, QuestProgressData>>, items: QuestItemLedger,
  receipts: QuestActionReceipts, services: QuestServiceLedger): void {
  assertCountedData({ progress, items, receipts, services });
  validateAnyaQuestGraph(progress, items, receipts, services, ANYA_DOMAIN);
  validateQuestItemLedger(items, progress, receipts);
  const map = useMapStore.getState();
  validateNative24CurrentCampaignRewards({ ...map, questProgress: progress, questReceipts: receipts }, items, services, map.endgame);
}
/** Complete live graph validation never snapshots stores while the caller owns its lease. */
export function validateLiveAnyaGraph(): void {
  const map = useMapStore.getState(), inv = useInventoryStore.getState();
  validateAnyaState(map.questProgress, inv.questItems, map.questReceipts, inv.questServices);
}
/** Accepted actor caches are inspected without normalization or zero-XP publication. */
export function anyaOrdinaryReady(): boolean {
  try {
    const hero = usePlayerStore.getState().player; assertCountedData(hero);
    return hero !== null && hero.derivedStats.life > 0 && useHydrationStore.getState().status === 'ready' &&
      !isReplacingSave() && !hasActiveSubAreaRun() && !useCombatStore.getState().inCombat;
  } catch { return false; }
}
/** Continuous actual actor identity permits independent legitimate progression and damage. */
export function sameAnyaActor(witness: { readonly hero: Player; readonly id: string }): boolean {
  const hero = usePlayerStore.getState().player;
  return hero !== null && hero.id === witness.id && (hero === witness.hero || countedActorContinuity(hero, witness.hero, witness.id));
}
/** Current unlocked Act V town presence; remembered field selection is not a town restriction. */
export function anyaTownReady(): boolean {
  const map = useMapStore.getState();
  return anyaOrdinaryReady() && map.currentAct === 5 && map.isActUnlocked(5) && loadTownNpcs(5).filter(npc => npc.id === ANYA.npc).length === 1;
}
