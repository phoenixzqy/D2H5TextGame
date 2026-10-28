import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { getSkill, loadDefaultSkills } from '@/engine/skills/registry';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import en from '@/i18n/locales/en/mercs.json';
import zh from '@/i18n/locales/zh-CN/mercs.json';
import enSkills from '@/i18n/locales/en/skills.json';
import zhSkills from '@/i18n/locales/zh-CN/skills.json';

const def = loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-pierce');
if (!def) throw new Error('Missing authored Rogue Pierce');
beforeEach(() => { loadDefaultSkills(); });

it('qualifies only the canonical owned identity and configured skill, without changing saved stats', () => {
  const owned = createMercFromDef(def, 'owned'), before = structuredClone(owned);
  expect(mercToCombatUnit(owned)).toHaveProperty('mercCritical', true);
  expect(mercToCombatUnit({ ...owned, id: def.id })).toHaveProperty('mercCritical', true);
  expect(getSkill('passive-critical')).toMatchObject({ trigger: 'passive', effects: [], manaCost: 0, cooldown: 0 });
  expect(mercToCombatUnit({ ...owned, id: 'mercs/act1-rogue-cold#forged' })).not.toHaveProperty('mercCritical');
  expect(mercToCombatUnit({ ...owned, comboOrder: ['mskill-pierce-arrow'] })).not.toHaveProperty('mercCritical');
  for (const level of [0, NaN, Infinity, 1.5]) {
    expect(mercToCombatUnit({ ...owned, level })).not.toHaveProperty('mercCritical');
  }
  expect(owned).toEqual(before);
  expect(owned).not.toHaveProperty('mercCritical');
});

it('describes both party increments in recruitment and skill locales', () => {
  for (const text of [en.byId['act1-rogue-pierce'].lore, zh.byId['act1-rogue-pierce'].lore,
    enSkills.mercenary.critical.desc, zhSkills.mercenary.critical.desc]) {
    expect(text).toContain('+5');
    expect(text).toContain('+20');
  }
  expect(enSkills.mercenary.critical.desc).toContain('percentage points');
  expect(zhSkills.mercenary.critical.desc).toContain('个百分点');
});
