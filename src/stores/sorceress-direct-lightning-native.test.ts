import { afterEach, beforeEach, expect, it, vi } from 'vitest';
// Persistence I/O only is faked; save validation, allocation and combat are real.
vi.mock('./save-adapter', () => ({
  hasSave: vi.fn(),
  loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)),
  deleteSave: vi.fn()
}));
import rows from '@/data/skills/sorceress.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Item } from '@/engine/types/items';
import {
  abortSubAreaRun,
  advanceWaveOrFinish,
  playerToCombatUnit,
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
  if (!value) throw new Error('Missing functional Sorceress');
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
/** Constructed level/pool/Attack/critical equipment; never earned balance. */
function arrange() {
  const fresh = createMockPlayer('Synthetic direct lightning wave fixture', 'sorceress');
  usePlayerStore.getState().setPlayer({
    ...fresh,
    level: 30,
    skillPoints: 12,
    comboOrder: [],
    skillLevels: {}
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
          ['statMods.attackSpeed', 100],
          ['statMods.critChance', 1000]
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
function learn(skill: 'charged-bolt' | 'lightning' | 'nova' | 'chain-lightning') {
  const learned = new Set<string>();
  function add(id: string) {
    if (learned.has(id)) return;
    const row = rows.find(s => s.id === id);
    if (!row) throw new Error('Missing native attack prerequisite');
    for (const prerequisite of row.prerequisites ?? []) add(prerequisite);
    expect(usePlayerStore.getState().allocateSkillPoint(id)).toBe('ok');
    learned.add(id);
  }
  add('skills-sorceress-' + skill);
  usePlayerStore.getState().setComboOrder(['skills-sorceress-' + skill]);
}
for (const skill of ['charged-bolt', 'lightning', 'nova', 'chain-lightning'] as const) {
  it('freezes the current wave then casts legally learned ' + skill + ' next wave', () => {
    arrange();
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    const first = recording(), final = structuredClone(finalHero());
    learn(skill);
    const expectedStats = structuredClone(playerToCombatUnit(player()).stats);
    expect(recording()).toEqual(first);
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(hero().skillLevels?.['sorceress.' + skill.replaceAll('-', '_')]).toBe(1);
    expect(hero().stats).toEqual(expectedStats);
    expect([hero().life, hero().mana]).toEqual([final.life, final.mana]);
    expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'action' && e.skillId === 'sorceress.' + skill.replaceAll('-', '_'))).toBe(true);
    expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'mana' && e.reason === 'cast')).toBe(true);
  });
  it('roundtrips learned ' + skill + ' and priority without saving transient combat power', async () => {
    arrange(); learn(skill);
    const expected = playerToCombatUnit(player()), save = snapshotStores();
    if (!save) throw new Error('Missing attack save');
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).toBeTruthy();
    expect(useCombatStore.getState().recordedEvents.some(e => e.kind === 'action' && e.skillId === 'sorceress.' + skill.replaceAll('-', '_'))).toBe(true);
    await importIntoStores(JSON.stringify(toJsonSafe(save)));
    expect(player()).toEqual(save.player);
    expect(toJsonSafe(snapshotStores()?.inventory)).toEqual(toJsonSafe(save.inventory));
    expect(playerToCombatUnit(player())).toEqual(expected);
    expect(playerToCombatUnit(player()).statuses).toEqual([]);
    expect(useCombatStore.getState().playerTeam).toEqual([]);
  });
}
