import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { runBattle, runBattleRecorded, type CombatSnapshot } from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-hold',
  stacks: 1,
  remaining: -1,
  appliedAtMs: at
});
function fixture(rank = 1, seed = 7) {
  const native = playerToCombatUnit({
    ...createMockPlayer('Synthetic cone', 'assassin'),
    id: 'hero',
    level: 30,
    skillLevels: { 'skills-assassin-blade-sentinel': 1, 'skills-assassin-blade-fury': rank },
    comboOrder: ['skills-assassin-blade-fury']
  });
  const hero: CombatUnit = {
    ...native,
    life: 2000,
    mana: 100,
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    statuses: [hold(1701)],
    stats: {
      ...native.stats,
      lifeMax: 2000,
      manaMax: 100,
      attack: 100,
      attackSpeed: 100,
      defense: 0,
      magicResist: 0,
      physDodge: 0,
      magicDodge: 0,
      critChance: 0,
      critDamage: 2,
      resistances: { fire: 0, cold: 0, lightning: 0, physical: 0, arcane: 0, poison: 0 }
    }
  };
  return {
    seed,
    playerTeam: [hero],
    enemyTeam: Array.from(
      { length: 9 },
      (_, i): CombatUnit => ({
        ...hero,
        id: 'target-' + String(i),
        side: 'enemy',
        kind: 'monster',
        tier: 'trash',
        gridPosition: { row: Math.floor(i / 3), col: i % 3 },
        mana: 0,
        skillOrder: [],
        skillLevels: {},
        activeBuffIds: [],
        statuses: [hold()]
      })
    )
  } satisfies CombatSnapshot;
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input),
    out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  return out;
}
const expectedTargets = ['target-1', 'target-3', 'target-4', 'target-5'];
beforeEach(() => {
  useInventoryStore.getState().reset();
  useMapStore.getState().reset();
  useFormationStore.getState().reset();
  resetRegistry();
  loadDefaultSkills();
});
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

for (const rank of [1, 2, 20]) {
  it.each([7, 19, 41, 97])(
    `BUG209 rank${String(rank)} seed%i uses the real cone and conserves every target's HP`,
    (seed) => {
      const input = fixture(rank, seed),
        out = record(input);
      const hits = out.events.filter((e) => e.kind === 'damage').filter((e) => e.source === 'hero');
      expect(hits.map((e) => e.target)).toEqual(expectedTargets);
      expect(out.events.filter((e) => e.kind === 'action')).toEqual([
        expect.objectContaining({ actor: 'hero', skillId: 'assassin.blade_fury', simClockMs: 1700 })
      ]);
      expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([
        expect.objectContaining({ target: 'hero', mana: 85 })
      ]);
      for (const target of out.result.enemyTeam) {
        const direct = hits.filter((e) => e.target === target.id).reduce((n, e) => n + e.amount, 0);
        const periodic = out.events.reduce(
          (n, e) => n + (e.kind === 'dot' && e.target === target.id ? e.amount : 0),
          0
        );
        expect(periodic).toBe(0);
        expect(target.life).toBe(2000 - direct - periodic);
        if (!expectedTargets.includes(target.id)) expect(target.life).toBe(2000);
      }
      if (seed === 7) {
        const growth = 4 * (rank - 1);
        expect(hits.map((e) => e.amount)).toEqual([41, 50, 45, 45].map((n) => n + growth));
      }
    }
  );
}

it('keeps all duplicate occupants of the four cone cells eligible', () => {
  const input = fixture();
  const middle = input.enemyTeam[4];
  if (!middle) throw new Error('Missing duplicate-cell target');
  input.enemyTeam.push({ ...middle, id: 'duplicate' });
  expect(record(input).events.filter(e => e.kind === 'damage').map(e => e.target))
    .toEqual(['target-1', 'target-3', 'target-4', 'duplicate', 'target-5']);
});
it('uses native default positions when explicit coordinates are absent', () => {
  const input = fixture();
  input.enemyTeam = input.enemyTeam.map(({ gridPosition: _grid, ...rest }) => rest);
  expect(record(input).events.filter(e => e.kind === 'damage').map(e => e.target))
    .toEqual(['target-1', 'target-2', 'target-0', 'target-3']);
});
it('retains ordinary Physical resistance without Fire or periodic damage', () => {
  const input = fixture();
  input.enemyTeam = input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats,
    magicResist: 999, resistances: { ...u.stats.resistances, physical: 50 } } }));
  const out = record(input);
  expect(out.events.filter(e => e.kind === 'damage').map(e => e.amount)).toEqual([20, 25, 22, 22]);
  expect(out.events.filter(e => e.kind === 'dot')).toEqual([]);
});
it('stops subsequent targets when Physical reflection kills the caster', () => {
  const input = fixture();
  input.playerTeam = input.playerTeam.map(u => ({ ...u, life: 1 }));
  input.enemyTeam = input.enemyTeam.map(u => ({ ...u, physicalReflectionPct: 1 }));
  const out = record(input);
  expect(out.events.filter(e => e.kind === 'damage').filter(e => e.source === 'hero').map(e => e.target))
    .toEqual(['target-1']);
  expect(out.result.playerTeam[0]?.life).toBe(0);
  expect(out.events.filter(e => e.kind === 'death' && e.target === 'hero')).toHaveLength(1);
});
it('settles lethal targets once and leaves outside-cone targets intact', () => {
  const input = fixture();
  input.enemyTeam = input.enemyTeam.map(u => expectedTargets.includes(u.id) ? { ...u, life: 1 } : u);
  const out = record(input);
  expect(out.events.filter(e => e.kind === 'death').map(e => e.target)).toEqual(expectedTargets);
  expect(out.events.filter(e => e.kind === 'dot')).toEqual([]);
  for (const target of out.result.enemyTeam)
    expect(target.life).toBe(expectedTargets.includes(target.id) ? 0 : 2000);
});
it('pays once when every selected target dodges', () => {
  // Seed2 has four hit draws above the ordinary 5% minimum hit floor.
  const input = fixture(1, 2);
  input.enemyTeam = input.enemyTeam.map(u => ({ ...u, stats: { ...u.stats, physDodge: 1 } }));
  const out = record(input);
  expect(out.events.filter(e => e.kind === 'damage').map(e =>
    ({ target: e.target, amount: e.amount, dodged: e.dodged, damageType: e.damageType })))
    .toEqual(expectedTargets.map(target =>
      ({ target, amount: 0, dodged: true, damageType: 'physical' })));
  expect(out.events.filter(e => e.kind === 'mana' && e.reason === 'cast'))
    .toEqual([expect.objectContaining({ target: 'hero', mana: 85 })]);
  expect(out.result.enemyTeam.every(u => u.life === 2000)).toBe(true);
});
it('refuses the active cast below its mana cost', () => {
  const input = fixture();
  input.playerTeam = input.playerTeam.map(u => ({ ...u, mana: 14 }));
  expect(record(input).events.filter(e => e.kind === 'action' && e.skillId === 'assassin.blade_fury')).toEqual([]);
});
it.each([
  { level: 17, skillLevels: { 'skills-assassin-blade-sentinel': 1, 'skills-assassin-blade-fury': 1 } },
  { level: 30, skillLevels: { 'skills-assassin-blade-fury': 1 } }
])('rejects ineligible native learning configurations %j', patch => {
  const unit = playerToCombatUnit({ ...createMockPlayer('Invalid Fury', 'assassin'), ...patch,
    comboOrder: ['skills-assassin-blade-fury'] });
  expect(unit.skillOrder).not.toContain('assassin.blade_fury');
});
