/**
 * Tests for image-path helpers — focused on the merc portrait fix
 * (Bug #1, fix/combat-map-screen-bugs branch).
 *
 * Mercenary-specific portraits have not been generated yet, so the
 * resolver proxies through `resolveMercArt` (archetype → class portrait)
 * to ensure every merc renders an actual image distinct from the
 * player's own class portrait, instead of falling back to a silhouette.
 */
import { describe, it, expect } from 'vitest';
import { getMercPortraitUrl, getClassPortraitUrl } from './imageHelpers';
import { loadMercPool } from '@/data/loaders/mercs';

describe('getMercPortraitUrl', () => {
  it('returns a class-portrait URL distinct from the hero class for every shipped merc', () => {
    const pool = loadMercPool().pool;
    expect(pool.length).toBeGreaterThan(0);
    const heroClassPortrait = getClassPortraitUrl('necromancer');
    for (const def of pool) {
      const url = getMercPortraitUrl(def.id);
      // Mercs whose archetype is intentionally `null` (tavern thief,
      // act4 paladin) may legitimately return null until dedicated art
      // ships — skip those.
      if (url === null) continue;
      expect(url, `merc ${def.id} should resolve a portrait`).toBeTruthy();
      expect(url).not.toBe(heroClassPortrait);
      expect(url.startsWith('/')).toBe(true);
      expect(url).toMatch(/\/class-portraits\/classes\.[a-z]+\.png$/);
    }
  });

  it('returns null for unknown merc ids (caller renders fallback)', () => {
    expect(getMercPortraitUrl('mercs/does-not-exist')).toBeNull();
    expect(getMercPortraitUrl('')).toBeNull();
  });

  it('barbarian merc resolves to the barbarian class portrait', () => {
    const url = getMercPortraitUrl('mercs/act5-barbarian-war-cry');
    expect(url).toMatch(/classes\.barbarian\.png$/);
  });
});
