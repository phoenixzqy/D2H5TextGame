/** Constructed champion/rare-leader rewards; no campaign or balance credit. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadAwardPools } from '@/data/loaders/loot';
import { validateNonbossLoot } from '@/data/loaders/nonboss-loot';
import policy from '@/data/loot/nonboss-loot.json';
import { monsters, subAreas } from '@/data';
import { resolveChallengeWavePlan } from '../combat/sub-area-run';
import { applyReplayProfileToPlan } from '../map/replay-profile';
import { createRng, type Rng } from '../rng';
import { rarityWeights, rollDrops, type TcPick } from './drop-roller';
import { rollKillRewards, rollQuestTableRewards, type AwardDataPools } from './award';
import { __resetRollItemSeqForTests } from './rollItem';
import { nonbossEquipmentTables } from './nonboss-equipment';

const pools = loadAwardPools();
function constantRng(unit: number): Rng {
  return { next: () => unit, nextInt: (min, max) => min + Math.floor(unit * (max - min + 1)),
    chance: probability => unit < probability, pick: () => { throw new Error('Unexpected pick'); },
    fork: () => { throw new Error('Unexpected fork'); } };
}
afterEach(() => { vi.restoreAllMocks(); __resetRollItemSeqForTests(); });

describe('ordinary champion and rare-leader equipment', () => {
  it.each([[1, 10], [2, 25], [3, 38], [4, 50], [5, 65]] as const)(
    'Act%i level%i grants two champion picks and three rare-leader picks plus jewelry', (act, monsterLevel) => {
      const input = { act, monsterLevel, treasureClassId: `loot/trash-act${String(act)}`,
        magicFind: 0, goldFind: 0, difficulty: 'hell' as const };
      const champion = rollKillRewards({ ...input, tier: 'champion' }, pools, constantRng(0.5));
      const leader = rollKillRewards({ ...input, tier: 'rare-elite' }, pools, constantRng(0.5));
      expect(champion.items).toHaveLength(2);
      expect(leader.items).toHaveLength(4);
      expect(pools.bases.get(leader.items[3]?.baseId ?? '')?.type).toBe('jewelry');
      expect([...champion.items, ...leader.items].every(item => item.ilvl === monsterLevel)).toBe(true);
    });

  it('uses the documented champion and unique rarity weights independently of bosses', () => {
    expect(rarityWeights(0, 'champion')).toEqual({ normal: 1000, magic: 300, rare: 120, set: 16, unique: 12 });
    expect(rarityWeights(0, 'rare-elite')).toEqual({ normal: 1000, magic: 300, rare: 160, set: 24, unique: 24 });
    expect(rarityWeights(0, 'chapter-boss')).toEqual({ normal: 1000, magic: 300, rare: 320, set: 48, unique: 48 });
  });

  it('applies offline MF after the curve and retains the rare-leader 50MF bonus on materialized equipment', () => {
    const weights = rarityWeights(300, 'champion', 1.5);
    // floor(300 / 550 * 600) = 327, then 327 * 1.5 = 490.5.
    for (const [rarity, expected] of Object.entries({ normal: 591.25, magic: 545.25,
      rare: 267.15, set: 55.24, unique: 44.7 })) {
      expect(weights[rarity as keyof typeof weights]).toBeCloseTo(expected, 10);
    }
    const roll = (tier: 'champion' | 'rare-elite', magicFindMultiplier: number, unit: number) => {
      const rng = createRng(7);
      vi.spyOn(rng, 'chance').mockReturnValue(false);
      vi.spyOn(rng, 'next').mockReturnValueOnce(0).mockReturnValueOnce(unit);
      return rollKillRewards({ ...live, tier, magicFind: 300, magicFindMultiplier }, pools, rng).items[0]?.rarity;
    };
    expect(roll('champion', 1, 0.45)).toBe('normal');
    expect(roll('champion', 1.5, 0.45)).toBe('magic');
    // At .677 only +50MF crosses magic→rare; without offline MF it stays magic.
    expect(roll('rare-elite', 1, 0.677)).toBe('magic');
    expect(roll('rare-elite', 1.5, 0.677)).toBe('rare');
    expect(roll('champion', 1.5, 0.677)).toBe('magic');
  });

  it('materializes actual promoted spawn levels without running combat or replaying campaigns', () => {
    const monsterIndex = new Map(monsters.map(monster => [monster.id, monster]));
    const fallback = monsters[0];
    if (!fallback) throw new Error('Missing production monsters');
    const ranges: Record<string, number[]> = {};
    const checked = new Set<string>();
    for (const subArea of subAreas) for (const mode of ['manual', 'idle'] as const) for (const challengeOrdinal of [0, 9, 12]) {
      const plan = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: fallback.id,
        fallbackLevel: subArea.areaLevel, seed: 7, challengeOrdinal, mode });
      for (const difficulty of ['normal', 'nightmare', 'hell'] as const) {
        const replay = applyReplayProfileToPlan(plan, difficulty, monsterIndex);
        for (const wave of replay.waves) for (const spawn of wave.spawns) {
          if (!['champion', 'rare-elite'].includes(spawn.tier) ||
            !/^loot\/(trash|champion|unique)-act[1-5]$/.test(wave.lootTable ?? replay.defaultLootTable)) continue;
          const key = `${subArea.actId}/${spawn.tier}/${difficulty}`;
          (ranges[key] ??= []).push(spawn.level);
          const treasureClassId = wave.lootTable ?? replay.defaultLootTable;
          const identity = `${key}/${treasureClassId}/${String(spawn.level)}`;
          if (checked.has(identity)) continue;
          checked.add(identity);
          const act = Number(subArea.actId.slice(-1)) as 1 | 2 | 3 | 4 | 5;
          const result = rollKillRewards({ act, tier: spawn.tier, monsterLevel: spawn.level,
            treasureClassId, difficulty, magicFind: 0, goldFind: 0 }, pools, constantRng(0.5));
          const offset = spawn.tier === 'champion' ? 2 : 3;
          const source = pools.treasureClasses.get(`loot/trash-act${String(act)}`);
          const eligible = source?.picks.some(pick => spawn.level >= pick.qlvlMin + offset &&
            (spawn.level <= pick.qlvlMax || pick.qlvlMax === Math.max(...source.picks.map(p => p.qlvlMax))));
          expect(result.items, identity).toHaveLength((eligible ? spawn.tier === 'champion' ? 2 : 3 : 0) +
            (spawn.tier === 'rare-elite' ? 1 : 0));
          expect(result.items.every(item => item.ilvl === spawn.level), identity).toBe(true);
          if (spawn.tier === 'rare-elite') expect(pools.bases.get(result.items.at(-1)?.baseId ?? '')?.type).toBe('jewelry');
        }
      }
    }
    expect(Object.keys(ranges)).toHaveLength(30);
    expect(checked.size).toBeGreaterThan(100);
  });
});

const live = { act: 1, tier: 'champion', monsterLevel: 10, treasureClassId: 'loot/trash-act1',
  magicFind: 0, goldFind: 0 } as const;
function fixturePools(equipment: readonly TcPick[], jewelry: readonly TcPick[] = [
  { baseId: 'items/base/ring-iron', rarity: 'normal', weight: 1, qlvlMin: 1, qlvlMax: 14 }
]): AwardDataPools {
  return { ...pools, treasureClasses: new Map(pools.treasureClasses)
    .set('loot/trash-act1', { id: 'loot/trash-act1', picks: equipment })
    .set('loot/jewelry-act1', { id: 'loot/jewelry-act1', picks: jewelry }) };
}
const helm: TcPick = { baseId: 'items/base/helm-cap', rarity: 'normal', weight: 1, qlvlMin: 1, qlvlMax: 14 };

describe('nonboss boundaries and isolation', () => {
  it.each([
    ['champion', 'normal', 0.2], ['champion', 'nightmare', 0.12], ['champion', 'hell', 0.06],
    ['rare-elite', 'normal', 0.1], ['rare-elite', 'nightmare', 0.05], ['rare-elite', 'hell', 0]
  ] as const)('%s %s noDrop%i applies only to ordinary equipment', (tier, difficulty, probability) => {
    const input = { ...live, tier, difficulty };
    const tables = nonbossEquipmentTables(input, fixturePools([helm]));
    if (!tables) throw new Error('Missing tier tables');
    const count = tier === 'champion' ? 2 : 3;
    expect(tables[0]).toMatchObject({ numPicks: count, noDropChance: probability });
    for (const [unit, ordinary] of probability > 0 ? [[probability - 1e-8, 0], [probability, count]] : [[0, count]]) {
      if (unit === undefined || ordinary === undefined) throw new Error('Missing boundary');
      expect(tables.flatMap(tc => rollDrops({ tc, tier, monsterLevel: 10, magicFind: 0 }, constantRng(unit))))
        .toHaveLength(ordinary + (tier === 'rare-elite' ? 1 : 0));
    }
  });

  it('inherits weighted equipment, shifts only minima, and never revives expired early bands', () => {
    const data = fixturePools([
      { ...helm, weight: 3, qlvlMax: 4 },
      { baseId: 'items/base/armor-leather', rarity: 'magic', weight: 7, qlvlMin: 5, qlvlMax: 14 },
      { type: 'currency', itemId: 'currency/wishstone', weight: 100, qlvlMin: 1, qlvlMax: 99 }
    ]);
    const tables = nonbossEquipmentTables(live, data);
    expect(tables?.[0]?.picks).toEqual([
      { ...helm, weight: 3, qlvlMin: 3, qlvlMax: 4 },
      { baseId: 'items/base/armor-leather', rarity: 'magic', weight: 7, qlvlMin: 7, qlvlMax: 59 }
    ]);
    expect(rollKillRewards(live, data, constantRng(0.5)).items.map(item => item.baseId))
      .toEqual(['items/base/armor-leather', 'items/base/armor-leather']);
    expect(rollKillRewards({ ...live, monsterLevel: 2 }, data, constantRng(0.5)).items).toEqual([]);
    expect(rollKillRewards({ ...live, monsterLevel: 3 }, data, constantRng(0.5)).items).toHaveLength(2);
    expect(rollKillRewards({ ...live, tier: 'rare-elite', monsterLevel: 3 }, data, constantRng(0.5)).items)
      .toHaveLength(1);
  });

  it.each([[1, 59], [2, 72], [3, 87], [4, 101], [5, 122]] as const)(
    'Act%i supports its inclusive finite cap%i and rejects higher levels before drawing', (act, monsterLevel) => {
      for (const tier of ['champion', 'rare-elite'] as const) {
        const input = { ...live, act, tier, monsterLevel, difficulty: 'hell' as const,
          treasureClassId: `loot/trash-act${String(act)}` };
        expect(rollKillRewards(input, pools, constantRng(0.5)).items).toHaveLength(tier === 'champion' ? 2 : 4);
        const rng = createRng(7), next = vi.spyOn(rng, 'next');
        expect(() => rollKillRewards({ ...input, monsterLevel: monsterLevel + 1 }, pools, rng))
          .toThrow('Invalid nonboss equipment level');
        expect(next).not.toHaveBeenCalled();
      }
    });

  it('validates schema, all acts and unique table bindings', () => {
    expect(validateNonbossLoot(structuredClone(policy)).acts).toHaveLength(5);
    const mutate = (change: (value: typeof policy) => void) => {
      const value = structuredClone(policy); change(value);
      expect(() => validateNonbossLoot(value)).toThrow();
    };
    mutate(value => { const row = value.acts[0]; if (!row) throw new Error('Missing act'); value.acts[1] = { ...row }; });
    mutate(value => { const row = value.acts[1]; if (!row) throw new Error('Missing act'); row.tableIds[0] = 'loot/trash-act1'; });
    mutate(value => { value.tiers.champion.noDrop.normal = -0.1; });
    mutate(value => { value.tiers['rare-elite'].jewelryPicks = 2; });
    mutate(value => { const row = value.acts[0]; if (!row) throw new Error('Missing act'); row.terminalLevelCap = Infinity; });
    expect(() => validateNonbossLoot({ ...policy, typo: true })).toThrow();
    expect(() => validateNonbossLoot({ ...policy, tiers: { ...policy.tiers,
      champion: { ...policy.tiers.champion, noDrop: { ...policy.tiers.champion.noDrop, typo: 0 } } } })).toThrow();
  });

  it('prepares missing/invalid sources and guaranteed jewelry before any draw', () => {
    const input = { ...live, tier: 'rare-elite' as const };
    const rng = createRng(7), next = vi.spyOn(rng, 'next');
    const treasureClasses = new Map(pools.treasureClasses); treasureClasses.delete('loot/jewelry-act1');
    expect(() => rollKillRewards(input, { ...pools, treasureClasses }, rng)).toThrow('Missing nonboss equipment source');
    expect(() => rollKillRewards(input, fixturePools([helm], [helm]), rng)).toThrow('Invalid nonboss jewelry source');
    expect(() => rollKillRewards(input, fixturePools([helm], [{ ...helm, baseId: 'items/base/ring-iron', qlvlMin: 11 }]), rng))
      .toThrow('No eligible guaranteed jewelry');
    expect(() => rollKillRewards({ ...input, act: 2 }, pools, rng)).toThrow('Mismatched nonboss equipment act');
    expect(next).not.toHaveBeenCalled();
    expect(() => rollKillRewards(input, { ...pools, bases: new Map() }, createRng(7)))
      .toThrow('Invalid nonboss jewelry source');
  });

  it('applies identical tier rewards for trash/champion/unique aliases with next RNG preserved', () => {
    for (const tier of ['champion', 'rare-elite'] as const) {
      const run = (treasureClassId: string) => {
        __resetRollItemSeqForTests(); const rng = createRng(7);
        return { result: rollKillRewards({ ...live, tier, treasureClassId, magicFind: 300, magicFindMultiplier: 1.5 }, pools, rng),
          following: rng.next() };
      };
      expect(run('loot/champion-act1')).toEqual(run('loot/trash-act1'));
      expect(run('loot/unique-act1')).toEqual(run('loot/trash-act1'));
      expect(run('loot/unique-act1')).toEqual(run('loot/unique-act1'));
    }
  });

  it('keeps explicit caches, special sources and other tiers independent of live source projection', () => {
    const { nonbossLoot: _policy, ...disabled } = pools;
    const compare = (run: (data: AwardDataPools) => unknown) => {
      __resetRollItemSeqForTests(); const expected = run(disabled);
      __resetRollItemSeqForTests(); expect(run(pools)).toEqual(expected);
    };
    for (const tier of ['elite', 'rare-minion', 'boss', 'chapter-boss'] as const) {
      compare(data => { const rng = createRng(9); return { rewards: rollKillRewards({ ...live, tier }, data, rng), next: rng.next() }; });
    }
    for (const treasureClassId of ['loot/mini-act1', 'loot/act1-boss', 'loot/treasure-goblin']) {
      compare(data => { const rng = createRng(9); return { rewards: rollKillRewards({ ...live, treasureClassId }, data, rng), next: rng.next() }; });
    }
    compare(data => { const rng = createRng(9); return { rewards: rollQuestTableRewards(
      { tableId: 'loot/champion-act1', ilvl: 10, picks: 3 }, data, rng), next: rng.next() }; });
  });

  it('retains legacy pick counts and noDrop for unconfigured promoted sources', () => {
    for (const tier of ['champion', 'rare-elite'] as const) {
      expect(rollDrops({ tc: { id: 'fixture/unconfigured', picks: [helm] }, tier,
        monsterLevel: 10, magicFind: 0 }, constantRng(0.01))).toHaveLength(5);
    }
  });
});
