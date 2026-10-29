import { afterEach, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import { createSkillValidator } from './skill-validator';
import { MERC_DIRECT_SKILLS, resolveMercDirectSkills } from './merc-direct';
import { getSkill, loadDefaultSkills, registerSkill } from './registry';
import { MERC_STUB_SKILLS } from './aliases';
import en from '../../i18n/locales/en/skills.json';
import zh from '../../i18n/locales/zh-CN/skills.json';

const ids = ['fire-ball', 'glacial-spike', 'charged-bolt', 'smite', 'chop', 'pierce-thrust', 'basic-swing']
  .map(suffix => `mskill-${suffix}`);
const authored = rows.filter(row => ids.includes(row.id));
const validate = createSkillValidator();
afterEach(() => { loadDefaultSkills(); });

it('copies and deeply freezes all seven authored effects without mutating their source', () => {
  const source = structuredClone(authored), before = structuredClone(source);
  const skills = resolveMercDirectSkills([null, { id: 'unrelated' }, ...source]);
  expect(skills.map(skill => skill.id)).toEqual(ids);
  expect(skills).toEqual(MERC_DIRECT_SKILLS);
  expect(Object.isFrozen(skills)).toBe(true);
  for (const skill of skills) {
    expect(skill).toMatchObject({ archetype: 'mercenary', trigger: 'active', manaCost: 0, minLevel: 1 });
    expect(skill.effects).toHaveLength(1);
    const effect = skill.effects[0];
    if (effect?.kind !== 'damage') throw new Error('Missing native merc damage');
    for (const value of [skill, skill.effects, effect, effect.base, effect.tags,
      effect.hitSequence, effect.applyStatus].filter(value => value !== undefined)) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(effect).not.toHaveProperty('perRank');
    expect(effect).not.toHaveProperty('attackDamagePct');
  }
  expect(source).toEqual(before);
  for (const row of source) {
    if (row.damage) row.damage.min = 999;
    if (row.appliesTags) row.appliesTags[0] = 'poison';
    if ('statusEffect' in row) row.statusEffect.durationMs = 999;
    if ('hitSequence' in row) row.hitSequence.strikes = 2;
  }
  expect(skills).toEqual(MERC_DIRECT_SKILLS);
});

it.each(ids)('requires exactly one exact %s row in the catalog', id => {
  const row = authored.find(candidate => candidate.id === id);
  if (!row) throw new Error('Missing authored row');
  for (const source of [[], authored.filter(candidate => candidate.id !== id), [...authored, row],
    authored.map(candidate => candidate.id === id ? { ...candidate, id: 'foreign' } : candidate)]) {
    expect(() => resolveMercDirectSkills(source)).toThrow(/exactly one/);
  }
});

it.each([
  { damage: undefined }, { damage: { min: 2, max: 1, breakdown: { physical: 1 } } },
  { damage: { min: 1.5, max: 2, breakdown: { physical: 2 } } },
  { cost: undefined }, { cost: {} }, { cost: { mana: 1 } }, { cost: { mana: 0, life: 1 } },
  { scaling: { damagePerLevel: 1 } }, { attackDamagePct: 100 }, { trigger: 'passive' },
  { minLevel: 2 }, { maxLevel: 21 }, { alwaysHits: true }, { ignoresDefense: true },
  { ignoresMagicResist: true }, { additionalStatusEffects: {} }, { onHitRecovery: {} },
  { mercJab: { physicalDamagePct: 50 } }, { heal: { min: 1, max: 2, target: 'self' } }, { typo: true }
])('rejects malformed or unconsumed metadata across the catalog %j', patch => {
  for (const row of authored) {
    expect(() => resolveMercDirectSkills(authored.map(candidate => candidate.id === row.id
      ? { ...candidate, ...patch } : candidate)), row.id).toThrow();
  }
});

it('permits caps, sequence and critical bonus only on their exact intended mercenary rows', () => {
  for (const row of rows) {
    expect(validate(row), row.id).toBe(true);
    expect(validate({ ...row, maxTargets: 2 }), row.id)
      .toBe(['mskill-fire-ball', 'mskill-pierce-thrust'].includes(row.id));
    expect(validate({ ...row, hitSequence: { strikes: 5 } }), row.id).toBe(row.id === 'mskill-charged-bolt');
    expect(validate({ ...row, critChanceBonus: .25 }), row.id).toBe(row.id === 'mskill-chop');
  }
});

it.each([
  { id: 'mskill-fire-ball', patch: { maxTargets: 3 } },
  { id: 'mskill-fire-ball', patch: { statusEffect: { dotPctOfDamage: .2, durationMs: 3000 } } },
  { id: 'mskill-glacial-spike', patch: { target: 'area-enemies' } },
  { id: 'mskill-glacial-spike', patch: { statusEffect: { chance: .5, durationMs: 2000 } } },
  { id: 'mskill-charged-bolt', patch: { hitSequence: { strikes: 4 } } },
  { id: 'mskill-charged-bolt', patch: { hitSequence: { strikes: 5, targetMode: 'each-original' } } },
  { id: 'mskill-smite', patch: { statusEffect: { chance: .2, durationMs: 1000 } } },
  { id: 'mskill-chop', patch: { critChanceBonus: .5 } },
  { id: 'mskill-pierce-thrust', patch: { maxTargets: undefined } }
])('rejects contradictory exact $id payload $patch', ({ id, patch }) => {
  expect(() => resolveMercDirectSkills(authored.map(row => row.id === id ? { ...row, ...patch } : row))).toThrow();
});

it('restores the native catalog on repeated default loads while preserving player and native siblings', () => {
  loadDefaultSkills();
  const siblings = ['sorceress.fire_ball', 'paladin.smite', 'mskill-bash', 'mskill-jab', 'mskill-basic-arrow'];
  const before = siblings.map(getSkill);
  for (let i = 0; i < 2; i++) {
    for (const skill of MERC_DIRECT_SKILLS) registerSkill({ ...skill, effects: [] });
    loadDefaultSkills();
    for (const skill of MERC_DIRECT_SKILLS) {
      expect(getSkill(skill.id)).toBe(skill);
      expect(MERC_STUB_SKILLS.some(stub => stub.id === skill.id)).toBe(false);
    }
    expect(siblings.map(getSkill)).toEqual(before);
    for (const skill of before) expect(skill).toBeDefined();
  }
});

it('describes reconciled damage, payment, recipient and payload behavior in both locales', () => {
  for (const locale of [en, zh]) {
    for (const key of ['fire-ball', 'glacial-spike', 'charged-bolt', 'smite', 'chop', 'pierce-thrust', 'basic-swing'] as const) {
      expect(locale.mercenary[key].desc).toContain('0');
    }
    expect(locale.mercenary['fire-ball'].desc).toContain('50–80');
    expect(locale.mercenary['fire-ball'].desc).toContain('10%');
    expect(locale.mercenary['glacial-spike'].desc).toContain('30%');
    expect(locale.mercenary['glacial-spike'].desc).toContain('50%');
    expect(locale.mercenary.smite.desc).toContain('25%');
    expect(locale.mercenary.smite.desc).toContain('0.5');
    expect(locale.mercenary.chop.desc).toContain('25');
  }
  expect(en.mercenary['charged-bolt'].desc).toContain('five independent');
  expect(en.mercenary['pierce-thrust'].desc).toContain('two distinct');
  expect(en.mercenary.chop.desc).toContain('percentage points');
  expect(zh.mercenary['charged-bolt'].desc).toContain('五枚独立');
  expect(zh.mercenary['pierce-thrust'].desc).toContain('两名不同');
  expect(zh.mercenary.chop.desc).toContain('个百分点');
});
