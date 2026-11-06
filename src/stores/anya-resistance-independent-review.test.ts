/** Constructed reciprocal source capabilities; these checks prove composition, not earned campaign balance. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(), saveSave: vi.fn(() => Promise.resolve()), deleteSave: vi.fn() }));
import { ANYA } from '@/engine/map/anya-quest';
import { ACT5_ENCOUNTERS, PRISON_QUEST, RESCUE_QUEST } from '@/engine/map/act5-admission';
import { CAGE_PROOFS, INSPECT_PROOF, POTION_SOURCE, READ_PROOF, SCROLL_SOURCE, THAW_PROOF } from '@/engine/save/act5-state';
import { resolveAct5ResistanceBonus } from '@/engine/progression/quest-resistance';
import { resolveDamage } from '@/engine/combat/damage';
import { createRng } from '@/engine/rng';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { claimQuestReward } from '@/features/quests/claimReward';
import { compareEquip } from '@/features/inventory/compareEquip';
import { useQuestService, questServicesForNpc } from '@/features/town/questServices';
import { executeAnyaTrade, prepareAnyaTrade } from '@/features/town/anyaTrade';
import { assertWaveSnapshotAllowed } from './waveTransitionGuard';
import { resetSkillsForCompositionTest } from '../../tests/helpers/reset-skills';
import type { Item } from '@/engine/types/items';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, useFormationStore, useCombatStore } from '.';
import { __resetPersistenceForTests, snapshotStores, useHydrationStore } from './persistence';
import { abortSubAreaRun, playerToCombatUnit, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';

const SUN = 'quests/act2-tainted-sun';
const expected = { fire: 55, cold: 55, lightning: 25, poison: 25, arcane: 25, physical: 25 };
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, useFormationStore, useCombatStore] as const;
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Anya composition fixture'); return value; }
const hero = () => required(usePlayerStore.getState().player);
function reset() {
  abortSubAreaRun(); __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
}
function arrangeMainAndRead() {
  const player = createMockPlayer('Independent Anya composition', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, statPoints: 10, derivedStats: { ...player.derivedStats, life: 7, mana: 3 } });
  const prison = required(ACT5_ENCOUNTERS.find(row => row.questId === PRISON_QUEST));
  useMapStore.setState({ currentAct: 5, currentSubAreaId: 'areas/act5-bloody-foothills', questProgress: {
    [RESCUE_QUEST]: { id: RESCUE_QUEST, status: 'completed', rewardClaimed: true, objectives: { 'obj-free-15': true } },
    [PRISON_QUEST]: { id: PRISON_QUEST, status: 'completed', rewardClaimed: true,
      objectives: Object.fromEntries(ANYA.prerequisite.objectiveIds.map(id => [id, true])) },
    [ANYA.quest]: { id: ANYA.quest, status: 'completed', rewardClaimed: false, objectives: { [ANYA.objective]: true } },
    [SUN]: { id: SUN, status: 'completed', rewardClaimed: true, objectives: { 'obj-destroy-altar': true } }
  }, questReceipts: { ...Object.fromEntries(CAGE_PROOFS.map(source => [source, true as const])),
    [prison.proof]: true, [INSPECT_PROOF]: true, [POTION_SOURCE]: true, [THAW_PROOF]: true, [READ_PROOF]: true, [ANYA.proof]: true } });
  useInventoryStore.setState({ questItems: { [POTION_SOURCE]: { itemId: 'quest/malahs_potion', state: 'consumed' },
    [SCROLL_SOURCE]: { itemId: 'items/scroll_of_resist', state: 'consumed' } },
    questServices: { [`${PRISON_QUEST}#reward:service`]: { serviceId: 'personalize_item', state: 'available' } } });
  const map = useMapStore.getState(), inv = useInventoryStore.getState();
  expect(resolveAct5ResistanceBonus(map.questProgress, inv.questItems, map.questReceipts)).toBe(15);
  usePlayerStore.getState().recomputeDerived({});
  expect(hero().derivedStats.resistances).toEqual({ fire: 45, cold: 45, lightning: 15, poison: 15, arcane: 15, physical: 15 });
}
function claimSide() {
  expect(claimQuestReward(ANYA.quest)).toBe('ok');
  const map = useMapStore.getState(), inv = useInventoryStore.getState();
  expect(resolveAct5ResistanceBonus(map.questProgress, inv.questItems, map.questReceipts)).toBe(25);
  expect(hero().derivedStats.resistances).toEqual(expected);
  expect(inv.questServices[`${PRISON_QUEST}#reward:service`]?.state).toBe('available');
  expect(inv.questServices[ANYA.serviceSource]?.state).toBe('available');
}
function resistanceGear(): Item {
  return { id: 'anya-composition-amulet', baseId: 'items/base/amu-tin', socketCapacity: 0, rarity: 'rare', level: 1,
    identified: true, equipped: false, affixes: [{ affixId: 'fixture-resistance',
      values: new Map([['resistances.fire', 91], ['resistances.cold', -12.5]]) }] };
}
beforeEach(() => { reset(); arrangeMainAndRead(); });
afterEach(() => { vi.restoreAllMocks(); reset(); useHydrationStore.getState().setStatus('idle'); });
it.each(['recompute', 'real-xp', 'single-point', 'draft-points', 'respec'] as const)('composes exact main5 + Read10 + side10 and Sun30 after %s without healing', action => {
  claimSide(); const state = usePlayerStore.getState();
  if (action === 'recompute') state.recomputeDerived({});
  if (action === 'real-xp') state.gainExperience(4500);
  if (action === 'single-point') state.allocateStatPoint('vitality');
  if (action === 'draft-points') expect(state.allocateStatPoints({ strength: 0, dexterity: 0, vitality: 5, energy: 0 }, hero())).toBe('ok');
  if (action === 'respec') expect(resetSkillsForCompositionTest()).toBe('ok');
  expect(hero().derivedStats.resistances).toEqual(expected);
  expect(hero().derivedStats.life).toBe(7); expect(hero().derivedStats.mana).toBe(3);
  state.recomputeDerived({}); expect(hero().derivedStats.resistances).toEqual(expected);
});
it('projects exact source sums for both equipment comparisons and preserves the gear delta', () => {
  claimSide(); const candidate = resistanceGear(), map = useMapStore.getState(), inv = useInventoryStore.getState();
  const result = compareEquip(hero(), candidate, 'amulet', {}, undefined, map.questProgress, inv.questItems, map.questReceipts);
  expect(result.resistances.fire).toEqual({ current: 55, candidate: 146, delta: 91 });
  expect(result.resistances.cold).toEqual({ current: 55, candidate: 42.5, delta: -12.5 });
  expect(result.resistances.lightning).toEqual({ current: 25, candidate: 25, delta: 0 });
});
it('composes the initial actual native input and current-config replay exactly once', () => {
  claimSide(); expect(startSubAreaRun({ act: 1, subAreaId: 'a1-blood-moor', runSeed: 11, challengeOrdinal: 0 })).not.toBeNull();
  const battleHero = () => required(useCombatStore.getState().playerTeam.find(unit => unit.kind === 'hero'));
  expect(battleHero().stats.resistances).toEqual(expected);
  const item = resistanceGear(); useInventoryStore.setState({ equipped: { amulet: item } });
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(battleHero().stats.resistances).toEqual({ ...expected, fire: 146, cold: 42.5 });
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(battleHero().stats.resistances).toEqual({ ...expected, fire: 146, cold: 42.5 });
});
it('normalizes a current save from its own exact source graph and roundtrips without duplicate bonuses', () => {
  claimSide(); const save = required(snapshotStores());
  const raw = toJsonSafe({ ...save, player: { ...save.player, derivedStats: { ...save.player.derivedStats,
    resistances: { fire: 991, cold: 992, lightning: 993, poison: 994, arcane: 995, physical: 996 } } } });
  const before = structuredClone(raw); useMapStore.getState().reset();
  const decoded = decodeSave(raw);
  expect(decoded.player.derivedStats.resistances).toEqual(expected);
  expect(decoded.player.derivedStats.life).toBe(7); expect(decoded.player.derivedStats.mana).toBe(3);
  expect(raw).toEqual(before); expect(decodeSave(toJsonSafe(decoded))).toEqual(decoded);
});
it('retains raw overcap values in projections while applied combat resistance stays capped at75', () => {
  claimSide(); useInventoryStore.setState({ equipped: { amulet: resistanceGear() } });
  usePlayerStore.getState().recomputeDerived(useInventoryStore.getState().equipped);
  const unit = playerToCombatUnit(hero());
  expect(unit.stats.resistances).toEqual({ ...expected, fire: 146, cold: 42.5 });
  const result = resolveDamage({ baseMin: 1000, baseMax: 1000, flatBonus: 0, increasedPct: 0, comboMult: 1,
    type: 'fire', critChance: 0, critMult: 2, defenderResistances: unit.stats.resistances,
    defenderArmor: 0, defenderMagicResist: 0, defenderDodge: 0, hitChance: 1 }, createRng(3));
  expect(result.effectiveResistPct).toBe(75); expect(result.final).toBe(250);
  expect(hero().derivedStats.resistances.fire).toBe(146);
});

function readyTown() {
  useMapStore.setState({ currentAct: 5, clearedSubAreas: ['areas/act4-chaos-sanctuary'] });
  usePlayerStore.setState({ player: { ...hero(), name: 'Anya Review' } });
}
function personalizable(id: string): Item {
  return { id, baseId: 'items/base/helm-cap', socketCapacity: 0, rarity: 'normal', level: 1,
    identified: true, equipped: false, affixes: [] };
}
it.each([false, true])('uses actual main and side personalization charges independently (side first%s) without altering protection or stock', sideFirst => {
  claimSide(); readyTown();
  const main = `${PRISON_QUEST}#reward:service`, order = sideFirst ? [ANYA.serviceSource, main] : [main, ANYA.serviceSource];
  const first = personalizable('first-personalization'), second = personalizable('second-personalization');
  useInventoryStore.setState({ backpack: [first, second] });
  expect(questServicesForNpc('npc/anya').filter(row => row.serviceId === 'personalize_item')).toHaveLength(2);
  expect(useQuestService(required(order[0]), first.id)).toBe('ok');
  expect(useInventoryStore.getState().questServices[required(order[1])]?.state).toBe('available');
  expect(useQuestService(required(order[0]), second.id)).toBe('already-consumed');
  expect(useQuestService(required(order[1]), second.id)).toBe('ok');
  for (const item of useInventoryStore.getState().backpack) expect(item.personalizedBy).toEqual({ characterId: hero().id, name: hero().name });
  expect(questServicesForNpc('npc/anya').filter(row => row.state === 'consumed')).toHaveLength(2);
  expect(hero().derivedStats.resistances).toEqual(expected);
  expect(useMapStore.getState().questReceipts).not.toHaveProperty(ANYA.tradeProofs.waterwalk);
  expect(decodeSave(toJsonSafe(required(snapshotStores()))).inventory.questServices).toEqual(useInventoryStore.getState().questServices);
});
it.each([false, true])('fences actual personalization under trade payment and preserves both charges (rollback%s)', fail => {
  claimSide(); readyTown();
  const candidate = personalizable('waiting-personalization');
  useInventoryStore.setState({ backpack: [candidate], currencies: { 'rune-shard': 2000 }, materials: { 'materials/scrap': 40 } });
  const selected = required(prepareAnyaTrade('waterwalk')), beforeHero = structuredClone(hero());
  const services = structuredClone(useInventoryStore.getState().questServices); let observed = false;
  const stop = useInventoryStore.subscribe(state => {
    if (observed || state.currencies['rune-shard'] !== 0 || !state.backpack.some(item => item.uniqueId === 'items/unique/waterwalk')) return;
    observed = true;
    expect(() => useQuestService(ANYA.serviceSource, candidate.id)).toThrow('materialBusy');
    expect(() => useQuestService(`${PRISON_QUEST}#reward:service`, candidate.id)).toThrow('materialBusy');
    expect(() => snapshotStores()).toThrow('materialBusy');
    if (fail) throw new Error('independent trade failure after blocked service');
  });
  try { expect(executeAnyaTrade(selected)).toBe(fail ? 'grant-failed' : 'ok'); } finally { stop(); }
  expect(observed).toBe(true); expect(useInventoryStore.getState().questServices).toEqual(services); expect(hero()).toEqual(beforeHero);
  expect(useInventoryStore.getState().currencies).toEqual({ 'rune-shard': fail ? 2000 : 0 });
  expect(useInventoryStore.getState().materials).toEqual(fail ? { 'materials/scrap': 40 } : {});
  expect(useInventoryStore.getState().backpack.filter(item => item.uniqueId === 'items/unique/waterwalk')).toHaveLength(fail ? 0 : 1);
  expect(useInventoryStore.getState().backpack.find(item => item.id === candidate.id)).toEqual(candidate);
  expect(useMapStore.getState().questReceipts[ANYA.tradeProofs.waterwalk]).toBe(fail ? undefined : true);
  assertWaveSnapshotAllowed();
  expect(useQuestService(ANYA.serviceSource, candidate.id)).toBe('ok');
  expect(useInventoryStore.getState().questServices[`${PRISON_QUEST}#reward:service`]?.state).toBe('available');
});
