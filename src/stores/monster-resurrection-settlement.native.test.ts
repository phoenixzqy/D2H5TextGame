import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Only durable I/O is replaced. Factories, registry, engine, publication,
// receipts, playback, reward generation and quest settlement remain real.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import * as wavePlanning from '@/engine/combat/sub-area-run';
import type { WavePlan } from '@/engine/combat/sub-area-run';
import * as engine from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import * as loot from '@/engine/loot/award';
import { mergeRewards } from '@/engine/loot/reward-plan';
import { xpForKill, xpTotal } from '@/engine/progression/xp';
import { createRng } from '@/engine/rng';
import { loadAwardPools } from '@/data/loaders/loot';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import * as staging from './recordedWaveStaging';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig,
  resetIdleElitePity, startSubAreaRun } from './combatHelpers';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { RecordedWaveAccessError } from './recordedWaveAccess';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { __resetPersistenceForTests } from './persistence';

const AREA = 'areas/act1-burial-grounds';
const QUEST = 'quests/act1-sisters-burial-grounds';
const FALLEN = 'monsters/act1.fallen';
const SHAMAN = 'monsters/act1.fallen-shaman';
const RAVEN = 'monsters/act1.blood-raven';
const FINISHER = 'fixture.resurrection-settlement-finisher';
const SEED = 7;
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;

// A controlled encounter, not an earned campaign or production-planner claim.
// Real factory rows retain their native IDs, archetypes, levels, tiers and skills.
// Blood Raven supplies the actual authored kill objective; Fallen has no generic
// kill-count quest and must never be treated as granting one on either death.
const PLAN: WavePlan = {
  subAreaId: AREA, defaultLootTable: 'loot/mini-act1', mode: 'manual', seed: SEED,
  waves: [{ id: 'fixture.resurrection-settlement', waveTier: 'boss',
    spawns: [
      { archetypeId: FALLEN, tier: 'trash', level: 1, index: 0 },
      { archetypeId: SHAMAN, tier: 'trash', level: 2, index: 0 },
      { archetypeId: RAVEN, tier: 'boss', level: 9, index: 0 }
    ] }]
};

function reset(): void {
  __resetPersistenceForTests(); abortSubAreaRun(); resetIdleElitePity();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
function published() {
  const issued = inspectRecordedWaves().currentPublished;
  if (!issued) throw new Error('Missing genuine published wave');
  return issued;
}
function drain(): void {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function heroFixture(unit: CombatUnit): CombatUnit {
  return { ...unit, life: 1_000_000, mana: 100, skillOrder: [FINISHER],
    stats: { ...unit.stats, life: 1_000_000, lifeMax: 1_000_000,
      mana: 100, manaMax: 100, attackSpeed: 100 },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1,
      remaining: 8, expiresAtMs: 8000 }] };
}
function enemyFixture(unit: CombatUnit, heroId: string): CombatUnit {
  if (unit.monsterArchetypeId === FALLEN) return { ...unit, life: 1,
    stats: { ...unit.stats, life: 100, lifeMax: 100, defense: 0,
      magicResist: 0, attackSpeed: 100 },
    statuses: [
      { id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 },
      { id: 'ignite', sourceId: heroId, stacks: 1, remaining: 1,
        expiresAtMs: 1000, dotPerStack: 1 }
    ] };
  if (unit.monsterArchetypeId === SHAMAN) return { ...unit, life: 1000,
    stats: { ...unit.stats, life: 1000, lifeMax: 1000 } };
  if (unit.monsterArchetypeId === RAVEN) return { ...unit, life: 1000,
    stats: { ...unit.stats, life: 1000, lifeMax: 1000 },
    statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
  throw new Error('Unexpected controlled encounter member');
}
function withoutIds(bag: loot.KillRewards) {
  return { ...bag, items: bag.items.map(({ id: _id, ...item }) => item) };
}

beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks();
});

