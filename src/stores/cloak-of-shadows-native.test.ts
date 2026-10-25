import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { resetSkillsForCompositionTest } from '../../tests/helpers/reset-skills';
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
  const fresh = createMockPlayer('Native Assassin passive fixture', 'assassin');
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level: 30,
    skillPoints: 2,
    comboOrder: [],
    skillLevels: { 'assassin.psychic_hammer': 1 }
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
          ['statMods.attackSpeed', 100]
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
  if (!value) throw new Error('Missing native Cloak outcome');
  return value;
}
it('learns through the native store, freezes the old recording, and pays on the next wave', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  expect(hero().cloakOfShadowsRank).toBe(0);
  const first = recording(),
    baseStats = structuredClone(hero().stats),
    final = structuredClone(finalHero());
  expect(usePlayerStore.getState().allocateSkillPoint('skills-assassin-cloak-of-shadows')).toBe('ok');
  usePlayerStore.getState().setComboOrder(['skills-assassin-cloak-of-shadows']);
  expect(recording()).toEqual(first);
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().cloakOfShadowsRank).toBe(1);
  expect(hero().stats).toEqual(baseStats);
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
  expect(
    useCombatStore
      .getState()
      .recordedEvents.some((e) => e.kind === 'action' && e.skillId === 'assassin.cloak_of_shadows')
  ).toBe(true);
  expect(
    useCombatStore
      .getState()
      .recordedEvents.some(
        (e) => e.kind === 'status-state' && e.statuses.some((s) => s.cloakOfShadows?.rank === 1)
      )
  ).toBe(true);
});
it('carries frozen paid potency after a free pure-respec composition and replays the original residual baseline', () => {
  arrange();
  expect(usePlayerStore.getState().allocateSkillPoint('skills-assassin-cloak-of-shadows')).toBe('ok');
  usePlayerStore.getState().setComboOrder(['skills-assassin-cloak-of-shadows']);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  const first = recording(),
    final = structuredClone(finalHero());
  const paid = final.statuses.find((s) => s.id === 'cloak-of-shadows');
  if (paid?.expiresAtMs === undefined || paid.appliedAtMs === undefined)
    throw new Error('Missing paid residual');
  const elapsed = first.events.at(-1)?.simClockMs;
  if (elapsed === undefined) throw new Error('Missing native terminal clock');
  expect(resetSkillsForCompositionTest()).toBe('ok');
  expect(recording()).toEqual(first);
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().cloakOfShadowsRank).toBe(0);
  expect(hero().statuses).toContainEqual({
    ...paid,
    appliedAtMs: paid.appliedAtMs - elapsed,
    expiresAtMs: paid.expiresAtMs - elapsed
  });
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
  const second = recording(),
    pools = [hero().life, hero().mana];
  expect(
    second.events.some((e) => e.kind === 'action' && e.skillId === 'assassin.cloak_of_shadows')
  ).toBe(false);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect([hero().life, hero().mana]).toEqual(pools);
  expect(recording()).toEqual(second);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(recording()).toEqual(second);
});
it('roundtrips allocation/priority without persisting a paid status, bonus or pool refill', async () => {
  arrange();
  expect(usePlayerStore.getState().allocateSkillPoint('skills-assassin-cloak-of-shadows')).toBe('ok');
  usePlayerStore.getState().setComboOrder(['skills-assassin-cloak-of-shadows']);
  const expected = playerToCombatUnit(player()),
    save = snapshotStores();
  if (!save) throw new Error('Missing native save');
  expect(expected.cloakOfShadowsRank).toBe(1);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  expect(finalHero().statuses.some((s) => s.cloakOfShadows?.rank === 1)).toBe(true);
  await importIntoStores(JSON.stringify(toJsonSafe(save)));
  expect(player()).toEqual(save.player);
  expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(playerToCombatUnit(player()).statuses).toEqual([]);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
});
