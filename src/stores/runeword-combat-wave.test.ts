import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as engine from '@/engine/combat/combat';
import type { CombatSnapshot } from '@/engine/combat/combat';
import type { CombatUnit } from '@/engine/combat/types';
import { rebaseStatusClock } from '@/engine/combat/status';
import { deriveStats } from '@/engine/progression/stats';
import { registerSkill, resetRegistry, loadDefaultSkills } from '@/engine/skills/registry';
import { socketRunewords } from '@/data/loaders/socket-effects';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import type { Item, EquipmentSlot } from '@/engine/types/items';
import type { Mercenary } from '@/engine/types/entities';
import { abortSubAreaRun, advanceWaveOrFinish, refreshActivePlayerCombatConfig, startSubAreaRun } from './combatHelpers';
import { useCombatStore } from './combatStore';
import { useInventoryStore } from './inventoryStore';
import { usePlayerStore } from './playerStore';
import { useMercStore } from './mercStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';
import { useHydrationStore } from './hydrationStore';

const stores = [useCombatStore, useInventoryStore, usePlayerStore, useMercStore, useMapStore, useFormationStore] as const;
const FINISHER = 'fixture.runeword-finisher';
let inputs: CombatSnapshot[] = [];
function word(id: string, base: string): Item {
  const row = socketRunewords.find(w => w.id === `runewords/${id}`);
  if (!row) throw new Error(`Missing ${id}`);
  return { id: `wave-${id}`, baseId: `items/base/${base}`, rarity: 'runeword', level: 70,
    identified: true, equipped: false, runewordId: row.id, socketCapacity: row.sockets,
    socketContents: row.runes.map(id => ({ kind: 'rune', id })) };
}
function arrange(): Mercenary {
  const coreStats = { strength: 300, dexterity: 300, vitality: 1000, energy: 20 };
  const hero = { ...createMockPlayer('Wave grant probe', 'paladin'), level: 70, coreStats,
    derivedStats: deriveStats(coreStats, 70), comboOrder: [FINISHER],
    skillLevels: { 'skills-paladin-prayer': 1, 'skills-paladin-cleansing': 1, 'skills-paladin-meditation': 20 } };
  usePlayerStore.getState().setPlayer(hero);
  const merc: Mercenary = { ...hero, id: 'original', type: 'mercenary', classId: 'rogue',
    archetype: 'front', rarity: 'R', comboOrder: [] };
  useMercStore.getState().addMerc(merc);
  useMercStore.getState().addMerc({ ...merc, id: 'bench' });
  useMercStore.getState().setFieldedMerc(merc.id);
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies', minLevel: 1,
    cooldown: 1, manaCost: 8, effects: [{ kind: 'damage', damageType: 'physical', base: [100000, 100000] }] });
  return merc;
}
function start(): void {
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(2);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
}
function latest(): CombatSnapshot {
  const input = inputs.at(-1);
  if (!input) throw new Error('Missing native battle input');
  return input;
}
function bearer(id: string, input = latest()): CombatUnit {
  const value = input.playerTeam.find(unit => unit.id === id);
  if (!value) throw new Error(`Missing ${id}`);
  return value;
}
function recording() {
  const state = useCombatStore.getState();
  return structuredClone({ team: state.playerTeam, events: state.recordedEvents, outcome: state.outcome });
}
function advance(): void {
  useCombatStore.getState().recordedEvents.forEach(() => { useCombatStore.getState().advanceEvent(); });
  expect(useCombatStore.getState().playbackComplete).toBe(true);
  expect(advanceWaveOrFinish()).toBe('next-wave');
}
beforeEach(() => {
  abortSubAreaRun(); for (const store of stores) store.getState().reset();
  inputs = []; resetRegistry(); loadDefaultSkills(); useHydrationStore.getState().setStatus('ready');
  const original = engine.runBattleRecorded;
  vi.spyOn(engine, 'runBattleRecorded').mockImplementation(input => { inputs.push(input); return original(input); });
});
afterEach(() => {
  abortSubAreaRun(); for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('idle'); resetRegistry(); loadDefaultSkills(); vi.restoreAllMocks();
});

