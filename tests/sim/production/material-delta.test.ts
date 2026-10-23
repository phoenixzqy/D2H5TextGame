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

it('projects only the version and proved-empty ledger when comparing authentic v17 lineage', () => {
  const { save } = loadAuthenticV2Terminal();
  expect(save.version).toBe(18);
  expect(save.inventory.materials).toEqual({});
  const projected = historicalV17Save(save);
  expect(projected.version).toBe(17);
  expect(Object.hasOwn(projected.inventory, 'materials')).toBe(false);
  expect({ ...projected, version: 18, inventory: { ...projected.inventory, materials: {} } }).toEqual(save);
  expect(() => historicalV17Save({ ...save, inventory: { ...save.inventory, materials: { 'runes/el': 1 } } }))
    .toThrow('cannot discard owned materials');
});
