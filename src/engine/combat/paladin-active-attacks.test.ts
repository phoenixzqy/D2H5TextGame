import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  stacks: 1,
  sourceId: 'synthetic-hold',
  remaining: -1,
  appliedAtMs: at
});
function fixture(hammer = false): CombatSnapshot {
  const hero: CombatUnit = {
    id: 'hero',
    name: 'Synthetic Paladin attack fixture',
    side: 'player',
    kind: 'hero',
    level: 30,
    tier: 'trash',
    life: 5000,
    mana: hammer ? 25 : 15,
    statuses: [hold(1701)],
    cooldowns: {},
    activeBuffIds: [],
    enraged: false,
    skillOrder: [hammer ? 'paladin.blessed_hammer' : 'paladin.holy_bolt'],
    skillLevels: { 'paladin.holy_bolt': 1, 'paladin.blessed_hammer': 1 },
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
      critDamage: 1.5,
      physDodge: 0,
      magicDodge: 0,
      magicFind: 0,
      goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 }
    }
  };
  const target: CombatUnit = {
    ...hero,
    id: 'target',
    side: 'enemy',
    kind: 'monster',
    life: 100000,
    mana: 0,
    skillOrder: [],
    statuses: [hold()],
    stats: { ...hero.stats, life: 100000, lifeMax: 100000 }
  };
  return { seed: 7, playerTeam: [hero], enemyTeam: [target] };
}
function patch(
  input: CombatSnapshot,
  hero: Partial<CombatUnit> = {},
  target: Partial<CombatUnit> = {}
): CombatSnapshot {
  const h = input.playerTeam[0],
    t = input.enemyTeam[0];
  if (!h || !t) throw new Error('Missing Paladin attack fixture');
  return { ...input, playerTeam: [{ ...h, ...hero }], enemyTeam: [{ ...t, ...target }] };
}
const healing = (out: ReturnType<typeof runBattleRecorded>) =>
  out.events.filter((e) => e.kind === 'heal');
beforeEach(loadDefaultSkills);
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

