import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import { compileAuthoredValidator } from '../authored-validators';
import data from '../progression/merc-xp.json';
import { MERC_XP_POLICY } from './merc-xp';

const validate = compileAuthoredValidator(new Ajv2020({ strict: true, allErrors: true }), 'mercXp');

describe('authored mercenary XP policy', () => {
  it('loads the selected immutable policy through its registered schema', () => {
    expect(validate(data)).toBe(true);
    expect(MERC_XP_POLICY).toEqual({ id: 'progression/merc-xp-v1', basePerLevel: 60,
      earlyGrowthBase: 1.3, growthStartLevel: 18, growthExponent: 2.5 });
    expect(Object.isFrozen(MERC_XP_POLICY)).toBe(true);
  });

  it.each([
    { basePerLevel: 0 }, { basePerLevel: 101 }, { basePerLevel: 1.5 },
    { earlyGrowthBase: 0.9 }, { earlyGrowthBase: 1.31 }, { earlyGrowthBase: '1.3' },
    { growthStartLevel: 0 }, { growthStartLevel: 91 }, { growthStartLevel: 18.5 },
    { growthExponent: 0.5 }, { growthExponent: 4 }, { growthExponent: '2.5' },
    { id: 'other' }, { typo: 1 }
  ])('rejects invalid authored values: %j', patch => {
    expect(validate({ ...data, ...patch })).toBe(false);
  });

  it('rejects each missing required knob', () => {
    for (const key of Object.keys(data)) {
      const incomplete = Object.fromEntries(Object.entries(data).filter(([field]) => field !== key));
      expect(validate(incomplete), key).toBe(false);
    }
  });
});
