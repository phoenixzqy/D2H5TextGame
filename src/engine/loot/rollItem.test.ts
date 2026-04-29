import { describe, expect, it, beforeEach } from 'vitest';
import { createRng } from '../rng';
import type { Affix, ItemBase } from '../types/items';
import { __resetRollItemSeqForTests, rollItem, type RarityAffixRules } from './rollItem';

const sword: ItemBase = {
  id: 'items/base/wp1h-short-sword',
  name: 'Short Sword',
  type: 'weapon',
  slot: 'weapon',
  baseDamage: { min: 4, max: 8, breakdown: { physical: 8 } },
  reqLevel: 1,
  canHaveAffixes: true
};

const affixes: Affix[] = [
  { id: 'affix.attack', kind: 'prefix', appliesTo: ['weapon'], stat: 'attack', tiers: [{ ilvlMin: 1, ilvlMax: 10, valueMin: 1, valueMax: 3 }, { ilvlMin: 11, ilvlMax: 99, valueMin: 4, valueMax: 9 }], rarityWeights: { magic: 1, rare: 1 }, i18nKey: 'attack.flat' },
  { id: 'affix.crit', kind: 'prefix', appliesTo: ['weapon'], stat: 'critChance', tiers: [{ ilvlMin: 1, ilvlMax: 99, valueMin: 1, valueMax: 5 }], rarityWeights: { magic: 1, rare: 1 }, i18nKey: 'critChance.flat' },
  { id: 'affix.life', kind: 'suffix', appliesTo: ['weapon'], stat: 'life', tiers: [{ ilvlMin: 1, ilvlMax: 99, valueMin: 5, valueMax: 10 }], rarityWeights: { magic: 1, rare: 1 }, i18nKey: 'life.flat' },
  { id: 'affix.mana', kind: 'suffix', appliesTo: ['weapon'], stat: 'mana', tiers: [{ ilvlMin: 1, ilvlMax: 99, valueMin: 5, valueMax: 10 }], rarityWeights: { magic: 1, rare: 1 }, i18nKey: 'mana.flat' },
  { id: 'affix.fire', kind: 'suffix', appliesTo: ['weapon'], stat: 'fireRes', tiers: [{ ilvlMin: 1, ilvlMax: 99, valueMin: 1, valueMax: 3 }], rarityWeights: { magic: 1, rare: 1 }, i18nKey: 'res.fire' },
  { id: 'affix.cold', kind: 'prefix', appliesTo: ['weapon'], stat: 'coldRes', tiers: [{ ilvlMin: 1, ilvlMax: 99, valueMin: 1, valueMax: 3 }], rarityWeights: { magic: 1, rare: 1 }, i18nKey: 'res.cold' }
];
const rules: RarityAffixRules = {
  magic: { prefix: { min: 1, max: 1 }, suffix: { min: 1, max: 1 } },
  rare: { prefix: { min: 1, max: 3 }, suffix: { min: 1, max: 3 }, total: { min: 4, max: 6 } }
};
const pools = { bases: new Map([[sword.id, sword]]), affixes, rarityRules: rules };

describe('rollItem', () => {
  beforeEach(() => { __resetRollItemSeqForTests(); });

  it('is deterministic and snapshots the same seed', () => {
    const a = rollItem({ baseId: sword.id, rarity: 'magic', ilvl: 12 }, pools, createRng(123));
    __resetRollItemSeqForTests();
    const b = rollItem({ baseId: sword.id, rarity: 'magic', ilvl: 12 }, pools, createRng(123));
    expect(b).toEqual(a);
    expect(a).toMatchSnapshot();
  });

  it('rolls base attack inside base range', () => {
    const item = rollItem({ baseId: sword.id, rarity: 'normal', ilvl: 1 }, pools, createRng(9));
    expect(item?.affixes).toHaveLength(0);
    expect(item?.baseRolls?.attack).toBeGreaterThanOrEqual(4);
    expect(item?.baseRolls?.attack).toBeLessThanOrEqual(8);
  });

  it('respects rarity affix count ranges', () => {
    const magic = rollItem({ baseId: sword.id, rarity: 'magic', ilvl: 20 }, pools, createRng(1));
    const rare = rollItem({ baseId: sword.id, rarity: 'rare', ilvl: 20 }, pools, createRng(2));
    expect(magic?.affixes).toHaveLength(2);
    expect((rare?.affixes?.length ?? 0)).toBeGreaterThanOrEqual(4);
    expect((rare?.affixes?.length ?? 0)).toBeLessThanOrEqual(6);
  });

  it('never rolls invalid tiers or values for ilvl', () => {
    const item = rollItem({ baseId: sword.id, rarity: 'magic', ilvl: 5 }, pools, createRng(5));
    for (const roll of item?.affixes ?? []) {
      if (!('id' in roll)) continue;
      const def = affixes.find((a) => a.id === roll.id);
      const tier = def?.tiers[roll.tier];
      expect(tier).toBeDefined();
      expect(5).toBeGreaterThanOrEqual(tier?.ilvlMin ?? 0);
      expect(5).toBeLessThanOrEqual(tier?.ilvlMax ?? 0);
      expect(roll.rolledValue).toBeGreaterThanOrEqual(tier?.valueMin ?? 0);
      expect(roll.rolledValue).toBeLessThanOrEqual(tier?.valueMax ?? 0);
    }
  });
});


