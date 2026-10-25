import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import {
  runBattle,
  runBattleRecorded,
  type CombatSnapshot,
  type RecordedBattleEvent
} from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const ID = 'skills-assassin-dragon-talon',
  CANONICAL = 'assassin.dragon_talon';
const hold = (appliedAtMs = 0, expiresAtMs?: number): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-hold',
  stacks: 1,
  remaining: -1,
  appliedAtMs,
  ...(expiresAtMs === undefined ? {} : { expiresAtMs })
});
function fixture(rank = 1, seed = 7): CombatSnapshot {
  const native = playerToCombatUnit({
    ...createMockPlayer('Synthetic Dragon Talon', 'assassin'),
    id: 'hero',
    level: 30,
    comboOrder: [ID],
    skillLevels: { [CANONICAL]: rank }
  });
  const hero: CombatUnit = {
    ...native,
    life: 2000,
    mana: 4,
    manaRegenPerSecond: 0,
    manaRegenBaselinePerSecond: 0,
    statuses: [hold(1701)],
    stats: {
      ...native.stats,
      lifeMax: 2000,
      manaMax: 100,
      attackSpeed: 100,
      attack: 100,
      defense: 0,
      magicResist: 0,
      physDodge: 0,
      magicDodge: 0,
      critChance: 0,
      critDamage: 2,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    }
  };
  const target: CombatUnit = {
    id: 'target',
    name: 'Synthetic target',
    side: 'enemy',
    kind: 'monster',
    tier: 'trash',
    level: 30,
    life: 2000,
    mana: 0,
    stats: { ...hero.stats },
    cooldowns: {},
    activeBuffIds: [],
    skillOrder: [],
    statuses: [hold()],
    enraged: false
  };
  return { seed, playerTeam: [hero], enemyTeam: [target] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input),
    out = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(runBattle(input)).toEqual(out.result);
  return out;
}
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

