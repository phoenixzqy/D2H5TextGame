import { describe, expect, it } from 'vitest';
import type { Item } from '@/engine/types/items';
import type { IronGolemOwnership } from './ironGolemSelection';
import { captureIronGolemDebit, classifyIronGolemDebit, type IronGolemDebitIntent } from './ironGolemDebit';

function item(id: string): Item {
  return { id, baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1,
    identified: true, equipped: false };
}
function ownership(overrides: Partial<IronGolemOwnership> = {}): IronGolemOwnership {
  return { backpack: [item('before'), item('selected'), item('after')], stash: [item('stash')],
    equipped: { head: item('head') }, mercEquipment: { orphan: { weapon: item('merc') } }, ...overrides };
}
const selection = Object.freeze({ heroId: 'hero', itemId: 'selected' });
function capture(input: IronGolemOwnership): IronGolemDebitIntent {
  const result = captureIronGolemDebit('hero', selection, input);
  if (!result.ok) throw new Error(result.reason);
  return result.intent;
}

describe('pure exact Iron Golem debit capture', () => {
  it.each([0, 1, 2])('prepares only the selected index %i preserving every other item reference and order', index => {
    const backpack = [item('first'), item('middle'), item('last')];
    const chosen = backpack[index];
    if (!chosen) throw new Error('fixture index');
    const explicit = { heroId: 'hero', itemId: chosen.id };
    const input = ownership({ backpack });
    const before = structuredClone(input);
    const result = captureIronGolemDebit('hero', explicit, input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const intent = result.intent;
    expect(intent.selection).toBe(explicit);
    expect(intent.item).toBe(chosen);
    expect(intent.index).toBe(index);
    expect(intent.expectedBackpack).not.toBe(backpack);
    expect(intent.expectedBackpack).toEqual(backpack.filter((_, i) => i !== index));
    intent.expectedBackpack.forEach((remaining, offset) => {
      expect(remaining).toBe(backpack[offset < index ? offset : offset + 1]);
    });
    for (const key of ['backpack', 'stash', 'equipped', 'mercEquipment'] as const) {
      expect(intent.original[key]).toBe(input[key]);
    }
    expect(input).toEqual(before);
  });

  it('prepares an empty new array for the sole selected item', () => {
    const input = ownership({ backpack: [item('selected')] });
    const intent = capture(input);
    expect(intent.index).toBe(0);
    expect(intent.expectedBackpack).toEqual([]);
    expect(classifyIronGolemDebit(intent, { ...input, backpack: intent.expectedBackpack })).toBe('committed');
  });

  it('freezes owned intent/view/expected array without freezing caller containers, selection or items', () => {
    const input = ownership();
    const explicit = { ...selection };
    const result = captureIronGolemDebit('hero', explicit, input);
    if (!result.ok) throw new Error(result.reason);
    expect(Object.isFrozen(result.intent)).toBe(true);
    expect(Object.isFrozen(result.intent.original)).toBe(true);
    expect(Object.isFrozen(result.intent.expectedBackpack)).toBe(true);
    expect(() => { Object.assign(result.intent.expectedBackpack, { 0: item('forged') }); }).toThrow(TypeError);
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(input.backpack)).toBe(false);
    expect(Object.isFrozen(input.stash)).toBe(false);
    expect(Object.isFrozen(input.equipped)).toBe(false);
    expect(Object.isFrozen(input.mercEquipment)).toBe(false);
    expect(Object.isFrozen(result.intent.item)).toBe(false);
    expect(Object.isFrozen(explicit)).toBe(false);
  });

  it('works with frozen caller inputs and leaves their contents intact', () => {
    const input = ownership();
    input.backpack.forEach(Object.freeze);
    Object.freeze(input.backpack);
    Object.freeze(input.stash);
    Object.freeze(input.equipped);
    Object.freeze(input.mercEquipment);
    Object.freeze(input);
    const before = structuredClone(input);
    const intent = capture(input);
    expect(classifyIronGolemDebit(intent, input)).toBe('original');
    expect(input).toEqual(before);
  });

  it.each([
    { heroId: 'hero', explicit: null, input: ownership(), reason: 'noSelection' },
    { heroId: null, explicit: selection, input: ownership(), reason: 'heroMismatch' },
    { heroId: 'other', explicit: selection, input: ownership(), reason: 'heroMismatch' },
    { heroId: 'hero', explicit: selection, input: ownership({ backpack: [item('other')] }), reason: 'notInBackpack' },
    { heroId: 'hero', explicit: selection, input: ownership({ backpack: [], stash: [item('selected')] }), reason: 'notInBackpack' },
    { heroId: 'hero', explicit: selection, input: ownership({ backpack: [item('selected'), item('selected')] }), reason: 'duplicateItem' },
    { heroId: 'hero', explicit: selection, input: ownership({ stash: [item('selected')] }), reason: 'duplicateItem' },
    { heroId: 'hero', explicit: selection, input: ownership({ equipped: { weapon: item('selected') } }), reason: 'duplicateItem' },
    { heroId: 'hero', explicit: selection, input: ownership({ mercEquipment: { orphan: { head: item('selected') } } }), reason: 'duplicateItem' }
  ])('retains ownership resolver refusal $reason', ({ heroId, explicit, input, reason }) => {
    const before = structuredClone(input);
    expect(captureIronGolemDebit(heroId, explicit, input)).toEqual({ ok: false, reason });
    expect(input).toEqual(before);
  });

  it('does not authorize eligibility, resources or engine success merely by capturing ownership', () => {
    const input = ownership({ backpack: [{ ...item('selected'), identified: false, equipped: true }] });
    expect(captureIronGolemDebit('hero', selection, input).ok).toBe(true);
    expect(input.backpack).toHaveLength(1);
  });
});

