import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import * as loot from '@/data/loaders/loot';
import type { EquipmentSlot, ItemBase, WeaponType } from '@/engine/types/items';
import * as overrides from './imageOverrides';
import { BASE_ITEM_ICONS, UNIQUE_ITEM_ICONS } from './generatedAssetMaps';
import { resolveItemIcon } from './cardAssets';
import { getItemIconUrl } from './imageHelpers';

afterEach(() => { vi.restoreAllMocks(); });
const item = (baseId: string) => ({ baseId, rarity: 'normal', equipSlot: 'weapon' });
const realBases = loot.loadItemBases();
function withBase(base: ItemBase): void {
  vi.spyOn(loot, 'loadItemBases').mockReturnValue(new Map([...realBases, [base.id, base]]));
}

describe('instance item art identity', () => {
  it('preserves unique art before the concrete base and generic hints', () => {
    const unique = { ...item('items/base/helm-cap'), uniqueId: 'items/unique/biggin-bonnet' };
    expect(getItemIconUrl(unique)).toBe(UNIQUE_ITEM_ICONS['biggin-bonnet']);
    expect(getItemIconUrl(unique)).not.toBe(resolveItemIcon(unique.baseId));
  });

  it('falls back from missing unique art to its concrete bow base', () => {
    expect(getItemIconUrl({ ...item('items/base/weapon-bow'), uniqueId: 'items/unique/no-art' })).toBe(BASE_ITEM_ICONS.bow);
  });

  it('uses concrete metadata before weapon and shield hints', () => {
    expect(getItemIconUrl(item('items/base/weapon-bow'))).toBe(BASE_ITEM_ICONS.bow);
    expect(getItemIconUrl({ ...item('items/base/weapon-crossbow'), itemType: 'sword' })).toBe(BASE_ITEM_ICONS.bow);
    expect(getItemIconUrl({ ...item('items/base/weapon-dagger'), equipSlot: 'offhand' })).toBe(BASE_ITEM_ICONS.dagger);
  });

  it('preserves identity precedence and post-strip override keys', () => {
    const pins: Record<string, string> = {
      'unique/biggin-bonnet': '/unique-pin.png',
      'base/helm-cap': '/base-pin.png',
      'test/helm': '/set-pin.png',
      'test-word': '/word-pin.png'
    };
    vi.spyOn(overrides, 'getImageOverride').mockImplementation((kind, key) => kind === 'item' ? pins[key] ?? null : null);
    const unique = { ...item('items/base/helm-cap'), uniqueId: 'items/unique/biggin-bonnet', setPieceId: 'sets/test/helm', runewordId: 'runewords/test-word' };
    expect(getItemIconUrl(unique)).toBe('/unique-pin.png');
    expect(getItemIconUrl({ ...item(unique.baseId), setPieceId: unique.setPieceId, runewordId: unique.runewordId })).toBe('/set-pin.png');
    expect(getItemIconUrl({ ...item(unique.baseId), runewordId: unique.runewordId })).toBe('/word-pin.png');
    delete pins['unique/biggin-bonnet'];
    expect(getItemIconUrl(unique)).toBe(UNIQUE_ITEM_ICONS['biggin-bonnet']);
    expect(getItemIconUrl({ ...item('items/base/helm-cap'), uniqueId: 'items/unique/no-art' })).toBe('/base-pin.png');
  });

  it.each<[WeaponType, string]>([
    ['sword', 'sword'], ['axe', 'axe'], ['mace', 'mace'], ['dagger', 'dagger'],
    ['spear', 'staff'], ['polearm', 'staff'], ['staff', 'staff'], ['wand', 'staff'],
    ['scepter', 'staff'], ['orb', 'staff'], ['bow', 'bow'], ['crossbow', 'bow'], ['throwing', 'dagger']
  ])('uses %s metadata despite a misleading slug and offhand hint', (weaponType, icon) => {
    const base: ItemBase = { id: 'items/base/wp1h-misleading-sword', name: 'test', type: 'weapon', slot: 'offhand', weaponType, reqLevel: 1, canHaveAffixes: true };
    withBase(base);
    expect(resolveItemIcon(base.id)).toBe(BASE_ITEM_ICONS[icon]);
    expect(getItemIconUrl({ ...item(base.id), equipSlot: 'offhand' })).toBe(BASE_ITEM_ICONS[icon]);
  });

  it.each<[EquipmentSlot, string]>([
    ['head', 'helm'], ['chest', 'armor'], ['gloves', 'gloves'], ['belt', 'belt'],
    ['boots', 'boots'], ['amulet', 'amulet'], ['ring-left', 'ring'], ['ring-right', 'ring'], ['offhand', 'shield']
  ])('uses authored %s nonweapon slot metadata', (slot, icon) => {
    const base: ItemBase = { id: 'items/base/wp1h-misleading-sword', name: 'test', type: 'armor', slot, reqLevel: 1, canHaveAffixes: true };
    withBase(base);
    expect(resolveItemIcon(base.id)).toBe(BASE_ITEM_ICONS[icon]);
    expect(getItemIconUrl(item(base.id))).toBe(BASE_ITEM_ICONS[icon]);
  });

  it('does not guess from a known but unclassifiable base or generic hints', () => {
    const base: ItemBase = { id: 'items/base/wp1h-misleading-sword', name: 'test', type: 'material', slot: null, reqLevel: 1, canHaveAffixes: false };
    withBase(base);
    expect(resolveItemIcon(base.id)).toBeNull();
    expect(getItemIconUrl(item(base.id))).toBeNull();
  });

  it('retains legacy aliases and definition recipes without changing their ID space', () => {
    expect(resolveItemIcon('unique.shako')).toBe(UNIQUE_ITEM_ICONS.shako);
    expect(resolveItemIcon('items/unique.shako')).toBe(UNIQUE_ITEM_ICONS.shako);
    expect(resolveItemIcon('items/base/weapon-polearm')).toBe(BASE_ITEM_ICONS.staff);
    expect(resolveItemIcon('runewords/steel')).toBe(BASE_ITEM_ICONS.rune);
    expect(resolveItemIcon('sets/test', { setItemIds: ['sets/test/helm'] })).toBe(BASE_ITEM_ICONS.helm);
    expect(getItemIconUrl({ ...item('items/base/weapon-bow'), setPieceId: 'sets/test/bow' })).toBe(BASE_ITEM_ICONS.bow);
    expect(getItemIconUrl({ ...item('items/base/weapon-bow'), runewordId: 'runewords/steel' })).toBe(BASE_ITEM_ICONS.bow);
    expect(getItemIconUrl({ ...item('legacy'), equipSlot: 'offhand' })).toBe(BASE_ITEM_ICONS.shield);
    expect(getItemIconUrl({ baseId: '', rarity: 'normal' })).toBeNull();
    expect(resolveItemIcon('items/normal.unknown')).toBeNull();
  });

  it('resolves every shipped base through both APIs to an existing generated file', () => {
    for (const base of realBases.values()) {
      const url = resolveItemIcon(base.id);
      expect(url, base.id).not.toBeNull();
      expect(getItemIconUrl(item(base.id)), base.id).toBe(url);
      expect(existsSync(`public${url ?? ''}`), base.id).toBe(true);
    }
  });
});
