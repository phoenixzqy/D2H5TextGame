/** Constructed ordinary-enemy rewards; no campaign or balance credit. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadAwardPools } from '@/data/loaders/loot';
import { validateNonbossLoot } from '@/data/loaders/nonboss-loot';
import policy from '@/data/loot/nonboss-loot.json';
import { monsters, subAreas } from '@/data';
import { resolveChallengeWavePlan } from '../combat/sub-area-run';
import { applyReplayProfileToPlan } from '../map/replay-profile';
import { createRng, type Rng } from '../rng';
import { rollKillRewards, rollQuestTableRewards, type AwardDataPools } from './award';
import { rarityWeights } from './drop-roller';
import { nonbossEquipmentTables } from './nonboss-equipment';
import { __resetRollItemSeqForTests } from './rollItem';

const pools = loadAwardPools();
const live = { act: 1, tier: 'trash', monsterLevel: 10, treasureClassId: 'loot/trash-act1',
  magicFind: 0, goldFind: 0 } as const;
function constantRng(unit: number): Rng {
  return { next: () => unit, nextInt: (min, max) => min + Math.floor(unit * (max - min + 1)),
    chance: probability => unit < probability, pick: () => { throw new Error('Unexpected pick'); },
    fork: () => { throw new Error('Unexpected fork'); } };
}
afterEach(() => { vi.restoreAllMocks(); __resetRollItemSeqForTests(); });

describe('live ordinary-monster equipment', () => {
  it.each([['normal', 0.6], ['nightmare', 0.5], ['hell', 0.4]] as const)(
    '%s has one attempt with noDrop %s, including its exact boundary', (difficulty, probability) => {
      expect(rollKillRewards({ ...live, difficulty }, pools, constantRng(probability - 1e-8)).items).toEqual([]);
      const result = rollKillRewards({ ...live, difficulty }, pools, constantRng(probability));
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.ilvl).toBe(10);
    });

  it.each([[1, 59], [2, 72], [3, 87], [4, 101], [5, 122]] as const)(
    'Act%s supports finite terminal level %s and refuses levels above it before RNG', (act, monsterLevel) => {
      const input = { ...live, act, monsterLevel, difficulty: 'hell' as const,
        treasureClassId: `loot/trash-act${String(act)}` };
      const result = rollKillRewards(input, pools, constantRng(0.9));
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.ilvl).toBe(monsterLevel);
      const rng = createRng(7), next = vi.spyOn(rng, 'next');
      expect(() => rollKillRewards({ ...input, monsterLevel: monsterLevel + 1 }, pools, rng))
        .toThrow('Invalid nonboss equipment level');
      expect(next).not.toHaveBeenCalled();
    });

  it('keeps minima, source weights and fixed rarities, extending only the terminal band', () => {
    const early = { baseId: 'items/base/helm-cap', rarity: 'normal' as const, weight: 3, qlvlMin: 1, qlvlMax: 4 };
    const late = { baseId: 'items/base/armor-leather', rarity: 'magic' as const, weight: 7, qlvlMin: 5, qlvlMax: 14 };
    const data: AwardDataPools = { ...pools, treasureClasses: new Map(pools.treasureClasses)
      .set(live.treasureClassId, { id: live.treasureClassId, picks: [early, late] }) };
    expect(nonbossEquipmentTables(live, data)?.[0]).toEqual({ id: live.treasureClassId, numPicks: 1,
      noDropChance: 0.6, picks: [early, { ...late, qlvlMax: 59 }] });
    for (const monsterLevel of [1, 4, 5, 59]) {
      const result = rollKillRewards({ ...live, monsterLevel }, data, constantRng(0.7));
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ baseId: monsterLevel < 5 ? early.baseId : late.baseId,
        rarity: monsterLevel < 5 ? 'normal' : 'magic', ilvl: monsterLevel });
    }
  });

  it('uses the actual trash tier under ordinary shared-wave aliases with deterministic next RNG', () => {
    const run = (treasureClassId: string) => {
      __resetRollItemSeqForTests(); const rng = createRng(7);
      vi.spyOn(rng, 'chance').mockReturnValue(false);
      return { result: rollKillRewards({ ...live, treasureClassId }, pools, rng), next: rng.next() };
    };
    expect(run('loot/champion-act1')).toEqual(run(live.treasureClassId));
    expect(run('loot/unique-act1')).toEqual(run(live.treasureClassId));
  });

  it('requires a closed authored trash policy', () => {
    expect(validateNonbossLoot(structuredClone(policy)).tiers).toHaveProperty('trash', {
      equipmentPicks: 1, minimumLevelOffset: 0, jewelryPicks: 0,
      noDrop: { normal: 0.6, nightmare: 0.5, hell: 0.4 }, rarityMultipliers: { rare: 1, set: 1, unique: 1 }
    });
    const { trash: _trash, ...tiers } = policy.tiers;
    expect(() => validateNonbossLoot({ ...policy, tiers })).toThrow();
    expect(() => validateNonbossLoot({ ...policy, tiers: { ...policy.tiers,
      trash: { ...policy.tiers.trash, typo: 1 } } })).toThrow();
    expect(() => validateNonbossLoot({ ...policy, tiers: { ...policy.tiers,
      trash: { ...policy.tiers.trash, noDrop: { normal: 0.6, nightmare: -0.5, hell: 0.4 } } } })).toThrow();
  });

  it('retains gear MF, post-curve offline MF and ordinary 1/1/1 rarity weights', () => {
    expect(rarityWeights(0, 'trash')).toEqual({ normal: 1000, magic: 300, rare: 80, set: 8, unique: 4 });
    const roll = (magicFind: number, magicFindMultiplier: number, unit: number) => {
      const rng = createRng(7);
      vi.spyOn(rng, 'chance').mockReturnValue(false);
      vi.spyOn(rng, 'next').mockReturnValueOnce(0).mockReturnValueOnce(unit);
      return rollKillRewards({ ...live, magicFind, magicFindMultiplier }, pools, rng).items[0]?.rarity;
    };
    expect(roll(0, 1, 0.69)).toBe('normal');
    expect(roll(300, 1, 0.69)).toBe('magic');
    expect(roll(300, 1, 0.48)).toBe('normal');
    expect(roll(300, 1.5, 0.48)).toBe('magic');
  });

  it('keeps D10 independent material probabilities and quantities when equipment misses', () => {
    for (const difficulty of ['normal', 'nightmare', 'hell'] as const) {
      for (const [unit, runes, gems] of [[0.005, 1, 1], [0.006, 0, 1], [0.014, 0, 1], [0.015, 0, 0]] as const) {
        const result = rollKillRewards({ ...live, difficulty }, pools, constantRng(unit));
        expect(result.items).toEqual([]);
        expect(result.runes).toBe(runes); expect(result.gems).toBe(gems);
        expect(result.wishstones).toBe(0); expect(result.runeShards).toBeGreaterThan(0);
        expect(Object.values(result.materials).reduce((sum, quantity) => sum + quantity, 0)).toBe(runes + gems);
        expect(Object.entries(result.materials).filter(([id]) => id.startsWith('runes/'))
          .reduce((sum, [, quantity]) => sum + quantity, 0)).toBe(runes);
      }
    }
  });

  it('refuses missing/invalid configured sources and wrong acts before any entropy', () => {
    const rng = createRng(7), next = vi.spyOn(rng, 'next');
    const treasureClasses = new Map(pools.treasureClasses); treasureClasses.delete(live.treasureClassId);
    expect(() => rollKillRewards(live, { ...pools, treasureClasses }, rng)).toThrow('Missing nonboss loot table');
    expect(() => rollKillRewards({ ...live, treasureClassId: 'loot/champion-act1' },
      { ...pools, treasureClasses }, rng)).toThrow('Missing nonboss equipment source');
    treasureClasses.set(live.treasureClassId, { id: live.treasureClassId,
      picks: [{ baseId: 'items/base/helm-cap', weight: -1, qlvlMin: 1, qlvlMax: 10 }] });
    expect(() => rollKillRewards(live, { ...pools, treasureClasses }, rng)).toThrow('Invalid nonboss equipment source');
    expect(() => rollKillRewards({ ...live, act: 2 }, pools, rng)).toThrow('Mismatched nonboss equipment act');
    expect(next).not.toHaveBeenCalled();
  });

  it('keeps low-level empty pools explicit instead of raising item level', () => {
    const input = { ...live, act: 2 as const, monsterLevel: 1, treasureClassId: 'loot/trash-act2' };
    expect(rollKillRewards(input, pools, constantRng(0.9)).items).toEqual([]);
  });

  it('preserves ordinary weighted boundaries when both source rows are eligible', () => {
    const rows = [
      { baseId: 'items/base/helm-cap', rarity: 'normal' as const, weight: 3, qlvlMin: 1, qlvlMax: 14 },
      { baseId: 'items/base/armor-leather', rarity: 'magic' as const, weight: 7, qlvlMin: 1, qlvlMax: 14 }
    ];
    const data = { ...pools, treasureClasses: new Map(pools.treasureClasses)
      .set(live.treasureClassId, { id: live.treasureClassId, picks: rows }) };
    const roll = (unit: number) => {
      const rng = createRng(7); vi.spyOn(rng, 'chance').mockReturnValue(false);
      vi.spyOn(rng, 'next').mockReturnValueOnce(unit);
      return rollKillRewards(live, data, rng).items[0]?.baseId;
    };
    expect(roll(0.3)).toBe(rows[0]?.baseId);
    expect(roll(0.3 + 1e-8)).toBe(rows[1]?.baseId);
  });

  it('keeps explicit caches, special sources and unconfigured tables independent', () => {
    const { nonbossLoot: _policy, ...disabled } = pools;
    const compare = (run: (data: AwardDataPools) => unknown) => {
      __resetRollItemSeqForTests(); const expected = run(disabled);
      __resetRollItemSeqForTests(); expect(run(pools)).toEqual(expected);
    };
    for (const treasureClassId of ['loot/mini-act1', 'loot/act1-boss', 'loot/treasure-goblin', 'fixture/unconfigured']) {
      compare(data => { const rng = createRng(7); return {
        result: rollKillRewards({ ...live, treasureClassId }, data, rng), next: rng.next() }; });
    }
    compare(data => { const rng = createRng(7); return { result: rollQuestTableRewards(
      { tableId: 'loot/trash-act1', ilvl: 10, picks: 3 }, data, rng), next: rng.next() }; });
  });

  it('covers actual five-act trash spawn levels by planning, without combat or campaign reruns', () => {
    const monsterIndex = new Map(monsters.map(monster => [monster.id, monster]));
    const fallback = monsters[0]; if (!fallback) throw new Error('Missing production monsters');
    const checked = new Set<string>(), contexts = new Set<string>();
    for (const subArea of subAreas) for (const mode of ['manual', 'idle'] as const) {
      const plan = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: fallback.id,
        fallbackLevel: subArea.areaLevel, seed: 7, challengeOrdinal: 0, mode });
      for (const difficulty of ['normal', 'nightmare', 'hell'] as const) {
        const replay = applyReplayProfileToPlan(plan, difficulty, monsterIndex);
        for (const wave of replay.waves) for (const spawn of wave.spawns) {
          const treasureClassId = wave.lootTable ?? replay.defaultLootTable;
          if (spawn.tier !== 'trash' || !/^loot\/(trash|champion|unique)-act[1-5]$/.test(treasureClassId)) continue;
          const act = Number(subArea.actId.slice(-1)) as 1 | 2 | 3 | 4 | 5;
          contexts.add(`${String(act)}/${difficulty}/${mode}`);
          const key = `${String(act)}/${difficulty}/${treasureClassId}/${String(spawn.level)}`;
          if (checked.has(key)) continue; checked.add(key);
          const result = rollKillRewards({ ...live, act, difficulty, treasureClassId, monsterLevel: spawn.level },
            pools, constantRng(0.9));
          expect(result.items, key).toHaveLength(1);
          expect(result.items[0]?.ilvl, key).toBe(spawn.level);
        }
      }
    }
    expect(contexts.size).toBe(30);
    expect(checked.size).toBeGreaterThan(50);
  });
});
