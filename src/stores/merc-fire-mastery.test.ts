import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import { getSkill, loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import en from '@/i18n/locales/en/mercs.json';
import zh from '@/i18n/locales/zh-CN/mercs.json';
import enSkills from '@/i18n/locales/en/skills.json';
import zhSkills from '@/i18n/locales/zh-CN/skills.json';

const def = loadMercPool().pool.find(row => row.id === 'mercs/act3-iron-wolf-fire');
if (!def) throw new Error('Missing authored Iron Wolf Fire');
const hold = { id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 };
beforeEach(() => { loadDefaultSkills(); });

it('gives a real Iron Wolf Fire party 125 instead of 100 fire damage without a passive cast', () => {
  const owned = createMercFromDef(def, 'fire-regression');
  const merc = { ...mercToCombatUnit(owned), statuses: [hold] };
  const nativeHero = playerToCombatUnit(createMockPlayer('Fire', 'sorceress'));
  // Constructed surviving combat stats isolate support; this is not earned recruitment evidence.
  const hero = { ...nativeHero, life: 100000, skillOrder: [], increasedDamagePct: {},
    basicAttack: { damageType: 'fire' as const, damage: [100, 100] as const },
    stats: { ...nativeHero.stats, lifeMax: 100000, critChance: 0, attackSpeed: 200 } };
  const enemy = { ...hero, id: 'target', side: 'enemy' as const, kind: 'monster' as const,
    stats: { ...hero.stats, defense: 0, magicResist: 0, magicDodge: 0, attackSpeed: 1,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [hold] };
  const input = { seed: 7, maxRounds: 2, playerTeam: [hero, merc], enemyTeam: [enemy] };
  const before = structuredClone(input);
  const withoutPassive = mercToCombatUnit({ ...owned,
    comboOrder: owned.comboOrder.filter(id => id !== 'passive-fire-mastery') });
  const control = runBattleRecorded({ ...input, playerTeam: [hero, { ...withoutPassive, statuses: [hold] }] });
  expect(control.events.find(e => e.kind === 'damage' && e.source === hero.id))
    .toMatchObject({ amount: 100, damageType: 'fire', crit: false, dodged: false });
  const result = runBattleRecorded(input);
  expect(result.events.find(e => e.kind === 'damage' && e.source === hero.id))
    .toMatchObject({ amount: 125, damageType: 'fire', crit: false, dodged: false });
  expect(result.events.some(e => e.kind === 'action' && e.skillId === 'passive-fire-mastery')).toBe(false);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(result);
});

it('registers a true passive and qualifies only the canonical owned identity and configured skill', () => {
  const owned = createMercFromDef(def, 'owned');
  expect(mercToCombatUnit(owned)).toHaveProperty('mercFireMastery', true);
  expect(getSkill('passive-fire-mastery')).toMatchObject({ trigger: 'passive', effects: [], cooldown: 0 });
  expect(mercToCombatUnit({ ...owned, id: 'mercs/act3-iron-wolf-cold#forged' }))
    .not.toHaveProperty('mercFireMastery');
  expect(mercToCombatUnit({ ...owned, comboOrder: ['mskill-fire-ball'] })).not.toHaveProperty('mercFireMastery');
  for (const level of [0, NaN, Infinity, 1.5]) {
    expect(mercToCombatUnit({ ...owned, level })).not.toHaveProperty('mercFireMastery');
  }
});

it('describes the twenty-five percent party support in both recruitment and skill locales', () => {
  for (const text of [en.byId['act3-iron-wolf-fire'].lore, zh.byId['act3-iron-wolf-fire'].lore,
    enSkills.mercenary['fire-mastery'].desc, zhSkills.mercenary['fire-mastery'].desc]) {
    expect(text).toContain('+25%');
  }
});
