/** Whole-wave preparation and synchronous all-domain settlement restoration. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as award from '@/engine/loot/award';
import * as loot from '@/data/loaders/loot';
import { materialCatalog, materialEconomy } from '@/data/loaders/materials';
import { createRng } from '@/engine/rng';
import { __resetRollItemSeqForTests } from '@/engine/loot/rollItem';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { abortSubAreaRun, advanceWaveOrFinish, awardLootForVictory, createSimpleEnemy, startSubAreaRun } from './combatHelpers';
import { combatRunLifecycle } from './combatRunLifecycle';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useMercStore } from './mercStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMetaStore } from './metaStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { getIdleEliteMisses, setIdleEliteMisses } from './idleElitePity';
import { assertWaveSnapshotAllowed } from './waveTransitionGuard';
import { DEFAULT_LOOT_FILTER } from '@/engine/loot/filter';

const stores = [usePlayerStore, useMercStore, useInventoryStore, useMapStore, useCombatStore] as const;
const reward = (): award.KillRewards => ({ items: [], runeShards: 3, wishstones: 2,
  runes: 1, gems: 1, materials: { 'runes/el': 1, 'gems/ruby/chipped': 1 } });
const gearReward = (): award.KillRewards => ({ ...reward(), items: [{ id: 'staged-loot',
  baseId: 'items/base/helm-cap', rarity: 'normal', level: 1, identified: true, equipped: false }] });

function drain() {
  for (const _event of useCombatStore.getState().recordedEvents) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function wonWave(final = false, mode: 'manual' | 'idle' = 'idle') {
  const handle = startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', runSeed: 7, mode, challengeOrdinal: 0 });
  if (!handle) throw new Error('Missing settlement fixture');
  if (final) for (let i = 1; i < handle.totalWaves; i++) { drain(); expect(advanceWaveOrFinish()).toBe('next-wave'); }
  drain();
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
}
function wonGoblinWave() {
  const handle = startSubAreaRun({ subAreaId: 'areas/act1-cold-plains', runSeed: 7, mode: 'manual', challengeOrdinal: 0 });
  if (!handle) throw new Error('Missing native goblin run');
  let run = combatRunLifecycle.activeRun;
  while (run && run.plan.waves[run.waveIdx]?.lootTable !== 'loot/treasure-goblin') {
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    run = combatRunLifecycle.activeRun;
  }
  if (!run) throw new Error('Missing native treasure wave');
  expect(run.plan.waves[run.waveIdx]?.spawns).toHaveLength(1);
  drain();
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
}
/** Use a real successful wishstone seed while retaining native loot and settlement. */
function goblinWishstoneHit() {
  const roll = award.rollKillRewards;
  const wishRng = createRng(7);
  expect(wishRng.chance(.025)).toBe(true);
  expect(wishRng.nextInt(1, 3)).toBe(1);
  vi.spyOn(award, 'rollKillRewards').mockImplementation((input, pools, rng, wishstoneRng) =>
    roll(input, pools, rng, input.treasureClassId === 'loot/treasure-goblin' ? createRng(7) : wishstoneRng));
}
function wonBurialWave(tier: 'champion' | 'rare-elite' | 'boss') {
  registerSkill({ id: 'fixture.promoted-finisher', archetype: 'fixture', target: 'all-enemies', cooldown: 1,
    manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [100_000, 100_000], alwaysHits: true }] });
  const hero = usePlayerStore.getState().player;
  if (!hero) throw new Error('Missing fixture hero');
  usePlayerStore.getState().setPlayer({ ...hero, coreStats: { ...hero.coreStats, vitality: 500 },
    comboOrder: ['fixture.promoted-finisher'] });
  const handle = startSubAreaRun({ subAreaId: 'areas/act1-burial-grounds', runSeed: 7, mode: 'manual', challengeOrdinal: 0 });
  if (!handle) throw new Error('Missing promoted native run');
  let run = combatRunLifecycle.activeRun;
  while (run && !run.plan.waves[run.waveIdx]?.spawns.some(spawn => spawn.tier === tier)) {
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    run = combatRunLifecycle.activeRun;
  }
  if (!run) throw new Error('Missing promoted native wave');
  const wave = run.plan.waves[run.waveIdx];
  expect(wave?.lootTable ?? run.plan.defaultLootTable).toBe(tier === 'boss' ? 'loot/mini-act1' : 'loot/trash-act1');
  expect(wave?.spawns.filter(spawn => spawn.tier === tier).every(spawn => spawn.level >= 4)).toBe(true);
  drain(); expect(useCombatStore.getState().outcome?.winner).toBe('player');
}
function snapshot() {
  return { states: stores.map(store => store.getState()), run: combatRunLifecycle.activeRun,
    runData: structuredClone(combatRunLifecycle.activeRun), pity: getIdleEliteMisses() };
}
function restored(before: ReturnType<typeof snapshot>) {
  stores.forEach((store, index) => { expect(store.getState()).toEqual(before.states[index]); });
  expect(combatRunLifecycle.activeRun).toBe(before.run);
  expect(combatRunLifecycle.activeRun).toEqual(before.runData);
  expect(getIdleEliteMisses()).toBe(before.pity);
}
function closed(error: unknown) {
  const current = inspectRecordedWaves().currentPublished;
  expect(current?.installation?.settlement.progress).toMatchObject({ phase: 'settlementFailed', failure: { error } });
  const held = inspectRecordedWaves();
  expect(advanceWaveOrFinish).toThrow('settlementFailed');
  expect(inspectRecordedWaves()).toBe(held);
  expect(assertWaveSnapshotAllowed).not.toThrow();
}

