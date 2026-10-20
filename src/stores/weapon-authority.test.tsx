/** Real canonical inventory, Skills and production battle recording, no runtime mocks. */
import { afterEach, assert, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import type { Item } from '@/engine/types/items';
import type { Player } from '@/engine/types/entities';
import i18n from '@/i18n';
import { SkillsScreen } from '@/features/skills/SkillsScreen';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { BACKPACK_CAPACITY } from './inventoryCapacity';
import { useCombatStore } from './combatStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { abortSubAreaRun, advanceWaveOrFinish, playerToCombatUnit,
  refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';

const ARROW = 'amazon.magic_arrow';
const OPTION = 'skills-amazon-magic-arrow';
const BOW = 'items/base/weapon-bow-training';
const SWORD = 'items/base/wp1h-short-sword';
const SHIELD = 'items/base/sh-buckler';
function item(id: string, baseId = BOW, extra: Partial<Item> = {}): Item {
  return { id, baseId, rarity: 'normal', level: 1, identified: true, equipped: false,
    ...(baseId === BOW ? { ilvl: 1, baseRolls: { attack: 13 } } : {}), ...extra };
}
function player(): Player {
  const value = usePlayerStore.getState().player;
  assert(value);
  return value;
}
function arrange(legacy: readonly Item[] = [], equipped: Record<string, Item | null> = {}) {
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Authority', 'amazon'), equipment: legacy });
  // Imported defensive fixture only: real authored arrow/plan/engine; no campaign/balance claim.
  const cap = item('boundary-cap', 'items/base/helm-cap', { affixes: [{ affixId: 'boundary',
    values: new Map([['statMods.life', 1_000_000], ['statMods.defense', 100_000]]) }] });
  useInventoryStore.setState({ equipped: { head: cap, ...equipped } });
  usePlayerStore.getState().recomputeDerived(useInventoryStore.getState().equipped);
  const current = player();
  usePlayerStore.getState().setPlayer({ ...current, derivedStats: {
    ...current.derivedStats, life: current.derivedStats.lifeMax, mana: current.derivedStats.manaMax
  } });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
}
function start() {
  const handle = startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 });
  assert(handle);
  return handle;
}
function recording() {
  const state = useCombatStore.getState();
  const data = { team: state.playerTeam, events: state.recordedEvents, outcome: state.outcome,
    cursor: state.eventCursor, rewards: state.runRewards, paused: state.isPaused };
  return { ...data, snapshot: structuredClone(data) };
}
function expectFrozen(before: ReturnType<typeof recording>) {
  const after = recording();
  expect(after).toEqual(before);
  expect(after.team).toBe(before.team);
  expect(after.events).toBe(before.events);
  expect(after.outcome).toBe(before.outcome);
}
function expectArrowCasts(expected: boolean) {
  const events = useCombatStore.getState().recordedEvents;
  const hero = player().id;
  const casts = events.filter((event) => event.kind === 'action' && event.actor === hero && event.skillId === ARROW);
  if (expected) {
    expect(casts.length).toBeGreaterThan(0);
    expect(events.some((event) => event.kind === 'mana' && event.target === hero && event.reason === 'cast')).toBe(true);
    expect(events.some((event) => event.kind === 'damage' && event.source === hero && event.damageType === 'arcane' && event.amount > 0)).toBe(true);
  } else {
    expect(casts).toEqual([]);
    expect(events.some((event) => event.kind === 'action' && event.actor === hero && event.skillId === null)).toBe(true);
  }
}
function showSkills() {
  render(<I18nextProvider i18n={i18n}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SkillsScreen /></MemoryRouter>
  </I18nextProvider>);
  const active = document.querySelector<HTMLButtonElement>('button[role="tab"][aria-controls="tabpanel-active"]');
  assert(active);
  fireEvent.click(active);
}
function comboSelect(): HTMLSelectElement {
  const select = document.querySelector<HTMLSelectElement>('select');
  assert(select);
  return select;
}
function hasArrowOption() {
  return Array.from(comboSelect().options).some((option) => option.value === OPTION);
}
function equip(candidate: Item) {
  useInventoryStore.getState().addItem(candidate);
  expect(useInventoryStore.getState().equipItem(candidate)).toEqual({ ok: true });
}
function drain() {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let index = 0; index < count; index++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}
function reset() {
  abortSubAreaRun();
  for (const store of [usePlayerStore, useInventoryStore, useCombatStore, useMapStore, useMercStore, useFormationStore]) store.getState().reset();
}
beforeEach(async () => {
  reset();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
  await i18n.changeLanguage('en');
});
afterEach(() => { cleanup(); reset(); vi.restoreAllMocks(); });