it.each([1, 2, 20])(
  'BUG204 native rank%i settles three independent Dragon Talon hits with one paid action',
  (rank) => {
    const out = record(fixture(rank)),
      damage = [41, 50, 45].map((n) => n + 4 * (rank - 1));
    const hits = out.events.filter((e) => e.kind === 'damage');
    expect(hits.map((e) => e.amount)).toEqual(damage);
    expect(
      hits.every(
        (e) =>
          e.source === 'hero' &&
          e.target === 'target' &&
          e.simClockMs === 1700 &&
          !e.crit &&
          !e.dodged
      )
    ).toBe(true);
    expect(out.result.enemyTeam[0]?.life).toBe(2000 - damage.reduce((sum, n) => sum + n, 0));
    expect(out.events.filter((e) => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: CANONICAL, simClockMs: 1700 })
    ]);
    expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    expect(out.result.playerTeam[0]?.mana).toBe(0);
  }
);
it.each([7, 19, 41, 97])(
  'native seed%i makes three attempts, including independent misses',
  (seed) => {
    const out = record(fixture(1, seed)),
      hits = out.events.filter((e) => e.kind === 'damage');
    expect(hits).toHaveLength(3);
    expect(out.result.enemyTeam[0]?.life).toBe(2000 - hits.reduce((sum, e) => sum + e.amount, 0));
    if (seed === 41) expect(hits[0]).toMatchObject({ amount: 0, dodged: true });
    expect(out.events.filter((e) => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
  }
);
it('retains only its original single living target for all attempts', () => {
  const input = fixture(),
    target = input.enemyTeam[0];
  if (!target) throw new Error('Missing target');
  const out = record({
    ...input,
    enemyTeam: [{ ...target, id: 'dead', life: 0 }, target, { ...target, id: 'other' }]
  });
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => e.target)).toEqual([
    'target',
    'target',
    'target'
  ]);
  expect(out.result.enemyTeam.find((u) => u.id === 'other')?.life).toBe(2000);
});
it('stops at original target death and settles exactly one corpse and one pair of guaranteed orbs', () => {
  const input = fixture(),
    target = input.enemyTeam[0];
  if (!target) throw new Error('Missing target');
  // Engine-only corpse-consumer authority isolates shared settlement; not an Assassin allocation.
  const out = record({
    ...input,
    corpseExplosion: [{ sourceHeroId: 'hero', rank: 1 }],
    enemyTeam: [
      { ...target, life: 1, tier: 'boss' },
      { ...target, id: 'other' }
    ]
  });
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => e.target)).toEqual(['target']);
  expect(out.result.enemyTeam.map((u) => u.life)).toEqual([0, 2000]);
  expect(out.events.filter((e) => e.kind === 'death')).toEqual([
    expect.objectContaining({ target: 'target' })
  ]);
  expect(out.events.filter((e) => e.kind === 'orb').map((e) => e.orb.kind)).toEqual(['hp', 'mp']);
  expect(
    out.events.filter((e) => e.kind === 'message' && e.messageKey === 'combat:corpses.available')
  ).toEqual([expect.objectContaining({ params: { count: 1 } })]);
});
it('ends after one lethal reflection without performing remaining attempts', () => {
  const input = fixture(),
    out = record({
      ...input,
      playerTeam: input.playerTeam.map((u) => ({ ...u, life: 20 })),
      enemyTeam: input.enemyTeam.map((u) => ({ ...u, physicalReflectionPct: 1 }))
    });
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => [e.source, e.amount])).toEqual([
    ['hero', 41],
    ['target', 41]
  ]);
  expect(out.result.playerTeam[0]?.life).toBe(0);
  expect(out.result.enemyTeam[0]?.life).toBe(1959);
  expect(out.result.winner).toBe('enemy');
  expect(out.events.filter((e) => e.kind === 'death')).toEqual([
    expect.objectContaining({ target: 'hero' })
  ]);
});
it('exhausts a personal shield between independently reflected attempts', () => {
  const input = fixture(),
    out = record({
      ...input,
      playerTeam: input.playerTeam.map((u) => ({
        ...u,
        statuses: [
          ...u.statuses,
          {
            id: 'bone-armor',
            sourceId: u.id,
            stacks: 1,
            remaining: -1,
            boneArmor: { rank: 20, remaining: 50 }
          }
        ]
      })),
      enemyTeam: input.enemyTeam.map((u) => ({ ...u, physicalReflectionPct: 1 }))
    });
  expect(
    out.events
      .filter(
        (e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
          e.kind === 'damage' && e.source === 'hero'
      )
      .map((e) => e.amount)
  ).toEqual([41, 50, 45]);
  expect(
    out.events
      .filter(
        (e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
          e.kind === 'damage' && e.source === 'target'
      )
      .map((e) => [e.amount, e.absorbed ?? 0])
  ).toEqual([
    [0, 41],
    [41, 9],
    [45, 0]
  ]);
  expect(out.result.playerTeam[0]?.life).toBe(1914);
  expect(out.result.playerTeam[0]?.statuses.some((s) => s.id === 'bone-armor')).toBe(false);
});
it('rolls criticals independently instead of copying the first outcome', () => {
  const input = fixture(),
    out = record({
      ...input,
      playerTeam: input.playerTeam.map((u) => ({ ...u, stats: { ...u.stats, critChance: 0.5 } }))
    });
  const hits = out.events.filter((e) => e.kind === 'damage');
  expect(hits.map((e) => e.crit)).toEqual([false, true, false]);
  expect(hits.map((e) => e.amount)).toEqual([41, 100, 45]);
  expect(out.result.enemyTeam[0]?.life).toBe(1814);
});
it('settles ordinary Defense and resistance on every attempt without weapon Attack scaling', () => {
  const input = fixture(),
    out = record({
      ...input,
      playerTeam: input.playerTeam.map((u) => ({ ...u, stats: { ...u.stats, attack: 999999 } })),
      enemyTeam: input.enemyTeam.map((u) => ({
        ...u,
        stats: { ...u.stats, defense: 10, resistances: { ...u.stats.resistances, physical: 50 } }
      }))
    });
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => e.amount)).toEqual([10, 15, 12]);
  expect(out.result.enemyTeam[0]?.life).toBe(1963);
});
it('applies the ordinary existing Bleed combo separately to each attempt', () => {
  const input = fixture(),
    out = record({
      ...input,
      enemyTeam: input.enemyTeam.map((u) => ({
        ...u,
        statuses: [
          ...u.statuses,
          {
            id: 'bleed',
            sourceId: 'synthetic-prior',
            stacks: 1,
            remaining: 3,
            appliedAtMs: 0,
            expiresAtMs: 3000
          }
        ]
      }))
    });
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => e.amount)).toEqual([45, 55, 49]);
  expect(out.result.enemyTeam[0]?.life).toBe(1851);
  expect(out.events.filter((e) => e.kind === 'dot' || e.kind === 'status')).toEqual([]);
});
it('depletes the target personal shield before settling the remaining attempts', () => {
  const input = fixture(),
    hero = input.playerTeam[0],
    target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing reversed shield fixture');
  // Reversed pure-engine sides isolate an eligible shield, not an enemy-learned skill.
  const out = record({
    ...input,
    playerTeam: [
      {
        ...target,
        side: 'player',
        kind: 'hero',
        statuses: [
          hold(),
          {
            id: 'bone-armor',
            sourceId: target.id,
            stacks: 1,
            remaining: -1,
            boneArmor: { rank: 20, remaining: 50 }
          }
        ]
      }
    ],
    enemyTeam: [{ ...hero, side: 'enemy', kind: 'monster' }]
  });
  expect(
    out.events.filter((e) => e.kind === 'damage').map((e) => [e.amount, e.absorbed ?? 0])
  ).toEqual([
    [0, 41],
    [41, 9],
    [45, 0]
  ]);
  expect(out.result.playerTeam[0]?.life).toBe(1914);
  expect(out.result.playerTeam[0]?.statuses.some((s) => s.id === 'bone-armor')).toBe(false);
});
it.each(['mana', 'cooldown'] as const)(
  'refuses the entire sequence when %s is insufficient',
  (failure) => {
    const input = fixture(),
      out = record({
        ...input,
        playerTeam: input.playerTeam.map((u) => ({
          ...u,
          mana: failure === 'mana' ? 3 : 4,
          cooldowns: failure === 'cooldown' ? { [CANONICAL]: 10000 } : {}
        }))
      });
    expect(out.events.filter((e) => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: null })
    ]);
    expect(out.events.filter((e) => e.kind === 'damage')).toHaveLength(1);
    expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(out.result.playerTeam[0]?.mana).toBe(failure === 'mana' ? 3 : 4);
  }
);
it('uses one cooldown and payment at the exact one-second boundary', () => {
  const input = fixture(),
    out = record({
      ...input,
      playerTeam: input.playerTeam.map((u) => ({
        ...u,
        mana: 8,
        stats: { ...u.stats, attackSpeed: 250 },
        statuses: [hold(501, 1500), hold(1501)]
      }))
    });
  expect(
    out.events.filter((e) => e.kind === 'action').map((e) => [e.simClockMs, e.skillId])
  ).toEqual([
    [500, CANONICAL],
    [1500, CANONICAL]
  ]);
  expect(out.events.filter((e) => e.kind === 'damage')).toHaveLength(6);
  expect(
    out.events
      .filter(
        (e): e is Extract<RecordedBattleEvent, { kind: 'mana' }> =>
          e.kind === 'mana' && e.reason === 'cast'
      )
      .map((e) => [e.simClockMs, e.mana])
  ).toEqual([
    [500, 4],
    [1500, 0]
  ]);
});
it('cannot cast before the same cooldown boundary', () => {
  const input = fixture(),
    out = record({
      ...input,
      playerTeam: input.playerTeam.map((u) => ({
        ...u,
        mana: 8,
        stats: { ...u.stats, attackSpeed: 250 },
        statuses: [hold(1501)]
      }))
    });
  expect(
    out.events.filter((e) => e.kind === 'action').map((e) => [e.simClockMs, e.skillId])
  ).toEqual([
    [500, CANONICAL],
    [1000, null],
    [1500, CANONICAL]
  ]);
  expect(out.events.filter((e) => e.kind === 'damage')).toHaveLength(7);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
});
it.each(['class', 'unlock', 'rank'] as const)(
  'native %s refusal cannot grant a Dragon Talon sequence',
  (failure) => {
    const native = playerToCombatUnit({
      ...createMockPlayer('Synthetic refusal', failure === 'class' ? 'sorceress' : 'assassin'),
      level: failure === 'unlock' ? 0 : 30,
      comboOrder: [ID],
      skillLevels: { [CANONICAL]: failure === 'rank' ? 0 : 1 }
    });
    expect(native.skillOrder).not.toContain(ID);
    const input = fixture(),
      out = record({
        ...input,
        playerTeam: input.playerTeam.map((u) => ({ ...u, skillOrder: native.skillOrder }))
      });
    expect(out.events.filter((e) => e.kind === 'damage')).toHaveLength(1);
    expect(out.result.playerTeam[0]?.mana).toBe(4);
  }
);
it('resolves legal aliases by MAX without changing already captured allocation or replay', () => {
  const player = {
    ...createMockPlayer('Synthetic aliases', 'assassin'),
    level: 30,
    comboOrder: [ID],
    skillLevels: { [ID]: 20, [CANONICAL]: 2 }
  };
  const native = playerToCombatUnit(player),
    before = structuredClone(native);
  expect(native.skillLevels?.[CANONICAL]).toBe(20);
  const nativeLevels = native.skillLevels;
  if (!nativeLevels) throw new Error('Missing Dragon Talon allocation');
  const input = fixture(20),
    out = record({
      ...input,
      playerTeam: input.playerTeam.map((u) => ({ ...u, skillLevels: nativeLevels }))
    });
  expect(out).toEqual(record(input));
  expect(
    playerToCombatUnit({ ...player, skillLevels: { [CANONICAL]: 1 } }).skillLevels?.[CANONICAL]
  ).toBe(1);
  expect(native).toEqual(before);
  expect(
    playerToCombatUnit({ ...player, skillLevels: { [ID]: 99, [CANONICAL]: 2 } }).skillLevels?.[
      CANONICAL
    ]
  ).toBe(2);
});
