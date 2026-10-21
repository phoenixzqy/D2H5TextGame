import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHydrationStore } from './hydrationStore';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import type { Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import {
  abortSubAreaRun, advanceWaveOrFinish, hasActiveSubAreaRun, playerToCombatUnit,
  refreshActivePlayerCombatConfig, resetIdleElitePity, startSubAreaRun
} from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';
import { useMetaStore } from './metaStore';

const AREA = 'areas/act1-blood-moor';
const ARMOR = 'sorceress.frozen_armor';
const AUTHORED = 'skills-sorceress-frozen-armor';
const FINISHER = 'fixture.armor-finisher';
const MARKERS = [AUTHORED, ARMOR, 'frozen-armor'];
const stores = [useCombatStore, usePlayerStore, useInventoryStore,
  useMapStore, useMercStore, useFormationStore, useMetaStore] as const;
let gearSequence = 0;

function reset(): void {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
  resetIdleElitePity();
  gearSequence = 0;
}

function player(): Player {
  const current = usePlayerStore.getState().player;
  if (!current) throw new Error('Missing Frozen Armor fixture player');
  return current;
}

/** Explicit imported integration gear; this is not earned campaign preparation. */
function equip(defense = 0, expanded = true): void {
  const cap: Item = { id: `fixture-armor-cap-${String(++gearSequence)}`,
    baseId: 'items/base/helm-cap', rarity: 'rare', level: 1, identified: true,
    equipped: false, affixes: [{ affixId: 'fixture-imported', values: new Map([
      ['statMods.life', expanded ? 999_880 : 0], ['statMods.mana', expanded ? 100 : -79],
      ['statMods.attackSpeed', -63], ['statMods.defense', defense],
      ['statMods.physDodge', -0.1], ['statMods.magicDodge', -0.05]
    ]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
}

/** Synthetic allocation/slot projection retains paid carry; not public hero replacement. */
function configure(skillLevels: Player['skillLevels'], comboOrder = [FINISHER]): void {
  const { skillLevels: prior, ...rest } = player();
  void prior;
  usePlayerStore.setState({ player: { ...rest, comboOrder,
    ...(skillLevels === undefined ? {} : { skillLevels }) } });
}

function arrange(): void {
  // Real map plan/spawns, paid production Armor, engine, playback and awards.
  // The finisher and fixed fire attack are registered integration scaffolding.
  registerSkill({ id: FINISHER, archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 0, effects: [
      { kind: 'damage', damageType: 'physical', base: [100_000, 100_000] },
      { kind: 'buff', id: 'fixture.unrelated', duration: -1 }
    ] });
  registerSkill({ id: 'monster-weak-melee', archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'fire', base: [100, 100] }] });
  const fresh = createMockPlayer('ArmorBoundary', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh,
    coreStats: { ...fresh.coreStats, energy: 20 },
    skillLevels: { [AUTHORED]: 20, 'skills-sorceress-warmth': 1 },
    comboOrder: [ARMOR, FINISHER] });
  equip();
  const equipped = player();
  usePlayerStore.getState().setPlayer({ ...equipped,
    derivedStats: { ...equipped.derivedStats, life: 1_000_000, mana: 0 } });
  useMapStore.getState().setCurrentLocation(1, AREA);
}

function start(mode: 'manual' | 'idle' = 'manual'): void {
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0, mode })?.totalWaves).toBeGreaterThan(1);
}

function drain(): void {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let index = 0; index < count; index++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}

function recording() {
  const state = useCombatStore.getState();
  return structuredClone({ team: state.playerTeam, events: state.recordedEvents,
    outcome: state.outcome, rewards: state.runRewards, cursor: state.eventCursor,
    complete: state.playbackComplete, paused: state.isPaused });
}