describe('native wave-frozen runeword combat effects (constructed integration characters)', () => {
  describe.each(['hero', 'merc'] as const)('%s active-grant wave boundaries', owner => {
    it.each([
      { word: 'leaf', base: 'weapon-staff', slot: 'weapon', id: 'sorceress.fire_bolt', rank: 3 },
      { word: 'hand-of-justice', base: 'wp1h-legend-sword', slot: 'weapon', id: 'sorceress.blaze', rank: 5 },
      { word: 'death', base: 'wp1h-legend-sword', slot: 'weapon', id: 'sorceress.chain_lightning', rank: 5 },
      { word: 'phoenix', base: 'sh-monarch', slot: 'offhand', id: 'item.redemption', rank: 1 }
    ] as const)('refreshes $word only at a fresh wave while preserving resources, priority and replay', row => {
      const merc = arrange(), item = word(row.word, row.base);
      useInventoryStore.getState().addItem(item);
      const hero = usePlayerStore.getState().player;
      if (!hero) throw new Error('Missing hero');
      const id = owner === 'hero' ? hero.id : 'merc-original';
      if (owner === 'hero') {
        usePlayerStore.setState({ player: { ...hero, comboOrder: [FINISHER, row.id] } });
        expect(useInventoryStore.getState().equipItem(item)).toEqual({ ok: true });
      } else {
        useMercStore.setState({ ownedMercs: useMercStore.getState().ownedMercs.map(candidate =>
          candidate.id === merc.id ? { ...candidate, comboOrder: ['mskill-jab', row.id] } : candidate) });
        expect(useMercStore.getState().equipOnMerc(merc.id, row.slot, item)).toEqual({ ok: true });
      }
      const originalSkills = structuredClone(usePlayerStore.getState().player?.skillLevels);
      start();
      expect(bearer(id).governedActiveRanks?.[row.id]).toBe(row.rank);
      expect(bearer(id).skillOrder).toContain(row.id);
      const original = structuredClone(latest()), installed = recording();
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect(latest()).toEqual(original); expect(recording()).toEqual(installed);
      if (owner === 'hero') expect(useInventoryStore.getState().unequipItem(row.slot)).toEqual({ ok: true });
      else expect(useMercStore.getState().unequipFromMerc(merc.id, row.slot)).toEqual({ ok: true });
      expect(recording()).toEqual(installed);
      const final = useCombatStore.getState().outcome?.finalPlayerTeam.find(unit => unit.id === id);
      const end = useCombatStore.getState().recordedEvents.at(-1);
      if (!final || end?.kind !== 'end') throw new Error('Missing final bearer');
      const rebased = rebaseStatusClock(final, end.simClockMs);
      advance();
      const next = bearer(id);
      expect(next.governedActiveRanks?.[row.id]).toBe(0);
      expect(next.skillOrder).not.toContain(row.id);
      expect(next.equippedWeapon).toEqual({});
      expect(next.life).toBe(Math.min(final.life, next.stats.lifeMax));
      expect(next.mana).toBe(Math.min(final.mana, next.stats.manaMax));
      expect(next.statuses).toEqual(rebased.statuses);
      expect(next.cooldowns).toEqual(final.cooldowns);
      expect(next.manaRegenExactCarry).toEqual(final.manaRegenExactCarry);
      expect(inputs[0]).toEqual(original);
      expect(usePlayerStore.getState().player?.skillLevels).toEqual(originalSkills);
      const stored = owner === 'hero' ? usePlayerStore.getState().player?.comboOrder
        : useMercStore.getState().ownedMercs.find(candidate => candidate.id === merc.id)?.comboOrder;
      expect(stored).toContain(row.id);
    });
  });
  it.each(['unequip', 'dismiss', 'remove'] as const)(
    'clears original merc damage/reflection after %s while preserving recording, carry and identity', removal => {
    const merc = arrange();
    const equipment: [EquipmentSlot, Item][] = [
      ['head', word('dream', 'helm-war-hat')], ['chest', word('bramble', 'armor-archon-plate')]
    ];
    for (const [slot, item] of equipment) {
      useInventoryStore.getState().addItem(item);
      expect(useInventoryStore.getState().backpack).toContainEqual(item);
      expect(useMercStore.getState().equipOnMerc(merc.id, slot, item)).toEqual({ ok: true });
    }
    start();
    const originalInput = structuredClone(latest()), originalRecording = recording();
    expect(bearer('merc-original').increasedDamagePct).toEqual({ lightning: .15 });
    expect(bearer('merc-original').physicalReflectionPct).toBe(.2);
    const originalHero = originalInput.playerTeam.find(u => u.kind === 'hero');
    if (!originalHero) throw new Error('Missing original hero');
    expect(bearer(originalHero.id).physicalReflectionPct).toBe(0);
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(latest()).toEqual(originalInput); expect(recording()).toEqual(originalRecording);
    if (removal === 'remove') useMercStore.getState().removeMerc(merc.id);
    else {
      for (const [slot] of equipment) expect(useMercStore.getState().unequipFromMerc(merc.id, slot)).toEqual({ ok: true });
      if (removal === 'dismiss') expect(useMercStore.getState().dismissMerc(merc.id)).toBe(true);
    }
    useMercStore.getState().setFieldedMerc('bench');
    expect(recording()).toEqual(originalRecording);
    const state = useCombatStore.getState(), final = state.outcome?.finalPlayerTeam.find(u => u.id === 'merc-original');
    const end = state.recordedEvents.at(-1);
    if (!final || end?.kind !== 'end') throw new Error('Missing real terminal merc');
    const rebased = rebaseStatusClock(final, end.simClockMs);
    advance();
    const next = bearer('merc-original');
    expect(latest().playerTeam.some(u => u.id === 'merc-bench')).toBe(false);
    expect(next.increasedDamagePct).toEqual({}); expect(next.physicalReflectionPct).toBe(0);
    expect(next.stats).toEqual(merc.derivedStats);
    expect(next.life).toBe(Math.min(final.life, next.stats.lifeMax));
    expect(next.mana).toBe(Math.min(final.mana, next.stats.manaMax));
    expect(next.statuses).toEqual(rebased.statuses); expect(next.cooldowns).toEqual(final.cooldowns);
    expect(next.activeBuffIds).toEqual(final.activeBuffIds);
    expect(next.manaRegenExactCarry).toEqual(final.manaRegenExactCarry);
    expect(inputs[0]).toEqual(originalInput);
  });
  it('keeps Phoenix personal and Meditation based on pre-item recovery across equip, replay and removal', () => {
    arrange();
    expect(usePlayerStore.getState().selectAura('paladin.meditation')).toBe('ok');
    const shield = word('phoenix', 'sh-monarch');
    useInventoryStore.getState().addItem(shield);
    expect(useInventoryStore.getState().backpack).toContainEqual(shield);
    expect(useInventoryStore.getState().equipItem(shield)).toEqual({ ok: true });
    start();
    const hero = latest().playerTeam.find(u => u.kind === 'hero');
    if (!hero) throw new Error('Missing original Phoenix hero');
    const heroId = hero.id;
    expect(hero.manaRegenBaselinePerSecond).toBe(4); expect(hero.manaRegenPerSecond).toBe(4.4);
    expect(latest().meditationAura?.sourceBaselinePerSecond).toBe(4);
    expect(bearer('merc-original').manaRegenPerSecond).toBe(0);
    const before = recording(), input = structuredClone(latest());
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    expect(recording()).toEqual(before); expect(latest()).toEqual(input);
    expect(useInventoryStore.getState().unequipItem('offhand')).toEqual({ ok: true });
    expect(recording()).toEqual(before);
    const final = useCombatStore.getState().outcome?.finalPlayerTeam.find(u => u.id === heroId);
    if (!final) throw new Error('Missing final hero');
    advance();
    expect(bearer(heroId).manaRegenPerSecond).toBe(4);
    expect(latest().meditationAura?.sourceBaselinePerSecond).toBe(4);
    expect(bearer(heroId).mana).toBe(Math.min(final.mana, bearer(heroId).stats.manaMax));
    expect(bearer(heroId).manaRegenExactCarry).toEqual(final.manaRegenExactCarry);
    expect(inputs[0]).toEqual(input);
  });
});