describe('Holy Bolt actual direct-HP recovery boundaries', () => {
  it.each([9999, 10000])('caps useful restoration at missing life for starting HP%i', (life) => {
    const out = runBattleRecorded(patch(fixture(), { life }));
    expect(out.result.playerTeam[0]?.life).toBe(10000);
    expect(healing(out)).toEqual(life === 9999 ? [expect.objectContaining({ amount: 1 })] : []);
  });
  it('uses actual HP removed after resistance, with ordinary flooring', () => {
    const f = fixture(),
      target = f.enemyTeam[0];
    if (!target) throw new Error('Missing target');
    const out = runBattleRecorded(
      patch(
        f,
        {},
        { stats: { ...target.stats, resistances: { ...target.stats.resistances, arcane: 50 } } }
      )
    );
    expect(out.result.enemyTeam[0]?.life).toBe(99975);
    expect(healing(out)).toEqual([expect.objectContaining({ amount: 12 })]);
    expect(out.result.playerTeam[0]?.life).toBe(5012);
  });
  it('clips one-HP overkill before recovery and preserves ordinary orb settlement', () => {
    const input = patch(fixture(), {}, { life: 1, tier: 'boss' }),
      actual = runBattleRecorded(input);
    const skill = getSkill('paladin.holy_bolt');
    if (!skill) throw new Error('Missing Holy Bolt');
    registerSkill({
      ...skill,
      effects: [{ kind: 'damage', damageType: 'arcane', base: [50, 70], perRank: [5, 5] }]
    });
    const control = runBattleRecorded(input);
    expect(healing(actual)).toEqual(healing(control));
    expect(actual.result.playerTeam).toEqual(control.result.playerTeam);
    expect(actual.events.filter((e) => e.kind === 'orb')).toEqual(
      control.events.filter((e) => e.kind === 'orb')
    );
  });
  it('does not heal on a miss, an unaffordable fallback or a cooling-down fallback', () => {
    const f = fixture(),
      t = f.enemyTeam[0];
    if (!t) throw new Error('Missing target');
    for (const input of [
      { ...patch(f, {}, { stats: { ...t.stats, magicDodge: 1 } }), seed: 1 },
      patch(f, { mana: 14 }),
      patch(f, { cooldowns: { 'paladin.holy_bolt': 1701 } })
    ]) {
      const out = runBattleRecorded(input);
      expect(healing(out)).toEqual([]);
      expect(out.result.playerTeam[0]?.life).toBe(5000);
    }
  });
  it('recovers once from the cast while later basic attacks retain no recovery', () => {
    const out = runBattleRecorded(patch(fixture(), { statuses: [hold(3401)] }));
    expect(out.events.filter((e) => e.kind === 'action').map((e) => e.skillId)).toEqual([
      'paladin.holy_bolt',
      null
    ]);
    expect(healing(out)).toEqual([expect.objectContaining({ amount: 25, simClockMs: 1700 })]);
    expect(out.result.playerTeam[0]?.life).toBe(5025);
  });
  it('does not heal from periodic enemy HP loss after the actual direct hit', () => {
    const poisoned: ActiveStatus = {
      id: 'poison',
      sourceId: 'hero',
      remaining: 5,
      stacks: 1,
      appliedAtMs: 0,
      expiresAtMs: 5000,
      dotPerStack: 10,
      damageType: 'poison'
    };
    const out = runBattleRecorded(patch(fixture(), {}, { statuses: [hold(), poisoned] }));
    expect(out.events.some((e) => e.kind === 'dot' && e.target === 'target')).toBe(true);
    expect(healing(out)).toEqual([expect.objectContaining({ amount: 25 })]);
    expect(out.result.playerTeam[0]?.life).toBe(5025);
  });
  it('does not recover absorbed damage from a valid personal Bone Armor pool', () => {
    const f = fixture(),
      h = f.playerTeam[0],
      t = f.enemyTeam[0];
    if (!h || !t) throw new Error('Missing reverse shield fixture');
    // Pure-engine attack isolation against a shield-eligible hero; no enemy-learning claim.
    const input: CombatSnapshot = {
      ...f,
      playerTeam: [
        {
          ...t,
          side: 'player',
          kind: 'hero',
          statuses: [
            hold(),
            {
              id: 'bone-armor',
              sourceId: 'target',
              remaining: -1,
              stacks: 1,
              boneArmor: { rank: 20, remaining: 240 }
            }
          ]
        }
      ],
      enemyTeam: [{ ...h, side: 'enemy', kind: 'monster' }]
    };
    const out = runBattleRecorded(input);
    expect(out.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 0, absorbed: 51 })
    ]);
    expect(healing(out)).toEqual([]);
    expect(out.result.enemyTeam[0]?.life).toBe(5000);
  });
});

describe('Blessed Hammer narrow bypass and actual target coverage', () => {
  it('hits every living enemy with one cast/payment and ignores each independent flat MR stat', () => {
    const f = fixture(true),
      t = f.enemyTeam[0];
    if (!t) throw new Error('Missing target');
    const out = runBattleRecorded({
      ...f,
      enemyTeam: [t, { ...t, id: 'second', stats: { ...t.stats, magicResist: 1000 } }]
    });
    const damages = out.events.filter((e) => e.kind === 'damage');
    expect(damages).toHaveLength(2);
    expect(damages).toEqual([
      expect.objectContaining({ target: 'target', amount: 61 }),
      expect.objectContaining({ target: 'second', damageType: 'arcane', dodged: false })
    ]);
    expect(out.events.filter((e) => e.kind === 'action')).toHaveLength(1);
    expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toHaveLength(1);
    expect(out.result.playerTeam[0]?.mana).toBe(0);
    const clean = runBattleRecorded({ ...f, enemyTeam: [t, { ...t, id: 'second' }] });
    expect(damages).toEqual(clean.events.filter((e) => e.kind === 'damage'));
  });
  it('retains magic dodge, critical scaling and minimum damage from percentage resistance', () => {
    const f = fixture(true),
      h = f.playerTeam[0],
      t = f.enemyTeam[0];
    if (!h || !t) throw new Error('Missing fixture');
    const critical = runBattleRecorded(
      patch(
        f,
        { stats: { ...h.stats, critChance: 1 } },
        {
          stats: { ...t.stats, magicResist: 1000 }
        }
      )
    );
    expect(critical.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 91, crit: true })
    ]);
    const missed = runBattleRecorded({
      ...patch(f, {}, { stats: { ...t.stats, magicDodge: 1 } }),
      seed: 1
    });
    expect(missed.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: 0, dodged: true })
    ]);
    expect(missed.result.playerTeam[0]?.mana).toBe(0);
  });
});
