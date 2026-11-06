import Ajv2020 from 'ajv/dist/2020';
import { afterEach, expect, it } from 'vitest';
import rows from '../../data/skills/mercenary.json';
import schema from '../../data/schema/skill.schema.json';
import { getSkill, loadDefaultSkills, resetRegistry } from './registry';
import { MERC_BLESSED_AIM_DEFINITION, MERC_BLESSED_AIM_SKILL, resolveMercBlessedAim } from './merc-blessed-aim';

const validate = new Ajv2020({ strict: true, allErrors: true }).compile(schema);
function authored() {
  const row = rows.find(row => row.id === 'aura-blessed-aim');
  if (!row) throw new Error('Missing native Blessed Aim');
  return structuredClone(row);
}
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it('authors the selected relative reduction as an action-free native passive', () => {
  expect(validate(authored())).toBe(true);
  expect(MERC_BLESSED_AIM_DEFINITION).toEqual({ minLevel: 1, maxRank: 20, weaponMissReduction: .3 });
  expect(MERC_BLESSED_AIM_SKILL).toMatchObject({ id: 'aura-blessed-aim', trigger: 'passive',
    target: 'all-allies', manaCost: 0, cooldown: 0, effects: [] });
  loadDefaultSkills(); loadDefaultSkills();
  expect(getSkill('aura-blessed-aim')).toBe(MERC_BLESSED_AIM_SKILL);
  expect(getSkill('skills-paladin-blessed-aim')).not.toBe(MERC_BLESSED_AIM_SKILL);
});

it.each([0, 30, 100])('copies bounded tuning %s without retaining or freezing source', reduction => {
  const row = { ...authored(), mercBlessedAim: { weaponMissReductionPct: reduction } };
  const out = resolveMercBlessedAim([null, {}, row]);
  expect(out.definition.weaponMissReduction).toBe(reduction / 100);
  expect(Object.isFrozen(row.mercBlessedAim)).toBe(false);
  row.mercBlessedAim.weaponMissReductionPct = 12;
  expect(out.definition.weaponMissReduction).toBe(reduction / 100);
  for (const value of [out, out.definition, out.skill, out.skill.effects]) expect(Object.isFrozen(value)).toBe(true);
});

it.each([
  { mercBlessedAim: undefined }, { mercBlessedAim: {} },
  ...[-1, 100.01, NaN, Infinity, '30', null].map(weaponMissReductionPct => ({ mercBlessedAim: { weaponMissReductionPct } })),
  { mercBlessedAim: { weaponMissReductionPct: 30, extra: 1 } },
  { trigger: 'active' }, { target: 'self' }, { cooldown: 1 }, { cost: { mana: 0 } },
  { damageType: 'physical' }, { appliesStatus: ['stun'] }, { appliesTags: ['physical'] },
  { scaling: { damagePerLevel: 1 } }, { aura: { attackPct: 30 } }, { extra: 1 }
])('rejects malformed or conflicting metadata %j', patch => {
  const row = { ...authored(), ...patch };
  expect(validate(row)).toBe(false);
  expect(() => resolveMercBlessedAim([row])).toThrow(/Invalid/);
});

it('requires exactly one matching identity and rejects metadata on another row', () => {
  expect(() => resolveMercBlessedAim([])).toThrow(/exactly one/);
  expect(() => resolveMercBlessedAim([authored(), authored()])).toThrow(/exactly one/);
  expect(validate({ ...authored(), id: 'aura-prayer' })).toBe(false);
});
