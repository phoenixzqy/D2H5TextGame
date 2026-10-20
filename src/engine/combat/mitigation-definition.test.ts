import { describe, expect, it } from 'vitest';
import source from '../../data/combat/mitigation.json';
import { MITIGATION_DEFINITION, resolveMitigationDefinition } from './mitigation-definition';

describe('authored independent mitigation policy', () => {
  it('validates and defensively copies every default and tier without mutating input', () => {
    const input = structuredClone(source);
    const result = resolveMitigationDefinition(input);
    expect(result).toEqual({ id: 'combat/mitigation', friendlyBase: { player: 0, mercenary: 0, summon: 0 },
      monster: { base: 0, growthPerLevel: 1, tierMultipliers: { trash: 1, elite: 1.5, champion: 2,
        'rare-elite': 1.5, 'rare-minion': 1, boss: 3, 'chapter-boss': 3 } } });
    input.friendlyBase.player = 9;
    input.monster.tierMultipliers.boss = 8;
    expect(result).toEqual(MITIGATION_DEFINITION);
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(result.monster.tierMultipliers)).toBe(true);
  });

  it('rejects missing, malformed, unknown and nonfinite configuration', () => {
    const bad = [null, {}, { ...source, unexpected: 1 },
      { ...source, friendlyBase: { ...source.friendlyBase, player: -1 } },
      { ...source, monster: { ...source.monster, growthPerLevel: Infinity } },
      { ...source, monster: { ...source.monster, base: '0' } },
      { ...source, monster: { ...source.monster, tierMultipliers: { ...source.monster.tierMultipliers, boss: null } } },
      { ...source, monster: { ...source.monster, tierMultipliers: { trash: 1 } } }];
    for (const input of bad) expect(() => resolveMitigationDefinition(input)).toThrow('Invalid combat mitigation definition');
  });
});
