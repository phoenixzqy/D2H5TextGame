import { getSkill, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { DEFAULT_SKILLS } from '../skills/builders';
import { aliasToCanonical } from '../skills/aliases';
import { AUTHORED_PROJECTILE_SKILLS } from '../skills/dataCatalog';
import { MONSTER_DIRECT_SKILLS } from '../skills/monster-direct';
import { MONSTER_DOT_SKILLS } from '../skills/monster-dot';
import { MONSTER_HEAL_LIGHTNING_SKILLS } from '../skills/monster-heal-lightning';
import { MONSTER_LEVEL_SPELLS } from '../skills/monster-level-spells';
import { BLOOD_RAVEN_SKILLS } from '../skills/blood-raven';
import type { SkillEffect } from '../skills/effects';
import { expect, it } from 'vitest';
import rows from '../../data/skills/monsters.json';
import amazon from '../../data/skills/amazon.json';
import { createSkillValidator } from '../skills/skill-validator';
const ids = ['monster-blood-raven-fire-arrow', 'monster-poison-spit', 'monster-lightning-bolt',
 'monster-ice-shard', 'monster-arcane-bolt', 'monster-frozen-orb', 'monster-weak-ranged',
 'monster-fire-bolt', 'monster-frost-bolt', 'monster-fire-arrow', 'monster-fire-ball',
 'monster-bone-spirit', 'monster-plague-spit'];
const validate = createSkillValidator();
function row(id = 'monster-weak-ranged') {
 const r = rows.find(row => row.id === id); if (!r) throw new Error('Missing missile source'); return structuredClone(r);
}
it.each(ids)('authors actual normal flight for %s', id => {
 const r = row(id); expect(r).toHaveProperty('projectileFlightMs', 500); expect(validate(r)).toBe(true);
});
it('keeps immediate monster skills and all current Amazon attacks immediate', () => {
 for (const r of [...rows.filter(r => !ids.includes(r.id)), ...amazon]) expect(r).not.toHaveProperty('projectileFlightMs');
});
it.each([0, -1, 5001, NaN, Infinity, '500', null])('rejects invalid authored flight %j', projectileFlightMs => {
 expect(validate({ ...row(), projectileFlightMs })).toBe(false);
});
it('accepts finite fractional flight, requires exact missile identities and rejects missing capability', () => {
 expect(validate({ ...row(), projectileFlightMs: .5 })).toBe(true);
 expect(validate({ ...row(), projectileFlightMs: 5000 })).toBe(true);
 expect(validate({ ...row(), id: 'monster-weak-melee', projectileFlightMs: 500 })).toBe(false);
 const missing: Record<string, unknown> = { ...row() }; delete missing.projectileFlightMs;
 expect(validate(missing)).toBe(false);
});

it('connects all13 authored missile identities to actual registered effects without retuning existing damage or cooldown', () => {
 resetRegistry(); loadDefaultSkills();
 expect(ids.filter(id => getSkill(id) === undefined)).toEqual([]);
 for (const id of ids) {
  const skill = getSkill(id); expect(skill).toBeDefined();
  expect(skill?.effects.some(effect => effect.kind === 'damage' && effect.projectileFlightMs === 500)).toBe(true);
 }
 const finalSources = new Map([
  ...AUTHORED_PROJECTILE_SKILLS, ...DEFAULT_SKILLS, ...MONSTER_DOT_SKILLS,
  ...MONSTER_HEAL_LIGHTNING_SKILLS, ...MONSTER_LEVEL_SPELLS, ...MONSTER_DIRECT_SKILLS, ...BLOOD_RAVEN_SKILLS
 ].map(skill => [aliasToCanonical(skill.id) ?? skill.id, skill]));
 for (const source of [...finalSources.values()].filter(skill => ids.some(id => aliasToCanonical(id) === (aliasToCanonical(skill.id) ?? skill.id)))) {
  const active = getSkill(source.id); expect(active?.cooldown).toBe(source.cooldown); expect(active?.manaCost).toBe(source.manaCost);
  const withoutFlight = (effect: SkillEffect) => {
   if (effect.kind !== 'damage') return effect;
   const { projectileFlightMs: _flight, ...original } = effect; return original;
  };
  for (const effect of active?.effects ?? []) if (effect.kind === 'damage') expect(effect.projectileFlightMs).toBe(500);
  expect(active?.effects.map(withoutFlight)).toEqual(source.effects.map(withoutFlight));
 }
 resetRegistry(); loadDefaultSkills();
});
