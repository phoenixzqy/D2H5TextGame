import { describe, expect, it } from 'vitest';
import { materialRecipes } from '@/data/loaders/material-recipes';
import { loadAffixPool, loadItemBases } from '@/data/loaders/loot';
import type { CanonicalSocketItem } from '../items/socket-contents';
import { prepareMaterialAction, planMaterialAction, type MaterialActionContext, type MaterialActionInventory } from './material-actions';

const context: MaterialActionContext = { characterId: 'hero', highestUnlockedAct: 5, difficulty: 'hell',
  backpackCapacity: 100, stashCapacity: 500, reservedItemIds: new Set(), otherOwnedItemIds: new Set(),
  bases: loadItemBases(), affixes: loadAffixPool() };
const gear = (extra: Partial<CanonicalSocketItem> = {}): CanonicalSocketItem => ({ id: 'target',
  baseId: 'items/base/armor-quilted', rarity: 'normal', level: 1, ilvl: 25, socketCapacity: 2,
  identified: true, equipped: false, baseRolls: { defense: 9 },
  personalizedBy: { characterId: 'hero', name: 'Hero' }, ...extra });
function inventory(extra: Partial<MaterialActionInventory> = {}): MaterialActionInventory {
  return { backpack: [], stash: [], materials: {}, currencies: {}, quarantine: [], materialActionOrdinal: 0, ...extra };
}

