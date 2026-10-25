import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { getSkill, registerSkill, resetRegistry, loadDefaultSkills } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { CombatUnit, ActiveStatus } from './types';
const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-hold',
  stacks: 1,
  remaining: -1,
  appliedAtMs: at
});
function fixture(rank = 1): CombatSnapshot {
  const hero: CombatUnit = {
    id: 'hero',
    name: 'Synthetic Sacrifice',
    side: 'player',
    kind: 'hero',
    level: 30,
    tier: 'trash',
    life: 5000,
    mana: 0,
    statuses: [hold(1701)],
    cooldowns: {},
    skillOrder: ['skills-paladin-sacrifice'],
    skillLevels: { 'paladin.sacrifice': rank },
    activeBuffIds: [],
    enraged: false,
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
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 }
    }
  };
  const target: CombatUnit = {
    ...hero,
    id: 'target',
    side: 'enemy',
    kind: 'monster',
    life: 100000,
    statuses: [hold()],
    skillOrder: [],
    skillLevels: {},
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
  if (!h || !t) throw new Error('Missing Sacrifice fixture');
  return { ...input, playerTeam: [{ ...h, ...hero }], enemyTeam: [{ ...t, ...target }] };
}
function run(input: CombatSnapshot) {
  const before = structuredClone(input),
    out = runBattleRecorded(input);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(input).toEqual(before);
  return out;
}
const selfHits = (out: ReturnType<typeof run>) =>
  out.events.filter((e) => e.kind === 'damage' && e.source === 'hero' && e.target === 'hero');
