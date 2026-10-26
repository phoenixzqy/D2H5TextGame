import { expect, it } from 'vitest';
import authored from '../../data/skills/barbarian.json';
import { createSkillValidator } from './skill-validator';
import { registeredSkillFromJson } from './dataCatalog';
import { composeFindPotion, copyFindPotionProjections, FIND_POTION_DEFINITION,
  matchesFindPotion, resolveFindPotionDefinition } from './find-potion';

const source = authored.find(row => row.id === 'skills-barbarian-find-potion');
const validate = createSkillValidator<Parameters<typeof registeredSkillFromJson>[0]>();
const player = { id: 'hero', class: 'barbarian' as const, level: 1,
  skillLevels: { 'skills-barbarian-find-potion': 1 } };

it('uses one dedicated recovery effect, original cost/cooldown scaling and no MF or buff marker', () => {
  const row: unknown = source;
  if (!validate(row)) throw new Error('Invalid Find Potion row');
  const skill = registeredSkillFromJson(row);
  expect(skill).toEqual({ id: 'barbarian.find_potion', archetype: 'barbarian', trigger: 'active', target: 'self',
    cooldown: 4, cooldownPerRank: -.05, manaCost: 2, minLevel: 1, effects: [{ kind: 'corpse-recovery' }] });
  expect(matchesFindPotion(skill)).toBe(true);
  expect(FIND_POTION_DEFINITION.recovery).toEqual({ lifePct: .1, lifePctPerRank: .005,
    manaPct: .05, manaPctPerRank: .0025 });
});

it.each([{ corpseRecovery: undefined }, { cost: { mana: 0 } }, { cost: { mana: 2, life: 1 } },
  { target: 'all-enemies' }, { trigger: 'passive' }, { requiredLevel: 0 }, { maxLevel: 21 },
  { appliesStatus: ['find-potion'] }, { damage: { min: 1, max: 2 } }, { summon: true },
  { scaling: { cooldownPerLevel: -.05, passiveStatsPerLevel: { magicFindPct: .01 } } },
  { prerequisites: ['skills-barbarian-howl'] }])('rejects contradictory source semantics %j', patch => {
  expect(validate({ ...source, ...patch })).toBe(false);
});

it.each([{ lifePct: 0 }, { manaPct: Infinity }, { lifePctPerRank: -.01 },
  { manaPctPerRank: .02 }, { extra: 1 }])('rejects malformed recovery tuning %j', patch => {
  expect(validate({ ...source, corpseRecovery: { ...source?.corpseRecovery, ...patch } })).toBe(false);
});

it('rejects missing/duplicate/unreviewed sources and copies frozen tuning', () => {
  expect(() => resolveFindPotionDefinition([])).toThrow();
  expect(() => resolveFindPotionDefinition([source, source])).toThrow();
  const row = structuredClone(source), before = structuredClone(row);
  const definition = resolveFindPotionDefinition([row]);
  expect(row).toEqual(before); expect(Object.isFrozen(definition.recovery)).toBe(true);
  if (!row?.corpseRecovery) throw new Error('Missing source recovery');
  row.corpseRecovery.lifePct = .9;
  expect(definition.recovery.lifePct).toBe(.1);
  expect(() => resolveFindPotionDefinition([row])).toThrow();
});

it.each([1, 2, 20])('projects valid allocated rank%i from the actual native class', rank => {
  expect(composeFindPotion({ ...player, skillLevels: { 'skills-barbarian-find-potion': rank } }))
    .toEqual({ sourceHeroId: 'hero', rank });
});

it.each([0, -1, 21, 1.5, NaN, Infinity])('ignores invalid allocation %s instead of clamping', rank => {
  expect(composeFindPotion({ ...player, skillLevels: { 'skills-barbarian-find-potion': rank } })).toBeUndefined();
});

it('takes maximum valid alias once, and rejects invalid class/ID/unlock without mutation', () => {
  const input = { ...player, skillLevels: { 'skills-barbarian-find-potion': 2, 'barbarian.find_potion': 20 } };
  const before = structuredClone(input);
  expect(composeFindPotion(input)?.rank).toBe(20); expect(input).toEqual(before);
  expect(composeFindPotion({ ...input, class: 'sorceress' })).toBeUndefined();
  expect(composeFindPotion({ ...input, id: '' })).toBeUndefined();
  expect(composeFindPotion({ ...input, level: 0 })).toBeUndefined();
  expect(composeFindPotion({ ...input, level: 1.5 })).toBeUndefined();
});

it.each([undefined, null, {}, new Array(1), [{ sourceHeroId: 'hero', rank: 0 }],
  [{ sourceHeroId: 'hero', rank: 1, extra: 1 }],
  [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: 'hero', rank: 2 }]])(
  'refuses malformed complete authority arrays %j', value => {
    expect(copyFindPotionProjections(value)).toEqual([]);
  });

it('copies and freezes valid authority independently of caller-owned input', () => {
  const input = [{ sourceHeroId: 'hero', rank: 2 }], result = copyFindPotionProjections(input);
  const entry = input[0]; if (!entry) throw new Error('Missing mutable authority');
  entry.rank = 20;
  expect(result).toEqual([{ sourceHeroId: 'hero', rank: 2 }]);
  expect(Object.isFrozen(result)).toBe(true); expect(Object.isFrozen(result[0])).toBe(true);
});
