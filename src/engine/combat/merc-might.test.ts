import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { composeMightAura } from '../skills/might';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';

const stun = { id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 };
function unit(id: string, side: CombatUnit['side'] = 'player'): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 30, tier: 'trash',
    life: 100000, mana: 100,
    stats: { life: 100000, lifeMax: 100000, mana: 100, manaMax: 100, attack: 100, defense: 0,
      magicResist: 0, attackSpeed: 200, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0, resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    basicAttack: { damageType: 'physical', damage: [100, 100] },
    statuses: [], skillOrder: [], activeBuffIds: [], cooldowns: {}, enraged: false };
}
function source(): CombatUnit {
  return { ...unit('merc-source'), kind: 'merc', mercMightAura: true, statuses: [stun] };
}
function snapshot(merc = source(), actor = unit('hero')): CombatSnapshot {
  return { seed: 7, playerTeam: [actor, merc], enemyTeam: [{ ...unit('target', 'enemy'), statuses: [stun] }] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(out.result);
  expect(runBattleRecorded(input)).toEqual(out);
  for (const original of [...input.playerTeam, ...input.enemyTeam]) {
    const result = [...out.result.playerTeam, ...out.result.enemyTeam].find(row => row.id === original.id);
    expect(result?.stats).toEqual(original.stats);
  }
  return out;
}
function firstDamage(input: CombatSnapshot, sourceId = 'hero') {
  const hit = record(input).events.find(event => event.kind === 'damage' && event.source === sourceId);
  if (hit?.kind !== 'damage') throw new Error('Missing actual damage from ' + sourceId);
  return hit;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('native mercenary Might presence', () => {
  it.each(['hero', 'merc', 'summon'] as const)('increases direct physical damage for a living allied %s', kind => {
    const actor = { ...unit('hero'), kind, ...(kind === 'summon' ? { summon: true, ownerId: 'owner' } : {}) };
    expect(firstDamage(snapshot(source(), actor))).toMatchObject({ amount: 130 });
  });
  it('includes the source itself without writing an ordinary aura buff or consuming an action', () => {
    const merc = { ...source(), statuses: [], skillOrder: ['aura-might'] };
    const result = record(snapshot(merc, { ...unit('hero'), statuses: [stun] }));
    expect(result.events.find(e => e.kind === 'damage' && e.source === merc.id)).toMatchObject({ amount: 130 });
    expect(result.events.some(e => e.kind === 'action' && e.skillId === 'aura-might')).toBe(false);
    expect(result.result.playerTeam.find(row => row.id === merc.id)?.activeBuffIds).toEqual([]);
  });
  it('adds to existing increases before criticals, physical resistance and defense', () => {
    const input = snapshot(source(), { ...unit('hero'), increasedDamagePct: { physical: .25 },
      stats: { ...unit('hero').stats, critChance: 1 } });
    const target = { ...unit('target', 'enemy'), statuses: [stun],
      stats: { ...unit('target', 'enemy').stats, defense: 7,
        resistances: { ...unit('target', 'enemy').stats.resistances, physical: 25 } } };
    // floor(100 * (1 + .25 + .30) * 2 * .75 - 7) = 225.
    expect(firstDamage({ ...input, enemyTeam: [target] })).toMatchObject({ amount: 225, crit: true });
  });
  it('stacks additively with selected Paladin Might and ignores duplicate native sources', () => {
    const input = snapshot();
    const mightAura = composeMightAura({ id: 'hero', class: 'paladin', level: 30,
      skillLevels: { 'paladin.might': 20 }, selectedAuraId: 'paladin.might' }, 'merc-source');
    if (!mightAura) throw new Error('Missing real selected Paladin Might');
    expect(firstDamage({ ...input, mightAura, playerTeam: [...input.playerTeam, { ...source(), id: 'duplicate' }] }))
      .toMatchObject({ amount: 190 });
  });
  it('withdraws at actual source death, and starts the next wave without a retained bonus', () => {
    registerSkill({ id: 'fixture.might-fixed-hit', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
      manaCost: 0, cooldown: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100], alwaysHits: true }] });
    const merc = { ...source(), life: 2, statuses: [stun, { id: 'poison', stacks: 1, sourceId: 'fixture',
      remaining: -1, dotPerStack: 1 }] };
    const hero = { ...unit('hero'), skillOrder: ['fixture.might-fixed-hit'], stats: { ...unit('hero').stats, attackSpeed: 100 } };
    const result = record(snapshot(merc, hero));
    expect(result.events).toContainEqual(expect.objectContaining({ kind: 'death', target: merc.id, simClockMs: 2000 }));
    const hits = result.events.filter(e => e.kind === 'damage' && e.source === 'hero');
    expect(hits.slice(0, 2)).toEqual([
      expect.objectContaining({ amount: 130, simClockMs: 1700 }),
      expect.objectContaining({ amount: 100, simClockMs: 3400 })
    ]);
    const carried = result.result.playerTeam.find(row => row.id === 'hero');
    if (!carried) throw new Error('Missing carried hero');
    expect(firstDamage({ ...snapshot(), playerTeam: [carried] })).toMatchObject({ amount: 100 });
  });
  it.each(['stun', 'freeze'])('keeps the presence while the living source is %s', id => {
    expect(firstDamage(snapshot({ ...source(), statuses: [{ ...stun, id }] }))).toMatchObject({ amount: 130 });
  });
  it.each([
    { kind: 'hero' as const }, { kind: 'monster' as const }, { kind: 'summon' as const },
    { summon: true }, { ownerId: 'owner' }, { summonOwnerId: 'owner' }, { summonTemplateId: 'minion' },
    { side: 'enemy' as const }, { life: 0 }, { life: NaN }, { level: 0 }, { level: 1.5 }
  ])('refuses an ineligible source %j', patch => {
    expect(firstDamage(snapshot({ ...source(), ...patch }))).toMatchObject({ amount: 100 });
  });
  it('does not infer native authority from a skill order or buff marker', () => {
    const { mercMightAura: _marker, ...merc } = source();
    expect(firstDamage(snapshot({ ...merc, skillOrder: ['aura-might'], activeBuffIds: ['might', 'aura-might'] })))
      .toMatchObject({ amount: 100 });
  });
  it.each(['fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)('does not increase %s damage', damageType => {
    expect(firstDamage(snapshot(source(), { ...unit('hero'), basicAttack: { damageType, damage: [100, 100] } })))
      .toMatchObject({ amount: 100, damageType });
  });
  it('never grants the party increase to enemies', () => {
    const input = snapshot(source(), { ...unit('hero'), statuses: [stun] });
    expect(firstDamage({ ...input, enemyTeam: [unit('target', 'enemy')] }, 'target')).toMatchObject({ amount: 100 });
  });
  it('includes a newly created summon without adding actions or changing hit RNG', () => {
    registerSkill({ id: 'fixture.might-minion', archetype: 'fixture', target: 'self', minLevel: 1,
      manaCost: 0, cooldown: 100, effects: [{ kind: 'summon', summonId: 'minion', maxCount: 1 }] });
    const input = snapshot(source(), { ...unit('hero'), skillOrder: ['fixture.might-minion'] });
    const withAura = record(input);
    const { mercMightAura: _marker, ...merc } = source();
    const withoutAura = record({ ...input, playerTeam: [input.playerTeam[0] ?? unit('hero'), merc] });
    const summon = withAura.events.find(e => e.kind === 'summon');
    if (summon?.kind !== 'summon') throw new Error('No actual summon');
    const id = summon.unit.id;
    const enabled = withAura.events.find(e => e.kind === 'damage' && e.source === id);
    const control = withoutAura.events.find(e => e.kind === 'damage' && e.source === id);
    expect(control).toMatchObject({ amount: 10, damageType: 'physical', crit: false });
    expect(enabled).toMatchObject({ amount: 13, damageType: 'physical', crit: false });
    expect(withAura.events.filter(e => e.kind === 'action')).toEqual(withoutAura.events.filter(e => e.kind === 'action'));
    const rngObservations = (result: typeof withAura) => result.events.flatMap(e => e.kind === 'damage'
      ? [{ source: e.source, target: e.target, crit: e.crit, dodged: e.dodged, simClockMs: e.simClockMs }] : []);
    expect(rngObservations(withAura)).toEqual(rngObservations(withoutAura));
  });
});
