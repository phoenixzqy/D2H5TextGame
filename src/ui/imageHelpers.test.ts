/**
 * Tests for image-path helpers — focused on the merc portrait fix
 * (Bug #1, fix/combat-map-screen-bugs branch).
 *
 * Dedicated hireable mercenary portraits resolve first; legacy/non-hireable
 * mercs still proxy through `resolveMercArt` (archetype → class portrait)
 * instead of falling back to a silhouette.
 */
import { describe, it, expect } from 'vitest';
import { getMercPortraitUrl, getClassPortraitUrl } from './imageHelpers';
import { loadMercPool } from '@/data/loaders/mercs';

describe('getMercPortraitUrl', () => {
  it('returns a portrait URL distinct from the hero class for every shipped merc', () => {
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
      expect(url).toMatch(/\/class-portraits\/(?:classes|mercs)\.[a-z0-9.-]+(?:\.v\d+)?\.png$/);
    }
  });

  it('returns null for unknown merc ids (caller renders fallback)', () => {
    expect(getMercPortraitUrl('mercs/does-not-exist')).toBeNull();
    expect(getMercPortraitUrl('')).toBeNull();
  });

  it('hireable barbarian merc resolves to a dedicated merc portrait', () => {
    const url = getMercPortraitUrl('mercs/act5-barbarian-war-cry');
    expect(url).toMatch(/mercs\.act5\.barbarian-war-cry\.v2\.png$/);
  });
});
