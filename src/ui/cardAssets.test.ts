import { describe, it, expect, vi } from 'vitest';
import {
  resolveClassPortrait,
  resolveMonsterArt,
  resolveItemIcon,
  resolveZoneArt,
  resolveMercArt
} from './cardAssets';

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

  it('returns null silently for unmapped item bases', () => {
    expect(resolveItemIcon('items/normal.crystal-sword')).toBeNull();
  });

  it('resolves a known unique item', () => {
    expect(resolveItemIcon('unique.shako')).toMatch(/unique\.shako\.png$/);
    expect(resolveItemIcon('items/unique.shako')).toMatch(/unique\.shako\.png$/);
  });

  it('resolves zones', () => {
    expect(resolveZoneArt('zones/act1.rogue-encampment')).toMatch(/rogue-encampment\.png$/);
  });

  it('resolves merc art via canonical archetype', () => {
    expect(resolveMercArt('rogue-archer')).toMatch(/classes\.amazon\.png$/);
  });

  it('resolves merc art via prefix rule', () => {
    expect(resolveMercArt('mercs/act1-rogue-pierce')).toMatch(/classes\.amazon\.png$/);
    expect(resolveMercArt('act3-iron-wolf-fire')).toMatch(/classes\.sorceress\.png$/);
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
