import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../../data/schema/skill.schema.json';
import rows from '../../data/skills/paladin.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { composeStatAura, resolveStatAuraDefinitions, activeStatAura } from './stat-auras';
import type { CombatUnit } from '../combat/types';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
function conviction() {
  const row = rows.find(row => row.id === 'skills-paladin-conviction');
  if (!row) throw new Error('Missing authored Conviction'); return structuredClone(row);
}
describe('player enemy aura authored boundaries', () => {
  it.each(['paladin.holy-freeze', 'paladin.conviction'] as const)('composes actual allocated canonical %s only when selected/eligible', selectedAuraId => {
    const player = { ...createMockPlayer('EnemyAura', 'paladin'), level: 30, selectedAuraId,
      skillLevels: { [selectedAuraId.replace(/-/g, '_')]: 20 } };
    const before = structuredClone(player), aura = composeStatAura(player, 'merc');
    expect(aura).toMatchObject({ selectedAuraId, rank: 20, sourceHeroId: player.id, fieldedMercCombatId: 'merc' });
    expect(player).toEqual(before);
    expect(composeStatAura({ ...player, class: 'sorceress' })).toBeUndefined();
    expect(composeStatAura({ ...player, level: selectedAuraId === 'paladin.conviction' ? 29 : 17 })).toBeUndefined();
    const { selectedAuraId: _selected, ...unselected } = player;
    expect(composeStatAura(unselected)).toBeUndefined();
    if (selectedAuraId === 'paladin.conviction') expect(aura).toHaveProperty('enemyResistReductionPct', 25);
    const hero = { id: player.id, kind: 'hero', side: 'player', life: 1 } as CombatUnit;
    for (const patch of [{ life: 0 }, { side: 'enemy' as const }, { kind: 'merc' as const }, { summon: true }, { ownerId: 'other' }]) {
      expect(activeStatAura(aura, player.id, new Map([[player.id, { ...hero, ...patch }]]))).toBeUndefined();
    }
  });
  it('requires explicit finite JSON Conviction reduction and rejects that metadata on other identities', () => {
    const row = { ...conviction(), conviction: { enemyResistReductionPct: 25 } };
    expect(validate(row)).toBe(true);
    expect(validate({ ...row, conviction: undefined })).toBe(false);
    for (const value of [-1, 101, NaN, Infinity, '25', null]) {
      expect(validate({ ...row, conviction: { enemyResistReductionPct: value } })).toBe(false);
    }
    expect(validate({ ...row, conviction: { enemyResistReductionPct: 25, other: 1 } })).toBe(false);
    expect(validate({ ...row, id: 'skills-paladin-might' })).toBe(false);
  });
  it('copies alternate JSON tuning without mutating input', () => {
    const changed = rows.map(row => row.id === 'skills-paladin-conviction'
      ? { ...row, conviction: { enemyResistReductionPct: 12.5 } } : structuredClone(row));
    const before = structuredClone(changed);
    expect(resolveStatAuraDefinitions(changed)).toHaveProperty(['paladin.conviction', 'enemyResistReductionPct'], 12.5);
    expect(changed).toEqual(before);
  });
});
