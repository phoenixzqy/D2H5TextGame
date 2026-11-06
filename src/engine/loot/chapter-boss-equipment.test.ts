/** BUG680 real boss equipment groups; constructed rewards earn no campaign credit. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadAwardPools } from '@/data/loaders/loot';
import { validateChapterBossEquipment } from '@/data/loaders/chapter-boss-equipment';
import policy from '@/data/loot/chapter-boss-equipment.json';
import { monsters, subAreas } from '@/data';
import { resolveChallengeWavePlan } from '../combat/sub-area-run';
import { applyReplayProfileToPlan } from '../map/replay-profile';
import { createRng } from '../rng';
import { rollKillRewards, rollQuestTableRewards, type AwardDataPools } from './award';
import { chapterBossEquipmentTables, type ChapterBossEquipmentGroup } from './chapter-boss-equipment';
import { rollDrops } from './drop-roller';
import { __resetRollItemSeqForTests } from './rollItem';

// Isolate ordinary groups from the separately tested optional unique bonus.
const pools = { ...loadAwardPools(), chapterBossUniques: new Map() };
afterEach(() => { vi.restoreAllMocks(); __resetRollItemSeqForTests(); });
const cases = [[1, 14, 4, 2], [2, 27, 5, 3], [3, 42, 6, 3], [4, 57, 7, 3], [5, 78, 8, 4]] as const;

for (const [difficulty, offset] of [['normal', 0], ['nightmare', 20], ['hell', 40]] as const) {
  describe(`chapter-boss ordinary equipment on ${difficulty}`, () => {
    it.each(cases)('Act%i level%i grants its trash and jewelry groups', (act, level, ordinary, jewelry) => {
      const source = pools.treasureClasses.get(`loot/trash-act${String(act)}`);
      const jewelrySource = pools.treasureClasses.get(`loot/jewelry-act${String(act)}`);
      if (!source || !jewelrySource) throw new Error('Missing production source');
      for (let seed = 0; seed < 8; seed++) {
        const monsterLevel = level + offset;
        const result = rollKillRewards({ act, tier: 'chapter-boss', monsterLevel, difficulty,
          treasureClassId: `loot/act${String(act)}-boss`, magicFind: 0, goldFind: 0 },
        { ...pools, equipmentGuarantees: new Map() }, createRng(seed));
        expect(result.items).toHaveLength(ordinary + jewelry);
        expect(result.items.every(item => item.ilvl === monsterLevel)).toBe(true);
        for (const item of result.items.slice(0, ordinary)) {
          expect(source.picks.some(pick => pick.baseId === item.baseId && pick.qlvlMin + 5 <= monsterLevel)).toBe(true);
        }
        const jewelryIds = new Set(jewelrySource.picks.map(pick => pick.baseId));
        for (const item of result.items.slice(ordinary)) {
          expect(jewelryIds.has(item.baseId)).toBe(true);
          expect(pools.bases.get(item.baseId)?.type).toBe('jewelry');
        }
      }
    });
  });
}

describe('chapter-boss source eligibility and integration', () => {
  it('covers actual chapter-boss levels in manual/idle plans under every replay profile', () => {
    const monsterIndex = new Map(monsters.map(monster => [monster.id, monster]));
    const fallback = monsters[0];
    if (!fallback) throw new Error('Missing production monsters');
    const checked = new Set<string>(), observed = new Set<string>();
    for (const subArea of subAreas) for (const mode of ['manual', 'idle'] as const) {
      const normal = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: fallback.id,
        fallbackLevel: subArea.areaLevel, seed: 7, challengeOrdinal: 0, mode });
      for (const difficulty of ['normal', 'nightmare', 'hell'] as const) {
        const plan = applyReplayProfileToPlan(normal, difficulty, monsterIndex);
        for (const wave of plan.waves) for (const spawn of wave.spawns) {
          const treasureClassId = wave.lootTable ?? plan.defaultLootTable;
          const rule = pools.chapterBossEquipment?.get(treasureClassId);
          if (!rule || spawn.tier !== 'chapter-boss') continue;
          observed.add(treasureClassId);
          const key = `${treasureClassId}/${difficulty}/${String(spawn.level)}`;
          if (checked.has(key)) continue;
          checked.add(key);
          const result = rollKillRewards({ act: rule.act, tier: spawn.tier, monsterLevel: spawn.level,
            treasureClassId, difficulty, magicFind: 0, goldFind: 0 },
          { ...pools, equipmentGuarantees: new Map() }, createRng(7));
          expect(result.items, key).toHaveLength(rule.groups.reduce((sum, group) => sum + group.count, 0));
          expect(result.items.every(item => item.ilvl === spawn.level), key).toBe(true);
        }
      }
    }
    expect([...observed].sort()).toEqual([...pools.chapterBossEquipment?.keys() ?? []].sort());
    expect(checked.size).toBeGreaterThanOrEqual(15);
  });

  it.each([[1, 59], [2, 72], [3, 87], [4, 101], [5, 122]] as const)(
    'retains a finite inclusive Act%i terminal cap%i', (act, level) => {
      const input = { act, tier: 'chapter-boss' as const, monsterLevel: level,
        treasureClassId: `loot/act${String(act)}-boss`, magicFind: 0, goldFind: 0, difficulty: 'hell' as const };
      const rule = pools.chapterBossEquipment?.get(input.treasureClassId);
      if (!rule) throw new Error('Missing production boss rule');
      expect(rollKillRewards(input, { ...pools, equipmentGuarantees: new Map() }, createRng(7)).items)
        .toHaveLength(rule.groups.reduce((sum, group) => sum + group.count, 0));
      const rng = createRng(7), next = vi.spyOn(rng, 'next');
      expect(() => rollKillRewards({ ...input, monsterLevel: level + 1 }, pools, rng))
        .toThrow('No eligible chapter-boss equipment');
      expect(next).not.toHaveBeenCalled();
    });

  it('keeps quest caches, other live tiers and unconfigured tables independent of the policy', () => {
    const input = { act: 1 as const, tier: 'boss' as const, monsterLevel: 14,
      treasureClassId: 'loot/act1-boss', magicFind: 0, goldFind: 0 };
    const compare = (run: (data: AwardDataPools) => unknown) => {
      __resetRollItemSeqForTests();
      const expected = run({ ...pools, chapterBossEquipment: new Map() });
      __resetRollItemSeqForTests();
      expect(run(pools)).toEqual(expected);
    };
    compare(data => {
      const rng = createRng(7);
      return { rewards: rollKillRewards(input, data, rng), following: rng.next() };
    });
    compare(data => {
      const rng = createRng(7);
      return { rewards: rollKillRewards({ ...input, tier: 'chapter-boss', treasureClassId: 'loot/trash-act1' }, data, rng),
        following: rng.next() };
    });
    compare(data => {
      const rng = createRng(7);
      return { rewards: rollQuestTableRewards({ tableId: input.treasureClassId, ilvl: 14, picks: 3 }, data, rng),
        following: rng.next() };
    });
  });

  it('reproduces complete rewards and subsequent RNG with matching allocator state', () => {
    const run = () => {
      __resetRollItemSeqForTests();
      const rng = createRng(73);
      return { rewards: rollKillRewards({ act: 5, tier: 'chapter-boss', monsterLevel: 118,
        treasureClassId: 'loot/act5-boss', difficulty: 'hell', magicFind: 300, magicFindMultiplier: 1.5,
        goldFind: 0 }, pools, rng), following: rng.next() };
    };
    expect(run()).toEqual(run());
  });

  it('validates authored schema and refuses duplicate bindings, typos and unbounded values', () => {
    expect(validateChapterBossEquipment(policy).size).toBe(5);
    const row = policy[0], group = row?.groups[0];
    if (!row || !group) throw new Error('Missing authored rule');
    for (const invalid of [{ ...group, count: 0 }, { ...group, count: 9 }, { ...group, count: 1.5 },
      { ...group, minimumLevelOffset: -1 }, { ...group, minimumLevelOffset: 6 },
      { ...group, terminalLevelCap: 201 }, { ...group, terminalLevelCap: Infinity }, { ...group, typo: 1 }]) {
      expect(() => validateChapterBossEquipment([{ ...row, groups: [invalid, group] }])).toThrow();
    }
    expect(() => validateChapterBossEquipment([row, row])).toThrow('Duplicate');
    expect(() => validateChapterBossEquipment([row, { ...row, treasureClassId: 'loot/another' }])).toThrow('Duplicate');
    expect(() => validateChapterBossEquipment([{ ...row, act: 6 }])).toThrow();
    expect(() => validateChapterBossEquipment([{ ...row, groups: [group] }])).toThrow();
  });
});

describe('bounded chapter-boss equipment source projection', () => {
  const input = { act: 1, tier: 'chapter-boss' as const, monsterLevel: 15, treasureClassId: 'loot/source-test' };
  const group: ChapterBossEquipmentGroup = { sourceTableId: 'loot/equipment-test', count: 4,
    minimumLevelOffset: 5, terminalLevelCap: 25 };
  const source = { id: group.sourceTableId, numPicks: 1, noDropChance: 1,
    picks: [{ baseId: 'old', weight: 1, qlvlMin: 1, qlvlMax: 9 },
      { baseId: 'new-a', weight: 1, qlvlMin: 10, qlvlMax: 20 },
      { baseId: 'new-b', weight: 3, qlvlMin: 10, qlvlMax: 20 },
      { type: 'rune' as const, itemId: 'runes/el', weight: 100, qlvlMin: 1, qlvlMax: 99 }] };
  const fixture = (override: Partial<ChapterBossEquipmentGroup> = {}) => ({
    treasureClasses: new Map([[source.id, source]]),
    chapterBossEquipment: new Map([[input.treasureClassId, { act: 1 as const, groups: [{ ...group, ...override }, group] }]])
  });

  it('adds five to minimum levels, extends only the terminal band, filters materials and preserves its source', () => {
    const original = structuredClone(source);
    const tables = chapterBossEquipmentTables(input, fixture());
    expect(tables).toHaveLength(2);
    expect(tables?.[0]).toEqual({ id: source.id, numPicks: 4, noDropChance: 0,
      picks: [{ baseId: 'old', weight: 1, qlvlMin: 6, qlvlMax: 9 },
        { baseId: 'new-a', weight: 1, qlvlMin: 15, qlvlMax: 25 },
        { baseId: 'new-b', weight: 3, qlvlMin: 15, qlvlMax: 25 }] });
    expect(source).toEqual(original);
    expect(() => chapterBossEquipmentTables({ ...input, monsterLevel: 14 }, fixture())).toThrow('No eligible');
    expect(() => chapterBossEquipmentTables({ ...input, act: 2 }, fixture())).toThrow('Mismatched');
  });

  it('preserves source weights and applies gear/offline MF to ordinary rarity', () => {
    const tc = chapterBossEquipmentTables(input, fixture())?.[0];
    if (!tc) throw new Error('Missing projected table');
    const roll = (unit: number, magicFind: number, magicFindMultiplier: number) => {
      const rng = createRng(7);
      vi.spyOn(rng, 'chance').mockReturnValue(false);
      // Unit .55 is white at MF0, magic at MF300, rare at MF300×1.5
      // under the independently evaluated chapter-boss rarity formula.
      vi.spyOn(rng, 'next').mockReturnValueOnce(unit).mockReturnValueOnce(0.55);
      return rollDrops({ tc: { ...tc, numPicks: 1 }, tier: 'chapter-boss', monsterLevel: 15,
        magicFind, magicFindMultiplier }, rng)[0];
    };
    expect(roll(0, 0, 1)).toMatchObject({ baseId: 'new-a', rarity: 'normal', ilvl: 15 });
    expect(roll(0.5, 0, 1)).toMatchObject({ baseId: 'new-b', rarity: 'normal' });
    expect(roll(0.5, 300, 1)).toMatchObject({ baseId: 'new-b', rarity: 'magic' });
    expect(roll(0.5, 300, 1.5)).toMatchObject({ baseId: 'new-b', rarity: 'rare' });
  });

  it('refuses invalid groups and missing, empty, malformed or truncated sources', () => {
    for (const invalid of [{ count: 0 }, { count: 9 }, { count: 1.5 }, { minimumLevelOffset: NaN },
      { minimumLevelOffset: 6 }, { terminalLevelCap: 19 }, { terminalLevelCap: 201 }, { terminalLevelCap: Infinity },
      { sourceTableId: 'loot/missing' }]) expect(() => chapterBossEquipmentTables(input, fixture(invalid))).toThrow();
    for (const picks of [[], [source.picks[3]], [{ baseId: 'bad', weight: NaN, qlvlMin: 1, qlvlMax: 20 }],
      [{ baseId: 'bad', weight: 1, qlvlMin: 21, qlvlMax: 20 }]]) {
      const data = fixture();
      // Separate typed tables keep malformed row values visible to runtime validation.
      const invalid = { ...source, picks: picks.filter((pick): pick is NonNullable<typeof pick> => pick !== undefined) };
      expect(() => chapterBossEquipmentTables(input, { ...data, treasureClasses: new Map([[source.id, invalid]]) })).toThrow();
    }
    expect(() => chapterBossEquipmentTables({ ...input, monsterLevel: NaN }, fixture())).toThrow();
  });
});
