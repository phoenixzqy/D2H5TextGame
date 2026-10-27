import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('./save-adapter', () => ({
  hasSave: vi.fn(),
  loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)),
  deleteSave: vi.fn()
}));
import { createMockPlayer } from '@/features/character/createMockPlayer';
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
  for (const s of stores) s.getState().reset();
}
function player() {
  const p = usePlayerStore.getState().player;
  if (!p) throw new Error('Missing native Druid');
  return p;
}
function hero() {
  const h = useCombatStore.getState().playerTeam[0];
  if (!h) throw new Error('Missing wave hero');
  return h;
}
function finalHero() {
  const h = useCombatStore.getState().outcome?.finalPlayerTeam[0];
  if (!h) throw new Error('Missing outcome');
  return h;
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
function drain() {
  const n = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < n; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function arrange() {
  usePlayerStore.getState().setPlayer({
    ...createMockPlayer('Synthetic native sustain', 'druid'),
    level: 30,
    skillPoints: 2,
    skillLevels: { 'druid.werewolf': 1, 'druid.feral_rage': 1, 'druid.hunger': 1 },
    comboOrder: ['skills-druid-feral-rage']
  });
  // Imported high resource/Attack equipment isolates lifecycle; never earned campaign evidence.
  const cap: Item = {
    id: 'sustain-fixture-cap',
    baseId: 'items/base/helm-cap',
    rarity: 'rare',
    level: 1,
    identified: true,
    equipped: false,
    socketCapacity: 0,
    affixes: [
      {
        affixId: 'synthetic-import',
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
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset();
  useHydrationStore.getState().setStatus('idle');
  vi.restoreAllMocks();
});
it('carries only the actual residual duration and replays the frozen original native input', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  const first = recording(),
    final = structuredClone(finalHero());
  const stack = final.statuses.find((s) => s.feralRage);
  const elapsed = first.events.at(-1)?.simClockMs;
  if (stack?.appliedAtMs === undefined || stack.expiresAtMs === undefined || elapsed === undefined)
    throw new Error('Missing earned residual stack');
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().feralRageRank).toBe(1);
  expect(hero().statuses).toContainEqual({
    ...stack,
    appliedAtMs: stack.appliedAtMs - elapsed,
    expiresAtMs: stack.expiresAtMs - elapsed
  });
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
  const second = recording();
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(recording()).toEqual(second);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(recording()).toEqual(second);
  usePlayerStore.getState().setComboOrder([]);
  expect(recording()).toEqual(second);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(hero().feralRageRank).toBe(0);
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
  expect(
    useCombatStore
      .getState()
      .recordedEvents.some((e) => e.kind === 'buff' && e.buffId === 'feral-rage')
  ).toBe(false);
  const changed = recording();
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(recording()).toEqual(changed);
});
it.each(['remove', 'prerequisite', 'class'] as const)(
  'clears native carried speed next wave after %s loss without rewriting old replay',
  (kind) => {
    arrange();
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    expect(finalHero().statuses.some((s) => s.feralRage)).toBe(true);
    const first = recording();
    if (kind === 'remove') usePlayerStore.getState().setComboOrder([]);
    // Boundary-only synthetic configuration injection: setPlayer intentionally replaces the hero and aborts combat.
    else if (kind === 'prerequisite')
      usePlayerStore.setState({
        player: { ...player(), skillLevels: { 'druid.feral_rage': 1, 'druid.hunger': 1 } }
      });
    else usePlayerStore.setState({ player: { ...player(), class: 'sorceress' } });
    expect(recording()).toEqual(first);
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(hero().feralRageRank).toBe(0);
    expect(
      useCombatStore
        .getState()
        .recordedEvents.some(
          (e) =>
            e.kind === 'status-state' &&
            e.target === hero().id &&
            e.statuses.some((s) => s.feralRage)
        )
    ).toBe(false);
    expect(finalHero().statuses.some((s) => s.feralRage)).toBe(false);
  }
);
it('uses valid MAX aliases and full native prerequisites, rejecting invalid saved configurations', () => {
  arrange();
  const p = player();
  const base = {
    ...p,
    skillLevels: {
      'skills-druid-werewolf': 1,
      'skills-druid-feral-rage': 2,
      'druid.feral_rage': 20
    }
  };
  expect(playerToCombatUnit(base).feralRageRank).toBe(20);
  for (const patch of [
    { class: 'sorceress' as const },
    { level: 11 },
    { comboOrder: [] },
    { skillLevels: { 'druid.feral_rage': 20 } },
    { skillLevels: { 'druid.werewolf': 1, 'druid.feral_rage': 21 } },
    { skillLevels: { 'druid.werewolf': 1, 'druid.feral_rage': 1.5 } },
    { comboOrder: ['druid.feral-rage'] }
  ]) {
    const native = playerToCombatUnit({ ...base, ...patch });
    expect(native.feralRageRank ?? 0).toBe(0);
    expect(
      native.skillOrder.some((id) => id === 'druid.feral_rage' || id === 'skills-druid-feral-rage')
    ).toBe(false);
  }
});
it('imports exact allocations and combo in Save22 without retaining transient stacks or refilling native inputs', async () => {
  arrange();
  const save = snapshotStores(),
    expected = playerToCombatUnit(player());
  if (!save) throw new Error('Missing native Save22');
  expect(save.version).toBe(23);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  expect(finalHero().statuses.some((s) => s.feralRage)).toBe(true);
  expect(JSON.stringify(toJsonSafe(snapshotStores()))).not.toMatch(
    /feralRageRank|feralRage|expiresAtMs/
  );
  await importIntoStores(JSON.stringify(toJsonSafe(save)));
  expect(toJsonSafe(snapshotStores())).toEqual(toJsonSafe(save));
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(playerToCombatUnit(player()).statuses).toEqual([]);
  expect(useCombatStore.getState().playerTeam).toEqual([]);
});
