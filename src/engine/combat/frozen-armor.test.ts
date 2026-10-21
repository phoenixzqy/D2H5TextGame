import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sorceressSkills from '../../data/skills/sorceress.json';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { FROZEN_ARMOR_DEFINITION } from '../skills/frozen-armor';
import type { DamageType } from '../types/attributes';
import type { DamageEffect } from '../skills/effects';
import * as rngModule from '../rng';
import * as damageModule from './damage';
import { statusActiveAt } from './status';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleResult } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const dataId = 'skills-sorceress-frozen-armor';
const skillId = 'sorceress.frozen_armor';
const buffId = 'frozen-armor';
function marker(id: string, appliedAtMs = 0, expiresAtMs?: number): ActiveStatus {
  return { id, sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs,
    ...(expiresAtMs === undefined ? {} : { expiresAtMs }) };
}
function poison(rate: number): ActiveStatus {
  return { ...marker('poison'), dotPerStack: rate, damageType: 'poison' };
}
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 24, tier: 'trash',
    life: 100, mana: 100,
    stats: { life: 100, lifeMax: 100, mana: 100, manaMax: 100, attack: 1, defense: 20, magicResist: 20,
      attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
/** Explicit engine fixture: cast at1700, stun subsequent actions, die periodically at4000. */
function cast(levels: Readonly<Record<string, number>> = { [dataId]: 1 }, order = dataId): CombatSnapshot {
  return { seed: 7, playerTeam: [{ ...unit('hero', 'player'), mana: 10,
    skillOrder: [order], skillLevels: levels, statuses: [marker('stun', 1701), poison(25)] }],
    enemyTeam: [{ ...unit('attacker', 'enemy'), statuses: [marker('stun')] }] };
}
function record(input: CombatSnapshot): RecordedBattleResult {
  const before = structuredClone({ input, data: sorceressSkills, skill: getSkill(skillId) });
  const result = runBattleRecorded(input);
  expect({ input, data: sorceressSkills, skill: getSkill(skillId) }).toEqual(before);
  return result;
}
function replay(input: CombatSnapshot): RecordedBattleResult {
  const r = record(input);
  expect(runBattle(input)).toEqual(r.result);
  expect(record(input)).toEqual(r);
  return r;
}
function armor(rank = 20) { return { rank, defensePct: rank * 0.03 }; }
/** Explicit already-paid snapshot fixture; one direct hit at1700; attacker periodic death at2000. */
function incoming(type: DamageType = 'fire', protectedHero = true, seed = 7,
  effect: Pick<DamageEffect, 'applyStatus'> = {}): CombatSnapshot {
  registerSkill({ id: 'fixture.armor-hit', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    manaCost: 0, cooldown: 100,
    effects: [{ kind: 'damage', damageType: type, base: [100, 100], ...effect }] });
  return { seed, playerTeam: [{ ...unit('hero', 'player'), life: 10000,
    stats: { ...unit('hero', 'player').stats, life: 10000, lifeMax: 10000 },
    statuses: [marker('stun')], activeBuffIds: protectedHero ? [buffId] : [],
    ...(protectedHero ? { frozenArmor: armor() } : {}) }],
    enemyTeam: [{ ...unit('attacker', 'enemy'), skillOrder: ['fixture.armor-hit'],
      statuses: [marker('stun', 1701), poison(50)] }] };
}
function damages(r: RecordedBattleResult) { return r.events.filter(e => e.kind === 'damage'); }
function chills(r: RecordedBattleResult) { return r.events.filter(e => e.kind === 'status' && e.statusId === 'chill'); }

beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('P07b01 paid actual Frozen Armor cast', () => {
  it.each([1, 20, 99])('captures rank%s from actual JSON/registry without stat mutation', rank => {
    const input = cast({ [dataId]: rank });
    const r = replay(input);
    expect(r.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId, simClockMs: 1700 })]);
    expect(r.events.filter(e => e.kind === 'buff')).toEqual([
      expect.objectContaining({ target: 'hero', buffId, simClockMs: 1700 })]);
    expect(r.events.filter(e => e.kind === 'mana')).toEqual([
      expect.objectContaining({ target: 'hero', mana: rank === 1 ? 3 : 5, reason: 'cast', simClockMs: 1700 })]);
    const hero = r.result.playerTeam[0];
    expect(hero?.frozenArmor).toEqual(armor(Math.min(20, rank)));
    expect(Object.isFrozen(hero?.frozenArmor)).toBe(true);
    expect(hero?.stats).toEqual(input.playerTeam[0]?.stats);
    expect(hero?.activeBuffIds).toEqual([buffId]);
    expect(hero?.cooldowns[skillId]).toBe(rank === 1 ? 2300 : 1300);
  });

  it.each([1, 20])('carries an actual paid rank%s cast into an incoming hit in the same recording', rank => {
    const input = incoming();
    const r = replay({ ...input, playerTeam: input.playerTeam.map(hero => {
      const { frozenArmor: _paid, ...fresh } = hero;
      return { ...fresh, mana: 10, activeBuffIds: [], skillOrder: [dataId], skillLevels: { [dataId]: rank },
        stats: { ...hero.stats, attackSpeed: 200 }, statuses: [marker('stun', 901)] };
    }) });
    expect(r.events.filter(e => e.kind === 'buff')).toEqual([
      expect.objectContaining({ target: 'hero', buffId, simClockMs: 900 })]);
    expect(damages(r)).toEqual([expect.objectContaining({ source: 'attacker', target: 'hero',
      amount: rank === 1 ? 79 : 68, simClockMs: 1700 })]);
    expect(chills(r)).toEqual([expect.objectContaining({ target: 'attacker', simClockMs: 1700 })]);
    expect(r.result.playerTeam[0]?.frozenArmor).toEqual(armor(rank));
    expect(r.result.playerTeam[0]?.mana).toBe(rank === 1 ? 3 : 5);
  });

  it.each([dataId, skillId])('uses maximum valid aliases consistently for %s cost and potency', order => {
    const r = replay(cast({ [dataId]: 20, [skillId]: 1 }, order));
    expect(r.result.playerTeam[0]?.frozenArmor).toEqual(armor());
    expect(r.result.playerTeam[0]?.mana).toBe(5);
    expect(r.result.playerTeam[0]?.cooldowns[skillId]).toBe(1300);
  });

  it.each([undefined, 0, -1, 1.5, NaN, Infinity, -Infinity])('does not grant armor or spend MP for invalid allocation %s', rank => {
    const r = replay(cast(rank === undefined ? {} : { [dataId]: rank }));
    expect(r.events.filter(e => e.kind === 'buff')).toEqual([]);
    expect(r.events.filter(e => e.kind === 'mana')).toEqual([]);
    expect(r.result.playerTeam[0]?.frozenArmor).toBeUndefined();
    expect(r.result.playerTeam[0]?.mana).toBe(10);
    expect(r.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: null, simClockMs: 1700 })]);
  });

  it('does not grant power from learning without a combo or from insufficient MP', () => {
    const input = cast();
    const originalHero = input.playerTeam[0];
    if (!originalHero) throw new Error('Missing cast fixture hero');
    for (const hero of [{ ...originalHero, skillOrder: [] }, { ...originalHero, mana: 6 }]) {
      const r = replay({ ...input, playerTeam: [hero] });
      expect(r.result.playerTeam[0]?.frozenArmor).toBeUndefined();
      expect(r.events.filter(e => e.kind === 'buff' || e.kind === 'mana')).toEqual([]);
    }
  });

  it('ignores all bare exact markers for first eligible paid cast and normalizes duplicates', () => {
    const input = cast();
    const r = replay({ ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
      activeBuffIds: ['unrelated', dataId, skillId, buffId, buffId] })) });
    expect(r.result.playerTeam[0]?.frozenArmor).toEqual(armor(1));
    expect(r.result.playerTeam[0]?.activeBuffIds).toEqual(['unrelated', buffId]);
    expect(r.result.playerTeam[0]?.mana).toBe(3);
    expect(r.events.filter(e => e.kind === 'buff')).toHaveLength(1);
  });

  it('never recasts or stacks across opportunities after cooldown has expired', () => {
    const input = cast();
    const r = replay({ ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
      mana: 100, statuses: [poison(8)] })) });
    expect(r.events.filter(e => e.kind === 'action' && e.skillId === skillId)).toHaveLength(1);
    expect(r.events.filter(e => e.kind === 'buff')).toHaveLength(1);
    expect(r.result.playerTeam[0]?.mana).toBe(93);
    expect(r.result.playerTeam[0]?.frozenArmor).toEqual(armor(1));
  });

  it('does not activate a distinct skill merely because it has the same marker and opt-in flag', () => {
    registerSkill({ id: 'fixture.other-armor', archetype: 'fixture', target: 'self',
      minLevel: 1, cooldown: 4, manaCost: 7, isBuff: true,
      effects: [{ kind: 'buff', id: buffId, duration: -1, frozenArmor: true }] });
    const r = replay(cast({ [dataId]: 20, 'fixture.other-armor': 20 }, 'fixture.other-armor'));
    expect(r.events.filter(e => e.kind === 'buff')).toHaveLength(1);
    expect(r.result.playerTeam[0]?.activeBuffIds).toEqual([buffId]);
    expect(r.result.playerTeam[0]?.frozenArmor).toBeUndefined();
    expect(r.result.playerTeam[0]?.stats.defense).toBe(20);
  });

  it('keeps canonical marker-only overrides without opt-in free of paid power', () => {
    const actual = getSkill(skillId);
    if (!actual) throw new Error('Missing actual Frozen Armor');
    registerSkill({ ...actual, effects: [{ kind: 'buff', id: buffId, duration: -1 }] });
    const input = incoming();
    const r = replay({ ...input, playerTeam: input.playerTeam.map(hero => {
      const { frozenArmor: _paid, ...fresh } = hero;
      return { ...fresh, mana: 10, activeBuffIds: [], skillOrder: [dataId], skillLevels: { [dataId]: 20 },
        stats: { ...hero.stats, attackSpeed: 200 }, statuses: [marker('stun', 901)] };
    }) });
    expect(r.events.filter(e => e.kind === 'buff')).toEqual([
      expect.objectContaining({ target: 'hero', buffId, simClockMs: 900 })]);
    expect(r.result.playerTeam[0]?.frozenArmor).toBeUndefined();
    expect(r.result.playerTeam[0]?.stats.defense).toBe(20);
    expect(damages(r)).toEqual([expect.objectContaining({ amount: 80, simClockMs: 1700 })]);
    expect(chills(r)).toEqual([]);
  });

  it('keeps independently captured potency despite mutable registry statMods', () => {
    const actual = getSkill(skillId);
    if (!actual) throw new Error('Missing actual Frozen Armor');
    registerSkill({ ...actual, effects: [{ kind: 'buff', id: buffId, duration: -1,
      frozenArmor: true, statMods: { defense: 9999 } }] });
    expect(FROZEN_ARMOR_DEFINITION).toEqual({ maxRank: 20, defensePctPerRank: 0.03 });
    const r = replay(cast({ [dataId]: 20 }));
    expect(r.result.playerTeam[0]?.frozenArmor).toEqual(armor());
    expect(r.result.playerTeam[0]?.stats.defense).toBe(20);
  });
});

