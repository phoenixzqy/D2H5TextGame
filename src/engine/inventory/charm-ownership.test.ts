import { describe, expect, it } from 'vitest';
import * as validator from './equipValidator';
import type { Item } from '../types/items';

type Owner = Pick<Item, 'id' | 'baseId'>;
interface Inventory { backpack: readonly Owner[]; stash: readonly Owner[]; equipped: Record<string, Owner | null> }
const uniqueOwners = validator.hasUniqueCharmOwnership;
const charm: Owner = { id: 'one-charm', baseId: 'items/base/small-charm' };
const ordinary: Owner = { id: 'sword', baseId: 'items/base/wp1h-short-sword' };
function inventory(): Inventory { return { backpack: [charm], stash: [], equipped: {} }; }

describe('canonical charm ownership counts concrete occurrences', () => {
  it.each(['backpack', 'stash', 'hero', 'merc', 'orphan'] as const)('rejects a second owner in %s', where => {
    const bag = inventory(), mercs: Record<string, Record<string, Owner | null>> = {};
    if (where === 'backpack') bag.backpack = [charm, charm];
    if (where === 'stash') bag.stash = [{ ...charm }];
    if (where === 'hero') bag.equipped.charm = charm;
    if (where === 'merc' || where === 'orphan') mercs[where] = { arbitrary: charm };
    const before = structuredClone({ bag, mercs });
    expect(uniqueOwners(bag, mercs)).toBe(false);
    expect({ bag, mercs }).toEqual(before);
  });
  it('rejects a charm ID shared by an ordinary owner regardless of encounter order', () => {
    const alias = { ...ordinary, id: charm.id };
    expect(uniqueOwners({ ...inventory(), backpack: [alias, charm] }, {})).toBe(false);
    expect(uniqueOwners({ ...inventory(), backpack: [charm, alias] }, {})).toBe(false);
  });
  it('permits separate charms, null slots and ordinary duplicate IDs', () => {
    expect(uniqueOwners({ backpack: [charm, { ...charm, id: 'second' }, ordinary, ordinary],
      stash: [ordinary], equipped: { charm: null, legacy: ordinary } }, { orphan: { head: ordinary } })).toBe(true);
  });
  it('does not classify a historical sword by its unknown unique ID', () => {
    const old = { ...ordinary, uniqueId: 'items/unique/ormus-charm' };
    expect(uniqueOwners({ backpack: [old, old], stash: [], equipped: {} }, {})).toBe(true);
  });
});
