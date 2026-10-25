import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-hold',
  stacks: 1,
  remaining: -1,
  appliedAtMs: at
});
function fixture(rank = 1, targets = 1): CombatSnapshot {
  const hero: CombatUnit = {
    id: 'hero',
    name: 'Synthetic Fury',
    kind: 'hero',
    side: 'player',
    level: 30,
    tier: 'trash',
    life: 10000,
    mana: 11,
    stats: {
      life: 10000,
      lifeMax: 10000,
      mana: 100,
      manaMax: 100,
      attack: 1,
      defense: 0,
      magicResist: 0,
      attackSpeed: 100,
      critChance: 0,
      critDamage: 2,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    },
    statuses: [hold(1701)],
    cooldowns: {},
    skillOrder: ['druid.fury'],
    skillLevels: { 'druid.fury': rank },
    activeBuffIds: [],
    enraged: false
  };
  return {
    seed: 7,
    playerTeam: [hero],
    enemyTeam: Array.from(
      { length: targets },
      (_, i): CombatUnit => ({
        ...hero,
        id: 'target-' + String(i),
        side: 'enemy',
        kind: 'monster',
        mana: 0,
        statuses: [hold()],
        skillOrder: [],
        skillLevels: {}
      })
    )
  };
}
function patch(
  s: CombatSnapshot,
  hero: Partial<CombatUnit> = {},
  target: Partial<CombatUnit> = {}
): CombatSnapshot {
  return {
    ...s,
    playerTeam: s.playerTeam.map((u) => ({ ...u, ...hero })),
    enemyTeam: s.enemyTeam.map((u) => ({ ...u, ...target }))
  };
}
function hits(r: ReturnType<typeof runBattleRecorded>) {
  return r.events.filter(
    (e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
      e.kind === 'damage' && e.source === 'hero'
  );
}
beforeEach(loadDefaultSkills);
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

describe('BUG194 actual repeated Fury attacks', () => {
  it.each([
    [1, [97, 116, 104, 105, 116], 538],
    [2, [105, 124, 112, 113, 124], 578],
    [20, [249, 268, 256, 257, 268], 1298]
  ] as const)(
    'rank%i uses five independent ordinary rolls and actual HP loss',
    (rank, damage, total) => {
      const input = fixture(rank),
        before = structuredClone(input),
        r = runBattleRecorded(input);
      expect(hits(r).map((e) => e.amount)).toEqual(damage);
      expect(hits(r).every((e) => e.simClockMs === 1700 && !e.dodged && !e.crit)).toBe(true);
      expect(r.result.enemyTeam[0]?.life).toBe(10000 - total);
      expect(r.events.filter((e) => e.kind === 'action')).toEqual([
        expect.objectContaining({ actor: 'hero', skillId: 'druid.fury', simClockMs: 1700 })
      ]);
      expect(r.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
      expect(r.result.playerTeam[0]?.mana).toBe(0);
      expect(input).toEqual(before);
      expect(runBattleRecorded(input)).toEqual(r);
    }
  );
  it('rotates within the original first-two pool and leaves the third enemy untouched', () => {
    const r = runBattleRecorded(fixture(1, 3));
    expect(hits(r).map((e) => e.target)).toEqual([
      'target-0',
      'target-1',
      'target-0',
      'target-1',
      'target-0'
    ]);
    expect(r.result.enemyTeam.map((u) => u.life)).toEqual([9683, 9779, 10000]);
  });
  it('skips a killed original target and sends the remaining attempts to the original survivor', () => {
    const input = fixture(1, 3),
      first = input.enemyTeam[0];
    if (!first) throw new Error('Missing target');
    const r = runBattleRecorded({
      ...input,
      enemyTeam: [{ ...first, life: 1 }, ...input.enemyTeam.slice(1)]
    });
    expect(hits(r).map((e) => e.target)).toEqual([
      'target-0',
      'target-1',
      'target-1',
      'target-1',
      'target-1'
    ]);
    expect(r.result.enemyTeam[0]?.life).toBe(0);
    expect(r.result.enemyTeam[1]?.life).toBe(
      10000 -
        hits(r)
          .filter((e) => e.target === 'target-1')
          .reduce((n, e) => n + e.amount, 0)
    );
    expect(r.result.enemyTeam[2]?.life).toBe(10000);
  });
  it('ends after the original pool dies instead of acquiring a third target or attacking a corpse', () => {
    const r = runBattleRecorded(patch(fixture(1, 3), {}, { life: 1 }));
    expect(hits(r).map((e) => e.target)).toEqual(['target-0', 'target-1']);
    expect(r.result.enemyTeam.map((u) => u.life)).toEqual([0, 0, 1]);
  });
  it('stops immediately when ordinary reflection kills the actor', () => {
    const r = runBattleRecorded(patch(fixture(), { life: 50 }, { physicalReflectionPct: 1 }));
    expect(hits(r).map((e) => e.amount)).toEqual([97]);
    expect(r.result.playerTeam[0]?.life).toBe(0);
    expect(r.result.enemyTeam[0]?.life).toBe(9903);
    expect(r.result.winner).toBe('enemy');
  });
  it('settles and exhausts the current personal shield before the next reflected strike', () => {
    const input = fixture(),
      hero = input.playerTeam[0];
    if (!hero) throw new Error('Missing Fury hero');
    const shield: ActiveStatus = {
      id: 'bone-armor',
      sourceId: hero.id,
      stacks: 1,
      remaining: -1,
      boneArmor: { rank: 20, remaining: 240 }
    };
    const snapshot = patch(
      input,
      { statuses: [...hero.statuses, shield] },
      { physicalReflectionPct: 1 }
    );
    const before = structuredClone(snapshot),
      r = runBattleRecorded(snapshot);
    expect(hits(r).map((e) => e.amount)).toEqual([97, 116, 104, 105, 116]);
    const reflected = r.events.filter(
      (e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> =>
        e.kind === 'damage' && e.damageType === 'thorns' && e.target === hero.id
    );
    expect(reflected.map((e) => [e.amount, e.absorbed ?? 0])).toEqual([
      [0, 97],
      [0, 116],
      [77, 27],
      [105, 0],
      [116, 0]
    ]);
    expect(r.result.playerTeam[0]?.life).toBe(9702);
    expect(r.result.enemyTeam[0]?.life).toBe(9462);
    expect(r.result.playerTeam[0]?.statuses.some((s) => s.id === 'bone-armor')).toBe(false);
    expect(snapshot).toEqual(before);
    expect(runBattleRecorded(snapshot)).toEqual(r);
  });
  it('settles resistance and armor independently on every strike without weapon Attack scaling', () => {
    const input = fixture(),
      h = input.playerTeam[0],
      t = input.enemyTeam[0];
    if (!h || !t) throw new Error('Missing Fury units');
    const r = runBattleRecorded(
      patch(
        input,
        { stats: { ...h.stats, attack: 999999 } },
        {
          stats: { ...t.stats, defense: 10, resistances: { ...t.stats.resistances, physical: 50 } }
        }
      )
    );
    expect(hits(r).map((e) => e.amount)).toEqual([38, 48, 42, 42, 48]);
    expect(r.result.enemyTeam[0]?.life).toBe(9782);
  });
  it('spends missed attempts and keeps trying without refunding mana', () => {
    const input = fixture(),
      t = input.enemyTeam[0];
    if (!t) throw new Error('Missing Fury target');
    const r = runBattleRecorded(patch(input, {}, { stats: { ...t.stats, physDodge: 1 } }));
    expect(hits(r).map((e) => [e.amount, e.dodged])).toEqual([
      [97, false],
      [0, true],
      [0, true],
      [0, true],
      [0, true]
    ]);
    expect(r.result.enemyTeam[0]?.life).toBe(9903);
    expect(r.result.playerTeam[0]?.mana).toBe(0);
  });
  it('cannot start the sequence without its one complete mana payment', () => {
    const r = runBattleRecorded(patch(fixture(), { mana: 10 }));
    expect(r.events.filter((e) => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: null })
    ]);
    expect(hits(r)).toHaveLength(1);
    expect(r.result.playerTeam[0]?.mana).toBe(10);
  });
  it('pays once, uses one cooldown and does not insert extra actor turns', () => {
    const input = fixture(),
      h = input.playerTeam[0];
    if (!h) throw new Error('Missing Fury hero');
    const r = runBattleRecorded(
      patch(input, { mana: 22, statuses: [hold(2701)], stats: { ...h.stats, attackSpeed: 200 } })
    );
    expect(
      r.events.filter((e) => e.kind === 'action').map((e) => [e.simClockMs, e.skillId])
    ).toEqual([
      [900, 'druid.fury'],
      [1800, null],
      [2700, 'druid.fury']
    ]);
    expect(hits(r)).toHaveLength(11);
    expect(r.result.playerTeam[0]?.mana).toBe(0);
  });
  it('preserves previous single-hit damage and payment when sequence metadata is absent', () => {
    const skill = getSkill('druid.fury');
    if (!skill) throw new Error('Missing Fury');
    registerSkill({
      ...skill,
      effects: skill.effects.map((e) => {
        if (e.kind !== 'damage') return e;
        const { hitSequence, ...rest } = e;
        void hitSequence;
        return rest;
      })
    });
    const r = runBattleRecorded(fixture());
    expect(hits(r).map((e) => e.amount)).toEqual([97]);
    expect(r.result.enemyTeam[0]?.life).toBe(9903);
    expect(r.result.playerTeam[0]?.mana).toBe(0);
  });
  it.each([0, 1, 1.5, 9, NaN, Infinity])(
    'rejects an untyped invalid count %s without an unbounded loop',
    (strikes) => {
      const skill = getSkill('druid.fury');
      if (!skill) throw new Error('Missing Fury');
      registerSkill({
        ...skill,
        effects: skill.effects.map((e) =>
          e.kind === 'damage' ? { ...e, hitSequence: { strikes } } : e
        )
      });
      expect(() => runBattleRecorded(fixture())).toThrow('Invalid damage hit sequence');
    }
  );
});
