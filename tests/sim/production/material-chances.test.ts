import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import catalogJson from '@/data/items/materials.json';
import economyJson from '@/data/loot/material-economy.json';
import { materialEconomy, validateMaterialDefinitions } from '@/data/loaders/materials';
import type { MonsterTier } from '@/engine/combat/types';
import { createRng, type Rng } from '@/engine/rng';
import { rollCurrencyDrops } from '@/engine/loot/orbs-and-currency';

// Override only authored data. The real loader validator, sampler and RNG run.
// This file belongs to the isolated sim-contracts project, not engine's shared modules.
const { originalChances, chances } = vi.hoisted(() => {
  const originalChances = {
    trash: { rune: 0.006, gem: 0.015 },
    elite: { rune: 0.05, gem: 0.08 },
    'rare-minion': { rune: 0.05, gem: 0.08 },
    champion: { rune: 0.05, gem: 0.08 },
    'rare-elite': { rune: 0.08, gem: 0.12 },
    boss: { rune: 1, gem: 1 },
    'chapter-boss': { rune: 1, gem: 1 }
  };
  return { originalChances, chances: structuredClone(originalChances) };
});

vi.mock('@/data/loaders/materials', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/materials')>();
  return { ...actual, materialEconomy: { ...actual.materialEconomy, independentDropChances: chances } };
});

const tiers = Object.keys(originalChances) as MonsterTier[];
beforeEach(() => {
  for (const tier of tiers) Object.assign(chances[tier], originalChances[tier]);
});

function roll(tier: MonsterTier, runeUnit: number, gemUnit: number) {
  const values = [...(tier === 'champion' ? [0.3999] : []), runeUnit, gemUnit, 0.5, 0.123];
  let draws = 0;
  const next = () => {
    const value = values[draws++];
    if (value === undefined) throw new Error('Unexpected extra RNG draw');
    return value;
  };
  const rng: Rng = { next, chance: p => next() < p,
    nextInt: () => { throw new Error('Unexpected integer draw'); },
    pick: () => { throw new Error('Unexpected pick'); },
    fork: () => { throw new Error('Unexpected fork'); } };
  const result = rollCurrencyDrops(10, tier, 5, 'hell', 0, rng);
  expect(draws).toBe(tier === 'champion' ? 4 : 3);
  expect(rng.next()).toBe(0.123);
  if (tier === 'champion') expect(result.wishstones).toBe(1);
  return result;
}

function lastGem(tier: MonsterTier) {
  const quality = tier === 'trash' ? 'normal' :
    tier === 'boss' || tier === 'chapter-boss' ? 'perfect' : 'flawless';
  return `gems/topaz/${quality}`;
}

describe('authored independent material chances', () => {
  it('ships exactly the original probabilities through the real schema validator', () => {
    expect(validateMaterialDefinitions(catalogJson, economyJson).economy.independentDropChances)
      .toEqual(originalChances);
  });

  it('preserves all original outputs and following RNG across 1680 fixed contexts', () => {
    const outputs = [];
    for (let seed = 0; seed < 16; seed++) {
      for (const act of [1, 2, 3, 4, 5] as const) {
        for (const difficulty of ['normal', 'nightmare', 'hell'] as const) {
          for (const tier of tiers) {
            const rng = createRng(seed);
            outputs.push({ seed, act, difficulty, tier,
              drops: rollCurrencyDrops(10 + act * 10, tier, act, difficulty, 17, rng), following: rng.next() });
          }
        }
      }
    }
    expect(outputs).toHaveLength(1680);
    // Captured from the real unmodified implementation at 07933d8f (BUG-361 evidence).
    expect(createHash('sha256').update(JSON.stringify(outputs)).digest('hex'))
      .toBe('dc155e16e36ea3eb8647c23ff8b70475ecbf70520d90b834e73fbc57e8a053d5');
  });

  describe.each(tiers)('%s', tier => {
    it('can disable runes and guarantee gems with unchanged draw order', () => {
      Object.assign(chances[tier], { rune: 0, gem: 1 });
      expect(roll(tier, 0, 1 - Number.EPSILON)).toMatchObject({
        runes: 0, gems: 1, materials: { [lastGem(tier)]: 1 }
      });
    });

    it('can guarantee runes and disable gems with unchanged draw order', () => {
      Object.assign(chances[tier], { rune: 1, gem: 0 });
      const lastRune = tier === 'trash' ? 'runes/um' : 'runes/zod';
      expect(roll(tier, 1 - Number.EPSILON, 0)).toMatchObject({
        runes: 1, gems: 0, materials: { [lastRune]: 1 }
      });
    });

    it('uses strict authored thresholds, consuming unsuccessful gate draws', () => {
      Object.assign(chances[tier], { rune: 0.25, gem: 0.5 });
      expect(roll(tier, 0.25, 0.5)).toMatchObject({ runes: 0, gems: 0, materials: {} });
    });

    it('normalizes each successful draw by its authored probability', () => {
      Object.assign(chances[tier], { rune: 0.25, gem: 0.5 });
      const lastRune = tier === 'trash' ? 'runes/um' : 'runes/zod';
      expect(roll(tier, 0.25 - Number.EPSILON, 0.5 - Number.EPSILON)).toMatchObject({
        runes: 1, gems: 1, materials: { [lastRune]: 1, [lastGem(tier)]: 1 }
      });
    });
  });
});

describe('independent chance schema', () => {
  function rejects(changed: unknown) {
    expect(() => validateMaterialDefinitions(catalogJson, changed)).toThrow('Invalid material definitions');
  }

  it('requires the complete closed seven-tier record', () => {
    const { independentDropChances: _removed, ...missing } = economyJson;
    rejects(missing);
    rejects({ ...economyJson, independentDropChances: null });
    rejects({ ...economyJson, independentDropChances: [] });
    rejects({ ...economyJson, independentDropChances: { ...originalChances, typo: { rune: 0.1, gem: 0.2 } } });
    for (const tier of tiers) {
      const incomplete: Partial<typeof originalChances> = structuredClone(originalChances);
      delete incomplete[tier];
      rejects({ ...economyJson, independentDropChances: incomplete });
    }
  });

  it.each(tiers)('requires closed rune/gem probabilities for %s', tier => {
    for (const entry of [{ rune: 0.5 }, { gem: 0.5 }, { rune: 0.5, gem: 0.5, typo: 0 }, null, []]) {
      rejects({ ...economyJson, independentDropChances: { ...originalChances, [tier]: entry } });
    }
  });

  it.each(['rune', 'gem'] as const)('rejects invalid %s values on every tier', kind => {
    for (const tier of tiers) {
      for (const value of [-0.001, 1.001, NaN, Infinity, -Infinity, '0.5', true, null]) {
        rejects({ ...economyJson, independentDropChances: {
          ...originalChances, [tier]: { ...originalChances[tier], [kind]: value }
        } });
      }
    }
  });

  it('accepts inclusive zero and one boundaries for both probabilities on every tier', () => {
    for (const rune of [0, 1]) {
      for (const gem of [0, 1]) {
        const independentDropChances = Object.fromEntries(tiers.map(tier => [tier, { rune, gem }]));
        const input = { ...economyJson, independentDropChances };
        expect(validateMaterialDefinitions(catalogJson, input).economy.independentDropChances)
          .toEqual(independentDropChances);
      }
    }
    expect(materialEconomy.independentDropChances).toEqual(originalChances);
  });
});
