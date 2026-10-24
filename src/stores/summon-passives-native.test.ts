import { resetSkillsForCompositionTest } from '../../tests/helpers/reset-skills';
import { mockSyntheticEntryPools } from '@/test/fixtures/synthetic-entry-pools';
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
function pools(hero: import('@/engine/combat/types').CombatUnit) {
  return [hero.life, hero.mana, hero.manaRegenCarry, hero.manaRegenCompensation, hero.manaRegenExactCarry];
}
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
    skillPoints: 4, skillLevels: { [CLAY]: 1, ...(mastery ? { [MASTERY]: mastery } : {}) },
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
  mockSyntheticEntryPools();
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

it('applies learned global summon life, attack and all six resistances through native wave staging', () => {
  arrange(1);
  usePlayerStore.getState().setPlayer({ ...player(), skillLevels: { ...player().skillLevels,
    'necromancer.summon_mastery': 1, 'necromancer.summon_resist': 1 } });
  start();
  const event = golem();
  // 6% local +5% global, summed over the fresh rank-one 220 HP baseline.
  expect(event.unit.stats.lifeMax).toBeCloseTo(244.2, 12);
  expect(event.unit.stats.attack).toBeCloseTo(24.48, 12);
  expect(event.unit.stats.resistances).toEqual({ physical: 12, fire: 2, cold: 2,
    lightning: 2, arcane: 2, poison: 2 });
  expect(event.unit.life).toBe(event.unit.stats.lifeMax);
});

it('learns both passives for the next wave without mutating the current recording or refilling hero resources', () => {
  arrange(1); start();
  const previous = published().binding;
  const frozen = structuredClone(frozenWave(previous));
  const finalHero = required(previous.recording.outcome.finalPlayerTeam.find(u => u.id === player().id));
  expect(usePlayerStore.getState().allocateSkillPoint('skills-necromancer-summon-mastery')).toBe('ok');
  expect(usePlayerStore.getState().allocateSkillPoint('skills-necromancer-summon-resist')).toBe('ok');
  refreshActivePlayerCombatConfig();
  expect(published().binding).toBe(previous);
  expect(frozenWave(previous)).toEqual(frozen);
  drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
  const current = published().binding;
  const hero = required(current.engineInput.playerTeam[0]);
  expect([hero.life, hero.mana, hero.manaRegenCarry, hero.manaRegenCompensation, hero.manaRegenExactCarry])
    .toEqual([finalHero.life, finalHero.mana, finalHero.manaRegenCarry, finalHero.manaRegenCompensation, finalHero.manaRegenExactCarry]);
  expect(golem().unit.stats.lifeMax).toBeCloseTo(244.2, 12);
  expect(golem().unit.stats.resistances.fire).toBe(2);
  expect(frozenWave(previous)).toEqual(frozen);
});

it('resets global passives and recomposes unlocked replay from original pools without income', () => {
  arrange(1);
  usePlayerStore.getState().setPlayer({ ...player(), skillLevels: { ...player().skillLevels,
    'necromancer.summon_mastery': 1, 'necromancer.summon_resist': 1 } });
  start(); const original = published().binding;
  const hero = required(original.engineInput.playerTeam[0]);
  const resources = [hero.life, hero.mana, hero.manaRegenCarry, hero.manaRegenCompensation, hero.manaRegenExactCarry];
  const before = structuredClone(frozenWave(original));
  expect(resetSkillsForCompositionTest()).toBe('ok');
  expect(usePlayerStore.getState().allocateSkillPoint('skills-necromancer-clay-golem')).toBe('ok');
  usePlayerStore.getState().setComboOrder([CLAY, WAIT, FINISH]);
  const persistent = structuredClone({ player: player(), inventory: useInventoryStore.getState().backpack,
    currencies: useInventoryStore.getState().currencies, rewards: useCombatStore.getState().runRewards });
  for (let repeat = 0; repeat < 2; repeat++) {
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const current = published().binding, refreshed = required(current.engineInput.playerTeam[0]);
    expect(current.engineInput.summonPassives).toBeUndefined();
    expect(golem().unit.stats).toMatchObject({ lifeMax: 220, attack: 24, resistances: { physical: 10, fire: 0 } });
    expect([refreshed.life, refreshed.mana, refreshed.manaRegenCarry, refreshed.manaRegenCompensation, refreshed.manaRegenExactCarry]).toEqual(resources);
    expect({ player: player(), inventory: useInventoryStore.getState().backpack,
      currencies: useInventoryStore.getState().currencies, rewards: useCombatStore.getState().runRewards }).toEqual(persistent);
    expect(frozenWave(original)).toEqual(before);
  }
});

it.each([100, 34])('preserves selected Iron item ordering and locked replay at%sMP without a second debit', mana => {
  arrange(1);
  usePlayerStore.getState().setPlayer({ ...player(), skillLevels: { ...player().skillLevels,
    'necromancer.summon_mastery': 1, 'necromancer.summon_resist': 1 } });
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
    expect(event.unit.life).toBeCloseTo(391.275, 12);
    expect(event.unit.stats.lifeMax).toBeCloseTo(391.275, 12);
    expect(event.unit.stats).toMatchObject({ attack: 50.235, defense: 67.5, attackSpeed: 61 });
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
