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

import barbarianRows from '@/data/skills/barbarian.json';
import { captureBattleCommandPassiveProfile } from '@/engine/skills/battle-command';
function commanded(commandRank: number) {
  const input = fixture(1), hero = input.playerTeam[0]; if (!hero) throw new Error('Missing hero');
  const profile = captureBattleCommandPassiveProfile(hero);
  const captain = playerToCombatUnit({ ...createMockPlayer('Constructed paid Commander','barbarian'),
    id: 'captain',level: 30,comboOrder: ['skills-barbarian-battle-command'],
    skillLevels: { ...Object.fromEntries(barbarianRows.map(row => [row.id,1])),
      'skills-barbarian-battle-command': commandRank } });
  const snapshot = { ...input,playerTeam: [{ ...hero,
    battleCommandPassives: { baseline: profile,boosted: profile },
    statuses: [{ id:'stun',sourceId:'constructed-pause',stacks:1,remaining:4.9,
      appliedAtMs:5101,expiresAtMs:10001 },hold(10201)] },{ ...captain,
    life:2000,mana:1000,stats:{ ...hero.stats,manaMax:1000,attackSpeed:200 },
    manaRegenPerSecond:0,manaRegenBaselinePerSecond:0,statuses:[hold(1401)] }] };
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before); expect(runBattleRecorded(snapshot)).toEqual(out);
  expect(runBattle(snapshot)).toEqual(out.result);
  expect(out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'captain'))
    .toEqual([expect.objectContaining({ skillId:'barbarian.battle_command',simClockMs:900 })]);
  expect(out.events.some(e => e.kind === 'mana' && e.target === 'captain' && e.reason === 'cast')).toBe(true);
  expect(out.events.filter(e => e.kind === 'action').filter(e => e.actor === 'hero').map(e => [e.skillId,e.simClockMs]))
    .toEqual([['assassin.tiger_strike',1700],['assassin.tiger_strike',3400],['assassin.tiger_strike',5100],['assassin.dragon_talon',10200]]);
  return out;
}
it('captures paid Command at gain once and retains identical charge damage after Command expires', () => {
  const expired=commanded(1),active=commanded(20);
  const releaseHits=(out:ReturnType<typeof commanded>)=>out.events.filter(e=>e.kind==='damage')
    .filter(e=>e.source==='hero' && e.simClockMs===10200);
  const expiredHits=releaseHits(expired),activeHits=releaseHits(active);
  expect(expiredHits).toHaveLength(4);expect(activeHits).toHaveLength(4);
  expect(expiredHits[1]?.amount).toBeGreaterThanOrEqual(58);
  expect(expiredHits[1]?.amount).toBeLessThanOrEqual(88);
  expect(activeHits[1]).toEqual(expiredHits[1]);
  for(const index of [0,2,3])expect(activeHits[index]?.amount).toBe((expiredHits[index]?.amount ?? 0)+4);
  expect(expired.events.some(e=>e.kind==='status-state' && e.target==='hero' && e.simClockMs===8900 &&
    !e.statuses.some(s=>s.id==='battle-command') && e.statuses.some(s=>s.id==='charge-tiger-strike' && s.stacks===3))).toBe(true);
  expect(active.events.some(e=>e.kind==='status-state' && e.target==='hero' && e.simClockMs===10200 &&
    e.statuses.some(s=>s.id==='battle-command'))).toBe(true);
});
it('keeps paid pools private to the native caster when another hero uses uncharged finishers', () => {
  const input=fixture(1),other=fixture(1,false).playerTeam[0];if(!other)throw new Error('Missing second hero');
  const out=runBattleRecorded({ ...input,playerTeam:[...input.playerTeam,{ ...other,id:'other-hero' }] });
  expect(out.events.some(e=>e.kind==='status-state' && e.target==='hero' && e.statuses.some(s=>s.id==='charge-tiger-strike'))).toBe(true);
  expect(out.events.some(e=>e.kind==='status-state' && e.target==='other-hero' && e.statuses.some(s=>s.id==='charge-tiger-strike'))).toBe(false);
  for(const clock of [1700,3400,5100,6800])expect(out.events.filter(e=>e.kind==='damage')
    .filter(e=>e.source==='other-hero' && e.simClockMs===clock)).toHaveLength(3);
});
