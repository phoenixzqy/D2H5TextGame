import { loadMercHireRoster, loadMercPool, type MercDef } from '@/data/loaders/mercs';
import { loadQuests, type QuestDef } from '@/data/loaders/quests';
import { loadTownNpcs } from '@/data/loaders/towns';
import { TOWN_ENLISTMENTS, hasTownEnlistmentPrerequisite, type TownEnlistmentKey } from '@/engine/map/town-enlistment-quest';
import type { Mercenary } from '@/engine/types/entities';
import { sameCainData as sameData } from '@/features/quests/cainPublication';
import { questActionPreflight, withQuestTransaction } from '@/features/quests/questTransaction';
import { hasCanonicalTownEnlistment, ordinaryTownEnlistmentContext, publishTownEnlistmentChange, validTownEnlistmentSource } from '@/features/quests/townEnlistmentPublication';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore, type MercEquipment } from '@/stores/mercStore';
import { createMercFromDef } from '@/stores/mercFactory';
import { usePlayerStore } from '@/stores/playerStore';

type Hero = NonNullable<ReturnType<typeof usePlayerStore.getState>['player']>;
type Progress = ReturnType<typeof useMercStore.getState>['mercProgress'][string];
/** An actual selection is a short-lived witness, never durable enlistment proof. */
export interface TownEnlistmentSelection {
  readonly key: TownEnlistmentKey;
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
/** Verified restoration failure throws AggregateError while the quest lease is held. */
export type TownEnlistmentResult = 'ok' | 'not-eligible' | 'not-ready' | 'no-player' | 'combat-active' | 'claim-in-progress' | 'grant-failed';
function definition(key: TownEnlistmentKey) { return loadMercPool().pool.find(row => row.id === TOWN_ENLISTMENTS[key].mercId); }
function quest(key: TownEnlistmentKey) { return loadQuests().find(row => row.id === TOWN_ENLISTMENTS[key].quest); }
function context(key: TownEnlistmentKey): boolean {
  const c = TOWN_ENLISTMENTS[key], map = useMapStore.getState(), hero = usePlayerStore.getState().player;
  const act = Number(c.actId.slice('acts/act'.length)), gate = loadMercHireRoster().find(row => row.act === act);
  return ordinaryTownEnlistmentContext() && !!hero && !!gate && hero.level >= gate.unlockReqLevel
    && map.currentAct === act && map.isActUnlocked(act) && loadTownNpcs(act).some(npc => npc.id === c.npc)
    && hasCanonicalTownEnlistment(key);
}
/** Only explicit confirmation at the current unlocked captain can earn the finite proof. */
export function canEnlistTownMercenary(key: TownEnlistmentKey): boolean {
  if (!Object.hasOwn(TOWN_ENLISTMENTS, key) || !context(key) || !validTownEnlistmentSource()) return false;
  const c = TOWN_ENLISTMENTS[key], map = useMapStore.getState();
  const row = Object.hasOwn(map.questProgress, c.quest) ? map.questProgress[c.quest] : undefined;
  return !!row && row.id === c.quest && row.rewardClaimed !== true && Object.keys(row.objectives).length === 1
    && Object.hasOwn(row.objectives, c.objective) && typeof row.objectives[c.objective] === 'boolean'
    && (row.status === 'inProgress' || row.status === 'completed' && row.objectives[c.objective] === true)
    && !Object.hasOwn(map.questReceipts, c.proof) && hasTownEnlistmentPrerequisite(map.questProgress, c);
}
/** Match exact base identities while keeping every actual suffixed instance. */
export function townEnlistmentCandidates(key: TownEnlistmentKey): readonly Mercenary[] {
  return canEnlistTownMercenary(key) ? useMercStore.getState().ownedMercs.filter(row => row.id.split('#')[0] === TOWN_ENLISTMENTS[key].mercId) : [];
}
/** Null explicitly selects a new factory recruit only when no match is owned. */
export function selectTownEnlistmentRecruit(key: TownEnlistmentKey, merc: Mercenary | null): TownEnlistmentSelection | null {
  if (!canEnlistTownMercenary(key)) return null;
  const hero = usePlayerStore.getState().player, def = definition(key), source = quest(key), state = useMercStore.getState();
  if (!hero || !def || !source) return null;
  const candidates = townEnlistmentCandidates(key);
  if (new Set(state.ownedMercs.map(row => row.id)).size !== state.ownedMercs.length ||
    state.fieldedMercId !== null && !state.ownedMercs.some(row => row.id === state.fieldedMercId) ||
    (merc ? !candidates.includes(merc) : candidates.length > 0) ||
    !merc && (Object.hasOwn(state.mercEquipment, def.id) || Object.hasOwn(state.mercProgress, def.id))) return null;
  return { key, kind: merc ? 'owned' : 'fresh', hero, heroBefore: structuredClone(hero), merc, mercBefore: structuredClone(merc),
    equipmentBefore: merc ? structuredClone(state.mercEquipment[merc.id]) : undefined,
    progressBefore: merc ? structuredClone(state.mercProgress[merc.id]) : undefined,
    equipmentPresent: !!merc && Object.hasOwn(state.mercEquipment, merc.id), progressPresent: !!merc && Object.hasOwn(state.mercProgress, merc.id),
    definitionBefore: structuredClone(def), questBefore: structuredClone(source) };
}
/** A replaced or deeply mutated witness must be selected again explicitly. */
export function isCurrentTownEnlistmentSelection(key: TownEnlistmentKey, selection: TownEnlistmentSelection | null): boolean {
  if (!selection || selection.key !== key || !canEnlistTownMercenary(key) || usePlayerStore.getState().player !== selection.hero
    || !sameData(selection.hero, selection.heroBefore) || !sameData(definition(key), selection.definitionBefore)
    || !sameData(quest(key), selection.questBefore)) return false;
  const state = useMercStore.getState(), candidates = townEnlistmentCandidates(key), merc = selection.merc;
  if (new Set(state.ownedMercs.map(row => row.id)).size !== state.ownedMercs.length ||
    state.fieldedMercId !== null && !state.ownedMercs.some(row => row.id === state.fieldedMercId)) return false;
  return selection.kind === 'fresh' ? merc === null && candidates.length === 0 && !Object.hasOwn(state.mercEquipment, selection.definitionBefore.id)
    && !Object.hasOwn(state.mercProgress, selection.definitionBefore.id)
    : !!merc && candidates.includes(merc) && sameData(merc, selection.mercBefore)
      && Object.hasOwn(state.mercEquipment, merc.id) === selection.equipmentPresent && Object.hasOwn(state.mercProgress, merc.id) === selection.progressPresent
      && sameData(state.mercEquipment[merc.id], selection.equipmentBefore) && sameData(state.mercProgress[merc.id], selection.progressBefore);
}
/** Resolve only the retained actual instance; fresh preview uses its definition. */
export function currentTownEnlistmentRecruit(key: TownEnlistmentKey, selection: TownEnlistmentSelection | null): Mercenary | null {
  return isCurrentTownEnlistmentSelection(key, selection) ? selection?.merc ?? null : null;
}
/** Free explicit Enlist fields the chosen actual ID and publishes only side/proof. */
export function enlistTownMercenary(key: TownEnlistmentKey, selection: TownEnlistmentSelection | null): TownEnlistmentResult {
  const refusal = questActionPreflight(); if (refusal) return refusal;
  return withQuestTransaction<TownEnlistmentResult>(() => {
    if (!isCurrentTownEnlistmentSelection(key, selection) || !selection) return 'not-eligible';
    const recruit = selection.kind === 'fresh' ? createMercFromDef(selection.definitionBefore) : null;
    return publishTownEnlistmentChange({ key, kind: 'enlist', recruit, selected: selection.merc,
      context: () => context(key) && sameData(definition(key), selection.definitionBefore) && sameData(quest(key), selection.questBefore) });
  });
}
