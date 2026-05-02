import { describe, expect, it } from 'vitest';
import type { SubAreaDef } from '../types/maps';
import type { EliteConfigDef } from '../types/elite';
import { resolveWavePlan } from './sub-area-run';

const TEST_CONFIG: EliteConfigDef = {
  id: 'elite/default',
  normalChampionChance: 0.1,
  normalRareEliteChance: 0.02,
  rareEliteMagicFindBonus: 50,
  rareEliteResistanceBonus: 30,
  chapterBossHpMultiplier: 8,
  multipliers: {
    champion: { life: 3, attack: 1.5, defense: 1.3 },
    rareElite: { life: 4, attack: 2, defense: 1.3 },
    rareMinion: { life: 2, attack: 1.3, defense: 1.15 }
  },
  idle: {
    enabled: true,
    baseEliteChance: 0.12,
    championShareOfEliteRoll: 0.75,
    rareShareOfEliteRoll: 0.25,
    pityStartMisses: 4,
    pityStep: 0.04,
    pityChanceCap: 0.4,
    hardPityMisses: 11
  },
  affixes: [
    {
      id: 'elite-affix/extra-fire-damage',
      nameKey: 'combat.eliteAffix.extraFireDamage',
      skillId: 'monster-fire-ball'
    }
  ]
};

const TRASH_AREA: SubAreaDef = {
  id: 'areas/test-trash',
  name: 'Test Trash',
  actId: 'acts/act1',
  areaLevel: 2,
  hasBoss: false,
  lootTable: 'loot/trash-act1',
  waves: [
    {
      id: 'w1',
      type: 'trash',
      encounters: [
        {
          id: 'e1',
          level: 2,
          monsters: [{ archetypeId: 'monsters/act1.fallen', count: 4 }]
        }
      ]
    }
  ]
};

describe('random elite spawn planning', () => {
  it('is deterministic for the same run seed', () => {
    const a = resolveWavePlan(TRASH_AREA, 'monsters/act1.fallen', 2, 12345, TEST_CONFIG);
    const b = resolveWavePlan(TRASH_AREA, 'monsters/act1.fallen', 2, 12345, TEST_CONFIG);

    expect(a).toEqual(b);
  });

  it('rolls champion waves at roughly ten percent over 10k seeds', () => {
    let champion = 0;
    for (let seed = 1; seed <= 10_000; seed++) {
      const plan = resolveWavePlan(TRASH_AREA, 'monsters/act1.fallen', 2, seed, TEST_CONFIG);
      if (plan.waves[0]?.spawns.some((s) => s.tier === 'champion')) champion++;
    }

    const rate = champion / 10_000;
    expect(rate).toBeGreaterThanOrEqual(0.08);
    expect(rate).toBeLessThanOrEqual(0.12);
  });

  it('rare elite rolls replace trash with one rare and three affix-sharing minions', () => {
    const rareOnly: EliteConfigDef = {
      ...TEST_CONFIG,
      normalChampionChance: 0,
      normalRareEliteChance: 1
    };
    const plan = resolveWavePlan(TRASH_AREA, 'monsters/act1.fallen', 2, 7, rareOnly);
    const spawns = plan.waves[0]?.spawns ?? [];

    expect(spawns.map((s) => s.tier)).toEqual([
      'rare-elite',
      'rare-minion',
      'rare-minion',
      'rare-minion'
    ]);
    expect(new Set(spawns.map((s) => s.eliteAffix?.id))).toEqual(new Set(['elite-affix/extra-fire-damage']));
  });
});
