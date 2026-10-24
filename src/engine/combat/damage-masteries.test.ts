import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runBattle, runBattleRecorded } from './combat';
import type { ActiveStatus, CombatUnit } from './types';
import type { DamageType, DerivedStats } from '../types/attributes';
import { composeDamageMasteries } from '../skills/damage-masteries';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import * as status from './status';

const stats: DerivedStats = { life: 10000, lifeMax: 10000, mana: 25, manaMax: 25,
  attack: 1, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 2,
  physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
  resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } };
const hold = (appliedAtMs: number): ActiveStatus => ({ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1, appliedAtMs });
function snapshot(classId: 'necromancer' | 'druid', rank: number, skill: string) {
  const mastery = classId === 'necromancer' ? 'necromancer.poison_mastery' : 'druid.elemental_mastery';
  const skillLevels = { [mastery]: rank, [skill]: 20 };
  const mods = composeDamageMasteries({ classId, level: 40, skillLevels });
  const hero: CombatUnit = { id: 'fixture-hero', name: 'hero', side: 'player', kind: 'hero', tier: 'trash', level: 40,
    stats, life: 10000, mana: 25, statuses: [hold(1701)], cooldowns: {}, skillOrder: [mastery, skill], skillLevels,
    activeBuffIds: [], enraged: false, increasedDamagePct: mods.increasedDamagePct };
  const enemy: CombatUnit = { ...hero, id: 'fixture-target', name: 'target', side: 'enemy', kind: 'monster',
    statuses: [hold(0)], skillOrder: [], skillLevels: {}, increasedDamagePct: {} };
  return { seed: 7, playerTeam: [hero], enemyTeam: [enemy] };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });
describe('damage masteries use the existing combat pipeline once', () => {
  it.each(['physical', 'fire', 'cold', 'lightning', 'poison', 'arcane', 'thorns'] as const)(
    'applies only authored mastery damage to a fixed100 %s hit', (type: DamageType) => {
      const skill = 'fixture.mastery-probe';
      registerSkill({ id: skill, archetype: 'fixture', target: 'single-enemy', minLevel: 1, cooldown: 1,
        manaCost: 0, effects: [{ kind: 'damage', damageType: type, base: [100, 100] }] });
      for (const classId of ['necromancer', 'druid'] as const) {
        const input = snapshot(classId, 20, skill), before = structuredClone(input);
        const result = runBattleRecorded(input);
        const expected = classId === 'necromancer' ? (type === 'poison' ? 180 : type === 'arcane' ? 140 : 100)
          : (type === 'fire' || type === 'cold' ? 160 : 100);
        expect(result.events.filter(e => e.kind === 'damage')).toEqual([
          expect.objectContaining({ source: 'fixture-hero', damageType: type, amount: expected, crit: false, dodged: false })]);
        expect(result.events.filter(e => e.kind === 'action')).toEqual([expect.objectContaining({ skillId: skill })]);
        expect(result.events.filter(e => e.kind === 'buff')).toEqual([]);
        expect(result.result.playerTeam[0]?.mana).toBe(25);
        expect(runBattle(input)).toEqual(result.result); expect(runBattleRecorded(input)).toEqual(result);
        expect(input).toEqual(before);
      }
    });
  it.each([0, 1, 20])('snapshots real ranked Poison Nova DoT once after the rank%s increased hit', rank => {
    const spell = 'skills-necromancer-poison-nova';
    const original = structuredClone(getSkill(spell));
    const apply = vi.spyOn(status, 'applyStatus');
    const input = snapshot('necromancer', rank, spell), before = structuredClone(input);
    const result = runBattleRecorded(input);
    const hit = result.events.find(e => e.kind === 'damage');
    if (hit?.kind !== 'damage') throw new Error('Missing real Poison Nova hit');
    expect(hit).toMatchObject({ damageType: 'poison', amount: Math.floor(96 * (1 + rank * 0.04)), crit: false });
    expect(apply.mock.calls.map(call => call[1])).toEqual([
      expect.objectContaining({ id: 'poison', dotPerStack: Math.max(1, Math.floor(hit.amount * 0.05)) }),
      expect.objectContaining({ id: 'poison', dotPerStack: Math.max(1, Math.floor(hit.amount * 0.05)) }),
    ]);
    expect(result.events.some(e => e.kind === 'dot' && e.amount > 0)).toBe(true);
    expect(result.events.filter(e => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'fixture-hero', skillId: 'necromancer.poison_nova' })]);
    expect(result.result.playerTeam[0]?.mana).toBe(0);
    expect(input).toEqual(before); expect(getSkill(spell)).toEqual(original);
    expect(runBattleRecorded(input)).toEqual(result);
  });
});
