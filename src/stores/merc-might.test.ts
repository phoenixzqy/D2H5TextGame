import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import { chooseSkill } from '@/engine/ai/policy';
import { getSkill, loadDefaultSkills } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';
import en from '@/i18n/locales/en/mercs.json';
import zh from '@/i18n/locales/zh-CN/mercs.json';

const def = loadMercPool().pool.find(row => row.id === 'mercs/act2-might');
if (!def) throw new Error('Missing authored Might mercenary');
beforeEach(() => { loadDefaultSkills(); });

it('gives the real recruited Might merc its advertised party damage without spending an action', () => {
  const merc = mercToCombatUnit(createMercFromDef(def, 'might-regression'));
  const nativeHero = playerToCombatUnit(createMockPlayer('Might', 'sorceress'));
  const hero = { ...nativeHero, life: 100000, skillOrder: [],
    basicAttack: { damageType: 'physical' as const, damage: [100, 100] as const },
    stats: { ...nativeHero.stats, lifeMax: 100000, critChance: 0, attackSpeed: 200 } };
  const enemy = { ...hero, id: 'target', side: 'enemy' as const, kind: 'monster' as const,
    stats: { ...hero.stats, defense: 0, physDodge: 0, attackSpeed: 1 },
    statuses: [{ id: 'stun', stacks: 1, sourceId: 'fixture', remaining: -1 }] };
  const snapshot = { seed: 7, maxRounds: 2, playerTeam: [hero, merc], enemyTeam: [enemy] };
  const before = structuredClone(snapshot);
  const result = runBattleRecorded(snapshot);
  expect(result.events.find(event => event.kind === 'damage' && event.source === hero.id))
    .toMatchObject({ amount: 130, damageType: 'physical' });
  expect(merc).toHaveProperty('mercMightAura', true);
  expect(getSkill('aura-might')).toMatchObject({ trigger: 'passive', effects: [] });
  expect(chooseSkill(merc, true)).toBe('mskill-jab');
  expect(result.events.some(event => event.kind === 'action' && event.skillId === 'aura-might')).toBe(false);
  expect(snapshot).toEqual(before);
  expect(runBattleRecorded(snapshot)).toEqual(result);
});

it('qualifies only the native owned identity with its aura and a valid level', () => {
  const owned = createMercFromDef(def, 'owned');
  expect(mercToCombatUnit(owned)).toHaveProperty('mercMightAura', true);
  expect(mercToCombatUnit({ ...owned, id: 'mercs/act2-prayer#forged' }))
    .not.toHaveProperty('mercMightAura');
  const noAura = { ...owned, comboOrder: ['mskill-jab'] };
  delete noAura.signatureSkillId;
  expect(mercToCombatUnit(noAura)).not.toHaveProperty('mercMightAura');
  for (const level of [0, NaN, Infinity, 1.5]) {
    expect(mercToCombatUnit({ ...owned, level })).not.toHaveProperty('mercMightAura');
  }
});

it('describes the authored thirty percent effect in both recruitment locales', () => {
  expect(en.byId['act2-might'].lore).toContain('+30%');
  expect(zh.byId['act2-might'].lore).toContain('+30%');
});
