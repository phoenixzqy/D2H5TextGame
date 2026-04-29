/**
 * Tests for image-path helpers — focused on the merc portrait fix
 * (Bug #1, fix/combat-map-screen-bugs branch).
 */
import { describe, it, expect } from 'vitest';
import { getMercPortraitUrl, getClassPortraitUrl } from './imageHelpers';
import { loadMercPool } from '@/data/loaders/mercs';

describe('getMercPortraitUrl', () => {
  it('returns a non-empty URL distinct from any class portrait for every shipped merc', () => {
    const pool = loadMercPool().pool;
    expect(pool.length).toBeGreaterThan(0);
    const classPortrait = getClassPortraitUrl('necromancer');
    for (const def of pool) {
      const url = getMercPortraitUrl(def.id);
      expect(url, `merc ${def.id} should resolve a portrait`).toBeTruthy();
      expect(url).not.toBe(classPortrait);
      // Should reference the asset path declared on the def.
      expect(url).toContain(def.portraitAsset.split('/').pop() ?? '');
      // Should be web-rooted.
      expect(url?.startsWith('/')).toBe(true);
    }
  });

  it('returns null for unknown merc ids (caller renders fallback)', () => {
    expect(getMercPortraitUrl('mercs/does-not-exist')).toBeNull();
    expect(getMercPortraitUrl('')).toBeNull();
  });
});
