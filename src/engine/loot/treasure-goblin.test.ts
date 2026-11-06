/** Constructed real-pool goblin rewards; no earned campaign/balance credit. */
import { afterEach, describe, expect, it } from 'vitest';
import { loadAwardPools } from '@/data/loaders/loot';
import { materialCatalog, materialEconomy, validateMaterialDefinitions } from '@/data/loaders/materials';
import catalogJson from '@/data/items/materials.json';
import economyJson from '@/data/loot/material-economy.json';
import { createRng, type Rng } from '../rng';
import { rollKillRewards, rollQuestTableRewards } from './award';
import type { TcPick } from './drop-roller';
import { __resetRollItemSeqForTests } from './rollItem';
import { rollCurrencyDrops } from './orbs-and-currency';
import { subAreas } from '@/data';
import { resolveChallengeWavePlan, resolveWavePlan } from '../combat/sub-area-run';

const pools = loadAwardPools();
const tableId = 'loot/treasure-goblin';
const input = { act: 1, tier: 'elite', monsterLevel: 20, treasureClassId: tableId, magicFind: 0, goldFind: 0 } as const;
const basePick: TcPick = { baseId: 'items/base/helm-cap', rarity: 'normal', weight: 1, qlvlMin: 1, qlvlMax: 99 };
function selectedPools(picks: readonly TcPick[] = [basePick], id = tableId) {
  return { ...pools, treasureClasses: new Map([[id, { id, numPicks: 1, noDropChance: 0, picks }]]),
    equipmentGuarantees: new Map() };
}
function constantRng(unit: number): Rng {
  return { next: () => unit, nextInt: (min, max) => min + Math.floor(unit * (max - min + 1)),
    chance: probability => unit < probability, pick: () => { throw new Error('Unexpected pick'); },
    fork: () => { throw new Error('Unexpected fork'); } };
}
afterEach(() => { __resetRollItemSeqForTests(); });

describe('authored goblin encounter binding', () => {
  const areas = subAreas.filter(area => area.waves.some(wave => wave.lootTable === 'loot/treasure-goblin'));
  it('covers the three actual goblin areas', () => { expect(areas).toHaveLength(3); });
  it.each(areas)('$id retains one goblin instead of multiplying its bundle with the challenge count', area => {
    for (const mode of ['manual', 'idle'] as const) for (const challengeOrdinal of [0, 9, 12]) {
      const plan = resolveChallengeWavePlan({ subArea: area, mode, challengeOrdinal, seed: 7,
        fallbackArchetypeId: 'unused', fallbackLevel: area.areaLevel });
      const wave = plan.waves.find(row => row.lootTable === 'loot/treasure-goblin');
      expect(wave?.spawns).toHaveLength(1);
    }
  });
  it.each(areas)('$id grants boss-weight loot for the authored elite combat tier', area => {
    const plan = resolveWavePlan(area, 'unused', area.areaLevel, 7);
    const wave = plan.waves.find(row => row.lootTable === 'loot/treasure-goblin');
    const spawn = wave?.spawns[0];
    if (!spawn) throw new Error('Missing authored goblin');
    expect(spawn.tier).toBe('elite');
    const act = Number(area.actId.slice(-1)) as 1 | 2 | 3 | 4 | 5;
    const input = { act, monsterLevel: spawn.level, treasureClassId: 'loot/treasure-goblin', magicFind: 300, goldFind: 0 };
    __resetRollItemSeqForTests();
    const expected = rollKillRewards({ ...input, tier: 'boss' }, pools, createRng(7));
    __resetRollItemSeqForTests();
    expect(rollKillRewards({ ...input, tier: spawn.tier }, pools, createRng(7))).toEqual(expected);
  });
});

for (const difficulty of ['normal', 'nightmare', 'hell'] as const) {
  describe(`treasure-goblin full bundle on ${difficulty}`, () => {
    it.each([[1, 4], [2, 20], [3, 34], [4, 47], [5, 78]] as const)(
      'Act%i level%i grants five equipment picks, its extra rare+, and independent materials', (act, level) => {
        const monsterLevel = level + (difficulty === 'normal' ? 0 : difficulty === 'nightmare' ? 20 : 44);
        const result = rollKillRewards({ act, tier: 'boss', monsterLevel, difficulty,
          treasureClassId: 'loot/treasure-goblin', magicFind: 0, goldFind: 0 }, pools, createRng(7));
        expect(result.items).toHaveLength(6);
        expect(['rare', 'set', 'unique']).toContain(result.items.at(-1)?.rarity);
        expect(result.items.every(item => item.ilvl === monsterLevel)).toBe(true);
        expect(result.runes).toBeGreaterThanOrEqual(1);
        expect(result.runes).toBeLessThanOrEqual(4);
        expect(result.gems).toBeGreaterThanOrEqual(5);
        expect(result.gems).toBeLessThanOrEqual(10);
        const runeAct = Math.min(5, act + 1);
        let runes = 0, gems = 0;
        for (const [id, quantity] of Object.entries(result.materials)) {
          if (materialCatalog.get(id)?.kind === 'rune') {
            runes += quantity;
            expect(materialEconomy.runeOrder.indexOf(id) + 1).toBeLessThanOrEqual(
              Math.min(materialEconomy.actRuneCaps[runeAct - 1] ?? 0, difficulty === 'hell' ? 33 : 22));
          } else {
            expect(materialCatalog.get(id)?.kind).toBe('gem');
            gems += quantity;
          }
        }
        expect(runes).toBe(result.runes);
        expect(gems).toBe(result.gems);
      }
    );
  });
}

