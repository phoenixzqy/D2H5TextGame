import { describe, expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import enCombat from '../../i18n/locales/en/combat.json';
import zhCombat from '../../i18n/locales/zh-CN/combat.json';
import enSkills from '../../i18n/locales/en/skills.json';
import zhSkills from '../../i18n/locales/zh-CN/skills.json';
import { FIRE_ENCHANTED_EXPLOSION_SKILL, MONSTER_DEATH_EXPLOSION_SKILL,
  resolveFireEnchantedExplosion, resolveMonsterDeathExplosion } from './monster-death-explosion';

const row = rows.find(row => row.id === 'monster-corpse-explosion');
if (!row) throw new Error('Missing authored death explosion');

describe('authored Doll death payload', () => {
  it('detaches and freezes native tuning from the JSON source', () => {
    const source = structuredClone(row), before = structuredClone(source);
    const native = resolveMonsterDeathExplosion([source]);
    expect(source).toEqual(before);
    expect(native).toEqual(MONSTER_DEATH_EXPLOSION_SKILL);
    expect(Object.isFrozen(native)).toBe(true);
    expect(Object.isFrozen(native.effects)).toBe(true);
    const effect = native.effects[0];
    expect(Object.isFrozen(effect)).toBe(true);
    if (!effect || effect.kind !== 'damage') throw new Error('Missing native damage');
    expect(Object.isFrozen(effect.base)).toBe(true);
    expect(Object.isFrozen(effect.components)).toBe(true);
    expect(effect).toEqual({ kind: 'damage', damageType: 'fire', base: [35, 60],
      components: [{ damageType: 'physical', weight: 30 }, { damageType: 'fire', weight: 30 }] });
  });
  it.each([[], [row, row], [null], [{ ...row, trigger: 'active' }], [{ ...row, cooldown: 3 }],
    [{ ...row, cost: { mana: 1 } }], [{ ...row, cost: { mana: 0, life: 1 } }],
    [{ ...row, attackDamagePct: 100 }], [{ ...row, damage: { min: 40, max: 60, breakdown: { fire: 60 } } }],
    [{ ...row, appliesStatus: ['ignite'] }]].map(candidate => ({ candidate })))('rejects unreviewed authored semantics %#', ({ candidate }) => {
    expect(() => resolveMonsterDeathExplosion(candidate)).toThrow('Invalid authored monster death explosion');
  });
});

describe('authored Fire Enchanted death payload', () => {
  const fire = rows.find(row => row.id === 'monster-fire-enchanted-explosion');
  if (!fire) throw new Error('Missing Fire Enchanted death payload');

  it('detaches and freezes a pure fire payload with no active cast, status or corpse cost', () => {
    const source = structuredClone(fire), before = structuredClone(source);
    const native = resolveFireEnchantedExplosion([source]);
    expect(source).toEqual(before);
    expect(native).toEqual(FIRE_ENCHANTED_EXPLOSION_SKILL);
    expect(native).toEqual({ id: 'monster.fire_enchanted_explosion', archetype: 'monster', trigger: 'on-death',
      target: 'all-enemies', cooldown: 0, manaCost: 0, minLevel: 1,
      effects: [{ kind: 'damage', damageType: 'fire', base: [50, 50] }] });
    expect(Object.isFrozen(native)).toBe(true);
    expect(Object.isFrozen(native.effects)).toBe(true);
    const effect = native.effects[0];
    if (!effect || effect.kind !== 'damage') throw new Error('Missing fire damage');
    expect(Object.isFrozen(effect)).toBe(true);
    expect(Object.isFrozen(effect.base)).toBe(true);
    if (!source.damage) throw new Error('Missing authored damage');
    source.damage.min = 999;
    expect(effect.base).toEqual([50, 50]);
  });

  it.each([[], [fire, fire], [null], [{ ...fire, trigger: 'active' }], [{ ...fire, target: 'single-enemy' }],
    [{ ...fire, cooldown: 1 }], [{ ...fire, cost: { mana: 1 } }], [{ ...fire, cost: { mana: 0, life: 1 } }],
    [{ ...fire, damage: { min: 35, max: 60, breakdown: { fire: 50 } } }],
    [{ ...fire, damage: { min: 50, max: 50, breakdown: { physical: 25, fire: 25 } } }],
    [{ ...fire, damage: { min: NaN, max: 50, breakdown: { fire: 50 } } }],
    [{ ...fire, damageType: 'physical' }], [{ ...fire, attackDamagePct: 100 }],
    [{ ...fire, appliesStatus: ['ignite'] }], [{ ...fire, unexpected: true }]
  ].map(candidate => ({ candidate })))('rejects altered authored fire semantics %#', ({ candidate }) => {
    expect(() => resolveFireEnchantedExplosion(candidate)).toThrow('Invalid authored Fire Enchanted explosion');
  });

  it('provides both affix and death skill labels/descriptions in both shipped locales', () => {
    expect(enCombat.eliteAffix.fireEnchanted).toBe('Fire Enchanted');
    expect(zhCombat.eliteAffix.fireEnchanted).toBe('火焰强化');
    for (const locale of [enSkills, zhSkills]) {
      expect(locale.monster['fire-enchanted-explosion'].name.length).toBeGreaterThan(0);
      expect(locale.monster['fire-enchanted-explosion'].desc).toContain('50');
    }
  });
});
