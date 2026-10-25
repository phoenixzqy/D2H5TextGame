import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import { loadTownNpcs } from '@/data/loaders/towns';
import { getNpcPortraitUrl } from './imageHelpers';

it('returns only real local portraits for all authored town NPCs in all five acts', () => {
  let portraits = 0;
  for (const act of [1, 2, 3, 4, 5]) for (const npc of loadTownNpcs(act)) {
    const url = getNpcPortraitUrl(npc.portraitId, act);
    if (url !== null) {
      expect(url).toMatch(/^\/assets\/d2\/generated\/class-portraits\//);
      expect(existsSync(resolve(process.cwd(), 'public', url.slice(1))), url).toBe(true);
      portraits++;
    }
  }
  expect(portraits).toBeGreaterThan(0);
});

it('uses immediate fallback for missing portraits without inventing a request', () => {
  for (const id of ['', 'warriv', 'unknown-npc']) expect(getNpcPortraitUrl(id, 1)).toBeNull();
  expect(getNpcPortraitUrl('atma', 2)).toBeNull();
});

it('preserves the real portrait identity and refuses a portrait from another act', () => {
  expect(getNpcPortraitUrl('Akara', 1)).toBe('/assets/d2/generated/class-portraits/npcs.act1.akara.png');
  expect(getNpcPortraitUrl('akara', 2)).toBeNull();
});