describe('exact post-notification debit observation', () => {
  it('recognizes original ownership through a newly assembled view', () => {
    const input = ownership();
    const intent = capture(input);
    expect(classifyIronGolemDebit(intent, { ...input })).toBe('original');
  });

  it('recognizes only the captured expected array with all other original roots', () => {
    const input = ownership();
    const intent = capture(input);
    const live = { ...input, backpack: intent.expectedBackpack };
    expect(classifyIronGolemDebit(intent, live)).toBe('committed');
    expect(classifyIronGolemDebit(intent, live)).toBe('committed');
    expect(input.backpack[1]).toBe(intent.item);
  });

  it.each(['originalCopy', 'expectedCopy', 'absence', 'replacement'] as const)(
    'classifies a third backpack reference as conflict: %s', kind => {
      const input = ownership();
      const intent = capture(input);
      const backpack = kind === 'originalCopy' ? [...input.backpack]
        : kind === 'expectedCopy' ? [...intent.expectedBackpack]
        : kind === 'absence' ? input.backpack.filter(value => value.id !== 'selected')
        : [item('replacement')];
      expect(classifyIronGolemDebit(intent, { ...input, backpack })).toBe('conflict');
    });

  it.each(['stash', 'equipped', 'mercEquipment'] as const)(
    'refuses changed %s root for both original and expected backpack', key => {
      const input = ownership();
      const intent = capture(input);
      const changed = { ...input, [key]: key === 'stash' ? [...input.stash] : { ...input[key] } };
      expect(classifyIronGolemDebit(intent, changed)).toBe('conflict');
      expect(classifyIronGolemDebit(intent, { ...changed, backpack: intent.expectedBackpack })).toBe('conflict');
    });

  it.each(['remove', 'replace', 'reorder', 'append'] as const)(
    'detects unsupported original-array mutation before classifying: %s', operation => {
      const backpack = [item('before'), item('selected'), item('after')];
      const input = ownership({ backpack });
      const intent = capture(input);
      if (operation === 'remove') backpack.splice(1, 1);
      if (operation === 'replace') backpack[1] = { ...intent.item };
      if (operation === 'reorder') backpack.reverse();
      if (operation === 'append') backpack.push(item('extra'));
      expect(classifyIronGolemDebit(intent, input)).toBe('conflict');
      expect(classifyIronGolemDebit(intent, { ...input, backpack: intent.expectedBackpack })).toBe('conflict');
    });

  it('detects in-place replacement of an unrelated item even with the selected reference intact', () => {
    const backpack = [item('before'), item('selected'), item('after')];
    const input = ownership({ backpack });
    const intent = capture(input);
    backpack[0] = item('before');
    expect(classifyIronGolemDebit(intent, input)).toBe('conflict');
  });
});
