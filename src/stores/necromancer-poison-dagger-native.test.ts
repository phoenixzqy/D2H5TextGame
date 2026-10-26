import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Persistence I/O only is faked; save validation, allocation and combat are real.
vi.mock('@/stores/save-adapter', () => ({
  hasSave: vi.fn(),
  loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)),
  deleteSave: vi.fn()
}));
import rows from '@/data/skills/necromancer.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Item } from '@/engine/types/items';
import {
  abortSubAreaRun,
  advanceWaveOrFinish,
  playerToCombatUnit,
  startSubAreaRun
} from '@/stores/combatHelpers';
import { snapshotStores, importIntoStores, __resetPersistenceForTests } from '@/stores/persistence';
import { useCombatStore } from '@/stores/combatStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { useFormationStore } from '@/stores/formationStore';
import { useMetaStore } from '@/stores/metaStore';
import { useHydrationStore } from '@/stores/hydrationStore';

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
  if (!value) throw new Error('Missing functional Necromancer');
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
/** Constructed level/pool/Attack equipment; never earned balance. */
function arrange() {
  const fresh = createMockPlayer('Synthetic Poison Dagger wave fixture', 'necromancer');
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level: 30,
    skillPoints: 12,
    comboOrder: [],
    skillLevels: {}
  });
  const cap: Item = {
    id: 'poison-dagger-acceptance-pool-cap',
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
  if (!value) throw new Error('Missing native attack outcome');
  return value;
}
function learn(skill: 'poison-dagger') {
  const learned = new Set<string>();
  function add(id: string) {
    if (learned.has(id)) return;
    const row = rows.find((s) => s.id === id);
    if (!row) throw new Error('Missing native attack prerequisite');
    for (const prerequisite of row.prerequisites ?? []) add(prerequisite);
    expect(usePlayerStore.getState().allocateSkillPoint(id)).toBe('ok');
    learned.add(id);
  }
  add('skills-necromancer-' + skill);
  usePlayerStore.getState().setComboOrder(['skills-necromancer-' + skill]);
}
function expectPaidCasts(skill: 'poison-dagger') {
  const events = useCombatStore.getState().recordedEvents;
  const casts = events.filter(
    (e) => e.kind === 'mana' && e.reason === 'cast' && e.target === hero().id
  );
  expect(casts.length).toBeGreaterThan(0);
  for (const cast of casts) {
    if (cast.kind !== 'mana') throw new Error('Expected absolute cast mana');
    const previous = events
      .slice(0, events.indexOf(cast))
      .reverse()
      .find((e) => e.kind === 'mana' && e.target === hero().id);
    const manaBefore = previous?.kind === 'mana' ? previous.mana : hero().mana;
    expect(manaBefore - cast.mana).toBeCloseTo(5, 7);
    expect(
      events.some(
        (e) =>
          e.kind === 'action' &&
          e.actor === hero().id &&
          e.skillId === 'necromancer.' + skill.replaceAll('-', '_') &&
          e.simClockMs === cast.simClockMs
      )
    ).toBe(true);
  }
}
for (const skill of ['poison-dagger'] as const) {
  it('freezes the current wave then casts legally learned ' + skill + ' next wave', () => {
    arrange();
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    const first = recording(),
      final = structuredClone(finalHero());
    learn(skill);
    const expectedStats = structuredClone(playerToCombatUnit(player()).stats);
    expect(recording()).toEqual(first);
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(hero().skillLevels?.['necromancer.' + skill.replaceAll('-', '_')]).toBe(1);
    expect(hero().stats).toEqual(expectedStats);
    expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
    expect(
      useCombatStore
        .getState()
        .recordedEvents.some(
          (e) => e.kind === 'action' && e.skillId === 'necromancer.' + skill.replaceAll('-', '_')
        )
    ).toBe(true);
    expectPaidCasts(skill);
    const statusEvent = useCombatStore
      .getState()
      .recordedEvents.find(
        (e) => e.kind === 'status-state' && e.statuses.some((status) => status.id === 'poison')
      );
    const paidStatus =
      statusEvent?.kind === 'status-state'
        ? statusEvent.statuses.find((status) => status.id === 'poison')
        : undefined;
    expect(paidStatus).toMatchObject({
      id: 'poison',
      stacks: 1,
      sourceId: hero().id
    });
    expect(Number.isFinite(paidStatus?.dotPerStack)).toBe(true);
    expect(paidStatus?.dotPerStack).toBeGreaterThanOrEqual(1);
    expect((paidStatus?.expiresAtMs ?? 0) - (paidStatus?.appliedAtMs ?? 0)).toBe(5000);
    const paidRecording = recording(),
      paidFinal = structuredClone(finalHero());
    expect(usePlayerStore.getState().allocateSkillPoint('skills-necromancer-' + skill)).toBe('ok');
    expect(recording()).toEqual(paidRecording);
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(hero().skillLevels?.['necromancer.' + skill.replaceAll('-', '_')]).toBe(2);
    expect([hero().life, hero().mana]).toEqual([paidFinal.life, paidFinal.mana]);
    expectPaidCasts(skill);
  });
  it(
    'roundtrips learned ' + skill + ' and priority without saving transient combat power',
    async () => {
      arrange();
      learn(skill);
      const expected = playerToCombatUnit(player());
      expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
      expect(
        useCombatStore
          .getState()
          .recordedEvents.some(
            (e) => e.kind === 'action' && e.skillId === 'necromancer.' + skill.replaceAll('-', '_')
          )
      ).toBe(true);
      const count = useCombatStore.getState().recordedEvents.length;
      for (
        let i = 0;
        i < count &&
        !useCombatStore
          .getState()
          .enemyTeam.some((enemy) =>
            enemy.statuses.some(
              (status) => status.id === 'poison' && (status.dotPerStack ?? 0) > 0
            )
          );
        i++
      )
        useCombatStore.getState().advanceEvent();
      expect(
        useCombatStore
          .getState()
          .enemyTeam.some((enemy) =>
            enemy.statuses.some(
              (status) => status.id === 'poison' && (status.dotPerStack ?? 0) > 0
            )
          )
      ).toBe(true);
      const save = snapshotStores();
      if (!save) throw new Error('Missing Poison Dagger save');
      const json = JSON.stringify(toJsonSafe(save));
      expect(json).not.toContain('"dotPerStack"');
      await importIntoStores(json);
      const restored = snapshotStores();
      if (!restored) throw new Error('Missing restored Poison Dagger save');
      for (const domain of [
        'endgame',
        'player',
        'inventory',
        'map',
        'mercs',
        'formation',
        'meta'
      ] as const)
        expect(toJsonSafe(restored[domain]), domain).toEqual(toJsonSafe(save[domain]));
      expect(useMapStore.getState().endgame).toEqual(save.endgame);
      expect(playerToCombatUnit(player())).toEqual(expected);
      expect(playerToCombatUnit(player()).statuses).toEqual([]);
      expect(useCombatStore.getState().playerTeam).toEqual([]);
      expect(useCombatStore.getState().enemyTeam).toEqual([]);
      expect(useCombatStore.getState().recordedEvents).toEqual([]);
      expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
      expect(hero().skillLevels?.['necromancer.' + skill.replaceAll('-', '_')]).toBe(1);
      expect(
        useCombatStore
          .getState()
          .recordedEvents.some(
            (e) =>
              e.kind === 'status-state' &&
              e.statuses.some(
                (status) => status.id === 'poison' && (status.dotPerStack ?? 0) > 0
              )
          )
      ).toBe(true);
    }
  );
}
