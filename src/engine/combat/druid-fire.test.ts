import { afterEach, describe, expect, it } from 'vitest';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

// Actual registered spells; all stats/ranks/holds here are synthetic isolation fixtures.
const spells = [
  { slug: 'firestorm', mana: 20, cooldown: 2, seedHit: 41, growth: 4 },
  { slug: 'molten-boulder', mana: 12, cooldown: 2, seedHit: 46, growth: 4 },
  { slug: 'fissure', mana: 20, cooldown: 3, seedHit: 61, growth: 5 },
  { slug: 'volcano', mana: 27, cooldown: 4, seedHit: 82, growth: 7 },
  { slug: 'armageddon', mana: 35, cooldown: 5, seedHit: 113, growth: 9 }
] as const;
const hold = (at = 0): ActiveStatus => ({ id: 'stun', stacks: 1, remaining: -1,
  sourceId: 'fixture', appliedAtMs: at });
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster',
    level: 30, tier: 'trash', life: 1000, mana: 0,
    stats: { life: 1000, lifeMax: 1000, mana: 100, manaMax: 100, attack: 1,
      defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } },
    statuses: [hold()], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function fixture(spell: typeof spells[number], rank: number): CombatSnapshot {
  const id = 'skills-druid-' + spell.slug;
  return { seed: 7, playerTeam: [{ ...unit('hero', 'player'), mana: spell.mana,
    statuses: [hold(1701)], skillOrder: [id], skillLevels: { [id]: rank } }],
    enemyTeam: [unit('target', 'enemy')] };
}
function first<T>(values: readonly T[]): T {
  const value = values[0];
  if (value === undefined) throw new Error('Missing Druid fire combat fixture');
  return value;
}
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe.each(spells)('BUG190 registered Druid $slug', spell => {
  it.each([1, 2, 20])('deals its own rank %i hit plus the full three-second Burn', rank => {
    const input = fixture(spell, rank), before = structuredClone(input);
    const r = runBattleRecorded(input);
    const hits = r.events.filter(e => e.kind === 'damage');
    expect(hits).toHaveLength(1);
    const hit = hits[0];
    if (hit?.kind !== 'damage') throw new Error('Missing actual Druid hit');
    expect(hit).toMatchObject({ source: 'hero', target: 'target', damageType: 'fire',
      dodged: false, crit: false, simClockMs: 1700, amount: spell.seedHit + spell.growth * (rank - 1) });
    // Independent seed-7 range draw is 0.06195825757458806; literals preserve each identity.
    const rate = Math.floor((spell.seedHit + spell.growth * (rank - 1)) * 0.1);
    const totalDot = r.events.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0);
    expect(totalDot).toBe(rate * 3);
    expect(r.result.enemyTeam[0]?.life).toBe(1000 - hit.amount - rate * 3);
    expect(r.events.filter(e => e.kind === 'dot').at(-1))
      .toMatchObject({ simClockMs: 4700 });
    expect(r.result.enemyTeam[0]?.statuses).toEqual([hold()]);
    expect(r.result.playerTeam[0]?.mana).toBe(0);
    expect(runBattleRecorded(input)).toEqual(r);
    expect(runBattle(input)).toEqual(r.result);
    expect(input).toEqual(before);
  });

  it('captures mitigation and elemental increases once; weapon Attack does not alter the spell', () => {
    const input = fixture(spell, 1), hero = first(input.playerTeam), target = first(input.enemyTeam);
    const r = runBattleRecorded({ ...input, playerTeam: [{ ...hero, increasedDamagePct: { fire: 1 },
      stats: { ...hero.stats, attack: 10000 } }], enemyTeam: [{ ...target,
      stats: { ...target.stats, resistances: { ...target.stats.resistances, fire: 50 } } }] });
    expect(r.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: spell.seedHit, dodged: false })]);
    const rate = Math.floor(spell.seedHit * 0.1);
    expect(r.result.enemyTeam[0]?.life).toBe(1000 - spell.seedHit - rate * 3);
    const highAttack = runBattleRecorded({ ...input, playerTeam: [{ ...hero,
      stats: { ...hero.stats, attack: 10000 } }] });
    expect(highAttack.events).toEqual(runBattleRecorded(input).events);
  });

  it('uses a one-DPS floor for an actually mitigated one-point hit', () => {
    const input = fixture(spell, 1), target = first(input.enemyTeam);
    const r = runBattleRecorded({ ...input, enemyTeam: [{ ...target,
      stats: { ...target.stats, defense: 10000 } }] });
    expect(r.events.filter(e => e.kind === 'damage')).toEqual([expect.objectContaining({ amount: 1 })]);
    expect(r.result.enemyTeam[0]?.life).toBe(996);
  });

  it('hits the authored target set and gives each landed target its own Burn', () => {
    const input = fixture(spell, 1);
    const r = runBattleRecorded({ ...input, enemyTeam: [unit('one', 'enemy'),
      unit('two', 'enemy'), unit('three', 'enemy')] });
    const expected = spell.slug === 'molten-boulder' ? ['one', 'two'] : ['one', 'two', 'three'];
    expect(r.events.flatMap(e => e.kind === 'damage' ? [e.target] : [])).toEqual(expected);
    for (const target of r.result.enemyTeam) {
      const damage = r.events.reduce((sum, e) => sum +
        (e.kind === 'damage' && e.target === target.id ? e.amount : 0), 0);
      const dot = r.events.reduce((sum, e) => sum +
        (e.kind === 'dot' && e.target === target.id ? e.amount : 0), 0);
      expect(dot).toBe(damage > 0 ? Math.floor(damage * 0.1) * 3 : 0);
      expect(target.life).toBe(1000 - damage - dot);
    }
  });

  it('honors basic fallback inside cooldown and casts at its exact boundary', () => {
    const input = fixture(spell, 1), hero = first(input.playerTeam);
    const at = 500 + spell.cooldown * 1000;
    const r = runBattleRecorded({ ...input, playerTeam: [{ ...hero, mana: spell.mana * 2,
      stats: { ...hero.stats, attackSpeed: 250 }, statuses: [hold(at + 1)] }] });
    const id = 'druid.' + spell.slug.replaceAll('-', '_');
    expect(r.events.flatMap(e => e.kind === 'action' && e.actor === 'hero' ? [[e.simClockMs, e.skillId]] : []))
      .toEqual(Array.from({ length: at / 500 }, (_, index) => [(index + 1) * 500,
        index === 0 || (index + 1) * 500 === at ? id : null]));
    expect(r.result.playerTeam[0]?.mana).toBe(0);
  });

  it.each([undefined, 2])('refreshes a legacy Burn with prior rate %s using shared aggregate policy', priorRate => {
    const input = fixture(spell, 1), target = first(input.enemyTeam);
    const marker: ActiveStatus = { id: 'burn', stacks: 2, remaining: 3, sourceId: 'old-source',
      appliedAtMs: 0, expiresAtMs: 5000, ...(priorRate ? { dotPerStack: priorRate, damageType: 'fire' } : {}) };
    const r = runBattleRecorded({ ...input, enemyTeam: [{ ...target, statuses: [hold(), marker] }] });
    const observed = r.events.find(e => e.kind === 'status-state' && e.target === 'target' && e.simClockMs === 1700);
    expect(observed?.kind === 'status-state' ? observed.statuses.filter(s => s.id === 'burn' || s.id === 'ignite') : [])
      .toEqual([expect.objectContaining({ id: 'burn', stacks: 3, appliedAtMs: 0, expiresAtMs: 5000,
        sourceId: priorRate ? 'old-source' : 'hero', dotPerStack: priorRate ?? Math.floor(spell.seedHit * 0.1) })]);
    const dot = priorRate ? 26 : Math.floor(Math.floor(spell.seedHit * 0.1) * 3 * 3.3);
    expect(r.result.enemyTeam[0]?.life).toBe(1000 - spell.seedHit - dot);
  });

  it('does not apply Burn or spend spell mana when one MP short', () => {
    const input = fixture(spell, 1), hero = first(input.playerTeam);
    const r = runBattleRecorded({ ...input, playerTeam: [{ ...hero, mana: spell.mana - 1 }] });
    expect(r.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: null, simClockMs: 1700 })]);
    expect(r.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    expect(r.result.playerTeam[0]?.mana).toBe(spell.mana - 1);
    expect(r.result.enemyTeam[0]?.life).toBe(999);
  });

  it('pays for a missed cast without applying Burn or periodic HP loss', () => {
    const input = fixture(spell, 20), target = first(input.enemyTeam);
    const r = runBattleRecorded({ ...input, seed: 1, enemyTeam: [{ ...target,
      stats: { ...target.stats, magicDodge: 1 } }] });
    expect(r.events.filter(e => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 0, dodged: true })]);
    expect(r.events.filter(e => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    expect(r.result.enemyTeam[0]?.life).toBe(1000);
    expect(r.result.playerTeam[0]?.mana).toBe(0);
  });
});
