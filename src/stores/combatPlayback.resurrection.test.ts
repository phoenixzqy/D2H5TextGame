import { describe, expect, it } from 'vitest';
import type { BattleEvent, RecordedBattleEvent } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import type { DerivedStats } from '@/engine/types/attributes';
import { applyEventToTeams, stageStatusPlayback, type PlaybackStepResult } from './combatPlayback';

const stats: DerivedStats = {
  life: 100, lifeMax: 100, mana: 20, manaMax: 20, attack: 10, defense: 0, magicResist: 0,
  attackSpeed: 100, critChance: 0, critDamage: 1.5, physDodge: 0, magicDodge: 0,
  magicFind: 0, goldFind: 0,
  resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
};
function unit(id: string, side: CombatUnit['side'] = 'enemy', fields: Partial<CombatUnit> = {}): CombatUnit {
  return { id, name: id, side, kind: side === 'enemy' ? 'monster' : 'hero', level: 1, tier: 'trash',
    stats: structuredClone(stats), life: 100, mana: 3, statuses: [], cooldowns: {}, skillOrder: [],
    activeBuffIds: [], enraged: false, summonedAdds: false, ...fields };
}
type Revive = Extract<BattleEvent, { kind: 'revive' }>;
function fixture() {
  const playerTeam = [unit('hero', 'player')];
  const enemyTeam = [unit('shaman'), unit('body', 'enemy', { life: 0 }), unit('tail')];
  const event: Revive = { kind: 'revive', source: 'shaman', target: 'body', unit: unit('body', 'enemy', {
    gridPosition: { row: 1, col: 0 }, cooldowns: { 'monster.fire_bolt': 3 },
    skillOrder: ['monster.fire_bolt'], activeBuffIds: [], enraged: true
  }) };
  return { playerTeam, enemyTeam, event };
}
function initialState(playerTeam: readonly CombatUnit[], enemyTeam: readonly CombatUnit[]): PlaybackStepResult {
  const prefix: RecordedBattleEvent[] = [...playerTeam, ...enemyTeam].map(u => ({
    kind: 'status-state', target: u.id, statuses: u.statuses, initial: true, simClockMs: 0, uiDelayMs: 0
  }));
  const statusPlayback = stageStatusPlayback(playerTeam, enemyTeam, prefix);
  if (!statusPlayback) throw new Error('Missing explicit initial status authority');
  return { playerTeam, enemyTeam, statusPlayback };
}
function step(state: PlaybackStepResult, event: BattleEvent) {
  return applyEventToTeams(state.playerTeam, state.enemyTeam, event, state.statusPlayback);
}

