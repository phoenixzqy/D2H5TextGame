import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetSkillsForCompositionTest } from '../../tests/helpers/reset-skills';
// Disk I/O only is faked. Real allocation, validated import, wave recording and replay run.
vi.mock('./save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { toJsonSafe } from '@/engine/save';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { abortSubAreaRun, advanceWaveOrFinish, playerToCombatUnit, refreshActivePlayerCombatConfig,
  startSubAreaRun } from './combatHelpers';
import { snapshotStores, importIntoStores, __resetPersistenceForTests } from './persistence';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';
import { useHydrationStore } from './hydrationStore';

const FINISHER = 'fixture.player-ownership-finisher';
const PRIORITIES = ['barbarian.bash', 'sorceress.ice_blast', FINISHER];
const stores = [useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore] as const;
function reset() {
  __resetPersistenceForTests(); abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}
function player(): Player {
  const p = usePlayerStore.getState().player;
  if (!p) throw new Error('Missing synthetic ownership hero');
  return p;
}
function hero() {
  const h = useCombatStore.getState().playerTeam[0];
  if (!h) throw new Error('Missing native ownership wave');
  return h;
}
function recording() {
  const s = useCombatStore.getState();
  return structuredClone({ team: s.playerTeam, events: s.recordedEvents, outcome: s.outcome,
    cursor: s.eventCursor, rewards: s.runRewards });
}
function arrange(ranks: NonNullable<Player['skillLevels']> = {}) {
  const fresh = createMockPlayer('Synthetic ownership native fixture', 'barbarian');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 30, skillLevels: ranks,
    skillPoints: 2, comboOrder: PRIORITIES });
  const cap: Item = { id: 'fixture-ownership-cap', baseId: 'items/base/helm-cap',
    rarity: 'rare', level: 1, socketCapacity: 0, identified: true, equipped: false,
    affixes: [{ affixId: 'fixture-imported', values: new Map([
      ['statMods.life', 999000], ['statMods.mana', 999000], ['statMods.attackSpeed', 1000]]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 1, manaCost: 8, effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
}
function start() {
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
}
function drain() {
  const length = useCombatStore.getState().recordedEvents.length;
  for (let index = 0; index < length; index++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready'); resetRegistry(); loadDefaultSkills();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});
afterEach(() => {
  reset(); useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks();
});

describe('native ordinary class-active allocation/recording/persistence', () => {
  it('keeps unlearned/foreign slots dormant, learns publicly, then enables only next wave without a refill', () => {
    arrange(); start();
    expect(hero().skillOrder).toEqual([FINISHER]);
    const before = recording();
    expect(usePlayerStore.getState().allocateSkillPoint('skills-barbarian-bash')).toBe('ok');
    expect(recording()).toEqual(before);
    expect(player().comboOrder).toEqual(PRIORITIES);
    const final = before.outcome?.finalPlayerTeam[0];
    if (!final) throw new Error('Missing original final hero');
    drain(); expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(hero().skillOrder).toEqual(['barbarian.bash', FINISHER]);
    expect([hero().life, hero().mana, hero().manaRegenExactCarry])
      .toEqual([final.life, final.mana, final.manaRegenExactCarry]);
    expect(recording().events.some(event => event.kind === 'action' && event.skillId === 'barbarian.bash')).toBe(true);
    expect(recording().events.some(event => event.kind === 'action' && event.skillId === 'sorceress.ice_blast')).toBe(false);
  });
  it('replays from original resources after a composition reset without duplicate income', () => {
    arrange({ 'barbarian.bash': 2 }); start();
    const original = structuredClone(hero()), before = recording();
    expect(resetSkillsForCompositionTest()).toBe('ok');
    // The existing reset clears slots. Publicly restoring priorities cannot restore ownership.
    usePlayerStore.getState().setComboOrder(PRIORITIES);
    expect(recording()).toEqual(before);
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(hero().skillOrder).toEqual([FINISHER]);
    expect([hero().life, hero().mana, hero().manaRegenExactCarry])
      .toEqual([original.life, original.mana, original.manaRegenExactCarry]);
    expect(useCombatStore.getState().runRewards).toEqual(before.rewards);
    const first = recording();
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(recording()).toEqual(first);
    expect(player().comboOrder).toEqual(PRIORITIES);
  });
  it('imports dormant foreign/unlearned slots exactly and recomposes without granting ownership', async () => {
    arrange({ 'sorceress.ice_bolt': 1, 'sorceress.ice_blast': 20 });
    const save = snapshotStores(); if (!save) throw new Error('Missing save');
    const before = structuredClone(save.player);
    expect(save.version).toBe(23);
    await importIntoStores(JSON.stringify(toJsonSafe(save)));
    expect(player()).toEqual(before);
    expect(playerToCombatUnit(player()).skillOrder).toEqual([FINISHER]);
    expect(playerToCombatUnit(player())).toEqual(playerToCombatUnit(player()));
    expect(useCombatStore.getState().playerTeam).toEqual([]);
    start();
    expect(recording().events.some(event => event.kind === 'action' && event.skillId !== FINISHER && event.actor === player().id)).toBe(false);
    expect(player().skillLevels).toEqual(before.skillLevels);
  });
});
