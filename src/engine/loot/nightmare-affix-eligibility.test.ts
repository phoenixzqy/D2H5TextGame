import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import affixSchema from '@/data/schema/affix.schema.json';
import { loadAffixPool, loadAwardPools } from '@/data/loaders/loot';
import { materialRecipes } from '@/data/loaders/material-recipes';
import { planMaterialAction, prepareMaterialAction, type MaterialActionContext, type MaterialActionInventory } from '../crafting/material-actions';
import { createRng } from '../rng';
import type { AffixRoll, ItemBase, Rarity } from '../types/items';
import { prepareRareAffixPair, rollItem } from './rollItem';
import rangedPolicy from '../../../tests/fixtures/ranged-progression-v1.json';
import throwingPolicy from '../../../tests/fixtures/throwing-progression-v1.json';
import spearPolicy from '../../../tests/fixtures/spear-progression-v1.json';

const pools = loadAwardPools();
const affixes = loadAffixPool();
const bases = [...pools.bases.values()].filter(base => base.canHaveAffixes);
const seed = 3286157777;
const rangedAdditions = new Set(rangedPolicy.tiers.slice(1).flatMap(tier => [tier.bow, tier.crossbow]));
const throwingAdditions = new Set(throwingPolicy.tiers.map(tier => tier.baseId));

const spearAdditions = new Set(spearPolicy.tiers.map(tier => tier.baseId));

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('Missing production affix content');
  return value;
}

function assertLegal(rolls: readonly AffixRoll[], base: ItemBase, ilvl: number, rarity: Rarity): void {
  expect(new Set(rolls.map(roll => 'id' in roll ? roll.id : roll.affixId)).size).toBe(rolls.length);
  for (const roll of rolls) {
    if (!('id' in roll)) throw new Error('Expected a modern authored affix');
    const definition = required(affixes.find(affix => affix.id === roll.id));
    const tier = required(definition.tiers[roll.tier]);
    expect(definition.appliesTo).toContain(base.type);
    expect(definition.rarityWeights[rarity]).toBeGreaterThan(0);
    expect(tier.ilvlMin).toBeLessThanOrEqual(ilvl);
    expect(tier.ilvlMax).toBeGreaterThanOrEqual(ilvl);
    expect(roll.rolledValue).toBeGreaterThanOrEqual(tier.valueMin);
    expect(roll.rolledValue).toBeLessThanOrEqual(tier.valueMax);
  }
}

