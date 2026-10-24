import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../../data/schema/skill.schema.json';
import rows from '../../data/skills/paladin.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { composeStatAura, copyStatAuraProjection, resolveStatAuraDefinitions } from './stat-auras';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
const tuning = { intervalMs: 1000, damage: 20, damageType: 'fire' as const,
  burn: { durationMs: 3000, dotPctOfDamage: .1 } };
function fire() {
  const row = rows.find(r => r.id === 'skills-paladin-holy-fire');
  if (!row) throw new Error('Missing Holy Fire'); return structuredClone(row);
}
describe('authored player pulse aura boundaries', () => {
  it.each(['paladin.holy-fire', 'paladin.holy-shock'] as const)('copies eligible %s rank and nested JSON tuning without mutating the player', selectedAuraId => {
    const player = { ...createMockPlayer('Pulse', 'paladin'), level: 30, selectedAuraId,
      skillLevels: { [selectedAuraId.replace(/-/g, '_')]: 20 } };
    const before = structuredClone(player), aura = composeStatAura(player, 'merc');
    expect(aura).toMatchObject({ selectedAuraId, rank: 20, sourceHeroId: player.id, fieldedMercCombatId: 'merc',
      pulse: { intervalMs: 1000, damage: 20, damageType: selectedAuraId === 'paladin.holy-fire' ? 'fire' : 'lightning' } });
    expect(player).toEqual(before);
    expect(composeStatAura({ ...player, class: 'sorceress' })).toBeUndefined();
    expect(composeStatAura({ ...player, level: selectedAuraId === 'paladin.holy-fire' ? 5 : 23 })).toBeUndefined();
    const { selectedAuraId: _selected, ...none } = player;
    expect(composeStatAura(none)).toBeUndefined();
  });
  it('requires exact ownership, element and finite bounded JSON pulse data', () => {
    const row = { ...fire(), auraPulse: tuning };
    expect(validate(row)).toBe(true);
    expect(validate({ ...row, auraPulse: undefined })).toBe(false);
    expect(validate({ ...row, id: 'skills-paladin-might' })).toBe(false);
    for (const pulse of [{ ...tuning, intervalMs: 999 }, { ...tuning, intervalMs: 1000.5 },
      { ...tuning, intervalMs: 60001 }, { ...tuning, damage: 0 }, { ...tuning, damage: NaN },
      { ...tuning, damage: Infinity }, { ...tuning, damageType: 'lightning' }, { ...tuning, extra: 1 },
      { ...tuning, burn: undefined }, { ...tuning, burn: { durationMs: -1, dotPctOfDamage: .1 } },
      { ...tuning, burn: { durationMs: 3000, dotPctOfDamage: 2 } },
      { ...tuning, burn: { durationMs: 3000, dotPctOfDamage: NaN } }]) {
      expect(validate({ ...row, auraPulse: pulse })).toBe(false);
    }
  });
  it('copies alternate JSON coefficients without retaining nested caller references', () => {
    const changed = rows.map(row => row.id === 'skills-paladin-holy-fire' ? { ...row,
      auraPulse: { ...tuning, intervalMs: 1500, damage: 37.5, burn: { durationMs: 2000, dotPctOfDamage: .2 } } } : row);
    const before = structuredClone(changed), defs = resolveStatAuraDefinitions(changed);
    expect(defs).toHaveProperty(['paladin.holy-fire', 'pulse', 'damage'], 37.5);
    expect(changed).toEqual(before);
    const input = { selectedAuraId: 'paladin.holy-fire' as const, sourceHeroId: 'hero', rank: 1, maxRank: 20,
      bonuses: { fireDamagePct: .03 }, pulse: structuredClone(tuning) };
    const copied = copyStatAuraProjection(input);
    input.pulse.damage = 80; input.pulse.burn.dotPctOfDamage = .8;
    expect(copied).toHaveProperty(['pulse', 'damage'], 20);
    expect(copied).toHaveProperty(['pulse', 'burn', 'dotPctOfDamage'], .1);
    expect(Object.isFrozen(copied?.pulse)).toBe(true);
    expect(Object.isFrozen(copied?.pulse?.burn)).toBe(true);
    expect(copyStatAuraProjection({ ...input, selectedAuraId: 'paladin.thorns', bonuses: { thornsPct: .04 } })).toBeUndefined();
  });
});
