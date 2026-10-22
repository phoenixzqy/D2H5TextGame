// Imported levels, points, survival gear, wait and finisher are unearned integration
// scaffolding. Real stores, production wave staging and engine; only disk I/O mocked.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { deriveStats } from '@/engine/progression/stats';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { Item } from '@/engine/types/items';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig,
  resetIdleElitePity, startSubAreaRun } from './combatHelpers';
import { inspectRecordedWaves } from './recordedWaveReceipt';
import { armIronGolemSelection, useIronGolemSelectionStore } from './ironGolemSelectionStore';
import { __resetPersistenceForTests } from './persistence';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
const CLAY = 'necromancer.clay_golem', MASTERY = 'necromancer.golem_mastery';
const WAIT = 'fixture.golem-native-wait', FINISH = 'fixture.golem-native-finisher';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function required<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) throw new Error('Missing native Golem fixture');
  return value;
}
const player = () => required(usePlayerStore.getState().player);
const published = () => required(inspectRecordedWaves().currentPublished);
// candidateRun is a live lifecycle cursor; compare only frozen battle evidence.
function frozenWave(binding: ReturnType<typeof published>['binding']) {
  return { input: binding.engineInput, recording: binding.recording, publication: binding.publication };
}
function reset(): void {
  __resetPersistenceForTests(); abortSubAreaRun(); resetIdleElitePity();
  for (const store of stores) store.getState().reset();
}
function arrange(mastery: number): void {
  const coreStats = { strength: 15, dexterity: 25, vitality: 20, energy: 21 };
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Unearned Golem waves', 'necromancer'),
    id: 'golem-native-hero', level: 30, coreStats, derivedStats: deriveStats(coreStats, 30),
    skillPoints: 2, skillLevels: { [CLAY]: 1, ...(mastery ? { [MASTERY]: mastery } : {}) },
    comboOrder: [CLAY, WAIT, FINISH] });
  const cap: Item = { id: 'fixture-golem-native-cap', baseId: 'items/base/helm-cap',
    rarity: 'rare', level: 1, identified: true, equipped: false,
    affixes: [{ affixId: 'fixture-imported-golem-survival', values: new Map([
      ['statMods.life', 1000000], ['statMods.defense', 1000000], ['statMods.mana', 1000],
      ['statMods.attackSpeed', -63], ['statMods.attack', -79], ['statMods.critChance', -0.05]
    ]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  usePlayerStore.getState().setPlayer({ ...player(), derivedStats: {
    ...player().derivedStats, life: 1000, mana: 100 } });
}
function start(): void {
  expect(startSubAreaRun({ act: 1, subAreaId: 'areas/act1-blood-moor', mode: 'manual',
    runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(published().binding.recording.outcome.winner).toBe('player');
}
function drain(): void {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function golem() {
  const summons = published().binding.recording.events.filter(e => e.kind === 'summon');
  expect(summons).toHaveLength(1);
  return required(summons[0]);
}
beforeEach(() => {
  reset(); resetRegistry(); loadDefaultSkills(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
  registerSkill({ id: WAIT, archetype: 'fixture', target: 'self', isBuff: false, cooldown: 4,
    manaCost: 0, minLevel: 1, effects: [{ kind: 'buff', id: WAIT, duration: -1 }] });
  registerSkill({ id: FINISH, archetype: 'fixture', target: 'all-enemies', cooldown: 1,
    manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
});
afterEach(() => {
  reset(); useHydrationStore.getState().setStatus('idle');
  resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks();
});
it('empowers fresh Clay from allocated Mastery through real native wave staging', () => {
  arrange(8); start();
  const event = golem();
  expect(event.unit.life).toBeCloseTo(325.6, 12);
  expect(event.unit.stats.lifeMax).toBeCloseTo(325.6, 12);
  expect(event.unit.stats).toMatchObject({ attack: 24, defense: 34, attackSpeed: 63 });
  expect(published().binding.recording.events.find(e => e.kind === 'action' && e.actor === event.unit.id))
    .toMatchObject({ simClockMs: 1996 });
});

function pools(hero: ReturnType<typeof golem>['unit']) {
  return [hero.life, hero.mana, hero.manaRegenCarry, hero.manaRegenCompensation, hero.manaRegenExactCarry];
}
function expectClay(life: number, period: number): void {
  const binding = published().binding, event = golem();
  expect(event).toMatchObject({ summonId: 'clay_golem', owner: player().id, simClockMs: 0 });
  expect(event.unit.life).toBeCloseTo(life, 12);
  expect(event.unit.stats.lifeMax).toBeCloseTo(life, 12);
  expect(event.unit.stats.life).toBeCloseTo(life, 12);
  expect(event.unit.stats).toMatchObject({ attack: 24, defense: 34 });
  expect(binding.recording.events.find(e => e.kind === 'action' && e.actor === event.unit.id))
    .toMatchObject({ simClockMs: period });
  expect(binding.recording.events.filter(e => e.kind === 'action' && e.skillId === CLAY)).toHaveLength(1);
  expect(binding.recording.events.filter(e => e.kind === 'action' && e.skillId === MASTERY)).toEqual([]);
  expect(binding.recording.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
    .toEqual([expect.objectContaining({ target: player().id, mana: required(binding.engineInput.playerTeam[0]).mana - 15, simClockMs: 0 })]);
}
it.each([
  { rank: 0, life: [220, 233.2, 246.4], period: [2000, 2000, 2000] },
  { rank: 7, life: [312.4, 325.6, 338.8], period: [2000, 1996, 1988] }
])('learns/upgrades Mastery from rank$rank for fresh next-wave summons using exact carried hero resources', fixture => {
  arrange(fixture.rank); start(); expectClay(required(fixture.life[0]), required(fixture.period[0]));
  for (let step = 1; step <= 2; step++) {
    const previous = published().binding, events = useCombatStore.getState().recordedEvents;
    const frozen = structuredClone(frozenWave(previous));
    const finalHero = required(previous.recording.outcome.finalPlayerTeam.find(u => u.id === player().id));
    expect(usePlayerStore.getState().allocateSkillPoint('skills-necromancer-golem-mastery')).toBe('ok');
    expect(player().skillLevels?.[MASTERY]).toBe(fixture.rank + step);
    expect(player().comboOrder).toEqual([CLAY, WAIT, FINISH]);
    refreshActivePlayerCombatConfig();
    expect(published().binding).toBe(previous);
    expect(useCombatStore.getState().recordedEvents).toBe(events);
    expect(frozenWave(previous)).toEqual(frozen);
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    const current = published().binding, hero = required(current.engineInput.playerTeam[0]);
    expect(current.engineInput.playerTeam).toHaveLength(1); // Prior-wave summons are discarded.
    expect(pools(hero)).toEqual(pools(finalHero));
    expect(hero.life).toBeLessThan(hero.stats.lifeMax); // No damaged hero refill.
    expect(current.engineInput.golemMastery).toMatchObject({ sourceHeroId: player().id, rank: fixture.rank + step });
    expect(Object.isFrozen(current.engineInput.golemMastery)).toBe(true);
    expectClay(required(fixture.life[step]), required(fixture.period[step]));
    expect(frozenWave(previous)).toEqual(frozen);
  }
  expect(player().skillPoints).toBe(0);
});

it('recomposes unlocked explicit replay from the original resource baseline without settling rewards', () => {
  arrange(7); start(); expectClay(312.4, 2000);
  const original = published(), baseline = pools(required(original.binding.engineInput.playerTeam[0]));
  expect(original.binding.publication.ironGolemReplayLocked).toBe(false);
  expect(usePlayerStore.getState().allocateSkillPoint(MASTERY)).toBe('ok');
  const persistent = structuredClone({ player: player(), inventory: useInventoryStore.getState().backpack,
    currencies: useInventoryStore.getState().currencies, rewards: useCombatStore.getState().runRewards,
    cleared: useMapStore.getState().clearedSubAreas });
  const before = structuredClone(frozenWave(original.binding));
  for (let repeat = 0; repeat < 2; repeat++) {
    drain();
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const current = published();
    expect(current.binding.engineInput.golemMastery?.rank).toBe(8);
    expect(pools(required(current.binding.engineInput.playerTeam[0]))).toEqual(baseline);
    expectClay(325.6, 1996);
    expect(current.installation?.settlement.identity).toBe(original.installation?.settlement.identity);
    expect(current.installation?.settlement.progress.phase).toBe('unsettled');
    expect({ player: player(), inventory: useInventoryStore.getState().backpack,
      currencies: useInventoryStore.getState().currencies, rewards: useCombatStore.getState().runRewards,
      cleared: useMapStore.getState().clearedSubAreas }).toEqual(persistent);
    expect(frozenWave(original.binding)).toEqual(before);
  }
});

it.each([100, 34])('preserves selected Iron item ordering and locked replay at%sMP without a second debit', mana => {
  arrange(1);
  const IRON = 'necromancer.iron_golem';
  usePlayerStore.getState().setPlayer({ ...player(), skillLevels: {
    ...player().skillLevels, [IRON]: 6, 'necromancer.blood_golem': 1
  }, comboOrder: ['skills-necromancer-iron-golem', IRON, WAIT, FINISH],
  derivedStats: { ...player().derivedStats, mana } });
  const sacrifice: Item = { id: 'fixture-golem-sacrifice', baseId: 'items/base/wp1h-short-sword',
    rarity: 'rare', level: 1, identified: true, equipped: false, baseRolls: { attack: 3.25 },
    affixes: [{ affixId: 'fixture-imported-golem-inheritance', values: new Map([
      ['statMods.life', 12.5], ['statMods.defense', 4.5]
    ]) }] };
  const reserve: Item = { ...sacrifice, id: 'fixture-golem-reserve' };
  useInventoryStore.getState().addItem(sacrifice); useInventoryStore.getState().addItem(reserve);
  const beforeInventory = useInventoryStore.getState();
  expect(armIronGolemSelection(player().id, sacrifice.id, true)).not.toBeNull();
  start(); const original = published(), binding = original.binding, paid = mana >= 35;
  expect(binding.engineInput.golemMastery?.rank).toBe(1);
  expect(binding.engineInput.ironGolem).toEqual({ sourceHeroId: player().id,
    sourceItemId: sacrifice.id, life: 12.5, attack: 3.25, defense: 4.5 });
  expect(binding.publication.ironGolemReplayLocked).toBe(true);
  expect(binding.engineInput.playerTeam).toHaveLength(1);
  expect(binding.recording.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
    .toEqual(paid ? [expect.objectContaining({ target: player().id, mana: 65, simClockMs: 0 })] : []);
  if (paid) {
    const event = golem();
    expect(event).toMatchObject({ summonId: 'iron_golem', owner: player().id, simClockMs: 0 });
    expect(event.unit.life).toBeCloseTo(373.65, 12);
    expect(event.unit.stats.lifeMax).toBeCloseTo(373.65, 12);
    expect(event.unit.stats).toMatchObject({ attack: 49.25, defense: 67.5, attackSpeed: 61 });
    expect(binding.attestation).toEqual({ sourceHeroId: player().id, sourceItemId: sacrifice.id,
      skillId: IRON, spawnedUnitId: event.unit.id, paidMp: 35 });
    expect(useInventoryStore.getState().backpack).toEqual(beforeInventory.backpack.filter(item => item.id !== sacrifice.id));
  } else {
    expect(binding.recording.events.filter(e => e.kind === 'summon')).toEqual([]);
    expect(binding.attestation).toBeNull(); expect(binding.debitIntent).toBeNull();
    expect(useInventoryStore.getState()).toBe(beforeInventory);
    expect(binding.recording.events.some(e => e.kind === 'mana' && e.reason === 'regeneration' && e.mana >= 35)).toBe(true);
  }
  expect(useIronGolemSelectionStore.getState().selection).toBeNull();
  expect(usePlayerStore.getState().allocateSkillPoint(MASTERY)).toBe('ok');
  usePlayerStore.getState().setComboOrder([WAIT, FINISH]);
  const rearmed = armIronGolemSelection(player().id, reserve.id, true);
  expect(rearmed).not.toBeNull();
  const inventory = useInventoryStore.getState(), persistentPlayer = structuredClone(player());
  const evidence = structuredClone(frozenWave(binding));
  for (let repeat = 0; repeat < 2; repeat++) {
    drain(); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const current = published();
    expect(current.binding.engineInput).toBe(binding.engineInput);
    expect(current.binding.recording).toBe(binding.recording);
    expect(current.binding.publication).toBe(binding.publication);
    expect(current.binding.engineInput.golemMastery?.rank).toBe(1);
    expect(current.binding.attestation).toBeNull(); expect(current.binding.debitIntent).toBeNull();
    expect(current.installation?.settlement.identity).toBe(original.installation?.settlement.identity);
    expect(current.installation?.settlement.progress.phase).toBe('unsettled');
    expect(pools(required(current.binding.engineInput.playerTeam[0]))).toEqual([1000, mana, 0, 0, '0']);
    expect(useInventoryStore.getState()).toBe(inventory);
    expect(useIronGolemSelectionStore.getState().selection).toBe(rearmed);
    expect(player()).toEqual(persistentPlayer); expect(frozenWave(binding)).toEqual(evidence);
  }
});
