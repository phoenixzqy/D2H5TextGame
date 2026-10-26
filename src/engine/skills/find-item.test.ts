import { expect, it, vi } from 'vitest';
import authored from '../../data/skills/barbarian.json';
import { createSkillValidator } from './skill-validator';
import { registeredSkillFromJson } from './dataCatalog';
import { composeFindItem, copyFindItemFinds, copyFindItemProjections, FIND_ITEM_DEFINITION,
  findItemChance, findItemBonusEnemies, matchesFindItem, resolveFindItemDefinition, rollFindItemSearch } from './find-item';
import type { CombatUnit } from '../combat/types';
import type { CombatSnapshot } from '../combat/combat';

const source = authored.find(row => row.id === 'skills-barbarian-find-item');
const validate = createSkillValidator<Parameters<typeof registeredSkillFromJson>[0]>();
const player = { id: 'hero', class: 'barbarian' as const, level: 12,
  skillLevels: { 'skills-barbarian-find-potion': 1, 'skills-barbarian-find-item': 1 } };

function rewardFixture() {
  const hero: CombatUnit = { id: 'hero', name: 'hero', kind: 'hero', side: 'player', level: 12, tier: 'trash',
    life: 100, mana: 50, statuses: [], cooldowns: {}, activeBuffIds: [], skillOrder: [], enraged: false, summonedAdds: false,
    stats: { life: 100, lifeMax: 100, mana: 50, manaMax: 50, attack: 10, defense: 0, magicResist: 0,
      attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const body: CombatUnit = { ...hero, id: 'body', kind: 'monster', side: 'enemy', level: 7, tier: 'elite' };
  const input: CombatSnapshot = { seed: 19, playerTeam: [hero], enemyTeam: [body],
    findItem: [{ sourceHeroId: 'hero', rank: 1 }] };
  return { input, body, dead: { ...body, life: 0 }, find: { sourceHeroId: 'hero', corpseId: 'body', rank: 1 } };
}

it('registers a dedicated search with original payment scaling and no MF or buff', () => {
  const row: unknown = source;
  if (!validate(row)) throw new Error('Invalid Find Item row');
  const skill = registeredSkillFromJson(row);
  expect(skill).toEqual({ id: 'barbarian.find_item', archetype: 'barbarian', trigger: 'active', target: 'self',
    manaCost: 7, manaCostPerRank: -.1, cooldown: 4, cooldownPerRank: -.05, minLevel: 12,
    effects: [{ kind: 'corpse-search' }] });
  expect(matchesFindItem(skill)).toBe(true);
  expect(FIND_ITEM_DEFINITION.search).toEqual({ successChance: .2, successChancePerRank: .01 });
});

it.each([{ corpseSearch: undefined }, { cost: { mana: 0 } }, { cost: { mana: 7, life: 1 } },
  { target: 'all-enemies' }, { trigger: 'passive' }, { requiredLevel: 1 }, { maxLevel: 21 },
  { prerequisites: [] }, { appliesStatus: ['find-item'] }, { damage: { min: 1, max: 2 } },
  { scaling: { cooldownPerLevel: -.05, costPerLevel: -.1, passiveStatsPerLevel: { magicFindPct: .01 } } },
  { corpseRecovery: { lifePct: .1, lifePctPerRank: .005, manaPct: .05, manaPctPerRank: .0025 } }])(
  'rejects contradictory authored semantics %j', patch => {
    expect(validate({ ...source, ...patch })).toBe(false);
  });

it.each([{ successChance: 0 }, { successChance: Infinity }, { successChancePerRank: -.01 },
  { successChancePerRank: .05 }, { extra: 1 }])('rejects invalid search tuning %j', patch => {
  expect(validate({ ...source, corpseSearch: { ...source?.corpseSearch, ...patch } })).toBe(false);
});

it('rejects missing/duplicate/unreviewed definitions and owns frozen independent tuning', () => {
  expect(() => resolveFindItemDefinition([])).toThrow();
  expect(() => resolveFindItemDefinition([source, source])).toThrow();
  const row = structuredClone(source), before = structuredClone(row);
  const definition = resolveFindItemDefinition([row]);
  expect(row).toEqual(before); expect(Object.isFrozen(definition)).toBe(true);
  expect(Object.isFrozen(definition.search)).toBe(true);
  if (!row?.corpseSearch) throw new Error('Missing source chance');
  row.corpseSearch.successChance = .9;
  expect(definition.search.successChance).toBe(.2);
  expect(() => resolveFindItemDefinition([row])).toThrow();
});

it.each([[1, .2], [2, .21], [20, .39]])('rank%i has probability%s with a strict one-draw boundary', (rank, chance) => {
  expect(composeFindItem({ ...player, skillLevels: { ...player.skillLevels, 'skills-barbarian-find-item': rank } }))
    .toEqual({ sourceHeroId: 'hero', rank });
  expect(findItemChance(rank)).toBeCloseTo(chance);
  const next = vi.fn(() => findItemChance(rank));
  expect(rollFindItemSearch(rank, { next })).toBe(false); expect(next).toHaveBeenCalledTimes(1);
  next.mockReturnValue(findItemChance(rank) - Number.EPSILON);
  expect(rollFindItemSearch(rank, { next })).toBe(true); expect(next).toHaveBeenCalledTimes(2);
});

it.each([0, -1, 21, 1.5, NaN, Infinity])('invalid rank%s neither composes nor draws RNG', rank => {
  expect(composeFindItem({ ...player, skillLevels: { ...player.skillLevels, 'skills-barbarian-find-item': rank } }))
    .toBeUndefined();
  const next = vi.fn(() => 0);
  expect(() => rollFindItemSearch(rank, { next })).toThrow(); expect(next).not.toHaveBeenCalled();
});

it('requires actual class/unlock/prerequisite and takes MAX of valid aliases without mutation', () => {
  const input = { ...player, skillLevels: { ...player.skillLevels, 'barbarian.find_item': 20 } };
  const before = structuredClone(input);
  expect(composeFindItem(input)?.rank).toBe(20); expect(input).toEqual(before);
  expect(composeFindItem({ ...input, class: 'sorceress' })).toBeUndefined();
  expect(composeFindItem({ ...input, id: '' })).toBeUndefined();
  for (const level of [11, 12.5, NaN, Infinity]) expect(composeFindItem({ ...input, level })).toBeUndefined();
  expect(composeFindItem({ ...input, skillLevels: { 'skills-barbarian-find-item': 20 } })).toBeUndefined();
  expect(composeFindItem({ ...input, skillLevels: { 'barbarian.find_potion': 1, 'barbarian.find_item': 2 } })?.rank).toBe(2);
  expect(composeFindItem({ ...input, skillLevels: { ...input.skillLevels, 'barbarian.find_item': 21 } })?.rank).toBe(1);
});

it.each([undefined, null, {}, new Array(1), [{ sourceHeroId: 'hero', rank: 0 }],
  [{ sourceHeroId: 'hero', rank: 1, extra: 1 }],
  [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: 'hero', rank: 2 }]])('rejects malformed authority %j', value => {
  expect(copyFindItemProjections(value)).toEqual([]);
});

it('privately copies and freezes learned authority and successful finds', () => {
  const authority = [{ sourceHeroId: 'hero', rank: 2 }], finds = [{ sourceHeroId: 'hero', rank: 2, corpseId: 'body' }];
  const a = copyFindItemProjections(authority), f = copyFindItemFinds(finds);
  const firstA = authority[0], firstF = finds[0];
  if (!firstA || !firstF) throw new Error('Missing mutable fixtures');
  firstA.rank = 20; firstF.corpseId = 'forged';
  expect(a).toEqual([{ sourceHeroId: 'hero', rank: 2 }]);
  expect(f).toEqual([{ sourceHeroId: 'hero', rank: 2, corpseId: 'body' }]);
  for (const value of [a, a[0], f, f[0]]) expect(Object.isFrozen(value)).toBe(true);
});

it.each([undefined, null, {}, new Array(1), [{ sourceHeroId: 'hero', rank: 0, corpseId: 'body' }],
  [{ sourceHeroId: 'hero', rank: 1, corpseId: '' }], [{ sourceHeroId: '', rank: 1, corpseId: 'body' }],
  [{ sourceHeroId: 'hero', rank: 1, corpseId: 'body', extra: 1 }],
  [{ sourceHeroId: 'hero', rank: 1, corpseId: 'body' }, { sourceHeroId: 'other', rank: 1, corpseId: 'body' }]])(
  'fails whole malformed find list before settlement %j', value => {
    expect(() => copyFindItemFinds(value)).toThrow();
  });

it('bonus generation receives original level/tier rather than mutable final outcome metadata', () => {
  const { input, body, dead, find } = rewardFixture(), before = structuredClone(input);
  const result = findItemBonusEnemies([find], input, [{ ...dead, level: 99, tier: 'chapter-boss' }], 'hero');
  expect(result).toEqual([body]); expect(result[0]).toBe(body); expect(input).toEqual(before);
});

it.each(['foreign-source', 'rank', 'missing-corpse', 'duplicate-find', 'initial-dead', 'summoned', 'owned',
  'wrong-side', 'duplicate-original', 'still-alive', 'nonfinite-death', 'missing-final', 'duplicate-final',
  'missing-authority', 'dead-source', 'merc-source'] as const)('rejects %s reward evidence in full', invalid => {
  const fixture = rewardFixture(); let { input } = fixture; let dead = fixture.dead;
  let find = fixture.find;
  if (invalid === 'foreign-source') find = { ...find, sourceHeroId: 'other' };
  if (invalid === 'rank') find = { ...find, rank: 2 };
  if (invalid === 'missing-corpse') find = { ...find, corpseId: 'foreign' };
  if (invalid === 'initial-dead') input = { ...input, enemyTeam: [{ ...fixture.body, life: 0 }] };
  if (invalid === 'summoned') input = { ...input, enemyTeam: [{ ...fixture.body, summon: true }] };
  if (invalid === 'owned') input = { ...input, enemyTeam: [{ ...fixture.body, ownerId: 'other' }] };
  if (invalid === 'wrong-side') input = { ...input, enemyTeam: [{ ...fixture.body, side: 'player' }] };
  if (invalid === 'duplicate-original') input = { ...input, enemyTeam: [fixture.body, fixture.body] };
  if (invalid === 'still-alive') dead = { ...dead, life: 1 };
  if (invalid === 'nonfinite-death') dead = { ...dead, life: NaN };
  if (invalid === 'missing-authority') input = { ...input, findItem: [] };
  if (invalid === 'dead-source' || invalid === 'merc-source') input = { ...input,
    playerTeam: input.playerTeam.map(unit => ({ ...unit, ...(invalid === 'dead-source' ? { life: 0 } : { kind: 'merc' as const }) })) };
  const finds = invalid === 'duplicate-find' ? [find, find] : [find];
  const finals = invalid === 'missing-final' ? [] : invalid === 'duplicate-final' ? [dead, dead] : [dead];
  expect(() => findItemBonusEnemies(finds, input, finals, 'hero')).toThrow();
});
