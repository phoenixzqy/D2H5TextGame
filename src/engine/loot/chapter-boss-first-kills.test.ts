/** Constructed first-kill evidence; no earned/balance credit. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadAwardPools } from '@/data/loaders/loot';
import { createRng } from '../rng';
import { rollKillRewards, rollQuestTableRewards, type AwardDataPools } from './award';
import { rollChapterBossFirstKill, type ChapterBossFirstKillRule } from './chapter-boss-first-kills';
import { validateChapterBossFirstKills, validateChapterBossFirstKillReferences } from '@/data/loaders/chapter-boss-first-kills';
import policy from '@/data/loot/chapter-boss-first-kills.json';
import { materialEconomy } from '@/data/loaders/materials';
import { __resetRollItemSeqForTests, rollUniqueItem } from './rollItem';

const pools = loadAwardPools();
const bosses = [[1,14], [2,27], [3,42], [4,57], [5,78]] as const;
afterEach(() => { vi.restoreAllMocks(); __resetRollItemSeqForTests(); });
for (const [difficulty, offset] of [['normal',0], ['nightmare',20], ['hell',40]] as const) {
  describe(`first-kill boss rewards on ${difficulty}`, () => {
    it.each(bosses)('Act%i level%i appends a genuine unique and preserves the preceding rewards', (act, level) => {
      const input = { act, monsterLevel: level + offset, tier: 'chapter-boss' as const,
        treasureClassId: `loot/act${String(act)}-boss`, magicFind: 0, goldFind: 0, difficulty };
      __resetRollItemSeqForTests();
      const ordinary = rollKillRewards(input, pools, createRng(7));
      __resetRollItemSeqForTests();
      const first = rollKillRewards({ ...input, firstKillBonus: true }, pools, createRng(7));
      expect(first.items).toHaveLength(ordinary.items.length + 1);
      expect(first.items.slice(0,-1)).toEqual(ordinary.items);
      expect(first.items.at(-1)).toMatchObject({ rarity: 'unique', ilvl: level + offset });
      expect(first.items.at(-1)?.uniqueId).toBeTruthy();
      const extraRune = act === 5 && difficulty === 'hell' ? 1 : 0;
      expect(first.runes).toBe(ordinary.runes + extraRune);
      expect(first.gems).toBe(ordinary.gems);
      expect(first.wishstones).toBe(ordinary.wishstones);
      const materials = { ...first.materials };
      if (extraRune) {
        const changes = Object.keys(materials).filter(id => materials[id] !== ordinary.materials[id]);
        expect(changes).toHaveLength(1);
        const id = changes[0];
        if (!id) throw new Error('Missing extra rune');
        expect(materialEconomy.runeOrder.indexOf(id)).toBeGreaterThanOrEqual(22);
        expect(materials[id]).toBe((ordinary.materials[id] ?? 0) + 1);
        if (materials[id] === 1) Reflect.deleteProperty(materials, id);
        else materials[id] = (materials[id] ?? 0) - 1;
      }
      expect(materials).toEqual(ordinary.materials);
      expect(first.runeShards).toBe(ordinary.runeShards);
    });
  });
}
it.each([['items/unique/stone-of-jordan',27,29], ['items/unique/grandfather',57,81]] as const)('can materialize exact %s at actual first-boss ilvl%i while keeping equip level%i', (uniqueId, ilvl, level) => {
    expect(rollUniqueItem({ uniqueId, ilvl }, pools, createRng(7))).toMatchObject({ uniqueId, ilvl, level });
  });

const tableId = 'loot/first-kill-test';
const input = { act: 1, monsterLevel: 10, tier: 'chapter-boss' as const,
  treasureClassId: tableId, difficulty: 'normal' as const, firstKillBonus: true };
function fixture(rule: Partial<ChapterBossFirstKillRule> = {}): AwardDataPools {
  const bases = [
    { id: 'test/armor', name: 'Armor', type: 'armor' as const, slot: 'head' as const },
    { id: 'test/weapon', name: 'Weapon', type: 'weapon' as const, slot: 'weapon' as const },
    { id: 'test/ring', name: 'Ring', type: 'jewelry' as const, slot: 'ring-left' as const }
  ].map(base => ({ ...base, reqLevel: 1, maxSockets: 0, canHaveAffixes: true }));
  return { bases: new Map(bases.map(base => [base.id, base])), affixes: [],
    uniques: bases.map(base => ({ id: base.id + '-unique', baseId: base.id, name: base.name, reqLevel: 1, weight: 1 })),
    treasureClasses: new Map([[tableId, { id: tableId, picks: bases.map(base =>
      ({ baseId: base.id, weight: 1, qlvlMin: 1, qlvlMax: 20 })) }]]),
    chapterBossFirstKills: { eliteBaseIds: new Set(['test/weapon']), bosses: new Map([[tableId,
      { act: 1, areaId: 'test/area', bossId: 'test/boss', randomUnique: 'any', ...rule }]]) } };
}

it('loads the five exact first-kill alternatives and the explicitly authored Elite catalog', () => {
  expect([...pools.chapterBossFirstKills?.bosses ?? []]).toEqual(policy.bosses.map(({ treasureClassId, ...rule }) => [treasureClassId, rule]));
  expect(policy.bosses.map(row => [row.randomUnique, row.namedUnique, row.hellRune])).toEqual([
    ['any', undefined, undefined], ['any', { id: 'items/unique/stone-of-jordan', chance: 0.05 }, undefined],
    ['armor-or-weapon', undefined, undefined], ['elite', { id: 'items/unique/grandfather', chance: 0.03 }, undefined],
    ['any', undefined, { minimum: 23, maximum: 33 }]
  ]);
  expect(pools.chapterBossFirstKills?.eliteBaseIds.size).toBe(20);
  expect([...pools.chapterBossFirstKills?.eliteBaseIds ?? []]).toEqual(policy.eliteBaseIds);
});

it.each([0.05, 0.03])('honors the strict named chance boundary at %i and excludes it from random alternatives', chance => {
  const data = fixture({ namedUnique: { id: 'test/ring-unique', chance } });
  for (const [seed, named] of [[7, true], [1, false]] as const) {
    expect(rollChapterBossFirstKill(input, data, createRng(seed)).items[0]?.uniqueId === 'test/ring-unique').toBe(named);
  }
  for (const delta of [-1e-10, 0, 1e-10]) {
    const rng = createRng(7), draw = createRng(7).next();
    const boundary = fixture({ namedUnique: { id: 'test/ring-unique', chance: draw + delta } });
    const reward = rollChapterBossFirstKill(input, boundary, rng);
    expect(reward.items[0]?.uniqueId === 'test/ring-unique').toBe(delta > 0);
    if (delta <= 0) expect(['test/armor-unique', 'test/weapon-unique']).toContain(reward.items[0]?.uniqueId);
  }
});

it.each(['armor-or-weapon', 'elite'] as const)('restricts random %s selection before weighted source materialization', randomUnique => {
  for (const unit of [0, 0.499, 0.501, 0.999]) {
    const rng = createRng(7); vi.spyOn(rng, 'next').mockReturnValueOnce(unit);
    const reward = rollChapterBossFirstKill(input, fixture({ randomUnique }), rng);
    expect(randomUnique === 'elite' ? ['test/weapon-unique'] : ['test/armor-unique', 'test/weapon-unique'])
      .toContain(reward.items[0]?.uniqueId);
  }
});

it('retains independently weighted base and unique choices after first-kill restrictions', () => {
  const data = fixture({ randomUnique: 'armor-or-weapon' });
  const armor = data.uniques?.[0], weapon = data.uniques?.[1];
  if (!armor || !weapon) throw new Error('Missing weighted fixture');
  const weighted = { ...data, treasureClasses: new Map([[tableId, { id: tableId, picks: [
    { baseId: 'test/armor', weight: 1, qlvlMin: 1, qlvlMax: 20 },
    { baseId: 'test/weapon', weight: 3, qlvlMin: 1, qlvlMax: 20 },
    { baseId: 'test/ring', weight: 100, qlvlMin: 1, qlvlMax: 20 }
  ] }]]), uniques: [{ ...armor, weight: 1 }, { ...armor, id: 'test/second-armor', weight: 3 }, weapon] };
  for (const [baseUnit, templateUnit, expected] of [[0, 0, 'test/armor-unique'], [0.249, 0.251, 'test/second-armor'],
    [0.251, 0, 'test/weapon-unique'], [0.999, 0.999, 'test/weapon-unique']] as const) {
    const rng = createRng(7); vi.spyOn(rng, 'next').mockReturnValueOnce(baseUnit).mockReturnValueOnce(templateUnit);
    expect(rollChapterBossFirstKill(input, weighted, rng).items[0]?.uniqueId).toBe(expected);
  }
});

it.each(['normal', 'nightmare', 'hell'] as const)('awards the configured high rune only in Hell, actual difficulty %s', difficulty => {
  for (const [unit, expected] of [[0, 'runes/mal'], [0.999999999, 'runes/zod']] as const) {
    const rng = createRng(7); vi.spyOn(rng, 'next').mockReturnValue(unit);
    const reward = rollChapterBossFirstKill({ ...input, act: 5, difficulty },
      fixture({ act: 5, hellRune: { minimum: 23, maximum: 33 } }), rng);
    expect(reward.runes).toBe(difficulty === 'hell' ? 1 : 0);
    expect(reward.materials).toEqual(difficulty === 'hell' ? { [expected]: 1 } : {});
  }
});

it('leaves disabled policies, nonchapter tiers and unconfigured tables with identical following entropy', () => {
  for (const change of [{ firstKillBonus: false }, { tier: 'boss' as const }, { treasureClassId: 'loot/other' }]) {
    const rng = createRng(7);
    expect(rollChapterBossFirstKill({ ...input, ...change }, fixture(), rng).items).toEqual([]);
    expect(rng.next()).toBe(createRng(7).next());
  }
  const rng = createRng(7), { chapterBossFirstKills: _policy, ...data } = fixture();
  expect(rollChapterBossFirstKill(input, data, rng).items).toEqual([]);
  expect(rng.next()).toBe(createRng(7).next());
});

it('keeps quest caches independent of first-kill policies and reproduces the complete following stream', () => {
  const run = (withPolicy: boolean) => {
    __resetRollItemSeqForTests(); const rng = createRng(73);
    const { chapterBossFirstKills: _first, ...without } = pools;
    return { rewards: rollQuestTableRewards({ tableId: 'loot/act1-boss', ilvl: 19, picks: 3 }, withPolicy ? pools : without, rng), following: rng.next() };
  };
  expect(run(true)).toEqual(run(false));
  const first = () => {
    __resetRollItemSeqForTests(); const rng = createRng(73);
    return { rewards: rollKillRewards({ act: 5, tier: 'chapter-boss', monsterLevel: 118,
      treasureClassId: 'loot/act5-boss', difficulty: 'hell', firstKillBonus: true, magicFind: 0, goldFind: 0 }, pools, rng), following: rng.next() };
  };
  expect(first()).toEqual(first());
});

it('refuses selected missing/ineligible named templates, empty restricted pools and unreviewed sockets', () => {
  const chance = createRng(7).next() + 0.01;
  for (const override of [{ uniques: [] }, { uniques: [{ id: 'test/ring-unique', name: 'Ring', baseId: 'test/ring', reqLevel: 11 }] }]) {
    expect(() => rollChapterBossFirstKill(input, { ...fixture({ namedUnique: { id: 'test/ring-unique', chance } }), ...override }, createRng(7))).toThrow();
  }
  expect(() => rollChapterBossFirstKill(input, { ...fixture({ randomUnique: 'elite' }), uniques: [] }, createRng(7))).toThrow('materializable');
  const data = fixture({ randomUnique: 'elite' }), base = data.bases.get('test/weapon');
  if (!base) throw new Error('Missing socket fixture');
  expect(() => rollChapterBossFirstKill(input, { ...data, bases: new Map([['test/weapon', { ...base, maxSockets: 7 }]]) }, createRng(7))).toThrow('materializable');
});

it('rejects malformed schemas, duplicate bindings and invalid rune placement or order', () => {
  expect(validateChapterBossFirstKills(policy).bosses.size).toBe(5);
  const row = policy.bosses[0];
  if (!row) throw new Error('Missing schema fixture');
  for (const override of [{ act: 6 }, { typo: true }, { randomUnique: 'jewelry' },
    { namedUnique: { id: 'items/unique/test', chance: 0 } }, { namedUnique: { id: 'items/unique/test', chance: NaN } },
    { hellRune: { minimum: 23, maximum: 33 } }, { areaId: 'areas/act2-wrong' }]) {
    expect(() => validateChapterBossFirstKills({ ...policy, bosses: [{ ...row, ...override }, ...policy.bosses.slice(1)] })).toThrow();
  }
  expect(() => validateChapterBossFirstKills({ ...policy, bosses: [row, row, ...policy.bosses.slice(2)] })).toThrow();
  expect(() => validateChapterBossFirstKills({ ...policy, bosses: policy.bosses.map(boss => boss.act === 5
    ? { ...boss, hellRune: { minimum: 30, maximum: 23 } } : boss) })).toThrow();
  expect(() => validateChapterBossFirstKills({ ...policy, typo: true })).toThrow();
});

it('validates every referenced table, Elite base and exact named template when assembling pools', () => {
  const rules = pools.chapterBossFirstKills;
  if (!rules) throw new Error('Missing live policy');
  expect(() => { validateChapterBossFirstKillReferences(rules, pools); }).not.toThrow();
  for (const override of [{ treasureClasses: new Map() }, { bases: new Map() }, { uniques: [] }]) {
    expect(() => { validateChapterBossFirstKillReferences(rules, { ...pools, ...override }); }).toThrow();
  }
});
