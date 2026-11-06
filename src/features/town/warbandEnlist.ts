import { loadMercPool, type MercDef } from '@/data/loaders/mercs';
import { loadQuests, type QuestDef } from '@/data/loaders/quests';
import { loadTownNpcs } from '@/data/loaders/towns';
import { WARBAND } from '@/engine/map/warband-quest';
import { hasAct5Completion } from '@/engine/save/act5-state';
import type { Mercenary } from '@/engine/types/entities';
import { sameCainData as sameData } from '@/features/quests/cainPublication';
import { questActionPreflight, withQuestTransaction } from '@/features/quests/questTransaction';
import { hasCanonicalWarbandDefinition, publishWarbandChange, validWarbandSource } from '@/features/quests/warbandPublication';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, type MercEquipment } from '@/stores/mercStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { usePlayerStore } from '@/stores/playerStore';

type Hero = NonNullable<ReturnType<typeof usePlayerStore.getState>['player']>;
type Progress = ReturnType<typeof useMercStore.getState>['mercProgress'][string];
/** Selection retains references and deep data; it grants no durable enlistment authority. */
export interface WarbandEnlistSelection {
  readonly kind: 'fresh' | 'owned';
  readonly hero: Hero;
  readonly heroBefore: Hero;
  readonly merc: Mercenary | null;
  readonly mercBefore: Mercenary | null;
  readonly equipmentBefore: MercEquipment | undefined;
  readonly progressBefore: Progress | undefined;
  readonly equipmentPresent: boolean;
  readonly progressPresent: boolean;
  readonly definitionBefore: MercDef;
  readonly questBefore: QuestDef;
}
/** Failed verified restoration throws AggregateError instead of a safe refusal. */
export type WarbandEnlistResult = 'ok' | 'not-eligible' | 'not-ready' | 'no-player' | 'combat-active' | 'claim-in-progress' | 'grant-failed';
function ready(): boolean {
  return useHydrationStore.getState().status === 'ready' && !isReplacingSave()
    && !!usePlayerStore.getState().player && !hasActiveSubAreaRun() && !useCombatStore.getState().inCombat;
}
function definition() { return loadMercPool().pool.find(row => row.id === WARBAND.mercId); }
function quest() { return loadQuests().find(row => row.id === WARBAND.quest); }
function context(): boolean {
  const map = useMapStore.getState(), hero = usePlayerStore.getState().player;
  return ready() && !!hero && hero.level >= 35 && map.currentAct === 5 && map.selectedDifficulty === 'normal'
    && map.isActUnlocked(5) && loadTownNpcs(5).some(npc => npc.id === WARBAND.npc) && hasCanonicalWarbandDefinition();
}
/** Current-town qualified Rescue and exact tracked unclaimed side row; ownership alone earns nothing. */
export function canEnlistWarband(): boolean {
  if (!context() || !validWarbandSource()) return false;
  const map = useMapStore.getState(), row = Object.hasOwn(map.questProgress, WARBAND.quest) ? map.questProgress[WARBAND.quest] : undefined;
  return !!row && row.id === WARBAND.quest && row.rewardClaimed !== true && Object.keys(row.objectives).length === 1
    && Object.hasOwn(row.objectives, WARBAND.objective) && typeof row.objectives[WARBAND.objective] === 'boolean'
    && (row.status === 'inProgress' || row.status === 'completed' && row.objectives[WARBAND.objective] === true)
    && !Object.hasOwn(map.questReceipts, WARBAND.proof)
    && hasAct5Completion(WARBAND.prerequisite, map.questProgress, map.questReceipts, useInventoryStore.getState().questItems);
}
/** Return actual matching instances, preserving suffixed IDs and historical multiplicity. */
export function warbandEnlistCandidates(): readonly Mercenary[] {
  return canEnlistWarband() ? useMercStore.getState().ownedMercs.filter(merc => merc.id.split('#')[0] === WARBAND.mercId) : [];
}
/** Null explicitly selects a fresh recruit only when no matching instance is owned. */
export function selectWarbandRecruit(merc: Mercenary | null): WarbandEnlistSelection | null {
  const hero = usePlayerStore.getState().player, def = definition(), source = quest();
  if (!hero || !def || !source || !canEnlistWarband()) return null;
  const state = useMercStore.getState(), candidates = warbandEnlistCandidates();
  if (new Set(state.ownedMercs.map(row => row.id)).size !== state.ownedMercs.length ||
    (merc ? !candidates.includes(merc) : candidates.length > 0) ||
    !merc && (Object.hasOwn(state.mercEquipment, WARBAND.mercId) || Object.hasOwn(state.mercProgress, WARBAND.mercId))) return null;
  return { kind: merc ? 'owned' : 'fresh', hero, heroBefore: structuredClone(hero), merc, mercBefore: structuredClone(merc),
    equipmentBefore: merc ? structuredClone(state.mercEquipment[merc.id]) : undefined,
    progressBefore: merc ? structuredClone(state.mercProgress[merc.id]) : undefined,
    equipmentPresent: !!merc && Object.hasOwn(state.mercEquipment, merc.id), progressPresent: !!merc && Object.hasOwn(state.mercProgress, merc.id),
    definitionBefore: structuredClone(def), questBefore: structuredClone(source) };
}
/** Resolve the retained witness without refreshing a replaced/mutated instance or definition. */
export function isCurrentWarbandSelection(selection: WarbandEnlistSelection | null): boolean {
  if (!selection || !canEnlistWarband() || usePlayerStore.getState().player !== selection.hero || !sameData(selection.hero, selection.heroBefore)
    || !sameData(definition(), selection.definitionBefore) || !sameData(quest(), selection.questBefore)) return false;
  const state = useMercStore.getState(), candidates = warbandEnlistCandidates(), merc = selection.merc;
  if (new Set(state.ownedMercs.map(row => row.id)).size !== state.ownedMercs.length) return false;
  return selection.kind === 'fresh' ? merc === null && candidates.length === 0 && !Object.hasOwn(state.mercEquipment, WARBAND.mercId)
    && !Object.hasOwn(state.mercProgress, WARBAND.mercId)
    : !!merc && candidates.includes(merc) && sameData(merc, selection.mercBefore)
      && Object.hasOwn(state.mercEquipment, merc.id) === selection.equipmentPresent && Object.hasOwn(state.mercProgress, merc.id) === selection.progressPresent
      && sameData(state.mercEquipment[merc.id], selection.equipmentBefore) && sameData(state.mercProgress[merc.id], selection.progressBefore);
}
/** Owned preview resolves only the actual retained instance; fresh preview uses its definition. */
export function currentWarbandRecruit(selection: WarbandEnlistSelection | null): Mercenary | null {
  return isCurrentWarbandSelection(selection) ? selection?.merc ?? null : null;
}
/** Explicit free enlistment fields the chosen actual ID, then publishes completion/proof only. */
export function enlistWarband(selection: WarbandEnlistSelection | null): WarbandEnlistResult {
  const refusal = questActionPreflight(); if (refusal) return refusal;
  return withQuestTransaction<WarbandEnlistResult>(() => {
    if (!selection || !isCurrentWarbandSelection(selection)) return 'not-eligible';
    const recruit = selection.kind === 'fresh' ? createMercFromDef(selection.definitionBefore) : null;
    return publishWarbandChange({ kind: 'enlist', recruit, fieldedId: selection.merc?.id ?? recruit?.id ?? null,
      context: () => context() && sameData(definition(), selection.definitionBefore) && sameData(quest(), selection.questBefore) });
  });
}
