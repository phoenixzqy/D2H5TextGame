import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import treasureClasses from '@/data/loot/treasure-classes.json';
import schema from '@/data/schema/drop-table.schema.json';
import rangedPolicy from '../../../tests/fixtures/ranged-progression-v1.json';
import throwingPolicy from '../../../tests/fixtures/throwing-progression-v1.json';
import spearPolicy from '../../../tests/fixtures/spear-progression-v1.json';
import swordPolicy from '../../../tests/fixtures/sword-progression-v1.json';
import { loadAwardPools, loadTreasureClasses } from '@/data/loaders/loot';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { buildEnemiesForWave } from '@/stores/combatHelpers';
import { resolveChallengeWavePlan } from '../combat/sub-area-run';
import { createRng } from '../rng';
import { rollBatchRewards } from './award';

function required<T>(value: T | undefined | null): T {
  if (value == null) throw new Error('Missing actual Act II content');
  return value;
}
const highBases = ['helm-war-hat', 'armor-chain-mail', 'wp1h-long-sword', 'wp1h-greater-claws', 'sh-aegis']
  .map(id => `items/base/${id}`);
const rangedBases = rangedPolicy.tiers.flatMap(tier => [tier.bow, tier.crossbow]);
const throwingBases = throwingPolicy.tiers.map(tier => tier.baseId);
const spearBases = spearPolicy.tiers.map(tier => tier.baseId);
const swordBases = swordPolicy.tiers.map(tier => tier.baseId);
const eligibleAt29 = [...highBases, 'items/base/weapon-composite-bow',
  'items/base/weapon-heavy-crossbow', 'items/base/weapon-war-dart', 'items/base/weapon-military-fork'];

describe('BUG151 late Act II ordinary equipment eligibility', () => {
  it('validates the actual authored treasure classes without changing their schema', () => {
    const validate = new Ajv2020().compile(schema);
    for (const table of treasureClasses) expect(validate(table), JSON.stringify(validate.errors)).toBe(true);
  });

  it.each([29, 30, 31])('admits the five original high bases plus P15 ranged, throwing and spear upgrades at resolved level%i', level => {
    const table = required(loadTreasureClasses().get('loot/trash-act2'));
    expect(table.picks.filter(pick => pick.type === 'item' && level >= pick.qlvlMin && level <= pick.qlvlMax)
      .map(pick => pick.baseId)).toEqual(eligibleAt29);
  });

  it('preserves exact top-band boundaries and lower equipment rows', () => {
    const table = required(loadTreasureClasses().get('loot/trash-act2'));
    const high = table.picks.filter(pick => highBases.includes(pick.baseId ?? ''));
    expect(high).toHaveLength(5);
    // D08 Hell extension supersedes the prior Nightmare cap51 with finite cap71.
    for (const pick of high) expect([pick.qlvlMin, pick.qlvlMax]).toEqual([22, 71]);
    expect(table.picks.filter(pick => !highBases.includes(pick.baseId ?? '') &&
      !rangedBases.includes(pick.baseId ?? '') && !throwingBases.includes(pick.baseId ?? '') && !spearBases.includes(pick.baseId ?? '') && !swordBases.includes(pick.baseId ?? '')).map(pick => pick.qlvlMax))
      .toEqual([22, 22, 26, 26, 26, 22, 22, 26, 26, 26, 26]);
    for (const level of [21, 72]) expect(high.filter(pick => level >= pick.qlvlMin && level <= pick.qlvlMax)).toEqual([]);
    for (const level of [22, 28, 31, 32, 51, 52, 71]) expect(high.filter(pick => level >= pick.qlvlMin && level <= pick.qlvlMax)).toHaveLength(5);
  });

  it.each(['manual', 'idle'] as const)('covers actual ordinary levels in all six Normal Act II areas (%s)', mode => {
    const ids = ['rocky-waste', 'dry-hills', 'far-oasis', 'lost-city', 'arcane-sanctuary', 'tomb-of-tal-rasha'];
    const levels = new Set<number>();
    for (const id of ids) for (const challengeOrdinal of [0, 1, 12, 258, 259, 360359]) {
      const subArea = required(resolveSubArea(2, `areas/act2-${id}`));
      const plan = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: 'monsters/act2.mummy',
        fallbackLevel: subArea.areaLevel, seed: 3286157777, challengeOrdinal, mode });
      for (const wave of plan.waves) {
        if ((wave.lootTable ?? plan.defaultLootTable) !== 'loot/trash-act2') continue;
        const table = required(loadTreasureClasses().get('loot/trash-act2'));
        for (const spawn of wave.spawns) {
          levels.add(spawn.level);
          expect(table.picks.some(pick => pick.type === 'item' && spawn.level >= pick.qlvlMin &&
            spawn.level <= pick.qlvlMax), `${id}/${wave.id}/L${String(spawn.level)}`).toBe(true);
        }
      }
    }
    expect(Math.max(...levels)).toBe(31);
  });

  it('materializes real equipment from the observed seeded level29 elite source', () => {
    const subArea = required(resolveSubArea(2, 'areas/act2-tomb-of-tal-rasha'));
    const seed = 3286157777;
    const plan = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: 'monsters/act2.mummy',
      fallbackLevel: 25, seed, challengeOrdinal: 259, mode: 'manual' });
    const wave = required(plan.waves[2]);
    const enemies = buildEnemiesForWave(wave, seed);
    expect(enemies).toHaveLength(9);
    expect(enemies.every(enemy => enemy.level === 29)).toBe(true);
    // BUG447 preserves the four authored elites; five fitted copies are trash.
    expect(enemies.map(enemy => enemy.tier)).toEqual([
      'elite', 'elite', 'elite', 'elite', 'trash', 'trash', 'trash', 'trash', 'trash'
    ]);
    // This is an isolated reward-boundary reconstruction, not an earned victory.
    const rewards = rollBatchRewards(enemies.map(enemy => ({ tier: enemy.tier,
      monsterLevel: enemy.level, treasureClassId: wave.lootTable ?? plan.defaultLootTable,
      magicFind: 0, goldFind: 0, act: 2 as const })), loadAwardPools(), createRng(seed ^ 0x9e3779b1 ^ 2));
    expect(rewards.items.length).toBeGreaterThan(0);
    for (const item of rewards.items) {
      expect(eligibleAt29).toContain(item.baseId);
      expect(item.ilvl).toBe(29);
    }
  });
});
