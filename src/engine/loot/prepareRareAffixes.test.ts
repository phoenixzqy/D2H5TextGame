/** D11 affix-only helper contracts; service/runtime acceptance is separate. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadAffixPool, loadItemBases, loadRarityAffixRules } from '@/data/loaders/loot';
import * as random from '@/engine/rng';
import type { Affix, ItemBase, RolledAffix } from '@/engine/types/items';
import { __resetRollItemSeqForTests, prepareRareAffixes, prepareRareAffixPair, rollItem,
  type RarityAffixCount } from '@/engine/loot/rollItem';

const rules: RarityAffixCount = { prefix: { min: 1, max: 3 }, suffix: { min: 1, max: 3 }, total: { min: 4, max: 6 } };
const base: ItemBase = { id: 'test/rare-blade', name: 'Rare fixture', type: 'weapon', slot: 'weapon',
  reqLevel: 99, maxSockets: 0, canHaveAffixes: true };
function affix(id: string, kind: Affix['kind'], weight = 1): Affix {
  return { id, kind, i18nKey: id, stat: 'mana', appliesTo: ['weapon'], rarityWeights: { rare: weight, magic: 100 },
    tiers: [{ ilvlMin: 10, ilvlMax: 19, valueMin: 2, valueMax: 4 }, { ilvlMin: 20, ilvlMax: 30, valueMin: 11, valueMax: 13 }] };
}
const pool = [affix('p/light', 'prefix'), affix('p/heavy', 'prefix', 3), affix('p/third', 'prefix'),
  affix('s/a', 'suffix'), affix('s/b', 'suffix'), affix('s/c', 'suffix')];
function required<T>(value: T | undefined): T { if (value === undefined) throw new Error('Missing rare fixture'); return value; }
function legal(rolls: readonly RolledAffix[], source: ItemBase, level: number, definitions: readonly Affix[]) {
  expect(rolls.length).toBeGreaterThanOrEqual(4); expect(rolls.length).toBeLessThanOrEqual(6);
  expect(new Set(rolls.map(roll => roll.id)).size).toBe(rolls.length);
  for (const kind of ['prefix', 'suffix']) {
    const count = rolls.filter(roll => required(definitions.find(row => row.id === roll.id)).kind === kind).length;
    expect(count).toBeGreaterThanOrEqual(1); expect(count).toBeLessThanOrEqual(3);
  }
  for (const roll of rolls) {
    const definition = required(definitions.find(row => row.id === roll.id)), tier = required(definition.tiers[roll.tier]);
    expect(definition.appliesTo.length === 0 || definition.appliesTo.includes(source.type)).toBe(true);
    expect(definition.rarityWeights.rare).toBeGreaterThan(0);
    expect(tier.ilvlMin).toBeLessThanOrEqual(level); expect(tier.ilvlMax).toBeGreaterThanOrEqual(level);
    expect(Number.isInteger(roll.rolledValue)).toBe(true);
    expect(roll.rolledValue).toBeGreaterThanOrEqual(tier.valueMin); expect(roll.rolledValue).toBeLessThanOrEqual(tier.valueMax);
  }
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
afterEach(() => { vi.restoreAllMocks(); __resetRollItemSeqForTests(); });
describe('prepared D11 rare affix-only generator', () => {
  it('preflights without creating RNG or consuming the caller stream, including refusals', () => {
    const rng = random.createRng(901), control = random.createRng(901);
    const seeded = vi.spyOn(random, 'createRng').mockImplementation(() => { throw new Error('Preflight seeded RNG'); });
    const globalRandom = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('Preflight global RNG'); });
    expect(prepareRareAffixes(base, 25, pool, rules)).toBeTypeOf('function');
    expect(() => prepareRareAffixes(base, 25, [], rules)).toThrow();
    expect(seeded).not.toHaveBeenCalled(); expect(globalRandom).not.toHaveBeenCalled(); expect(rng.next()).toBe(control.next());
  });
  it.each([4, 5, 6])('can select exactly%i affixes with legal category bounds', total => {
    const selections = [total - 4, total === 4 ? 1 : 3];
    const rng = { ...random.createRng(1), next: () => .5,
      nextInt: (min: number) => selections.shift() ?? min };
    const output = prepareRareAffixes(base, 25, pool, rules)(rng);
    expect(output).toHaveLength(total); legal(output, base, 25, pool);
  });
  it('uses rare weights without replacement and rolls the selected legal tier', () => {
    const selections = [0, 2], next = vi.fn(() => .3);
    const rng = { ...random.createRng(1), next, nextInt: (min: number) => selections.shift() ?? min };
    expect(prepareRareAffixes(base, 25, pool, rules)(rng)).toEqual([
      { id: 'p/heavy', tier: 1, rolledValue: 11 }, { id: 'p/light', tier: 1, rolledValue: 11 },
      { id: 's/a', tier: 1, rolledValue: 11 }, { id: 's/b', tier: 1, rolledValue: 11 }
    ]); expect(next).toHaveBeenCalledTimes(4);
  });
  it('is repeatable, reusable and leaves deeply frozen inputs unchanged', () => {
    const input = freeze(structuredClone({ base, pool, rules })), before = structuredClone(input);
    const plan = prepareRareAffixes(input.base, 25, input.pool, input.rules), rng = random.createRng(42), control = random.createRng(42);
    for (let index = 0; index < 3; index++) expect(plan(rng)).toEqual(plan(control));
    expect(plan(random.createRng(901))).toEqual(prepareRareAffixes(input.base, 25, input.pool, input.rules)(random.createRng(901)));
    expect(input).toEqual(before);
  });
  it.each([0, -1, .5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])('refuses invalid source level%s', level => {
    expect(() => prepareRareAffixes(base, level, pool, rules)).toThrow();
  });
  it('accepts a positive safe level when tiers actually cover it, independently of equip requirements', () => {
    const extended = pool.map(row => ({ ...row, tiers: [{ ilvlMin: 1, ilvlMax: Number.MAX_SAFE_INTEGER, valueMin: 1, valueMax: 1 }] }));
    expect(prepareRareAffixes(base, 1, extended, rules)).toBeTypeOf('function');
    expect(prepareRareAffixes(base, Number.MAX_SAFE_INTEGER, extended, rules)).toBeTypeOf('function');
    expect(() => prepareRareAffixes({ ...base, canHaveAffixes: false }, 25, pool, rules)).toThrow();
  });
  it('refuses missing groups, insufficient distinct IDs and fake duplicate feasibility', () => {
    const p = required(pool[0]), p2 = required(pool[1]), s = required(pool[3]);
    for (const rows of [[], pool.slice(0, 3), pool.slice(3), [p, p2, s], [p, p2, s, { ...s }]]) {
      expect(() => prepareRareAffixes(base, 25, rows, rules)).toThrow();
    }
    for (const rows of [[...pool.slice(0, 3), s], [p, ...pool.slice(3)]]) {
      const output = prepareRareAffixes(base, 25, rows, rules)(random.createRng(9));
      expect(output).toHaveLength(4); legal(output, base, 25, rows);
    }
  });
  it('never emits duplicate IDs even if a sufficient input pool contains duplicates', () => {
    const duplicate = [...pool, { ...required(pool[0]) }];
    let plan: ReturnType<typeof prepareRareAffixes>;
    try { plan = prepareRareAffixes(base, 25, duplicate, rules); } catch (error) { expect(error).toBeInstanceOf(Error); return; }
    for (const seed of [0, 1, 2, 9, 42, 901]) legal(plan(random.createRng(seed)), base, 25, pool);
  });
  it('excludes wrong type, absent/nonpositive rare weight and both out-of-level tier bands', () => {
    const fourth = required(pool[4]), first = [required(pool[0]), required(pool[1]), required(pool[3])];
    const invalid: Affix[] = [{ ...fourth, appliesTo: ['armor'] }, ...[{}, { rare: 0 }, { rare: -1 }, { magic: 99 }].map(rarityWeights => ({ ...fourth, rarityWeights })),
      { ...fourth, tiers: [{ ilvlMin: 1, ilvlMax: 24, valueMin: 1, valueMax: 1 }] },
      { ...fourth, tiers: [{ ilvlMin: 26, ilvlMax: 99, valueMin: 1, valueMax: 1 }] }];
    for (const excluded of invalid) expect(() => prepareRareAffixes(base, 25, [...first, excluded], rules)).toThrow();
    legal(prepareRareAffixes(base, 25, [...first, { ...fourth, appliesTo: [] }], rules)(random.createRng(1)), base, 25, [...first, fourth]);
  });
  it('refuses broadened or inconsistent count contracts rather than silently defaulting', () => {
    const bad: RarityAffixCount[] = [
      { ...rules, prefix: { min: 0, max: 3 } }, { ...rules, prefix: { min: 1, max: 4 } },
      { ...rules, suffix: { min: 0, max: 3 } }, { ...rules, suffix: { min: 1, max: 4 } },
      { ...rules, total: { min: 3, max: 6 } }, { ...rules, total: { min: 4, max: 7 } },
      { ...rules, total: { min: 6, max: 4 } }, { ...rules, prefix: { min: NaN, max: 3 } }
    ];
    for (const contract of bad) expect(() => prepareRareAffixes(base, 25, pool, contract)).toThrow();
  });
  it.each([1, 10, 11, 25, 26, 99, 102])('uses the full authored catalog legally at source level%i', level => {
    const definitions = loadAffixPool(), contract = required(loadRarityAffixRules().rare);
    for (const id of ['items/base/wp1h-short-sword', 'items/base/helm-cap']) {
      const source = required(loadItemBases().get(id)), plan = prepareRareAffixes(source, level, definitions, contract);
      for (const seed of [1, 7, 901]) legal(plan(random.createRng(seed)), source, level, definitions);
    }
  });
  it('preserves the independent two-affix caster helper and ordinary sparse-drop RNG budget', () => {
    const pair = prepareRareAffixPair(base, 25, pool)({ ...random.createRng(1), next: () => .5, nextInt: min => min });
    expect(pair).toEqual([{ id: 'p/heavy', tier: 1, rolledValue: 11 }, { id: 's/b', tier: 1, rolledValue: 11 }]);
    const sparse = [required(pool[0]), required(pool[3])], rng = random.createRng(123), control = random.createRng(123);
    const item = required(rollItem({ baseId: base.id, rarity: 'rare', ilvl: 25 }, { bases: new Map([[base.id, base]]), affixes: sparse }, rng));
    expect(item.affixes).toHaveLength(2); expect(item).toMatchObject({ baseId: base.id, rarity: 'rare', ilvl: 25, level: 25, socketCapacity: 0 });
    for (let index = 0; index < 7; index++) control.next(); // Two counts, two selections, two values, existing ID.
    expect(rng.next()).toBe(control.next());
  });
});