function paidFirstWave() {
  arrange();
  start();
  const first = useCombatStore.getState();
  const input = first.playerTeam[0];
  const final = first.outcome?.finalPlayerTeam[0];
  if (!input || !final) throw new Error('Missing actual first-wave result');
  expect(first.outcome?.winner).toBe('player');
  expect(input.frozenArmor).toBeUndefined();
  expect(final.frozenArmor).toEqual({ rank: 20, defensePct: 0.6 });
  const cast = first.recordedEvents.find(event => event.kind === 'action' && event.skillId === ARMOR);
  if (!cast) throw new Error('Missing actual paid Armor cast');
  expect(cast.simClockMs).toBe(2000);
  const before = first.recordedEvents.filter(event => event.kind === 'mana' &&
    event.target === input.id && event.simClockMs <= cast.simClockMs);
  expect(input.manaRegenPerSecond).toBeCloseTo(4.16, 12);
  expect(before.slice(-2).map(event => event.kind === 'mana' ? [event.reason, event.mana] : null))
    .toEqual([['regeneration', 8], ['cast', 3]]);
  expect(before.filter(event => event.kind === 'mana' && event.reason === 'cast')).toHaveLength(1);
  const terminal = first.recordedEvents.at(-1);
  if (terminal?.kind !== 'end') throw new Error('Missing actual terminal clock');
  expect(Number.isFinite(terminal.simClockMs)).toBe(true);
  // Natural hit rolls may require another finisher action; do not assume a4s win.
  const fraction = (4.16 * terminal.simClockMs / 1000) % 1;
  expect(fraction).toBeGreaterThan(0);
  expect(first.recordedEvents.filter(event => event.kind === 'mana' && event.target === input.id)
    .every(event => event.kind === 'mana' && event.mana < input.stats.manaMax)).toBe(true);
  expect(final.mana).toBeLessThan(input.stats.manaMax);
  expect(final.manaRegenCarry).toBeCloseTo(fraction, 12);
  return { first, input, final };
}

function nextPaidWave(withMarkerRepresentations = false) {
  const prior = paidFirstWave();
  if (withMarkerRepresentations) {
    const outcome = prior.first.outcome;
    if (!outcome) throw new Error('Missing actual paid result');
    // Marker representation supplement only; paid potency and victory remain genuine.
    useCombatStore.setState({ outcome: { ...outcome, finalPlayerTeam: [{ ...prior.final,
      activeBuffIds: [...MARKERS, 'fixture.unrelated', 'mskill-frozen-armor', 'frozen_armor'] }] } });
  }
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  const second = useCombatStore.getState();
  const hero = second.playerTeam[0];
  if (!hero) throw new Error('Missing second-wave input');
  expect(hero.frozenArmor).toEqual({ rank: 20, defensePct: 0.6 });
  return { ...prior, second, hero };
}

beforeEach(() => {
  reset();
  useHydrationStore.getState().setStatus('ready');
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});

afterEach(() => {
  reset();
  useHydrationStore.getState().setStatus('idle');
  resetRegistry();
  loadDefaultSkills();
  vi.restoreAllMocks();
});

