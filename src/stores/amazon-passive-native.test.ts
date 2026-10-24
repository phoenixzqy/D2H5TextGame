import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSyntheticEntryPools } from '@/test/fixtures/synthetic-entry-pools';
import { resetSkillsForCompositionTest } from '../../tests/helpers/reset-skills';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { awardXp, xpTotal } from '@/engine/progression/xp';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { abortSubAreaRun, advanceWaveOrFinish, playerToCombatUnit, refreshActivePlayerCombatConfig,
  startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';

const FINISHER = 'fixture.amazon-passive-finisher';
const ranks = { 'amazon.critical_strike': 20, 'amazon.penetrate': 20, 'amazon.dodge': 20 };
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset() {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
function player(): Player {
  const result = usePlayerStore.getState().player;
  if (!result) throw new Error('Missing constructed Amazon');
  return result;
}
function currentHero() {
  const result = useCombatStore.getState().playerTeam[0];
  if (!result) throw new Error('Missing native Amazon wave');
  return result;
}
function pools(unit: ReturnType<typeof currentHero>) {
  return [unit.life, unit.mana, unit.manaRegenCarry, unit.manaRegenCompensation, unit.manaRegenExactCarry];
}
function recording() {
  const state = useCombatStore.getState();
  return structuredClone({ team: state.playerTeam, events: state.recordedEvents,
    outcome: state.outcome, cursor: state.eventCursor, rewards: state.runRewards });
}
/** Constructed functional fixture only; no earned campaign or balance claim. */
function arrange(skillLevels: NonNullable<Player['skillLevels']> = {}, level = 30) {
  const fresh = createMockPlayer('Amazon native passive fixture', 'amazon');
  expect(Object.values(skillLevels).reduce((sum, rank) => sum + rank, 3))
    .toBeLessThanOrEqual(awardXp(0, xpTotal(level)).skillPointsGranted + fresh.skillPoints);
  usePlayerStore.getState().setPlayer({ ...fresh, level, skillLevels,
    skillPoints: 3, comboOrder: [FINISHER] });
  const cap: Item = { id: 'fixture-amazon-native-cap', baseId: 'items/base/helm-cap',
    rarity: 'rare', level: 1, socketCapacity: 0, identified: true, equipped: false,
    affixes: [{ affixId: 'fixture-imported', values: new Map([
      ['statMods.life', 999000], ['statMods.mana', 999000],
    ]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  usePlayerStore.setState({ player: { ...player(), derivedStats: {
    ...player().derivedStats, life: 500000, mana: 500,
  } } });
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 1, manaCost: 8,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
}
function drain() {
  const length = useCombatStore.getState().recordedEvents.length;
  for (let index = 0; index < length; index++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  resetRegistry(); loadDefaultSkills(); mockSyntheticEntryPools();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset(); useHydrationStore.getState().setStatus('idle');
  resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks();
});

describe('Amazon passive native recording and replay boundaries', () => {
  it('learns all three through the real allocation action, taking effect next wave without changing the current recording', () => {
    arrange();
    const before = recording(), baseline = structuredClone(currentHero());
    for (const id of ['skills-amazon-critical-strike', 'skills-amazon-penetrate', 'skills-amazon-dodge']) {
      expect(usePlayerStore.getState().allocateSkillPoint(id)).toBe('ok');
      expect(recording()).toEqual(before);
    }
    expect(player().skillPoints).toBe(0);
    const final = before.outcome?.finalPlayerTeam[0];
    if (!final) throw new Error('Missing original Amazon outcome');
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect.soft(currentHero().stats.critChance).toBeCloseTo(baseline.stats.critChance + 0.01, 12);
    expect.soft(currentHero().stats.physDodge).toBeCloseTo(baseline.stats.physDodge + 0.01, 12);
    expect.soft(currentHero().stats.attack).toBeCloseTo(baseline.stats.attack * 1.03, 12);
    expect(pools(currentHero())).toEqual(pools(final));
  });

  it('removes rank-cap passives on explicit replay after a constructed free reset, preserving original pools and rewards', () => {
    arrange(ranks, 60);
    const baseline = structuredClone(currentHero()), before = recording();
    const plain = playerToCombatUnit({ ...player(), skillLevels: {} }).stats;
    expect.soft(baseline.stats.critChance).toBeCloseTo(plain.critChance + 0.2, 12);
    expect.soft(baseline.stats.physDodge).toBeCloseTo(plain.physDodge + 0.2, 12);
    expect.soft(baseline.stats.attack).toBeCloseTo(plain.attack * 1.6, 12);
    expect(resetSkillsForCompositionTest()).toBe('ok');
    expect(recording()).toEqual(before);
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(currentHero().stats).toEqual(plain);
    expect(pools(currentHero())).toEqual(pools(baseline));
    expect(useCombatStore.getState().runRewards).toEqual(before.rewards);
    const first = recording();
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(recording()).toEqual(first);
    expect(pools(currentHero())).toEqual(pools(baseline));
  });
});
