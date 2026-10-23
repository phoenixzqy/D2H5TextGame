import { describe, expect, it } from 'vitest';
import { loadItemBases } from '@/data/loaders/loot';
import type { Item, ItemBase, Rarity } from '../types/items';
import {
  effectiveSocketCapacity, isItemSocketStateValid, migrateLegacyItemSocketState,
  validateItemServiceFields
} from './socket-capacity';

function base(id = 'items/base/wp1h-short-sword'): ItemBase {
  const result = loadItemBases().get(id);
  if (!result) throw new Error(`Missing test base ${id}`);
  return result;
}

function item(overrides: Partial<Item> = {}): Item {
  return {
    id: 'legacy-instance', baseId: 'items/base/wp1h-short-sword', rarity: 'normal',
    level: 1, identified: true, equipped: false, socketCapacity: 2, ...overrides
  };
}

function malformed(overrides: Record<string, unknown>): Item {
  return { ...item(), ...overrides } as unknown as Item;
}

describe('native item socket capacity', () => {
  it('uses the own instance capacity, including zero, rather than template sockets', () => {
    expect(effectiveSocketCapacity(item({ socketCapacity: 0 }), base())).toBe(0);
    expect(effectiveSocketCapacity(item({ socketCapacity: 1 }), base())).toBe(1);
    expect(effectiveSocketCapacity(item(), base())).toBe(2);
  });

  it.each([undefined, null, '2', -1, 0.5, 3, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects malformed, absent and excessive gear capacity %o', socketCapacity => {
    const source = malformed({ socketCapacity });
    expect(() => effectiveSocketCapacity(source, base())).toThrow();
    expect(isItemSocketStateValid(source, base())).toBe(false);
    expect(() => { validateItemServiceFields(source, base()); }).toThrow();
  });

  it('requires an own capacity and refuses accessor capacity without invoking it', () => {
    const source = item();
    const { socketCapacity: _ignored, ...withoutCapacity } = source;
    expect(isItemSocketStateValid(withoutCapacity, base())).toBe(false);
    const inherited = Object.assign(Object.create({ socketCapacity: 2 }) as Item, withoutCapacity);
    expect(isItemSocketStateValid(inherited, base())).toBe(false);
    let reads = 0;
    const accessor = Object.defineProperty(withoutCapacity, 'socketCapacity', {
      enumerable: true, get: () => { reads++; return 2; }
    });
    expect(isItemSocketStateValid(accessor, base())).toBe(false);
    expect(reads).toBe(0);
  });

  it.each([undefined, null, -1, 7, 1.5, NaN, Infinity])('requires a reviewed safe base maximum %o', maxSockets => {
    const invalidBase = { ...base(), maxSockets } as unknown as ItemBase;
    expect(isItemSocketStateValid(item(), invalidBase)).toBe(false);
  });

  it('requires the actual item base and accepts reviewed maximum six', () => {
    expect(isItemSocketStateValid(item(), base('items/base/armor-leather'))).toBe(false);
    const source = item({ baseId: 'items/base/wp2h-thunder-maul', socketCapacity: 6 });
    expect(effectiveSocketCapacity(source, base(source.baseId))).toBe(6);
  });

  it.each(['normal', 'magic', 'rare', 'unique', 'set'] as const)('allows bounded empty/partial rune slots on %s gear', rarity => {
    expect(isItemSocketStateValid(item({ rarity, runes: [] }), base())).toBe(true);
    expect(isItemSocketStateValid(item({ rarity, runes: ['runes/el'] }), base())).toBe(true);
  });

  it.each([
    ['el'], ['runes/nonexistent'], ['runes/el', 'runes/tir', 'runes/eth'],
    [undefined], 'runes/el', null, new Array<string>(1)
  ])('rejects nonexistent rune IDs, excess runes or malformed arrays %o', runes => {
    expect(isItemSocketStateValid(malformed({ runes }), base())).toBe(false);
  });

  it('checks runewords with the full real recipe catalog and exact capacity/base/order', () => {
    // Steel is outside the matcher\'s three built-in demonstration recipes.
    const steel = item({ runes: ['runes/tir', 'runes/el'], runewordId: 'runewords/steel' });
    expect(isItemSocketStateValid(steel, base())).toBe(true);
    expect(isItemSocketStateValid({ ...steel, rarity: 'runeword' }, base())).toBe(true);
    expect(isItemSocketStateValid({ ...steel, socketCapacity: 1 }, base())).toBe(false);
    expect(isItemSocketStateValid({ ...steel, runes: ['runes/el', 'runes/tir'] }, base())).toBe(false);
    expect(isItemSocketStateValid({ ...steel, runewordId: 'rw_steel' }, base())).toBe(false);
    expect(isItemSocketStateValid({ ...steel, baseId: 'items/base/armor-leather' }, base('items/base/armor-leather'))).toBe(false);
    const fourSlots = item({ ...steel, baseId: 'items/base/wp1h-phase-blade', socketCapacity: 4 });
    expect(isItemSocketStateValid(fourSlots, base(fourSlots.baseId))).toBe(false);
  });

  it.each(['magic', 'rare', 'unique', 'set'] as const)('refuses runewords on %s gear', rarity => {
    expect(isItemSocketStateValid(item({ rarity, runes: ['runes/tir', 'runes/el'], runewordId: 'runewords/steel' }), base())).toBe(false);
  });

  it('requires a runeword rarity to carry its exact matched ID', () => {
    expect(isItemSocketStateValid(item({ rarity: 'runeword', runes: ['runes/tir', 'runes/el'] }), base())).toBe(false);
    expect(isItemSocketStateValid(item({ runewordId: 'runewords/steel' }), base())).toBe(false);
  });

  it('allows non-gear omitted/zero capacity and forbids all socket/rune/runeword state', () => {
    const jewelryBase = base('items/base/ring');
    const { socketCapacity: _ignored, ...jewelry } = item({ baseId: jewelryBase.id });
    expect(effectiveSocketCapacity(jewelry, jewelryBase)).toBe(0);
    expect(isItemSocketStateValid({ ...jewelry, socketCapacity: 0 }, jewelryBase)).toBe(true);
    for (const fields of [{ socketCapacity: 1 }, { runes: [] }, { runewordId: 'runewords/steel' }, { rarity: 'runeword' as Rarity }]) {
      expect(isItemSocketStateValid({ ...jewelry, ...fields }, jewelryBase)).toBe(false);
    }
  });
});

