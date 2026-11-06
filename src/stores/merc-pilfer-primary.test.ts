import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Replace durable I/O only; native factories, simulation, receipts and payout remain real.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { loadMercPool } from '@/data/loaders/mercs';
import { loadAwardPools } from '@/data/loaders/loot';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { CombatUnit } from '@/engine/combat/types';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import { createRng } from '@/engine/rng';
import * as loot from '@/engine/loot/award';
import { mergeRewards } from '@/engine/loot/reward-plan';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun } from './combatHelpers';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { __resetPersistenceForTests } from './persistence';

const PILFER = 'mskill-pilfer', SEED = 7;
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function owned() {
  const def = loadMercPool().pool.find(row => row.id === 'mercs/tavern-thief-pickpocket');
  if (!def) throw new Error('Missing actual Pickpocket');
  return createMercFromDef(def, 'pilfer-primary');
}
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
function fixture(rank: number): CombatSnapshot {
  const native = mercToCombatUnit(owned());
  const merc: CombatUnit = { ...native, life: 10000, mana: 0,
    skillLevels: { [PILFER]: rank }, stats: { ...native.stats, life: 10000, lifeMax: 10000,
      mana: 0, manaMax: 0, attack: 1, attackSpeed: 263, critChance: 0, physDodge: 0, magicDodge: 0 } };
  const enemy: CombatUnit = { ...merc, id: 'fixture-pilfer-enemy', name: 'fixture', side: 'enemy', kind: 'monster',
    skillOrder: [], skillLevels: {}, life: 80, attackRange: [1, 1],
    stats: { ...merc.stats, life: 80, lifeMax: 80, attack: 1, attackSpeed: 100, defense: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { seed: SEED, playerTeam: [merc], enemyTeam: [enemy] };
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
beforeEach(() => { reset(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000); });
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); });

it.each([1, 20])('actual pool/factory Pilfer pays once per wave and produces exactly30 find points at rank%i', rank => {
  const input = fixture(rank), before = structuredClone(input), out = runBattleRecorded(input);
  expect(out.result.winner).toBe('player');
  const actions = out.events.filter(event => event.kind === 'action' && event.actor === input.playerTeam[0]?.id &&
    event.skillId === PILFER);
  expect(actions.length).toBeGreaterThan(1);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(out.result).toHaveProperty('mercPilferGoldFind', 30);
  expect(out.result.playerTeam[0]?.stats).toEqual(input.playerTeam[0]?.stats);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
});

it.each([0, 50])('credits the native wave inventory with +30 additive shard-find points over hero find%i', heroFind => {
  registerSkill({ id: 'fixture.pilfer-primary-finisher', archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 0, effects: [
      { kind: 'damage', damageType: 'physical', base: [100000, 100000], alwaysHits: true }
    ] });
  const hero = createMockPlayer('Synthetic Pilfer primary', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, comboOrder: ['fixture.pilfer-primary-finisher'],
    derivedStats: { ...hero.derivedStats, goldFind: heroFind } });
  // Imported survivor stats isolate native mechanics; no earned progression is claimed.
  const native = owned();
  useMercStore.getState().addMerc({ ...native, level: 30,
    derivedStats: { ...native.derivedStats, life: 10000, lifeMax: 10000, attackSpeed: 263, critChance: 0 } });
  useMercStore.getState().setFieldedMerc(native.id);
  const realRoll = loot.rollKillRewards, generation = vi.spyOn(loot, 'rollKillRewards');
  expect(startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', act: 1,
    runSeed: SEED, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
  const first = useCombatStore.getState(), issued = inspectRecordedWaves().currentPublished;
  if (!issued || !first.outcome) throw new Error('Missing real published wave');
  expect(first.outcome.winner).toBe('player');
  expect(first.recordedEvents).toContainEqual(expect.objectContaining({ kind: 'action',
    actor: `merc-${native.id}`, skillId: PILFER }));
  expect(generation).not.toHaveBeenCalled();
  const before = useInventoryStore.getState();
  drain(); expect(useInventoryStore.getState()).toBe(before);
  expect(advanceWaveOrFinish()).toBe('next-wave');
  const slain = first.outcome.finalEnemyTeam.filter(enemy => enemy.life <= 0 && enemy.kind !== 'summon');
  expect(slain.length).toBeGreaterThan(0);
  expect(generation).toHaveBeenCalledTimes(slain.length);
  const rng = createRng((SEED ^ 0x9e3779b1) >>> 0), pools = loadAwardPools();
  const tc = issued.binding.candidateRun.plan.waves[0]?.lootTable ?? issued.binding.candidateRun.plan.defaultLootTable;
  const expected = mergeRewards(...slain.map(enemy => realRoll({ tier: enemy.tier, monsterLevel: enemy.level,
    treasureClassId: tc, magicFind: hero.derivedStats.magicFind, magicFindMultiplier: 1,
    goldFind: heroFind + 30, act: 1, difficulty: 'normal' }, pools, rng)));
  const actual = useInventoryStore.getState();
  expect((actual.currencies['rune-shard'] ?? 0) - (before.currencies['rune-shard'] ?? 0)).toBe(expected.runeShards);
  for (const [input] of generation.mock.calls) expect(input.goldFind).toBe(heroFind + 30);
  expect(actual.materials).toEqual(expected.materials);
  expect((actual.currencies.wishstone ?? 0) - (before.currencies.wishstone ?? 0)).toBe(expected.wishstones);
  expect(actual.currencies.gold ?? 0).toBe(0);
  const withoutIds = (bag: loot.KillRewards) => ({ ...bag, items: bag.items.map(({ id: _id, ...item }) => item) });
  expect(withoutIds(useCombatStore.getState().runRewards)).toEqual(withoutIds(expected));
  expect(advanceWaveOrFinish()).toBe('idle');
  expect(useInventoryStore.getState()).toBe(actual);
});
