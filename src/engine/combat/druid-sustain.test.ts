import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { activeFeralRage } from '../skills/druid-sustain';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const attacks = [
  { slug: 'feral_rage', mana: 3, hit: 46, heal: 4 },
  { slug: 'hunger', mana: 11, hit: 61, heal: 30 }
] as const;
const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-hold',
  stacks: 1,
  remaining: -1,
  appliedAtMs: at
});
function fixture(a: (typeof attacks)[number], repeat = false): CombatSnapshot {
  // Pure registered-attack isolation; native ownership is separately exercised in stores tests.
  const hero: CombatUnit = {
    id: 'hero',
    name: 'Synthetic sustain caster',
    kind: 'hero',
    side: 'player',
    level: 30,
    tier: 'trash',
    life: 10000,
    mana: a.mana,
    feralRageRank: a.slug === 'feral_rage' ? 1 : 0,
    stats: {
      life: 10000,
      lifeMax: 20000,
      mana: 100,
      manaMax: 1000,
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
    },
    statuses: repeat ? [] : [hold(1701)],
    cooldowns: {},
    skillOrder: ['druid.' + a.slug],
    skillLevels: { ['druid.' + a.slug]: 1 },
    activeBuffIds: [],
    enraged: false
  };
  const target: CombatUnit = {
    ...hero,
    id: 'target',
    side: 'enemy',
    kind: 'monster',
    life: 10000,
    mana: 0,
    statuses: [hold()],
    skillOrder: [],
    skillLevels: {}
  };
  return { seed: 7, playerTeam: [hero], enemyTeam: [target] };
}
function patch(
  s: CombatSnapshot,
  hero: Partial<CombatUnit> = {},
  target: Partial<CombatUnit> = {}
): CombatSnapshot {
  const h = s.playerTeam[0],
    t = s.enemyTeam[0];
  if (!h || !t) throw new Error('Missing sustain fixture units');
  return { ...s, playerTeam: [{ ...h, ...hero }], enemyTeam: [{ ...t, ...target }] };
}
function withoutRecovery(a: (typeof attacks)[number]) {
  const skill = getSkill('druid.' + a.slug);
  if (!skill) throw new Error('Missing actual Druid attack');
  registerSkill({
    ...skill,
    effects: skill.effects.map((effect) => {
      if (effect.kind !== 'damage') return effect;
      const { onHitRecovery, ...rest } = effect;
      void onHitRecovery;
      return rest;
    })
  });
}
beforeEach(loadDefaultSkills);
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

