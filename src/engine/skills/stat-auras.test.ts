import { describe, expect, it } from 'vitest';
import paladinSkills from '../../data/skills/paladin.json';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { activeStatAura, composeStatAura, copyStatAuraProjection, isStatAuraId,
  resolveEligibleStatAuraRank, resolveStatAuraDefinitions, STAT_AURA_DEFINITIONS, STAT_AURA_IDS } from './stat-auras';
import type { CombatUnit } from '../combat/types';

describe('authored stat aura composition and authority', () => {
  it.each(STAT_AURA_IDS)('requires explicit eligible %s and resolves aliases without stacking', selectedAuraId => {
    const player = { ...createMockPlayer('Aura', 'paladin'), level: 30, selectedAuraId,
      skillLevels: { [selectedAuraId]: 1, [selectedAuraId.replace('paladin.', 'skills-paladin-')]: 2 } };
    const before = structuredClone(player), aura = composeStatAura(player, 'merc');
    expect(aura?.rank).toBe(2);
    expect(aura?.bonuses).toEqual(Object.fromEntries(Object.entries(STAT_AURA_DEFINITIONS[selectedAuraId].perRank)
      .map(([key, value]) => [key, value * 2])));
    expect(player).toEqual(before);
    expect(aura?.sourceHeroId).toBe(player.id);
    expect(aura?.fieldedMercCombatId).toBe('merc');
    const { selectedAuraId: _selected, ...unselected } = player;
    expect(composeStatAura(unselected)).toBeUndefined();
    expect(composeStatAura({ ...player, class: 'sorceress' })).toBeUndefined();
    expect(composeStatAura({ ...player, level: STAT_AURA_DEFINITIONS[selectedAuraId].requiredLevel - 1 })).toBeUndefined();
    const canonical = selectedAuraId.replace(/-/g, '_');
    expect(composeStatAura({ ...player, skillLevels: { [canonical]: 3 } })?.rank).toBe(3);
    expect(composeStatAura({ ...player, skillLevels: { ...player.skillLevels, [canonical]: 3 } })?.rank).toBe(3);
    expect(resolveEligibleStatAuraRank({ ...player, skillLevels: { [selectedAuraId]: 999 } }, selectedAuraId)).toBe(20);
    for (const rank of [0, -1, NaN, Infinity, 1.5]) {
      expect(composeStatAura({ ...player, skillLevels: { [selectedAuraId]: rank } })).toBeUndefined();
    }
  });
  it('copies authored tuning and rejects duplicate, missing or contradictory rows', () => {
    const rows = structuredClone(paladinSkills), definitions = resolveStatAuraDefinitions(rows);
    expect(definitions).toEqual(STAT_AURA_DEFINITIONS);
    const thorns = rows.find(row => row.id === 'skills-paladin-thorns');
    if (!thorns) throw new Error('Missing fixture row');
    expect(() => resolveStatAuraDefinitions([...rows, thorns])).toThrow('Invalid authored stat aura');
    expect(() => resolveStatAuraDefinitions(rows.filter(row => row !== thorns))).toThrow('Invalid authored stat aura');
    expect(() => resolveStatAuraDefinitions(rows.map(row => row === thorns
      ? { ...row, scaling: { passiveStatsPerLevel: { defensePct: 0.4 } } } : row))).toThrow('Invalid authored stat aura');
    const changed = rows.map(row => row === thorns ? { ...row, scaling: { passiveStatsPerLevel: { thornsPct: 0.125 } } } : row);
    expect(resolveStatAuraDefinitions(changed)['paladin.thorns'].perRank.thornsPct).toBe(0.125);
    expect(definitions['paladin.thorns'].perRank.thornsPct).toBe(0.04);
    expect(isStatAuraId('paladin.holy-fire')).toBe(false);
  });
  it('copies only valid selected potency without retaining a mutable bonus map', () => {
    const input = { selectedAuraId: 'paladin.thorns' as const, sourceHeroId: 'hero', rank: 2, maxRank: 20, bonuses: { thornsPct: 0.08 } };
    const copy = copyStatAuraProjection(input);
    input.bonuses.thornsPct = 9;
    expect(copy?.bonuses.thornsPct).toBe(0.08);
    for (const patch of [{ rank: 21 }, { rank: NaN }, { maxRank: Infinity }, { bonuses: { thornsPct: -1 } },
      { bonuses: { thornsPct: NaN } }, { bonuses: { thornsPct: 0.08, attackPct: 9 } }]) {
      expect(copyStatAuraProjection({ ...input, ...patch })).toBeUndefined();
    }
  });
  it('requires a living source and exact living hero/fielded merc, rejecting ownership forgeries', () => {
    // Only identity/life fields are consulted by this public boundary.
    const unit = (id: string, kind: CombatUnit['kind']): CombatUnit => ({ id, kind, side: 'player', life: 10 } as CombatUnit);
    const hero = unit('hero', 'hero'), merc = unit('merc', 'merc');
    const aura = copyStatAuraProjection({ selectedAuraId: 'paladin.thorns', sourceHeroId: 'hero',
      fieldedMercCombatId: 'merc', rank: 2, maxRank: 20, bonuses: { thornsPct: 0.08 } });
    const units = new Map([['hero', hero], ['merc', merc], ['bench', unit('bench', 'merc')]]);
    expect(activeStatAura(aura, 'hero', units)).toBe(aura);
    expect(activeStatAura(aura, 'merc', units)).toBe(aura);
    expect(activeStatAura(aura, 'bench', units)).toBeUndefined();
    for (const patch of [{ life: 0 }, { side: 'enemy' as const }, { kind: 'merc' as const }, { summon: true }, { ownerId: 'other' }]) {
      expect(activeStatAura(aura, 'merc', new Map([...units, ['hero', { ...hero, ...patch }]]))).toBeUndefined();
    }
    for (const patch of [{ life: 0 }, { kind: 'summon' as const }, { summonOwnerId: 'hero' }]) {
      expect(activeStatAura(aura, 'merc', new Map([...units, ['merc', { ...merc, ...patch }]]))).toBeUndefined();
    }
  });
});
