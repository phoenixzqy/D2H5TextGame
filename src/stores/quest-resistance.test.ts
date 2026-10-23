import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { compareEquip } from '@/features/inventory/compareEquip';
import { claimQuestReward } from '@/features/quests/claimReward';
import { usePlayerStore, useInventoryStore, useMapStore, useMercStore, useMetaStore,
  useFormationStore, useCombatStore } from '@/stores';
import { __resetPersistenceForTests, useHydrationStore, snapshotStores } from './persistence';
import { decodeSave } from '@/engine/save/validate';
import { toJsonSafe } from '@/engine/save/serialize';
import { playerToCombatUnit, startSubAreaRun, refreshActivePlayerCombatConfig,
  advanceWaveOrFinish, abortSubAreaRun } from './combatHelpers';
import type { Item } from '@/engine/types/items';

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing required test fixture');
  return value;
}

const SUN = 'quests/act2-tainted-sun';
const stores = [usePlayerStore, useInventoryStore, useMapStore, useMercStore, useMetaStore,
  useFormationStore, useCombatStore] as const;
const hero = () => required(usePlayerStore.getState().player);
const amulet: Item = { id: 'sun-gear', baseId: 'items/base/amu-tin', socketCapacity: 0, rarity: 'rare',
  level: 1, identified: true, equipped: true, affixes: [{ affixId: 'legacy-resists',
    values: new Map([['resistances.fire', 91], ['resistances.cold', -12.5]]) }] };
function claimed() { useMapStore.getState().updateQuestProgress(SUN, {
  status: 'completed', objectives: { 'obj-destroy-altar': true }, rewardClaimed: true
}); }
function reset() {
  abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
}
beforeEach(() => {
  reset(); const player = createMockPlayer('Sun integration', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, statPoints: 10,
    derivedStats: { ...player.derivedStats, life: 17, mana: 11 } });
  useInventoryStore.setState({ equipped: { amulet } });
});
afterEach(reset);

