import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Only durable I/O is replaced; native factories, combat and settlement are real.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { loadQuests } from '@/data/loaders/quests';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { xpRequired, xpTotal } from '@/engine/progression/xp';
import type { Item } from '@/engine/types/items';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { abortSubAreaRun, advanceWaveOrFinish, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore, mercXpForLevel } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';
import { __resetPersistenceForTests } from './persistence';

const ANCHOR = 1793304000000;
const FINISHER = 'fixture.kill-xp-action';
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing native kill XP fixture');
  return value;
}
function reset(): void {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetRegistry(); loadDefaultSkills();
}
function heroXp(): number {
  const hero = required(usePlayerStore.getState().player);
  return xpTotal(hero.level) + hero.experience;
}
function mercXp(): number {
  const merc = required(useMercStore.getState().getFieldedMerc());
  let total = useMercStore.getState().getMercProgress(merc.id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
function start(mode: 'victory' | 'draw' | 'defeat'): void {
  // Constructed access/power isolates high-level reward wiring, not earned progress.
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'physical',
      base: mode === 'victory' ? [100000, 100000] : [0, 0], alwaysHits: true }] });
  const hero = createMockPlayer('Native XP fixture', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...hero, level: 60, experience: 0,
    experienceToNextLevel: xpRequired(60), comboOrder: [FINISHER] });
  if (mode !== 'defeat') {
    // Ordinary Vitality is capped. Imported fixture gear provides actual high Life.
    const cap: Item = { id: 'kill-xp-fixture-cap', baseId: 'items/base/helm-cap',
      rarity: 'rare', level: 1, identified: true, equipped: false,
      affixes: [{ affixId: 'imported-wiring-fixture', values: new Map([['statMods.life', 1000000]]) }] };
    useInventoryStore.getState().addItem(cap);
    expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  }
  usePlayerStore.getState().recomputeDerived(useInventoryStore.getState().equipped);
  const prepared = required(usePlayerStore.getState().player);
  // Recomputing preserves current resources; refill this constructed fixture explicitly.
  usePlayerStore.getState().setPlayer({ ...prepared, derivedStats: {
    ...prepared.derivedStats, life: prepared.derivedStats.lifeMax,
    mana: prepared.derivedStats.manaMax } });
  useMercStore.getState().addMerc({ ...hero, id: 'kill-xp-merc', type: 'mercenary',
    archetype: 'back', rarity: 'R', equipment: [], comboOrder: [] });
  useMercStore.getState().setFieldedMerc('kill-xp-merc');
  useMapStore.setState({ questProgress: Object.fromEntries(loadQuests().map(q => [q.id,
    { id: q.id, status: 'completed', rewardClaimed: true,
      objectives: Object.fromEntries(q.objectives.map(o => [o.id, true])) }])) });
  expect(startSubAreaRun({ act: 4, subAreaId: 'areas/act4-plains-of-despair',
    runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
}
function drain(): void {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let index = 0; index < count; index++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(ANCHOR);
});
afterEach(() => { reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); });

it.each([1, 1.5])('settles late rewards once with per-enemy bonus%s and native merc share', multiplier => {
  if (multiplier > 1) useMetaStore.getState().updateIdleState({ lastOnline: ANCHOR,
    activeMultiplier: multiplier, multiplierSecondsRemaining: 1000 });
  start('victory');
  const outcome = required(useCombatStore.getState().outcome);
  expect(outcome.winner).toBe('player');
  const slain = outcome.finalEnemyTeam.filter(u => u.life <= 0 && u.kind !== 'summon');
  expect(slain.length).toBeGreaterThan(1);
  expect(slain.every(u => u.level === 45)).toBe(true);
  // Independent selected reference: level45 gives1779 base XP, not old450.
  const expected = slain.length * Math.floor(1779 * multiplier);
  if (multiplier > 1) expect(expected).toBeLessThan(Math.floor(slain.length * 1779 * multiplier));
  const before = [heroXp(), mercXp()];
  expect(advanceWaveOrFinish()).toBe('idle');
  expect([heroXp(), mercXp()]).toEqual(before);
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(heroXp() - required(before[0])).toBe(expected);
  expect(mercXp() - required(before[1])).toBe(Math.floor(expected * 0.75));
  const after = [heroXp(), mercXp()];
  expect(advanceWaveOrFinish()).toBe('idle');
  expect([heroXp(), mercXp()]).toEqual(after);
});

it.each(['draw', 'defeat'] as const)('grants no late XP or merc XP for native %s', outcome => {
  start(outcome);
  expect(required(useCombatStore.getState().outcome).winner).toBe(outcome === 'draw' ? null : 'enemy');
  const before = [heroXp(), mercXp()];
  drain();
  expect(advanceWaveOrFinish()).toBe('defeat');
  expect([heroXp(), mercXp()]).toEqual(before);
});
