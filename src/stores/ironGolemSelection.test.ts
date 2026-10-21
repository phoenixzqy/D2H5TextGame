import { describe, expect, it } from 'vitest';
import type { Item } from '@/engine/types/items';
import { resolveIronGolemSelection, type IronGolemOwnership } from './ironGolemSelection';

function item(id = 'selected', overrides: Partial<Item> = {}): Item {
  return { id, baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1,
    identified: true, equipped: false, ...overrides };
}

function ownership(overrides: Partial<IronGolemOwnership> = {}): IronGolemOwnership {
  return { backpack: [item('before'), item(), item('after')], stash: [], equipped: {},
    mercEquipment: {}, ...overrides };
}

const selection = { heroId: 'hero', itemId: 'selected' };

describe('resolveIronGolemSelection', () => {
  it('returns the exact live backpack reference and index without changing any input', () => {
    const live = item('selected', { baseRolls: { attack: 6.25 } });
    const input = ownership({ backpack: [item('before'), live, item('after')],
      stash: [item('stash')], equipped: { head: null },
      mercEquipment: { fielded: { weapon: item('merc') }, reserve: {} } });
    const before = structuredClone(input);
    Object.freeze(live);
    Object.freeze(input.backpack);
    Object.freeze(input);
    Object.freeze(selection);
    const result = resolveIronGolemSelection('hero', selection, input);
    expect(result).toEqual({ ok: true, item: live, index: 1 });
    if (result.ok) expect(result.item).toBe(live);
    expect(input).toEqual(before);
    expect(resolveIronGolemSelection('hero', selection, input)).toEqual(result);
  });

  it('does not auto-select an eligible item when the instruction is absent', () => {
    expect(resolveIronGolemSelection('hero', null, ownership()))
      .toEqual({ ok: false, reason: 'noSelection' });
  });

  it.each([null, 'replacement', 'Hero'])('refuses a selection bound to another/no current hero %s', (heroId) => {
    expect(resolveIronGolemSelection(heroId, selection, ownership()))
      .toEqual({ ok: false, reason: 'heroMismatch' });
  });

  it('does not substitute a different item when the selected ID is absent', () => {
    expect(resolveIronGolemSelection('hero', selection, ownership({ backpack: [item('other')] })))
      .toEqual({ ok: false, reason: 'notInBackpack' });
  });

  it.each([
    { backpack: [], stash: [item()] },
    { backpack: [], equipped: { weapon: item() } },
    { backpack: [], mercEquipment: { reserve: { weapon: item() } } },
    { backpack: [item('Selected')] }
  ])('requires a case-sensitive backpack occurrence for %o', (overrides) => {
    expect(resolveIronGolemSelection('hero', selection, ownership(overrides)))
      .toEqual({ ok: false, reason: 'notInBackpack' });
  });

  it.each([
    { backpack: [item(), item()] },
    { stash: [item()] },
    { equipped: { weapon: item() } },
    { equipped: { 'ring-right': item() } },
    { mercEquipment: { fielded: { weapon: item() } } },
    { mercEquipment: { reserve: { offhand: item() } } },
    { mercEquipment: { 'orphan-not-in-owned-list': { head: item() } } },
    { backpack: [], stash: [item(), item()] },
    { backpack: [], equipped: { weapon: item(), head: item() } },
    { backpack: [], mercEquipment: { first: { weapon: item() }, second: { head: item() } } },
    { backpack: [], stash: [item()], mercEquipment: { reserve: { weapon: item() } } }
  ] satisfies Partial<IronGolemOwnership>[])('refuses duplicate selected IDs across occupied locations %o', (overrides) => {
    expect(resolveIronGolemSelection('hero', selection, ownership(overrides)))
      .toEqual({ ok: false, reason: 'duplicateItem' });
  });

  it.each(['backpack', 'stash', 'equipped', 'mercEquipment'] as const)('counts repeated object references in %s as separate locations', (container) => {
    const live = item();
    const overrides: Partial<IronGolemOwnership> = {
      backpack: container === 'backpack' ? [live, live] : [live],
      ...(container === 'stash' ? { stash: [live] } : {}),
      ...(container === 'equipped' ? { equipped: { weapon: live } } : {}),
      ...(container === 'mercEquipment' ? { mercEquipment: { reserve: { weapon: live } } } : {})
    };
    expect(resolveIronGolemSelection('hero', selection, ownership(overrides)))
      .toEqual({ ok: false, reason: 'duplicateItem' });
  });

  it('ignores unrelated duplicate IDs, empty slots and empty merc gear', () => {
    const live = item();
    const unrelated = item('unrelated');
    const result = resolveIronGolemSelection('hero', selection, ownership({ backpack: [live, unrelated],
      stash: [unrelated], equipped: { weapon: null, head: unrelated },
      mercEquipment: { first: {}, reserve: { weapon: unrelated, head: null } } }));
    expect(result).toEqual({ ok: true, item: live, index: 0 });
  });

  it('leaves item-local eligibility to the projection rather than wearing or historical slot checks', () => {
    const live = item('selected', { identified: false, equipped: true, equipSlot: 'weapon', level: 99 });
    expect(resolveIronGolemSelection('hero', selection, ownership({ backpack: [live] })))
      .toEqual({ ok: true, item: live, index: 0 });
  });

  it('applies no-selection and hero refusals before duplicate/location refusals', () => {
    const duplicate = ownership({ backpack: [item(), item()] });
    expect(resolveIronGolemSelection(null, null, duplicate)).toEqual({ ok: false, reason: 'noSelection' });
    expect(resolveIronGolemSelection(null, selection, duplicate)).toEqual({ ok: false, reason: 'heroMismatch' });
    expect(resolveIronGolemSelection('other', selection, duplicate)).toEqual({ ok: false, reason: 'heroMismatch' });
  });
});
