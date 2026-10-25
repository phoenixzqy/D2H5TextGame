import { describe, expect, it } from 'vitest';
import authored from '../../data/summons/druid.json';
import { getDruidSummonStats, resolveDruidSummonDefinition } from './druid-summon-definition';
import { getSummonStats } from './summons';

const oracles = [
  ['raven', 45, 18, 10, 95, 0.15, 0.05],
  ['spirit_wolf', 80, 20, 10, 85, 0.1, 0.05],
  ['dire_wolf', 100, 25, 10, 90, 0.05, 0.05],
  ['grizzly', 260, 45, 35, 55, 0.05, 0.05],
  ['poison_creeper', 90, 16, 18, 70, 0.05, 0.05],
  ['carrion_vine', 110, 12, 22, 70, 0.05, 0.05],
  ['solar_creeper', 120, 12, 24, 70, 0.05, 0.08]
] as const;

describe('authored Druid summon definitions', () => {
  it.each(oracles)(
    '%s preserves existing complete base stats and preview bytes',
    (id, life, attack, defense, attackSpeed, physDodge, magicDodge) => {
      const stats = getDruidSummonStats(id);
      expect(stats).toEqual(getSummonStats(id));
      expect(stats).toMatchObject({
        life,
        lifeMax: life,
        mana: 0,
        manaMax: 0,
        attack,
        defense,
        attackSpeed,
        critChance: 0.05,
        critDamage: 1.5,
        physDodge,
        magicDodge,
        magicFind: 0,
        goldFind: 0
      });
      expect(stats?.resistances).toEqual({
        physical: 0,
        fire: id === 'solar_creeper' ? 20 : 0,
        lightning: id === 'solar_creeper' ? 20 : 0,
        cold: 0,
        arcane: 0,
        poison: id === 'poison_creeper' ? 35 : id === 'carrion_vine' ? 25 : 0
      });
    }
  );
  it.each(['unknown', 'constructor', '__proto__', 'skeleton', 'spirit_of_barbs'])(
    'does not claim foreign template %s',
    (id) => {
      expect(getDruidSummonStats(id)).toBeUndefined();
    }
  );
  it('deeply copies and freezes definitions without freezing the caller', () => {
    const input = structuredClone(authored),
      result = resolveDruidSummonDefinition(input);
    input.templates.raven.attack = 999;
    input.defaults.resistances.poison = 99;
    input.raven.physicalHitChancePenalty = 0.9;
    expect(result.templates.raven.attack).toBe(18);
    expect(result.defaults.resistances.poison).toBe(0);
    expect(result.raven.physicalHitChancePenalty).toBe(0.2);
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(result.templates.raven)).toBe(true);
    expect(Object.isFrozen(result.defaults.resistances)).toBe(true);
    expect(Object.isFrozen(result.raven)).toBe(true);
  });
  it.each([
    undefined,
    null,
    [],
    {},
    { ...authored, id: 'summons/foreign' },
    { ...authored, extra: true },
    { ...authored, templates: { ...authored.templates, skeleton: {} } },
    { ...authored, defaults: { ...authored.defaults, extra: 1 } },
    {
      ...authored,
      templates: { ...authored.templates, raven: { ...authored.templates.raven, attack: -1 } }
    },
    { ...authored, raven: { ...authored.raven, durationMs: 0 } },
    { ...authored, raven: { ...authored.raven, durationMs: 1.5 } },
    { ...authored, raven: { ...authored.raven, physicalHitChancePenalty: 1.1 } },
    { ...authored, raven: { ...authored.raven, physicalHitChancePenalty: Infinity } },
    { ...authored, poison: { dotPctOfDamage: 0 } },
    { ...authored, vines: { ...authored.vines, lifeFraction: NaN } },
    { ...authored, vines: { ...authored.vines, manaFraction: -0.1 } }
  ])('rejects malformed definitions %# without fallback tuning', (input) => {
    expect(() => resolveDruidSummonDefinition(input)).toThrow();
  });
  it.each([
    'raven',
    'poison_creeper',
    'spirit_wolf',
    'dire_wolf',
    'carrion_vine',
    'solar_creeper',
    'grizzly'
  ])('requires template %s', (id) => {
    const input = structuredClone(authored);
    Reflect.deleteProperty(input.templates, id);
    expect(() => resolveDruidSummonDefinition(input)).toThrow();
  });
});