describe('actual canonical weapon authority', () => {
  it('records real Magic Arrow casts from a canonical bow with empty legacy', () => {
    arrange([], { weapon: item('bow') });
    start();
    expectArrowCasts(true);
  });
  it('records only ordinary hero attacks from canonical sword despite stale bow', () => {
    arrange([item('legacy-bow', BOW, { equipSlot: 'weapon' })], { weapon: item('sword', SWORD) });
    start();
    expectArrowCasts(false);
  });
  const staleBow = item('legacy-bow', BOW, { equipped: true, equipSlot: 'weapon' });
  it.each([
    { name: 'canonical bow empty legacy', equipped: { weapon: item('bow') }, legacy: [], casts: true, type: 'bow' },
    { name: 'canonical bow stale sword', equipped: { weapon: item('bow') }, legacy: [item('legacy-sword', SWORD, { equipSlot: 'weapon' })], casts: true, type: 'bow' },
    { name: 'canonical crossbow', equipped: { weapon: item('crossbow', 'items/base/weapon-crossbow') }, legacy: [], casts: true, type: 'crossbow' },
    { name: 'canonical slot wins flags', equipped: { weapon: item('bow', BOW, { equipped: false, equipSlot: 'head' }) }, legacy: [], casts: true, type: 'bow' },
    { name: 'canonical sword stale bow', equipped: { weapon: item('sword', SWORD) }, legacy: [staleBow], casts: false, type: 'sword' },
    { name: 'canonical null stale bow', equipped: { weapon: null }, legacy: [staleBow], casts: false, type: undefined },
    { name: 'canonical missing stale bow', equipped: {}, legacy: [staleBow], casts: false, type: undefined },
    { name: 'canonical unknown stale bow', equipped: { weapon: item('unknown', 'items/base/unknown') }, legacy: [staleBow], casts: false, type: undefined },
    { name: 'bow only wrong slot', equipped: { hands: item('bow') }, legacy: [], casts: false, type: undefined }
  ])('$name controls metadata and authored action/mana/damage', ({ equipped, legacy, casts, type }) => {
    arrange(legacy, equipped);
    const before = structuredClone({ player: player(), inventory: useInventoryStore.getState().equipped });
    const unit = playerToCombatUnit(player());
    expect(unit.equippedWeapon).toEqual(type ? { weaponType: type, handedness: type === 'sword' ? 'oneHanded' : 'twoHanded' } : {});
    start();
    expectArrowCasts(casts);
    expect({ player: player(), inventory: useInventoryStore.getState().equipped }).toEqual(before);
  });

  it('a bow in backpack alone grants no authority', () => {
    arrange();
    useInventoryStore.getState().addItem(item('carried-bow'));
    expect(playerToCombatUnit(player()).equippedWeapon).toEqual({});
    start();
    expectArrowCasts(false);
  });
});

