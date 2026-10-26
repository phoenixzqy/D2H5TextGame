import { expect, it } from 'vitest';
import authored from '../../data/skills/barbarian.json';
import { registeredSkillFromJson } from './dataCatalog';
import { createSkillValidator } from './skill-validator';
import { BATTLE_COMMAND_DEFINITION, battleCommandDuration, composeBattleCommandRank,
  matchesBattleCommand, resolveBattleCommandDefinition } from './battle-command';

const source = authored.find(row => row.id === 'skills-barbarian-battle-command');
const validate = createSkillValidator<Parameters<typeof registeredSkillFromJson>[0]>();
const player = { class: 'barbarian' as const, level: 30, skillLevels: {
  'skills-barbarian-howl': 1, 'skills-barbarian-shout': 1, 'skills-barbarian-battle-orders': 1,
  'skills-barbarian-battle-command': 1 } };

it('registers the exact party effect without generic stats, indefinite buffs or startup behavior', () => {
  const row: unknown = source;
  if (!validate(row)) throw new Error('Invalid authored Command');
  const skill = registeredSkillFromJson(row);
  expect(skill).toEqual({ id: 'barbarian.battle_command', archetype: 'barbarian', trigger: 'active',
    target: 'all-allies', minLevel: 30, manaCost: 11, manaCostPerRank: -.1, cooldown: 4,
    cooldownPerRank: -.05, effects: [{ kind: 'party-skill-ranks' }] });
  expect(matchesBattleCommand(skill)).toBe(true);
  for (const patch of [{ target: 'self' as const }, { manaCost: 0 }, { cooldown: 0 },
    { summonOnStart: true }, { isBuff: true }, { effects: [] },
    { effects: [...skill.effects, { kind: 'heal' as const, target: 'self' as const, amount: 1 }] }])
    expect(matchesBattleCommand({ ...skill, ...patch })).toBe(false);
  expect(BATTLE_COMMAND_DEFINITION.buff).toEqual({ bonusRanks: 1, durationMs: 8000, durationPerRankMs: 500 });
});

it.each([[1, 8000], [2, 8500], [20, 17500]])('rank%i lasts%sms and MAX aliases do not stack', (rank, duration) => {
  expect(battleCommandDuration(rank)).toBe(duration);
  expect(composeBattleCommandRank({ ...player, skillLevels: { ...player.skillLevels, 'barbarian.battle_command': rank } })).toBe(rank);
});
it.each([0, -1, 1.5, 21, NaN, Infinity])('refuses malformed allocated rank%s', rank => {
  expect(composeBattleCommandRank({ ...player, skillLevels: { ...player.skillLevels,
    'skills-barbarian-battle-command': rank } })).toBe(0);
  expect(() => battleCommandDuration(rank)).toThrow();
});
it('copies JSON tuning without freezing or sharing the caller and rejects duplicate rows', () => {
  const row = structuredClone(source), definition = resolveBattleCommandDefinition([row]);
  if (!row?.skillRankBuff) throw new Error('Missing Command tuning');
  row.skillRankBuff.durationMs = 9000;
  expect(definition.buff.durationMs).toBe(8000);
  expect(Object.isFrozen(definition.buff)).toBe(true);
  expect(Object.isFrozen(row.skillRankBuff)).toBe(false);
  expect(resolveBattleCommandDefinition([row]).buff.durationMs).toBe(9000);
  expect(() => resolveBattleCommandDefinition([source, source])).toThrow();
});
it.each([{ skillRankBuff: undefined }, { target: 'self' }, { cost: { mana: 0 } }, { prerequisites: [] },
  { damage: { min: 1, max: 1 } }, { timedBuff: { durationMs: 8000 } }, { summonId: 'fake' },
  { scaling: { cooldownPerLevel: -.05, costPerLevel: -.1, passiveStatsPerLevel: { attackPct: .015 } } },
  ...[{ bonusRanks: 2, durationMs: 8000, durationPerRankMs: 500 },
    { bonusRanks: 1, durationMs: 0, durationPerRankMs: 500 },
    { bonusRanks: 1, durationMs: Infinity, durationPerRankMs: 500 },
    { bonusRanks: 1, durationMs: 8000, durationPerRankMs: -1 },
    { bonusRanks: 1, durationMs: 8000, durationPerRankMs: 500, extra: 1 }].map(skillRankBuff => ({ skillRankBuff }))])(
  'schema refuses incompatible or malformed Command%j', patch => {
    expect(validate({ ...source, ...patch })).toBe(false);
  });
it('schema prevents another skill from claiming Command tuning', () => {
  expect(validate({ ...source, id: 'skills-barbarian-bash' })).toBe(false);
});