describe('BUG153 and D08 finite native affix eligibility', () => {
  it.each(affixes)('$id covers every supported level through122 with no overlap or123 fallback', affix => {
    for (let level = 1; level <= 122; level++) {
      expect(affix.tiers.filter(tier => level >= tier.ilvlMin && level <= tier.ilvlMax),
        `${affix.id}/L${String(level)}`).toHaveLength(1);
    }
    expect(affix.tiers.some(tier => tier.ilvlMax >= 123)).toBe(false);
  });

  for (const rarity of ['magic', 'rare'] as const) {
    it.each([99, 100, 101, 102, 103, 121, 122])(`materializes legal ${rarity} bonuses on every affixable base at%i`, ilvl => {
      // Preserve 76 original bases; additions are two mastery, six claw,
      // six ranged, five throwing and four spear bases, all checked by the same affix rules.
      expect(bases.filter(base => base.weaponType !== 'claw' && !rangedAdditions.has(base.id) &&
        !throwingAdditions.has(base.id) && !spearAdditions.has(base.id) && !['items/base/weapon-spear', 'items/base/weapon-throwing-knife'].includes(base.id)))
        .toHaveLength(76);
      expect(bases.filter(base => base.weaponType === 'claw')).toHaveLength(6);
      expect(bases.filter(base => rangedAdditions.has(base.id))).toHaveLength(6);
      expect(bases.filter(base => throwingAdditions.has(base.id))).toHaveLength(5);
      expect(bases.filter(base => spearAdditions.has(base.id))).toHaveLength(4);
      expect(bases).toHaveLength(99);
      for (const base of bases) {
        const item = required(rollItem({ baseId: base.id, rarity, ilvl }, pools, createRng(seed)));
        expect(item).toMatchObject({ baseId: base.id, rarity, level: ilvl, ilvl });
        const rolls = item.affixes ?? [];
        expect(rolls.length, base.id).toBeGreaterThanOrEqual(rarity === 'magic' ? 2 : 4);
        expect(rolls.length).toBeLessThanOrEqual(rarity === 'magic' ? 2 : 6);
        assertLegal(rolls, base, ilvl, rarity);
        for (const kind of ['prefix', 'suffix']) {
          const count = rolls.filter(roll => 'id' in roll && affixes.find(affix => affix.id === roll.id)?.kind === kind).length;
          expect(count).toBeGreaterThanOrEqual(1);
          expect(count).toBeLessThanOrEqual(rarity === 'magic' ? 1 : 3);
        }
      }
    });
  }

  it.each([99, 100, 101, 102, 103, 121, 122])('crafts an actual caster amulet at%i with exact costs and once-only identity', ilvl => {
    const recipe = required([...materialRecipes.values()].find(row => row.kind === 'caster-amulet'));
    const base = required(pools.bases.get('items/base/amu-tin'));
    const item = required(rollItem({ baseId: base.id, rarity: 'magic', ilvl }, pools, createRng(seed)));
    const source: MaterialActionInventory = { backpack: [item], stash: [], quarantine: [],
      materials: recipe.costs.materials, currencies: recipe.costs.currencies, materialActionOrdinal: 0 };
    const before = structuredClone(source);
    const context: MaterialActionContext = { characterId: 'affix-boundary', highestUnlockedAct: 5,
      difficulty: ilvl > 102 ? 'hell' : 'nightmare', backpackCapacity: 100, stashCapacity: 500, bases: pools.bases,
      affixes, reservedItemIds: new Set(), otherOwnedItemIds: new Set() };
    const request = prepareMaterialAction(source, context, { recipeId: recipe.id, itemIds: [item.id] });
    const plan = planMaterialAction(source, context, request);
    const next = required(plan.next), output = required(next.backpack[0]);
    expect(output).toMatchObject({ id: item.id, baseId: base.id, level: ilvl, ilvl,
      rarity: 'rare', baseRolls: item.baseRolls });
    expect(output.socketCapacity).toBe(item.socketCapacity);
    expect(output.affixes).toHaveLength(3);
    expect(output.affixes?.[0]).toEqual({ affixId: recipe.fixedAffix.affixId,
      values: new Map(Object.entries(recipe.fixedAffix.values)) });
    const randomAffixes = output.affixes?.slice(1) ?? [];
    assertLegal(randomAffixes, base, ilvl, 'rare');
    expect(randomAffixes.map(roll => 'id' in roll && affixes.find(affix => affix.id === roll.id)?.kind))
      .toEqual(['prefix', 'suffix']);
    expect(next.materials).toEqual({});
    for (const id of Object.keys(recipe.costs.currencies)) expect(next.currencies[id]).toBe(0);
    expect(next.materialActionOrdinal).toBe(1);
    expect(planMaterialAction(next, context, request)).toEqual({ replay: true, result: plan.result });
    expect(source).toEqual(before);
  });

  it('keeps123 outside the authored envelope without rewriting levels or injecting bonuses', () => {
    const base = required(pools.bases.get('items/base/armor-archon-plate'));
    for (const rarity of ['magic', 'rare'] as const) {
      const item = required(rollItem({ baseId: base.id, rarity, ilvl: 123 }, pools, createRng(seed)));
      expect(item).toMatchObject({ level: 123, ilvl: 123, affixes: [] });
    }
    expect(() => prepareRareAffixPair(required(pools.bases.get('items/base/amu-tin')), 123, affixes)).toThrow('Missing legal craft');
  });

  it('validates all authored prefixes and suffixes against the closed production schema', () => {
    const validate = new Ajv2020({ strict: true, allErrors: true }).compile(affixSchema);
    expect(affixes).toHaveLength(16);
    for (const affix of affixes) expect(validate(affix), JSON.stringify(validate.errors)).toBe(true);
  });
});
