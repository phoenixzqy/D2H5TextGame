import { afterEach, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import { createSkillValidator } from './skill-validator';
import { MERC_TELEKINESIS_SKILL, resolveMercTelekinesisSkill } from './merc-telekinesis';
import { getSkill, loadDefaultSkills, registerSkill } from './registry';
import { MERC_STUB_SKILLS } from './aliases';

const authored = rows.find(row => row.id === 'mskill-telekinesis');
if (!authored) throw new Error('Missing authored Telekinesis');
const validate = createSkillValidator();
afterEach(() => { loadDefaultSkills(); });

it('copies and deeply freezes native damage, tags and status without authored references', () => {
  const source = structuredClone(authored), before = structuredClone(source);
  const skill = resolveMercTelekinesisSkill([null, 'unrelated', source]);
  expect(skill).toEqual({ id: 'mskill-telekinesis', archetype: 'mercenary', trigger: 'active',
    target: 'single-enemy', cooldown: 2, manaCost: 0, minLevel: 1,
    effects: [{ kind: 'damage', damageType: 'arcane', base: [20, 32], tags: ['arcane'],
      applyStatus: { id: 'stun', chance: .5, durationMs: 1000 } }] });
  expect(source).toEqual(before);
  const effect = skill.effects[0];
  if (effect?.kind !== 'damage') throw new Error('Missing native damage');
  for (const value of [skill, skill.effects, effect, effect.base, effect.tags, effect.applyStatus]) {
    expect(Object.isFrozen(value)).toBe(true);
  }
  if (!source.damage || !source.statusEffect) {
    throw new Error('Missing authored metadata');
  }
  source.damage.max = 999;
  source.statusEffect.durationMs = 1;
  source.appliesTags.push('changed');
  source.cost.mana = 99;
  expect(skill).toEqual(MERC_TELEKINESIS_SKILL);
});

it('requires exactly one exact authored identity', () => {
  for (const source of [[], [null], [{ ...authored, id: 'other' }], [authored, authored]]) {
    expect(() => resolveMercTelekinesisSkill(source)).toThrow(/exactly one/);
  }
});

it.each([
  { cost: undefined }, { cost: {} }, { cost: { mana: 1 } }, { cost: { mana: 0, life: 1 } },
  { cooldown: 3 }, { minLevel: 2 }, { maxLevel: 21 }, { trigger: 'passive' }, { target: 'all-enemies' },
  { damage: undefined }, { damage: { min: 20, max: 30, breakdown: { arcane: 30 } } },
  { damage: { min: NaN, max: 32, breakdown: { arcane: 32 } } },
  { damage: { min: 20, max: Infinity, breakdown: { arcane: 32 } } },
  { damage: { min: 20, max: 32, breakdown: { physical: 32 } } },
  { damage: { min: 20, max: 32, breakdown: { arcane: 32 }, growth: 1 } },
  { damageType: 'physical' }, { appliesTags: [] }, { appliesTags: ['arcane', 'stun'] },
  { appliesStatus: undefined }, { appliesStatus: [] }, { appliesStatus: ['freeze'] },
  { appliesStatus: ['stun', 'stun'] }, { statusEffect: undefined }, { statusEffect: {} },
  { statusEffect: { durationMs: 1000 } }, { statusEffect: { chance: 1, durationMs: 1000 } },
  { statusEffect: { chance: .5, durationMs: 0 } }, { statusEffect: { chance: .5, durationMs: 1001 } },
  { statusEffect: { chance: .5, durationMs: 1000, bossDurationMultiplier: .5 } },
  { statusEffect: { chance: .5, durationMs: 1000, dotPctOfDamage: .1 } },
  { scaling: { damagePerLevel: 1 } }, { attackDamagePct: 100 }, { hitSequence: { strikes: 1 } },
  { critChanceBonus: .25 }, { alwaysHits: true }, { ignoresDefense: true }, { ignoresMagicResist: true },
  { maxTargets: 2 }, { onHitRecovery: {} }, { additionalStatusEffects: {} },
  { damageComposition: { arcane: 1 } }, { passive: false }, { requires: {} }, { typo: true }
])('rejects foreign, ignored or contradictory damage/control metadata %j', patch => {
  expect(() => resolveMercTelekinesisSkill([{ ...authored, ...patch }])).toThrow();
});

it('keeps the complete authored mercenary catalog valid', () => {
  for (const row of rows) expect(validate(row), row.id).toBe(true);
});

it('restores only mercenary Telekinesis and preserves the player utility and native neighbors', () => {
  loadDefaultSkills();
  const ids = ['sorceress.telekinesis', 'mskill-war-cry', 'mskill-fire-ball', 'mskill-bash', 'monster.arcane_bolt'];
  const before = ids.map(id => getSkill(id));
  for (const skill of before) expect(skill).toBeDefined();
  expect(before[0]?.effects.every(effect => effect.kind !== 'damage')).toBe(true);
  expect(MERC_STUB_SKILLS.some(skill => skill.id === 'mskill-telekinesis')).toBe(false);
  for (let i = 0; i < 3; i++) {
    registerSkill({ ...MERC_TELEKINESIS_SKILL, effects: [] });
    loadDefaultSkills();
    expect(getSkill('mskill-telekinesis')).toBe(MERC_TELEKINESIS_SKILL);
    expect(ids.map(id => getSkill(id))).toEqual(before);
  }
});
