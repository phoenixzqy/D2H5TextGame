import { beforeEach, expect, it } from 'vitest';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { playerToCombatUnit } from './combatHelpers';
import { mercToCombatUnit } from './mercToCombatUnit';
import { createMercFromDef } from './mercFactory';
import { runBattleRecorded } from '@/engine/combat/combat';
import { loadDefaultSkills, getSkill } from '@/engine/skills/registry';
import { chooseSkill } from '@/engine/ai/policy';

const def = loadMercPool().pool.find(d => d.id === 'mercs/act2-holy-freeze');
if (!def) throw new Error('Missing actual Holy Freeze mercenary');
beforeEach(() => { loadDefaultSkills(); });
it('gives a real factory-built Holy Freeze merc its advertised combat presence', () => {
  const merc = mercToCombatUnit(createMercFromDef(def));
  const hero = playerToCombatUnit(createMockPlayer('Holy Freeze', 'sorceress'));
  const target = { ...hero, id: 'target', side: 'enemy' as const, kind: 'monster' as const,
    life: 1000000, skillOrder: [], stats: { ...hero.stats, lifeMax: 1000000, attack: 1, attackSpeed: 100 } };
  const r = runBattleRecorded({ seed: 7, playerTeam: [{ ...hero, life: 1000000, skillOrder: [],
    stats: { ...hero.stats, lifeMax: 1000000, attack: 1 } }, merc], enemyTeam: [target] });
  expect(r.events.find(e => e.kind === 'action' && e.actor === 'target')?.simClockMs).toBe(2000);
  expect(r.events.some(e => e.kind === 'action' && e.skillId === 'aura-holy-freeze')).toBe(false);
  expect(r.events.some(e => e.kind === 'action' && e.actor === merc.id && e.skillId === 'mskill-jab')).toBe(true);
  expect(getSkill('aura-holy-freeze')).toMatchObject({ trigger: 'passive', effects: [] });
});
it('does not grant a Holy Freeze aura to an ordinary merc with a forged priority', () => {
  const other = loadMercPool().pool.find(d => d.id === 'mercs/act2-prayer');
  if (!other) throw new Error('Missing actual Prayer mercenary');
  const merc = mercToCombatUnit({ ...createMercFromDef(other), comboOrder: ['aura-holy-freeze'] });
  expect(merc).not.toHaveProperty('holyFreezeAura');
});
it('skips the passive in the public AI policy as well as the timeline engine', () => {
  const merc = mercToCombatUnit(createMercFromDef(def));
  expect(chooseSkill(merc, true)).toBe('mskill-jab');
});
it('recognizes recruited instance IDs and refuses missing loadout or invalid level', () => {
  const owned = createMercFromDef(def, 'retained-instance');
  expect(mercToCombatUnit(owned).holyFreezeAura).toBe(true);
  const withoutAura = { ...owned, comboOrder: ['mskill-jab'] };
  delete withoutAura.signatureSkillId;
  expect(mercToCombatUnit(withoutAura))
    .not.toHaveProperty('holyFreezeAura');
  for (const level of [0, NaN, Infinity, 1.5]) {
    expect(mercToCombatUnit({ ...owned, level })).not.toHaveProperty('holyFreezeAura');
  }
});
