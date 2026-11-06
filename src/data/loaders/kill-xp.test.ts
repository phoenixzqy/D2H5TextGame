import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import { compileAuthoredValidator } from '../authored-validators';
import data from '../progression/kill-xp.json';
import { KILL_XP_POLICY } from './kill-xp';

const validate = compileAuthoredValidator(new Ajv2020({ strict: true, allErrors: true }), 'killXp');

describe('authored kill XP policy boundary', () => {
  it('loads the selected immutable knobs through the registered validator', () => {
    expect(validate(data)).toBe(true);
    expect(KILL_XP_POLICY).toEqual({ id: 'progression/kill-xp-v1', basePerLevel: 10,
      minimumReward: 5, growthStartLevel: 18, growthExponent: 1.5 });
    expect(Object.isFrozen(KILL_XP_POLICY)).toBe(true);
  });

  it.each([
    { basePerLevel: 0 }, { minimumReward: 0 }, { minimumReward: 1.5 },
    { growthStartLevel: 0 }, { growthStartLevel: 91 }, { growthStartLevel: 18.5 },
    { growthExponent: -1 }, { growthExponent: 3 }, { growthExponent: '1.5' },
    { typo: 1 }, { id: 'other' }
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
