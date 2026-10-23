import { describe, expect, it } from 'vitest';
import type { Mercenary } from '../types/entities';
import { growMercenary, repairMercenaryGrowth } from './merc-growth';
import { deriveStats } from './stats';

function merc(dexterity = 199, energy = 199): Mercenary {
  const coreStats = { strength: 10, dexterity, vitality: 16, energy };
  return { id: 'custom/growth', name: 'Growth fixture', type: 'mercenary',
    team: 'player', level: 3, coreStats,
    derivedStats: { ...deriveStats(coreStats, 3), life: 17, mana: 23, magicResist: 17 },
    statusEffects: [], cooldowns: [], skills: [], comboOrder: [], alive: true,
    turnOrder: 0, archetype: 'back', rarity: 'R', classId: 'rogue', equipment: [] };
}

describe('bare mercenary level transition boundaries', () => {
  it.each([
    [199, 202, 301, 116, 362, 0.452],
    [499, 502, 450, 191, 587, 0.75],
    [501, 504, 450, 191, 587, 0.75]
  ])('grows raw Dex %d across caps with shared rounding', (dex, coreDex, speed, attack, manaMax, dodge) => {
    const before = merc(dex, dex);
    const snapshot = structuredClone(before);
    const after = growMercenary(before, 1);
    expect(after.coreStats.dexterity).toBe(coreDex);
    expect(after.derivedStats).toMatchObject({ attackSpeed: speed, attack,
      manaMax, mana: 23, life: 25, lifeMax: 156, magicResist: 17 });
    expect(after.derivedStats.physDodge).toBeCloseTo(dodge, 12);
    expect(before).toEqual(snapshot);
  });

  it('retains exact zero-delta cached values beyond the effective dexterity cap', () => {
    const source = merc(501);
    const before = { ...source, derivedStats: { ...source.derivedStats, attackSpeed: 777.25, physDodge: -0 } };
    const after = growMercenary(before, 1);
    expect(after.coreStats.dexterity).toBe(504);
    expect(after.derivedStats.attackSpeed).toBe(777.25);
    expect(Object.is(after.derivedStats.physDodge, -0)).toBe(true);
    expect(after.derivedStats.attack).toBe(before.derivedStats.attack + 2);
  });

  it('retains identity on no-op growth and unrecognized historical repair', () => {
    const before = merc();
    expect(growMercenary(before, 0)).toBe(before);
    expect(repairMercenaryGrowth(before)).toBe(before);
  });

  it.each([-1, 0.5, NaN, Infinity])('refuses invalid level gains %s without mutation', levels => {
    const before = merc();
    const snapshot = structuredClone(before);
    expect(() => growMercenary(before, levels)).toThrow('Invalid mercenary level gain');
    expect(before).toEqual(snapshot);
  });

  it('rejects overflow, nonfinite core and nonfinite resistance output', () => {
    const before = merc();
    const overflow = { ...before, level: Number.MAX_VALUE };
    const cases: Mercenary[] = [
      { ...before, coreStats: { ...before.coreStats, dexterity: Infinity } },
      { ...before, derivedStats: { ...before.derivedStats,
        resistances: { ...before.derivedStats.resistances, cold: NaN } } }
    ];
    expect(() => growMercenary(overflow, Number.MAX_VALUE)).toThrow('nonfinite');
    for (const source of cases) {
      expect(() => growMercenary(source, 1)).toThrow('nonfinite');
    }
  });
});