describe('native paid Frozen Armor lifetime and configuration boundaries', () => {
  it('carries the genuinely paid rank20 potency without recasting or refilling resources', () => {
    const { first, final, second, hero } = nextPaidWave();
    expect(player().level).toBe(2); // Genuine 160XP first-wave award.
    expect(hero.level).toBe(2);
    expect(hero.stats.defense).toBe(30);
    expect(hero.activeBuffIds).toContain('fixture.unrelated');
    expect(hero.activeBuffIds).toContain('frozen-armor');
    expect([hero.life, hero.mana, hero.manaRegenCarry, hero.manaRegenCompensation,
      hero.manaRegenExactCarry]).toEqual([final.life, final.mana, final.manaRegenCarry,
      final.manaRegenCompensation, final.manaRegenExactCarry]);
    expect(second.recordedEvents.some(event => event.kind === 'action' && event.skillId === ARMOR)).toBe(false);
    expect(first.outcome?.finalPlayerTeam[0]).toEqual(final);
  });

  it.each([1, 10, 20])('retains captured potency after positive allocation changes to%s and combo removal', rank => {
    const { final } = paidFirstWave();
    const frozen = recording();
    configure({ [ARMOR]: rank });
    expect(recording()).toEqual(frozen);
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const state = useCombatStore.getState();
    expect(state.playerTeam[0]?.skillLevels).toEqual({ [ARMOR]: rank });
    expect(state.playerTeam[0]?.skillOrder).toEqual([FINISHER]);
    expect(state.playerTeam[0]?.frozenArmor).toEqual(final.frozenArmor);
    expect(state.recordedEvents.some(event => event.kind === 'action' && event.skillId === ARMOR)).toBe(false);
  });

  it('refreshes actual equipped base defense while retaining paid potency in direct damage', () => {
    paidFirstWave();
    equip(20);
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const state = useCombatStore.getState();
    const hero = state.playerTeam[0];
    if (!hero) throw new Error('Missing equipped next-wave hero');
    expect(hero.stats.defense).toBe(50); // Level2 base30 plus actual equipped20.
    expect(hero.frozenArmor).toEqual({ rank: 20, defensePct: 0.6 });
    const hits = state.recordedEvents.filter(event => event.kind === 'damage' &&
      event.target === hero.id && event.damageType === 'fire' && !event.dodged &&
      state.enemyTeam.find(unit => unit.id === event.source)?.skillOrder[0] === 'monster-weak-melee');
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      if (hit.kind !== 'damage') throw new Error('Expected direct fire');
      const source = state.enemyTeam.find(unit => unit.id === hit.source);
      if (!source) throw new Error('Missing actual attacking monster');
      expect(hit.amount).toBe(Math.max(1, Math.floor(100 *
        (hit.crit ? source.stats.critDamage : 1) - 50 * 1.6)));
    }
    expect(player().derivedStats.defense).toBe(50); // Armor never mutates authoritative stats.
  });

  it.each([{}, { [AUTHORED]: 0 }, { [ARMOR]: 0 }, undefined])(
    'strips an actual paid snapshot and exact marker at next-wave unlearned allocation%s', levels => {
      const { first, final } = paidFirstWave();
      const old = structuredClone(first.outcome);
      configure(levels, [ARMOR, FINISHER]);
      drain();
      expect(advanceWaveOrFinish()).toBe('next-wave');
      const second = useCombatStore.getState();
      expect(second.playerTeam[0]).not.toHaveProperty('frozenArmor');
      expect(second.playerTeam[0]?.activeBuffIds).not.toEqual(expect.arrayContaining(['frozen-armor']));
      expect(second.playerTeam[0]?.activeBuffIds).toContain('fixture.unrelated');
      expect(second.outcome?.finalPlayerTeam[0]).not.toHaveProperty('frozenArmor');
      expect(second.recordedEvents.some(event => event.kind === 'action' && event.skillId === ARMOR)).toBe(false);
      expect(first.outcome).toEqual(old);
      expect(final.frozenArmor).toEqual({ rank: 20, defensePct: 0.6 });
    });

  it('strips every exact marker representation while preserving unrelated and mercenary markers', () => {
    const { final } = paidFirstWave();
    drain();
    const state = useCombatStore.getState();
    const outcome = state.outcome;
    if (!outcome) throw new Error('Missing actual paid result');
    // Marker-representation supplement only: the snapshot and victory are real.
    const markers = [...MARKERS, 'fixture.unrelated', 'mskill-frozen-armor', 'frozen_armor'];
    useCombatStore.setState({ outcome: { ...outcome,
      finalPlayerTeam: [{ ...final, activeBuffIds: markers }] } });
    configure({});
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(useCombatStore.getState().playerTeam[0]?.activeBuffIds)
      .toEqual(['fixture.unrelated', 'mskill-frozen-armor', 'frozen_armor']);
    expect(useCombatStore.getState().playerTeam[0]).not.toHaveProperty('frozenArmor');
    expect(outcome.finalPlayerTeam[0]?.frozenArmor).toEqual({ rank: 20, defensePct: 0.6 });
    expect(markers).toEqual([...MARKERS, 'fixture.unrelated', 'mskill-frozen-armor', 'frozen_armor']);
  });

  it.each([{}, { [AUTHORED]: 0 }, { [ARMOR]: 0 }, undefined])(
    'invalidates only the new replay input at%s and restores the original paid baseline after reallocation', levels => {
    const { second, hero } = nextPaidWave(true);
    expect(hero.activeBuffIds).toEqual(expect.arrayContaining(MARKERS));
    const original = recording();
    const originalOutcome = structuredClone(second.outcome);
    configure(levels, [ARMOR, FINISHER]);
    refreshActivePlayerCombatConfig();
    expect(recording()).toEqual(original);
    for (let replay = 0; replay < 2; replay++) {
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      expect(useCombatStore.getState().playerTeam[0]).not.toHaveProperty('frozenArmor');
      for (const marker of MARKERS) expect(useCombatStore.getState().playerTeam[0]?.activeBuffIds).not.toContain(marker);
      expect(useCombatStore.getState().playerTeam[0]?.activeBuffIds)
        .toEqual(['fixture.unrelated', 'mskill-frozen-armor', 'frozen_armor']);
      expect(second.outcome).toEqual(originalOutcome);
      drain();
    }
    configure({ [ARMOR]: 1 });
    refreshActivePlayerCombatConfig({ replayCurrentWave: true });
    const restored = useCombatStore.getState();
    expect(restored.playerTeam[0]?.frozenArmor).toEqual(hero.frozenArmor);
    expect([restored.playerTeam[0]?.life, restored.playerTeam[0]?.mana,
      restored.playerTeam[0]?.manaRegenCarry, restored.playerTeam[0]?.manaRegenCompensation,
      restored.playerTeam[0]?.manaRegenExactCarry]).toEqual([hero.life, hero.mana,
      hero.manaRegenCarry, hero.manaRegenCompensation, hero.manaRegenExactCarry]);
    expect(restored.runRewards).toEqual(original.rewards);
  });

  it('replays from original pools after repeated completed playback, clamps, and restored maxima', () => {
    const { hero, second } = nextPaidWave();
    const progress = structuredClone({ player: player(), backpack: useInventoryStore.getState().backpack,
      currencies: useInventoryStore.getState().currencies, rewards: second.runRewards });
    equip(0, false);
    configure({});
    const small = playerToCombatUnit(player());
    expect(small.stats.lifeMax).toBeLessThan(hero.life);
    expect(small.stats.manaMax).toBeLessThan(hero.mana);
    for (let replay = 0; replay < 2; replay++) {
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      const input = useCombatStore.getState().playerTeam[0];
      const fresh = playerToCombatUnit(player());
      expect(input?.life).toBe(Math.min(hero.life, fresh.stats.lifeMax));
      expect(input?.mana).toBe(Math.min(hero.mana, fresh.stats.manaMax));
      expect(input).not.toHaveProperty('frozenArmor');
      expect([input?.manaRegenCarry, input?.manaRegenCompensation, input?.manaRegenExactCarry])
        .toEqual([0, 0, '0']);
      drain();
    }
    equip();
    configure({ [ARMOR]: 20, 'skills-sorceress-warmth': 1 });
    for (let replay = 0; replay < 2; replay++) {
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      const input = useCombatStore.getState().playerTeam[0];
      expect(input?.frozenArmor).toEqual(hero.frozenArmor);
      expect([input?.life, input?.mana, input?.manaRegenCarry, input?.manaRegenCompensation,
        input?.manaRegenExactCarry]).toEqual([hero.life, hero.mana, hero.manaRegenCarry,
        hero.manaRegenCompensation, hero.manaRegenExactCarry]);
      expect(useCombatStore.getState().runRewards).toEqual(progress.rewards);
      drain();
    }
    expect(player().experience).toBe(progress.player.experience);
    expect(useInventoryStore.getState().currencies).toEqual(progress.currencies);
    // Only the explicit fixture gear operations changed the backpack; no replay rewards.
    expect(useInventoryStore.getState().backpack.filter(item => !item.id.startsWith('fixture-armor-cap-')))
      .toEqual(progress.backpack.filter(item => !item.id.startsWith('fixture-armor-cap-')));
  });

  it.each(['new-start', 'victory-repeat', 'flee', 'idle-stop', 'death'] as const)(
    'never imports paid armor into a fresh run after%s', exit => {
      paidFirstWave();
      if (exit === 'victory-repeat') {
        const count = useCombatStore.getState().totalWaves;
        for (let wave = 1; wave <= count; wave++) {
          expect(useCombatStore.getState().outcome?.winner).toBe('player');
          drain();
          expect(advanceWaveOrFinish()).toBe(wave === count ? 'victory' : 'next-wave');
        }
        expect(hasActiveSubAreaRun()).toBe(false);
        useCombatStore.getState().endCombat(); // Native idle repeat reset before fresh start.
      } else if (exit === 'flee' || exit === 'idle-stop') {
        // Exact native operations of the UI handlers; browser clicks are separate evidence.
        if (exit === 'idle-stop') {
          start('idle');
          useMetaStore.getState().setIdleTarget(AREA);
          drain();
          expect(useCombatStore.getState().playerTeam[0]?.frozenArmor).toEqual({ rank: 20, defensePct: 0.6 });
          useMetaStore.getState().setIdleTarget(undefined);
          resetIdleElitePity();
          abortSubAreaRun();
        } else {
          abortSubAreaRun();
          useMetaStore.getState().setIdleTarget(undefined);
          resetIdleElitePity();
        }
        useCombatStore.getState().endCombat();
        expect(hasActiveSubAreaRun()).toBe(false);
      } else if (exit === 'death') {
        configure({ [ARMOR]: 20 }, []);
        equip(0, false);
        drain();
        expect(advanceWaveOrFinish()).toBe('next-wave');
        expect(useCombatStore.getState().playerTeam[0]?.frozenArmor).toEqual({ rank: 20, defensePct: 0.6 });
        expect(useCombatStore.getState().outcome?.finalPlayerTeam[0]?.life).toBe(0);
        drain();
        expect(advanceWaveOrFinish()).toBe('defeat');
        expect(hasActiveSubAreaRun()).toBe(false);
      }
      configure({ [ARMOR]: 20 }); // Disable the Armor combo to expose leakage.
      start(exit === 'victory-repeat' ? 'idle' : 'manual');
      const fresh = useCombatStore.getState();
      expect(fresh.playerTeam[0]).not.toHaveProperty('frozenArmor');
      expect(fresh.outcome?.finalPlayerTeam[0]).not.toHaveProperty('frozenArmor');
      for (const marker of MARKERS) expect(fresh.playerTeam[0]?.activeBuffIds).not.toContain(marker);
      expect(fresh.recordedEvents.some(event => event.kind === 'action' && event.skillId === ARMOR)).toBe(false);
    });
});
