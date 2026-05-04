import { describe, it, expect, vi } from 'vitest';
import {
  resolveClassPortrait,
  resolveMonsterArt,
  resolveItemIcon,
  resolveZoneArt,
  resolveMercArt
} from './cardAssets';
import { loadItemBases } from '@/data/loaders/loot';
import uniquesJson from '@/data/items/uniques.json';
import setsJson from '@/data/items/sets.json';
import runesJson from '@/data/items/runes.json';
import runewordsJson from '@/data/items/runewords.json';

describe('cardAssets resolvers', () => {
  it('resolves class portraits by short id', () => {
    expect(resolveClassPortrait('barbarian')).toMatch(/classes\.barbarian\.png$/);
    expect(resolveClassPortrait('classes/sorceress')).toMatch(/classes\.sorceress\.png$/);
  });

  it('returns null + warns for unknown classes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(resolveClassPortrait('unknown-class')).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('strips monsters/ prefix', () => {
    expect(resolveMonsterArt('monsters/act1.fallen')).toMatch(/monsters\.act1\.fallen\.png$/);
    expect(resolveMonsterArt('act1.andariel')).toMatch(/bosses\.act1\.andariel\.png$/);
  });

  it('returns null silently for unmapped non-base item ids', () => {
    expect(resolveItemIcon('items/normal.crystal-sword')).toBeNull();
  });

  it('resolves every shipped base item to an icon', () => {
    const missing: string[] = [];
    for (const id of loadItemBases().keys()) {
      if (!resolveItemIcon(id)) missing.push(id);
    }
    expect(missing).toEqual([]);
  });

  it('resolves every dev item-manager entry to an existing generated icon path', () => {
    const missing: string[] = [];
    const assertIcon = (label: string, url: string | null): void => {
      if (!url) {
        missing.push(label);
        return;
      }
      expect(url).toMatch(/^\/assets\/d2\/generated\/item-icons\/items\.(?:base|unique)\.[a-z0-9.-]+\.png$/);
    };

    for (const id of loadItemBases().keys()) {
      assertIcon(id, resolveItemIcon(id));
    }
    for (const unique of uniquesJson) {
      assertIcon(unique.id, resolveItemIcon(unique.id, { baseId: unique.baseId }));
    }
    for (const setDef of setsJson) {
      assertIcon(setDef.id, resolveItemIcon(setDef.id, { setItemIds: setDef.items }));
      for (const piece of setDef.pieces) {
        assertIcon(piece.id, resolveItemIcon(piece.id, { baseId: piece.baseId }));
      }
    }
    for (const rune of runesJson) {
      assertIcon(rune.id, resolveItemIcon(rune.id));
    }
    for (const runeword of runewordsJson) {
      assertIcon(runeword.id, resolveItemIcon(runeword.id, { allowedBases: runeword.allowedBases }));
    }

    expect(missing).toEqual([]);
  });

  it('resolves jewelry and two-handed weapon base archetypes', () => {
    expect(resolveItemIcon('items/base/amu-tin')).toMatch(/items\.base\.amulet\.png$/);
    expect(resolveItemIcon('items/base/wp2h-great-axe')).toMatch(/items\.base\.axe\.png$/);
    expect(resolveItemIcon('items/base/wp2h-thunder-maul')).toMatch(/items\.base\.mace\.png$/);
    expect(resolveItemIcon('items/base/weapon-polearm')).toMatch(/items\.base\.staff\.png$/);
  });

  it('resolves a known unique item', () => {
    expect(resolveItemIcon('unique.shako')).toMatch(/unique\.shako\.png$/);
    expect(resolveItemIcon('items/unique.shako')).toMatch(/unique\.shako\.png$/);
  });

  it('resolves rune, runeword, and set definition icons without image-gen', () => {
    expect(resolveItemIcon('runes/el')).toMatch(/items\.base\.rune\.png$/);
    expect(resolveItemIcon('runewords/steel')).toMatch(/items\.base\.rune\.png$/);
    expect(resolveItemIcon('sets/angelic-raiment', { setItemIds: ['sets/angelic-raiment/amulet'] })).toMatch(/items\.base\.amulet\.png$/);
    expect(resolveItemIcon('sets/angelic-raiment/weapon', { baseId: 'items/base/wp1h-scimitar' })).toMatch(/items\.base\.sword\.png$/);
  });

  it('resolves zones', () => {
    expect(resolveZoneArt('zones/act1.rogue-encampment')).toMatch(/rogue-encampment\.png$/);
  });

  it('resolves merc art via canonical archetype', () => {
    expect(resolveMercArt('rogue-archer')).toMatch(/classes\.amazon\.png$/);
  });

  it('resolves dedicated merc portraits before archetype proxies', () => {
    expect(resolveMercArt('mercs/act1-rogue-fire')).toMatch(/mercs\.act1\.rogue-fire\.png$/);
    expect(resolveMercArt('act3-iron-wolf-lightning')).toMatch(/mercs\.act3\.iron-wolf-lightning\.v1\.png$/);
    expect(resolveMercArt('mercs/act5-barbarian-war-cry#instance-1')).toMatch(/mercs\.act5\.barbarian-war-cry\.v2\.png$/);
    expect(resolveMercArt('mercs/act3-iron-wolf-fire')).toMatch(/mercs\.act3\.iron-wolf-fire\.v3\.png$/);
  });

  it('resolves merc art via prefix rule', () => {
    expect(resolveMercArt('mercs/act1-rogue-pierce')).toMatch(/classes\.amazon\.png$/);
    expect(resolveMercArt('act3-iron-wolf-frozen-armor')).toMatch(/classes\.sorceress\.png$/);
    expect(resolveMercArt('act5-barbarian-cleave')).toMatch(/classes\.barbarian\.png$/);
  });

  it('returns null for explicitly null prefix rules', () => {
    expect(resolveMercArt('tavern-thief-x')).toBeNull();
    expect(resolveMercArt('act4-paladin-y')).toBeNull();
  });

  it('falls back to classRef as last resort', () => {
    expect(resolveMercArt('paladin')).toMatch(/classes\.paladin\.png$/);
  });
});