describe('persisted personalization fields', () => {
  it('allows a closed own identity with exact trimmed 1..16 UTF-16 code unit name', () => {
    for (const name of ['A', '英雄', '😀'.repeat(8), '<Hero>']) {
      const source = item({ personalizedBy: { characterId: 'hero', name } });
      expect(() => { validateItemServiceFields(source, base()); }).not.toThrow();
    }
  });

  it.each([
    null, {}, { characterId: '', name: 'Hero' }, { characterId: 1, name: 'Hero' },
    { characterId: 'hero', name: '' }, { characterId: 'hero', name: ' Hero' },
    { characterId: 'hero', name: 'Hero ' }, { characterId: 'hero', name: '😀'.repeat(9) },
    { characterId: 'hero', name: 'Hero', extra: true },
    Object.create({ characterId: 'hero', name: 'Hero' }) as unknown,
    { characterId: 'hero', name: undefined }
  ])('rejects malformed persisted identity %o', personalizedBy => {
    expect(() => { validateItemServiceFields(malformed({ personalizedBy }), base()); }).toThrow();
  });

  it('rejects inherited, accessor and non-enumerable identity fields without getters', () => {
    let reads = 0;
    const identity = Object.defineProperty({ characterId: 'hero' }, 'name', {
      enumerable: true, get: () => { reads++; return 'Hero'; }
    });
    expect(() => { validateItemServiceFields(malformed({ personalizedBy: identity }), base()); }).toThrow();
    const hidden = Object.defineProperty({ characterId: 'hero' }, 'name', { value: 'Hero' });
    expect(() => { validateItemServiceFields(malformed({ personalizedBy: hidden }), base()); }).toThrow();
    expect(reads).toBe(0);
  });
});

describe('legacy socket migration', () => {
  it('preserves literal identity, stats and runes without mutation, using old template capacity', () => {
    const { socketCapacity: _ignored, ...source } = item({
      runes: ['runes/tir', 'runes/el'], rarity: 'runeword', runewordId: 'runewords/steel',
      statRolls: { attack: 12.5 }, baseRolls: { attack: 7.25 }
    });
    Object.freeze(source);
    const result = migrateLegacyItemSocketState(source, base());
    expect(result).toEqual({ ...source, socketCapacity: 2 });
    expect(result?.runes).toBe(source.runes);
    expect(result?.statRolls).toBe(source.statRolls);
    expect(result?.baseRolls).toBe(source.baseRolls);
    expect(Object.hasOwn(source, 'socketCapacity')).toBe(false);
    expect(migrateLegacyItemSocketState(source, base())).toEqual(result);
  });

  it('uses old zero fallback only during migration without deriving capacity from rune count', () => {
    const trainingBase = base('items/base/weapon-bow-training');
    const { socketCapacity: _ignored, ...source } = item({ baseId: trainingBase.id });
    const noOldSockets = { ...trainingBase };
    delete (noOldSockets as { sockets?: number }).sockets;
    expect(migrateLegacyItemSocketState(source, noOldSockets)).toEqual({ ...source, socketCapacity: 0 });
    expect(migrateLegacyItemSocketState({ ...source, runes: ['runes/el'] }, noOldSockets)).toBeNull();
  });

  it.each([
    { runes: ['runes/tir', 'runes/el', 'runes/eth'] },
    { runes: ['old-unknown-rune'] }, { runewordId: 'unknown-old-runeword' },
    { rarity: 'runeword' as Rarity }, { socketCapacity: 1 },
    { personalizedBy: { characterId: 'hero', name: 'Hero' } }
  ])('returns null for quarantine rather than rewriting impossible or reserved legacy state %o', fields => {
    const { socketCapacity: _ignored, ...legacy } = item();
    const source = { ...legacy, ...fields };
    const before = structuredClone(source);
    expect(migrateLegacyItemSocketState(source, base())).toBeNull();
    expect(source).toEqual(before);
  });

  it('leaves non-gear capacity omitted and refuses foreign bases', () => {
    const { socketCapacity: _ignored, ...source } = item({ baseId: 'items/base/ring' });
    expect(migrateLegacyItemSocketState(source, base(source.baseId))).toEqual(source);
    expect(migrateLegacyItemSocketState(source, base())).toBeNull();
  });
});
