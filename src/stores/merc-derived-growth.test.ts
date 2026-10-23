import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from './mercFactory';
import { mercXpForLevel, useMercStore } from './mercStore';

beforeEach(() => { useMercStore.getState().reset(); });

it('publishes earned level-16 Rogue offense and capacity without equipment or a mana refill', () => {
  const def = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-inner-sight');
  if (!def) throw new Error('Missing authored Inner Sight Rogue');
  const hired = createMercFromDef(def);
  useMercStore.getState().addMerc(hired);
  let xp = 0;
  for (let level = hired.level; level < 16; level++) xp += mercXpForLevel(level);
  expect(useMercStore.getState().addExperience(hired.id, xp)).toEqual({ levelsGained: 13, newLevel: 16 });
  const grown = useMercStore.getState().ownedMercs[0];
  if (!grown) throw new Error('Missing earned Rogue');
  expect(grown.coreStats).toEqual({ strength: 25, dexterity: 61, vitality: 16, energy: 27 });
  expect(grown.derivedStats).toEqual({ ...hired.derivedStats,
    life: 252, lifeMax: 252, mana: 79, manaMax: 150,
    attack: 70, defense: 65, attackSpeed: 161, physDodge: .172 });
  expect(hired.derivedStats.attack).toBe(25);
});
