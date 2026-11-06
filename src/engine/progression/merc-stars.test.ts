import { expect, it } from 'vitest';
import type { Mercenary } from '../types/entities';
import { deriveStats } from './stats';
import { growMercenary } from './merc-growth';
import { mercSignatureRank, projectMercenaryStars } from './merc-stars';

const core = { strength: 10, dexterity: 20, vitality: 30, energy: 40 };
const merc: Mercenary = { id: 'legacy-test-rogue', name: 'Test', type: 'mercenary', team: 'player',
  level: 1, classId: 'rogue', archetype: 'back', rarity: 'R', coreStats: core,
  derivedStats: { ...deriveStats(core, 1), life: 19, mana: 11 }, statusEffects: [], cooldowns: [],
  skills: [], comboOrder: [], alive: true, turnOrder: 0, equipment: [] };
it.each([-1, 6, 1.5, NaN, Infinity])('refuses invalid stars %s in stats and signature rank', stars => {
  expect(() => projectMercenaryStars(merc, stars)).toThrow(RangeError);
  expect(() => mercSignatureRank(stars)).toThrow(RangeError);
});
it('projects natural level growth once, without saving stars into that growth', () => {
  const grown = growMercenary(merc, 3), before = structuredClone(grown);
  const projected = projectMercenaryStars(grown, 5);
  expect(projected.coreStats.strength).toBeCloseTo(grown.coreStats.strength * 1.4, 12);
  expect(projected.derivedStats.lifeMax).toBeCloseTo(grown.derivedStats.lifeMax * 1.4, 12);
  expect(projected.derivedStats.life).toBe(grown.derivedStats.life);
  expect(projected.derivedStats.mana).toBe(11);
  expect(grown).toEqual(before); expect(projectMercenaryStars(grown, 5)).toEqual(projected);
  expect(projectMercenaryStars(grown, 0)).toBe(grown);
  expect(mercSignatureRank(5)).toBe(6);
});
