import { describe, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { composeStatAura, copyStatAuraProjection } from './stat-auras';

describe('Vigor authored selection authority', () => {
  it('captures unchanged endurance/cadence coefficients once, caps ranks and requires explicit eligible selection', () => {
    const player = { ...createMockPlayer('Vigor', 'paladin'), level: 18, selectedAuraId: 'paladin.vigor' as const,
      skillLevels: { 'paladin.vigor': 2, 'skills-paladin-vigor': 1 } };
    const before = structuredClone(player), p = composeStatAura(player, 'merc');
    expect(p).toMatchObject({ rank: 2, maxRank: 20, bonuses: { lifePct: .04, attackSpeedPct: .01 } });
    expect(player).toEqual(before); expect(Object.isFrozen(p?.bonuses)).toBe(true);
    expect(composeStatAura({ ...player, level: 17 })).toBeUndefined();
    expect(composeStatAura({ ...player, class: 'sorceress' })).toBeUndefined();
    expect(composeStatAura({ ...player, skillLevels: {} })).toBeUndefined();
    const { selectedAuraId: _selection, ...none } = player;
    expect(composeStatAura(none)).toBeUndefined();
    expect(composeStatAura({ ...player, skillLevels: { 'paladin.vigor': 200 } })).toHaveProperty('rank', 20);
    expect(copyStatAuraProjection(p)).toEqual(p);
  });
});
