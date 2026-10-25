import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../../data/schema/skill.schema.json';
import rows from '../../data/skills/paladin.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { composeStatAura, copyStatAuraProjection, resolveStatAuraDefinitions, type StatAuraProjection } from './stat-auras';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
const redemption = { intervalMs: 5000, life: 20, mana: 10 };
function row() {
  const result = rows.find(r => r.id === 'skills-paladin-redemption');
  if (!result) throw new Error('Missing Redemption'); return structuredClone(result);
}
function player() {
  return { ...createMockPlayer('Redemption', 'paladin'), level: 30, selectedAuraId: 'paladin.redemption' as const,
    skillLevels: { 'paladin.redemption': 2, 'skills-paladin-redemption': 1 } };
}
describe('Redemption authored corpse recovery authority', () => {
  it('copies eligible explicit selection and both rank coefficients without refilling or combining aliases', () => {
    const p = player(), before = structuredClone(p);
    expect(composeStatAura(p, 'merc')).toMatchObject({ selectedAuraId: 'paladin.redemption', sourceHeroId: p.id,
      fieldedMercCombatId: 'merc', rank: 2, bonuses: { lifeRegenPct: .04, manaRegenPct: .04 }, redemption });
    expect(p).toEqual(before);
    expect(composeStatAura({ ...p, level: 29 })).toBeUndefined();
    expect(composeStatAura({ ...p, class: 'sorceress' })).toBeUndefined();
    expect(composeStatAura({ ...p, skillLevels: {} })).toBeUndefined();
    expect(composeStatAura({ ...p, skillLevels: { 'paladin.redemption': 200 } })).toHaveProperty('rank', 20);
  });
  it('requires exact Redemption-only positive finite resource tuning and preserves distinct healing ownership', () => {
    const authored = { ...row(), redemption };
    expect(validate(authored)).toBe(true);
    expect(validate({ ...authored, redemption: undefined })).toBe(false);
    expect(validate({ ...authored, id: 'skills-paladin-might' })).toBe(false);
    expect(validate({ ...authored, auraHealing: { intervalMs: 5000, amount: 20 } })).toBe(false);
    for (const patch of [{ aura: false }, { trigger: 'active' }, { target: 'all-allies' }, { cooldown: 1 },
      { damage: { physical: 1 } }, { appliesStatus: ['poison'] }]) expect(validate({ ...authored, ...patch })).toBe(false);
    for (const invalid of [{ ...redemption, intervalMs: 999 }, { ...redemption, intervalMs: 60001 },
      { ...redemption, intervalMs: 5000.5 }, { ...redemption, life: 0 }, { ...redemption, mana: -1 },
      { ...redemption, life: NaN }, { ...redemption, mana: Infinity }, { ...redemption, extra: 1 },
      { intervalMs: 5000, life: 20 }, { intervalMs: 5000, mana: 10 }]) expect(validate({ ...authored, redemption: invalid })).toBe(false);
  });
  it('copies alternate authored resources and rejects invalid or foreign direct-engine tuning', () => {
    const changed = rows.map(r => r.id === 'skills-paladin-redemption'
      ? { ...r, redemption: { intervalMs: 1500, life: 37.5, mana: 12.5 } } : r);
    const before = structuredClone(changed), definitions = resolveStatAuraDefinitions(changed);
    expect(definitions).toHaveProperty(['paladin.redemption', 'redemption'], { intervalMs: 1500, life: 37.5, mana: 12.5 });
    expect(changed).toEqual(before);
    const projection = composeStatAura(player());
    expect(projection).toBeDefined(); if (!projection) throw new Error('Missing Redemption');
    const mutable = { ...projection, redemption: { ...redemption } }, copy = copyStatAuraProjection(mutable);
    mutable.redemption.life = 999; expect(copy).toHaveProperty('redemption', redemption);
    expect(Object.isFrozen(copy && 'redemption' in copy ? copy.redemption : undefined)).toBe(true);
    for (const tuning of [undefined, { ...redemption, life: 0 }, { ...redemption, mana: NaN },
      { ...redemption, intervalMs: 0 }, { ...redemption, extra: 1 }]) {
      expect(copyStatAuraProjection({ ...projection, redemption: tuning } as StatAuraProjection)).toBeUndefined();
    }
    expect(copyStatAuraProjection({ ...mutable, selectedAuraId: 'paladin.thorns', bonuses: { thornsPct: .04 } })).toBeUndefined();
  });
});
