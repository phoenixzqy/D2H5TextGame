import { loadAffixPool, loadItemBases, loadRarityAffixRules } from '@/data/loaders/loot';
import { loadTownNpcs } from '@/data/loaders/towns';
import { effectiveSocketCapacity } from '@/engine/items/socket-capacity';
import { validateCanonicalSocketItem } from '@/engine/items/socket-contents';
import { prepareRareAffixes } from '@/engine/loot/rollItem';
import { ACT1_IMBUE_SOURCES, ACT1_QUEST_RECEIPTS } from '@/engine/map/act1-quest-sources';
import { MALUS_QUEST, MALUS_SIDE_QUEST, MALUS_SOURCE, hasMalusHandIn, hasMalusCompletion } from '@/engine/map/malus-quest';
import { createRng, hashSeed } from '@/engine/rng';
import { validateNative24CurrentCampaignRewards } from '@/engine/save/current-campaign';
import { validateQuestItemLedger } from '@/engine/save/validate';
import type { QuestServiceEntry } from '@/engine/services/quest-services';
import type { Item } from '@/engine/types/items';
import { pick, replace, sameCainData } from '@/features/quests/cainPublication';
import { questActionPreflight, withQuestTransaction } from '@/features/quests/questTransaction';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { useCombatStore } from '@/stores/combatStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { usePlayerStore } from '@/stores/playerStore';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { resolveIronGolemSelection } from '@/stores/ironGolemSelection';
import { WaveGuardError } from '@/stores/waveTransitionGuard';

type Hero = NonNullable<ReturnType<typeof usePlayerStore.getState>['player']>;
type Source = typeof ACT1_IMBUE_SOURCES[keyof typeof ACT1_IMBUE_SOURCES];
const QUESTS = [MALUS_QUEST, MALUS_SIDE_QUEST];
const SOURCES = Object.values(ACT1_IMBUE_SOURCES);
const RECEIPTS = [ACT1_QUEST_RECEIPTS.presentItem];
/** Actual displayed hero/item and deep preimages; never persisted authority. */
export interface CharsiPresentSelection {
  readonly hero: Hero;
  readonly heroBefore: Hero;
  readonly item: Item;
  readonly itemBefore: Item;
}
/** An Imbue selection additionally witnesses one actual available source entry. */
export interface CharsiImbueSelection extends CharsiPresentSelection {
  readonly source: Source;
  readonly entry: QuestServiceEntry;
  readonly entryBefore: QuestServiceEntry;
}
/** Explicit outcomes; a failed verified restoration throws AggregateError. */
export type CharsiImbueResult = 'ok' | 'not-eligible' | 'not-ready' | 'no-player' | 'combat-active'
  | 'claim-in-progress' | 'already-available' | 'already-consumed' | 'grant-failed';
