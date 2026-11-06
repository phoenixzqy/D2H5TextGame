import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadDefaultSkills, registerSkill } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (start = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture',
  stacks: 1, remaining: -1, appliedAtMs: start });
function unit(id: string, side: CombatUnit['side'], life = 10000): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', tier: 'trash',
    level: 30, life, mana: 100, statuses: [hold()], cooldowns: {}, skillOrder: [],
    activeBuffIds: [], enraged: false,
    stats: { life: 10000, lifeMax: 10000, mana: 100, manaMax: 100, attack: 100,
      defense: 0, magicResist: 0, attackSpeed: 250, critChance: 0, critDamage: 2,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function fixture(): CombatSnapshot {
  return { seed: 7, playerTeam: [{ ...unit('actor', 'player'), statuses: [hold(1001)] }],
    enemyTeam: [unit('durable', 'enemy'), unit('weak', 'enemy', 2000)] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before);
  return out;
}
function hits(out: ReturnType<typeof record>, source = 'actor') {
  return out.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
    e.kind === 'damage' && e.source === source);
}
beforeEach(() => {
  loadDefaultSkills();
  registerSkill({ id: 'fixture.single', archetype: 'fixture', target: 'single-enemy',
    minLevel: 1, manaCost: 7, cooldown: 100,
    effects: [{ kind: 'damage', damageType: 'fire', base: [100, 100], alwaysHits: true }] });
});
afterEach(() => { loadDefaultSkills(); });