describe('BUG404 original-row resurrection playback', () => {
  it('replaces the known dead row in place, clears its latch, and accepts authoritative second-life statuses', () => {
    const f = fixture();
    const poisoned: ActiveStatus = { id: 'poison', sourceId: 'hero', stacks: 1, remaining: 5 };
    const living = f.enemyTeam.map(u => u.id === 'body' ? { ...u, life: 1, statuses: [poisoned] } : u);
    let state = initialState(f.playerTeam, living);
    state = step(state, { kind: 'death', target: 'body' });
    expect(state.statusPlayback?.deadIds).toContain('body');
    expect(state.enemyTeam[1]?.statuses).toEqual([]);
    state = step(state, { kind: 'status-state', target: 'body', statuses: [poisoned] });
    expect(state.enemyTeam[1]?.statuses).toEqual([]);
    state = step(state, f.event);
    expect(state.enemyTeam.map(u => u.id)).toEqual(['shaman', 'body', 'tail']);
    expect(state.enemyTeam[1]).toEqual(f.event.unit);
    expect(state.enemyTeam[0]).toBe(living[0]);
    expect(state.enemyTeam[2]).toBe(living[2]);
    expect(state.playerTeam).toBe(f.playerTeam);
    expect(state.statusPlayback?.deadIds).not.toContain('body');
    expect(state.statusPlayback?.byId.get('body')).toEqual([]);
    state = step(state, { kind: 'status-state', target: 'body', statuses: [] });
    const chilled: ActiveStatus = { id: 'chill', sourceId: 'hero', stacks: 1, remaining: 2 };
    state = step(state, { kind: 'status-state', target: 'body', statuses: [chilled] });
    expect(state.enemyTeam[1]?.statuses).toEqual([chilled]);
    state = step(state, { kind: 'death', target: 'body' });
    expect(state.enemyTeam[1]).toMatchObject({ life: 0, statuses: [] });
    expect(state.statusPlayback?.deadIds.filter(id => id === 'body')).toEqual(['body']);
  });

  it.each([false, true])('owns nested restored DTOs with authoritative statuses=%s', authoritative => {
    const f = fixture();
    const before = structuredClone(f.event);
    const state = authoritative ? initialState(f.playerTeam, f.enemyTeam) : f;
    const result = applyEventToTeams(state.playerTeam, state.enemyTeam, f.event,
      'statusPlayback' in state ? state.statusPlayback : null);
    const restored = result.enemyTeam[1];
    if (!restored) throw new Error('Missing restored row');
    expect(restored).toEqual(before.unit);
    expect(restored).not.toBe(f.event.unit);
    expect(restored.stats).not.toBe(f.event.unit.stats);
    expect(restored.stats.resistances).not.toBe(f.event.unit.stats.resistances);
    expect(restored.gridPosition).not.toBe(f.event.unit.gridPosition);
    expect(restored.cooldowns).not.toBe(f.event.unit.cooldowns);
    expect(restored.skillOrder).not.toBe(f.event.unit.skillOrder);
    Reflect.set(f.event.unit.stats.resistances, 'fire', 77);
    Reflect.set(f.event.unit.cooldowns, 'monster.fire_bolt', 99);
    expect(restored).toEqual(before.unit);
    Reflect.set(restored.stats.resistances, 'cold', 33);
    expect(f.event.unit.stats.resistances.cold).toBe(0);
  });

  const invalid: readonly (readonly [string, (f: ReturnType<typeof fixture>) => ReturnType<typeof fixture>])[] = [
    ['unknown target', f => ({ ...f, event: { ...f.event, target: 'unknown', unit: { ...f.event.unit, id: 'unknown' } } })],
    ['mismatched payload ID', f => ({ ...f, event: { ...f.event, unit: { ...f.event.unit, id: 'other' } } })],
    ['player payload', f => ({ ...f, event: { ...f.event, unit: { ...f.event.unit, side: 'player' } } })],
    ['nonmonster payload', f => ({ ...f, event: { ...f.event, unit: { ...f.event.unit, kind: 'summon' } } })],
    ['alive target', f => ({ ...f, enemyTeam: f.enemyTeam.map(u => u.id === 'body' ? { ...u, life: 1 } : u) })],
    ['nonmonster target', f => ({ ...f, enemyTeam: f.enemyTeam.map(u => u.id === 'body' ? { ...u, kind: 'hero' } : u) })],
    ['player target', f => ({ ...f, enemyTeam: f.enemyTeam.map(u => u.id === 'body' ? { ...u, side: 'player' } : u) })],
    ['unknown source', f => ({ ...f, event: { ...f.event, source: 'unknown' } })],
    ['dead source', f => ({ ...f, enemyTeam: f.enemyTeam.map(u => u.id === 'shaman' ? { ...u, life: 0 } : u) })],
    ['player source', f => ({ ...f, enemyTeam: f.enemyTeam.map(u => u.id === 'shaman' ? { ...u, side: 'player' } : u) })],
    ['self source', f => ({ ...f, event: { ...f.event, source: 'body' } })],
    ...[0, -1, NaN, Infinity, 101].map(life => [`invalid HP ${String(life)}`,
      (f: ReturnType<typeof fixture>) => ({ ...f, event: { ...f.event, unit: { ...f.event.unit, life } } })] as const),
    ['nonfinite capacity', f => ({ ...f, event: { ...f.event,
      unit: { ...f.event.unit, stats: { ...f.event.unit.stats, lifeMax: NaN } } } })]
  ];
  it.each(invalid)('keeps %s inert without adding rows or clearing authority', (_label, change) => {
    const f = change(fixture());
    const state = initialState(f.playerTeam, f.enemyTeam);
    const result = step(state, f.event);
    expect(result.playerTeam).toBe(state.playerTeam);
    expect(result.enemyTeam).toBe(state.enemyTeam);
    expect(result.statusPlayback).toBe(state.statusPlayback);
  });
});