beforeEach(() => {
  abortSubAreaRun();
  for (const store of [...stores, useMetaStore, useFormationStore]) store.getState().reset();
  loadDefaultSkills();
  registerSkill({ id: 'fixture.atomic-finisher', archetype: 'fixture', target: 'all-enemies', cooldown: 1,
    manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [100_000, 100_000] }] });
  const hero = createMockPlayer('Atomic settlement', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, comboOrder: ['fixture.atomic-finisher'] });
  useMercStore.getState().addMerc({ ...hero, id: 'atomic-merc', type: 'mercenary', classId: 'rogue',
    archetype: 'back', rarity: 'R', comboOrder: [], equipment: [] });
  useMercStore.getState().setFieldedMerc('atomic-merc');
  useHydrationStore.getState().setStatus('ready');
  setIdleEliteMisses(9);
});
afterEach(() => {
  vi.restoreAllMocks(); abortSubAreaRun(); resetRegistry(); setIdleEliteMisses(0);
  __resetRollItemSeqForTests();
  useHydrationStore.getState().setStatus('idle');
});

describe('native whole-wave reward transaction', () => {
  it('applies the selected loot rule consistently to inventory and run rewards', () => {
    wonWave();
    useMetaStore.getState().updateSettings({ lootFilter: { ...DEFAULT_LOOT_FILTER, enabled: true,
      actions: { ...DEFAULT_LOOT_FILTER.actions, normal: 'salvage' } } });
    let ordinal = 0;
    const first = gearReward().items[0];
    if (!first) throw new Error('Missing fixture gear');
    vi.spyOn(award, 'rollKillRewards').mockImplementation(() => ({ ...gearReward(),
      items: [{ ...first, id: `filtered-${String(++ordinal)}` }] }));
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(ordinal).toBeGreaterThan(0);
    expect(useInventoryStore.getState().backpack).toEqual([]);
    expect(useInventoryStore.getState().materials['materials/scrap']).toBe(ordinal);
    expect(useCombatStore.getState().runRewards).toMatchObject({ items: [],
      materials: { 'materials/scrap': ordinal } });
  });

  it('rejects salvage overflow before publishing any native wave reward', () => {
    wonWave();
    useMetaStore.getState().updateSettings({ lootFilter: { ...DEFAULT_LOOT_FILTER, enabled: true,
      actions: { ...DEFAULT_LOOT_FILTER.actions, normal: 'salvage' } } });
    useInventoryStore.setState({ materials: { 'materials/scrap': Number.MAX_SAFE_INTEGER } });
    vi.spyOn(award, 'rollKillRewards').mockReturnValue(gearReward());
    const before = snapshot();
    expect(advanceWaveOrFinish).toThrow();
    restored(before);
  });

  it('publishes actual ordinary-monster rewards into inventory with at most one equipment item per kill', () => {
    wonWave(false, 'manual');
    const roll = vi.spyOn(award, 'rollKillRewards');
    const before = useInventoryStore.getState().backpack.length;
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(roll.mock.calls.length).toBeGreaterThan(0);
    for (const [index, [input]] of roll.mock.calls.entries()) {
      expect(input.tier).toBe('trash'); expect(input.treasureClassId).toBe('loot/trash-act1');
      expect(input.difficulty).toBe('normal');
      const entry = roll.mock.results[index];
      if (entry?.type !== 'return') throw new Error('Missing ordinary-monster reward');
      const result: award.KillRewards = entry.value;
      expect(result.items.length).toBeLessThanOrEqual(1);
      expect(result.items.every(item => item.ilvl === input.monsterLevel)).toBe(true);
    }
    const items = roll.mock.results.flatMap(entry => entry.type === 'return' ? entry.value.items : []);
    expect(items.length).toBeGreaterThan(0);
    expect(useInventoryStore.getState().backpack.slice(before)).toEqual(items);
  });

  it('refuses missing ordinary-monster equipment before XP or inventory effects', () => {
    wonWave(false, 'manual');
    const pools = loot.loadAwardPools(), treasureClasses = new Map(pools.treasureClasses);
    treasureClasses.delete('loot/trash-act1');
    vi.spyOn(loot, 'loadAwardPools').mockReturnValue({ ...pools, treasureClasses });
    const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    const mercXp = vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded');
    const before = snapshot();
    expect(advanceWaveOrFinish).toThrow('Missing nonboss loot table');
    expect(xp).not.toHaveBeenCalled(); expect(mercXp).not.toHaveBeenCalled(); restored(before);
    const progress = inspectRecordedWaves().currentPublished?.installation?.settlement.progress;
    if (progress?.phase !== 'settlementFailed') throw new Error('Missing ordinary-monster refusal');
    expect(Object.hasOwn(progress.failure, 'preparedRewards')).toBe(false); closed(progress.failure.error);
  });

  it('restores ordinary-monster rewards and all domains after inventory publication mutates then throws', () => {
    wonWave(false, 'manual');
    const error = new Error('Ordinary-monster inventory publication');
    let stop: () => void = () => undefined;
    stop = useInventoryStore.subscribe(() => { stop(); throw error; });
    const before = snapshot();
    try { expect(advanceWaveOrFinish).toThrow(error); } finally { stop(); }
    restored(before); closed(error);
    const progress = inspectRecordedWaves().currentPublished?.installation?.settlement.progress;
    if (progress?.phase !== 'settlementFailed') throw new Error('Missing ordinary-monster restoration');
    expect(progress.failure.preparedRewards?.items.length).toBeGreaterThan(0);
  });

  it('publishes the actual Blood Raven miniboss bag into inventory', () => {
    wonBurialWave('boss');
    const roll = vi.spyOn(award, 'rollKillRewards');
    const before = useInventoryStore.getState().backpack.length;
    expect(advanceWaveOrFinish()).toBe('victory');
    const pools = loot.loadAwardPools();
    const result = roll.mock.calls.flatMap(([input], index) => {
      if (input.tier !== 'boss') return [];
      expect(input.treasureClassId).toBe('loot/mini-act1');
      const entry = roll.mock.results[index];
      if (entry?.type !== 'return') throw new Error('Missing miniboss rewards');
      const rewards: award.KillRewards = entry.value;
      expect([4, 5]).toContain(rewards.items.length);
      expect(pools.bases.get(rewards.items[3]?.baseId ?? '')?.type).toBe('jewelry');
      expect(rewards.items.every(item => item.ilvl === input.monsterLevel)).toBe(true);
      expect(rewards.runes).toBe(1); expect(rewards.gems).toBe(1);
      return rewards.items;
    });
    expect(result.length).toBeGreaterThanOrEqual(4);
    expect(useInventoryStore.getState().backpack.slice(before)).toEqual(
      roll.mock.results.flatMap(entry => entry.type === 'return' ? entry.value.items : []));
  });

  it('refuses invalid miniboss jewelry before XP or inventory effects', () => {
    wonBurialWave('boss');
    const pools = loot.loadAwardPools(), treasureClasses = new Map(pools.treasureClasses);
    const source = treasureClasses.get('loot/trash-act1');
    if (!source) throw new Error('Missing fixture source');
    treasureClasses.set('loot/jewelry-act1', source);
    vi.spyOn(loot, 'loadAwardPools').mockReturnValue({ ...pools, treasureClasses });
    const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    const mercXp = vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded');
    const before = snapshot();
    expect(advanceWaveOrFinish).toThrow('Invalid miniboss jewelry source');
    expect(xp).not.toHaveBeenCalled(); expect(mercXp).not.toHaveBeenCalled(); restored(before);
    const progress = inspectRecordedWaves().currentPublished?.installation?.settlement.progress;
    if (progress?.phase !== 'settlementFailed') throw new Error('Missing miniboss refusal');
    expect(Object.hasOwn(progress.failure, 'preparedRewards')).toBe(false); closed(progress.failure.error);
  });

  it('restores all miniboss rewards after inventory publication mutates then throws', () => {
    wonBurialWave('boss');
    const error = new Error('Miniboss inventory publication');
    let stop: () => void = () => undefined;
    stop = useInventoryStore.subscribe(() => { stop(); throw error; });
    const before = snapshot();
    try { expect(advanceWaveOrFinish).toThrow(error); } finally { stop(); }
    restored(before); closed(error);
    const progress = inspectRecordedWaves().currentPublished?.installation?.settlement.progress;
    if (progress?.phase !== 'settlementFailed') throw new Error('Missing miniboss restoration');
    const pools = loot.loadAwardPools();
    expect(progress.failure.preparedRewards?.items.some(item => pools.bases.get(item.baseId)?.type === 'jewelry')).toBe(true);
  });

  it.each(['champion', 'rare-elite'] as const)('publishes actual %s rewards under the shared ordinary wave table', tier => {
    wonBurialWave(tier);
    const roll = vi.spyOn(award, 'rollKillRewards');
    const before = useInventoryStore.getState().backpack.length;
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const pools = loot.loadAwardPools();
    const promoted = roll.mock.calls.flatMap(([input], index) => {
      const result = roll.mock.results[index];
      if (input.tier !== tier || result?.type !== 'return') return [];
      expect(input.treasureClassId).toBe('loot/trash-act1');
      const rewards = result.value;
      expect(rewards.items.length).toBeLessThanOrEqual(tier === 'champion' ? 2 : 4);
      expect(rewards.items.every(item => item.ilvl === input.monsterLevel)).toBe(true);
      if (tier === 'rare-elite') {
        expect(rewards.items.length).toBeGreaterThanOrEqual(1);
        expect(pools.bases.get(rewards.items.at(-1)?.baseId ?? '')?.type).toBe('jewelry');
      }
      return rewards.items;
    });
    expect(promoted.length).toBeGreaterThan(0);
    expect(useInventoryStore.getState().backpack.slice(before)).toEqual(
      roll.mock.results.flatMap(result => result.type === 'return' ? result.value.items : []));
  });

  it('refuses invalid promoted jewelry before any XP or inventory effects', () => {
    wonBurialWave('rare-elite');
    const pools = loot.loadAwardPools(), treasureClasses = new Map(pools.treasureClasses);
    const source = treasureClasses.get('loot/trash-act1');
    if (!source) throw new Error('Missing fixture source');
    treasureClasses.set('loot/jewelry-act1', source);
    vi.spyOn(loot, 'loadAwardPools').mockReturnValue({ ...pools, treasureClasses });
    const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    const mercXp = vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded');
    const before = snapshot();
    expect(advanceWaveOrFinish).toThrow('Invalid nonboss jewelry source');
    expect(xp).not.toHaveBeenCalled(); expect(mercXp).not.toHaveBeenCalled(); restored(before);
    const progress = inspectRecordedWaves().currentPublished?.installation?.settlement.progress;
    if (progress?.phase !== 'settlementFailed') throw new Error('Missing promoted refusal');
    expect(Object.hasOwn(progress.failure, 'preparedRewards')).toBe(false); closed(progress.failure.error);
  });

  it('restores promoted rewards and all domains after inventory publication mutates then throws', () => {
    wonBurialWave('rare-elite');
    const error = new Error('Promoted inventory publication');
    let stop: () => void = () => undefined;
    stop = useInventoryStore.subscribe(() => { stop(); throw error; });
    const before = snapshot();
    try { expect(advanceWaveOrFinish).toThrow(error); } finally { stop(); }
    restored(before); closed(error);
    const progress = inspectRecordedWaves().currentPublished?.installation?.settlement.progress;
    if (progress?.phase !== 'settlementFailed') throw new Error('Missing promoted restoration');
    const pools = loot.loadAwardPools();
    expect(progress.failure.preparedRewards?.items.some(item => pools.bases.get(item.baseId)?.type === 'jewelry')).toBe(true);
  });

  it('settles exactly one real Cold Plains goblin bundle into inventory', () => {
    wonGoblinWave();
    goblinWishstoneHit();
    const before = useInventoryStore.getState();
    expect(advanceWaveOrFinish()).toBe('victory');
    const inventory = useInventoryStore.getState();
    // One kill wishstone plus the existing five-wish first area clear.
    expect((inventory.currencies.wishstone ?? 0) - (before.currencies.wishstone ?? 0)).toBe(6);
    const items = inventory.backpack.slice(before.backpack.length);
    expect(items).toHaveLength(6);
    expect(['rare', 'set', 'unique']).toContain(items.at(-1)?.rarity);
    expect(items.every(item => item.ilvl === 9)).toBe(true);
    const added = Object.entries(inventory.materials).map(([id, count]) => [id, count - (before.materials[id] ?? 0)] as const);
    const runes = added.filter(([id]) => materialCatalog.get(id)?.kind === 'rune').reduce((sum, [, count]) => sum + count, 0);
    const gems = added.filter(([id]) => materialCatalog.get(id)?.kind === 'gem').reduce((sum, [, count]) => sum + count, 0);
    expect(runes).toBeGreaterThanOrEqual(1); expect(runes).toBeLessThanOrEqual(4);
    expect(gems).toBeGreaterThanOrEqual(5); expect(gems).toBeLessThanOrEqual(10);
  });

  it.each(['missing source', 'missing base'] as const)('refuses a goblin %s before XP or inventory effects', fault => {
    wonGoblinWave();
    const pools = loot.loadAwardPools();
    const treasureClasses = new Map(pools.treasureClasses);
    if (fault === 'missing source') treasureClasses.delete('loot/treasure-goblin');
    vi.spyOn(loot, 'loadAwardPools').mockReturnValue({ ...pools, treasureClasses,
      ...(fault === 'missing base' ? { bases: new Map() } : {}) });
    const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    const mercXp = vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded');
    const before = snapshot();
    expect(advanceWaveOrFinish).toThrow(fault === 'missing source'
      ? 'Missing treasure-goblin equipment source' : 'Incomplete reward materialization');
    expect(xp).not.toHaveBeenCalled(); expect(mercXp).not.toHaveBeenCalled();
    restored(before);
    const progress = inspectRecordedWaves().currentPublished?.installation?.settlement.progress;
    if (progress?.phase !== 'settlementFailed') throw new Error('Missing goblin refusal');
    expect(Object.hasOwn(progress.failure, 'preparedRewards')).toBe(false);
    closed(progress.failure.error);
  });

  it('restores a complete real goblin bag when inventory publication mutates then throws', () => {
    wonGoblinWave();
    goblinWishstoneHit();
    const error = new Error('Goblin inventory publication');
    let stop: () => void = () => undefined;
    stop = useInventoryStore.subscribe(() => { stop(); throw error; });
    const before = snapshot();
    try { expect(advanceWaveOrFinish).toThrow(error); } finally { stop(); }
    restored(before); closed(error);
    const progress = inspectRecordedWaves().currentPublished?.installation?.settlement.progress;
    if (progress?.phase !== 'settlementFailed') throw new Error('Missing goblin restoration');
    expect(progress.failure.preparedRewards?.items).toHaveLength(6);
    expect(progress.failure.preparedRewards?.gems).toBeGreaterThanOrEqual(5);
    expect(progress.failure.preparedRewards?.wishstones).toBe(6);
  });

  it('finishes all loot generation before any earned effect and refuses a late generation error', () => {
    wonWave(); const error = new Error('second enemy generation');
    const roll = vi.spyOn(award, 'rollKillRewards').mockReturnValueOnce(gearReward()).mockImplementationOnce(() => { throw error; });
    const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    const before = snapshot();
    expect(advanceWaveOrFinish).toThrow(error);
    expect(roll).toHaveBeenCalledTimes(2); expect(xp).not.toHaveBeenCalled();
    restored(before); closed(error);
    expect(roll).toHaveBeenCalledTimes(2);
    const progress = inspectRecordedWaves().currentPublished?.installation?.settlement.progress;
    if (progress?.phase !== 'settlementFailed') throw new Error('Missing generation failure');
    expect(Object.hasOwn(progress.failure, 'preparedRewards')).toBe(false);
  });

  it.each(['invalid material', 'material overflow', 'run summary overflow'] as const)('preflights %s before XP or publication', fault => {
    wonWave();
    if (fault === 'material overflow') useInventoryStore.setState({ materials: { 'runes/el': Number.MAX_SAFE_INTEGER } });
    if (fault === 'run summary overflow') useCombatStore.setState(state => ({ runRewards: {
      ...state.runRewards, materials: { 'runes/el': Number.MAX_SAFE_INTEGER } } }));
    vi.spyOn(award, 'rollKillRewards').mockReturnValue(fault === 'invalid material'
      ? { ...reward(), materials: { 'runes/unknown': 1 } } : reward());
    const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    const mercXp = vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded');
    const before = snapshot();
    expect(advanceWaveOrFinish).toThrow();
    expect(xp).not.toHaveBeenCalled(); expect(mercXp).not.toHaveBeenCalled(); restored(before);
    expect(advanceWaveOrFinish).toThrow('settlementFailed');
  });

  it.each(['player', 'merc', 'inventory', 'combat', 'map'] as const)('restores every participating domain after %s mutates then throws', domain => {
    wonWave(domain === 'map');
    vi.spyOn(award, 'rollKillRewards').mockReturnValue(reward());
    const error = new Error(`${domain} publication`);
    let stop: () => void = () => undefined;
    if (domain === 'inventory') stop = useInventoryStore.subscribe(() => { stop(); throw error; });
    else if (domain === 'player') {
      const original = usePlayerStore.getState().gainExperience;
      vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementation(amount => { original(amount); throw error; });
    } else if (domain === 'merc') {
      const original = useMercStore.getState().shareExperienceWithFielded;
      vi.spyOn(useMercStore.getState(), 'shareExperienceWithFielded').mockImplementation(amount => { original(amount); throw error; });
    } else if (domain === 'combat') {
      const original = useCombatStore.getState().accumulateRunRewards;
      vi.spyOn(useCombatStore.getState(), 'accumulateRunRewards').mockImplementation(rewards => { original(rewards); throw error; });
    } else {
      const original = useMapStore.getState().markCleared;
      vi.spyOn(useMapStore.getState(), 'markCleared').mockImplementation(id => {
        original(id); throw error;
      });
    }
    const before = snapshot();
    try { expect(advanceWaveOrFinish).toThrow(error); } finally { stop(); }
    restored(before); closed(error);
    const progress = inspectRecordedWaves().currentPublished?.installation?.settlement.progress;
    if (progress?.phase !== 'settlementFailed') throw new Error('Missing failure');
    expect(progress.failure.preparedRewards?.materials['runes/el']).toBeGreaterThan(0);
  });

  it('attempts every restoration, retains rollback errors, and holds the lease through rollback callbacks', () => {
    wonWave(); vi.spyOn(award, 'rollKillRewards').mockReturnValue(reward());
    const cause = new Error('inventory observer'), rollback = new Error('player rollback observer');
    const before = snapshot(); let playerCalls = 0;
    const stopPlayer = usePlayerStore.subscribe(() => {
      playerCalls++;
      expect(advanceWaveOrFinish).toThrow('waveBusy'); expect(assertWaveSnapshotAllowed).toThrow('waveBusy');
      if (playerCalls === 2) throw rollback;
    });
    let stopInventory: () => void = () => undefined;
    stopInventory = useInventoryStore.subscribe(() => { stopInventory(); throw cause; });
    let thrown: unknown;
    try { advanceWaveOrFinish(); } catch (error) { thrown = error; }
    finally { stopPlayer(); stopInventory(); }
    expect(thrown).toBeInstanceOf(AggregateError);
    expect(thrown).toMatchObject({ cause, errors: [rollback] });
    if (!(thrown instanceof AggregateError)) throw new Error('Missing restoration aggregate');
    expect(thrown.cause).toBe(cause); expect(thrown.errors[0]).toBe(rollback);
    expect(playerCalls).toBe(2); restored(before); closed(thrown);
  });

  it('credits concrete materials once without folding descriptive totals into shards', () => {
    wonWave(); const roll = vi.spyOn(award, 'rollKillRewards').mockReturnValue(reward());
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const count = roll.mock.calls.length;
    expect(count).toBeGreaterThan(0);
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/el': count, 'gems/ruby/chipped': count });
    expect(useInventoryStore.getState().currencies).toEqual({ 'rune-shard': 3 * count, wishstone: 2 * count });
    expect(useCombatStore.getState().runRewards).toEqual({ items: [], runeShards: 3 * count,
      wishstones: 2 * count, runes: count, gems: count, materials: { 'runes/el': count, 'gems/ruby/chipped': count } });
  });

  it('preserves inventory changes published by an XP observer without rerolling the prepared bag', () => {
    wonWave(); const roll = vi.spyOn(award, 'rollKillRewards').mockReturnValue(reward());
    const observerItem = gearReward().items[0];
    if (!observerItem) throw new Error('Missing observer gear fixture');
    let stop: () => void = () => undefined;
    stop = usePlayerStore.subscribe(() => {
      stop();
      useInventoryStore.setState({ backpack: [observerItem],
        currencies: { 'legacy-balance': 42, 'rune-shard': 7 }, materials: { 'runes/el': 4 } });
    });
    try { expect(advanceWaveOrFinish()).toBe('next-wave'); } finally { stop(); }
    const count = useCombatStore.getState().runRewards.runes;
    expect(roll).toHaveBeenCalledTimes(count);
    expect(useInventoryStore.getState().backpack).toEqual([observerItem]);
    expect(useInventoryStore.getState().currencies).toEqual({ 'legacy-balance': 42,
      'rune-shard': 7 + 3 * count, wishstone: 2 * count });
    expect(useInventoryStore.getState().materials).toEqual({ 'runes/el': 4 + count, 'gems/ruby/chipped': count });
  });

  it.each(['material', 'currency'] as const)('rolls back if an XP observer creates destination %s overflow after preflight', kind => {
    wonWave(); const roll = vi.spyOn(award, 'rollKillRewards').mockReturnValue(reward());
    const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    const before = snapshot(); let stop: () => void = () => undefined;
    stop = usePlayerStore.subscribe(() => {
      stop();
      useInventoryStore.setState(kind === 'material'
        ? { materials: { 'runes/el': Number.MAX_SAFE_INTEGER } }
        : { currencies: { 'rune-shard': Number.MAX_SAFE_INTEGER } });
    });
    let caught: unknown;
    try { advanceWaveOrFinish(); } catch (error) { caught = error; } finally { stop(); }
    expect(caught).toBeInstanceOf(Error); expect(xp).toHaveBeenCalledTimes(1);
    const rolls = roll.mock.calls.length;
    restored(before); closed(caught); expect(roll).toHaveBeenCalledTimes(rolls);
  });

  it('reports an unsuccessful rollback without skipping the other domains or reopening payout', () => {
    wonWave(); vi.spyOn(award, 'rollKillRewards').mockReturnValue(reward());
    const cause = new Error('grant observer'), rollback = new Error('player restore refused');
    const before = snapshot();
    const playerBefore = usePlayerStore.getState().player;
    let stop: () => void = () => undefined;
    stop = useInventoryStore.subscribe(() => { stop(); throw cause; });
    vi.spyOn(usePlayerStore, 'setState').mockImplementationOnce(() => { throw rollback; });
    let thrown: unknown;
    try { advanceWaveOrFinish(); } catch (error) { thrown = error; } finally { stop(); }
    expect(thrown).toMatchObject({ cause, errors: [rollback] });
    expect(usePlayerStore.getState().player).not.toEqual(playerBefore);
    stores.slice(1).forEach((store, index) => { expect(store.getState()).toEqual(before.states[index + 1]); });
    expect(getIdleEliteMisses()).toBe(before.pity); closed(thrown);
  });

  it('retains independent immutable complete generation evidence without changing installed authority', () => {
    wonWave();
    const generatedValues = new Map([['statMods.attack', 2]]);
    const generated = { ...reward(), items: [{ id: 'evidence-item', baseId: 'items/base/helm-cap', rarity: 'magic' as const,
      level: 1, equipped: false, identified: true, affixes: [{ affixId: 'fixture', values: generatedValues }] }] };
    vi.spyOn(award, 'rollKillRewards').mockReturnValueOnce(generated).mockReturnValue(reward());
    const before = inspectRecordedWaves().currentPublished;
    const cause = new Error('after prepared');
    vi.spyOn(usePlayerStore.getState(), 'gainExperience').mockImplementationOnce(() => { throw cause; });
    expect(advanceWaveOrFinish).toThrow(cause);
    const failed = inspectRecordedWaves().currentPublished;
    expect(failed?.receipt).toBe(before?.receipt); expect(failed?.binding).toBe(before?.binding);
    const progress = failed?.installation?.settlement.progress;
    if (progress?.phase !== 'settlementFailed' || !progress.failure.preparedRewards) throw new Error('Missing reward evidence');
    const evidence = progress.failure.preparedRewards;
    Reflect.set(generated.materials, 'runes/el', 12);
    generatedValues.set('statMods.attack', 99);
    expect(evidence.materials['runes/el']).not.toBe(12);
    const affix = evidence.items[0]?.affixes?.[0];
    if (!affix || !('values' in affix)) throw new Error('Missing retained gear Map');
    expect(affix.values.get('statMods.attack')).toBe(2);
    expect(() => { Reflect.set(evidence.materials, 'runes/el', 20); }).not.toThrow();
    expect(evidence.materials['runes/el']).not.toBe(20);
    expect(() => { (affix.values as Map<string, number>).set('statMods.attack', 20); }).toThrow('immutable');
    closed(cause);
  });

  it('direct victory grants stage every enemy and restore a mutate-then-throw inventory write', () => {
    const enemies = [createSimpleEnemy(1, 0), createSimpleEnemy(1, 1)];
    const before = useInventoryStore.getState(), cause = new Error('second roll');
    const roll = vi.spyOn(award, 'rollKillRewards').mockReturnValueOnce(gearReward()).mockImplementationOnce(() => { throw cause; });
    const grant = () => awardLootForVictory({ slainEnemies: enemies, act: 1, seed: 1, treasureClassId: 'loot/trash-act1' });
    expect(grant).toThrow(cause); expect(useInventoryStore.getState()).toBe(before);
    roll.mockReturnValue(reward());
    let stop: () => void = () => undefined;
    stop = useInventoryStore.subscribe(() => { stop(); throw cause; });
    try { expect(grant).toThrow(cause); } finally { stop(); }
    expect(useInventoryStore.getState()).toBe(before);
  });

  it('filters a direct combat grant and still rejects a duplicate raw item', () => {
    useMetaStore.getState().updateSettings({ lootFilter: { ...DEFAULT_LOOT_FILTER, enabled: true,
      actions: { ...DEFAULT_LOOT_FILTER.actions, normal: 'discard' } } });
    vi.spyOn(award, 'rollKillRewards').mockReturnValue(gearReward());
    const grant = () => awardLootForVictory({ slainEnemies: [createSimpleEnemy(1, 0)], act: 1,
      seed: 1, treasureClassId: 'loot/trash-act1' });
    expect(grant().items).toEqual([]);
    expect(useInventoryStore.getState().backpack).toEqual([]);
    useInventoryStore.setState({ backpack: [...gearReward().items] });
    const before = useInventoryStore.getState();
    expect(grant).toThrow(/duplicate/i);
    expect(useInventoryStore.getState()).toBe(before);
  });

  it('publishes the real Diablo equipment guarantees and full material bundle together', () => {
    const enemy = { ...createSimpleEnemy(57, 0), tier: 'chapter-boss' as const };
    const input = { act: 4 as const, tier: enemy.tier, monsterLevel: enemy.level,
      treasureClassId: 'loot/act4-boss', magicFind: 0, goldFind: 0 };
    const pools = loot.loadAwardPools();
    const baseline = award.rollKillRewards(input, { ...pools, equipmentGuarantees: new Map() }, createRng(7));
    expect(baseline.items).toHaveLength(10);
    const rewards = awardLootForVictory({ slainEnemies: [enemy], act: 4,
      treasureClassId: input.treasureClassId, seed: 7 });
    const bonus = rewards.items.slice(baseline.items.length);
    expect(rewards.items).toHaveLength(13);
    expect(rewards.items.slice(7, 10).every(item => pools.bases.get(item.baseId)?.type === 'jewelry')).toBe(true);
    expect(bonus).toHaveLength(3);
    expect(bonus.every(item => ['rare', 'set', 'unique'].includes(item.rarity))).toBe(true);
    expect(['set', 'unique']).toContain(bonus.at(-1)?.rarity);
    expect(useInventoryStore.getState().backpack).toEqual(rewards.items);
    expect(useInventoryStore.getState().materials).toEqual(rewards.materials);
    const runes = Object.entries(rewards.materials).filter(([id]) => materialCatalog.get(id)?.kind === 'rune');
    const gems = Object.entries(rewards.materials).filter(([id]) => materialCatalog.get(id)?.kind === 'gem');
    expect(gems.reduce((sum, [, count]) => sum + count, 0)).toBe(5);
    const runeCount = runes.reduce((sum, [, count]) => sum + count, 0);
    expect(runeCount).toBeGreaterThanOrEqual(2);
    expect(runeCount).toBeLessThanOrEqual(3);
    for (const [id] of runes) {
      const ordinal = materialEconomy.runeOrder.indexOf(id) + 1;
      expect(ordinal).toBeGreaterThanOrEqual(18);
      expect(ordinal).toBeLessThanOrEqual(21);
    }
  });

  it('publishes no ordinary or guaranteed items when the required special reward is impossible', () => {
    const pools = loot.loadAwardPools();
    vi.spyOn(loot, 'loadAwardPools').mockReturnValue({ ...pools, uniques: [], setPieces: [] });
    const before = useInventoryStore.getState();
    expect(() => awardLootForVictory({
      slainEnemies: [{ ...createSimpleEnemy(57, 0), tier: 'chapter-boss' }],
      act: 4, treasureClassId: 'loot/act4-boss', seed: 7
    })).toThrow(/materializable/i);
    expect(useInventoryStore.getState()).toBe(before);
  });

  it('leaves inventory untouched when the required boss jewelry source is missing', () => {
    const pools = loot.loadAwardPools();
    const treasureClasses = new Map(pools.treasureClasses);
    treasureClasses.delete('loot/jewelry-act4');
    vi.spyOn(loot, 'loadAwardPools').mockReturnValue({ ...pools, treasureClasses });
    const before = useInventoryStore.getState();
    expect(() => awardLootForVictory({
      slainEnemies: [{ ...createSimpleEnemy(57, 0), tier: 'chapter-boss' }],
      act: 4, treasureClassId: 'loot/act4-boss', seed: 7
    })).toThrow('Missing chapter-boss equipment source');
    expect(useInventoryStore.getState()).toBe(before);
  });

  it('publishes the extra unique with the complete real Diablo reward bag', () => {
    const pools = loot.loadAwardPools();
    const guaranteed = { ...pools, chapterBossUniques: new Map([['loot/act4-boss', { act: 4 as const, chance: 1 }]]) };
    vi.spyOn(loot, 'loadAwardPools').mockReturnValue(guaranteed);
    const rewards = awardLootForVictory({ slainEnemies: [{ ...createSimpleEnemy(61, 0), tier: 'chapter-boss' }],
      act: 4, treasureClassId: 'loot/act4-boss', seed: 7 });
    expect(rewards.items).toHaveLength(14); // 10 ordinary + 3 guarantees + 1 optional.
    const unique = rewards.items.at(-1);
    expect(unique).toMatchObject({ rarity: 'unique', ilvl: 61 });
    expect(pools.uniques?.some(template => template.id === unique?.uniqueId && template.baseId === unique.baseId)).toBe(true);
    expect(useInventoryStore.getState().backpack).toEqual(rewards.items);
    expect(useInventoryStore.getState().materials).toEqual(rewards.materials);
    expect(rewards.gems).toBe(5);
  });

  it('publishes nothing when a successful optional unique has no eligible template', () => {
    const pools = loot.loadAwardPools();
    // Keep real ordinary groups/materials; isolate this optional bonus from rarity guarantees.
    vi.spyOn(loot, 'loadAwardPools').mockReturnValue({ ...pools, uniques: [], equipmentGuarantees: new Map(),
      chapterBossUniques: new Map([['loot/act4-boss', { act: 4, chance: 1 }]]) });
    const before = useInventoryStore.getState();
    expect(() => awardLootForVictory({ slainEnemies: [{ ...createSimpleEnemy(61, 0), tier: 'chapter-boss' }],
      act: 4, treasureClassId: 'loot/act4-boss', seed: 7 })).toThrow('No materializable chapter-boss unique');
    expect(useInventoryStore.getState()).toBe(before);
  });
});
