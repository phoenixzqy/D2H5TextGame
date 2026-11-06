import { expect, it } from 'vitest';
import { GameDataValidationError, validateGameData } from '../loader';
import schema from '../schema/elite-config.schema.json';
import config from './elite-config.json';

const candidate = (resistanceBonuses: unknown) => ({ ...config, affixes: [
  { id: 'elite-affix/custom', nameKey: 'fixture.custom', skillId: 'monster-frost-nova', resistanceBonuses }
] });

it('validates actual Cold, Lightning and Fire Enchanted resistance metadata', () => {
  expect(() => validateGameData(schema.$id, config)).not.toThrow();
  expect(config.affixes.filter(affix => affix.resistanceBonuses !== undefined)).toEqual([
    { id: 'elite-affix/cold-enchanted', nameKey: 'combat.eliteAffix.coldEnchanted',
      skillId: 'monster-frost-nova', resistanceBonuses: { cold: 50 },
      frostAura: { damage: 15, intervalMs: 5000, chillDurationMs: 2000 } },
    { id: 'elite-affix/lightning-enchanted', nameKey: 'combat.eliteAffix.lightningEnchanted',
      skillId: 'monster-lightning', resistanceBonuses: { lightning: 50 },
      lightningRetaliation: { chance: 0.25, damage: [40, 60] } },
    { id: 'elite-affix/fire-enchanted', nameKey: 'combat.eliteAffix.fireEnchanted',
      skillId: 'monster-fire-enchanted-explosion', resistanceBonuses: { fire: 50 } }
  ]);
});

it.each([{}, { cold: 0 }, { fire: 12.5, cold: 50, lightning: 100, poison: 1, arcane: 2, physical: 3 }])(
  'accepts sparse finite percentage bonuses %j', bonuses => {
    expect(() => validateGameData(schema.$id, candidate(bonuses))).not.toThrow();
  }
);

it.each([
  { cold: NaN }, { cold: Infinity }, { cold: -1 }, { cold: 101 },
  { cold: '50' }, { cold: null }, { unknown: 50 }, { thorns: 50 }, null, [], 50
])('rejects invalid authored resistance metadata %j', bonuses => {
  expect(() => validateGameData(schema.$id, candidate(bonuses))).toThrow(GameDataValidationError);
});
