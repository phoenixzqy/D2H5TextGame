import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import { MONSTER_SELF_BUFFS, MONSTER_SELF_BUFF_IDS, isMonsterSelfBuffSource, resolveMonsterSelfBuffs } from './monster-self-buffs';
import { monsters } from '../../data';
import { buildMonsterUnit } from '../combat/monster-factory';
import { createRng } from '../rng';

const fixture = (): Record<string, unknown>[] => structuredClone(rows);
function row(input: Record<string, unknown>[], id: string): Record<string, unknown> {
  const value = input.find(r => r.id === 'monster-' + id); if (!value) throw new Error('Missing fixture'); return value;
}
describe.each(MONSTER_SELF_BUFF_IDS)('authored monster %s buff', id => {
  it('copies and deeply freezes numeric native authority independently of mutable source', () => {
    const input = fixture(), before = structuredClone(input), output = resolveMonsterSelfBuffs(input);
    expect(output).toEqual(MONSTER_SELF_BUFFS); expect(input).toEqual(before);
    const saved = structuredClone(output);
    for (const entry of output) for (const value of [output, entry, entry.definition, entry.skill, entry.skill.effects, entry.skill.effects[0]])
      expect(Object.isFrozen(value)).toBe(true);
    row(input, id).monsterSelfBuff = { durationMs: 1, percent: 99 };
    expect(output).toEqual(saved); expect(Object.isFrozen(input)).toBe(false);
  });
  it('rejects missing/duplicate rows and incomplete/nonfinite/unsupported payloads', () => {
    const source = fixture();
    expect(() => resolveMonsterSelfBuffs(source.filter(r => r.id !== 'monster-' + id))).toThrow();
    expect(() => resolveMonsterSelfBuffs([...source, row(source, id)])).toThrow();
    for (const change of [
      { monsterSelfBuff: undefined }, { monsterSelfBuff: {} },
      ...[0, -1, 100.1, NaN, Infinity].map(percent => ({ monsterSelfBuff: { durationMs: 1000, percent } })),
      ...[0, -1, 1.1, 60001, NaN, Infinity].map(durationMs => ({ monsterSelfBuff: { durationMs, percent: 50 } })),
      { monsterSelfBuff: { durationMs: 1000, percent: 50, attackSpeedPct: 20 } },
      { cost: undefined }, { cost: { mana: 1 } }, { minLevel: 2 }, { maxLevel: 20 },
      { trigger: 'passive' }, { target: 'all-enemies' },
      { damage: { min: 5, max: 15, breakdown: { thorns: 15 } } }, { damageType: 'thorns' },
      { appliesStatus: ['stun'] }, { appliesTags: ['physical'] }, { projectileFlightMs: 500 },
      { heal: { pctOfMaxLife: .3, target: 'self' } }, { scaling: { damagePerLevel: 1 } }
    ]) {
      const input = fixture(); Object.assign(row(input, id), change);
      expect(() => resolveMonsterSelfBuffs(input)).toThrow();
    }
  });
});
it('derives permitted numeric tuning from JSON instead of engine constants', () => {
  const input = fixture(); row(input, 'shout').monsterSelfBuff = { durationMs: 4000, percent: 20 };
  const entry = resolveMonsterSelfBuffs(input).find(value => value.definition.id === 'shout');
  expect(entry?.definition).toMatchObject({ durationMs: 4000, percent: 20 });
  expect(entry?.skill.effects).toEqual([{ kind: 'buff', id: 'monster-shout', duration: 4 }]);
});
it('qualifies only a living native catalog consumer without foreign ownership', () => {
  const def = monsters.find(row => row.id === 'monsters/act3.thorned-hulk'); if (!def) throw new Error('Missing native monster');
  const unit = buildMonsterUnit({ def, tier: 'trash', level: 20, id: 'enemy', rng: createRng(7) });
  expect(isMonsterSelfBuffSource(unit, 'thorns-aura')).toBe(true);
  expect(isMonsterSelfBuffSource(unit, 'enrage')).toBe(false);
  for (const changed of [{ kind: 'hero' as const }, { kind: 'merc' as const }, { side: 'player' as const },
    { life: 0 }, { life: NaN }, { level: 0 }, { summon: true }, { ownerId: 'owner' },
    { summonOwnerId: 'owner' }, { summonTemplateId: 'golem' }, { monsterArchetypeId: 'fake' }])
    expect(isMonsterSelfBuffSource({ ...unit, ...changed }, 'thorns-aura')).toBe(false);
});