function isSource(source: string): source is Source { return SOURCES.some(value => value === source); }
function questFor(source: Source): string { return source === ACT1_IMBUE_SOURCES.main ? MALUS_QUEST : MALUS_SIDE_QUEST; }
function readiness(): 'not-ready' | 'no-player' | 'combat-active' | null {
  if (useHydrationStore.getState().status !== 'ready' || isReplacingSave()) return 'not-ready';
  if (!usePlayerStore.getState().player) return 'no-player';
  return hasActiveSubAreaRun() || useCombatStore.getState().inCombat ? 'combat-active' : null;
}
function atCharsi(normalOnly = false): boolean {
  const map = useMapStore.getState();
  const difficulty: unknown = map.selectedDifficulty;
  return map.currentAct === 1 && map.isActUnlocked(1) && loadTownNpcs(1).some(npc => npc.id === 'npc/charsi')
    && (difficulty === 'normal' || !normalOnly && difficulty === 'nightmare' && map.questDifficulties['difficulty/nightmare'] === true);
}
function graph(): boolean {
  const map = useMapStore.getState(), inv = useInventoryStore.getState();
  try {
    validateQuestItemLedger(inv.questItems, map.questProgress, map.questReceipts);
    validateNative24CurrentCampaignRewards(map, inv.questItems, inv.questServices, map.endgame);
    return true;
  } catch { return false; }
}
function actualItem(id: string): Item | undefined {
  const inv = useInventoryStore.getState(), hero = usePlayerStore.getState().player, mercs = useMercStore.getState();
  const result = resolveIronGolemSelection(hero?.id ?? null, hero ? { heroId: hero.id, itemId: id } : null,
    { ...inv, mercEquipment: mercs.mercEquipment });
  return result.ok && !inv.legacyGearQuarantine.some(row => row.item.id === id)
    && !inv.socketQuarantine.some(row => row.item.id === id)
    && !hero?.equipment.some(row => row.id === id) && !mercs.ownedMercs.some(merc => merc.equipment.some(row => row.id === id))
    ? result.item : undefined;
}
function locations(): readonly (Item | null | undefined)[] {
  const inv = useInventoryStore.getState(), mercs = useMercStore.getState();
  return [...inv.backpack, ...inv.stash, ...Object.values(inv.equipped),
    ...inv.legacyGearQuarantine.map(row => row.item), ...inv.socketQuarantine.map(row => row.item),
    ...Object.values(mercs.mercEquipment).flatMap(gear => Object.values(gear)),
    ...mercs.ownedMercs.flatMap(merc => merc.equipment), ...(usePlayerStore.getState().player?.equipment ?? [])];
}
function eligible(item: Item): boolean {
  const base = loadItemBases().get(item.baseId), level = item.ilvl ?? item.level;
  const equipped: unknown = item.equipped, identified: unknown = item.identified;
  if (!base || !base.canHaveAffixes || base.type !== 'weapon' && base.type !== 'armor'
    || typeof item.id !== 'string' || !item.id || equipped !== false || identified !== true || item.rarity !== 'normal'
    || !Number.isSafeInteger(item.level) || item.level < 1 || !Number.isSafeInteger(level) || level < 1
    || 'uniqueId' in item || 'setId' in item || 'setPieceId' in item || 'runewordId' in item
    || item.affixes !== undefined && (!Array.isArray(item.affixes) || item.affixes.length !== 0)) return false;
  try { validateCanonicalSocketItem(item, base); return effectiveSocketCapacity(item, base) === 0; }
  catch { return false; }
}
/** Eligible actual backpack gear; wearing requirements are deliberately irrelevant. */
export function charsiImbueCandidates(): readonly Item[] {
  return readiness() === null && atCharsi() && graph()
    ? useInventoryStore.getState().backpack.filter(item => actualItem(item.id) === item && eligible(item)) : [];
}
/** Normal-only Present requires an actual main hand-in and a canonical tracked side row. */
export function canPresentCharsiItem(): boolean {
  const map = useMapStore.getState(), inv = useInventoryStore.getState(), row = map.questProgress[MALUS_SIDE_QUEST];
  return readiness() === null && atCharsi(true) && graph() && Object.hasOwn(map.questProgress, MALUS_SIDE_QUEST)
    && row?.id === MALUS_SIDE_QUEST && (row.status === 'inProgress' && row.rewardClaimed !== true || row.status === 'completed')
    && hasMalusHandIn(map.questProgress, inv.questItems) && !Object.hasOwn(map.questReceipts, ACT1_QUEST_RECEIPTS.presentItem);
}
function available(source: string): source is Source {
  if (!isSource(source) || readiness() !== null || !atCharsi() || !graph()) return false;
  const map = useMapStore.getState(), inv = useInventoryStore.getState();
  return Object.hasOwn(inv.questServices, source) && inv.questServices[source]?.state === 'available'
    && hasMalusCompletion(questFor(source), map.questProgress, inv.questItems, map.questReceipts);
}
/** One independently earned source offered at the current Charsi. */
export interface CharsiImbueSource {
  readonly source: Source;
  readonly state: 'available' | 'consumed' | 'restorable';
}
/** Discover only validated available, consumed or explicitly restorable sources. */
export function charsiImbueSources(): readonly CharsiImbueSource[] {
  if (readiness() !== null || !atCharsi() || !graph()) return [];
  const inv = useInventoryStore.getState();
  return SOURCES.flatMap<CharsiImbueSource>(source => {
    if (!sourceClaim(source)) return [];
    const entry = inv.questServices[source];
    if (Object.hasOwn(inv.questServices, source) && entry) return [{ source, state: entry.state }];
    return atCharsi(true) ? [{ source, state: 'restorable' as const }] : [];
  });
}
function sourceClaim(source: Source): boolean {
  const map = useMapStore.getState(), inv = useInventoryStore.getState(), quest = questFor(source);
  return map.questProgress[quest]?.rewardClaimed === true
    && hasMalusCompletion(quest, map.questProgress, inv.questItems, map.questReceipts);
}
/** Capture one actual Present item without replacing a detached same-ID lookalike. */
export function selectCharsiPresentItem(item: Item): CharsiPresentSelection | null {
  const hero = usePlayerStore.getState().player;
  return hero && canPresentCharsiItem() && actualItem(item.id) === item && eligible(item)
    ? { hero, heroBefore: structuredClone(hero), item, itemBefore: structuredClone(item) } : null;
}
/** Capture actual hero, item and independent available source entry references/preimages. */
export function selectCharsiImbueItem(source: string, item: Item): CharsiImbueSelection | null {
  const hero = usePlayerStore.getState().player, entry = useInventoryStore.getState().questServices[source];
  return hero && entry && available(source) && actualItem(item.id) === item && eligible(item)
    ? { hero, heroBefore: structuredClone(hero), item, itemBefore: structuredClone(item), source, entry, entryBefore: structuredClone(entry) } : null;
}
function currentItem(selection: CharsiPresentSelection | null): Item | null {
  if (!selection || usePlayerStore.getState().player !== selection.hero || !sameCainData(selection.hero, selection.heroBefore)
    || actualItem(selection.item.id) !== selection.item || !sameCainData(selection.item, selection.itemBefore) || !eligible(selection.item)) return null;
  return selection.item;
}
/** Resolve the existing Present witness without silently refreshing it. */
export function currentCharsiPresentItem(selection: CharsiPresentSelection | null): Item | null {
  return canPresentCharsiItem() ? currentItem(selection) : null;
}
/** Resolve the displayed source/item witness; equal replacement objects are stale. */
export function currentCharsiImbueItem(selection: CharsiImbueSelection | null): Item | null {
  return selection && available(selection.source) && useInventoryStore.getState().questServices[selection.source] === selection.entry
    && sameCainData(selection.entry, selection.entryBefore) ? currentItem(selection) : null;
}

