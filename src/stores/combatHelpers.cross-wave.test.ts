import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import * as combatEngine from '@/engine/combat/combat';
import { applyStatus } from '@/engine/combat/status';
import { createRng } from '@/engine/rng';
import type { Item } from '@/engine/types/items';
import {
  abortSubAreaRun, advanceWaveOrFinish, hasActiveSubAreaRun,
  refreshActivePlayerCombatConfig, startSubAreaRun
} from './combatHelpers';
import { useCombatStore } from './combatStore';
import { usePlayerStore } from './playerStore';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useMercStore } from './mercStore';
import { useFormationStore } from './formationStore';

const AREA = 'areas/act1-blood-moor';
const stores = [useCombatStore, usePlayerStore, useInventoryStore,
  useMapStore, useMercStore, useFormationStore] as const;

function reset(): void {
  abortSubAreaRun();
  for (const store of stores) store.getState().reset();
}

function equipWaveCap(attackSpeedBonus = -63): void {
  // Imported gear preserves the old controlled timing/stats through actual equip.
  const cap: Item = { id: `fixture-wave-cap-${String(attackSpeedBonus)}`,
    baseId: 'items/base/helm-cap', rarity: 'rare', level: 1, identified: true,
    equipped: false, affixes: [{ affixId: 'fixture-wave-clock', values: new Map([
      ['statMods.life', 999_880], ['statMods.attack', -21], ['statMods.defense', -27],
      ['statMods.attackSpeed', attackSpeedBonus], ['statMods.physDodge', -0.1],
      ['statMods.magicDodge', -0.05]
    ]) }] };
  useInventoryStore.getState().addItem(cap);
  expect(useInventoryStore.getState().equipItem(cap)).toEqual({ ok: true });
}

function start(withRecovery = false): void {
  // Real production plan, spawn, targeting, damage, status and playback paths;
  // only skill definitions and hero stats are controlled integration fixtures.
  registerSkill({ id: 'fixture.wave-finisher', archetype: 'fixture', target: 'all-enemies',
    cooldown: 1, manaCost: 0, minLevel: 1, effects: [
      { kind: 'damage', damageType: 'physical', base: [100_000, 100_000] },
      { kind: 'buff', id: 'fixture.carried-buff', duration: -1 }
    ] });
  registerSkill({ id: 'monster-weak-melee', archetype: 'fixture', target: 'all-enemies',
    cooldown: 100, manaCost: 0, minLevel: 1, effects: [
      { kind: 'damage', damageType: 'poison', base: [10, 10],
        applyStatus: { id: 'poison', dotPctOfDamage: 1 } }
    ] });
  const fresh = createMockPlayer('WaveClock', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, comboOrder: ['fixture.wave-finisher'],
    ...(withRecovery ? { coreStats: { ...fresh.coreStats, energy: 20 },
      skillLevels: { 'skills-sorceress-warmth': 1 } } : {}) });
  equipWaveCap();
  const equipped = usePlayerStore.getState().player;
  if (!equipped) throw new Error('Missing equipped clock fixture');
  usePlayerStore.getState().setPlayer({ ...equipped, derivedStats: {
    ...equipped.derivedStats, life: 1_000_000, mana: withRecovery ? 0 : 102
  } });
  useMapStore.getState().setCurrentLocation(1, AREA);
  expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })?.totalWaves).toBeGreaterThan(1);
  expect(useCombatStore.getState().outcome?.winner).toBe('player');
}

function next() {
  start();
  const first = useCombatStore.getState();
  const end = first.recordedEvents.at(-1);
  const hero = first.outcome?.finalPlayerTeam[0];
  if (end?.kind !== 'end' || !hero) throw new Error('Missing actual first-wave result');
  const poison = hero.statuses.find(s => s.id === 'poison');
  if (!poison) throw new Error('First wave must genuinely apply poison');
  const before = structuredClone(first.outcome);
  drain();
  expect(advanceWaveOrFinish()).toBe('next-wave');
  expect(first.outcome).toEqual(before);
  return { hero, poison, elapsed: end.simClockMs, second: useCombatStore.getState() };
}

function drain(): void {
  const count = useCombatStore.getState().recordedEvents.length;
  for (let i = 0; i < count; i++) useCombatStore.getState().advanceEvent();
  expect(useCombatStore.getState().playbackComplete).toBe(true);
}