it('settles native original rows once after two Fallen deaths, with real quest credit and replay idempotency', () => {
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 0, effects: [
      { kind: 'damage', damageType: 'physical', base: [100_000, 100_000], alwaysHits: true }
    ] });
  const hero = createMockPlayer('Controlled resurrection settlement', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, comboOrder: [FINISHER] });
  useMapStore.getState().setCurrentLocation(1, AREA);
  useMapStore.getState().updateQuestProgress(QUEST, {
    status: 'inProgress', objectives: {}, rewardClaimed: false
  });
  vi.spyOn(wavePlanning, 'resolveChallengeWavePlan').mockImplementation(input => {
    if (input.subArea.id !== AREA || input.seed !== SEED || input.challengeOrdinal !== 0)
      throw new Error('Unexpected controlled encounter request');
    return structuredClone(PLAN);
  });
  // Transform one coherent pre-simulation input. Never edit engine events,
  // terminal winner, final rows, receipt authority or reward-generation results.
  const stage = staging.stageRecordedWave;
  vi.spyOn(staging, 'stageRecordedWave').mockImplementation(input => stage({ ...input,
    snapshot: { ...input.snapshot,
      playerTeam: input.snapshot.playerTeam.map(unit => unit.id === hero.id ? heroFixture(unit) : unit),
      enemyTeam: input.snapshot.enemyTeam.map(unit => enemyFixture(unit, hero.id))
    } }));
  const simulation = vi.spyOn(engine, 'runBattleRecorded');
  const realRoll = loot.rollKillRewards;
  const generation = vi.spyOn(loot, 'rollKillRewards');
  const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
  const kills = vi.spyOn(useMapStore.getState(), 'recordMonsterKills');
  const beforeInventory = useInventoryStore.getState();
  const beforeXp = xpTotal(hero.level) + hero.experience;
  const beforeQuest = useMapStore.getState().questProgress;

  expect(startSubAreaRun({ runSeed: SEED, challengeOrdinal: 0 })?.totalWaves).toBe(1);
  const first = published();
  const originals = first.binding.engineInput.enemyTeam;
  expect(originals.map(unit => unit.monsterArchetypeId)).toEqual([FALLEN, SHAMAN, RAVEN]);
  const body = originals.find(unit => unit.monsterArchetypeId === FALLEN);
  const source = originals.find(unit => unit.monsterArchetypeId === SHAMAN);
  if (!body || !source) throw new Error('Missing native resurrection participants');
  expect(source.skillOrder).toEqual(['monster-fire-bolt', 'monster-resurrect-fallen']);
  const recording = structuredClone(first.binding.recording);
  expect(recording.outcome.winner).toBe('player');
  expect(recording.events.at(-1)).toMatchObject({ kind: 'end', winner: 'player' });
  expect(recording.events.filter(event => event.kind === 'death' && event.target === body.id)).toHaveLength(2);
  expect(recording.events.filter(event => event.kind === 'revive')).toEqual([
    expect.objectContaining({ source: source.id, target: body.id })
  ]);
  expect(recording.outcome.finalEnemyTeam.map(unit => unit.id)).toEqual(originals.map(unit => unit.id));
  expect(recording.outcome.finalEnemyTeam.every(unit => unit.life <= 0)).toBe(true);
  expect(new Set(recording.outcome.finalEnemyTeam.map(unit => unit.id)).size).toBe(3);
  expect(generation).not.toHaveBeenCalled(); expect(xp).not.toHaveBeenCalled();
  expect(kills).not.toHaveBeenCalled();

  // Replay the completed, still-unpaid native recording under the same payment
  // identity. Both simulations must actually win with the same two body deaths.
  drain();
  expect(useInventoryStore.getState()).toBe(beforeInventory);
  expect(useMapStore.getState().questProgress).toBe(beforeQuest);
  const paymentIdentity = first.installation?.settlement.identity;
  expect(paymentIdentity).toBeDefined();
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  const replay = published();
  expect(replay.installation?.settlement.identity).toBe(paymentIdentity);
  expect(replay.binding.recording).toEqual(recording);
  expect(simulation).toHaveBeenCalledTimes(2);
  expect(generation).not.toHaveBeenCalled(); expect(xp).not.toHaveBeenCalled();
  expect(kills).not.toHaveBeenCalled();
  drain();
  expect(advanceWaveOrFinish()).toBe('victory');
  expect(useCombatStore.getState().runVictory).toBe(true);
  expect(published().receipt).toBe(replay.receipt);
  expect(published().installation?.settlement.progress).toEqual({ phase: 'settled', result: 'victory' });

  // Three original rows, not four death events. Distinct original levels make
  // a substituted/duplicate Fallen reward distinguishable from the Shaman's.
  expect(generation).toHaveBeenCalledTimes(originals.length);
  const expectedInputs = originals.map(unit => ({ tier: unit.tier, monsterLevel: unit.level,
    treasureClassId: PLAN.defaultLootTable, magicFind: hero.derivedStats.magicFind,
    magicFindMultiplier: 1, goldFind: hero.derivedStats.goldFind, act: 1 as const,
    difficulty: 'normal' as const }));
  expect(generation.mock.calls.map(([input]) => input)).toEqual(expectedInputs);
  const rng = createRng((SEED ^ 0x9e3779b1) >>> 0);
  const pools = loadAwardPools();
  const expectedRewards = mergeRewards(...expectedInputs.map(input => realRoll(input, pools, rng)));
  const actualRewards = useCombatStore.getState().runRewards;
  expect(withoutIds(actualRewards)).toEqual(withoutIds(expectedRewards));
  expect(actualRewards.runeShards).toBeGreaterThan(0);
  const inventory = useInventoryStore.getState();
  expect(inventory.backpack).toEqual([...beforeInventory.backpack, ...actualRewards.items]);
  expect(inventory.materials).toEqual(actualRewards.materials);
  expect(inventory.currencies['rune-shard'] ?? 0).toBe(actualRewards.runeShards);
  expect(inventory.currencies.wishstone ?? 0).toBe(actualRewards.wishstones);
  const expectedXp = originals.reduce((total, unit) => total + xpForKill(unit.level), 0);
  expect(xp).toHaveBeenCalledTimes(1); expect(xp).toHaveBeenCalledWith(expectedXp);
  const paidHero = usePlayerStore.getState().player;
  if (!paidHero) throw new Error('Missing settled hero');
  expect(xpTotal(paidHero.level) + paidHero.experience - beforeXp).toBe(expectedXp);
  expect(kills).toHaveBeenCalledTimes(1);
  expect(kills).toHaveBeenCalledWith({ actId: 'acts/act1', areaId: AREA,
    archetypeIds: [RAVEN] });
  expect(useMapStore.getState().questProgress[QUEST]).toMatchObject({
    status: 'inProgress', objectives: { 'obj-kill-blood-raven': true }, rewardClaimed: false
  });
  expect(useMapStore.getState().questProgress[QUEST]?.objectives['obj-return']).not.toBe(true);

  const paidPlayer = usePlayerStore.getState();
  const paidMap = useMapStore.getState();
  const paidRewards = useCombatStore.getState().runRewards;
  const calls = generation.mock.calls.length;
  for (let attempt = 0; attempt < 2; attempt++) {
    let refusal: unknown;
    try { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); }
    catch (error) { refusal = error; }
    expect(refusal).toBeInstanceOf(RecordedWaveAccessError);
    expect(refusal).toHaveProperty('code', 'replaySettled');
    useCombatStore.getState().advanceEvent();
    expect(advanceWaveOrFinish()).toBe('idle');
  }
  expect(published().receipt).toBe(replay.receipt);
  expect(published().installation?.settlement.identity).toBe(paymentIdentity);
  expect(published().installation?.settlement.progress).toEqual({ phase: 'settled', result: 'victory' });
  expect(useInventoryStore.getState()).toBe(inventory);
  expect(usePlayerStore.getState()).toBe(paidPlayer);
  expect(useMapStore.getState()).toBe(paidMap);
  expect(useCombatStore.getState().runRewards).toBe(paidRewards);
  expect(generation).toHaveBeenCalledTimes(calls);
  expect(xp).toHaveBeenCalledTimes(1); expect(kills).toHaveBeenCalledTimes(1);
});
