import { afterEach, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import { createSkillValidator } from './skill-validator';
import { MERC_WAR_CRY_SKILL, resolveMercWarCrySkill } from './merc-war-cry';
import { getSkill, loadDefaultSkills, registerSkill } from './registry';
import { MERC_STUB_SKILLS } from './aliases';

const authored = rows.find(row => row.id === 'mskill-war-cry');
if (!authored) throw new Error('Missing authored War Cry');
const validate = createSkillValidator();
afterEach(() => { loadDefaultSkills(); });

it('copies and deeply freezes a single non-damaging debuff without authored references', () => {
  const source = { ...structuredClone(authored), statusEffect: { durationMs: 6000 } };
  const before = structuredClone(source), skill = resolveMercWarCrySkill([null, 'unrelated', source]);
  expect(skill).toEqual({ id: 'mskill-war-cry', archetype: 'mercenary', trigger: 'active',
    target: 'all-enemies', cooldown: 12, manaCost: 0, minLevel: 1,
    effects: [{ kind: 'debuff', statusId: 'stun', durationMs: 6000 }] });
  expect(source).toEqual(before);
  for (const value of [skill, skill.effects, skill.effects[0]]) expect(Object.isFrozen(value)).toBe(true);
  source.statusEffect.durationMs = 1;
  if (!source.cost) throw new Error('Missing authored War Cry cost');
  source.cost.mana = 99;
  expect(skill).toEqual(MERC_WAR_CRY_SKILL);
});

it('requires exactly one exact authored identity', () => {
  for (const source of [[], [null], [{ ...authored, id: 'other' }], [authored, authored]]) {
    expect(() => resolveMercWarCrySkill(source)).toThrow(/exactly one/);
  }
});

it.each([
  { cost: undefined }, { cost: {} }, { cost: { mana: 1 } }, { cost: { mana: 0, life: 1 } },
  { cooldown: 3 }, { minLevel: 2 }, { maxLevel: 21 }, { trigger: 'passive' }, { target: 'single-enemy' },
  { appliesStatus: undefined }, { appliesStatus: [] }, { appliesStatus: ['freeze'] },
  { appliesStatus: ['stun', 'stun'] }, { statusEffect: undefined }, { statusEffect: {} },
  { statusEffect: { durationMs: 0 } }, { statusEffect: { durationMs: 6001 } },
  { statusEffect: { durationMs: NaN } }, { statusEffect: { durationMs: Infinity } },
  { statusEffect: { durationMs: 6000, chance: 1 } },
  { statusEffect: { durationMs: 6000, bossDurationMultiplier: .5 } },
  { statusEffect: { durationMs: 6000, dotPctOfDamage: .1 } },
  { damage: { min: 18, max: 30, breakdown: { physical: 30 } } }, { damageType: 'physical' },
  { appliesTags: ['physical'] }, { scaling: { damagePerLevel: 1 } }, { attackDamagePct: 100 },
  { hitSequence: { strikes: 1 } }, { critChanceBonus: .25 }, { alwaysHits: true },
  { ignoresDefense: true }, { maxTargets: 2 }, { onHitRecovery: {} },
  { additionalStatusEffects: {} }, { passive: false }, { requires: {} }, { typo: true }
])('rejects foreign, ignored or contradictory control metadata %j', patch => {
  expect(() => resolveMercWarCrySkill([{ ...authored, ...patch }])).toThrow();
});

it('keeps the complete authored mercenary catalog valid', () => {
  for (const row of rows) expect(validate(row), row.id).toBe(true);
});

it('restores only native War Cry without changing unrelated player, mercenary or monster skills', () => {
  loadDefaultSkills();
  const ids = ['barbarian.bash', 'mskill-bash', 'mskill-fire-ball', 'monster.war_cry'];
  const before = ids.map(id => getSkill(id));
  for (const skill of before) expect(skill).toBeDefined();
  expect(MERC_STUB_SKILLS.some(skill => skill.id === 'mskill-war-cry')).toBe(false);
  for (let i = 0; i < 3; i++) {
    registerSkill({ ...MERC_WAR_CRY_SKILL, effects: [] });
    loadDefaultSkills();
    expect(getSkill('mskill-war-cry')).toBe(MERC_WAR_CRY_SKILL);
    expect(ids.map(id => getSkill(id))).toEqual(before);
  }
});
