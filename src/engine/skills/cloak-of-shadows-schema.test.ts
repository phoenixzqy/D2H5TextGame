import { expect, it } from 'vitest';
import skills from '../../data/skills/assassin.json';
import { createSkillValidator } from './skill-validator';
import { registeredSkillFromJson, PLAYABLE_CLASS_SKILL_DATA } from './dataCatalog';

const row = skills.find(s => s.id === 'skills-assassin-cloak-of-shadows');
if (!row) throw new Error('Missing actual Cloak');
const proposed = { ...row, timedBuff: { durationMs: 8000 }, scaling: {
  ...row.scaling, passiveStatsPerLevel: { defensePct: .03, critChancePct: .005, magicDodgePct: .005 }
} };
const validate = createSkillValidator();
it('validates explicit finite personal Cloak with preserved critical/dodge scaling', () => {
  expect(validate(proposed), JSON.stringify(validate.errors)).toBe(true);
  expect(row).toMatchObject({ timedBuff: { durationMs: 8000 }, scaling: {
    passiveStatsPerLevel: { defensePct: .03, critChancePct: .005, magicDodgePct: .005 }
  } });
});
it.each([
  { timedBuff: undefined }, { timedBuff: { durationMs: 0 } }, { timedBuff: { durationMs: 1.5 } },
  { timedBuff: { durationMs: 8000, other: 1 } }, { target: 'self' }, { trigger: 'passive' },
  { requiredLevel: 1 }, { maxLevel: 21 }, { cost: { mana: 0 } }, { cooldown: 0 },
  { prerequisites: [] }, { appliesStatus: ['cloak-of-shadows'] }, { appliesStatus: ['blind', 'cloak-of-shadows'] },
  { damage: { min: 1, max: 1 } }, { statusEffect: { chance: .5 } },
  { scaling: { ...proposed.scaling, passiveStatsPerLevel: { defensePct: .03, magicDodgePct: .005 } } },
  { scaling: { ...proposed.scaling, passiveStatsPerLevel: { ...proposed.scaling.passiveStatsPerLevel, defensePct: -1 } } }
])('rejects contradictory or incomplete Cloak %j', patch => {
  expect(validate({ ...proposed, ...patch })).toBe(false);
});
it('emits a paid personal effect followed by hostile Blind with the same authored duration', () => {
  const typed = PLAYABLE_CLASS_SKILL_DATA.assassin.find(s => s.id === row.id);
  if (!typed) throw new Error('Missing actual typed Cloak');
  expect(registeredSkillFromJson({ ...typed, timedBuff: proposed.timedBuff })).toMatchObject({ id: 'assassin.cloak_of_shadows',
    isBuff: true, effects: [
      { kind: 'buff', id: 'cloak-of-shadows', duration: 8, timedStatBuff: 'cloak-of-shadows' },
      { kind: 'debuff', statusId: 'blind', durationMs: 8000 }
    ] });
});
