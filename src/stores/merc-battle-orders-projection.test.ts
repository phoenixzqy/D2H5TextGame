import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { getSkill, loadDefaultSkills } from '@/engine/skills/registry';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import en from '@/i18n/locales/en/mercs.json';
import zh from '@/i18n/locales/zh-CN/mercs.json';
import enSkills from '@/i18n/locales/en/skills.json';
import zhSkills from '@/i18n/locales/zh-CN/skills.json';

const def = loadMercPool().pool.find(row => row.id === 'mercs/act5-barbarian-battle-orders');
if (!def) throw new Error('Missing authored Battle Orders mercenary');
beforeEach(() => { loadDefaultSkills(); });

it('qualifies only the canonical owned identity and configured skill, without changing saved stats', () => {
  const owned = createMercFromDef(def, 'owned'), before = structuredClone(owned);
  expect(mercToCombatUnit(owned)).toHaveProperty('mercBattleOrders', true);
  expect(mercToCombatUnit({ ...owned, id: def.id })).toHaveProperty('mercBattleOrders', true);
  expect(getSkill('aura-battle-orders')).toMatchObject({ trigger: 'passive', effects: [], manaCost: 0, cooldown: 0 });
  expect(mercToCombatUnit({ ...owned, id: 'mercs/act1-rogue-cold#forged' })).not.toHaveProperty('mercBattleOrders');
  const { signatureSkillId: _signature, ...withoutSignature } = owned;
  expect(mercToCombatUnit({ ...withoutSignature, comboOrder: ['mskill-bash'] })).not.toHaveProperty('mercBattleOrders');
  for (const level of [0, NaN, Infinity, 1.5]) {
    expect(mercToCombatUnit({ ...owned, level })).not.toHaveProperty('mercBattleOrders');
  }
  expect(owned).toEqual(before);
  expect(owned).not.toHaveProperty('mercBattleOrders');
});

it('describes living party capacity without claiming a refill in both locales', () => {
  for (const text of [en.byId['act5-barbarian-battle-orders'].lore, zh.byId['act5-barbarian-battle-orders'].lore,
    enSkills.mercenary['battle-orders'].desc, zhSkills.mercenary['battle-orders'].desc]) {
    expect(text).toContain('+30%');
  }
  expect(enSkills.mercenary['battle-orders'].desc).toContain('maximum HP and MP');
  expect(zhSkills.mercenary['battle-orders'].desc).toContain('最大生命与最大法力');
});
