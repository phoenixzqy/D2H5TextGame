import { expect, it } from 'vitest';
import { GameDataValidationError, validateGameData } from '../loader';
import schema from '../schema/elite-config.schema.json';
import config from './elite-config.json';

const candidate = (lightningRetaliation: unknown) => ({ ...config, affixes: [
  { id: 'elite-affix/custom', nameKey: 'fixture.custom', skillId: 'monster-lightning', lightningRetaliation }
] });
it('validates the live Lightning reaction and legacy rows without reaction metadata', () => {
  expect(() => validateGameData(schema.$id, config)).not.toThrow();
  const legacy = { ...config, affixes: config.affixes.map(({ lightningRetaliation: _reaction, ...row }) => row) };
  expect(() => validateGameData(schema.$id, legacy)).not.toThrow();
});
it.each([null, {}, { chance: 0.25 }, { damage: [40, 60] }, { chance: -1, damage: [40, 60] },
  { chance: 2, damage: [40, 60] }, { chance: NaN, damage: [40, 60] },
  { chance: Infinity, damage: [40, 60] }, { chance: '0.25', damage: [40, 60] },
  { chance: 0.25, damage: [-1, 60] }, { chance: 0.25, damage: [40, Infinity] },
  { chance: 0.25, damage: [40] }, { chance: 0.25, damage: [40, 60, 80] },
  { chance: 0.25, damage: [40, 60], extra: true }
])('rejects invalid authored reaction %j', value => {
  expect(() => validateGameData(schema.$id, candidate(value))).toThrow(GameDataValidationError);
});
