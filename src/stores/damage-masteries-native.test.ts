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

const FINISHER = 'fixture.damage-mastery-finisher';
let classId: 'necromancer' | 'druid' = 'necromancer';
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
  const fresh = createMockPlayer('Damage mastery native functional fixture', classId);
  expect(Object.values(skillLevels).reduce((sum, rank) => sum + rank, 3))
    .toBeLessThanOrEqual(awardXp(0, xpTotal(level)).skillPointsGranted + fresh.skillPoints);
  usePlayerStore.getState().setPlayer({ ...fresh, level, skillLevels,
    skillPoints: 3, comboOrder: [FINISHER] });
  const cap: Item = { id: 'fixture-damage-mastery-native-cap', baseId: 'items/base/helm-cap',
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

const cases = [
  { classId: 'necromancer', authored: 'skills-necromancer-poison-mastery', canonical: 'necromancer.poison_mastery',
    damage: { poison: 0.04, arcane: 0.02 }, dodge: 0 },
  { classId: 'druid', authored: 'skills-druid-elemental-mastery', canonical: 'druid.elemental_mastery',
    damage: { fire: 0.03, cold: 0.03 }, dodge: 0.005 },
] as const;
for (const c of cases) {
  describe(c.canonical + ' native recording boundaries', () => {
    beforeEach(() => { classId = c.classId; });
    it('learns and upgrades through ordinary allocation, changing only the next wave', () => {
      arrange();
      const before = recording(), baseline = structuredClone(currentHero());
      expect(usePlayerStore.getState().allocateSkillPoint(c.authored)).toBe('ok');
      expect(usePlayerStore.getState().allocateSkillPoint(c.canonical)).toBe('ok');
      expect(recording()).toEqual(before);
      expect(player().skillLevels?.[c.canonical]).toBe(2);
      expect(player().skillPoints).toBe(1);
      const final = before.outcome?.finalPlayerTeam[0];
      if (!final) throw new Error('Missing original mastery outcome');
      drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
      for (const [type, coefficient] of Object.entries(c.damage)) {
        expect(Reflect.get(currentHero().increasedDamagePct ?? {}, type)).toBeCloseTo(coefficient * 2, 12);
      }
      expect(currentHero().stats.magicDodge).toBeCloseTo(baseline.stats.magicDodge + c.dodge * 2, 12);
      expect(pools(currentHero())).toEqual(pools(final));
    });
    it('clears rank20 on reset and explicit replay without changing pools or granting income', () => {
      arrange({ [c.canonical]: 20 }, 40);
      const before = recording(), baseline = structuredClone(currentHero());
      const plain = playerToCombatUnit({ ...player(), skillLevels: {} });
      for (const [type, coefficient] of Object.entries(c.damage)) {
        expect(Reflect.get(baseline.increasedDamagePct ?? {}, type)).toBeCloseTo(coefficient * 20, 12);
      }
      expect(resetSkillsForCompositionTest()).toBe('ok');
      expect(recording()).toEqual(before);
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect(currentHero().stats).toEqual(plain.stats);
      expect(currentHero().increasedDamagePct).toEqual(plain.increasedDamagePct);
      expect(pools(currentHero())).toEqual(pools(baseline));
      expect(useCombatStore.getState().runRewards).toEqual(before.rewards);
      const first = recording(); refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect(recording()).toEqual(first);
    });
  });
}