describe('shared automatic single-target finishing priority', () => {
  it.each([
    ['hero', false], ['hero', true], ['merc', false], ['merc', true], ['summon', false], ['summon', true]
  ] as const)('uses current life for %s with paid skill=%s', (kind, paidSkill) => {
    const skillOrder = paidSkill ? ['fixture.single'] : [];
    const base = fixture(), input = { ...base, playerTeam: base.playerTeam.map(u => ({ ...u, kind, skillOrder })) };
    const out = record(input);
    expect(hits(out).map(e => e.target)).toEqual(['weak', 'weak']);
    expect(out.result.playerTeam[0]?.mana).toBe(skillOrder.length ? 93 : 100);
  });
  it('uses absolute life rather than percentage or maximum life', () => {
    const base = fixture(), out = record({ ...base, enemyTeam: [
      unit('large-wounded', 'enemy', 500), { ...unit('small-full', 'enemy', 200),
        stats: { ...unit('small-full', 'enemy').stats, life: 200, lifeMax: 200 } }] });
    expect(hits(out)[0]?.target).toBe('small-full');
  });
  it('does not let weaker summoned replacements shield their living summoner', () => {
    const base = fixture(), out = record({ ...base, enemyTeam: [unit('owner', 'enemy'),
      { ...unit('replacement', 'enemy', 1), kind: 'summon', summonOwnerId: 'owner' }] });
    expect(hits(out).map(e => e.target)).toEqual(['owner', 'owner']);
  });
  it('chooses by life when only hostile summons remain', () => {
    const base = fixture(), out = record({ ...base,
      enemyTeam: base.enemyTeam.map(u => ({ ...u, kind: 'summon' as const })) });
    expect(hits(out).map(e => e.target)).toEqual(['weak', 'weak']);
  });
  it('lets explicit Taunt override the ordinary-opponent priority', () => {
    const base = fixture(), out = record({ ...base, enemyTeam: [unit('owner', 'enemy'),
      { ...unit('replacement', 'enemy', 2000), kind: 'summon', summonOwnerId: 'owner' }],
      playerTeam: base.playerTeam.map(u => ({ ...u, statuses: [...u.statuses, { id: 'taunt',
        sourceId: 'replacement', stacks: 1, remaining: 2, appliedAtMs: 0, expiresAtMs: 2000 }] })) });
    expect(hits(out).map(e => e.target)).toEqual(['replacement', 'replacement']);
  });
  it('keeps registration order for equal current life', () => {
    const base = fixture(), enemies = [unit('a', 'enemy'), unit('b', 'enemy')];
    for (const enemyTeam of [enemies, [...enemies].reverse()]) {
      expect(hits(record({ ...base, enemyTeam }))[0]?.target).toBe(enemyTeam[0]?.id);
    }
  });
  it('reacquires after each kill and excludes an initially dead body', () => {
    const base = fixture(), out = record({ ...base, seed: 5, enemyTeam: [unit('dead', 'enemy', 0),
      unit('durable', 'enemy'), unit('second', 'enemy', 100), unit('first', 'enemy', 50)] });
    expect(hits(out).map(e => e.target)).toEqual(['first', 'second']);
    expect(out.events.filter(e => e.kind === 'death').map(e => e.target)).toEqual(['first', 'second']);
  });
  it('sees life changed by an earlier ally action', () => {
    registerSkill({ id: 'fixture.primer', archetype: 'fixture', target: 'single-enemy',
      minLevel: 1, manaCost: 0, cooldown: 100,
      effects: [{ kind: 'damage', damageType: 'physical', base: [9900, 9900], alwaysHits: true }] });
    const base = fixture(), out = record({ ...base, playerTeam: [
      { ...unit('helper', 'player'), stats: { ...unit('helper', 'player').stats, attackSpeed: 300 },
        statuses: [hold(401), { id: 'taunt', sourceId: 'durable',
        stacks: 1, remaining: 1, appliedAtMs: 0, expiresAtMs: 1000 }],
        skillOrder: ['fixture.primer'] }, ...base.playerTeam.map(u => ({ ...u, skillOrder: ['fixture.single'] }))] });
    expect(hits(out, 'helper')[0]).toMatchObject({ target: 'durable', amount: 9900, simClockMs: 400 });
    expect(hits(out).map(e => e.target)).toEqual(['durable', 'weak']);
  });
  it('lets active in-pool Taunt win, then uses life at exact expiry', () => {
    const base = fixture(), out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u,
      statuses: [...u.statuses, { id: 'taunt', sourceId: 'durable', stacks: 1, remaining: 1,
        appliedAtMs: 500, expiresAtMs: 1000 }] })) });
    expect(hits(out).map(e => [e.simClockMs, e.target])).toEqual([[500, 'durable'], [1000, 'weak']]);
  });
  it.each(['dead', 'absent'])('does not follow a %s Taunt source outside the live pool', sourceId => {
    const base = fixture(), out = record({ ...base, enemyTeam: [unit('dead', 'enemy', 0), ...base.enemyTeam],
      playerTeam: base.playerTeam.map(u => ({ ...u, statuses: [...u.statuses, { id: 'taunt', sourceId,
        stacks: 1, remaining: 2, appliedAtMs: 0, expiresAtMs: 2000 }] })) });
    expect(hits(out).map(e => e.target)).toEqual(['weak', 'weak']);
  });
  it('adds no target roll compared with an equivalent singleton hit sequence', () => {
    const base = fixture(), actor = base.playerTeam[0];
    if (!actor) throw new Error('Missing fixture actor');
    const input = { ...base, playerTeam: [{ ...actor, stats: { ...actor.stats, critChance: .5 } }],
      enemyTeam: base.enemyTeam.map(u => ({ ...u, stats: { ...u.stats, physDodge: .4 } })) };
    const multi = record(input), single = record({ ...input, enemyTeam: input.enemyTeam.slice(1) });
    expect(hits(multi)).toEqual(hits(single));
    expect(runBattleRecorded(input)).toEqual(multi);
  });
  it('keeps AOE registration order rather than applying the single-target rule', () => {
    registerSkill({ id: 'fixture.area', archetype: 'fixture', target: 'area-enemies', aoeShape: 'all-enemies',
      maxTargets: 2, minLevel: 1, manaCost: 7, cooldown: 100,
      effects: [{ kind: 'damage', damageType: 'fire', base: [100, 100], alwaysHits: true }] });
    const base = fixture(), out = record({ ...base, playerTeam: base.playerTeam.map(u => ({ ...u,
      statuses: [hold(501)], skillOrder: ['fixture.area'] })) });
    expect(hits(out).map(e => e.target)).toEqual(['durable', 'weak']);
  });
  it('uses effective-player priority after a real paid Conversion hit', () => {
    const base = fixture(), hero = base.playerTeam[0];
    if (!hero) throw new Error('Missing fixture hero');
    const out = record({ ...base, playerTeam: [{ ...hero, id: 'hero', conversionRank: 1,
      statuses: [hold(501)], skillOrder: ['paladin.conversion'], skillLevels: { 'paladin.conversion': 1 } }],
      enemyTeam: [{ ...unit('convert', 'enemy', 1000), statuses: [hold(1701)],
        stats: { ...unit('convert', 'enemy').stats, attackSpeed: 100 } }, ...base.enemyTeam] });
    expect(out.events).toContainEqual(expect.objectContaining({ kind: 'status', statusId: 'converted', target: 'convert' }));
    expect(hits(out, 'convert')[0]).toMatchObject({ target: 'weak', simClockMs: 1700 });
    expect(out.result.enemyTeam[0]?.side).toBe('enemy');
  });
  it('does not act when no living opponents remain', () => {
    const base = fixture(), out = record({ ...base, enemyTeam: base.enemyTeam.map(u => ({ ...u, life: 0 })) });
    expect(hits(out)).toEqual([]);
    expect(out.events.filter(e => e.kind === 'action')).toEqual([]);
  });
});
