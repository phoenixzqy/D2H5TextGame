import { describe, expect, it } from 'vitest';
import paladinSkills from '../../data/skills/paladin.json';
import skillSchema from '../../data/schema/skill.schema.json';
import { GameDataValidationError, validateGameData } from '../../data/loader';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { composeStatAura, copyStatAuraProjection, resolveStatAuraDefinitions } from './stat-auras';

const row = paladinSkills.find(skill => skill.id === 'skills-paladin-concentration');
const thorns = paladinSkills.find(skill => skill.id === 'skills-paladin-thorns');
if (!row || !thorns) throw new Error('Missing authored Concentration or Thorns');
const player = { ...createMockPlayer('Concentration', 'paladin'), level: 18,
  selectedAuraId: 'paladin.concentration' as const, skillLevels: { 'paladin.concentration': 2 } };

describe('selected Concentration exact authored interruption contract', () => {
  it('copies authored physical scaling and immutable Stun protection with ordinary rank eligibility', () => {
    const before = structuredClone(player), projection = composeStatAura(player, 'merc');
    expect(projection).toMatchObject({ selectedAuraId: 'paladin.concentration', rank: 2, maxRank: 20,
      bonuses: { physicalDamagePct: .07 }, preventStunInterruption: true });
    expect(player).toEqual(before); expect(Object.isFrozen(projection)).toBe(true);
    expect(copyStatAuraProjection(projection)).toEqual(projection);
    expect(composeStatAura({ ...player, level: 17 })).toBeUndefined();
    expect(composeStatAura({ ...player, class: 'sorceress' })).toBeUndefined();
    expect(composeStatAura({ ...player, skillLevels: {} })).toBeUndefined();
    expect(composeStatAura({ ...player, skillLevels: { 'skills-paladin-concentration': 999 } })).toHaveProperty('rank', 20);
  });
  it('accepts only exact Concentration-only passive/self metadata', () => {
    expect(() => validateGameData(skillSchema.$id, { ...row, concentration: { preventStunInterruption: true } })).not.toThrow();
    for (const concentration of [undefined, null, {}, [], { preventStunInterruption: false },
      { preventStunInterruption: 1 }, { preventStunInterruption: 'true' }, { preventStunInterruption: true, chance: .8 }]) {
      expect(() => validateGameData(skillSchema.$id, { ...row, concentration })).toThrow(GameDataValidationError);
    }
    for (const patch of [{ trigger: 'active' }, { aura: false }, { target: 'all-enemies' }, { cooldown: 1 },
      { damage: { type: 'physical', min: 1, max: 1 } }, { appliesStatus: ['stun'] }]) {
      expect(() => validateGameData(skillSchema.$id, { ...row, concentration: { preventStunInterruption: true }, ...patch })).toThrow(GameDataValidationError);
    }
    expect(() => validateGameData(skillSchema.$id, { ...thorns, concentration: { preventStunInterruption: true } })).toThrow(GameDataValidationError);
  });
  it('rejects absent/false/malformed/foreign primitive protection without granting a physical-only aura', () => {
    const good = composeStatAura(player);
    for (const preventStunInterruption of [undefined, false, 1, 'true', null]) {
      expect(copyStatAuraProjection({ ...good, preventStunInterruption } as unknown as typeof good)).toBeUndefined();
    }
    const ordinary = composeStatAura({ ...player, selectedAuraId: 'paladin.thorns', skillLevels: { 'paladin.thorns': 1 } });
    expect(copyStatAuraProjection({ ...ordinary, preventStunInterruption: true } as unknown as typeof ordinary)).toBeUndefined();
  });
  it('copies its primitive flag without retaining authored mutable metadata', () => {
    const concentration = { preventStunInterruption: true };
    const rows = paladinSkills.map(skill => skill.id === row.id ? { ...skill, concentration } : skill);
    const definitions = resolveStatAuraDefinitions(rows);
    expect(Reflect.get(definitions, 'paladin.concentration')).toHaveProperty('preventStunInterruption', true);
    Reflect.set(concentration, 'preventStunInterruption', false);
    expect(Reflect.get(definitions, 'paladin.concentration')).toHaveProperty('preventStunInterruption', true);
  });
});