function withoutCost() {
  const skill = getSkill('paladin.sacrifice');
  if (!skill) throw new Error('Missing Sacrifice');
  registerSkill({
    ...skill,
    effects: skill.effects.map((e) => {
      if (e.kind !== 'damage') return e;
      const { onHitSelfDamage, ...rest } = e;
      void onHitSelfDamage;
      return rest;
    })
  });
}
beforeEach(loadDefaultSkills);
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});
describe('Sacrifice real direct-HP life tradeoff', () => {
  it('forwards explicit tuning without sharing mutable JSON payloads', () => {
    const e = getSkill('paladin.sacrifice')?.effects[0];
    expect(e).toMatchObject({
      kind: 'damage',
      onHitSelfDamage: { lifeFraction: 0.08, minimumLifeLoss: 1 }
    });
  });
  it.each([1, 2, 20])('rank%i pays one life cost from the real hit with zero MP', (rank) => {
    const out = run(fixture(rank)),
      damage = 41 + 4 * (rank - 1),
      cost = Math.floor(damage * 0.08);
    expect(out.events.filter((e) => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: 'paladin.sacrifice', simClockMs: 1700 })
    ]);
    expect(selfHits(out)).toEqual([
      expect.objectContaining({
        damageType: 'physical',
        amount: cost,
        crit: false,
        dodged: false,
        simClockMs: 1700
      })
    ]);
    expect(out.result.playerTeam[0]).toMatchObject({ life: 5000 - cost, mana: 0 });
    expect(out.result.enemyTeam[0]?.life).toBe(100000 - damage);
  });
  it('uses post-mitigation actual HP loss and the authored one-life minimum', () => {
    const f = fixture(),
      t = f.enemyTeam[0];
    if (!t) throw new Error('Missing target');
    const out = run(patch(f, {}, { stats: { ...t.stats, defense: 1000 } }));
    expect(out.result.enemyTeam[0]?.life).toBe(99999);
    expect(selfHits(out)).toEqual([expect.objectContaining({ amount: 1 })]);
    expect(out.result.playerTeam[0]?.life).toBe(4999);
  });
  it('excludes overkill and debits after ordinary final-kill orb settlement', () => {
    const input = patch(fixture(), {}, { life: 1, tier: 'boss' }),
      out = run(input);
    withoutCost();
    const control = run(input);
    expect(selfHits(out)).toEqual([expect.objectContaining({ amount: 1 })]);
    expect(out.result.playerTeam[0]?.life).toBe((control.result.playerTeam[0]?.life ?? 0) - 1);
    expect(out.events.filter((e) => e.kind === 'orb')).toEqual(
      control.events.filter((e) => e.kind === 'orb')
    );
    const cost = out.events.findIndex((e) => e.kind === 'damage' && e.target === 'hero');
    expect(cost).toBeGreaterThan(
      out.events.findIndex((e) => e.kind === 'death' && e.target === 'target')
    );
    expect(out.result.winner).toBe('player');
  });
  it('does not charge a miss, blocked actor, cooling-down fallback or later basic attack', () => {
    const f = fixture(),
      t = f.enemyTeam[0];
    if (!t) throw new Error('Missing target');
    for (const input of [
      { ...patch(f, {}, { stats: { ...t.stats, physDodge: 1 } }), seed: 1 },
      patch(f, { statuses: [hold()] }),
      patch(f, { cooldowns: { 'paladin.sacrifice': 1701 } })
    ])
      expect(selfHits(run(input))).toEqual([]);
    const out = run(patch(f, { statuses: [hold(3401)], cooldowns: { 'paladin.sacrifice': 3401 } }));
    expect(selfHits(out)).toEqual([]);
    expect(out.events.filter((e) => e.kind === 'action').every((e) => e.skillId === null)).toBe(
      true
    );
  });
  it('does not charge enemy damage fully absorbed by a valid personal pool', () => {
    const f = fixture(),
      h = f.playerTeam[0],
      t = f.enemyTeam[0];
    if (!h || !t) throw new Error('Missing shield fixture');
    // Pure engine isolation against a shield-eligible hero; no native enemy-learning claim.
    const out = run({
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
    });
    expect(out.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ target: 'target', amount: 0, absorbed: 41 })
    ]);
    expect(selfHits(out)).toEqual([]);
    expect(out.result.enemyTeam[0]?.life).toBe(5000);
  });
  it('charges the actual cast once while its later ordinary basic attack has no cost', () => {
    const skill = getSkill('paladin.sacrifice');
    if (!skill) throw new Error('Missing skill');
    registerSkill({ ...skill, cooldown: 60 });
    const out = run(patch(fixture(), { statuses: [hold(3401)] }));
    expect(out.events.filter((e) => e.kind === 'action').map((e) => e.skillId)).toEqual([
      'paladin.sacrifice',
      null
    ]);
    expect(selfHits(out)).toEqual([expect.objectContaining({ amount: 3 })]);
    expect(out.result.playerTeam[0]?.life).toBe(4997);
  });
  it('does not count subsequent periodic HP loss in the cost', () => {
    const poison: ActiveStatus = {
      id: 'poison',
      sourceId: 'hero',
      remaining: 5,
      stacks: 1,
      appliedAtMs: 0,
      expiresAtMs: 5000,
      dotPerStack: 10,
      damageType: 'poison'
    };
    const out = run(patch(fixture(), {}, { statuses: [hold(), poison] }));
    expect(out.events.some((e) => e.kind === 'dot')).toBe(true);
    expect(selfHits(out)).toEqual([expect.objectContaining({ amount: 3 })]);
    expect(out.result.playerTeam[0]?.life).toBe(4997);
  });
  it('bypasses the caster own shields, dodge and mitigation without MP or pool consumption', () => {
    const f = fixture(),
      h = f.playerTeam[0];
    if (!h) throw new Error('Missing hero');
    const out = run(
      patch(f, {
        mana: 100,
        energyShieldRank: 20,
        cycloneArmorRank: 20,
        cycloneArmor: { sourceHeroId: 'hero', rank: 20 },
        activeBuffIds: ['cyclone-armor'],
        statuses: [
          hold(1701),
          {
            id: 'bone-armor',
            sourceId: 'hero',
            remaining: -1,
            stacks: 1,
            boneArmor: { rank: 20, remaining: 240 }
          }
        ],
        stats: { ...h.stats, defense: 10000, magicResist: 10000, physDodge: 1 }
      })
    );
    expect(selfHits(out)).toEqual([
      expect.objectContaining({ amount: 3, crit: false, dodged: false })
    ]);
    expect(selfHits(out)[0]).not.toHaveProperty('absorbed');
    expect(selfHits(out)[0]).not.toHaveProperty('cycloneAbsorbed');
    expect(out.result.playerTeam[0]).toMatchObject({ life: 4997, mana: 100 });
    expect(
      out.result.playerTeam[0]?.statuses.find((s) => s.id === 'bone-armor')?.boneArmor?.remaining
    ).toBe(240);
  });
  it('kills an insufficient-life caster once and orphans its summon without giving rewards', () => {
    const f = patch(fixture(), { life: 1 }),
      h = f.playerTeam[0];
    if (!h) throw new Error('Missing hero');
    const out = run({
      ...f,
      playerTeam: [
        h,
        {
          ...h,
          id: 'pet',
          kind: 'summon',
          summon: true,
          summonOwnerId: 'hero',
          skillOrder: [],
          statuses: [hold()],
          life: 100
        }
      ]
    });
    expect(selfHits(out)).toEqual([expect.objectContaining({ amount: 1 })]);
    expect(out.result.winner).toBe('enemy');
    expect(out.result.playerTeam.every((u) => u.life === 0)).toBe(true);
    expect(out.events.filter((e) => e.kind === 'death').map((e) => e.target)).toEqual([
      'hero',
      'pet'
    ]);
    expect(out.events.filter((e) => e.kind === 'orb')).toEqual([]);
  });
  it('keeps hero death as defeat even when the same strike kills the final enemy', () => {
    const input = fixture();
    const hero = input.playerTeam[0];
    if (!hero) throw new Error('Missing Sacrifice caster');
    const out = run(
      patch(input, { life: 1, stats: { ...hero.stats, life: 1, lifeMax: 1 } }, { life: 1 })
    );
    expect(out.result.winner).toBe('enemy');
    expect(out.events.filter((e) => e.kind === 'death' && e.target === 'hero')).toHaveLength(1);
    expect(out.result.enemyTeam[0]?.life).toBe(0);
  });
  it('settles nonlethal reflection first and never recursively reflects the self cost', () => {
    const out = run(patch(fixture(), {}, { physicalReflectionPct: 0.5 }));
    expect(out.events.filter((e) => e.kind === 'damage' && e.target === 'hero')).toEqual([
      expect.objectContaining({ source: 'target', damageType: 'thorns', amount: 20 }),
      expect.objectContaining({ source: 'hero', damageType: 'physical', amount: 3 })
    ]);
    expect(out.result.playerTeam[0]?.life).toBe(4977);
  });
  it('does not charge again or revive after lethal reflection', () => {
    const out = run(patch(fixture(), { life: 1 }, { physicalReflectionPct: 1 }));
    expect(selfHits(out)).toEqual([]);
    expect(out.result.winner).toBe('enemy');
    expect(out.events.filter((e) => e.kind === 'death' && e.target === 'hero')).toHaveLength(1);
  });
});
