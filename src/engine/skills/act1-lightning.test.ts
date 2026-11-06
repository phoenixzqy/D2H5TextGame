import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import monsters from '../../data/skills/monsters.json';
import schema from '../../data/schema/skill.schema.json';
import { ACT1_LIGHTNING_AFFIX_SKILL, resolveAct1LightningAffix } from './act1-lightning';

const id = 'monster-act1-lightning-affix';
const fixture = () => ({
  id, name: 'skills.monster.lightning.name', description: 'skills.monster.lightning.desc',
  icon: 'skills/monster/lightning.png', trigger: 'active', target: 'single-enemy',
  cost: { mana: 0 }, cooldown: 2, minLevel: 1, maxLevel: 1,
  damage: { min: 12, max: 18, breakdown: { lightning: 18 } }, damageType: 'lightning',
  scaling: { monsterLevelDamageGrowth: [2, 3] }
});
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);

describe('Act I Lightning affix authored contract', () => {
  it('keeps the dedicated level-scaled leaf distinct from the normalized shared Lightning row', () => {
    expect(monsters.filter(row => row.id === id)).toEqual([fixture()]);
    expect(monsters.find(row => row.id === 'monster-lightning')).toMatchObject({
      target: 'single-enemy', cooldown: 2, damage: { min: 40, max: 60 },
      appliesStatus: ['paralyze'], appliesTags: ['lightning', 'shock']
    });
  });

  it('accepts the new exact leaf and rejects use of its growth tuple by other identities', () => {
    expect(validate(fixture())).toBe(true);
    expect(validate({ ...fixture(), id: 'monster-lightning' })).toBe(false);
    expect(validate({ ...fixture(), id: 'skills-sorceress-charged-bolt' })).toBe(false);
  });

  it.each([
    { scaling: undefined }, { scaling: {} },
    ...[[], [1], [1, 2, 3], [-1, 2], [1, 0.5], [NaN, 2], [1, Infinity], ['1', 2]]
      .map(monsterLevelDamageGrowth => ({ scaling: { monsterLevelDamageGrowth } })),
    { cooldown: 1 }, { cooldown: 3 }, { cost: { mana: 1 } }, { cost: { mana: 0, life: 1 } },
    { target: 'all-enemies' }, { trigger: 'passive' }, { minLevel: 2 }, { maxLevel: 2 },
    { damageType: 'fire' }, { appliesStatus: ['paralyze'] }, { appliesTags: ['lightning'] },
    { statusEffect: { duration: 2 } }, { scaling: { monsterLevelDamageGrowth: [2, 3], damagePerLevel: 99 } }
  ])('refuses unsupported selected-row semantics %j', fields => {
    expect(validate({ ...fixture(), ...fields })).toBe(false);
  });
});

describe('Act I Lightning affix leaf adapter', () => {
  it('consumes the actual row and alternate authored coefficients without shared skill changes', () => {
    const before = structuredClone(monsters);
    expect(ACT1_LIGHTNING_AFFIX_SKILL).toEqual({
      id: 'monster.act1_lightning_affix', archetype: 'monster', target: 'single-enemy',
      cooldown: 2, minLevel: 1, manaCost: 0,
      effects: [{ kind: 'damage', damageType: 'lightning', base: [12, 18], perRank: [2, 3] }]
    });
    expect(resolveAct1LightningAffix(monsters)).toEqual(ACT1_LIGHTNING_AFFIX_SKILL);
    expect(resolveAct1LightningAffix([{ ...fixture(), damage: { min: 3, max: 8, breakdown: { lightning: 8 } },
      scaling: { monsterLevelDamageGrowth: [0, 7] } }]).effects)
      .toEqual([{ kind: 'damage', damageType: 'lightning', base: [3, 8], perRank: [0, 7] }]);
    expect(monsters).toEqual(before);
  });

  it('copies and deeply freezes output while leaving caller data mutable and independent', () => {
    const row = fixture();
    const before = structuredClone(row);
    const first = resolveAct1LightningAffix([row]);
    const second = resolveAct1LightningAffix([row]);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.effects).not.toBe(second.effects);
    const effect = first.effects[0];
    if (effect?.kind !== 'damage') throw new Error('Missing damage effect');
    for (const value of [first, first.effects, effect, effect.base, effect.perRank]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(row).toEqual(before);
    for (const value of [row, row.damage, row.scaling, row.scaling.monsterLevelDamageGrowth]) {
      expect(Object.isFrozen(value)).toBe(false);
    }
    row.damage.min = 99;
    row.scaling.monsterLevelDamageGrowth[0] = 99;
    expect(first).toEqual(ACT1_LIGHTNING_AFFIX_SKILL);
    expect(Reflect.set(effect.base, '0', 99)).toBe(false);
    expect(Reflect.set(effect.perRank ?? {}, '0', 99)).toBe(false);
  });

  it('requires one exact row and ignores unrelated rows', () => {
    for (const rows of [[], [null, 42, {}], [{ ...fixture(), id: 'monster-lightning' }],
      [fixture(), fixture()]]) {
      expect(() => resolveAct1LightningAffix(rows)).toThrow(/exactly one/);
    }
    expect(resolveAct1LightningAffix([null, {}, { id: 'monster-lightning' }, fixture()]))
      .toEqual(ACT1_LIGHTNING_AFFIX_SKILL);
  });

  it.each([
    { damage: { min: 19, max: 18 } }, { damage: { min: -1, max: 18 } },
    { damage: { min: 1.5, max: 18 } }, { damage: { min: NaN, max: 18 } },
    { damage: { min: 12, max: Infinity } }, { damage: { min: 12 } },
    ...[[3, 2], [NaN, 3], [2, Infinity], [-1, 3], [2.5, 3], [], [2], [2, 3, 4]]
      .map(monsterLevelDamageGrowth => ({ scaling: { monsterLevelDamageGrowth } })),
    { cooldown: 3 }, { target: 'all-enemies' }, { appliesTags: [] }, { appliesStatus: [] },
    { scaling: undefined }, { damage: undefined }, { cost: undefined }
  ])('refuses malformed selected coefficients or behavior %j', fields => {
    expect(() => resolveAct1LightningAffix([{ ...fixture(), ...fields,
      ...('damage' in fields && fields.damage ? { damage: { ...fields.damage, breakdown: { lightning: 18 } } } : {}) }])).toThrow(/Lightning affix/);
  });
});
