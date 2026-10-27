import { expect, it } from 'vitest';
import { materialDelta, materialRewardDelta } from './material-delta';
import { historicalV17Save } from './historical-v17';
import { loadAuthenticV2Terminal } from './fresh-campaign-continuation';

it('keeps exact concrete reward identities while omitting unchanged stacks', () => {
  expect(materialRewardDelta({ 'runes/el': 2 }, { 'runes/el': 2, 'runes/ral': 3, 'materials/scrap': 4 }))
    .toEqual({ 'runes/ral': 3, 'materials/scrap': 4 });
  expect(materialDelta({ 'runes/el': 2 }, { 'runes/el': 2 })).toEqual({});
});

it('records actual spending but refuses to describe shrinking aggregates as earned rewards', () => {
  expect(materialDelta({ 'runes/el': 2 }, {})).toEqual({ 'runes/el': -2 });
  expect(() => materialRewardDelta({ 'runes/el': 2 }, {})).toThrow('shrank');
  expect(() => materialDelta({}, { 'runes/el': Number.MAX_SAFE_INTEGER + 1 })).toThrow('Invalid');
  expect(() => materialRewardDelta({}, { 'runes/unknown': 1 })).toThrow('Invalid');
});

it('proves the complete forward representation before recovering authentic v17 lineage', () => {
  const { save, witness } = loadAuthenticV2Terminal();
  expect(save.version).toBe(23);
  expect(save.inventory.materials).toEqual({});
  const projected = historicalV17Save(save, witness);
  expect(projected.version).toBe(17);
  expect(Object.hasOwn(projected.inventory, 'materials')).toBe(false);
  expect(projected).toEqual(witness);
  expect(() => historicalV17Save({ ...save, inventory: { ...save.inventory, materials: { 'runes/el': 1 } } }, witness))
    .toThrow('complete historical forward expectation');
});
