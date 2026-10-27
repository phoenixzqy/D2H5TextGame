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
  if (!value) throw new Error('Missing functional Druid');
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
  const fresh = createMockPlayer('Native Druid form fixture', 'druid');
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level: 30,
    skillPoints: 2,
    comboOrder: ['druid.werewolf', 'druid.werebear'],
    skillLevels: { 'druid.werewolf': 1, 'druid.werebear': 1, 'druid.lycanthropy': 1 }
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
  if (!value) throw new Error('Missing native Druid outcome');
  return value;
}

it('updates retained wolf potency next wave, preserves playback capacity/absolute HP, and replays original resources', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
  const first = recording(),
    final = structuredClone(finalHero());
  expect(final.druidForm).toEqual({
    sourceHeroId: player().id,
    form: 'werewolf',
    rank: 1,
    lycanthropyRank: 1
  });
  expect(usePlayerStore.getState().allocateSkillPoint('skills-druid-lycanthropy')).toBe('ok');
  expect(recording()).toEqual(first);
  drain();
  expect(hero().druidForm).toEqual(final.druidForm);
  expect([hero().life, hero().stats.lifeMax, hero().mana]).toEqual([
    final.life,
    final.stats.lifeMax,
    final.mana
  ]);
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().druidForm).toEqual({
    sourceHeroId: player().id,
    form: 'werewolf',
    rank: 1,
    lycanthropyRank: 2
  });
  expect(hero().stats.lifeMax).toBe(
    (hero().druidFormLife?.baseLifeMax ?? 0) +
      Math.floor((hero().druidFormLife?.baseLifeMax ?? 0) * 0.06)
  );
  expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
  expect(
    useCombatStore
      .getState()
      .recordedEvents.some((e) => e.kind === 'action' && e.skillId === 'druid.werewolf')
  ).toBe(false);
  const second = recording();
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(recording()).toEqual(second);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(recording()).toEqual(second);
});

it('changes selected form only next wave and requires a new paid bear cast; pure allocation reset removes carry', () => {
  arrange();
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  const first = recording();
  usePlayerStore.getState().setComboOrder(['druid.werebear', 'druid.werewolf']);
  expect(recording()).toEqual(first);
  drain();
  const final = structuredClone(finalHero());
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(hero().druidForm).toBeUndefined();
  expect(hero().life).toBe(Math.min(final.life, hero().stats.lifeMax));
  expect(finalHero().druidForm).toEqual({
    sourceHeroId: player().id,
    form: 'werebear',
    rank: 1,
    lycanthropyRank: 0
  });
  expect(
    useCombatStore
      .getState()
      .recordedEvents.filter((e) => e.kind === 'action' && e.skillId?.startsWith('druid.were'))
      .map((e) => (e.kind === 'action' ? e.skillId : ''))
  ).toEqual(['druid.werebear']);
  const second = recording();
  // This helper proves pure composition; it does not establish paid town-respec acceptance.
  expect(resetSkillsForCompositionTest()).toBe('ok');
  expect(recording()).toEqual(second);
  refreshActivePlayerCombatConfig({ replayCurrentWave: true });
  expect(finalHero().druidForm).toBeUndefined();
  expect(
    useCombatStore
      .getState()
      .recordedEvents.some((e) => e.kind === 'action' && e.skillId?.startsWith('druid.were'))
  ).toBe(false);
  expect(useCombatStore.getState().runRewards).toEqual(second.rewards);
});

it('persists only allocations/combo, imports exact save22, and starts a fresh run human', async () => {
  arrange();
  const expected = playerToCombatUnit(player()),
    save = snapshotStores();
  if (!save) throw new Error('Missing native save');
  expect(save.version).toBe(23);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
  expect(finalHero().druidForm?.form).toBe('werewolf');
  const serialized = JSON.stringify(toJsonSafe(snapshotStores()));
  for (const field of ['druidShapeRanks', 'druidForm', 'druidFormLife'])
    expect(serialized).not.toContain(field);
  await importIntoStores(JSON.stringify(toJsonSafe(save)));
  expect(player()).toEqual(save.player);
  expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
  expect(playerToCombatUnit(player())).toEqual(expected);
  expect(playerToCombatUnit(player()).druidForm).toBeUndefined();
  expect(useCombatStore.getState().playerTeam).toEqual([]);
});