beforeEach(() => {
  reset();
  vi.spyOn(Date, 'now').mockReturnValue(1792454400000);
});

describe('production continuous-mana carry between recorded waves', () => {
  function firstRecoveryWave() {
    start(true);
    const first = useCombatStore.getState();
    const input = first.playerTeam[0];
    const final = first.outcome?.finalPlayerTeam[0];
    if (!input || !final) throw new Error('Missing genuine recovery wave');
    expect(input.manaRegenPerSecond).toBeCloseTo(4.16, 12); // Controlled E20, actual learned Warmth1.
    expect(input.stats.manaMax).toBe(80); // 50 + 20 × 1.5 at level1.
    expect(input.mana).toBe(0);
    expect(input.manaRegenCarry).toBe(0);
    expect(first.recordedEvents.at(-1)?.simClockMs).toBe(4000);
    expect(first.recordedEvents.filter(e => e.kind === 'orb' && e.orb.kind === 'mp')).toHaveLength(1);
    return { first, final };
  }

  it('carries an actually earned fraction through start → drain → advance and adds it only once next wave', () => {
    const { final } = firstRecoveryWave();
    expect.soft(final.manaRegenCarry).toBeCloseTo(0.64, 12);
    expect.soft(final.mana).toBe(20); // 16 recovered + one actual floor(80 × .05) = 4-MP orb.
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const second = useCombatStore.getState();
    expect(second.recordedEvents.at(-1)?.simClockMs).toBe(6000);
    expect(second.playerTeam[0]?.stats.manaMax).toBe(84); // Genuine level2 refresh.
    expect(second.recordedEvents.filter(e => e.kind === 'orb' && e.orb.kind === 'mp')).toHaveLength(9);
    expect.soft(second.playerTeam[0]?.mana).toBe(final.mana);
    expect.soft(second.playerTeam[0]?.manaRegenCarry).toBeCloseTo(0.64, 12);
    expect.soft(second.outcome?.finalPlayerTeam[0]?.manaRegenCarry).toBeCloseTo(0.6, 12);
    expect.soft(second.outcome?.finalPlayerTeam[0]?.mana).toBe(81); // 20 + 25 recovered + nine 4-MP orbs; below84 cap.
    expect(second.recordedEvents.some(e => e.kind === 'mana' && e.reason === 'regeneration')).toBe(true);
  });

  it('plays actual recovered MP before the end event can snap teams to their final state', () => {
    const { first } = firstRecoveryWave();
    const outcome = structuredClone(first.outcome);
    const endIndex = first.recordedEvents.findIndex(e => e.kind === 'end');
    expect(endIndex).toBeGreaterThan(0);
    for (let i = 0; i < endIndex; i++) useCombatStore.getState().advanceEvent();
    const beforeEnd = useCombatStore.getState();
    expect(beforeEnd.eventCursor).toBe(endIndex);
    expect(beforeEnd.playbackComplete).toBe(false);
    expect.soft(beforeEnd.playerTeam[0]?.mana).toBe(20);
    expect.soft(first.recordedEvents.some(e => e.kind === 'mana' && e.reason === 'regeneration')).toBe(true);
    expect(beforeEnd.outcome).toEqual(outcome);
  });

  it('replays original wave input/carry after completed playback without repeated MP or rewards', () => {
    firstRecoveryWave();
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const second = useCombatStore.getState();
    const before = structuredClone({ team: second.playerTeam, events: second.recordedEvents,
      outcome: second.outcome, rewards: second.runRewards });
    expect.soft(second.playerTeam[0]?.manaRegenCarry).toBeCloseTo(0.64, 12);
    for (let i = 0; i < 2; i++) {
      drain();
      expect.soft(useCombatStore.getState().playerTeam[0]?.mana)
        .toBe(second.outcome?.finalPlayerTeam[0]?.mana);
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      const replay = useCombatStore.getState();
      expect({ team: replay.playerTeam, events: replay.recordedEvents,
        outcome: replay.outcome, rewards: replay.runRewards }).toEqual(before);
    }
  });

  it('does not grant pause, UI-delay, or wall-clock time between genuine waves', () => {
    const { first, final } = firstRecoveryWave();
    const recording = structuredClone(first.recordedEvents);
    useCombatStore.getState().pausePlayback();
    vi.mocked(Date.now).mockReturnValue(1792454400000 + 3_600_000);
    useCombatStore.getState().advanceEvent();
    expect(useCombatStore.getState().eventCursor).toBe(0);
    expect(useCombatStore.getState().playerTeam[0]?.mana).toBe(0);
    expect(advanceWaveOrFinish()).toBe('idle');
    expect(useCombatStore.getState().recordedEvents).toEqual(recording);
    useCombatStore.getState().resumePlayback();
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect.soft(useCombatStore.getState().playerTeam[0]?.mana).toBe(final.mana);
    expect.soft(useCombatStore.getState().playerTeam[0]?.manaRegenCarry).toBeCloseTo(0.64, 12);
  });

  it('starts a new run with zero carry instead of importing completed recovery twice', () => {
    const { final } = firstRecoveryWave();
    expect.soft(final.manaRegenCarry).toBeCloseTo(0.64, 12);
    drain();
    abortSubAreaRun();
    expect(startSubAreaRun({ runSeed: 7, challengeOrdinal: 0 })).not.toBeNull();
    const fresh = useCombatStore.getState().playerTeam[0];
    expect(fresh?.manaRegenCarry).toBe(0);
    expect(fresh?.manaRegenCompensation).toBe(0);
  });

  it('uses fresh next-wave allocation while preserving the fraction from the frozen previous recording', () => {
    const { first } = firstRecoveryWave();
    const before = structuredClone({ team: first.playerTeam, events: first.recordedEvents, outcome: first.outcome });
    const player = usePlayerStore.getState().player;
    if (!player) throw new Error('Missing real player');
    // Synthetic allocation projection retains this recording; not public hero replacement.
    usePlayerStore.setState({ player: { ...player, skillLevels: {} } });
    expect({ team: useCombatStore.getState().playerTeam, events: useCombatStore.getState().recordedEvents,
      outcome: useCombatStore.getState().outcome }).toEqual(before);
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const second = useCombatStore.getState();
    expect(second.playerTeam[0]?.manaRegenPerSecond).toBe(4);
    expect.soft(second.playerTeam[0]?.manaRegenCarry).toBeCloseTo(0.64, 12);
    expect.soft(second.outcome?.finalPlayerTeam[0]?.manaRegenCarry).toBeCloseTo(0.64, 12);
  });
});

