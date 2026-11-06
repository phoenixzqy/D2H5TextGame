import mainDocument from '@/data/quests/main.json';
import sideDocument from '@/data/quests/side.json';
import itemDocument from '@/data/quests/items.json';
import runtimeDocument from '@/data/quests/cow-runtime.json';
import akaraDocument from '@/data/dialogue/act1/akara.json';
import act1Monsters from '@/data/monsters/act1.json';
import { subAreas } from '@/data';
import { loadQuests } from '@/data/loaders/quests';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { cowRuntime } from '@/data/loaders/cow-runtime';
import { loadTownNpcs } from '@/data/loaders/towns';
import { COW, COW_DOMAIN, validateCowQuestGraph } from '@/engine/map/cow-quest';
import { resolveCowEncounterPlan } from '@/engine/combat/cow-planner';
import { validateQuestItemLedger } from '@/engine/save/validate';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { countedActorContinuity } from './countedQuestRollback';
import { assertCountedData, sameCountedData as sameData, snapshotCountedData } from './countedQuestContract';
import type { Player } from '@/engine/types/entities';

function onlyKeys(value: object, required: readonly string[], optional: readonly string[] = []): boolean {
  return required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key));
}
/** Pin complete authored source/recipe/NPC/roster definitions before any observable publication. */
export function captureCowAuthority() {
  for (const document of [mainDocument, sideDocument, itemDocument, runtimeDocument, akaraDocument, act1Monsters, subAreas]) assertCountedData(document);
  const quests = snapshotCountedData(loadQuests()), items = snapshotCountedData(loadQuestItems());
  const matches = quests.filter(row => row.id === COW.quest), quest = matches[0];
  const leg = items.filter(item => item.id === COW.legItemId), tome = items.filter(item => item.id === COW.tomeItemId);
  const first = quest?.objectives[0], second = quest?.objectives[1], legItem = leg[0], tomeItem = tome[0];
  const runtime = snapshotCountedData(cowRuntime);
  const expectedRuntime = { questId: COW.quest, actId: COW.act, hostAreaId: COW.area, encounterId: COW.encounter,
    victoryReceipt: COW.victoryProof, recipe: { id: COW.recipe, objectiveId: COW.portalObjective,
      requiredTool: { itemId: COW.cubeItemId, source: COW.cubeSource }, inputs: [
        { itemId: COW.legItemId, source: COW.legSource }, { itemId: COW.tomeItemId, source: COW.tomeSource }] },
    actions: { receiveTome: { id: COW.receiveAction, npcId: COW.npc, receiptSource: COW.tomeSource },
      openPortal: { id: COW.openAction, npcId: COW.npc, receiptSource: COW.openProof } } };
  const { $schema: _schema, ...runtimeFields } = runtime as typeof runtime & { readonly $schema?: string };
  if (matches.length !== 1 || !quest || !onlyKeys(quest, ['id', 'name', 'type', 'actId', 'giver', 'description', 'objectives', 'rewards'], ['order']) ||
    quest.type !== 'side' || quest.actId !== COW.act || quest.giver !== COW.npc || quest.objectives.length !== 2 || !first || !second ||
    !onlyKeys(first, ['id', 'type', 'description', 'itemId', 'areaId', 'targetId']) || first.id !== COW.legObjective || first.type !== 'fetch' ||
    first.itemId !== COW.legItemId || first.areaId !== COW.area || first.targetId !== COW.target ||
    !onlyKeys(second, ['id', 'type', 'description', 'recipe']) || second.id !== COW.portalObjective || second.type !== 'transmute' || second.recipe !== COW.recipe ||
    !sameData(quest.rewards, { xp: 6000, wishstones: 10 }) || !sameData(runtimeFields, expectedRuntime) ||
    leg.length !== 1 || tome.length !== 1 || !legItem || !tomeItem ||
    !onlyKeys(legItem, ['id', 'kind', 'sourceQuestId', 'sourceObjectiveId', 'consumeActionId', 'requiresAreaClear', 'nameKey', 'descKey']) ||
    legItem.kind !== 'portalIngredient' || legItem.sourceQuestId !== COW.quest || !sameData(legItem.sourceObjectiveId, COW.legObjective) ||
    !sameData(legItem.consumeActionId, COW.openAction) || !sameData(legItem.requiresAreaClear, true) || questItemSource(legItem) !== COW.legSource ||
    !onlyKeys(tomeItem, ['id', 'kind', 'sourceQuestId', 'sourceActionId', 'consumeActionId', 'nameKey', 'descKey']) ||
    tomeItem.kind !== 'portalIngredient' || tomeItem.sourceQuestId !== COW.quest || !sameData(tomeItem.sourceActionId, COW.receiveAction) ||
    !sameData(tomeItem.consumeActionId, COW.openAction) || questItemSource(tomeItem) !== COW.tomeSource ||
    loadTownNpcs(1).filter(npc => npc.id === COW.npc).length !== 1) throw new Error('Cow exact authored source authority changed');
  const areas = subAreas.filter(area => area.id === COW.area), area = areas[0];
  if (areas.length !== 1 || !area) throw new Error('Cow exact host missing');
  resolveCowEncounterPlan({ subArea: area, encounterId: COW.encounter, seed: 0 });
  for (const [id, templateId] of [[COW.king, 'monsters/act1.treehead-woodfist'], [COW.bovine, 'monsters/act1.brute']]) {
    const copies = act1Monsters.filter(monster => monster.id === id), templates = act1Monsters.filter(monster => monster.id === templateId);
    const copy = copies[0], template = templates[0];
    if (copies.length !== 1 || templates.length !== 1 || !copy || !template) throw new Error('Cow exact monster missing');
    const { id: _copyId, name: copyName, ...copyFields } = copy, { id: _templateId, name: _templateName, ...templateFields } = template;
    if (!copyName || !sameData(copyFields, templateFields)) throw new Error('Cow template clone changed');
  }
  return snapshotCountedData({ quest, legItem, tomeItem, runtime, area, monsters: act1Monsters.filter(row =>
    [COW.king, COW.bovine, 'monsters/act1.treehead-woodfist', 'monsters/act1.brute'].includes(row.id)), dialogue: akaraDocument });
}
export function sameCowAuthority(before: ReturnType<typeof captureCowAuthority>): boolean {
  try { return sameData(captureCowAuthority(), before); } catch { return false; }
}
/** Validate the finite graph and existing reciprocal ledger at every ordinary boundary. */
export function validateLiveCowGraph(): void {
  const map = useMapStore.getState(), items = useInventoryStore.getState().questItems;
  validateCowQuestGraph(map.questProgress, items, map.questReceipts, COW_DOMAIN);
  validateQuestItemLedger(items, map.questProgress, map.questReceipts);
}
/** Read accepted caches without recomposition; actions require a living ready actual hero. */
export function cowOrdinaryReady(): boolean {
  try {
    const hero = usePlayerStore.getState().player; assertCountedData(hero);
    return hero !== null && hero.derivedStats.life > 0 && useHydrationStore.getState().status === 'ready' && !isReplacingSave() &&
      !hasActiveSubAreaRun() && !useCombatStore.getState().inCombat;
  } catch { return false; }
}
export function sameCowActor(witness: { readonly hero: Player; readonly id: string }): boolean {
  const hero = usePlayerStore.getState().player;
  return hero !== null && hero.id === witness.id && (hero === witness.hero || countedActorContinuity(hero, witness.hero, witness.id));
}
