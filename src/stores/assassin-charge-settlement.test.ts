import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from '@/stores/combatHelpers';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useFormationStore } from '@/stores/formationStore';
const TIGER = 'skills-assassin-tiger-strike', TALON = 'skills-assassin-dragon-talon';
const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'constructed-hold', stacks: 1, remaining: -1, appliedAtMs });
function fixture(rank: number, withCharge = true): CombatSnapshot {
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed charges', 'assassin'),
    id: 'hero', level: 30, comboOrder: withCharge ? [TIGER, TALON] : [TALON],
    skillLevels: { 'assassin.tiger_strike': rank, 'assassin.dragon_talon': rank } });
  const hero: CombatUnit = { ...native, life: 2000, mana: 100,
    manaRegenPerSecond: 0, manaRegenBaselinePerSecond: 0, statuses: [hold(6801)],
    stats: { ...native.stats, lifeMax: 2000, manaMax: 100, attackSpeed: 100, attack: 100,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0, critChance: 0, critDamage: 2,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  const target: CombatUnit = { id: 'target', name: 'Constructed target', side: 'enemy', kind: 'monster',
    tier: 'trash', level: 30, life: 99999, mana: 0, stats: { ...hero.stats, lifeMax: 99999 },
    cooldowns: {}, activeBuffIds: [], skillOrder: [], statuses: [hold()], enraged: false };
  return { seed: 7, playerTeam: [hero], enemyTeam: [target] };
}
beforeEach(() => { useInventoryStore.getState().reset(); useMapStore.getState().reset();
  useFormationStore.getState().reset(); resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

function record(input: CombatSnapshot) {
  const before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  return out;
}
function reflected(life: number, shield = false) {
  const input = fixture(1), hero = input.playerTeam[0], target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing native fixture');
  return { ...input, playerTeam: [{ ...hero, life,
    statuses: [...hero.statuses, ...(shield ? [{ id: 'bone-armor', sourceId: hero.id, stacks: 1,
      remaining: -1, boneArmor: { rank: 20, remaining: 240 } }] : [])] }],
    enemyTeam: [{ ...target, physicalReflectionPct: 1 }] };
}
it('does not gain a charge when the paid builder kills its caster through reflection', () => {
  const out = record(reflected(1));
  expect(out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero')).toHaveLength(1);
  expect(out.events.some(e => e.kind === 'damage' && e.source === 'hero' && e.amount > 0)).toBe(true);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' &&
    e.statuses.some(s => s.id === 'charge-tiger-strike'))).toBe(false);
  expect(out.result.playerTeam[0]?.life).toBe(0);
});
it('does not discharge already-paid pools when the first finisher hit reflects lethal damage', () => {
  const out = record(reflected(150));
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' &&
    e.statuses.some(s => s.id === 'charge-tiger-strike' && s.stacks === 3))).toBe(true);
  expect(out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero').map(e => e.skillId))
    .toEqual(['assassin.tiger_strike','assassin.tiger_strike','assassin.tiger_strike','assassin.dragon_talon']);
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero' && e.simClockMs === 6800)).toHaveLength(1);
  expect(out.result.playerTeam[0]?.life).toBe(0);
  expect(out.events.filter(e => e.kind === 'death').filter(e => e.target === 'hero')).toHaveLength(1);
});
it('spends a finite personal shield before reflection kills the caster and stops the finisher', () => {
  const out = record(reflected(1, true));
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' &&
    e.statuses.some(s => s.id === 'charge-tiger-strike' && s.stacks === 3))).toBe(true);
  const reflectedHits = out.events.filter(e => e.kind === 'damage').filter(e => e.target === 'hero');
  expect(reflectedHits.reduce((sum,e) => sum + (e.absorbed ?? 0), 0)).toBe(240);
  expect(out.result.playerTeam[0]?.life).toBe(0);
  const death = out.events.findIndex(e => e.kind === 'death' && e.target === 'hero');
  expect(out.events.slice(death + 1).some(e => e.kind === 'damage' && e.source === 'hero')).toBe(false);
});
it('consumes on a lethal first victim without retargeting the stored release or remaining kicks', () => {
  const input = fixture(1), target = input.enemyTeam[0]; if (!target) throw new Error('Missing target');
  const out = record({ ...input, enemyTeam: [{ ...target, life: 122 }, { ...target, id: 'other' }] });
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' &&
    e.statuses.some(s => s.id === 'charge-tiger-strike' && s.stacks === 3))).toBe(true);
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero' && e.simClockMs === 6800))
    .toEqual([expect.objectContaining({ target: 'target' })]);
  expect(out.result.enemyTeam.find(u => u.id === 'other')?.life).toBe(99999);
  expect(out.events.filter(e => e.kind === 'death').filter(e => e.target === 'target')).toHaveLength(1);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 6800 &&
    !e.statuses.some(s => s.id === 'charge-tiger-strike'))).toBe(true);
});
function cobra(victimMana: number, missingLife = 1000, manaMax = 100) {
  const input = fixture(1), hero = input.playerTeam[0], target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing Cobra fixture');
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed Cobra settlement','assassin'),
    id: 'hero', level: 30, comboOrder: ['skills-assassin-cobra-strike'],
    skillLevels: { 'assassin.tiger_strike': 1, 'assassin.cobra_strike': 1 } });
  return { ...input, playerTeam: [{ ...hero,...native,life: 2000 - missingLife,mana: 9,
    stats: { ...hero.stats,manaMax }, manaRegenPerSecond: 0,manaRegenBaselinePerSecond: 0,
    statuses: [hold(3401)] }], enemyTeam: [{ ...target,mana: victimMana,stats: { ...target.stats,manaMax: 500 } }] };
}
it.each([0,5,500])('Cobra debits only actual surviving victim MP%i and credits exactly the same amount', mana => {
  const out = record(cobra(mana)), expected = Math.min(10, mana);
  expect(out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero').map(e => e.skillId))
    .toEqual(['assassin.cobra_strike',null]);
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero' && e.simClockMs === 3400))
    .toEqual([expect.objectContaining({ amount: 100 })]);
  expect(out.result.playerTeam[0]).toMatchObject({ life: 1010,mana: expected });
  expect(out.result.enemyTeam[0]?.mana).toBe(mana - expected);
  const transfers = out.events.filter(e => e.kind === 'mana').filter(e => e.reason === 'cobra-strike');
  expect(transfers).toHaveLength(expected > 0 ? 2 : 0);
  if (expected > 0) expect(transfers.map(e => [e.target,e.mana])).toEqual([['target',mana-expected],['hero',expected]]);
});
it.each([0,5])('Cobra clamps to missing life%i and mana capacity without charging extra damage', missing => {
  const out = record(cobra(500,missing,9));
  expect(out.result.playerTeam[0]).toMatchObject({ life: 2000,mana: 9 });
  expect(out.result.enemyTeam[0]?.mana).toBe(491);
  expect(out.events.filter(e => e.kind === 'heal').filter(e => e.target === 'hero').map(e => e.amount))
    .toEqual(missing > 0 ? [missing] : []);
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero')).toHaveLength(2);
});
it('a multi-target Tail releases once at the first successful original victim', () => {
  const input = fixture(1), hero = input.playerTeam[0], target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing Tail fixture');
  const native = playerToCombatUnit({ ...createMockPlayer('Constructed Tail settlement','assassin'),id: 'hero',level: 30,
    comboOrder: [TIGER,'skills-assassin-dragon-tail'],skillLevels: {
      'assassin.tiger_strike':1,'assassin.dragon_talon':1,'assassin.dragon_tail':1 } });
  const out = record({ ...input,playerTeam: [{ ...hero,...native,life: hero.life,mana: hero.mana,stats: hero.stats,
    manaRegenPerSecond: 0,manaRegenBaselinePerSecond: 0,statuses: hero.statuses }],
    enemyTeam: [target,{ ...target,id:'second' },{ ...target,id:'third' }] });
  const hits = out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero' && e.simClockMs === 6800);
  expect(hits.filter(e => e.damageType === 'fire')).toHaveLength(3);
  expect(hits.filter(e => e.damageType === 'physical')).toEqual([expect.objectContaining({ target: 'target' })]);
  expect(out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero' && e.simClockMs === 6800))
    .toEqual([expect.objectContaining({ skillId: 'assassin.dragon_tail' })]);
  expect(out.result.playerTeam[0]?.mana).toBe(78);
});