describe('permanent quest resistance across live projections', () => {
  it.each(['recompute', 'xp', 'single-point', 'draft-points', 'respec'] as const)('retains exact gear plus entitlement after %s', action => {
    claimed(); const store = usePlayerStore.getState();
    if (action === 'recompute') store.recomputeDerived(useInventoryStore.getState().equipped);
    if (action === 'xp') store.gainExperience(4500);
    if (action === 'single-point') store.allocateStatPoint('vitality');
    if (action === 'draft-points') expect(store.allocateStatPoints({ strength: 0, dexterity: 0, vitality: 5, energy: 0 }, hero())).toBe('ok');
    if (action === 'respec') {
      store.recomputeDerived(useInventoryStore.getState().equipped);
      expect(store.respec({ getGold: () => 100000, spendGold: () => true })).toBe('ok');
    }
    expect(hero().derivedStats.resistances).toMatchObject({ fire: 121, cold: 17.5 });
    expect(hero().derivedStats.life).toBe(17); expect(hero().derivedStats.mana).toBe(11);
    usePlayerStore.getState().recomputeDerived(useInventoryStore.getState().equipped);
    expect(hero().derivedStats.resistances.fire).toBe(121);
    expect(playerToCombatUnit(hero()).stats.resistances.fire).toBe(121);
  });
  it('uses explicit quest context for both absolute comparison values without changing the gear delta', () => {
    claimed(); const candidate = { ...amulet, id: 'candidate', affixes: [{ affixId: 'resists',
      values: new Map([['resistances.fire', 100], ['resistances.cold', 5]]) }] };
    const progress = useMapStore.getState().questProgress;
    const result = compareEquip(hero(), candidate, 'amulet', { amulet }, undefined, progress);
    expect(result.resistances.fire).toEqual({ current: 121, candidate: 130, delta: 9 });
    expect(result.resistances.cold).toEqual({ current: 17.5, candidate: 35, delta: 17.5 });
    expect(compareEquip(hero(), candidate, 'amulet', { amulet }).resistances.fire.current).toBe(91);
  });
  it('refreshes initial battle and current-configuration replay without duplicating the bonus', () => {
    claimed(); expect(startSubAreaRun({ act: 1, subAreaId: 'a1-blood-moor', runSeed: 11, challengeOrdinal: 0 })).not.toBeNull();
    const current = () => required(useCombatStore.getState().playerTeam.find(u => u.kind === 'hero'));
    expect(current().stats.resistances.fire).toBe(121);
    useInventoryStore.setState({ equipped: {} });
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(current().stats.resistances.fire).toBe(30);
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(current().stats.resistances.fire).toBe(30);
  });
  it('uses the claimed bonus on a later wave through native settlement', () => {
    const player = hero(); useInventoryStore.setState({ equipped: {} });
    // A declared strong fixture proves projection across waves, not earned progression.
    usePlayerStore.setState({ player: { ...player, coreStats: { strength: 500, dexterity: 500, vitality: 500, energy: 500 } } });
    expect(startSubAreaRun({ act: 1, subAreaId: 'a1-blood-moor', runSeed: 11, challengeOrdinal: 0 })).not.toBeNull();
    useCombatStore.getState().resumePlayback();
    for (let n = 0; n < 10000 && !useCombatStore.getState().playbackComplete; n++) useCombatStore.getState().advanceEvent();
    expect(useCombatStore.getState().playbackComplete).toBe(true);
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    claimed(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(required(useCombatStore.getState().playerTeam.find(u => u.kind === 'hero')).stats.resistances.fire).toBe(30);
  });
  it('rebuilds claimed save resistance caches from its own map and authoritative gear independently of the live character', () => {
    claimed(); const input = required(snapshotStores());
    const saved = { ...input, player: { ...input.player, derivedStats: { ...input.player.derivedStats,
      resistances: { ...input.player.derivedStats.resistances, fire: 999, cold: 888, poison: 777 } } } };
    const raw = toJsonSafe(saved), before = structuredClone(raw);
    useMapStore.getState().reset();
    const decoded = decodeSave(raw);
    expect(decoded.player.derivedStats).toEqual({ ...saved.player.derivedStats,
      resistances: { fire: 121, cold: 17.5, lightning: 0, poison: 0, arcane: 0, physical: 0 } });
    expect(decoded.player.equipment).toEqual(saved.player.equipment);
    expect({ ...decoded, player: saved.player }).toEqual(saved);
    expect(raw).toEqual(before);
    expect(decodeSave(toJsonSafe(decoded))).toEqual(decoded);
  });
  it.each(['absent', 'unclaimed', 'wrong-id', 'missing-objective'] as const)('leaves %s save caches untouched even with a claimed live character', variant => {
    const input = required(snapshotStores());
    const base = { id: SUN, status: 'completed' as const, rewardClaimed: true, objectives: { 'obj-destroy-altar': true } };
    const questProgress = variant === 'absent' ? {} : { [SUN]: { ...base,
      ...(variant === 'unclaimed' ? { rewardClaimed: false } : {}),
      ...(variant === 'wrong-id' ? { id: 'quests/wrong' } : {}),
      ...(variant === 'missing-objective' ? { objectives: {} } : {}) } };
    const save = { ...input, map: { ...input.map, questProgress } };
    claimed(); expect(decodeSave(toJsonSafe(save))).toEqual(save);
  });
  it.each([Number.MAX_VALUE, Number.MAX_SAFE_INTEGER - 1])('refuses unsafe gear %s before any Claim writes', value => {
    useInventoryStore.setState({ equipped: { amulet: { ...amulet, affixes: [{ affixId: 'huge', values: new Map([['resistances.fire', value]]) }] } } });
    useMapStore.getState().updateQuestProgress(SUN, { status: 'completed', objectives: { 'obj-destroy-altar': true } });
    const before = stores.map(s => s.getState());
    expect(claimQuestReward(SUN)).toBe('unsupported-rewards');
    expect(stores.map(s => s.getState())).toEqual(before);
  });
});