describe('unified pure material action planner', () => {
  it.each([...materialRecipes.values()])('preflights and executes $id through the same receipt boundary', recipe => {
    let item = gear();
    if (recipe.kind === 'socket-clear') item = gear({ socketContents: [{ kind: 'gem', id: 'gems/ruby/chipped' }] });
    if (recipe.kind === 'caster-amulet') item = gear({ baseId: 'items/base/amu-tin', socketCapacity: 0, rarity: 'magic',
      affixes: [{ id: 'obsolete', tier: 0, rolledValue: 99 }], generatedName: { prefix: 'old' } });
    const source = inventory({ materials: recipe.costs.materials, currencies: recipe.costs.currencies,
      backpack: 'target' in recipe ? [item] : [] });
    const before = structuredClone(source);
    const request = prepareMaterialAction(source, context, { recipeId: recipe.id,
      ...('target' in recipe ? { itemIds: ['target'] } : {}) });
    expect(source).toEqual(before);
    const plan = planMaterialAction(source, context, request);
    expect(plan.replay).toBe(false); expect(plan.next?.materialActionOrdinal).toBe(1);
    expect(plan.next?.latestMaterialAction?.requestHash).toBe(request.requestHash);
    if ('output' in recipe) {
      expect(plan.result).toEqual(recipe.output);
      expect(plan.next?.materials).toEqual(recipe.output.materials);
      for (const [id, count] of Object.entries(recipe.output.currencies)) expect(plan.next?.currencies[id]).toBe(count);
    } else {
      const output = plan.next?.backpack[0];
      expect(output).toMatchObject({ id: item.id, baseId: item.baseId, level: item.level, ilvl: item.ilvl,
        baseRolls: item.baseRolls, personalizedBy: item.personalizedBy });
      expect(plan.result).toEqual({ itemId: 'target', materials: {}, currencies: {} });
      if (recipe.kind === 'socket-armor') {
        expect(output?.socketCapacity).toBeGreaterThanOrEqual(1);
        expect(output?.socketCapacity).toBeLessThanOrEqual(context.bases.get(item.baseId)?.maxSockets ?? 0);
      } else if (recipe.kind === 'socket-clear') expect(output?.socketContents).toEqual([]);
      else {
        expect(output?.rarity).toBe('rare'); expect(output?.affixes).toHaveLength(3);
        expect(output?.affixes?.[0]).toEqual({ affixId: recipe.fixedAffix.affixId,
          values: new Map([['coreStats.energy', 5], ['statMods.mana', 20]]) });
        expect(output?.affixes).not.toContainEqual(item.affixes?.[0]);
        expect(output?.generatedName).not.toEqual(item.generatedName);
      }
    }
    expect(plan.next).toBeDefined();
    if (!plan.next) throw new Error('Missing committed projection');
    const replay = planMaterialAction(plan.next, context, structuredClone(request));
    expect(replay).toEqual({ replay: true, result: plan.result });
    expect(source).toEqual(before);
    expect(planMaterialAction(source, context, request)).toEqual(plan);
  });
  it('inserts exactly one next-slot material without a fee and creates the completed word once', () => {
    const source = inventory({ backpack: [gear({ baseId: 'items/base/wp1h-short-sword', socketContents: [{ kind: 'rune', id: 'runes/tir' }] })],
      materials: { 'runes/el': 1 }, currencies: { 'rune-shard': 9 } });
    const request = prepareMaterialAction(source, context, { recipeId: 'actions/socket-insert', itemIds: ['target'], materialId: 'runes/el' });
    const plan = planMaterialAction(source, context, request);
    expect(plan.next?.materials).toEqual({}); expect(plan.next?.currencies).toEqual(source.currencies);
    expect(plan.next?.backpack[0]).toMatchObject({ rarity: 'runeword', runewordId: 'runewords/steel',
      socketContents: [{ kind: 'rune', id: 'runes/tir' }, { kind: 'rune', id: 'runes/el' }] });
  });
  it('deduplicates bulk salvage, honors source-level bands and destroys inserts without refunds', () => {
    const one = gear({ rarity: 'rare', ilvl: 21, socketContents: [{ kind: 'rune', id: 'runes/el' }] });
    const two = gear({ id: 'second', rarity: 'unique', ilvl: 40 });
    const source = inventory({ backpack: [one], stash: [two], materials: { 'materials/scrap': 1 } });
    const request = prepareMaterialAction(source, context, { recipeId: 'actions/salvage', itemIds: ['target', 'target', 'second'] });
    const plan = planMaterialAction(source, context, request);
    expect(plan.result).toEqual({ materials: { 'materials/scrap': 20 }, currencies: {} });
    expect(plan.next?.materials).toEqual({ 'materials/scrap': 21 });
    expect(plan.next?.backpack).toEqual([]); expect(plan.next?.stash).toEqual([]);
  });
  it.each([
    [1, 'normal', 'runes/ral'], [2, 'hell', 'runes/hel'], [3, 'hell', 'runes/fal'],
    [4, 'hell', 'runes/pul'], [5, 'normal', 'runes/um'], [5, 'nightmare', 'runes/um']
  ] as const)('enforces rune output caps at act%s/%s', (highestUnlockedAct, difficulty, input) => {
    const source = inventory({ materials: { [input]: 3 } });
    const recipeId = `recipes/rune-fusion/${input.slice(6)}`;
    expect(() => prepareMaterialAction(source, { ...context, highestUnlockedAct, difficulty }, { recipeId })).toThrow();
  });
  it('allows gem fusion above drop caps and rune fusion at its exact output cap', () => {
    const source = inventory({ materials: { 'gems/ruby/flawless': 3, 'runes/tal': 3 }, currencies: { 'gem-shard': 1 } });
    const early = { ...context, highestUnlockedAct: 1 as const, difficulty: 'normal' as const };
    expect(() => prepareMaterialAction(source, early, { recipeId: 'recipes/gem-fusion/ruby/flawless' })).not.toThrow();
    expect(() => prepareMaterialAction(source, early, { recipeId: 'recipes/rune-fusion/tal' })).not.toThrow();
  });
  it.each([0, -1, .5, undefined, NaN, Number.MAX_SAFE_INTEGER + 1])('refuses malformed present source ilvl %s without fallback', ilvl => {
    const source = inventory({ backpack: [{ ...gear(), ilvl } as unknown as CanonicalSocketItem] });
    expect(() => prepareMaterialAction(source, context, { recipeId: 'actions/salvage', itemIds: ['target'] })).toThrow();
  });
  it('uses level only when ilvl is absent and refuses output overflow before a new ordinal', () => {
    const { ilvl: _ilvl, ...old } = gear({ level: 21 });
    const source = inventory({ backpack: [old] });
    const request = prepareMaterialAction(source, context, { recipeId: 'actions/salvage', itemIds: ['target'] });
    expect(planMaterialAction(source, context, request).result.materials).toEqual({ 'materials/scrap': 2 });
    expect(() => prepareMaterialAction({ ...source, materials: { 'materials/scrap': Number.MAX_SAFE_INTEGER } }, context,
      { recipeId: 'actions/salvage', itemIds: ['target'] })).toThrow();
    expect(source.materialActionOrdinal).toBe(0);
  });
  it('binds character, recipe, exact target preimage and ordered input identity, refusing stale state', () => {
    const source = inventory({ backpack: [gear()], materials: { 'runes/hel': 1, 'runes/amn': 1, 'gems/topaz/perfect': 1 } });
    const selection = { recipeId: 'recipes/socket-armor', itemIds: ['target'] };
    const request = prepareMaterialAction(source, context, selection);
    const changed = { ...source, backpack: [gear({ baseRolls: { defense: 10 } })] };
    expect(prepareMaterialAction(changed, context, selection).requestHash).not.toBe(request.requestHash);
    expect(() => planMaterialAction(changed, context, request)).toThrow();
    expect(() => planMaterialAction(source, { ...context, characterId: 'other' }, request)).toThrow();
    expect(() => planMaterialAction(source, context, { ...request, recipeId: 'recipes/socket-clear' })).toThrow();
    expect(() => planMaterialAction(source, context, { ...request, inputs: [...request.inputs].reverse() })).toThrow();
    expect(() => planMaterialAction(source, context, { ...request, ordinal: 2 })).toThrow();
    const committed = planMaterialAction(source, context, request).next;
    const receipt = committed?.latestMaterialAction;
    if (!committed || !receipt) throw new Error('Missing projection or receipt');
    expect(() => planMaterialAction({ ...committed, materialActionOrdinal: 2,
      latestMaterialAction: { ...receipt, ordinal: 2 } }, context, request)).toThrow();
    expect(() => prepareMaterialAction({ ...source, materialActionOrdinal: Number.MAX_SAFE_INTEGER,
      latestMaterialAction: { ordinal: Number.MAX_SAFE_INTEGER, requestHash: 'a'.repeat(64), result: { materials: {}, currencies: {} } } }, context, selection)).toThrow();
  });
  it('refuses equipped, reserved, foreign, duplicate-owned, stash transform and unaffordable targets', () => {
    const selection = { recipeId: 'recipes/socket-armor', itemIds: ['target'] };
    const full = inventory({ backpack: [gear()], materials: { 'runes/hel': 1, 'runes/amn': 1, 'gems/topaz/perfect': 1 } });
    for (const source of [inventory({ backpack: [gear()] }), { ...full, backpack: [gear({ equipped: true })] },
      { ...full, backpack: [], stash: [gear()] }, { ...full, stash: [gear()] }]) {
      expect(() => prepareMaterialAction(source, context, selection)).toThrow();
    }
    for (const ctx of [{ ...context, reservedItemIds: new Set(['target']) }, { ...context, otherOwnedItemIds: new Set(['target']) }]) {
      expect(() => prepareMaterialAction(full, ctx, selection)).toThrow();
    }
  });
  it('recovers exact explicit v18 runes with the same instance and provenance-bound latest replay', () => {
    const source = inventory({ quarantine: [{ sourceVersion: 18, item: {
      ...gear(), rarity: 'runeword', runewordId: 'runewords/lore', runes: ['runes/ort', 'runes/sol'] },
      origin: { container: 'equipped', slot: 'chest' } }] });
    const request = prepareMaterialAction(source, context, { recipeId: 'actions/recover-v18', itemIds: ['target'] });
    const plan = planMaterialAction(source, context, request);
    expect(plan.result).toEqual({ itemId: 'target', materials: { 'runes/ort': 1, 'runes/sol': 1 }, currencies: {} });
    expect(plan.next?.quarantine).toEqual([]);
    expect(plan.next?.backpack[0]).toEqual({ ...gear(), socketContents: [] });
    expect(() => prepareMaterialAction(source, { ...context, backpackCapacity: 0 }, { recipeId: 'actions/recover-v18', itemIds: ['target'] })).toThrow();
    const moved = { ...source, quarantine: source.quarantine.map(row => ({ ...row, origin: { container: 'stash' as const, index: 0 } })) };
    expect(() => planMaterialAction(moved, context, request)).toThrow();
  });
});
