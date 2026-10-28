import { afterEach, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import { createSkillValidator } from './skill-validator';
import { MERC_JAB_SKILL, resolveMercJabSkill } from './merc-jab';
import { getSkill, loadDefaultSkills, registerSkill } from './registry';
import { MERC_STUB_SKILLS } from './aliases';
import en from '../../i18n/locales/en/skills.json';
import zh from '../../i18n/locales/zh-CN/skills.json';

const authored = rows.find(row => row.id === 'mskill-jab');
if (!authored) throw new Error('Missing authored mercenary Jab');
const validate = createSkillValidator();
afterEach(() => { loadDefaultSkills(); });

it('resolves authored Jab into a copied, deeply frozen active skill', () => {
  const source = structuredClone(authored), before = structuredClone(source);
  const skill = resolveMercJabSkill([null, { id: 'unrelated' }, source]);
  expect(skill).toEqual({ id: 'mskill-jab', archetype: 'mercenary', trigger: 'active',
    target: 'single-enemy', cooldown: 1, manaCost: 0, minLevel: 1,
    effects: [{ kind: 'damage', damageType: 'physical', base: [18, 28], attackDamagePct: 100,
      increasedDamagePct: .5, hitSequence: { strikes: 3 }, tags: ['physical'] }] });
  expect(source).toEqual(before);
  expect(skill).toEqual(MERC_JAB_SKILL);
  const effect = skill.effects[0];
  if (effect?.kind !== 'damage') throw new Error('Missing Jab damage');
  for (const value of [skill, skill.effects, effect, effect.base, effect.hitSequence, effect.tags]) {
    expect(Object.isFrozen(value)).toBe(true);
  }
  if (!source.damage) throw new Error('Missing authored damage');
  source.damage.min = 999;
  source.appliesTags[0] = 'fire';
  expect(skill).toEqual(MERC_JAB_SKILL);
});

it('normalizes JSON damage increase exactly once, including zero and fractions', () => {
  for (const physicalDamagePct of [0, 12.5, 50]) {
    expect(resolveMercJabSkill([{ ...authored, mercJab: { physicalDamagePct } }]).effects)
      .toEqual([expect.objectContaining({ increasedDamagePct: physicalDamagePct / 100 })]);
  }
});

it('requires exactly one exact Jab row', () => {
  for (const source of [[], [null], [{ ...authored, id: 'other' }], [authored, authored]]) {
    expect(() => resolveMercJabSkill(source)).toThrow(/exactly one/);
  }
});

it.each([
  { mercJab: undefined }, { mercJab: {} }, { mercJab: { physicalDamagePct: 50, typo: 1 } },
  ...[-1, NaN, Infinity, -Infinity, '50', null].map(physicalDamagePct => ({ mercJab: { physicalDamagePct } })),
  { attackDamagePct: undefined }, { attackDamagePct: -1 }, { cost: {} }, { cost: { mana: 1 } },
  { hitSequence: undefined }, { hitSequence: { strikes: 1 } }, { hitSequence: { strikes: 4 } },
  { hitSequence: { strikes: 3, targetMode: 'each-original' } }, { hitSequence: { strikes: 3, typo: 1 } },
  { damage: { min: 40, max: 1 } }, { damage: { min: 1.5, max: 2 } },
  { trigger: 'passive' }, { target: 'all-enemies' }, { damageType: 'fire' }, { cooldown: 0 },
  { scaling: { damagePerLevel: 1 } }, { appliesStatus: ['stun'] }, { alwaysHits: true },
  { ignoresDefense: true }, { maxLevel: 21 }, { minLevel: 2 }, { typo: true }
])('rejects malformed or contradictory Jab metadata %j', patch => {
  expect(() => resolveMercJabSkill([{ ...authored, ...patch }])).toThrow();
});

it('keeps new tuning exclusive to Jab and validates the whole authored mercenary catalog', () => {
  for (const row of rows) {
    expect(validate(row), row.id).toBe(true);
    if (row.id !== 'mskill-jab') expect(validate({ ...row, mercJab: { physicalDamagePct: 50 } }), row.id).toBe(false);
  }
});

it('restores native Jab on repeated loads and removes only its old stub', () => {
  expect(MERC_STUB_SKILLS.some(skill => skill.id === 'mskill-jab')).toBe(false);
  for (let i = 0; i < 3; i++) {
    registerSkill({ ...MERC_JAB_SKILL, effects: [] });
    loadDefaultSkills();
    expect(getSkill('mskill-jab')).toBe(MERC_JAB_SKILL);
  }
  expect(getSkill('amazon.jab')).toMatchObject({ manaCost: 5, effects: [expect.objectContaining({
    base: [30, 45], perRank: [3, 3], hitSequence: { strikes: 3 } })] });
});

it('describes the three attempts, Attack contribution and increase in both locales', () => {
  for (const part of ['three times', '100% Attack', '+50%']) expect(en.mercenary.jab.desc).toContain(part);
  for (const part of ['三次', '100%攻击力', '+50%']) expect(zh.mercenary.jab.desc).toContain(part);
});
