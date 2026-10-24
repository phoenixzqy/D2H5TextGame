import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Persistence I/O only is faked; save validation, allocation and combat are real.
vi.mock('./save-adapter', () => ({
  hasSave: vi.fn(),
  loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)),
  deleteSave: vi.fn()
}));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Item } from '@/engine/types/items';
import {
  abortSubAreaRun,
  advanceWaveOrFinish,
  playerToCombatUnit,
  refreshActivePlayerCombatConfig,
  startSubAreaRun
} from './combatHelpers';
import { snapshotStores, importIntoStores, __resetPersistenceForTests } from './persistence';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';

const stores = [
  useCombatStore,
  usePlayerStore,
  useInventoryStore,
  useMapStore,
  useMercStore,
  useFormationStore,
  useMetaStore
] as const;
function reset() {
  __resetPersistenceForTests();
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
function player() {
  const value = usePlayerStore.getState().player;
  if (!value) throw new Error('Missing functional Assassin');
  return value;
}
function hero() {
  const value = useCombatStore.getState().playerTeam[0];
  if (!value) throw new Error('Missing native wave');
  return value;
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({
    team: s.playerTeam,
    events: s.recordedEvents,
    outcome: s.outcome,
    cursor: s.eventCursor,
    rewards: s.runRewards
  });
}
/** Constructed level/pool/Attack equipment; native basic attacks, never earned balance. */
function arrange() {
  const fresh = createMockPlayer('Native Bone Armor fixture', 'necromancer');
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level: 30,
    skillPoints: 2,
    comboOrder: [],
    skillLevels: { 'necromancer.bone_armor': 19 }
  });
  const cap: Item = {
    id: 'fixture-pool-cap',
    baseId: 'items/base/helm-cap',
    rarity: 'rare',
    level: 1,
    identified: true,
    equipped: false,
    socketCapacity: 0,
    affixes: [
      {
        affixId: 'fixture-imported',
        values: new Map([
          ['statMods.life', 999000],
          ['statMods.mana', 999000],
          ['statMods.attack', 1000],
          ['statMods.attackSpeed', -50]
        ])
      }
    ]
  };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
}
beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  resetRegistry();
  loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset();
  useHydrationStore.getState().setStatus('idle');
  resetRegistry();
  loadDefaultSkills();
  vi.restoreAllMocks();
});
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function finalHero() {
  const value = useCombatStore.getState().outcome?.finalPlayerTeam[0];
  if (!value) throw new Error('Missing native Bone Armor outcome');
  return value;
}

it('captures a learned pool once, carries its spent remainder, and replays without refilling or paying income', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  expect(hero().statuses.find(s => s.id === 'bone-armor')?.boneArmor).toEqual({ rank: 19, remaining: 228 });
  const first = recording(), final = structuredClone(finalHero());
  const remaining = final.statuses.find(s => s.id === 'bone-armor');
  expect(remaining?.boneArmor?.remaining).toBeGreaterThan(0);
  expect(remaining?.boneArmor?.remaining).toBeLessThan(228);
  expect(first.events.some(e => e.kind === 'damage' && (e.absorbed ?? 0) > 0)).toBe(true);
  expect(usePlayerStore.getState().allocateSkillPoint('skills-necromancer-bone-armor')).toBe('ok');
  expect(recording()).toEqual(first);
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().statuses).toContainEqual(remaining);
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
  const second = recording();
  for (let repeat = 0; repeat < 2; repeat++) {
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(recording()).toEqual(second);
  }
  expect(playerToCombatUnit(player()).statuses[0]?.boneArmor).toEqual({ rank: 20, remaining: 240 });
});
it('arms the shield after the existing fresh-challenge policy restores a zero-HP hero', () => {
  arrange();
  const p = player();
  usePlayerStore.getState().setPlayer({ ...p, derivedStats: { ...p.derivedStats, life: 0 } });
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  expect(hero().life).toBe(hero().stats.lifeMax);
  expect(hero().statuses.find(s => s.id === 'bone-armor')?.boneArmor).toEqual({ rank: 19, remaining: 228 });
});
it('roundtrips actual allocation without saving the transient shield or modifying base stats', async () => {
  arrange();
  const expected = playerToCombatUnit(player()), save = snapshotStores();
  if (!save) throw new Error('Missing native save');
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  expect(finalHero().statuses.find(s => s.id === 'bone-armor')?.boneArmor?.remaining).toBeLessThan(228);
  expect(snapshotStores()?.player.statusEffects).toEqual(save.player.statusEffects);
  expect(JSON.stringify(toJsonSafe(snapshotStores()))).not.toContain('boneArmor');
  await importIntoStores(JSON.stringify(toJsonSafe(save)));
  expect(player()).toEqual(save.player);
  expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
});
