import { expect, it } from 'vitest';
import { attackCandidates } from './attack-targets';
import { effectiveSide, opponentsOf, type AllegianceContext } from './allegiance';
import type { ActiveStatus, CombatUnit } from './types';

const curse = (id: 'confuse' | 'attract'): ActiveStatus => ({ id, targetCurse: id,
  sourceId: 'absent-caster', stacks: 1, remaining: 3, appliedAtMs: 0, expiresAtMs: 3000 });
function unit(id: string, side: CombatUnit['side'], statuses: ActiveStatus[] = []): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', tier: 'trash', level: 30,
    life: 10000, mana: 0, cooldowns: {}, skillOrder: [], activeBuffIds: [], statuses, enraged: false,
    stats: { life: 10000, lifeMax: 10000, mana: 0, manaMax: 0, attack: 100, defense: 0, magicResist: 0,
      attackSpeed: 250, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
}
function context(units: CombatUnit[], conversions: AllegianceContext['conversions'] = new Map()): AllegianceContext {
  return { units: new Map(units.map(u => [u.id, u])), conversions, simClockMs: 500 };
}
it('player heroes, mercs and summons keep ordinary hostile candidates despite paid curse markers', () => {
  for (const kind of ['hero', 'merc', 'summon'] as const) {
    const actor = { ...unit('actor', 'player', [curse('confuse')]), kind },
      ally = unit('ally', 'player', [curse('attract')]), enemy = unit('enemy', 'enemy', [curse('attract')]);
    const state = context([actor, ally, enemy]), before = structuredClone(state);
    expect(attackCandidates(state, actor)).toEqual([enemy]);
    expect(opponentsOf(state, actor)).toEqual([enemy]); expect(state).toEqual(before);
  }
});
it('paid converted actors, converted bait and their inherited converted summons retain effective allegiance', () => {
  const hero = { ...unit('hero', 'player', [curse('attract')]), conversionRank: 1 };
  const actor = unit('actor', 'enemy', [curse('confuse')]), comrade = unit('comrade', 'enemy');
  const converted = unit('converted', 'enemy', [curse('confuse'), curse('attract'), {
    id: 'converted', sourceId: 'hero', stacks: 1, remaining: 8, appliedAtMs: 0, expiresAtMs: 8000 }]);
  const child = { ...unit('child', 'enemy', [curse('attract')]), kind: 'summon' as const,
    summon: true, summonOwnerId: 'converted' };
  const state = context([hero, actor, converted, child, comrade], new Map([
    ['converted', { sourceId: 'hero', expiresAtMs: 8000 }] ])), before = structuredClone(state);
  expect(effectiveSide(state, converted)).toBe('player'); expect(effectiveSide(state, child)).toBe('player');
  expect(attackCandidates(state, actor)).toEqual([comrade]);
  expect(attackCandidates(state, converted)).toEqual([actor, comrade]);
  expect(attackCandidates(state, child)).toEqual([actor, comrade]);
  expect(opponentsOf(state, actor)).toEqual([hero, converted, child]);
  expect(state).toEqual(before);
});
it('multiple Attract baits use original insertion order without changing sides, and exclude self/dead bodies', () => {
  const actor = unit('actor', 'enemy', [curse('attract'), curse('confuse')]);
  const first = unit('first', 'enemy', [curse('attract')]), second = unit('second', 'enemy', [curse('attract')]);
  const state = context([unit('hero', 'player'), actor, first, second]);
  expect(attackCandidates(state, actor)).toEqual([first]);
  const killed = { ...state, units: new Map([...state.units].map(([id, u]) => [id, id === 'first' ? { ...u, life: 0 } : u])) };
  expect(attackCandidates(killed, actor)).toEqual([second]);
  expect(attackCandidates({ ...state, simClockMs: 3000 }, actor)).toEqual(opponentsOf(state, actor));
  expect(effectiveSide(state, actor)).toBe('enemy'); expect(effectiveSide(state, first)).toBe('enemy');
});
