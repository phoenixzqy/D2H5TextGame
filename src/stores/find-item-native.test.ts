import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Only durable I/O is replaced; native authority, battles, playback and generated rewards remain real.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import * as engine from '@/engine/combat/combat';
import * as loot from '@/engine/loot/award';
import { mergeRewards } from '@/engine/loot/reward-plan';
import { xpForKill } from '@/engine/progression/xp';
import { createRng } from '@/engine/rng';
import { loadAwardPools } from '@/data/loaders/loot';
import * as lootData from '@/data/loaders/loot';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun, resetIdleElitePity,
  refreshActivePlayerCombatConfig } from './combatHelpers';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { RecordedWaveAccessError } from './recordedWaveAccess';
import { snapshotStores, importIntoStores, __resetPersistenceForTests } from './persistence';
import { toJsonSafe } from '@/engine/save';

const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun(); resetIdleElitePity();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
function arrange(seed: number, transform?: (out: engine.RecordedBattleResult) => void,
  expectedWinner: engine.RecordedBattleResult['result']['winner'] = 'player') {
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Synthetic native search', 'barbarian'), level: 30,
    comboOrder: ['skills-barbarian-find-item'],
    skillLevels: { 'skills-barbarian-find-potion': 1, 'skills-barbarian-find-item': 20 } });
  const cap = { id: 'fixture-search-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, socketCapacity: 0, socketContents: [],
    affixes: [{ affixId: 'synthetic-import', values: new Map([['statMods.life', 999880],
      ['statMods.mana', 1000], ['statMods.attack', 100]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  const realSimulation = engine.runBattleRecorded;
  const simulation = vi.spyOn(engine, 'runBattleRecorded').mockImplementation(input => {
    const out = realSimulation(input); transform?.(out); return out;
  });
  expect(startSubAreaRun({ runSeed: seed, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
  const state = useCombatStore.getState(), result = simulation.mock.results[0];
  expect(state.outcome?.winner).toBe(expectedWinner);
  expect(state.recordedEvents.some(e => e.kind === 'action' && e.skillId === 'barbarian.find_item')).toBe(true);
  if (result?.type !== 'return') throw new Error('Missing real recorded battle');
  return result.value;
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); });

it('captures successful native searches privately and collects real merged loot only at guarded victory', () => {
  const realRoll = loot.rollKillRewards;
  const generation = vi.spyOn(loot, 'rollKillRewards'), out = arrange(19);
  const finds = out.result.findItemFinds ?? [];
  expect(finds.length).toBeGreaterThan(0);
  expect(generation).not.toHaveBeenCalled();
  const issued = inspectRecordedWaves().currentPublished;
  if (!issued) throw new Error('Missing native issued receipt');
  expect(Reflect.get(issued.binding, 'findItemFinds')).toEqual(finds);
  expect(Reflect.get(issued.binding, 'findItemFinds')).not.toBe(finds);
  const before = useInventoryStore.getState(), xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
  drain(); expect(useInventoryStore.getState()).toBe(before); expect(generation).not.toHaveBeenCalled();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  const slain = out.result.enemyTeam.filter(enemy => enemy.life <= 0 && enemy.kind !== 'summon');
  expect(generation).toHaveBeenCalledTimes(slain.length + finds.length);
  const bags = generation.mock.results.map(result => {
    if (result.type !== 'return') throw new Error('Missing real generated reward bag'); return result.value;
  });
  const expected = mergeRewards(...bags), ordinary = mergeRewards(...bags.slice(0, slain.length));
  const normalRng = createRng((19 ^ 0x9e3779b1) >>> 0), searchRng = createRng((19 ^ 0x46494e44) >>> 0);
  const pools = loadAwardPools();
  const withoutIds = (bag: loot.KillRewards) => ({ ...bag, items: bag.items.map(({ id: _id, ...item }) => item) });
  for (const [index, call] of generation.mock.calls.entries()) {
    const expectedBag = realRoll(call[0], pools, index < slain.length ? normalRng : searchRng);
    expect(withoutIds(bags[index] ?? mergeRewards())).toEqual(withoutIds(expectedBag));
    if (index >= slain.length) {
      const find = finds[index - slain.length], original = issued.binding.engineInput.enemyTeam.find(unit => unit.id === find?.corpseId);
      expect(call[0]).toMatchObject({ monsterLevel: original?.level, tier: original?.tier,
        act: 1, difficulty: 'normal', magicFindMultiplier: 1 });
    }
  }
  expect(expected.runeShards).toBeGreaterThan(ordinary.runeShards);
  expect(expected.items.length).toBeGreaterThan(0);
  const current = useInventoryStore.getState();
  expect(current.backpack).toEqual([...before.backpack, ...expected.items]);
  expect(current.materials).toEqual(expected.materials);
  expect((current.currencies['rune-shard'] ?? 0) - (before.currencies['rune-shard'] ?? 0)).toBe(expected.runeShards);
  expect((current.currencies.wishstone ?? 0) - (before.currencies.wishstone ?? 0)).toBe(expected.wishstones);
  expect(useCombatStore.getState().runRewards).toEqual(expected);
  expect(xp).toHaveBeenCalledTimes(1);
  expect(xp).toHaveBeenCalledWith(slain.reduce((sum, enemy) => sum + xpForKill(enemy.level), 0));
  const heroId = out.result.playerTeam.find(unit => unit.kind === 'hero')?.id;
  expect(finds.every(find => find.sourceHeroId === heroId && slain.some(enemy => enemy.id === find.corpseId))).toBe(true);
  expect(new Set(current.backpack.map(item => item.id)).size).toBe(current.backpack.length);
});

it('public search text cannot invent a payout and privately issued finds cannot be edited', () => {
  const out = arrange(19), issued = inspectRecordedWaves().currentPublished;
  if (!issued?.binding.findItemFinds?.[0]) throw new Error('Missing successful native find');
  const count = issued.binding.findItemFinds.length;
  expect(() => Object.assign(issued.binding.findItemFinds?.[0] ?? {}, { corpseId: 'forged' })).toThrow(TypeError);
  const message = useCombatStore.getState().recordedEvents.find(event => event.kind === 'message');
  if (!message) throw new Error('Missing public message');
  Object.assign(message, { messageKey: 'combat:corpses.findItemSuccess', params: { count: 99, corpseId: 'forged' } });
  const generation = vi.spyOn(loot, 'rollKillRewards');
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(generation).toHaveBeenCalledTimes(out.result.enemyTeam.length + count);
});

it('rejects a structurally valid foreign private corpse before generating either bag or XP', () => {
  arrange(19, out => { Object.assign(out.result, { findItemFinds: [{
    sourceHeroId: out.result.playerTeam.find(unit => unit.kind === 'hero')?.id, corpseId: 'forged', rank: 20 }] }); });
  drain(); const inventory = useInventoryStore.getState(), player = usePlayerStore.getState().player;
  const generation = vi.spyOn(loot, 'rollKillRewards');
  expect(advanceWaveOrFinish).toThrow('Invalid Find Item corpse');
  expect(generation).not.toHaveBeenCalled();
  expect(useInventoryStore.getState()).toBe(inventory); expect(usePlayerStore.getState().player).toBe(player);
  expect(inspectRecordedWaves().currentPublished?.installation?.settlement.progress.phase).toBe('settlementFailed');
});

it.each(['unlearn', 'prerequisite', 'wrong-class', 'unselected'] as const)(
  'keeps issued success payable while applying %s invalidation to the next wave', invalid => {
    const out = arrange(19), value = usePlayerStore.getState().player;
    if (!value) throw new Error('Missing player');
    const finds = structuredClone(out.result.findItemFinds);
    usePlayerStore.setState({ player: { ...value,
      ...(invalid === 'wrong-class' ? { class: 'amazon' } : {}),
      ...(invalid === 'unselected' ? { comboOrder: [] } : {}),
      skillLevels: { 'skills-barbarian-find-item': invalid === 'unlearn' ? 0 : 20,
        'skills-barbarian-find-potion': invalid === 'prerequisite' ? 0 : 1 } } });
    const generation = vi.spyOn(loot, 'rollKillRewards');
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(generation).toHaveBeenCalledTimes(out.result.enemyTeam.length + (finds?.length ?? 0));
    expect(out.result.findItemFinds).toEqual(finds);
    expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'action' && e.skillId === 'barbarian.find_item')).toBe(false);
    expect(inspectRecordedWaves().currentPublished?.binding.findItemFinds ?? []).toEqual([]);
  });

it('publishes current next-wave rank without changing privately issued successful finds', () => {
  const out = arrange(19), value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing player');
  const finds = structuredClone(out.result.findItemFinds);
  usePlayerStore.setState({ player: { ...value, skillLevels: { ...value.skillLevels, 'skills-barbarian-find-item': 1 } } });
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(inspectRecordedWaves().currentPublished?.binding.engineInput.findItem).toEqual([{ sourceHeroId: value.id, rank: 1 }]);
  expect(out.result.findItemFinds).toEqual(finds);
});

it('ordinary replay shares payout identity and repeated completion cannot collect a second bag', () => {
  arrange(19);
  const first = inspectRecordedWaves().currentPublished?.installation?.settlement.identity;
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(inspectRecordedWaves().currentPublished?.installation?.settlement.identity).toBe(first);
  const generation = vi.spyOn(loot, 'rollKillRewards');
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const inventory = useInventoryStore.getState(), player = usePlayerStore.getState().player;
  const count = generation.mock.calls.length; expect(count).toBeGreaterThan(0);
  expect(advanceWaveOrFinish()).toBe('idle');
  expect(useInventoryStore.getState()).toBe(inventory); expect(usePlayerStore.getState().player).toBe(player);
  expect(generation).toHaveBeenCalledTimes(count);
});

it('flee after successful searches grants no inventory or XP', () => {
  const out = arrange(19); expect(out.result.findItemFinds?.length).toBeGreaterThan(0);
  const inventory = useInventoryStore.getState(), player = usePlayerStore.getState().player;
  const generation = vi.spyOn(loot, 'rollKillRewards');
  abortSubAreaRun(); expect(advanceWaveOrFinish()).toBe('idle');
  expect(useInventoryStore.getState()).toBe(inventory); expect(usePlayerStore.getState().player).toBe(player);
  expect(generation).not.toHaveBeenCalled();
});

it.each(['enemy', null] as const)('a constructed non-victory recording (%s) cannot collect successful searches', winner => {
  // Inject only the terminal boundary status after a real paid successful search.
  const out = arrange(19, result => { Object.assign(result.result, { winner }); }, winner);
  expect(out.result.findItemFinds?.length).toBeGreaterThan(0);
  const inventory = useInventoryStore.getState(), player = usePlayerStore.getState().player;
  const generation = vi.spyOn(loot, 'rollKillRewards');
  drain(); expect(advanceWaveOrFinish()).toBe('defeat');
  expect(useInventoryStore.getState()).toBe(inventory); expect(usePlayerStore.getState().player).toBe(player);
  expect(generation).not.toHaveBeenCalled();
});

it.each(['no-drop', 'unknown-table'] as const)('uses ordinary %s behavior without guaranteeing search gear', mode => {
  const out = arrange(19), pools = loadAwardPools();
  const treasureClasses = mode === 'unknown-table' ? new Map() : new Map([...pools.treasureClasses]
    .map(([id, table]) => [id, { ...table, noDropChance: 1 }]));
  vi.spyOn(lootData, 'loadAwardPools').mockReturnValue({ ...pools, treasureClasses });
  const generation = vi.spyOn(loot, 'rollKillRewards'), before = useInventoryStore.getState();
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(generation).toHaveBeenCalledTimes(out.result.enemyTeam.length + (out.result.findItemFinds?.length ?? 0));
  const bags = generation.mock.results.map(result => {
    if (result.type !== 'return') throw new Error('Missing real no-drop result'); return result.value;
  });
  expect(bags.every(bag => bag.items.length === 0)).toBe(true);
  expect(useInventoryStore.getState().backpack).toEqual(before.backpack);
  expect((useInventoryStore.getState().currencies['rune-shard'] ?? 0) - (before.currencies['rune-shard'] ?? 0))
    .toBe(mergeRewards(...bags).runeShards);
});

it.each(['bonus-generation', 'inventory-observer', 'currency-overflow'] as const)(
  'rolls back both bags and XP after %s failure, then refuses reroll', failure => {
    const out = arrange(19); expect(out.result.findItemFinds?.length).toBeGreaterThan(0);
    if (failure === 'currency-overflow') useInventoryStore.setState(current => ({ currencies: {
      ...current.currencies, 'rune-shard': Number.MAX_SAFE_INTEGER } }));
    drain();
    const before = [usePlayerStore, useMercStore, useInventoryStore, useMapStore].map(store => store.getState());
    const error = new Error(`injected ${failure}`), actual = loot.rollKillRewards;
    const generation = vi.spyOn(loot, 'rollKillRewards');
    if (failure === 'bonus-generation') {
      generation.mockImplementation((...args) => {
        if (generation.mock.calls.length > out.result.enemyTeam.length) throw error;
        return actual(...args);
      });
    }
    let once = true;
    const stop = failure === 'inventory-observer' ? useInventoryStore.subscribe(() => {
      if (once) { once = false; throw error; }
    }) : () => undefined;
    try {
      if (failure === 'currency-overflow') expect(advanceWaveOrFinish).toThrow();
      else expect(advanceWaveOrFinish).toThrow(error);
    } finally { stop(); }
    [usePlayerStore, useMercStore, useInventoryStore, useMapStore].forEach((store, index) => {
      expect(store.getState()).toBe(before[index]);
    });
    const progress = inspectRecordedWaves().currentPublished?.installation?.settlement.progress;
    expect(progress?.phase).toBe('settlementFailed');
    const count = generation.mock.calls.length;
    expect(advanceWaveOrFinish).toThrow(new RecordedWaveAccessError('settlementFailed'));
    expect(generation).toHaveBeenCalledTimes(count);
  });

it('roundtrips learned configuration without finds or corpses and pays nothing on import', async () => {
  arrange(19); const save = snapshotStores(); if (!save) throw new Error('Missing search save');
  const serialized = JSON.stringify(toJsonSafe(save));
  expect(serialized).not.toMatch(/"findItemFinds"|"findItem"|"corpses"/);
  await importIntoStores(serialized);
  expect(usePlayerStore.getState().player).toEqual(save.player);
  expect(useInventoryStore.getState().backpack).toEqual(save.inventory.backpack);
  expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
  expect(useCombatStore.getState().recordedEvents).toEqual([]);
});
