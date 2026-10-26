import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit } from './types';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { getSummon, registerSummon, type SummonFactory } from '../skills/summons';
import { qualifyFireGolem } from '../skills/fire-golem';

function fixture(): CombatSnapshot {
  const hero: CombatUnit = {
    id: 'hero', name: 'Synthetic owner', side: 'player', kind: 'hero', level: 30,
    tier: 'trash', life: 1000, mana: 100, fireGolemRank: 1,
    stats: { life: 1000, lifeMax: 1000, mana: 100, manaMax: 100, attack: 1,
      defense: 0, magicResist: 0, attackSpeed: 0, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } },
    statuses: [{ id: 'stun', sourceId: 'isolation', stacks: 1, remaining: -1 }],
    cooldowns: {}, activeBuffIds: [], enraged: false,
    skillOrder: ['necromancer.fire_golem'], skillLevels: { 'necromancer.fire_golem': 1 }
  };
  return { seed: 7, playerTeam: [hero], enemyTeam: [{ ...hero, id: 'target', name: 'Held target',
    side: 'enemy', kind: 'monster', skillOrder: [], skillLevels: {} }] };
}
function hero(input: CombatSnapshot): CombatUnit {
  const value = input.playerTeam[0];
  if (!value) throw new Error('Missing owner');
  return value;
}
function skill() {
  const value = getSkill('necromancer.fire_golem');
  if (!value) throw new Error('Missing actual Fire Golem registration');
  return value;
}
let factory: SummonFactory;
beforeEach(() => {
  resetRegistry(); loadDefaultSkills();
  const original = getSummon('fire_golem');
  if (!original) throw new Error('Missing Fire Golem template');
  factory = original;
  // A bounded one-hit numeric fixture; native tests separately use the real unchanged body.
  registerSummon('fire_golem', owner => {
    const body = factory(owner);
    return { ...body, stats: { ...body.stats, attack: 100, attackSpeed: 0, critChance: 0 },
      statuses: [{ id: 'stun', sourceId: 'isolation', stacks: 1, remaining: -1, appliedAtMs: 2001 }] };
  });
});
afterEach(() => { registerSummon('fire_golem', factory); resetRegistry(); loadDefaultSkills(); });

describe('paid Fire Golem authority and ordinary damage', () => {
  it('settles one actual 100 Fire hit plus 30 shared Burn HP loss with pure deterministic results', () => {
    const input = fixture(), before = structuredClone(input), result = runBattleRecorded(input);
    const direct = result.events.filter(e => e.kind === 'damage' && e.target === 'target');
    expect(direct).toEqual([expect.objectContaining({ amount: 100, damageType: 'fire', simClockMs: 2000 })]);
    const periodic = result.events.filter(e => e.kind === 'dot' && e.target === 'target');
    expect(periodic.reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)).toBe(30);
    expect(result.result.enemyTeam[0]?.life).toBe(870);
    expect(result.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ mana: 65, simClockMs: 0 })
    ]);
    expect(input).toEqual(before);
    expect(runBattleRecorded(input)).toEqual(result);
    expect(runBattle(input)).toEqual(result.result);
    runBattleRecorded({ ...input, seed: 9 });
    expect(runBattleRecorded(input)).toEqual(result);
  });
  it('keeps the matched paid bare-authority body Physical without Burn', () => {
    const input = fixture();
    const result = runBattleRecorded({ ...input, playerTeam: [{ ...hero(input), fireGolemRank: 0 }] });
    expect(result.events.filter(e => e.kind === 'summon')).toHaveLength(1);
    expect(result.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([
      expect.objectContaining({ mana: 65, simClockMs: 0 })
    ]);
    expect(result.events.filter(e => e.kind === 'damage' && e.target === 'target')).toEqual([
      expect.objectContaining({ amount: 100, damageType: 'physical', simClockMs: 2000 })
    ]);
    expect(result.events.filter(e => e.kind === 'dot')).toEqual([]);
    expect(result.result.enemyTeam[0]?.life).toBe(900);
  });
  it('uses Fire resistance before the shared Burn potency snapshot', () => {
    const input = fixture(), target = input.enemyTeam[0];
    if (!target) throw new Error('Missing target');
    const result = runBattleRecorded({ ...input, enemyTeam: [{ ...target,
      stats: { ...target.stats, resistances: { ...target.stats.resistances, fire: 50 } } }] });
    expect(result.events.filter(e => e.kind === 'damage' && e.target === 'target')).toEqual([
      expect.objectContaining({ amount: 50, damageType: 'fire' })
    ]);
    expect(result.events.filter(e => e.kind === 'dot').reduce((sum, e) =>
      sum + e.amount, 0)).toBe(15);
    expect(result.result.enemyTeam[0]?.life).toBe(935);
  });
  it('does not assign power to an unpaid preloaded same-template body', () => {
    const input = fixture(), owner = hero(input), body = getSummon('fire_golem')?.(owner);
    if (!body) throw new Error('Missing preload');
    const result = runBattleRecorded({ ...input, playerTeam: [owner, body] });
    expect(result.events.filter(e => e.kind === 'summon')).toEqual([]);
    expect(result.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(result.events.filter(e => e.kind === 'damage' && e.source === body.id)).toEqual([
      expect.objectContaining({ damageType: 'physical', amount: 100 })
    ]);
    expect(result.events.filter(e => e.kind === 'dot')).toEqual([]);
  });
  it.each([undefined, 0, -1, 1.5, 21, NaN, Infinity])('rejects malformed native rank %s', rank => {
    const owner = { ...hero(fixture()), ...(rank === undefined ? {} : { fireGolemRank: rank }) };
    if (rank === undefined) Reflect.deleteProperty(owner, 'fireGolemRank');
    expect(qualifyFireGolem(owner, skill(), 1)).toBe(false);
  });
  it.each<Partial<CombatUnit>>([
    { id: '' }, { side: 'enemy' }, { kind: 'merc' }, { summon: true },
    { ownerId: 'borrowed' }, { summonOwnerId: 'borrowed' }, { level: 29 },
    { level: 30.5 }, { life: 0 }, { life: NaN }, { skillOrder: [] },
    { skillLevels: {} }, { skillLevels: { 'necromancer.fire_golem': 1.5 } }
  ])('rejects contradictory owner authority %#', patch => {
    expect(qualifyFireGolem({ ...hero(fixture()), ...patch }, skill(), 1)).toBe(false);
  });
  it('rejects altered registered semantics while preserving generic paid preparation', () => {
    const original = skill(); registerSkill({ ...original, manaCost: 1 });
    const input = fixture(), result = runBattleRecorded(input);
    expect(qualifyFireGolem(hero(input), skill(), 1)).toBe(false);
    expect(result.events.filter(e => e.kind === 'summon')).toHaveLength(1);
    expect(result.events.filter(e => e.kind === 'damage' && e.target === 'target')).toEqual([
      expect.objectContaining({ damageType: 'physical', amount: 100 })
    ]);
    expect(result.events.filter(e => e.kind === 'dot')).toEqual([]);
  });
  it('poor mana yields no paid body or effect', () => {
    const input = fixture(), result = runBattleRecorded({ ...input,
      playerTeam: [{ ...hero(input), mana: 34 }] });
    expect(result.events.filter(e => e.kind === 'summon' || e.kind === 'dot')).toEqual([]);
    expect(result.events.filter(e => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
  });
});
