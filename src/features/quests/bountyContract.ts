import mainDocument from '@/data/quests/main.json';
import sideDocument from '@/data/quests/side.json';
import { loadQuests } from '@/data/loaders/quests';
import { REGIONAL_BOUNTY_DOMAIN, validateRegionalBountyGraph } from '@/engine/map/regional-bounties';
import { validateQuestItemLedger } from '@/engine/save/validate';
import type { Player } from '@/engine/types/entities';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { assertCountedData, sameCountedData, snapshotCountedData } from './countedQuestContract';
import { countedActorContinuity } from './countedQuestRollback';

function exact(value: object, required: readonly string[], optional: readonly string[] = []): boolean {
  return required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key));
}
/** Pin all five complete loaded templates; malformed finite rows cannot use generic rewards. */
export function captureBountyAuthority() {
  assertCountedData(mainDocument); assertCountedData(sideDocument);
  const quests = snapshotCountedData(loadQuests());
  const bounties = quests.filter(quest => quest.type === 'bounty');
  if (bounties.length !== REGIONAL_BOUNTY_DOMAIN.length) throw new Error('Regional bounty template set changed');
  for (const definition of REGIONAL_BOUNTY_DOMAIN) {
    const matches = bounties.filter(quest => quest.id === definition.quest), quest = matches[0], objective = quest?.objectives[0];
    if (matches.length !== 1 || !quest || !objective ||
      !exact(quest, ['id', 'name', 'type', 'actId', 'description', 'objectives', 'rewards'], ['order']) ||
      quest.type !== 'bounty' || quest.actId !== definition.actId || quest.objectives.length !== 1 ||
      !exact(objective, ['id', 'type', 'description', 'areaId', 'count']) || objective.id !== definition.objective ||
      objective.type !== 'clear-area' || objective.areaId !== definition.area || objective.count !== 1 ||
      !sameCountedData(quest.rewards, { gemShards: 1 })) throw new Error('Regional bounty exact authored authority changed');
  }
  return bounties;
}
/** Canonical authoring must remain unchanged after each observable publication. */
export function sameBountyAuthority(before: ReturnType<typeof captureBountyAuthority>): boolean {
  try { return sameCountedData(captureBountyAuthority(), before); } catch { return false; }
}
/** Validate only the finite bounty graph plus the existing live quest-item contract. */
export function validateLiveBountyGraph(): void {
  const map = useMapStore.getState();
  validateRegionalBountyGraph(map.questProgress, map.bounties, REGIONAL_BOUNTY_DOMAIN);
  validateQuestItemLedger(useInventoryStore.getState().questItems, map.questProgress, map.questReceipts);
}
/** Ordinary input readiness reads accepted actors without normalizing or publishing them. */
export function bountyOrdinaryReady(): boolean {
  try {
    const hero = usePlayerStore.getState().player; assertCountedData(hero);
    return hero !== null && hero.derivedStats.life > 0 && useHydrationStore.getState().status === 'ready' &&
      !isReplacingSave() && !hasActiveSubAreaRun() && !useCombatStore.getState().inCombat;
  } catch { return false; }
}
/** Actor continuity permits independent progression without an owned actor snapshot. */
export function sameBountyActor(witness: { readonly hero: Player; readonly id: string }): boolean {
  const hero = usePlayerStore.getState().player;
  return hero !== null && hero.id === witness.id && (hero === witness.hero || countedActorContinuity(hero, witness.hero, witness.id));
}