describe('P07b01 runtime definition independence', () => {
  it('retains captured coefficient and cap after safely restored authored tuning mutation', () => {
    const row = sorceressSkills.find(skill => skill.id === dataId);
    if (!row) throw new Error('Missing authored Frozen Armor');
    const originalCap = row.maxLevel;
    const originalStats = row.scaling.passiveStatsPerLevel;
    if (!originalStats) throw new Error('Missing authored Frozen Armor tuning');
    try {
      row.maxLevel = 1;
      row.scaling.passiveStatsPerLevel = { defensePct: 99 };
      const r = replay(cast({ [dataId]: 99 }));
      expect(r.result.playerTeam[0]?.frozenArmor).toEqual(armor());
      expect(r.result.playerTeam[0]?.mana).toBe(5);
      expect(r.result.playerTeam[0]?.cooldowns[skillId]).toBe(1300);
    } finally {
      row.maxLevel = originalCap;
      row.scaling.passiveStatsPerLevel = originalStats;
    }
  });
});

describe('P07b01 shared direct defense projection and retaliation', () => {
  it.each(['physical', 'fire', 'poison', 'thorns', 'cold', 'lightning', 'arcane'] as const)(
    'applies defense only to the existing armor pool and chills direct %s once', type => {
      const input = incoming(type);
      const r = replay(input);
      expect(damages(r)).toEqual([expect.objectContaining({ source: 'attacker', target: 'hero',
        amount: ['cold', 'lightning', 'arcane'].includes(type) ? 80 : 68,
        damageType: type, dodged: false, crit: false, simClockMs: 1700 })]);
      expect(chills(r)).toEqual([expect.objectContaining({ target: 'attacker', simClockMs: 1700 })]);
      expect(r.result.playerTeam[0]?.stats).toEqual(input.playerTeam[0]?.stats);
      expect(r.result.playerTeam[0]?.mana).toBe(100);
      expect(r.result.enemyTeam[0]?.statuses.find(s => s.id === 'chill')).toEqual({
        id: 'chill', sourceId: 'hero', stacks: 1, remaining: 2, appliedAtMs: 1700, expiresAtMs: 3700 });
    });

  it('retains fractions across Frozen Armor, Melt and Inner Sight without mutating stats', () => {
    const input = incoming();
    const r = replay({ ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
      stats: { ...hero.stats, defense: 21 },
      statuses: [...hero.statuses, marker('armor-melt'), marker('merc-inner-sight')] })) });
    // 21 * 1.6 * .7 * .75 =17.64, floor(100-17.64)=82.
    expect(damages(r)[0]?.amount).toBe(82);
    expect(r.result.playerTeam[0]?.stats.defense).toBe(21);
  });

  it('does not infer a defense bonus or retaliation from a bare marker', () => {
    const input = incoming('fire', false);
    const r = replay({ ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
      activeBuffIds: [buffId, dataId, skillId], skillLevels: { [dataId]: 20 } })) });
    expect(damages(r)[0]?.amount).toBe(80);
    expect(chills(r)).toEqual([]);
  });

  it('retains paid rank despite later positive allocation changes and combo removal', () => {
    const input = incoming();
    for (const rank of [1, 2, 20]) {
      const r = replay({ ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
        skillLevels: { [dataId]: rank }, skillOrder: [] })) });
      expect(damages(r)[0]?.amount).toBe(68);
      expect(r.result.playerTeam[0]?.frozenArmor).toEqual(armor());
    }
  });

  it('skips retaliation on a natural miss and on synthetic landed zero damage', () => {
    expect(damages(replay(incoming('fire', true, 4)))[0]).toMatchObject({ amount: 0, dodged: true });
    expect(chills(replay(incoming('fire', true, 4)))).toEqual([]);
    // Production floors landed damage to1. This labeled boundary double verifies the explicit >0 guard.
    vi.spyOn(damageModule, 'resolveDamage').mockReturnValue({ hit: true, dodged: false, crit: false,
      raw: 0, mitigated: 0, final: 0, effectiveResistPct: 0 });
    const r = replay(incoming());
    expect(damages(r)[0]?.amount).toBe(0);
    expect(chills(r)).toEqual([]);
  });

  it('does not retaliate to periodic damage or to a dead attacker', () => {
    const input = incoming();
    const periodic = { ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
      statuses: [...hero.statuses, poison(10)] })),
      enemyTeam: input.enemyTeam.map(attacker => ({ ...attacker, statuses: [marker('stun'), poison(50)] })) };
    const r = replay(periodic);
    expect(r.events.filter(e => e.kind === 'dot' && e.target === 'hero').length).toBeGreaterThan(0);
    expect(chills(r)).toEqual([]);
    expect(damages(replay({ ...input, enemyTeam: input.enemyTeam.map(attacker => ({ ...attacker, life: 0 })) }))).toEqual([]);
  });

  it('retaliates on a lethal wearer hit after offensive status and before ordinary death closure', () => {
    const input = incoming('fire', true, 7, { applyStatus: { id: 'burn', chance: 1, dotPctOfDamage: 0.1 } });
    const r = replay({ ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero, life: 1 })) });
    expect(r.events.filter(e => e.kind === 'damage' || e.kind === 'status' || e.kind === 'death').map(e =>
      e.kind === 'damage' ? ['damage', e.target, e.amount] : e.kind === 'status'
        ? ['status', e.target, e.statusId] : ['death', e.target])).toEqual([
      ['damage', 'hero', 68], ['status', 'hero', 'burn'], ['status', 'attacker', 'chill'], ['death', 'hero']]);
    expect(r.result.winner).toBe('enemy');
    expect(r.result.playerTeam[0]?.life).toBe(0);
    expect(r.result.enemyTeam[0]?.life).toBe(15);
  });

  it('consumes no additional RNG draw beyond the direct hit and offensive status', () => {
    const input = incoming('fire', true, 7, { applyStatus: { id: 'burn', chance: 1 } });
    const random = rngModule.createRng(7);
    const expected = rngModule.createRng(7);
    expected.chance(0.85); expected.chance(0); expected.chance(1);
    // The fixture attacker later dies to poison: existing independent HP/MP orb rolls.
    expected.chance(0.25); expected.chance(0.25);
    const chance = vi.spyOn(random, 'chance');
    const original = rngModule.createRng;
    vi.spyOn(rngModule, 'createRng').mockImplementation(seed => seed === 7 ? random : original(seed));
    const r = record(input);
    expect(chills(r)).toHaveLength(1);
    expect(chance.mock.calls.map(call => call[0])).toEqual([0.85, 0, 1, 0.25, 0.25]);
    expect(random.next()).toBe(expected.next());
  });

  it.each(['trash', 'boss', 'chapter-boss'] as const)('uses canonical two-second Chill for %s', tier => {
    const input = incoming();
    const r = replay({ ...input, enemyTeam: input.enemyTeam.map(attacker => ({ ...attacker, tier })) });
    const chill = r.result.enemyTeam[0]?.statuses.find(s => s.id === 'chill');
    expect(chill).toMatchObject({ sourceId: 'hero', stacks: 1, appliedAtMs: 1700, expiresAtMs: 3700 });
    if (!chill) throw new Error('Missing retaliatory Chill');
    expect(statusActiveAt(chill, 1699)).toBe(false);
    expect(statusActiveAt(chill, 1700)).toBe(true);
    expect(statusActiveAt(chill, 3699)).toBe(true);
    expect(statusActiveAt(chill, 3700)).toBe(false);
    expect(chills(r)).toHaveLength(1);
  });

  it.each(['active', 'future', 'expired', 'indefinite'] as const)(
    'reuses canonical refresh/source/replacement policy for %s Chill', mode => {
      const input = incoming();
      const existing = { ...marker('chill', mode === 'future' ? 2001 : 0,
        mode === 'indefinite' ? undefined : mode === 'expired' ? 2000 : 5000), sourceId: 'original' };
      const r = replay({ ...input, enemyTeam: input.enemyTeam.map(attacker => ({ ...attacker,
        stats: { ...attacker.stats, attackSpeed: 0 },
        statuses: [marker('stun', 2001), poison(40), existing] })) });
      const chill = r.result.enemyTeam[0]?.statuses.find(s => s.id === 'chill');
      expect(chills(r)).toEqual([expect.objectContaining({ target: 'attacker', simClockMs: 2000 })]);
      expect(r.result.enemyTeam[0]?.statuses.filter(s => s.id === 'chill')).toHaveLength(1);
      if (mode === 'active' || mode === 'indefinite') {
        expect(chill).toEqual({ ...existing, remaining: 2 });
      } else {
        expect(chill).toEqual({ id: 'chill', sourceId: 'hero', stacks: 1,
          remaining: 2, appliedAtMs: 2000, expiresAtMs: 4000 });
      }
    });

  it('applies the existing scheduler slowdown once and resumes at the half-open expiry', () => {
    const input = incoming();
    const scheduled = { ...input, enemyTeam: input.enemyTeam.map(attacker => ({ ...attacker,
      statuses: [poison(20)] })) };
    const r = replay(scheduled);
    expect(r.events.filter(e => e.kind === 'action' && e.actor === 'attacker').map(e => e.simClockMs))
      .toEqual([1700, 3700]);
    const control = replay({ ...scheduled, playerTeam: scheduled.playerTeam.map(hero => {
      const { frozenArmor: _paid, ...ordinary } = hero;
      return { ...ordinary, activeBuffIds: [] };
    }) });
    expect(control.events.filter(e => e.kind === 'action' && e.actor === 'attacker').map(e => e.simClockMs))
      .toEqual([1700, 3400]);
  });

  it('distinguishes one Chill slowdown from double application below the period clamp', () => {
    const input = incoming();
    const scheduled = { ...input, enemyTeam: input.enemyTeam.map(attacker => ({ ...attacker,
      stats: { ...attacker.stats, attackSpeed: 200 }, statuses: [poison(30)] })) };
    const r = replay(scheduled);
    // speed200: base900ms, one half-speed1700ms, double half-speed2000ms.
    expect(r.events.filter(e => e.kind === 'action' && e.actor === 'attacker').map(e => e.simClockMs))
      .toEqual([900, 2600]);
    const control = replay({ ...scheduled, playerTeam: scheduled.playerTeam.map(hero => {
      const { frozenArmor: _paid, ...ordinary } = hero;
      return { ...ordinary, activeBuffIds: [] };
    }) });
    expect(control.events.filter(e => e.kind === 'action' && e.actor === 'attacker').map(e => e.simClockMs))
      .toEqual([900, 1800, 2700]);
  });

  it('preserves periodic rates and uses ordinary critical damage before one Chill', () => {
    const input = incoming();
    const periodic = { ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
      statuses: [...hero.statuses, poison(1)] })) };
    const r = replay(periodic);
    const control = replay({ ...periodic, playerTeam: periodic.playerTeam.map(hero => {
      const { frozenArmor: _paid, ...ordinary } = hero;
      return { ...ordinary, activeBuffIds: [] };
    }) });
    expect(r.events.filter(e => e.kind === 'dot')).toEqual(control.events.filter(e => e.kind === 'dot'));
    const critical = replay({ ...input, enemyTeam: input.enemyTeam.map(attacker => ({ ...attacker,
      stats: { ...attacker.stats, critChance: 1 } })) });
    expect(damages(critical)[0]).toMatchObject({ amount: 168, crit: true, dodged: false });
    expect(chills(critical)).toHaveLength(1);
  });

  it.each([{ rank: 0, defensePct: 0.6 }, { rank: 1.5, defensePct: 0.6 },
    { rank: 20, defensePct: -1 }, { rank: 20, defensePct: NaN }, { rank: 20, defensePct: Infinity }])(
    'does not grant power from an invalid combat snapshot %j', frozenArmor => {
      const input = incoming();
      const r = replay({ ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero, frozenArmor })) });
      expect(damages(r)[0]?.amount).toBe(80);
      expect(chills(r)).toEqual([]);
    });

  it('preserves the complete unaffected prepatch recording byte for byte', () => {
    const r = replay(incoming('fire', false));
    const serialized = JSON.stringify(r);
    expect(damages(r)[0]?.amount).toBe(80);
    expect(createHash('sha256').update(serialized).digest('hex')).toBe('7ca6d4c9d59d6d74ad9b50e86895acc855f8dccc6f241ddb1e4827f8e4b5c91a');
  });
});