describe('goblin bundle boundaries and isolation', () => {
  const last = 1 - Number.EPSILON / 2;
  it('draws independent material identities and aggregates repeated rune and gem stacks', () => {
    const units = [0, last, 0.5, last, 0, last, 0, last, 0, last, 0, last];
    let cursor = 0;
    const next = () => {
      const unit = units[cursor++];
      if (unit === undefined) throw new Error('Unexpected extra material draw');
      return unit;
    };
    const rng = { ...constantRng(0), next,
      nextInt: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)) };
    const policy = materialEconomy.treasureGoblin;
    const result = rollCurrencyDrops(78, 'boss', 5, 'hell', 0, rng, {
      runePoolAct: 5, runeQuantityMin: policy.runeQuantityMin,
      runeQuantityMax: policy.runeQuantityMax, runeMinOrdinal: 1, runeMaxOrdinal: 33,
      gemQuantity: policy.gemQuantityMin, gemQuantityMax: policy.gemQuantityMax
    });
    expect(result).toMatchObject({ runes: 4, gems: 5, materials: {
      'runes/el': 2, 'runes/zod': 2, 'gems/topaz/perfect': 3, 'gems/amethyst/normal': 2
    } });
    expect(cursor).toBe(units.length);
  });

  it('refuses a missing configured source before drawing and retains unknown ordinary fallback', () => {
    const unused = { ...constantRng(0), next: () => { throw new Error('Unexpected draw'); } };
    expect(() => rollKillRewards(input, { ...pools, treasureClasses: new Map() }, unused))
      .toThrow('Missing treasure-goblin equipment source');
    expect(rollKillRewards({ ...input, treasureClassId: 'loot/unknown-ordinary' }, pools, constantRng(last)))
      .toMatchObject({ items: [], runes: 0, gems: 0, materials: {} });
  });

  it.each([1, 2, 3, 4, 5] as const)('Act%i includes quantity endpoints, next-act runes and actual-act gem caps', act => {
    for (const difficulty of ['normal', 'nightmare', 'hell'] as const) for (const unit of [0, last]) {
      const result = rollKillRewards({ ...input, act, difficulty }, selectedPools(), constantRng(unit));
      const rune = unit === 0 ? 'el' : difficulty === 'hell'
        ? ['hel', 'fal', 'pul', 'zod', 'zod'][act - 1] : ['hel', 'fal', 'pul', 'um', 'um'][act - 1];
      if (!rune) throw new Error('Missing expected rune endpoint');
      const quality = unit === 0 ? act === 1 ? 'flawed' : 'normal' : act === 1 ? 'flawed' : act === 2 ? 'normal'
        : act === 5 && difficulty === 'hell' ? 'perfect' : 'flawless';
      expect(result.items).toHaveLength(5);
      expect(result.runes).toBe(unit === 0 ? 1 : 4);
      expect(result.gems).toBe(unit === 0 ? 5 : 10);
      expect(result.materials).toEqual({ [`runes/${rune}`]: result.runes,
        [`gems/${unit === 0 ? 'amethyst' : 'topaz'}/${quality}`]: result.gems });
    }
  });

  it('uses gear MF, its offline multiplier and boss weights independently of combat promotion', () => {
    const { rarity: _rarity, ...unforced } = basePick;
    const data = selectedPools([unforced]);
    const rarities = (magicFind: number, magicFindMultiplier = 1) => rollKillRewards({ ...input, magicFind,
      magicFindMultiplier }, data, constantRng(0.56)).items.map(item => item.rarity);
    expect(rarities(0)).toEqual(Array(5).fill('normal'));
    expect(rarities(300)).toEqual(Array(5).fill('magic'));
    expect(rarities(300, 1.5)).toEqual(Array(5).fill('rare'));
    for (const tier of ['trash', 'elite', 'champion', 'rare-elite', 'rare-minion', 'chapter-boss'] as const) {
      __resetRollItemSeqForTests();
      const expected = rollKillRewards({ ...input, tier: 'boss', magicFind: 300 }, data, createRng(7));
      __resetRollItemSeqForTests();
      expect(rollKillRewards({ ...input, tier, magicFind: 300 }, data, createRng(7))).toEqual(expected);
    }
  });

  it('retains authored forced set/unique entries and all source weights without mutating pools', () => {
    const picks = [
      { ...basePick, baseId: 'items/base/wp1h-phase-blade', rarity: 'unique' as const, weight: 1 },
      { ...basePick, baseId: 'items/base/armor-dusk-shroud', rarity: 'set' as const, weight: 3 }
    ];
    const data = selectedPools(picks), before = JSON.stringify([...data.treasureClasses]);
    for (const [unit, rarity, baseId] of [[0.249, 'unique', picks[0]?.baseId], [0.251, 'set', picks[1]?.baseId]] as const) {
      const result = rollKillRewards({ ...input, monsterLevel: 70 }, data, constantRng(unit));
      expect(result.items).toHaveLength(5);
      expect(result.items.every(item => item.rarity === rarity && item.baseId === baseId)).toBe(true);
    }
    expect(JSON.stringify([...data.treasureClasses])).toBe(before);
  });

  it('extends only the terminal equipment band to122 and refuses invalid or unmaterializable complete bags', () => {
    const data = selectedPools([{ ...basePick, qlvlMax: 20 },
      { ...basePick, baseId: 'items/base/helm-armet', qlvlMin: 21 }]);
    for (const monsterLevel of [21, 99, 100, 122]) {
      const result = rollKillRewards({ ...input, monsterLevel }, data, createRng(7));
      expect(result.items).toHaveLength(5);
      expect(result.items.every(item => item.baseId === 'items/base/helm-armet' && item.ilvl === monsterLevel)).toBe(true);
    }
    for (const monsterLevel of [0, 123, 1.5, NaN]) expect(() =>
      rollKillRewards({ ...input, monsterLevel }, data, createRng(7))).toThrow('Invalid treasure-goblin equipment context');
    for (const picks of [[], [{ ...basePick, weight: NaN }], [{ ...basePick, qlvlMin: 21 }]]) expect(() =>
      rollKillRewards(input, selectedPools(picks), createRng(7))).toThrow();
    expect(() => rollKillRewards(input, { ...selectedPools(), bases: new Map() }, createRng(7)))
      .toThrow('Incomplete reward materialization');
    expect(() => rollKillRewards(input, { ...selectedPools(), treasureClasses: new Map() }, createRng(7)))
      .toThrow('Missing treasure-goblin equipment source');
  });

  it('leaves explicit caches and unrelated live tables outside the goblin bundle', () => {
    const direct = { type: 'rune' as const, itemId: 'runes/zod', weight: 1, qlvlMin: 1, qlvlMax: 99 };
    expect(rollQuestTableRewards({ tableId, ilvl: 20, picks: 3 }, selectedPools([direct]), createRng(7)))
      .toMatchObject({ items: [], runes: 3, gems: 0, materials: { 'runes/zod': 3 } });
    const otherId = 'loot/unconfigured-goblin';
    const result = rollKillRewards({ ...input, treasureClassId: otherId }, selectedPools([basePick], otherId), constantRng(last));
    expect(result.items).toHaveLength(1);
    expect(result).toMatchObject({ runes: 0, gems: 0, materials: {} });
  });

  it('repeats the complete bag and following RNG state from the same seed', () => {
    const run = () => {
      __resetRollItemSeqForTests(); const rng = createRng(7);
      return { rewards: rollKillRewards(input, pools, rng), following: rng.next() };
    };
    expect(run()).toEqual(run());
  });

  it('refuses missing, extra, unbounded and reversed authored goblin policy fields', () => {
    const policy = economyJson.treasureGoblin;
    const { gemQuantityMax: _omitted, ...incomplete } = policy;
    for (const treasureGoblin of [incomplete, { ...policy, typo: 1 }, { ...policy, equipmentPicks: 9 },
      { ...policy, terminalLevelCap: Infinity }, { ...policy, runeQuantityMax: 5 }, { ...policy, gemQuantityMax: 11 },
      { ...policy, runePoolActOffset: 2 }, { ...policy, treasureClassId: 'loot/other' }]) expect(() =>
      validateMaterialDefinitions(catalogJson, { ...economyJson, treasureGoblin })).toThrow('Invalid material definitions');
    for (const treasureGoblin of [{ ...policy, runeQuantityMin: 4, runeQuantityMax: 1 },
      { ...policy, gemQuantityMin: 10, gemQuantityMax: 5 }]) expect(() =>
      validateMaterialDefinitions(catalogJson, { ...economyJson, treasureGoblin }))
      .toThrow('Inconsistent treasure-goblin material bundle');
  });
});
