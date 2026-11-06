import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import schema from '../../data/schema/item-base.schema.json';
import { baseMatchesEquipmentSlot } from './equipValidator';
import type { EquipmentSlot, ItemBase } from '../types/items';

const charm: ItemBase = { id: 'items/base/small-charm', name: 'items.base.small-charm',
  type: 'charm', slot: 'charm', reqLevel: 1, maxSockets: 0, metal: false, canHaveAffixes: false };
const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);

describe('canonical hero charm eligibility', () => {
  it('admits the authored base shape and its one hero slot', () => {
    expect(validate(charm), JSON.stringify(validate.errors)).toBe(true);
    expect(baseMatchesEquipmentSlot(charm, 'charm')).toBe(true);
  });
  it.each<Partial<ItemBase>>([
    { id: 'items/base/other-charm' }, { type: 'jewelry' }, { type: 'armor' },
    { id: 'items/base/ring-iron', type: 'jewelry' }, { slot: null }
  ])('refuses a misleading reserved-slot base %#', patch => {
    expect(baseMatchesEquipmentSlot({ ...charm, ...patch }, 'charm')).toBe(false);
  });
  it.each<EquipmentSlot>(['head', 'amulet', 'ring-left', 'ring-right', 'weapon', 'offhand'])(
    'refuses a charm authored into %s', slot => {
      expect(baseMatchesEquipmentSlot({ ...charm, slot }, slot)).toBe(false);
      expect(baseMatchesEquipmentSlot({ ...charm, type: 'armor', slot }, slot)).toBe(false);
      expect(baseMatchesEquipmentSlot(charm, slot)).toBe(false);
    });
  it('preserves ordinary rings, one-handed offhands and absent-base refusal', () => {
    const ring: ItemBase = { ...charm, id: 'items/base/ring-iron', type: 'jewelry', slot: 'ring-left' };
    const sword: ItemBase = { ...charm, id: 'items/base/wp1h-short-sword', type: 'weapon',
      slot: 'weapon', handedness: 'oneHanded', weaponType: 'sword' };
    expect(baseMatchesEquipmentSlot(ring, 'ring-right')).toBe(true);
    expect(baseMatchesEquipmentSlot(sword, 'offhand')).toBe(true);
    expect(baseMatchesEquipmentSlot(sword, 'charm')).toBe(false);
    expect(baseMatchesEquipmentSlot(undefined, 'charm')).toBe(false);
  });
});
