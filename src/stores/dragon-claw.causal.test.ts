import { afterEach, beforeEach, expect, it } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import {
  runBattle,
  runBattleRecorded,
  type CombatSnapshot,
  type RecordedBattleEvent
} from '@/engine/combat/combat';
import type { ActiveStatus, CombatUnit } from '@/engine/combat/types';
import {
  getSkill,
  registerSkill,
  loadDefaultSkills,
  resetRegistry
} from '@/engine/skills/registry';
import { playerToCombatUnit } from './combatHelpers';
import { useInventoryStore } from './inventoryStore';
import { useMapStore } from './mapStore';
import { useFormationStore } from './formationStore';

const ID = 'skills-assassin-dragon-claw',
  CANONICAL = 'assassin.dragon_claw';
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
    ...createMockPlayer('Synthetic Dragon Claw', 'assassin'),
    id: 'hero',
    level: 30,
    comboOrder: [ID],
    skillLevels: { 'assassin.dragon_talon': 1, [CANONICAL]: rank }
  });
  const hero: CombatUnit = {
    ...native,
    life: 2000,
    mana: 20,
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
  'BUG208 native rank%i settles two independent claw attempts with one payment',
  (rank) => {
    const out = record(fixture(rank)),
      hits = out.events.filter((e) => e.kind === 'damage');
    const expected = [71, 86].map((n) => n + 7 * (rank - 1));
    expect(hits.map((e) => e.amount)).toEqual(expected);
    expect(
      hits.every((e) => e.source === 'hero' && e.target === 'target' && e.simClockMs === 1700)
    ).toBe(true);
    expect(out.result.enemyTeam[0]?.life).toBe(2000 - expected.reduce((a, b) => a + b, 0));
    expect(out.events.filter((e) => e.kind === 'action')).toEqual([
      expect.objectContaining({ actor: 'hero', skillId: CANONICAL })
    ]);
    expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    expect(out.result.playerTeam[0]?.mana).toBe(0);
  }
);
it.each([7, 19, 41, 97])('seed%i consumes exactly two attempts including misses', (seed) => {
  const out = record(fixture(1, seed)),
    hits = out.events.filter((e) => e.kind === 'damage');
  expect(hits).toHaveLength(2);
  expect(out.result.enemyTeam[0]?.life).toBe(2000 - hits.reduce((n, e) => n + e.amount, 0));
  if (seed === 41) expect(hits[0]).toMatchObject({ amount: 0, dodged: true });
  expect(out.events.filter((e) => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
});
it('retains its original target and stops on its death without duplicate corpse/orb settlement', () => {
  const input = fixture(),
    target = input.enemyTeam[0];
  if (!target) throw new Error('Missing target');
  const out = record({
    ...input,
    corpseExplosion: [{ sourceHeroId: 'hero', rank: 1 }],
    enemyTeam: [
      { ...target, id: 'dead', life: 0 },
      { ...target, life: 1, tier: 'boss' },
      { ...target, id: 'other' }
    ]
  });
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => e.target)).toEqual(['target']);
  expect(out.result.enemyTeam.map((u) => u.life)).toEqual([0, 0, 2000]);
  expect(out.events.filter((e) => e.kind === 'death')).toEqual([
    expect.objectContaining({ target: 'target' })
  ]);
  expect(out.events.filter((e) => e.kind === 'orb').map((e) => e.orb.kind)).toEqual(['hp', 'mp']);
  expect(
    out.events.filter((e) => e.kind === 'message' && e.messageKey === 'combat:corpses.available')
  ).toEqual([expect.objectContaining({ params: { count: 1 } })]);
});
it('uses the same original living target for both attempts', () => {
  const input = fixture(),
    target = input.enemyTeam[0];
  if (!target) throw new Error('Missing target');
  const out = record({ ...input, enemyTeam: [target, { ...target, id: 'other' }] });
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => e.target)).toEqual([
    'target',
    'target'
  ]);
  expect(out.result.enemyTeam[1]?.life).toBe(2000);
});
it('stops after lethal reflection instead of landing a posthumous second hit', () => {
  const input = fixture(),
    out = record({
      ...input,
      playerTeam: input.playerTeam.map((u) => ({ ...u, life: 20 })),
      enemyTeam: input.enemyTeam.map((u) => ({ ...u, physicalReflectionPct: 1 }))
    });
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => [e.source, e.amount])).toEqual([
    ['hero', 71],
    ['target', 71]
  ]);
  expect(out.result.playerTeam[0]?.life).toBe(0);
  expect(out.result.enemyTeam[0]?.life).toBe(1929);
  expect(out.events.filter((e) => e.kind === 'death')).toEqual([
    expect.objectContaining({ target: 'hero' })
  ]);
});
it('depletes reflected personal absorption between attempts without copying the first absorption', () => {
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
            boneArmor: { rank: 20, remaining: 80 }
          }
        ]
      })),
      enemyTeam: input.enemyTeam.map((u) => ({ ...u, physicalReflectionPct: 1 }))
    });
  const reflected = out.events.filter(
    (e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
      e.kind === 'damage' && e.source === 'target'
  );
  expect(reflected.map((e) => [e.amount, e.absorbed ?? 0])).toEqual([
    [0, 71],
    [77, 9]
  ]);
  expect(out.result.playerTeam[0]?.life).toBe(1923);
});
it('keeps ordinary Defense/resistance/combo per attempt and never scales from weapon Attack', () => {
  const input = fixture(),
    out = record({
      ...input,
      playerTeam: input.playerTeam.map((u) => ({ ...u, stats: { ...u.stats, attack: 999999 } })),
      enemyTeam: input.enemyTeam.map((u) => ({
        ...u,
        stats: { ...u.stats, defense: 10, resistances: { ...u.stats.resistances, physical: 50 } },
        statuses: [
          ...u.statuses,
          {
            id: 'bleed',
            sourceId: 'prior',
            stacks: 1,
            remaining: 3,
            appliedAtMs: 0,
            expiresAtMs: 3000
          }
        ]
      }))
    });
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => e.amount)).toEqual([29, 37]);
  expect(out.result.enemyTeam[0]?.life).toBe(1934);
});
it('adds the authored bonus to native crit chance independently for each attempt', () => {
  const input = fixture(),
    out = record({
      ...input,
      playerTeam: input.playerTeam.map((u) => ({ ...u, stats: { ...u.stats, critChance: 0.4 } }))
    });
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => [e.crit, e.amount])).toEqual([
    [false, 71],
    [true, 172]
  ]);
  expect(out.result.enemyTeam[0]?.life).toBe(1757);
});
it('demonstrates extra actual critical HP loss against the identical bonus-off control', () => {
  const actual = getSkill(ID);
  if (!actual) throw new Error('Missing registered Dragon Claw');
  const enabled = record(fixture(1, 6));
  registerSkill({
    ...actual,
    effects: actual.effects.map((e) => {
      if (e.kind !== 'damage') return e;
      const control = { ...e };
      Reflect.deleteProperty(control, 'critChanceBonus');
      return control;
    })
  });
  const control = record(fixture(1, 6));
  const damage = (out: ReturnType<typeof record>) => out.events.filter((e) => e.kind === 'damage');
  expect(damage(enabled).map((e) => e.dodged)).toEqual(damage(control).map((e) => e.dodged));
  expect(damage(enabled).filter((e) => e.crit).length).toBeGreaterThan(
    damage(control).filter((e) => e.crit).length
  );
  expect(enabled.result.enemyTeam[0]?.life).toBeLessThan(control.result.enemyTeam[0]?.life ?? 0);
  expect(enabled.result.playerTeam[0]?.stats).toEqual(control.result.playerTeam[0]?.stats);
});
it('preserves ordinary critical overflow rather than clamping away the excess bonus', () => {
  const input = fixture(),
    out = record({
      ...input,
      playerTeam: input.playerTeam.map((u) => ({ ...u, stats: { ...u.stats, critChance: 1 } }))
    });
  expect(out.events.filter((e) => e.kind === 'damage').map((e) => [e.crit, e.amount])).toEqual([
    [true, 145],
    [true, 176]
  ]);
  expect(out.result.enemyTeam[0]?.life).toBe(1679);
  expect(out.result.playerTeam[0]?.stats.critChance).toBe(1);
});
it.each(['mana', 'cooldown'] as const)(
  'refuses the entire pair for %s and leaves basic attacks without the bonus',
  (failure) => {
    const input = fixture(),
      out = record({
        ...input,
        playerTeam: input.playerTeam.map((u) => ({
          ...u,
          mana: failure === 'mana' ? 19 : 20,
          cooldowns: failure === 'cooldown' ? { [CANONICAL]: 10000 } : {}
        }))
      });
    expect(out.events.filter((e) => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: null })
    ]);
    expect(out.events.filter((e) => e.kind === 'damage')).toHaveLength(1);
    expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([]);
    expect(out.result.playerTeam[0]?.mana).toBe(failure === 'mana' ? 19 : 20);
  }
);
it('pays once at each exact one-second cooldown boundary', () => {
  const input = fixture(),
    out = record({
      ...input,
      playerTeam: input.playerTeam.map((u) => ({
        ...u,
        mana: 40,
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
  expect(out.events.filter((e) => e.kind === 'damage')).toHaveLength(4);
  expect(out.result.playerTeam[0]?.mana).toBe(0);
});
it.each(['class', 'unlock', 'rank'] as const)(
  'native %s refusal cannot grant the pair or bonus',
  (failure) => {
    const native = playerToCombatUnit({
      ...createMockPlayer('Synthetic refusal', failure === 'class' ? 'sorceress' : 'assassin'),
      level: failure === 'unlock' ? 5 : 30,
      comboOrder: [ID],
      skillLevels: { 'assassin.dragon_talon': 1, [CANONICAL]: failure === 'rank' ? 0 : 1 }
    });
    expect(native.skillOrder).not.toContain(ID);
  }
);
it('resolves legal aliases by MAX while preserving captured allocation and replay', () => {
  const player = {
    ...createMockPlayer('Synthetic aliases', 'assassin'),
    level: 30,
    comboOrder: [ID],
    skillLevels: { 'assassin.dragon_talon': 1, [ID]: 20, [CANONICAL]: 2 }
  };
  const native = playerToCombatUnit(player),
    before = structuredClone(native);
  expect(native.skillLevels?.[CANONICAL]).toBe(20);
  expect(
    playerToCombatUnit({ ...player, skillLevels: { 'assassin.dragon_talon': 1, [CANONICAL]: 1 } })
      .skillLevels?.[CANONICAL]
  ).toBe(1);
  expect(native).toEqual(before);
  expect(
    playerToCombatUnit({
      ...player,
      skillLevels: { 'assassin.dragon_talon': 1, [ID]: 99, [CANONICAL]: 2 }
    }).skillLevels?.[CANONICAL]
  ).toBe(2);
});

it('adds eligible allied Heart critical chance to the local bonus without altering snapshots', () => {
  const input = fixture(),
    actor = input.playerTeam[0];
  if (!actor) throw new Error('Missing claw actor');
  // Standalone engine party projection: an eligible hero owner and designated merc recipient.
  const source = { ...actor, id: 'druid-source', skillOrder: [], statuses: [hold()] };
  const snapshot = {
    ...input,
    playerTeam: [
      source,
      { ...actor, kind: 'merc' as const, stats: { ...actor.stats, critChance: 0.3 } }
    ],
    druidAllyAuras: {
      sourceHeroId: source.id,
      fieldedMercCombatId: actor.id,
      oakRank: 1,
      heartRank: 20
    }
  };
  const controlInput = { ...snapshot };
  Reflect.deleteProperty(controlInput, 'druidAllyAuras');
  const enabled = record(snapshot), control = record(controlInput);
  const hits = (out: ReturnType<typeof record>) =>
    out.events.filter(
      (e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
        e.kind === 'damage' && e.source === 'hero'
    );
  expect(hits(enabled).map((e) => [e.crit, e.amount])).toEqual([
    [false, 71],
    [true, 172]
  ]);
  expect(hits(control).map((e) => [e.crit, e.amount])).toEqual([
    [false, 71],
    [false, 86]
  ]);
  expect(enabled.result.playerTeam.find((u) => u.id === 'hero')?.stats.critChance).toBe(0.3);
});
it('depletes target absorption between the two original-target attempts', () => {
  const input = fixture(),
    hero = input.playerTeam[0],
    target = input.enemyTeam[0];
  if (!hero || !target) throw new Error('Missing reversed absorption fixture');
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
            boneArmor: { rank: 20, remaining: 80 }
          }
        ]
      }
    ],
    enemyTeam: [{ ...hero, side: 'enemy', kind: 'monster' }]
  });
  expect(
    out.events.filter((e) => e.kind === 'damage').map((e) => [e.amount, e.absorbed ?? 0])
  ).toEqual([
    [0, 71],
    [77, 9]
  ]);
  expect(out.result.playerTeam[0]?.life).toBe(1923);
});
