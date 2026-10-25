import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../../data/schema/skill.schema.json';
import rows from '../../data/skills/paladin.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { composeStatAura, copyStatAuraProjection, resolveStatAuraDefinitions } from './stat-auras';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
const cleansing = { durationMultiplier: .5, healing: { intervalMs: 5000, amount: 20 } };
function row() {
  const result = rows.find(r => r.id === 'skills-paladin-cleansing');
  if (!result) throw new Error('Missing Cleansing'); return structuredClone(result);
}
function player() {
  return { ...createMockPlayer('Cleansing', 'paladin'), level: 12, selectedAuraId: 'paladin.cleansing' as const,
    skillLevels: { 'paladin.cleansing': 2, 'skills-paladin-cleansing': 1 } };
}
describe('Cleansing authored duration and recovery authority', () => {
  it('copies eligible selection, authored recovery and dodge by capped maximum rank without refilling', () => {
    const p = player(), before = structuredClone(p), projection = composeStatAura(p, 'merc');
    expect(projection).toMatchObject({ selectedAuraId: 'paladin.cleansing', rank: 2, sourceHeroId: p.id,
      fieldedMercCombatId: 'merc', cleansingDurationMultiplier: .5,
      bonuses: { lifeRegenPct: .03, magicDodgePct: .01 }, healing: cleansing.healing });
    expect(p).toEqual(before);
    expect(composeStatAura({ ...p, level: 11 })).toBeUndefined();
    expect(composeStatAura({ ...p, class: 'sorceress' })).toBeUndefined();
    expect(composeStatAura({ ...p, skillLevels: {} })).toBeUndefined();
    const { selectedAuraId: _selection, ...unselected } = p;
    expect(composeStatAura(unselected)).toBeUndefined();
    expect(composeStatAura({ ...p, skillLevels: { 'paladin.cleansing': 200 } })).toHaveProperty('rank', 20);
  });
  it('requires exact Cleansing-only finite tuning and preserves Prayer-only top-level healing ownership', () => {
    const authored = { ...row(), cleansing };
    expect(validate(authored)).toBe(true);
    expect(validate({ ...authored, cleansing: undefined })).toBe(false);
    expect(validate({ ...authored, id: 'skills-paladin-might' })).toBe(false);
    expect(validate({ ...authored, auraHealing: cleansing.healing })).toBe(false);
    for (const patch of [{ aura: false }, { trigger: 'active' }, { target: 'all-allies' }, { cooldown: 1 },
      { damage: { physical: 1 } }, { appliesStatus: ['poison'] }]) expect(validate({ ...authored, ...patch })).toBe(false);
    for (const invalid of [{ ...cleansing, durationMultiplier: 0 }, { ...cleansing, durationMultiplier: 1 },
      { ...cleansing, durationMultiplier: NaN }, { ...cleansing, durationMultiplier: Infinity },
      { ...cleansing, extra: 1 }, { durationMultiplier: .5 }, { healing: cleansing.healing },
      { ...cleansing, healing: { intervalMs: 999, amount: 20 } },
      { ...cleansing, healing: { intervalMs: 5000, amount: 0 } },
      { ...cleansing, healing: { intervalMs: 5000, amount: NaN } }]) expect(validate({ ...authored, cleansing: invalid })).toBe(false);
  });
  it('copies alternate authored tuning independently and rejects malformed direct inputs', () => {
    const changed = rows.map(r => r.id === 'skills-paladin-cleansing'
      ? { ...r, cleansing: { durationMultiplier: .25, healing: { intervalMs: 1500, amount: 37.5 } } } : r);
    const before = structuredClone(changed), definitions = resolveStatAuraDefinitions(changed);
    expect(definitions).toHaveProperty(['paladin.cleansing', 'cleansingDurationMultiplier'], .25);
    expect(definitions).toHaveProperty(['paladin.cleansing', 'healing'], { intervalMs: 1500, amount: 37.5 });
    expect(changed).toEqual(before);
    const projection = composeStatAura(player());
    expect(projection).toBeDefined(); if (!projection) throw new Error('Missing Cleansing');
    const mutable = { ...projection, healing: { ...cleansing.healing } }, copy = copyStatAuraProjection(mutable);
    mutable.healing.amount = 999;
    expect(copy).toHaveProperty('healing', cleansing.healing); expect(Object.isFrozen(copy?.healing)).toBe(true);
    for (const multiplier of [0, 1, -1, NaN, Infinity]) {
      expect(copyStatAuraProjection({ ...projection, cleansingDurationMultiplier: multiplier })).toBeUndefined();
    }
    const { healing: _healing, ...noHealing } = projection;
    const { cleansingDurationMultiplier: _multiplier, ...noMultiplier } = projection;
    expect(copyStatAuraProjection(noHealing)).toBeUndefined();
    expect(copyStatAuraProjection(noMultiplier)).toBeUndefined();
    expect(copyStatAuraProjection({ ...projection, selectedAuraId: 'paladin.prayer', bonuses: { lifeRegenPct: .03 } })).toBeUndefined();
  });
});
