import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRng } from '../rng';
import * as rngModule from '../rng';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleResult } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

function status(id: string, extra: Partial<ActiveStatus> = {}): ActiveStatus {
  return { id, stacks: 1, remaining: -1, sourceId: 'fixture', ...extra };
}
function unit(id: string, side: CombatUnit['side'], extra: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'summon', level: 24,
    tier: 'trash', life: 100000, mana: 0,
    stats: { life: 100000, lifeMax: 100000, mana: 10000, manaMax: 10000,
      attack: 1, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } },
    statuses: [status('stun')], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, ...extra };
}
// Structural projection collects against unchanged combat, which initially ignores Meditation.
interface ProjectedSnapshot extends CombatSnapshot {
  readonly meditationAura?: { readonly selectedAuraId: 'paladin.meditation'; readonly sourceHeroId: string;
    readonly fieldedMercCombatId?: string; readonly rank: number; readonly maxRank: number;
    readonly sourceBaselinePerSecond: number; readonly manaRegenPctPerRank: number };
}
function snapshot(ms = 1250, baseline = 4, rank = 20): ProjectedSnapshot {
  return { seed: 7,
    playerTeam: [unit('hero', 'player', { manaRegenPerSecond: baseline }), unit('merc', 'player', { kind: 'merc' })],
    enemyTeam: [unit('clock', 'enemy', { life: ms, statuses: [status('stun'),
      status('burn', { dotPerStack: 1000, expiresAtMs: ms })] })],
    meditationAura: { selectedAuraId: 'paladin.meditation', sourceHeroId: 'hero', fieldedMercCombatId: 'merc',
      rank, maxRank: 20, sourceBaselinePerSecond: baseline, manaRegenPctPerRank: 0.03 } };
}
function final(result: RecordedBattleResult, id: string): CombatUnit {
  const found = result.result.playerTeam.find(unit => unit.id === id);
  if (!found) throw new Error(`Missing final ${id}`);
  return found;
}
function projection(input: ProjectedSnapshot): NonNullable<ProjectedSnapshot['meditationAura']> {
  if (!input.meditationAura) throw new Error('Missing test projection');
  return input.meditationAura;
}
function regen(result: RecordedBattleResult, target: string) {
  return result.events.filter(e => e.kind === 'mana' && e.target === target && e.reason === 'regeneration');
}
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('Meditation pooled recovery on actual combat intervals', () => {
  it.each([[1, 5, '0.15', 0, '0.15'], [2, 5, '0.3', 0, '0.3'], [20, 8, '0', 3, '0']] as const)(
    'source4 rank%s over1250ms grants hero%s/%s and merc%s/%s without action', (rank, heroMP, heroCarry, mercMP, mercCarry) => {
      const input = snapshot(1250, 4, rank); const before = structuredClone(input);
      const result = runBattleRecorded(input);
      expect(final(result, 'hero')).toMatchObject({ mana: heroMP, manaRegenExactCarry: heroCarry, manaRegenPerSecond: 4 });
      expect(final(result, 'merc')).toMatchObject({ mana: mercMP, manaRegenExactCarry: mercCarry });
      expect(result.events.filter(e => e.kind === 'action' || e.kind === 'buff')).toEqual([]);
      expect(result.events.at(-1)).toMatchObject({ winner: 'player', simClockMs: 1250 });
      expect(runBattle(input)).toEqual(result.result); expect(runBattleRecorded(input)).toEqual(result);
      expect(input).toEqual(before);
    });
  it.each([[36.4, 20, 1456, 546], [4, 11, 133, 33]] as const)(
    'source%s rank%s preserves literal hero%s/merc%s under mixed fractional intervals and handoff', (baseline, rank, heroMP, mercMP) => {
      for (const mixed of [false, true]) {
        const input = snapshot(25000, baseline, rank);
        const boundaries = [0.1, 0.3, 16, 17, 149, 1000.25].map(expiresAtMs => status('fixture-boundary', { expiresAtMs }));
        const result = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(unit => ({ ...unit,
          statuses: [...unit.statuses, ...(mixed ? boundaries : [])] })) });
        expect(final(result, 'hero')).toMatchObject({ mana: heroMP, manaRegenExactCarry: '0' });
        expect(final(result, 'merc')).toMatchObject({ mana: mercMP, manaRegenExactCarry: '0' });
      }
      let team = snapshot(25000, baseline, rank).playerTeam;
      for (const duration of [17, 233, 1000, 23750]) {
        const input = snapshot(duration, baseline, rank);
        team = runBattleRecorded({ ...input, playerTeam: team }).result.playerTeam;
      }
      expect(team.find(unit => unit.id === 'hero')).toMatchObject({ mana: heroMP, manaRegenExactCarry: '0' });
      expect(team.find(unit => unit.id === 'merc')).toMatchObject({ mana: mercMP, manaRegenExactCarry: '0' });
    });
  it('retains exact represented numeric source baseline and one pooled fractional decision', () => {
    const input = snapshot(1000, 1.4000000000000001, 1); const result = runBattleRecorded(input);
    expect(final(result, 'hero')).toMatchObject({ mana: 1, manaRegenExactCarry: '0.442000000000000103' });
    expect(final(result, 'merc')).toMatchObject({ mana: 0, manaRegenExactCarry: '0.042000000000000003' });
  });
  it.each([0, NaN, Infinity, -1])('invalid/inactive merc baseline%s still receives the source bonus', rate => {
    const input = snapshot(25000, 4, 11);
    const result = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(unit => unit.id === 'merc'
      ? { ...unit, manaRegenPerSecond: rate } : unit) });
    expect(final(result, 'merc')).toMatchObject({ mana: 33, manaRegenExactCarry: '0' });
  });
  it('adds the merc own baseline independently of the source baseline', () => {
    const input = snapshot(25000, 4, 11);
    const result = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(unit => unit.id === 'merc'
      ? { ...unit, manaRegenPerSecond: 2 } : unit) });
    expect(final(result, 'merc')).toMatchObject({ mana: 83, manaRegenExactCarry: '0' });
  });
  it('credits the surviving merc for elapsed time when the source dies at the interval end', () => {
    const input = snapshot(1250);
    const result = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(unit => unit.id === 'hero'
      ? { ...unit, life: 1000, statuses: [status('stun'), status('burn', { dotPerStack: 1000, expiresAtMs: 1000 })] } : unit) });
    expect(final(result, 'hero')).toMatchObject({ life: 0, mana: 0 });
    expect(regen(result, 'hero')).toEqual([]);
    expect(final(result, 'merc')).toMatchObject({ mana: 2, manaRegenExactCarry: '0.4' });
    expect(regen(result, 'merc')).toEqual([expect.objectContaining({ mana: 2, simClockMs: 1000 })]);
    expect(result.events.at(-1)).toMatchObject({ winner: 'enemy', simClockMs: 1000 });
  });
  it('does not write recovery or revive a recipient killed at the boundary', () => {
    const input = snapshot(1250);
    const result = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(unit => unit.id === 'merc'
      ? { ...unit, life: 1000, mana: 3, manaRegenCarry: 0.5, manaRegenCompensation: 0, manaRegenExactCarry: '0.5',
        statuses: [status('stun'), status('burn', { dotPerStack: 1000, expiresAtMs: 1000 })] } : unit) });
    expect(final(result, 'merc')).toMatchObject({ life: 0, mana: 3, manaRegenExactCarry: '0.5' });
    expect(regen(result, 'merc')).toEqual([]);
    expect(final(result, 'hero')).toMatchObject({ mana: 8, manaRegenExactCarry: '0' });
  });
});