describe.each(attacks)('actual registered $slug direct-hit recovery', (a) => {
  it('caps at missing life and emits only the actual positive heal', () => {
    const r = runBattleRecorded(patch(fixture(a), { life: 19999 }));
    expect(r.result.playerTeam[0]?.life).toBe(20000);
    expect(r.events.filter((e) => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'hero', amount: 1, simClockMs: 1700 })
    ]);
  });
  it('does not emit a zero heal at full life; Feral still earns a speed stack', () => {
    const r = runBattleRecorded(patch(fixture(a), { life: 20000 }));
    expect(r.events.filter((e) => e.kind === 'heal')).toEqual([]);
    expect(r.result.playerTeam[0]?.life).toBe(20000);
    expect(
      r.events.some(
        (e) =>
          e.kind === 'status-state' &&
          e.target === 'hero' &&
          e.statuses.some((s) => s.feralRage === true)
      )
    ).toBe(a.slug === 'feral_rage');
  });
  it('clips overkill before flooring recovery instead of draining the advertised hit amount', () => {
    const input = patch(fixture(a), {}, { life: 1 });
    const actual = runBattleRecorded(input);
    withoutRecovery(a);
    const control = runBattleRecorded(input);
    // Identical ordinary death/orb settlement remains authoritative; one HP removed restores floor(<1)=0.
    expect(actual.result.playerTeam[0]?.life).toBe(control.result.playerTeam[0]?.life);
    expect(actual.events.filter((e) => e.kind === 'heal')).toEqual(
      control.events.filter((e) => e.kind === 'heal')
    );
  });
  it('uses final increased/resisted HP loss once and remains independent of weapon Attack', () => {
    const input = fixture(a),
      h = input.playerTeam[0],
      t = input.enemyTeam[0];
    if (!h || !t) throw new Error('Missing sustain fixture');
    const r = runBattleRecorded(
      patch(
        input,
        { increasedDamagePct: { physical: 1 }, stats: { ...h.stats, attack: 999999 } },
        { stats: { ...t.stats, resistances: { ...t.stats.resistances, physical: 50 } } }
      )
    );
    expect(r.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ amount: a.hit, damageType: 'physical' })
    ]);
    expect(r.result.playerTeam[0]?.life).toBe(10000 + a.heal);
  });
  it('does not heal, Bleed or gain speed after a miss, but pays the normal cast cost', () => {
    const input = fixture(a),
      t = input.enemyTeam[0];
    if (!t) throw new Error('Missing target');
    const r = runBattleRecorded({
      ...patch(input, {}, { stats: { ...t.stats, physDodge: 1 } }),
      seed: 1
    });
    expect(r.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ dodged: true, amount: 0 })
    ]);
    expect(
      r.events.filter((e) => e.kind === 'heal' || e.kind === 'dot' || e.kind === 'buff')
    ).toEqual([]);
    expect(r.result.playerTeam[0]?.mana).toBe(0);
  });
  it('falls back without drain or a free speed stack when mana is insufficient', () => {
    const r = runBattleRecorded(patch(fixture(a), { mana: a.mana - 1 }));
    expect(r.events.filter((e) => e.kind === 'action')).toEqual([
      expect.objectContaining({ skillId: null })
    ]);
    expect(r.events.filter((e) => e.kind === 'heal' || e.kind === 'buff')).toEqual([]);
    expect(r.result.playerTeam[0]?.mana).toBe(a.mana - 1);
  });
  it('does not recover life from later basic attacks or Bleed damage', () => {
    const r = runBattleRecorded(fixture(a, true));
    expect(r.events.filter((e) => e.kind === 'heal')).toEqual([
      expect.objectContaining({ target: 'hero', amount: a.heal, simClockMs: 1700 })
    ]);
    expect(r.result.playerTeam[0]?.life).toBe(10000 + a.heal);
    expect(r.events.some((e) => e.kind === 'action' && e.skillId === null)).toBe(true);
  });
  it('heals after surviving reflection and never overwrites the restored HP with speed state', () => {
    const r = runBattleRecorded(patch(fixture(a), { life: 1000 }, { physicalReflectionPct: 1 }));
    expect(r.events.filter((e) => e.kind === 'damage')).toEqual([
      expect.objectContaining({ source: 'hero', amount: a.hit, damageType: 'physical' }),
      expect.objectContaining({ source: 'target', amount: a.hit, damageType: 'thorns' })
    ]);
    expect(r.result.playerTeam[0]?.life).toBe(1000 - a.hit + a.heal);
  });
  it('cannot reverse lethal reflection or grant a dead owner speed', () => {
    const r = runBattleRecorded(patch(fixture(a), { life: 1 }, { physicalReflectionPct: 1 }));
    expect(r.result.playerTeam[0]?.life).toBe(0);
    expect(r.events.filter((e) => e.kind === 'heal' || e.kind === 'buff')).toEqual([]);
    expect(r.result.winner).toBe('enemy');
  });
  it('adds no healing RNG draw and preserves replay/input immutability', () => {
    const input = patch(fixture(a, true), { mana: 1000 }),
      before = structuredClone(input);
    const actual = runBattleRecorded(input);
    expect(runBattleRecorded(input)).toEqual(actual);
    withoutRecovery(a);
    const control = runBattleRecorded(input);
    expect(actual.events.filter((e) => e.kind === 'damage' || e.kind === 'action')).toEqual(
      control.events.filter((e) => e.kind === 'damage' || e.kind === 'action')
    );
    expect(input).toEqual(before);
  });
});
describe('actual Feral scheduler and stack timing', () => {
  it('builds five additive stacks, refreshes at cap and leaves raw speed intact', () => {
    const r = runBattleRecorded(patch(fixture(attacks[0], true), { mana: 1000 }));
    const times = r.events.flatMap((e) =>
      e.kind === 'action' && e.actor === 'hero' ? [e.simClockMs] : []
    );
    expect(times.slice(0, 7)).toEqual([1700, 3360, 4980, 6560, 8100, 9600, 11100]);
    const states = r.events.flatMap((e) =>
      e.kind === 'status-state' && e.target === 'hero' ? e.statuses.filter((s) => s.feralRage) : []
    );
    expect(Math.max(...states.map((s) => s.stacks))).toBe(5);
    expect(states.find((s) => s.appliedAtMs === 9600)).toMatchObject({
      stacks: 5,
      expiresAtMs: 17600
    });
    expect(r.result.playerTeam[0]?.stats.attackSpeed).toBe(100);
  });
  it('expires at exactly eight seconds and preserves pending action progress', () => {
    const r = runBattleRecorded(fixture(attacks[0], true));
    const times = r.events.flatMap((e) =>
      e.kind === 'action' && e.actor === 'hero' ? [e.simClockMs] : []
    );
    expect(times.slice(0, 5)).toEqual([1700, 3360, 5020, 6680, 8340]);
    expect(times[5]).toBeCloseTo(9700 + (300 * 1700) / 1660, 8);
    expect(
      r.events.some(
        (e) =>
          e.kind === 'status-state' &&
          e.target === 'hero' &&
          e.simClockMs === 9700 &&
          !e.statuses.some((s) => s.feralRage)
      )
    ).toBe(true);
    const unit = r.result.playerTeam[0];
    if (!unit) throw new Error('Missing caster');
    expect(activeFeralRage(unit, 60000)).toBeUndefined();
  });
});

