import { afterEach, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import { createSkillValidator } from './skill-validator';
import { MERC_BASH_SKILL, resolveMercBashSkill } from './merc-bash';
import { getSkill, loadDefaultSkills, registerSkill } from './registry';
import { MERC_STUB_SKILLS } from './aliases';
import en from '../../i18n/locales/en/skills.json';
import zh from '../../i18n/locales/zh-CN/skills.json';

const authored = rows.find(row => row.id === 'mskill-bash');
if (!authored) throw new Error('Missing authored mercenary Bash');
const validate = createSkillValidator();
afterEach(() => { loadDefaultSkills(); });

it('resolves Bash into copied, deeply frozen damage, sequence, status and tags', () => {
  const source = structuredClone(authored), before = structuredClone(source);
  const skill = resolveMercBashSkill([null, { id: 'unrelated' }, source]);
  expect(skill).toEqual({ id: 'mskill-bash', archetype: 'mercenary', trigger: 'active',
    target: 'single-enemy', cooldown: 2, manaCost: 0, minLevel: 1,
    effects: [{ kind: 'damage', damageType: 'physical', base: [25, 40],
      hitSequence: { strikes: 2 }, applyStatus: { id: 'stun', chance: .25, durationMs: 1000 },
      tags: ['physical'] }] });
  expect(source).toEqual(before);
  expect(skill).toEqual(MERC_BASH_SKILL);
  const effect = skill.effects[0];
  if (effect?.kind !== 'damage') throw new Error('Missing Bash damage');
  for (const value of [skill, skill.effects, effect, effect.base, effect.hitSequence, effect.applyStatus, effect.tags]) {
    expect(Object.isFrozen(value)).toBe(true);
  }
  if (!source.damage || !source.statusEffect) throw new Error('Missing authored metadata');
  source.damage.min = 999;
  source.statusEffect.chance = .5;
  source.appliesTags[0] = 'fire';
  expect(skill).toEqual(MERC_BASH_SKILL);
});

it('requires exactly one exact Bash row', () => {
  for (const source of [[], [null], [{ ...authored, id: 'other' }], [authored, authored]]) {
    expect(() => resolveMercBashSkill(source)).toThrow(/exactly one/);
  }
});

it.each([
  { hitSequence: undefined }, { hitSequence: { strikes: 1 } }, { hitSequence: { strikes: 3 } },
  { hitSequence: { strikes: 2, targetMode: 'each-original' } },
  { appliesStatus: undefined }, { appliesStatus: ['freeze'] }, { appliesStatus: ['stun', 'stun'] },
  { statusEffect: undefined }, { statusEffect: {} }, { statusEffect: { chance: .25 } },
  { statusEffect: { chance: .5, durationMs: 1000 } }, { statusEffect: { chance: .25, durationMs: 0 } },
  { statusEffect: { id: 'stun', chance: .25, durationMs: 1000 } },
  { statusEffect: { chance: .25, durationMs: 1000, bossDurationMultiplier: .5 } },
  { damage: { min: 40, max: 1 } }, { damage: { min: 1.5, max: 2 } },
  { damage: { min: NaN, max: Infinity } }, { damage: undefined }, { damageType: 'fire' },
  { attackDamagePct: 100 }, { mercJab: { physicalDamagePct: 50 } },
  { scaling: { damagePerLevel: 1 } }, { trigger: 'passive' }, { target: 'all-enemies' },
  { cooldown: 1 }, { cost: {} }, { cost: { mana: 1 } }, { cost: { mana: 0, life: 1 } },
  { minLevel: 2 }, { maxLevel: 21 }, { alwaysHits: true }, { ignoresDefense: true },
  { additionalStatusEffects: {} }, { onHitRecovery: {} }, { typo: true }
])('rejects malformed or contradictory Bash metadata %j', patch => {
  expect(() => resolveMercBashSkill([{ ...authored, ...patch }])).toThrow();
});

it('keeps every mercenary row valid and does not authorize Bash sequences on unrelated rows', () => {
  for (const row of rows) {
    expect(validate(row), row.id).toBe(true);
    if (!['mskill-jab', 'mskill-bash'].includes(row.id)) {
      expect(validate({ ...row, hitSequence: { strikes: 2 } }), row.id).toBe(false);
    }
  }
});

it('restores native Bash on repeated default loads without changing player Bash or native Jab', () => {
  loadDefaultSkills();
  const player = getSkill('barbarian.bash'), jab = getSkill('mskill-jab');
  expect(player).toBeDefined();
  expect(jab).toBeDefined();
  expect(MERC_STUB_SKILLS.some(skill => skill.id === 'mskill-bash')).toBe(false);
  for (let i = 0; i < 3; i++) {
    registerSkill({ ...MERC_BASH_SKILL, effects: [] });
    loadDefaultSkills();
    expect(getSkill('mskill-bash')).toBe(MERC_BASH_SKILL);
    expect(getSkill('barbarian.bash')).toEqual(player);
    expect(getSkill('mskill-jab')).toEqual(jab);
  }
});

it('describes both attempts, per-landed chance and ordinary/boss duration in both locales', () => {
  for (const part of ['twice', 'Each landed hit', '25%', '1 second', '0.5 seconds', 'bosses']) {
    expect(en.mercenary.bash.desc).toContain(part);
  }
  for (const part of ['两次', '每次命中', '25%', '1秒', '首领', '0.5秒']) expect(zh.mercenary.bash.desc).toContain(part);
});
