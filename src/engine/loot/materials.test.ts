import { describe, expect, it } from 'vitest';
import catalogJson from '@/data/items/materials.json';
import economyJson from '@/data/loot/material-economy.json';
import { materialCatalog, materialEconomy, validateMaterialDefinitions } from '@/data/loaders/materials';
import { isMaterialLedger, mergeMaterials, sampleMaterial } from './materials';

describe('closed concrete material ownership', () => {
  it('loads exactly 33 runes, 35 gems and scrap with independent rune ordinals', () => {
    expect(materialCatalog.size).toBe(69);
    expect(materialEconomy.runeOrder).toHaveLength(33);
    expect(materialEconomy.runeOrder[7]).toBe('runes/ral');
    expect(materialEconomy.runeOrder[21]).toBe('runes/um');
    expect(materialEconomy.runeOrder[32]).toBe('runes/zod');
    expect([...materialCatalog.values()].filter(m => m.kind === 'gem')).toHaveLength(35);
    expect(materialCatalog.get('materials/scrap')?.kind).toBe('scrap');
  });

  it('refuses malformed and duplicate catalogs or sampler definitions', () => {
    expect(() => validateMaterialDefinitions([...catalogJson, catalogJson[0]], economyJson)).toThrow();
    expect(() => validateMaterialDefinitions(catalogJson.slice(1), economyJson)).toThrow();
    expect(() => validateMaterialDefinitions(catalogJson, { ...economyJson, runeWeights: [1] })).toThrow();
    expect(() => validateMaterialDefinitions(catalogJson, { ...economyJson, runeOrder:
      economyJson.runeOrder.map(() => 'runes/el') })).toThrow();
    expect(() => validateMaterialDefinitions(catalogJson, { ...economyJson, nonHellRuneCap: Infinity })).toThrow();
    expect(() => validateMaterialDefinitions(catalogJson, { ...economyJson, unknown: true })).toThrow();
  });

  it.each([undefined, null, [], { 'runes/el': 0 }, { 'runes/el': -1 }, { 'runes/el': 1.5 },
    { 'runes/el': Infinity }, { 'runes/el': Number.MAX_SAFE_INTEGER + 1 }, { 'runes/not-authored': 1 },
    JSON.parse('{"__proto__":1}'), Object.create({ 'runes/el': 1 }) as unknown])(
    'refuses malformed ledger %j', value => { expect(isMaterialLedger(value)).toBe(false); });

  it('adds whole safe stacks, omits zeros and refuses either invalid input or overflow', () => {
    const owned = { 'runes/el': 2, 'gems/ruby/chipped': 3 };
    expect(mergeMaterials(owned, { 'runes/el': 4, 'materials/scrap': 1 })).toEqual({
      'runes/el': 6, 'gems/ruby/chipped': 3, 'materials/scrap': 1
    });
    expect(owned).toEqual({ 'runes/el': 2, 'gems/ruby/chipped': 3 });
    expect(isMaterialLedger({})).toBe(true);
    expect(isMaterialLedger({ 'runes/zod': Number.MAX_SAFE_INTEGER })).toBe(true);
    expect(() => mergeMaterials({ 'runes/el': Number.MAX_SAFE_INTEGER }, { 'runes/el': 1 })).toThrow();
    expect(() => mergeMaterials({}, { 'runes/el': 0 })).toThrow();
  });
});

describe('reviewed material pools', () => {
  const context = { act: 1, difficulty: 'normal', tier: 'trash' } as const;
  const last = 1 - Number.EPSILON / 2;

  it('uses half-open weights and preserves both endpoints of the Act I rune pool', () => {
    expect(sampleMaterial('rune', context, 0)).toBe('runes/el');
    const total = 10000 + 9000 + 8000 + 7000 + 6000 + 5000 + 4500 + 4000;
    expect(sampleMaterial('rune', context, (10000 - .001) / total)).toBe('runes/el');
    expect(sampleMaterial('rune', context, 10000 / total)).toBe('runes/eld');
    expect(sampleMaterial('rune', context, last)).toBe('runes/ral');
  });

  it('applies act, difficulty and elite high-rune caps separately', () => {
    expect([1, 2, 3, 4, 5].map(act => sampleMaterial('rune', {
      act: act as 1 | 2 | 3 | 4 | 5, difficulty: 'hell', tier: 'boss'
    }, last))).toEqual(['runes/ral', 'runes/hel', 'runes/fal', 'runes/pul', 'runes/zod']);
    expect(sampleMaterial('rune', { act: 5, difficulty: 'normal', tier: 'boss' }, last)).toBe('runes/um');
    expect(sampleMaterial('rune', { act: 5, difficulty: 'nightmare', tier: 'boss' }, last)).toBe('runes/um');
    expect(sampleMaterial('rune', { act: 5, difficulty: 'hell', tier: 'trash' }, last)).toBe('runes/um');
  });

  it('folds capped gem weights without erasing successful boss drops', () => {
    expect(sampleMaterial('gem', { ...context, tier: 'boss' }, 0)).toBe('gems/amethyst/flawed');
    expect(sampleMaterial('gem', { ...context, tier: 'boss' }, last)).toBe('gems/topaz/flawed');
    expect(sampleMaterial('gem', { act: 5, difficulty: 'normal', tier: 'boss' }, last)).toBe('gems/topaz/flawless');
    expect(sampleMaterial('gem', { act: 5, difficulty: 'hell', tier: 'boss' }, last)).toBe('gems/topaz/perfect');
    expect(sampleMaterial('gem', context, 0)).toBe('gems/amethyst/chipped');
    // Equal types, then quality-minor ordering: amethyst occupies exactly one seventh.
    expect(sampleMaterial('gem', context, 1 / 7)).toBe('gems/diamond/chipped');
  });

  it.each([-1, 1, NaN, Infinity])('refuses a non-unit identity variate %s', value => {
    expect(() => sampleMaterial('rune', context, value)).toThrow();
  });
});
