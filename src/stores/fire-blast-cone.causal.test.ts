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
    skillLevels: { 'skills-assassin-fire-blast': rank },
    comboOrder: ['skills-assassin-fire-blast']
  });
  const hero: CombatUnit = {
    ...native,
    life: 2000,
    mana: 25,
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
    `BUG207 rank${String(rank)} seed%i uses the real cone and conserves every target's HP`,
    (seed) => {
      const input = fixture(rank, seed),
        out = record(input);
      const hits = out.events.filter((e) => e.kind === 'damage').filter((e) => e.source === 'hero');
      expect(hits.map((e) => e.target)).toEqual(expectedTargets);
      expect(out.events.filter((e) => e.kind === 'action')).toEqual([
        expect.objectContaining({ actor: 'hero', skillId: 'assassin.fire_blast', simClockMs: 1700 })
      ]);
      expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([
        expect.objectContaining({ target: 'hero', mana: 0 })
      ]);
      for (const target of out.result.enemyTeam) {
        const direct = hits.filter((e) => e.target === target.id).reduce((n, e) => n + e.amount, 0);
        const periodic = out.events.reduce(
          (n, e) => n + (e.kind === 'dot' && e.target === target.id ? e.amount : 0),
          0
        );
        expect(periodic).toBe(direct > 0 ? 3 * Math.max(1, Math.floor(direct * 0.1)) : 0);
        expect(target.life).toBe(2000 - direct - periodic);
        if (!expectedTargets.includes(target.id)) expect(target.life).toBe(2000);
      }
      if (seed === 7) {
        const growth = 5 * (rank - 1);
        expect(hits.map((e) => e.amount)).toEqual([51, 58, 65, 60].map((n) => n + growth));
      }
    }
  );
}
it('uses deterministic default positions when native opponents omit coordinates', () => {
  const input = fixture();
  input.enemyTeam = input.enemyTeam.map(({ gridPosition: _grid, ...rest }) => rest);
  const out = record(input);
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => e.target)).toEqual([
    'target-1',
    'target-2',
    'target-0',
    'target-3'
  ]);
});
it('does not count dead targets or friendly units when choosing the occupied apex', () => {
  const input = fixture(),
    hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing native caster');
  input.enemyTeam = input.enemyTeam.map((u) => (u.id === 'target-1' ? { ...u, life: 0 } : u));
  input.playerTeam = [
    hero,
    { ...hero, id: 'ally', skillOrder: [], statuses: [hold()], gridPosition: { row: 0, col: 1 } }
  ];
  const out = record(input);
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => e.target)).toEqual([
    'target-4',
    'target-6',
    'target-7',
    'target-8'
  ]);
  expect(out.result.playerTeam.find((u) => u.id === 'ally')?.life).toBe(2000);
});
it('does not cap multiple living occupants of a covered cell at four enemies', () => {
  const input = fixture(),
    middle = input.enemyTeam[4];
  if (!middle) throw new Error('Missing duplicate-cell target');
  input.enemyTeam = [...input.enemyTeam, { ...middle, id: 'duplicate' }];
  expect(
    record(input)
      .events.filter((e) => e.kind === 'damage')
      .map((e) => e.target)
  ).toEqual(['target-1', 'target-3', 'target-4', 'duplicate', 'target-5']);
});
it('retains separate Fire mitigation and damaging Burn on each covered target', () => {
  const input = fixture();
  input.enemyTeam = input.enemyTeam.map((u) => ({
    ...u,
    stats: { ...u.stats, magicResist: 999, resistances: { ...u.stats.resistances, fire: 50 } }
  }));
  const out = record(input);
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => e.amount)).toEqual([
    25, 29, 32, 30
  ]);
  expect(out.events.filter((e) => e.kind === 'dot').reduce((n, e) => n + e.amount, 0)).toBe(30);
});
it('settles each lethal cone hit once and produces no periodic damage on its dead target', () => {
  const input = fixture();
  input.enemyTeam = input.enemyTeam.map((u) =>
    expectedTargets.includes(u.id) ? { ...u, life: 1 } : u
  );
  const out = record(input);
  expect(out.events.filter((e) => e.kind === 'death').map((e) => e.target)).toEqual(
    expectedTargets
  );
  expect(out.events.filter((e) => e.kind === 'dot')).toEqual([]);
  for (const target of out.result.enemyTeam)
    expect(target.life).toBe(expectedTargets.includes(target.id) ? 0 : 2000);
});
it('keeps Fire outside physical reflection and rolls criticals per covered target', () => {
  const input = fixture();
  input.playerTeam = input.playerTeam.map((u) => ({ ...u, stats: { ...u.stats, critChance: 1 } }));
  input.enemyTeam = input.enemyTeam.map((u) => ({ ...u, physicalReflectionPct: 10 }));
  const out = record(input),
    hits = out.events.filter((e) => e.kind === 'damage');
  expect(hits.map((e) => [e.target, e.amount, e.crit])).toEqual([
    ['target-1', 102, true],
    ['target-3', 116, true],
    ['target-4', 130, true],
    ['target-5', 120, true]
  ]);
  expect(out.result.playerTeam[0]?.life).toBe(2000);
});
it('captures mitigated Fire Burn before one finite player shield absorbs the first hit', () => {
  const input = fixture(),
    caster = input.playerTeam[0];
  if (!caster) throw new Error('Missing pure-engine reversed caster');
  // Pure-engine reversal checks shield eligibility; no native enemy learning is claimed.
  const targets = input.enemyTeam.map((u) => ({
    ...u,
    side: 'player' as const,
    kind: 'hero' as const,
    ...(u.id === 'target-1'
      ? {
          statuses: [
            hold(),
            {
              id: 'bone-armor',
              sourceId: u.id,
              remaining: -1,
              stacks: 1,
              boneArmor: { rank: 20, remaining: 40 }
            } satisfies ActiveStatus
          ]
        }
      : {})
  }));
  const out = record({
    ...input,
    playerTeam: targets,
    enemyTeam: [{ ...caster, side: 'enemy', kind: 'monster' }]
  });
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => e.amount)).toEqual([
    11, 58, 65, 60
  ]);
  expect(
    out.events
      .filter((e) => e.kind === 'dot')
      .filter((e) => e.target === 'target-1')
      .reduce((n, e) => n + e.amount, 0)
  ).toBe(15);
  expect(out.result.playerTeam.find((u) => u.id === 'target-1')?.life).toBe(1974);
});
