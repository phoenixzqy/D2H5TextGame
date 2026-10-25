import { describe, expect, it } from 'vitest';
import paladinSkills from '../../data/skills/paladin.json';
import skillSchema from '../../data/schema/skill.schema.json';
import { GameDataValidationError, validateGameData } from '../../data/loader';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { composeStatAura, copyStatAuraProjection, resolveStatAuraDefinitions } from './stat-auras';

const row = paladinSkills.find(skill => skill.id === 'skills-paladin-sanctuary');
if (!row) throw new Error('Missing authored Sanctuary');
const tuning = { intervalMs: 2000, damage: 20, repulseDurationMs: 500 };
const player = { ...createMockPlayer('Sanctuary', 'paladin'), level: 24,
  selectedAuraId: 'paladin.sanctuary' as const, skillLevels: { 'paladin.sanctuary': 2 } };

describe('selected Sanctuary exact authored tuning', () => {
  it('captures unchanged arcane scaling with copied frozen undead pulse/control tuning', () => {
    const before = structuredClone(player), projection = composeStatAura(player, 'merc');
    expect(projection).toMatchObject({ selectedAuraId: 'paladin.sanctuary', rank: 2,
      maxRank: 20, bonuses: { arcaneDamagePct: .06 }, sanctuary: tuning });
    expect(player).toEqual(before);
    expect(Object.isFrozen(projection?.sanctuary)).toBe(true);
    expect(composeStatAura({ ...player, level: 23 })).toBeUndefined();
    expect(composeStatAura({ ...player, class: 'sorceress' })).toBeUndefined();
    expect(composeStatAura({ ...player, skillLevels: {} })).toBeUndefined();
    expect(composeStatAura({ ...player, skillLevels: { 'skills-paladin-sanctuary': 999 } })).toHaveProperty('rank', 20);
    expect(copyStatAuraProjection(projection)).toEqual(projection);
  });
  it('accepts only exact passive/self Sanctuary metadata and keeps existing pulse owners closed', () => {
    expect(() => validateGameData(skillSchema.$id, { ...row, sanctuary: tuning })).not.toThrow();
    for (const patch of [{ id: 'skills-paladin-holy-fire' }, { id: 'skills-paladin-thorns' },
      { trigger: 'active' }, { target: 'all-enemies' }, { cooldown: 1 }, { aura: false },
      { auraPulse: { intervalMs: 2000, damage: 20, damageType: 'arcane' } }]) {
      expect(() => validateGameData(skillSchema.$id, { ...row, sanctuary: tuning, ...patch })).toThrow(GameDataValidationError);
    }
  });
  it('requires each finite tuning field and rejects extra or malformed fields at the schema and direct boundary', () => {
    const invalid: unknown[] = [undefined, null, {}, [],
      { ...tuning, intervalMs: 999 }, { ...tuning, intervalMs: 60001 }, { ...tuning, intervalMs: 2000.5 },
      { ...tuning, damage: 0 }, { ...tuning, damage: NaN }, { ...tuning, damage: Infinity },
      { ...tuning, repulseDurationMs: 0 }, { ...tuning, repulseDurationMs: 60001 },
      { ...tuning, repulseDurationMs: .5 }, { ...tuning, burn: {} }];
    const good = composeStatAura(player);
    for (const sanctuary of invalid) {
      expect(() => validateGameData(skillSchema.$id, { ...row, sanctuary })).toThrow(GameDataValidationError);
      expect(copyStatAuraProjection({ ...good, sanctuary } as typeof good)).toBeUndefined();
    }
    for (const field of Object.keys(tuning)) {
      const incomplete = { ...tuning }; Reflect.deleteProperty(incomplete, field);
      expect(() => validateGameData(skillSchema.$id, { ...row, sanctuary: incomplete })).toThrow(GameDataValidationError);
    }
  });
  it('copies altered authored tuning without retaining a mutable input reference', () => {
    const changed = { intervalMs: 3000, damage: 40, repulseDurationMs: 700 };
    const rows = paladinSkills.map(skill => skill.id === row.id ? { ...skill, sanctuary: changed } : skill);
    const definitions = resolveStatAuraDefinitions(rows);
    expect(definitions['paladin.sanctuary']).toHaveProperty('sanctuary', changed);
    changed.damage = 900;
    expect(definitions['paladin.sanctuary']).toHaveProperty('sanctuary.damage', 40);
  });
});
