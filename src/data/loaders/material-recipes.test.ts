import { describe, expect, it } from 'vitest';
import { loadGameData } from '../loader';
import catalog from '../items/material-recipes.json';
import { materialRecipes, materialRecipeRules, validateMaterialRecipes } from './material-recipes';

const types = ['amethyst', 'diamond', 'emerald', 'ruby', 'sapphire', 'skull', 'topaz'];
const qualities = ['chipped', 'flawed', 'normal', 'flawless', 'perfect'];
const runes = 'el eld tir nef eth ith tal ral ort thul amn sol shael dol hel io lum ko fal lem pul um mal ist gul vex ohm lo sur ber jah cham zod'.split(' ');

describe('complete authored material recipe catalog', () => {
  it('loads all98 recipes through actual game boot', async () => {
    expect((await loadGameData()).materialRecipes).toBe(materialRecipes);
    expect(materialRecipes.size).toBe(98);
  });
  it.each(types)('defines every %s fusion and dismantling cost/output', type => {
    for (const [index, quality] of qualities.entries()) {
      const source = `gems/${type}/${quality}`;
      const dismantle = materialRecipes.get(`recipes/gem-dismantle/${type}/${quality}`);
      expect(dismantle).toMatchObject({ kind: 'gem-dismantle', costs: { materials: { [source]: 1 }, currencies: {} },
        output: { materials: {}, currencies: { 'gem-shard': index + 1 } } });
      const fusion = materialRecipes.get(`recipes/gem-fusion/${type}/${quality}`);
      if (index === 4) expect(fusion).toBeUndefined();
      else expect(fusion).toMatchObject({ kind: 'gem-fusion', costs: { materials: { [source]: 3 }, currencies: { 'gem-shard': 1 } },
        output: { materials: { [`gems/${type}/${qualities[index + 1] ?? 'missing'}`]: 1 }, currencies: {} } });
    }
  });
  it('defines32 adjacent ordinal rune fusions rather than grouped Rune.tier upgrades', () => {
    for (const [index, rune] of runes.entries()) {
      const recipe = materialRecipes.get(`recipes/rune-fusion/${rune}`);
      if (rune === 'zod') expect(recipe).toBeUndefined();
      else expect(recipe).toMatchObject({ kind: 'rune-fusion', costs: { materials: { [`runes/${rune}`]: 3 }, currencies: {} },
        output: { materials: { [`runes/${runes[index + 1] ?? 'missing'}`]: 1 }, currencies: {} } });
    }
  });
  it('authors transform fees, source predicates, caster fixed Map values and salvage bands', () => {
    expect(materialRecipes.get('recipes/socket-armor')).toMatchObject({ costs: {
      materials: { 'runes/hel': 1, 'runes/amn': 1, 'gems/topaz/perfect': 1 }, currencies: {} },
      target: { type: 'armor', slot: 'chest', rarities: ['normal'], emptyContents: true }, minimumSockets: 1 });
    expect(materialRecipes.get('recipes/socket-clear')).toMatchObject({ costs: {
      materials: { 'runes/hel': 1, 'gems/skull/flawed': 1 }, currencies: { 'rune-shard': 100 } },
      target: { emptyContents: false } });
    expect(materialRecipes.get('recipes/caster-amulet')).toMatchObject({ costs: {
      materials: { 'runes/ral': 1, 'gems/amethyst/perfect': 1, 'materials/scrap': 20 }, currencies: { 'rune-shard': 1000 } },
      target: { type: 'jewelry', slot: 'amulet', rarities: ['magic'], identified: true, emptyContents: true },
      fixedAffix: { affixId: 'recipes/caster-amulet/fixed', values: { 'coreStats.energy': 5, 'statMods.mana': 20 } } });
    expect(materialRecipeRules.salvage).toEqual({ materialId: 'materials/scrap', levelBandSize: 20,
      rarityYields: { normal: 1, magic: 2, rare: 4, set: 6, unique: 6, runeword: 6 } });
    expect(materialRecipeRules.insertion).toEqual({ quantity: 1 });
  });
  it.each([
    (value: typeof catalog) => ({ ...value, recipes: value.recipes.slice(1) }),
    (value: typeof catalog) => ({ ...value, recipes: [value.recipes[0], ...value.recipes.slice(0, -1)] }),
    (value: typeof catalog) => ({ ...value, recipes: value.recipes.map((row, i) => i ? row : { ...row, costs: { materials: { 'runes/nonexistent': 1 }, currencies: {} } }) }),
    (value: typeof catalog) => ({ ...value, recipes: value.recipes.map((row, i) => i ? row : { ...row, output: { materials: {}, currencies: { wishstone: 1 } } }) }),
    (value: typeof catalog) => ({ ...value, recipes: value.recipes.map((row, i) => i ? row : { ...row, costs: { materials: {}, currencies: { 'gem-shard': Number.MAX_SAFE_INTEGER + 1 } } }) }),
    (value: typeof catalog) => ({ ...value, recipes: value.recipes.map((row, i) => i ? row : { ...row, output: { materials: { 'gems/ruby/perfect': 1 }, currencies: {} } }) }),
    (value: typeof catalog) => ({ ...value, extra: true })
  ])('refuses incomplete, duplicate, unknown, malformed or nonadjacent recipes %#', corrupt => {
    expect(() => validateMaterialRecipes(corrupt(structuredClone(catalog)))).toThrow();
  });
});
