import { expect, it } from 'vitest';
import authored from '../../data/skills/barbarian.json';
import { registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { composeGrimWard, copyGrimWardProjections, GRIM_WARD_DEFINITION, grimWardDuration,
  matchesGrimWard, resolveGrimWardDefinition } from './grim-ward';

const source = authored.find(row => row.id === 'skills-barbarian-grim-ward');
const validate = createSkillValidator<Parameters<typeof registeredSkillFromJson>[0]>();
const player = { id: 'hero', class: 'barbarian' as const, level: 24, skillLevels: {
  'skills-barbarian-find-potion': 1, 'skills-barbarian-find-item': 1, 'skills-barbarian-grim-ward': 1 } };

it('registers only a dedicated corpse ward, with original scaled payment and no generic stats', () => {
  const row: unknown = source;
  if (!validate(row)) throw new Error('Invalid authored ward');
  const skill = registeredSkillFromJson(row);
  expect(skill).toEqual({ id: 'barbarian.grim_ward', archetype: 'barbarian', trigger: 'active',
    target: 'all-enemies', minLevel: 24, manaCost: 7, manaCostPerRank: -.1, cooldown: 4,
    cooldownPerRank: -.05, effects: [{ kind: 'corpse-ward' }] });
  expect(matchesGrimWard(skill)).toBe(true);
  expect(matchesGrimWard({ ...skill, effects: [...skill.effects, { kind: 'heal', target: 'self', amount: 1 }] })).toBe(false);
  expect(GRIM_WARD_DEFINITION.ward).toEqual({ durationMs: 6000, durationPerRankMs: 500,
    intervalMs: 2000, fearDurationMs: 1000, bossDurationMultiplier: .5 });
});

it.each([[1, 6000], [2, 6500], [20, 15500]])('rank%i has a finite%sms ward', (rank, duration) => {
  expect(grimWardDuration(rank)).toBe(duration);
  expect(composeGrimWard({ ...player, skillLevels: { ...player.skillLevels, 'barbarian.grim_ward': rank } })?.rank).toBe(rank);
});

it.each([0, -1, 1.5, 21, NaN, Infinity])('refuses invalid allocated rank%s', rank => {
  expect(composeGrimWard({ ...player, skillLevels: { ...player.skillLevels, 'skills-barbarian-grim-ward': rank } })).toBeUndefined();
  expect(() => grimWardDuration(rank)).toThrow();
});

it('requires native identity, unlock and the complete prerequisite chain; malformed aliases do not shadow valid ones', () => {
  expect(composeGrimWard({ ...player, class: 'sorceress' })).toBeUndefined();
  expect(composeGrimWard({ ...player, id: '' })).toBeUndefined();
  expect(composeGrimWard({ ...player, level: 23 })).toBeUndefined();
  for (const missing of ['skills-barbarian-find-potion', 'skills-barbarian-find-item']) {
    const levels = Object.fromEntries(Object.entries(player.skillLevels).filter(([id]) => id !== missing));
    expect(composeGrimWard({ ...player, skillLevels: levels })).toBeUndefined();
  }
  expect(composeGrimWard({ ...player, skillLevels: { ...player.skillLevels, 'barbarian.grim_ward': 21 } })?.rank).toBe(1);
});

it.each([undefined, null, {}, new Array(1), [{ sourceHeroId: 'hero', rank: 0 }],
  [{ sourceHeroId: 'hero', rank: 1, extra: 1 }],
  [{ sourceHeroId: 'hero', rank: 1 }, { sourceHeroId: 'hero', rank: 2 }]])('rejects complete malformed authority%j', value => {
  expect(copyGrimWardProjections(value)).toEqual([]);
});

it('copies/freezes authority and authored tuning independently', () => {
  const input = [{ sourceHeroId: 'hero', rank: 2 }], copied = copyGrimWardProjections(input);
  const first = input[0]; if (!first) throw new Error('Missing source'); first.rank = 20;
  expect(copied).toEqual([{ sourceHeroId: 'hero', rank: 2 }]);
  expect(Object.isFrozen(copied)).toBe(true); expect(Object.isFrozen(copied[0])).toBe(true);
  const row = structuredClone(source), definition = resolveGrimWardDefinition([row]);
  if (!row?.corpseWard) throw new Error('Missing ward tuning'); row.corpseWard.durationMs = 1;
  expect(definition.ward.durationMs).toBe(6000);
  expect(Object.isFrozen(definition.ward)).toBe(true);
  expect(() => resolveGrimWardDefinition([row])).toThrow();
  expect(() => resolveGrimWardDefinition([source, source])).toThrow();
});

it.each([{ corpseWard: undefined }, { appliesStatus: ['grim-ward'] }, { cost: { mana: 0 } },
  { target: 'self' }, { prerequisites: [] }, { corpseWard: { durationMs: Infinity } },
  { scaling: { cooldownPerLevel: -.05, costPerLevel: -.1, passiveStatsPerLevel: { magicFindPct: .1 } } }])(
  'schema rejects incompatible ward semantics%j', patch => { expect(validate({ ...source, ...patch })).toBe(false); });
