/** Whole-wave preparation and synchronous all-domain settlement restoration. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as award from '@/engine/loot/award';
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

const stores = [usePlayerStore, useMercStore, useInventoryStore, useMapStore, useCombatStore] as const;
const reward = (): award.KillRewards => ({ items: [], runeShards: 3, wishstones: 2,
  runes: 1, gems: 1, materials: { 'runes/el': 1, 'gems/ruby/chipped': 1 } });
const gearReward = (): award.KillRewards => ({ ...reward(), items: [{ id: 'staged-loot',
  baseId: 'items/base/helm-cap', rarity: 'normal', level: 1, identified: true, equipped: false }] });

function drain() {
  for (const _event of useCombatStore.getState().recordedEvents) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function wonWave(final = false) {
  const handle = startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', runSeed: 7, mode: 'idle', challengeOrdinal: 0 });
  if (!handle) throw new Error('Missing settlement fixture');
  if (final) for (let i = 1; i < handle.totalWaves; i++) { drain(); expect(advanceWaveOrFinish()).toBe('next-wave'); }
  drain();
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
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
  useHydrationStore.getState().setStatus('idle');
});

describe('native whole-wave reward transaction', () => {
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
});