describe('Meditation boundary ownership and whole-MP commits', () => {
  it('excludes bench, enemy, summons and a replacement merc while retaining each own recovery', () => {
    const input = snapshot();
    const result = runBattleRecorded({ ...input,
      meditationAura: { ...projection(input), fieldedMercCombatId: 'missing-original-merc' },
      playerTeam: [...input.playerTeam, unit('bench', 'player', { kind: 'merc' }),
        unit('summon', 'player', { kind: 'summon', summon: true, summonOwnerId: 'hero' })] });
    expect(final(result, 'hero').mana).toBe(8);
    for (const id of ['merc', 'bench', 'summon']) expect(final(result, id).mana).toBe(0);
    expect(result.result.enemyTeam[0]?.mana).toBe(0);
  });
  it.each(['missing', 'merc'])('source identity%s suppresses all additional recovery', sourceHeroId => {
    const input = snapshot(); const result = runBattleRecorded({ ...input,
      meditationAura: { ...projection(input), sourceHeroId } });
    expect(final(result, 'hero').mana).toBe(5); expect(final(result, 'merc').mana).toBe(0);
  });
  it('rejects simultaneous Might and Meditation before recorded or unrecorded simulation', () => {
    const input = { ...snapshot(), mightAura: { selectedAuraId: 'paladin.might' as const,
      sourceHeroId: 'hero', fieldedMercCombatId: 'merc', rank: 1, maxRank: 20, physicalDamagePct: 0.03, attackPct: 0.01 } };
    expect(() => runBattle(input)).toThrow('Only one player aura projection');
    expect(() => runBattleRecorded(input)).toThrow('Only one player aura projection');
  });
  it('copies primitive projection fields independently before simulation and ignores caller metadata', () => {
    const input = snapshot(); const aura = { ...projection(input) };
    Object.defineProperty(aura, 'ignoredMetadata', { enumerable: true, get: () => { throw new Error('Unexpected metadata read'); } });
    const random = createRng(7); const fork = random.fork.bind(random);
    vi.spyOn(random, 'fork').mockImplementationOnce(salt => {
      aura.sourceHeroId = 'missing'; aura.sourceBaselinePerSecond = 999; aura.rank = 1;
      return fork(salt);
    });
    vi.spyOn(rngModule, 'createRng').mockReturnValue(random);
    const result = runBattleRecorded({ ...input, meditationAura: aura });
    expect(final(result, 'hero').mana).toBe(8); expect(final(result, 'merc').mana).toBe(3);
    expect(aura.sourceHeroId).toBe('missing');
  });
  it('does not consume main-stream RNG or create aura actions/markers/payments', () => {
    const random = createRng(7); const chance = vi.spyOn(random, 'chance'); const nextInt = vi.spyOn(random, 'nextInt');
    vi.spyOn(rngModule, 'createRng').mockReturnValue(random);
    const result = runBattleRecorded(snapshot());
    expect(chance.mock.calls).toEqual([]); expect(nextInt.mock.calls).toEqual([]);
    expect(random.next()).toBe(0.011704753153026104);
    expect(result.events.filter(e => e.kind === 'action' || e.kind === 'buff' || e.kind === 'status')).toEqual([]);
    for (const unit of result.result.playerTeam) {
      expect(unit.cooldowns).toEqual({}); expect(unit.activeBuffIds).toEqual([]);
    }
  });
  it('caps once, discards overflow and all carry, then earns only after a real paid cast', () => {
    registerSkill({ id: 'fixture.meditation-spend', archetype: 'fixture', target: 'self', manaCost: 8,
      cooldown: 100, minLevel: 1, effects: [{ kind: 'buff', id: 'fixture-paid', duration: -1 }] });
    const input = snapshot(2000);
    const result = runBattleRecorded({ ...input, playerTeam: input.playerTeam.map(unit => unit.id === 'hero'
      ? { ...unit, mana: 9, stats: { ...unit.stats, manaMax: 10 }, manaRegenCarry: 0.75,
        manaRegenCompensation: -0.001, manaRegenExactCarry: '0.751', statuses: [], skillOrder: ['fixture.meditation-spend'] } : unit) });
    expect(regen(result, 'hero')).toEqual([expect.objectContaining({ mana: 10, simClockMs: 1700 }),
      expect.objectContaining({ mana: 3, simClockMs: 2000 })]);
    expect(result.events).toContainEqual(expect.objectContaining({ kind: 'mana', reason: 'cast', target: 'hero', mana: 2, simClockMs: 1700 }));
    expect(final(result, 'hero')).toMatchObject({ mana: 3, manaRegenExactCarry: '0.92' });
  });
  it.each(['none', 'might'])('replacement with%s removes future bonus while preserving earned carry', selected => {
    const first = runBattleRecorded(snapshot(500));
    const { meditationAura: _aura, ...next } = snapshot(500);
    const result = runBattleRecorded({ ...next, playerTeam: first.result.playerTeam,
      ...(selected === 'might' ? { mightAura: { selectedAuraId: 'paladin.might' as const,
        sourceHeroId: 'hero', rank: 1, maxRank: 20, physicalDamagePct: 0.03, attackPct: 0.01 } } : {}) });
    expect(final(result, 'hero')).toMatchObject({ mana: 5, manaRegenExactCarry: '0.2' });
    expect(final(result, 'merc')).toMatchObject({ mana: 1, manaRegenExactCarry: '0.2' });
  });
});
