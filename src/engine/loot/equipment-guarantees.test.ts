/** Constructed real-pool rewards; no earned campaign or balance credit. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { loadAwardPools } from '@/data/loaders/loot';
import rawPolicy from '@/data/loot/equipment-guarantees.json';
import schema from '@/data/schema/equipment-guarantees.schema.json';
import { monsters, subAreas } from '@/data';
import { resolveChallengeWavePlan } from '../combat/sub-area-run';
import { applyReplayProfileToPlan } from '../map/replay-profile';
import { createRng } from '../rng';
import { rollKillRewards, rollQuestTableRewards, type AwardDataPools, type KillRewardInput } from './award';
import { rollEquipmentGuarantees, type EquipmentGuarantee } from './equipment-guarantees';
import { __resetRollItemSeqForTests } from './rollItem';

// Paired comparisons measure only rarity guarantees, before optional uniques.
const pools = { ...loadAwardPools(), chapterBossUniques: new Map() };
afterEach(() => { vi.restoreAllMocks(); __resetRollItemSeqForTests(); });
const rarePlus = new Set(['rare', 'set', 'unique']);

function paired(input: KillRewardInput, seed: number) {
  __resetRollItemSeqForTests();
  const baseline = rollKillRewards(input, { ...pools, equipmentGuarantees: new Map() }, createRng(seed));
  __resetRollItemSeqForTests();
  const actual = rollKillRewards(input, pools, createRng(seed));
  expect(actual.items.slice(0, baseline.items.length)).toEqual(baseline.items);
  expect({ ...actual, items: [] }).toEqual({ ...baseline, items: [] });
  return actual.items.slice(baseline.items.length);
}

describe('BUG680 production additional equipment guarantees', () => {
  it.each([
    [1, 14, 1, 0], [2, 27, 1, 0], [3, 42, 2, 0], [4, 57, 2, 1], [5, 78, 3, 1]
  ] as const)('adds the exact Act%i boss guarantees without replacing ordinary rewards', (act, level, rare, special) => {
    for (let seed = 0; seed < 16; seed++) {
      const bonus = paired({ act, tier: 'chapter-boss', monsterLevel: level,
        treasureClassId: `loot/act${String(act)}-boss`, magicFind: 0, goldFind: 0 }, seed);
      expect(bonus).toHaveLength(rare + special);
      expect(bonus.every(item => rarePlus.has(item.rarity))).toBe(true);
      expect(bonus.every(item => item.ilvl === level)).toBe(true);
      if (special) expect(['set', 'unique']).toContain(bonus.at(-1)?.rarity);
    }
  });

  it.each([2, 18, 30, 45, 70])('adds a rare+ goblin item at actual level%i', level => {
    const bonus = paired({ act: 1, tier: 'boss', monsterLevel: level,
      treasureClassId: 'loot/treasure-goblin', magicFind: 300, magicFindMultiplier: 1.5, goldFind: 0 }, 17);
    expect(bonus).toHaveLength(1);
    expect(rarePlus.has(bonus[0]?.rarity ?? '')).toBe(true);
  });

  it.each([[1, 4], [2, 20], [3, 34], [4, 47], [5, 58]] as const)(
    'adds only the optional rare+ bonus to the Act%i mini at level%i', (act, level) => {
      const observed = new Set<number>();
      for (let seed = 0; seed < 16; seed++) {
        const bonus = paired({ act, tier: 'boss', monsterLevel: level,
          treasureClassId: `loot/mini-act${String(act)}`, magicFind: 0, goldFind: 0 }, seed);
        expect([0, 1]).toContain(bonus.length);
        expect(bonus.every(item => rarePlus.has(item.rarity))).toBe(true);
        observed.add(bonus.length);
      }
      expect([...observed].sort()).toEqual([0, 1]);
    }
  );
});

const baseId = 'test/base', tableId = 'loot/guarantee-test';
const input = { treasureClassId: tableId, monsterLevel: 10, tier: 'boss' as const, magicFind: 0 };
function fixture(minimumRarity: 'rare' | 'set' = 'rare', overrides: Partial<EquipmentGuarantee> = {}): AwardDataPools {
  return {
    bases: new Map([[baseId, { id: baseId, name: 'Test', type: 'armor', slot: 'head',
      reqLevel: 1, maxSockets: 0, canHaveAffixes: true }]]),
    affixes: [],
    uniques: [{ id: 'test/unique', name: 'Unique', baseId, reqLevel: 10, weight: 1 }],
    setPieces: [{ id: 'test/set-piece', setId: 'test/set', name: 'Set', baseId, reqLevel: 10, weight: 1 }],
    treasureClasses: new Map([[tableId, { id: tableId, numPicks: 1, noDropChance: 0,
      picks: [{ baseId, weight: 1, qlvlMin: 1, qlvlMax: 20 }] }]]),
    equipmentGuarantees: new Map([[tableId, [{ sourceTableId: tableId, minimumRarity, count: 1, chance: 1, ...overrides }]]])
  };
}

describe('bounded materialized equipment selection', () => {
  it.each([[0, 'rare'], [0.8, 'set'], [0.95, 'unique']] as const)(
    'conditions boss MF0 weights320:48:48 at unit%i to%s', (unit, rarity) => {
      const rng = createRng(7);
      vi.spyOn(rng, 'next').mockReturnValueOnce(unit);
      expect(rollEquipmentGuarantees(input, fixture(), rng)[0]?.rarity).toBe(rarity);
    }
  );

  it('uses gear MF and its offline multiplier in set-versus-unique selection', () => {
    const result = (magicFind: number, magicFindMultiplier: number, unit: number) => {
      const rng = createRng(7);
      vi.spyOn(rng, 'next').mockReturnValueOnce(unit);
      return rollEquipmentGuarantees({ ...input, magicFind, magicFindMultiplier }, fixture('set'), rng)[0]?.rarity;
    };
    // At MF0 set/unique weights are equal; MF300 boosts unique slightly more.
    expect(result(0, 1, 0.49)).toBe('set');
    expect(result(300, 1, 0.49)).toBe('unique');
    expect(result(300, 1, 0.482)).toBe('set');
    expect(result(300, 1.5, 0.482)).toBe('unique');
  });

  it('preserves base weights while excluding currency and out-of-band bases', () => {
    const data = fixture(), base = data.bases.get(baseId);
    if (!base) throw new Error('Missing fixture base');
    const other = 'test/other';
    const selection: AwardDataPools = { ...data, uniques: [], setPieces: [],
      bases: new Map([...data.bases, [other, { ...base, id: other }]]),
      treasureClasses: new Map([[tableId, { id: tableId, picks: [
        { baseId, weight: 1, qlvlMin: 1, qlvlMax: 20 },
        { baseId: other, weight: 3, qlvlMin: 1, qlvlMax: 20 },
        { baseId: 'test/future', weight: 100, qlvlMin: 11, qlvlMax: 20 },
        { type: 'currency', itemId: 'currency/wishstone', weight: 100, qlvlMin: 1, qlvlMax: 20 }
      ] }]]) };
    for (const [unit, expected] of [[0.249, baseId], [0.251, other], [0.999, other]] as const) {
      const rng = createRng(7);
      vi.spyOn(rng, 'next').mockReturnValueOnce(unit);
      expect(rollEquipmentGuarantees(input, selection, rng)[0]).toMatchObject({ baseId: expected, rarity: 'rare' });
    }
  });

  it('materializes a rare fallback when no eligible unique/set template exists', () => {
    const rng = createRng(7);
    vi.spyOn(rng, 'next').mockReturnValueOnce(0.999);
    expect(rollEquipmentGuarantees(input, { ...fixture(), uniques: [], setPieces: [] }, rng)[0]?.rarity).toBe('rare');
  });

  it.each([
    { reqLevel: 11, weight: 1 }, { reqLevel: 1, qlvl: 11, weight: 1 },
    { reqLevel: 1, weight: 0 }, { reqLevel: 1, weight: -1 }, { reqLevel: 1, weight: Infinity }
  ])('refuses set/unique fallback for ineligible template%j', template => {
    const data = { ...fixture('set'), setPieces: [], uniques: [{ id: 'test/ineligible', name: 'Unavailable', baseId, ...template }] };
    expect(() => rollEquipmentGuarantees(input, data, createRng(7))).toThrow(/materializable/i);
  });

  it('uses template qlvl instead of equip level and never selects a zero-weight template at zero', () => {
    const data = { ...fixture('set'), setPieces: [], uniques: [
      { id: 'test/disabled', name: 'Disabled', baseId, reqLevel: 1, weight: 0 },
      { id: 'test/eligible', name: 'Eligible', baseId, reqLevel: 15, qlvl: 10, weight: 1 }
    ] };
    const rng = createRng(7);
    vi.spyOn(rng, 'next').mockReturnValue(0);
    expect(rollEquipmentGuarantees(input, data, rng)[0]).toMatchObject({
      rarity: 'unique', uniqueId: 'test/eligible', ilvl: 10, level: 15
    });
  });

  it.each([['missing source', { sourceTableId: 'loot/missing' }], ['bad count', { count: 4 }],
    ['fractional count', { count: 0.5 }], ['bad chance', { chance: NaN }]] as const)(
    'refuses a configured%s', (_name, overrides) => {
      expect(() => rollEquipmentGuarantees(input, fixture('rare', overrides), createRng(7))).toThrow();
    }
  );

  it('refuses missing bases or unreviewed socket budgets instead of dropping the guarantee', () => {
    const data = fixture();
    expect(() => rollEquipmentGuarantees(input, { ...data, bases: new Map() }, createRng(7))).toThrow(/materializable/i);
    const base = data.bases.get(baseId);
    if (!base) throw new Error('Missing fixture base');
    expect(() => rollEquipmentGuarantees(input, { ...data,
      bases: new Map([[baseId, { ...base, maxSockets: -1 }]]) }, createRng(7))).toThrow(/materializable/i);
  });

  it('uses the exact50% chance boundary and consumes no RNG when unconfigured', () => {
    for (const [unit, count] of [[0.499, 1], [0.5, 0]] as const) {
      const rng = createRng(7), next = vi.spyOn(rng, 'next');
      vi.spyOn(rng, 'chance').mockImplementation(probability => unit < probability);
      expect(rollEquipmentGuarantees(input, fixture('rare', { chance: 0.5 }), rng)).toHaveLength(count);
      if (!count) expect(next).not.toHaveBeenCalled();
    }
    const rng = createRng(7), control = createRng(7);
    expect(rollEquipmentGuarantees({ ...input, treasureClassId: 'loot/ordinary' }, fixture(), rng)).toEqual([]);
    expect(rng.next()).toBe(control.next());
  });

  it('leaves quest tables independent even when their table has a live-kill guarantee', () => {
    const data = fixture(), roll = (policy: AwardDataPools['equipmentGuarantees']) => {
      __resetRollItemSeqForTests();
      const rng = createRng(7);
      const rewards = rollQuestTableRewards({ tableId, ilvl: 10, picks: 1 },
        { ...data, equipmentGuarantees: policy ?? new Map() }, rng);
      return { rewards, following: rng.next() };
    };
    const without = roll(new Map());
    expect(without.rewards?.items).toHaveLength(1);
    expect(roll(data.equipmentGuarantees)).toEqual(without);
  });

  it('reproduces complete added items and following RNG with matching allocator state', () => {
    const result = () => {
      __resetRollItemSeqForTests();
      const rng = createRng(1138);
      return { items: rollEquipmentGuarantees(input, fixture(), rng), following: rng.next() };
    };
    expect(result()).toEqual(result());
  });
});

describe('authored guarantee policy', () => {
  it('can materialize every configured guarantee at actual planned Normal/Nightmare/Hell levels', () => {
    const monsterIndex = new Map(monsters.map(monster => [monster.id, monster]));
    const fallback = monsters[0];
    if (!fallback) throw new Error('Missing production monsters');
    const observed = new Set<string>(), checked = new Set<string>();
    for (const subArea of subAreas) for (const mode of ['manual', 'idle'] as const) {
      const normal = resolveChallengeWavePlan({ subArea, fallbackArchetypeId: fallback.id,
        fallbackLevel: subArea.areaLevel, seed: 7, challengeOrdinal: 0, mode });
      for (const profile of ['normal', 'nightmare', 'hell'] as const) {
        const plan = applyReplayProfileToPlan(normal, profile, monsterIndex);
        for (const wave of plan.waves) {
          const treasureClassId = wave.lootTable ?? plan.defaultLootTable;
          const rules = pools.equipmentGuarantees?.get(treasureClassId);
          if (!rules) continue;
          observed.add(treasureClassId);
          for (const spawn of wave.spawns) {
            const key = `${treasureClassId}/${spawn.tier}/${String(spawn.level)}`;
            if (checked.has(key)) continue;
            checked.add(key);
            // Force only optional bonus coins to hit; use production bases,
            // templates, levels, weights and all native item/materialization RNG.
            const rng = createRng(7);
            vi.spyOn(rng, 'chance').mockReturnValue(true);
            const bonus = rollEquipmentGuarantees({ treasureClassId, monsterLevel: spawn.level,
              tier: spawn.tier, magicFind: 0 }, pools, rng);
            expect(bonus, key).toHaveLength(rules.reduce((sum, rule) => sum + rule.count, 0));
            expect(bonus.every(item => rarePlus.has(item.rarity) && item.ilvl === spawn.level), key).toBe(true);
            if (rules.some(rule => rule.minimumRarity === 'set')) expect(['set', 'unique']).toContain(bonus.at(-1)?.rarity);
          }
        }
      }
    }
    expect([...observed].sort()).toEqual([...pools.equipmentGuarantees?.keys() ?? []].sort());
    expect(checked.size).toBeGreaterThan(30);
  });

  it('validates every shipped rule and rejects typo, invalid rarity and unbounded counts', () => {
    const validate = new Ajv2020({ strict: true }).compile(schema);
    expect(validate(rawPolicy), JSON.stringify(validate.errors)).toBe(true);
    expect(rawPolicy).toHaveLength(11);
    const row = rawPolicy[0], rule = row?.guarantees[0];
    if (!row || !rule) throw new Error('Missing production rule');
    for (const invalid of [{ ...rule, count: 4 }, { ...rule, count: 0 }, { ...rule, count: 1.5 },
      { ...rule, chance: -0.1 }, { ...rule, chance: 1.1 }, { ...rule, minimumRarity: 'magic' }, { ...rule, typo: 1 }]) {
      expect(validate([{ ...row, guarantees: [invalid] }])).toBe(false);
    }
  });
});
