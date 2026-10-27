import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
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

it.each([1,20])('observes actual rank%i charge gains and clears them before the single discharge', rank => {
  const input = fixture(rank), before = structuredClone(input), out = runBattleRecorded(input);
  expect(input).toEqual(before); expect(runBattleRecorded(input)).toEqual(out);
  const observations = out.events.filter(e => e.kind === 'status-state').filter(e => e.target === 'hero');
  for (const [clock, count] of [[1700,1],[3400,2],[5100,3]] as const) {
    const gain = observations.find(e => e.simClockMs === clock && e.statuses.some(s => s.id === 'charge-tiger-strike' && s.stacks === count));
    expect(gain?.statuses.find(s => s.id === 'charge-tiger-strike')).toMatchObject({
      sourceId: 'hero', stacks: count, expiresAtMs: clock + 15000
    });
  }
  const clearIndex = out.events.findIndex(e => e.kind === 'status-state' && e.target === 'hero' &&
    e.simClockMs === 6800 && !e.statuses.some(s => s.id === 'charge-tiger-strike'));
  const hits = out.events.flatMap((e, index) => e.kind === 'damage' && e.source === 'hero' && e.simClockMs === 6800 ? [index] : []);
  expect(hits).toHaveLength(4);
  expect(clearIndex).toBeGreaterThan(hits[0] ?? Infinity);
  expect(clearIndex).toBeLessThan(hits[1] ?? -1);
});
it('expires a paid pool at the exact idle boundary before the next uncharged basic attack', () => {
  const input = fixture(1), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing hero');
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero, mana: 3,
    statuses: [{ id: 'stun', sourceId: 'constructed-hold', stacks: 1, remaining: 15,
      appliedAtMs: 1701, expiresAtMs: 16701 }] }] });
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 1700 &&
    e.statuses.some(s => s.id === 'charge-tiger-strike' && s.stacks === 1))).toBe(true);
  expect(out.events.some(e => e.kind === 'status-state' && e.target === 'hero' && e.simClockMs === 16700 &&
    !e.statuses.some(s => s.id === 'charge-tiger-strike'))).toBe(true);
  const expired = out.events.filter(e => e.kind === 'status-state').find(e => e.target === 'hero' && e.simClockMs === 16700);
  expect(expired?.statuses).toEqual([expect.objectContaining({ id: 'stun', expiresAtMs: 16701 })]);
  const firstBasic = out.events.find(e => e.kind === 'action' && e.actor === 'hero' && e.skillId === null);
  expect(firstBasic?.simClockMs).toBe(17000);
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero' && e.simClockMs === 17000)).toHaveLength(1);
});
it('never displays or discharges imported charge observations as paid power', () => {
  const input = fixture(1,false), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing hero');
  const forged: ActiveStatus = { id: 'charge-tiger-strike', sourceId: 'hero', stacks: 3, remaining: 15,
    appliedAtMs: 0, expiresAtMs: 15000 };
  const out = runBattleRecorded({ ...input, playerTeam: [{ ...hero, statuses: [...hero.statuses,forged] }] });
  expect(out.events.filter(e => e.kind === 'damage' && e.source === 'hero')).toHaveLength(12);
  expect(out.events.filter(e => e.kind === 'status-state').filter(e => e.target === 'hero')
    .every(e => !e.statuses.some(s => s.id === 'charge-tiger-strike'))).toBe(true);
});
