import { afterEach, beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded } from '@/engine/combat/combat';
import { chooseSkill } from '@/engine/ai/policy';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import en from '@/i18n/locales/en/mercs.json';
import zh from '@/i18n/locales/zh-CN/mercs.json';
import enSkills from '@/i18n/locales/en/skills.json';
import zhSkills from '@/i18n/locales/zh-CN/skills.json';
import { playerToCombatUnit } from './combatHelpers';
import { createMercFromDef } from './mercFactory';
import { mercToCombatUnit } from './mercToCombatUnit';

const def = loadMercPool().pool.find(row => row.id === 'mercs/act2-thorns');
if (!def) throw new Error('Missing authored Thorns mercenary');
const hold = { id: 'stun', stacks: 1, sourceId: 'constructed-hold', remaining: -1 };
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it('gives the real recruited Thorns merc its advertised party reflection without an aura cast', () => {
  registerSkill({ id: 'fixture.native-thorns-hit', archetype: 'fixture', target: 'all-enemies',
    minLevel: 1, cooldown: 1, manaCost: 0,
    effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100], alwaysHits: true }] });
  const nativeHero = playerToCombatUnit(createMockPlayer('Thorns', 'sorceress'));
  const hero = { ...nativeHero, life: 100000, skillOrder: [], statuses: [hold],
    stats: { ...nativeHero.stats, lifeMax: 100000, defense: 0, critChance: 0, physDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  const nativeMerc = mercToCombatUnit(createMercFromDef(def, 'thorns-regression'));
  const merc = { ...nativeMerc, life: 100000, statuses: [hold],
    stats: { ...nativeMerc.stats, lifeMax: 100000, defense: 0 } };
  const enemy = { ...hero, id: 'attacker', side: 'enemy' as const, kind: 'monster' as const,
    skillOrder: ['fixture.native-thorns-hit'], statuses: [{ ...hold, appliedAtMs: 1701 }],
    stats: { ...hero.stats, attackSpeed: 100 } };
  const snapshot = { seed: 7, maxRounds: 3, playerTeam: [hero, merc], enemyTeam: [enemy] };
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(out.events.find(e => e.kind === 'damage' && e.source === enemy.id && e.target === hero.id))
    .toMatchObject({ amount: 100, damageType: 'physical' });
  expect(out.events.find(e => e.kind === 'damage' && e.source === hero.id && e.damageType === 'thorns'))
    .toMatchObject({ amount: 100, target: enemy.id, crit: false, dodged: false });
  expect(getSkill('aura-thorns')).toMatchObject({ trigger: 'passive', effects: [] });
  expect(chooseSkill(nativeMerc, true)).toBe('mskill-jab');
  expect(out.events.some(e => e.kind === 'action' && e.skillId === 'aura-thorns')).toBe(false);
  expect(snapshot).toEqual(before);
  expect(runBattleRecorded(snapshot)).toEqual(out);
});

it('qualifies only the native identity with its aura and a valid level', () => {
  const owned = createMercFromDef(def, 'owned');
  expect(mercToCombatUnit(owned)).toHaveProperty('mercThornsAura', true);
  expect(mercToCombatUnit({ ...owned, id: 'mercs/act2-prayer#forged' }))
    .not.toHaveProperty('mercThornsAura');
  const noAura = { ...owned, comboOrder: ['mskill-jab'] };
  delete noAura.signatureSkillId;
  expect(mercToCombatUnit(noAura)).not.toHaveProperty('mercThornsAura');
  for (const level of [0, NaN, Infinity, 1.5]) {
    expect(mercToCombatUnit({ ...owned, level })).not.toHaveProperty('mercThornsAura');
  }
});

it('describes the authored hundred percent actual physical HP reflection in both locale surfaces', () => {
  for (const text of [en.byId['act2-thorns'].lore, zh.byId['act2-thorns'].lore,
    enSkills.mercenary.thorns.desc, zhSkills.mercenary.thorns.desc]) {
    expect(text).toContain('100%');
  }
});