describe('mounted Skills and recording lifetime', () => {
  it('automatic canonical-ID normalization preserves current recording references and cursor', () => {
    arrange([item('legacy-bow', BOW, { equipSlot: 'weapon' })], { weapon: item('bow') });
    start();
    useCombatStore.getState().advanceEvent();
    const before = recording();
    showSkills();
    expect(hasArrowOption()).toBe(true);
    expect(player().comboOrder).toEqual([OPTION]);
    expectFrozen(before);
  });
  it('tracks real unequip/re-equip and only explicit player selection replays the current wave', () => {
    const bow = item('bow');
    arrange([], { weapon: bow });
    start();
    const initial = recording();
    showSkills();
    expect(hasArrowOption()).toBe(true);
    expect(player().comboOrder).toEqual([OPTION]);
    expectFrozen(initial); // automatic canonical→data ID normalization must not replay
    act(() => { expect(useInventoryStore.getState().unequipItem('weapon')).toEqual({ ok: true }); });
    expect(hasArrowOption()).toBe(false);
    expect(player().comboOrder).toEqual([]);
    expectFrozen(initial);
    refreshActivePlayerCombatConfig();
    expectFrozen(initial);
    act(() => { expect(useInventoryStore.getState().equipItem(bow)).toEqual({ ok: true }); });
    expect(hasArrowOption()).toBe(true);
    expect(player().comboOrder).toEqual([]);
    expect(player().skillLevels?.[ARROW]).toBe(1);
    expectFrozen(initial);
    fireEvent.change(comboSelect(), { target: { value: OPTION } });
    expect(player().comboOrder).toEqual([OPTION]);
    expect(useCombatStore.getState().recordedEvents).not.toBe(initial.events);
    expectArrowCasts(true);
  });

  it.each([SWORD, SHIELD])('real replacement %s removes bow gating without altering the current recording', (baseId) => {
    const bow = item('bow');
    arrange([item('legacy-bow', BOW, { equipSlot: 'weapon' })], { weapon: bow });
    start();
    showSkills();
    const before = recording();
    expect(hasArrowOption()).toBe(true);
    act(() => { equip(item('replacement', baseId)); });
    expect(hasArrowOption()).toBe(false);
    expect(player().comboOrder).toEqual([]);
    expectFrozen(before);
    expect(useInventoryStore.getState().backpack.some((candidate) => candidate.id === bow.id)).toBe(true);
  });

  it('capacity and level refusals preserve gear, option, combo and recording', () => {
    const bow = item('bow');
    arrange([item('legacy-bow', BOW, { equipSlot: 'weapon' })], { weapon: bow });
    start(); showSkills();
    const before = recording();
    const combo = player().comboOrder;
    act(() => {
      useInventoryStore.setState({ backpack: Array.from({ length: BACKPACK_CAPACITY }, (_, index) => item(`filler-${String(index)}`, SWORD)) });
    });
    const inventory = useInventoryStore.getState();
    act(() => { expect(inventory.unequipItem('weapon')).toEqual({ ok: false, reason: 'backpack_full' }); });
    expect(useInventoryStore.getState()).toBe(inventory);
    const high = item('high-bow', 'items/base/weapon-bow');
    act(() => { useInventoryStore.setState({ backpack: [high] }); });
    const beforeHigh = useInventoryStore.getState();
    act(() => { expect(beforeHigh.equipItem(high)).toEqual({ ok: false, reason: 'requirements_not_met' }); });
    expect(useInventoryStore.getState()).toBe(beforeHigh);
    expect(hasArrowOption()).toBe(true);
    expect(player().comboOrder).toBe(combo);
    expectFrozen(before);
  });

  it('explicit replay reads replacement metadata and suppresses stale-bow casts', () => {
    arrange([item('legacy-bow', BOW, { equipSlot: 'weapon' })], { weapon: item('bow') });
    start(); expectArrowCasts(true);
    const before = recording();
    equip(item('sword', SWORD));
    expectFrozen(before);
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(useCombatStore.getState().playerTeam[0]?.equippedWeapon).toEqual({ weaponType: 'sword', handedness: 'oneHanded' });
    expectArrowCasts(false);
  });

  it('a genuinely won/drained next wave picks up replacement canonical gear without manual refresh', () => {
    arrange([item('legacy-bow', BOW, { equipSlot: 'weapon' })], { weapon: item('bow') });
    expect(start().totalWaves).toBeGreaterThan(1);
    expect(useCombatStore.getState().outcome?.winner).toBe('player');
    expectArrowCasts(true);
    const before = recording();
    equip(item('sword', SWORD));
    expectFrozen(before);
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(useCombatStore.getState().playerTeam[0]?.equippedWeapon).toEqual({ weaponType: 'sword', handedness: 'oneHanded' });
    expectArrowCasts(false);
  });
});
