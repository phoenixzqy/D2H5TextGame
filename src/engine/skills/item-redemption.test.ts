import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import skillSchema from '../../data/schema/skill.schema.json';
import { skills, skillFiles } from '../../data';
import { getSkill } from './registry';
import { resolveItemRedemption } from './item-redemption';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(skillSchema);
const row = {
  id: 'item-redemption', name: 'skills.item.redemption.name',
  description: 'skills.item.redemption.desc', trigger: 'active', target: 'self',
  minLevel: 1, maxLevel: 1, cooldown: 4, cost: { mana: 0 },
  heal: { pctOfMaxLife: .1, target: 'self' }
};

describe('authored item Redemption contract', () => {
  it('accepts the approved percentage heal alongside existing flat healing', () => {
    expect(validate(row), JSON.stringify(validate.errors)).toBe(true);
    expect(validate({ ...row, id: 'fixture-heal', heal: { min: 10, max: 20, target: 'ally' } })).toBe(true);
  });
  it.each([
    { pctOfMaxLife: .1, min: 1, max: 2, target: 'self' },
    { pctOfMaxLife: -.1, target: 'self' }, { pctOfMaxLife: 1.1, target: 'self' },
    { pctOfMaxLife: '0.1', target: 'self' }, { pctOfMaxLife: .1 },
    { pctOfMaxLife: .1, target: 'self', extra: 1 },
    { min: 1, target: 'ally' }
  ])('rejects mixed, incomplete or malformed heal metadata %j', heal => {
    expect(validate({ ...row, heal })).toBe(false);
  });
  it('loads exactly one authored row through the central file manifest', () => {
    expect(skillFiles).toContain('./skills/item.json');
    expect(skills.filter(skill => skill.id === row.id)).toEqual([row]);
  });
  it('registers the separate self heal through both item identities', () => {
    const skill = getSkill('item.redemption');
    expect(skill).toEqual({ id: 'item.redemption', archetype: 'item', trigger: 'active',
      target: 'self', cooldown: 4, manaCost: 0, minLevel: 1,
      effects: [{ kind: 'heal', pctOfMaxLife: .1, target: 'self' }] });
    expect(getSkill('item-redemption')).toBe(skill);
    expect(getSkill('paladin.redemption')).not.toBe(skill);
  });
  it('copies and freezes validated metadata independently of mutable source rows', () => {
    const source = structuredClone(row);
    const skill = resolveItemRedemption([source]);
    source.heal.pctOfMaxLife = .9;
    source.cooldown = 99;
    expect(skill.cooldown).toBe(4);
    expect(skill.effects).toEqual([{ kind: 'heal', pctOfMaxLife: .1, target: 'self' }]);
    expect([skill, skill.effects, ...skill.effects].every(Object.isFrozen)).toBe(true);
  });
  it.each([
    [], [row, row], [{ ...row, cooldown: 3 }], [{ ...row, target: 'single-ally' }],
    [{ ...row, heal: { pctOfMaxLife: .2, target: 'self' } }],
    [{ ...row, cost: { mana: 1 } }], [{ ...row, maxLevel: 20 }],
    [{ ...row, damage: { min: 1, max: 1 } }]
  ].map(source => ({ source })))('rejects missing, duplicate or unapproved authored metadata $source', ({ source }) => {
    expect(() => resolveItemRedemption(source)).toThrow('Invalid authored item Redemption');
  });
});