describe.each(attacks)('$slug absorption and cooldown boundaries', (a) => {
  it.each([0, 10, 100])('drains only HP after a trusted Bone Armor pool of %i', (pool) => {
    // Trusted engine primitive only: an enemy uses the registered payload against player Bone Armor.
    // Native Druid PvP is unavailable; this is not native class authorization or earned evidence.
    const input = fixture(a),
      caster = input.playerTeam[0],
      victim = input.enemyTeam[0];
    if (!caster || !victim) throw new Error('Missing absorption fixture');
    const attacker: CombatUnit = {
      ...caster,
      id: 'synthetic-enemy-caster',
      side: 'enemy',
      kind: 'monster'
    };
    const defender: CombatUnit = {
      ...victim,
      id: 'synthetic-bone-owner',
      side: 'player',
      kind: 'hero',
      statuses: [
        hold(),
        ...(pool > 0
          ? [
              {
                id: 'bone-armor',
                sourceId: 'synthetic-bone-owner',
                stacks: 1,
                remaining: -1,
                boneArmor: { rank: 20, remaining: pool }
              }
            ]
          : [])
      ]
    };
    const r = runBattleRecorded({ seed: 7, playerTeam: [defender], enemyTeam: [attacker] });
    const removed = Math.max(0, a.hit - pool),
      healed = Math.floor(removed * (a.slug === 'feral_rage' ? 0.1 : 0.5));
    expect(r.events.find((e) => e.kind === 'damage')).toMatchObject({
      amount: removed,
      dodged: false
    });
    expect(r.result.enemyTeam[0]?.life).toBe(10000 + healed);
    expect(r.events.filter((e) => e.kind === 'heal')).toEqual(
      healed > 0 ? [expect.objectContaining({ amount: healed, target: attacker.id })] : []
    );
    expect(r.events.some((e) => e.kind === 'buff' && e.buffId === 'feral-rage')).toBe(false);
  });
  it.each([1699, 1700, 1701])('honors carried cooldown expiry at %ims', (expires) => {
    const r = runBattleRecorded(patch(fixture(a), { cooldowns: { ['druid.' + a.slug]: expires } }));
    expect(r.events.find((e) => e.kind === 'action')).toMatchObject({
      skillId: expires <= 1700 ? 'druid.' + a.slug : null
    });
    expect(r.result.playerTeam[0]?.mana).toBe(expires <= 1700 ? 0 : a.mana);
    expect(r.events.filter((e) => e.kind === 'heal')).toHaveLength(expires <= 1700 ? 1 : 0);
    if (expires <= 1700)
      expect(r.result.playerTeam[0]?.cooldowns).not.toHaveProperty('druid.' + a.slug);
  });
});
