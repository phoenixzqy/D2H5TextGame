/** Constructed live miniboss contracts; no campaign or balance credit. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadAwardPools } from '@/data/loaders/loot';
import { validateMinibossLoot } from '@/data/loaders/miniboss-loot';
import policy from '@/data/loot/miniboss-loot.json';
import { monsters, subAreas } from '@/data';
import { resolveChallengeWavePlan } from '../combat/sub-area-run';
import { applyReplayProfileToPlan } from '../map/replay-profile';
import { createRng, type Rng } from '../rng';
import { rollKillRewards, rollQuestTableRewards, type AwardDataPools } from './award';
import { rarityWeights, type TcPick } from './drop-roller';
import { minibossEquipmentTables } from './miniboss-equipment';
import { rollEquipmentGuarantees } from './equipment-guarantees';
import { __resetRollItemSeqForTests } from './rollItem';

const pools = loadAwardPools();
const live = { act: 1, tier: 'boss', monsterLevel: 10, treasureClassId: 'loot/mini-act1',
  magicFind: 0, goldFind: 0 } as const;
function constantRng(unit: number): Rng {
  return { next: () => unit, nextInt: (min, max) => min + Math.floor(unit * (max - min + 1)),
    chance: probability => unit < probability, pick: () => { throw new Error('Unexpected pick'); },
    fork: () => { throw new Error('Unexpected fork'); } };
}
afterEach(() => { vi.restoreAllMocks(); __resetRollItemSeqForTests(); });

describe('live miniboss equipment', () => {
  it.each([[1, 10], [2, 25], [3, 38], [4, 50], [5, 65]] as const)(
    'Act%i level%i awards three equipment and one independent jewelry pick', (act, monsterLevel) => {
      const result = rollKillRewards({ ...live, act, monsterLevel,
        treasureClassId: `loot/mini-act${String(act)}` }, pools, constantRng(0.5));
      expect(result.items).toHaveLength(4); // .5 excludes the independent rare+ bonus.
      expect(pools.bases.get(result.items[3]?.baseId ?? '')?.type).toBe('jewelry');
      expect(result.items.every(item => item.ilvl === monsterLevel)).toBe(true);
      expect(result.runes).toBe(1); expect(result.gems).toBe(1);
    });

  it('uses miniboss rarity weights rather than chapter-boss weights', () => {
    const rng = createRng(7);
    vi.spyOn(rng, 'chance').mockReturnValue(false);
    vi.spyOn(rng, 'next').mockReturnValueOnce(0).mockReturnValueOnce(0.6);
    // At MF0, .6 * (1000+300+240+32+32) < 1000; chapter boss yields magic.
    expect(rollKillRewards(live, pools, rng).items[0]?.rarity).toBe('normal');
  });

  it.each([[1, 59], [2, 72], [3, 87], [4, 101], [5, 122]] as const)(
    'Act%i level%i supports the ordinary groups and a successful rare+ bonus', (act, monsterLevel) => {
      const result = rollKillRewards({ ...live, act, monsterLevel,
        treasureClassId: `loot/mini-act${String(act)}` }, pools, constantRng(0.25));
      expect(result.items).toHaveLength(5);
      expect(pools.bases.get(result.items[3]?.baseId ?? '')?.type).toBe('jewelry');
      expect(['rare', 'set', 'unique']).toContain(result.items[4]?.rarity);
      expect(result.items.every(item => item.ilvl === monsterLevel)).toBe(true);
    });
});

const helm: TcPick = { baseId: 'items/base/helm-cap', rarity: 'normal', weight: 3, qlvlMin: 1, qlvlMax: 10 };
const ring: TcPick = { baseId: 'items/base/ring-iron', rarity: 'normal', weight: 1, qlvlMin: 1, qlvlMax: 14 };
function fixturePools(equipment: readonly TcPick[] = [helm], jewelry: readonly TcPick[] = [ring]): AwardDataPools {
  return { ...pools, treasureClasses: new Map(pools.treasureClasses)
    .set('loot/trash-act1', { id: 'loot/trash-act1', picks: equipment })
    .set('loot/jewelry-act1', { id: 'loot/jewelry-act1', picks: jewelry }) };
}

describe('miniboss source boundaries and isolation', () => {
  it('shifts ordinary minima only and retains weights, fixed rarity and expired earlier bands', () => {
    const armor: TcPick = { baseId: 'items/base/armor-leather', rarity: 'magic', weight: 7, qlvlMin: 5, qlvlMax: 14 };
    const data = fixturePools([{ ...helm, qlvlMax: 4 }, armor,
      { type: 'rune', weight: 100, qlvlMin: 1, qlvlMax: 99 }]);
    const projected = minibossEquipmentTables(live, data);
    expect(projected?.tables[0]).toEqual({ id: 'loot/trash-act1', numPicks: 3, noDropChance: 0, picks: [
      { ...helm, qlvlMin: 4, qlvlMax: 4 }, { ...armor, qlvlMin: 8, qlvlMax: 59 }
    ] });
    expect(projected?.bonusSource.picks).toEqual([{ ...helm, qlvlMax: 4 }, { ...armor, qlvlMax: 59 }]);
    expect(rollKillRewards(live, data, constantRng(0.5)).items.map(item => item.baseId))
      .toEqual([armor.baseId, armor.baseId, armor.baseId, ring.baseId]);
    expect(() => rollKillRewards({ ...live, monsterLevel: 3 }, data, constantRng(0.5)))
      .toThrow('No eligible miniboss equipment');
    expect(rollKillRewards({ ...live, monsterLevel: 4 }, data, constantRng(0.5)).items).toHaveLength(4);
  });

  it('preserves actual source probabilities across exact weighted boundaries', () => {
    const data = fixturePools([helm,
      { ...helm, baseId: 'items/base/armor-leather', weight: 7 }]);
    for (const [unit, expected] of [[0.299999, helm.baseId], [0.300001, 'items/base/armor-leather']] as const) {
      const rng = constantRng(unit);
      vi.spyOn(rng, 'chance').mockReturnValue(false); // Select the ordinary branch only.
      expect(rollKillRewards(live, data, rng).items.slice(0, 3).map(item => item.baseId))
        .toEqual([expected, expected, expected]);
    }
  });

  it('keeps the existing 50% bonus gate and gives its conditional rolls miniboss weights', () => {
    const data = fixturePools();
    expect(rollKillRewards(live, data, constantRng(0.5 - 1e-8)).items).toHaveLength(5);
    expect(rollKillRewards(live, data, constantRng(0.5)).items).toHaveLength(4);
    const weights = rarityWeights(300, 'boss', 1.5, policy.rarityMultipliers);
    // Effective MF327, post-curve multiplier1.5: 490.5.
    for (const [rarity, expected] of Object.entries({ normal: 591.25, magic: 545.25,
      rare: 534.3, set: 110.48, unique: 119.2 })) {
      expect(weights[rarity as keyof typeof weights]).toBeCloseTo(expected, 10);
    }
    const conditionalPools = { ...pools, equipmentGuarantees: new Map([['loot/mini-act1', [
      { sourceTableId: 'loot/trash-act1', minimumRarity: 'rare' as const, count: 1, chance: 1 }
    ]]]), treasureClasses: new Map([['loot/trash-act1', { id: 'loot/trash-act1', picks: [
      { baseId: 'items/base/helm-cap', weight: 1, qlvlMin: 1, qlvlMax: 59 }
    ] }]]) };
    const run = (rarityMultipliers: typeof policy.rarityMultipliers) => {
      const rng = createRng(7); vi.spyOn(rng, 'next').mockReturnValueOnce(0.89);
      return rollEquipmentGuarantees({ ...live, rarityMultipliers }, conditionalPools, rng)[0]?.rarity;
    };
    // Cap has an eligible unique and no set. Mini rare mass272/304=.8947;
    // boss rare mass368/416=.8846: .89 distinguishes the contexts.
    expect(run(policy.rarityMultipliers)).toBe('rare');
    expect(run({ rare: 4, set: 6, unique: 12 })).toBe('unique');
  });

  it('applies offline MF after the curve to ordinary materialized equipment', () => {
    const run = (magicFindMultiplier: number) => {
      const rng = createRng(7);
      vi.spyOn(rng, 'chance').mockReturnValue(false);
      vi.spyOn(rng, 'next').mockReturnValueOnce(0).mockReturnValueOnce(0.35);
      return rollKillRewards({ ...live, magicFind: 300, magicFindMultiplier }, pools, rng).items[0]?.rarity;
    };
    expect(run(1)).toBe('normal'); expect(run(1.5)).toBe('magic');
  });

  it('refuses missing, invalid or mismatched sources and out-of-cap levels before any draw', () => {
    const run = (data: AwardDataPools) => {
      const rng = createRng(7), next = vi.spyOn(rng, 'next');
      expect(() => rollKillRewards(live, data, rng)).toThrow();
      expect(next).not.toHaveBeenCalled();
    };
    for (const id of ['loot/mini-act1', 'loot/trash-act1', 'loot/jewelry-act1']) {
      const treasureClasses = new Map(pools.treasureClasses); treasureClasses.delete(id);
      run({ ...pools, treasureClasses });
    }
    run(fixturePools([helm], [helm]));
    run(fixturePools([helm], [{ ...ring, qlvlMin: 11 }]));
    run(fixturePools([{ ...helm, weight: NaN }]));
    run(fixturePools([{ ...helm, baseId: 'missing' }]));
    run(fixturePools([{ ...helm, qlvlMax: 60 }]));
    // Wider numeric types intentionally exercise the public live-kill boundary.
    const rng = createRng(7), next = vi.spyOn(rng, 'next');
    for (const overrides of [{ act: 2 as const }, { monsterLevel: 60 }, { monsterLevel: 0 }, { monsterLevel: 1.5 }]) {
      expect(() => rollKillRewards({ ...live, ...overrides }, pools, rng)).toThrow();
    }
    expect(next).not.toHaveBeenCalled();
  });

  it('validates closed schema and distinct bindings for all five acts', () => {
    expect(validateMinibossLoot(structuredClone(policy)).acts).toHaveLength(5);
    const mutate = (change: (value: typeof policy) => void) => {
      const value = structuredClone(policy); change(value);
      expect(() => validateMinibossLoot(value)).toThrow();
    };
    mutate(value => { const row = value.acts[0]; if (!row) throw new Error('Missing act'); value.acts[1] = { ...row }; });
    mutate(value => { const row = value.acts[1]; if (!row) throw new Error('Missing act'); row.treasureClassId = 'loot/mini-act1'; });
    mutate(value => { value.equipmentPicks = 4; });
    mutate(value => { value.minimumLevelOffset = -1; });
    mutate(value => { value.rarityMultipliers.unique = Infinity; });
    expect(() => validateMinibossLoot({ ...policy, typo: true })).toThrow();
    expect(() => validateMinibossLoot({ ...policy, rarityMultipliers: { ...policy.rarityMultipliers, typo: true } })).toThrow();
  });

  it('preserves deterministic following RNG and explicit cache, goblin and chapter contexts', () => {
    const { minibossLoot: _policy, ...baseline } = pools;
    const run = (treasureClassId: string, tier: 'boss' | 'chapter-boss', data: AwardDataPools) => {
      __resetRollItemSeqForTests(); const rng = createRng(7);
      return { rewards: rollKillRewards({ ...live, treasureClassId, tier }, data, rng), following: rng.next() };
    };
    expect(run(live.treasureClassId, 'boss', pools)).toEqual(run(live.treasureClassId, 'boss', pools));
    for (const [id, tier] of [['loot/act1-boss', 'chapter-boss'], ['loot/treasure-goblin', 'boss'],
      ['loot/trash-act1', 'boss'], ['missing', 'boss']] as const) {
      expect(run(id, tier, pools)).toEqual(run(id, tier, baseline));
    }
    const cache = (data: AwardDataPools) => {
      __resetRollItemSeqForTests(); const rng = createRng(7);
      return { reward: rollQuestTableRewards({ tableId: live.treasureClassId, ilvl: 10, picks: 5 }, data, rng), following: rng.next() };
    };
    expect(cache(pools).reward).toBeDefined(); expect(cache(pools)).toEqual(cache(baseline));
  });

  it('covers actual five-act miniboss spawn levels across three difficulties without running combat', () => {
    const monsterIndex = new Map(monsters.map(monster => [monster.id, monster]));
    const fallback = monsters[0]; if (!fallback) throw new Error('Missing monsters');
    const checked = new Set<string>(), ranges = new Set<string>();
    for (const subArea of subAreas) for (const mode of ['manual', 'idle'] as const) {
      const plan = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: fallback.id,
        fallbackLevel: subArea.areaLevel, seed: 7, challengeOrdinal: 0, mode });
      for (const difficulty of ['normal', 'nightmare', 'hell'] as const) {
        const replay = applyReplayProfileToPlan(plan, difficulty, monsterIndex);
        for (const wave of replay.waves) for (const spawn of wave.spawns) {
          const treasureClassId = wave.lootTable ?? replay.defaultLootTable;
          if (spawn.tier !== 'boss' || !/^loot\/mini-act[1-5]$/.test(treasureClassId)) continue;
          const act = Number(subArea.actId.slice(-1)) as 1 | 2 | 3 | 4 | 5;
          const identity = `${String(act)}/${difficulty}/${String(spawn.level)}`;
          ranges.add(`${String(act)}/${difficulty}`);
          if (checked.has(identity)) continue; checked.add(identity);
          const result = rollKillRewards({ ...live, act, tier: spawn.tier, monsterLevel: spawn.level,
            treasureClassId, difficulty }, pools, constantRng(0.25));
          expect(result.items, identity).toHaveLength(5);
          expect(result.items.every(item => item.ilvl === spawn.level), identity).toBe(true);
          expect(pools.bases.get(result.items[3]?.baseId ?? '')?.type, identity).toBe('jewelry');
        }
      }
    }
    expect(ranges.size).toBe(15); expect(checked.size).toBeGreaterThan(30);
  });
});