type Progress = ReturnType<typeof useMapStore.getState>['questProgress'];
type Receipts = ReturnType<typeof useMapStore.getState>['questReceipts'];
type Services = ReturnType<typeof useInventoryStore.getState>['questServices'];
/** Finite publication shared only by these three Charsi operations, inside their lease. */
function publish(next: { rows?: Progress; receipts?: Receipts; services?: Services; item?: Item }, target?: Item): CharsiImbueResult {
  const map = useMapStore.getState(), inv = useInventoryStore.getState(), hero = usePlayerStore.getState().player;
  if (!hero) return 'no-player';
  const index = target ? inv.backpack.indexOf(target) : -1;
  const before = structuredClone({ hero, item: target, rows: pick(map.questProgress, QUESTS),
    receipts: pick(map.questReceipts, RECEIPTS), items: pick(inv.questItems, [MALUS_SOURCE]), services: pick(inv.questServices, SOURCES),
    location: { currentAct: map.currentAct, currentSubAreaId: map.currentSubAreaId, selectedDifficulty: map.selectedDifficulty } });
  const expected = structuredClone({ rows: pick(next.rows ?? map.questProgress, QUESTS),
    receipts: pick(next.receipts ?? map.questReceipts, RECEIPTS), services: pick(next.services ?? inv.questServices, SOURCES),
    item: next.item ?? target });
  try {
    validateQuestItemLedger(inv.questItems, next.rows ?? map.questProgress, next.receipts ?? map.questReceipts);
    validateNative24CurrentCampaignRewards({ ...map, questProgress: next.rows ?? map.questProgress, questReceipts: next.receipts ?? map.questReceipts },
      inv.questItems, next.services ?? inv.questServices, map.endgame);
    if (next.item) {
      const base = loadItemBases().get(next.item.baseId); if (!base) return 'not-eligible';
      validateCanonicalSocketItem(next.item, base);
    }
  } catch { return 'not-eligible'; }
  const context = (restoring = false): boolean => {
    const live = useMapStore.getState();
    return sameCainData(usePlayerStore.getState().player, before.hero) && (restoring || usePlayerStore.getState().player === hero)
      && sameCainData({ currentAct: live.currentAct, currentSubAreaId: live.currentSubAreaId, selectedDifficulty: live.selectedDifficulty }, before.location)
      && (restoring || readiness() === null && atCharsi());
  };
  const participants = (published: boolean): boolean => {
    const live = useMapStore.getState(), current = useInventoryStore.getState();
    return sameCainData(pick(live.questProgress, QUESTS), published ? expected.rows : before.rows)
      && sameCainData(pick(live.questReceipts, RECEIPTS), published ? expected.receipts : before.receipts)
      && sameCainData(pick(current.questServices, SOURCES), published ? expected.services : before.services)
      && sameCainData(pick(current.questItems, [MALUS_SOURCE]), before.items);
  };
  const targetIsCurrent = (): boolean => {
    if (!target) return true;
    const current = next.item ?? target;
    return actualItem(before.item?.id ?? '') === current && sameCainData(current, expected.item)
      && locations().filter(row => row === current).length === 1 && (next.item === undefined || !locations().includes(target));
  };
  try {
    const replacement = next.item;
    if (replacement !== undefined || next.services !== undefined) {
      useInventoryStore.setState(state => ({ ...(replacement ? { backpack: state.backpack.map(row => row === target ? replacement : row) } : {}),
        ...(next.services ? { questServices: replace(state.questServices, structuredClone(expected.services), SOURCES) } : {}) }));
      // These actions publish either an inventory change or a map change, never both.
    } else {
      useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(expected.rows), QUESTS),
        questReceipts: replace(state.questReceipts, structuredClone(expected.receipts), RECEIPTS) }));
    }
    if (!context() || !participants(true) || !targetIsCurrent() || !graph()) throw new Error('Charsi publication postcondition failed');
    return 'ok';
  } catch (cause) {
    const errors: unknown[] = [];
    const attempt = (operation: () => void): void => { try { operation(); } catch (error) { errors.push(error); } };
    const targetId = before.item?.id;
    const isTarget = (row: Item | null | undefined): boolean => target !== undefined
      && (row === target || row === next.item || row?.id === targetId);
    attempt(() => { useInventoryStore.setState(state => {
      const backpack = target && before.item ? state.backpack.filter(row => !isTarget(row)) : state.backpack;
      if (target && before.item) backpack.splice(Math.min(index, backpack.length), 0, structuredClone(before.item));
      return { ...(target ? { backpack, stash: state.stash.filter(row => !isTarget(row)),
        equipped: Object.fromEntries(Object.entries(state.equipped).map(([slot, row]) => [slot, isTarget(row) ? null : row])),
        legacyGearQuarantine: state.legacyGearQuarantine.filter(row => !isTarget(row.item)),
        socketQuarantine: state.socketQuarantine.filter(row => !isTarget(row.item)) } : {}),
      questItems: replace(state.questItems, structuredClone(before.items), [MALUS_SOURCE]),
      questServices: replace(state.questServices, structuredClone(before.services), SOURCES) };
    }); });
    attempt(() => {
      const mercs = useMercStore.getState();
      if (!target || !Object.values(mercs.mercEquipment).some(gear => Object.values(gear).some(isTarget))
        && !mercs.ownedMercs.some(merc => merc.equipment.some(isTarget))) return;
      useMercStore.setState(state => ({ mercEquipment: Object.fromEntries(Object.entries(state.mercEquipment).map(([id, gear]) => [id,
        Object.fromEntries(Object.entries(gear).map(([slot, row]) => [slot, isTarget(row) ? null : row]))])),
      ownedMercs: state.ownedMercs.map(merc => ({ ...merc, equipment: merc.equipment.filter(row => !isTarget(row)) })) }));
    });
    attempt(() => { usePlayerStore.setState({ player: structuredClone(before.hero) }); });
    attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(before.rows), QUESTS),
      questReceipts: replace(state.questReceipts, structuredClone(before.receipts), RECEIPTS), ...before.location })); });
    attempt(() => {
      if (!context(true) || !participants(false) || !graph() || target && (!sameCainData(actualItem(targetId ?? ''), before.item)
        || locations().some(row => row === target || row === next.item))) throw new Error('Charsi restoration postcondition failed');
    });
    if (errors.length > 0) throw new AggregateError(errors, 'Charsi restoration failed', { cause });
    return 'grant-failed';
  }
}
function transaction(operation: () => CharsiImbueResult): CharsiImbueResult {
  try { const refusal = questActionPreflight(); if (refusal) return refusal; }
  catch (error) {
    if (error instanceof WaveGuardError && error.code === 'questBusy') return 'claim-in-progress';
    throw error;
  }
  return withQuestTransaction<CharsiImbueResult>(() => { const refusal = readiness(); return refusal ?? operation(); });
}
/** Present one witnessed normal item unchanged; acquire no charge, XP or custody. */
export function presentCharsiItem(selection: CharsiPresentSelection | null): CharsiImbueResult {
  return transaction(() => {
    const target = currentCharsiPresentItem(selection); if (!target) return 'not-eligible';
    const map = useMapStore.getState(), side = map.questProgress[MALUS_SIDE_QUEST]; if (!side) return 'not-eligible';
    return publish({ rows: { ...map.questProgress, [MALUS_SIDE_QUEST]: { ...side, status: 'completed',
      objectives: { ...side.objectives, 'obj-bring-item': true } } },
      receipts: { ...map.questReceipts, [ACT1_QUEST_RECEIPTS.presentItem]: true } }, target);
  });
}
/** Repair exactly one absent preserved claimed source after earning its real proof, Normal only. */
export function restoreCharsiImbue(source: string): CharsiImbueResult {
  return transaction(() => {
    if (!isSource(source) || !atCharsi(true) || !graph()) return 'not-eligible';
    const inv = useInventoryStore.getState();
    if (!sourceClaim(source)) return 'not-eligible';
    if (Object.hasOwn(inv.questServices, source)) return inv.questServices[source]?.state === 'available' ? 'already-available' : 'already-consumed';
    return publish({ services: { ...inv.questServices, [source]: { serviceId: 'imbue_item', state: 'available' } } });
  });
}
/** Transform only the witnessed instance and consume exactly its source, including unlocked replay. */
export function imbueCharsiItem(selection: CharsiImbueSelection | null): CharsiImbueResult {
  return transaction(() => {
    const target = currentCharsiImbueItem(selection); if (!target || !selection) return 'not-eligible';
    const base = loadItemBases().get(target.baseId); if (!base) return 'not-eligible';
    let nextItem: Item;
    try {
      const sourceLevel = target.ilvl ?? target.level;
      const seed = hashSeed(JSON.stringify(['quest-imbue-v1', selection.hero.id, selection.source, target.id, target.baseId, sourceLevel]));
      const rules = loadRarityAffixRules().rare; if (!rules) return 'not-eligible';
      const affixes = prepareRareAffixes(base, sourceLevel, loadAffixPool(), rules)(createRng(seed));
      nextItem = { ...target, rarity: 'rare', affixes, generatedName: {}, identified: true };
    } catch { return 'not-eligible'; }
    return publish({ item: nextItem, services: { ...useInventoryStore.getState().questServices,
      [selection.source]: { serviceId: 'imbue_item', state: 'consumed', targetItemId: target.id } } }, target);
  });
}