afterEach(() => {
  reset();
  resetRegistry();
  loadDefaultSkills();
  vi.restoreAllMocks();
});

describe('production cross-wave status clock', () => {
  it('carries actual poison with only its residual lifetime and original metadata', () => {
    const { hero, poison, elapsed, second } = next();
    expect(elapsed).toBeGreaterThan(0);
    expect(poison.appliedAtMs).toBeGreaterThan(0);
    // The real160XP award levels the hero to2. Config refresh changes stats,
    // while exact actual resource/status/buff/cooldown carry remains required.
    expect(second.playerTeam[0]).toEqual({ ...hero, level: 2,
      stats: { ...hero.stats, lifeMax: 1_000_008, manaMax: 106, attack: 3, defense: 3 },
      statuses: hero.statuses.map(s => ({
      ...s,
      ...(s.appliedAtMs === undefined ? {} : { appliedAtMs: s.appliedAtMs - elapsed }),
      ...(s.expiresAtMs === undefined ? {} : { expiresAtMs: s.expiresAtMs - elapsed })
    })) });
    expect(second.playerTeam[0]?.activeBuffIds).toContain('fixture.carried-buff');
  });

  it('deals carried poison damage and changes actual playback HP before the next wave first action', () => {
    const { hero, poison, elapsed, second } = next();
    const action = second.recordedEvents.find(e => e.kind === 'action');
    if (!action || poison.expiresAtMs === undefined) throw new Error('Missing timing fixture');
    const overlap = Math.max(0, Math.min(action.simClockMs, poison.expiresAtMs - elapsed) -
      Math.max(0, (poison.appliedAtMs ?? 0) - elapsed));
    const damage = Math.floor((poison.dotPerStack ?? 0) * poison.stacks * overlap / 1000);
    expect(damage).toBeGreaterThan(0);
    const earlyDots = second.recordedEvents.filter(e => e.kind === 'dot' && e.target === hero.id && e.simClockMs <= action.simClockMs);
    expect(earlyDots.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(damage);
    const actionIndex = second.recordedEvents.indexOf(action);
    for (let i = 0; i <= actionIndex; i++) useCombatStore.getState().advanceEvent();
    expect(useCombatStore.getState().playerTeam[0]?.life).toBe(hero.life - damage);
  });

  it('replays the current wave without subtracting previous elapsed time again', () => {
    const { second } = next();
    const before = structuredClone({ team: second.playerTeam, events: second.recordedEvents, outcome: second.outcome });
    for (let replay = 0; replay < 2; replay++) {
      vi.mocked(Date.now).mockReturnValue(1792454400000 + (replay + 1) * 90_000);
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      const state = useCombatStore.getState();
      expect({ team: state.playerTeam, events: state.recordedEvents, outcome: state.outcome }).toEqual(before);
    }
    const elapsed = second.recordedEvents.at(-1)?.simClockMs;
    const poison = second.outcome?.finalPlayerTeam[0]?.statuses.find(s => s.id === 'poison');
    if (elapsed === undefined || poison?.expiresAtMs === undefined) throw new Error('Missing second-wave poison');
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(useCombatStore.getState().playerTeam[0]?.statuses.find(s => s.id === 'poison'))
      .toEqual({ ...poison, appliedAtMs: (poison.appliedAtMs ?? 0) - elapsed, expiresAtMs: poison.expiresAtMs - elapsed });
  });

  it('does not age statuses during playback pause, UI delays or elapsed wall time', () => {
    start();
    const first = useCombatStore.getState();
    const end = first.recordedEvents.at(-1);
    const hero = first.outcome?.finalPlayerTeam[0];
    if (end?.kind !== 'end' || !hero) throw new Error('Missing first-wave result');
    useCombatStore.setState({ recordedEvents: first.recordedEvents.map(e => ({ ...e, uiDelayMs: 3000 })) });
    useCombatStore.getState().pausePlayback();
    vi.mocked(Date.now).mockReturnValue(1792454400000 + 3_600_000);
    useCombatStore.getState().advanceEvent();
    expect(useCombatStore.getState().eventCursor).toBe(0);
    expect(advanceWaveOrFinish()).toBe('idle');
    useCombatStore.getState().resumePlayback();
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(useCombatStore.getState().playerTeam[0]?.statuses).toEqual(hero.statuses.map(s => ({
      ...s, appliedAtMs: (s.appliedAtMs ?? 0) - end.simClockMs,
      expiresAtMs: (s.expiresAtMs ?? 0) - end.simClockMs
    })));
  });

  it('uses the original captured engine end clock when playback events change', () => {
    start();
    const first = useCombatStore.getState();
    const end = first.recordedEvents.at(-1);
    const hero = first.outcome?.finalPlayerTeam[0];
    const poison = hero?.statuses.find(s => s.id === 'poison');
    if (end?.kind !== 'end' || !hero || poison?.expiresAtMs === undefined) throw new Error('Missing poison');
    // Presentation may prepend cues; the engine clock was already captured.
    useCombatStore.setState({ recordedEvents: [{ kind: 'message', messageKey: 'fixture.intro',
      simClockMs: 0, uiDelayMs: 1200 }, ...first.recordedEvents,
    { kind: 'message', messageKey: 'fixture.outro', simClockMs: 50_000, uiDelayMs: 3000 }] });
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    expect(useCombatStore.getState().playerTeam[0]?.statuses.find(s => s.id === 'poison')?.expiresAtMs)
      .toBe(poison.expiresAtMs - end.simClockMs);
  });

  it('suppresses a real next-wave action inside carried control and allows the action after expiry', () => {
    start();
    const first = useCombatStore.getState();
    const end = first.recordedEvents.at(-1);
    const outcome = first.outcome;
    const hero = outcome?.finalPlayerTeam[0];
    if (end?.kind !== 'end' || !outcome || !hero) throw new Error('Missing first-wave outcome');
    drain();
    // Controlled completed-outcome boundary supplements the genuine poison cases.
    equipWaveCap(138); // Authoritative AS125+138=263 reaches the400ms period floor.
    const controlled = applyStatus(hero,
      { id: 'freeze', sourceId: 'fixture', simClockMs: end.simClockMs, durationMs: 500 }, createRng(7));
    useCombatStore.setState({ outcome: { ...outcome, finalPlayerTeam: [controlled] } });
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const second = useCombatStore.getState();
    expect(second.recordedEvents.some(e => e.kind === 'stunned' && e.target === hero.id && e.simClockMs === 400)).toBe(true);
    expect(second.recordedEvents.some(e => e.kind === 'action' && e.actor === hero.id && e.simClockMs === 400)).toBe(false);
    expect(second.recordedEvents.some(e => e.kind === 'action' && e.actor === hero.id && e.simClockMs === 800)).toBe(true);
  });

  it('carries living merc status clocks and non-status state while excluding dead allies and summons', () => {
    start();
    const first = useCombatStore.getState();
    const end = first.recordedEvents.at(-1);
    const outcome = first.outcome;
    const hero = outcome?.finalPlayerTeam[0];
    if (end?.kind !== 'end' || !outcome || !hero) throw new Error('Missing first-wave outcome');
    drain();
    const merc = { ...hero, id: 'merc-fixture', kind: 'merc' as const, mana: 7,
      cooldowns: { fixture: 123 }, activeBuffIds: ['fixture.merc-buff'] };
    const dead = { ...merc, id: 'merc-dead', life: 0 };
    const summon = { ...hero, id: 'fixture-summon', kind: 'summon' as const, summonOwnerId: hero.id };
    useCombatStore.setState({ outcome: { ...outcome, finalPlayerTeam: [hero, merc, dead, summon] } });
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const team = useCombatStore.getState().playerTeam;
    expect(team.map(u => u.id)).toEqual([hero.id, merc.id]);
    const nextMerc = team[1];
    expect(nextMerc).toEqual({ ...merc, statuses: merc.statuses.map(s => ({ ...s,
      appliedAtMs: (s.appliedAtMs ?? 0) - end.simClockMs, expiresAtMs: (s.expiresAtMs ?? 0) - end.simClockMs })) });
  });
});

describe('trusted terminal clock capture', () => {
  it.each(['missing', 'not-end', NaN, Infinity, -1, combatEngine.MAX_SIM_MS + 1] as const)(
    'retains the prior run and recording when replay staging has invalid terminal %s', terminal => {
      start();
      drain();
      const before = useCombatStore.getState();
      const actual = combatEngine.runBattleRecorded({ seed: 7, playerTeam: before.playerTeam, enemyTeam: before.enemyTeam });
      const last = actual.events.at(-1);
      if (last?.kind !== 'end') throw new Error('Missing engine terminal');
      const events = terminal === 'missing' ? [] : terminal === 'not-end'
        ? [...actual.events, { kind: 'message' as const, messageKey: 'fixture.invalid', simClockMs: 0, uiDelayMs: 50 }]
        : [...actual.events.slice(0, -1), { ...last, simClockMs: terminal }];
      vi.spyOn(combatEngine, 'runBattleRecorded').mockReturnValueOnce({ ...actual, events });
      expect(() => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); }).toThrow('valid terminal simulation clock');
      expect(useCombatStore.getState()).toBe(before);
      expect(hasActiveSubAreaRun()).toBe(true);
      expect(advanceWaveOrFinish()).toBe('next-wave');
    });

  it.each([0, 0.5, combatEngine.MAX_SIM_MS])('accepts a terminal boundary of %sms without rounding', simClockMs => {
    start();
    const state = useCombatStore.getState();
    const actual = combatEngine.runBattleRecorded({ seed: 7, playerTeam: state.playerTeam, enemyTeam: state.enemyTeam });
    const last = actual.events.at(-1);
    if (last?.kind !== 'end') throw new Error('Missing engine terminal');
    vi.spyOn(combatEngine, 'runBattleRecorded').mockReturnValueOnce({ ...actual,
      events: [...actual.events.slice(0, -1), { ...last, simClockMs }] });
    expect(() => { refreshActivePlayerCombatConfig({ replayCurrentWave: true }); }).not.toThrow();
    const outcome = useCombatStore.getState().outcome;
    const poison = outcome?.finalPlayerTeam[0]?.statuses.find(s => s.id === 'poison');
    if (poison?.expiresAtMs === undefined) throw new Error('Missing poison');
    drain();
    expect(advanceWaveOrFinish()).toBe('next-wave');
    const nextPoison = useCombatStore.getState().playerTeam[0]?.statuses.find(s => s.id === 'poison');
    expect(nextPoison?.expiresAtMs).toBe(poison.expiresAtMs > simClockMs ? poison.expiresAtMs - simClockMs : undefined);
  });
});
