import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import {
  getSkill,
  listSkills,
  loadDefaultSkills,
  registerSkill,
  resetRegistry
} from '../skills/registry';
import { PLAYABLE_CLASS_SKILL_DATA, registeredSkillFromJson } from '../skills/dataCatalog';
import { runBattleRecorded, type CombatSnapshot, type RecordedBattleResult } from './combat';
import type { ActiveStatus, CombatUnit } from './types';

const hold = (at = 0): ActiveStatus => ({
  id: 'stun',
  sourceId: 'synthetic-hold',
  stacks: 1,
  remaining: -1,
  appliedAtMs: at
});
function fixture(rank = 1): CombatSnapshot {
  // Registered-engine isolation; actual native class/prerequisite authority has separate store tests.
  const hero: CombatUnit = {
    id: 'hero',
    name: 'Synthetic composite caster',
    side: 'player',
    kind: 'hero',
    level: 30,
    tier: 'trash',
    life: 10000,
    mana: 30,
    statuses: [hold(1701)],
    cooldowns: {},
    skillOrder: ['skills-paladin-vengeance'],
    skillLevels: { 'paladin.vengeance': rank },
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
    mana: 0,
    life: 100000,
    stats: { ...hero.stats, life: 100000, lifeMax: 100000 },
    statuses: [hold()],
    skillOrder: [],
    skillLevels: {}
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
  if (!h || !t) throw new Error('Missing composite fixture units');
  return { ...input, playerTeam: [{ ...h, ...hero }], enemyTeam: [{ ...t, ...target }] };
}
const hits = (out: RecordedBattleResult) =>
  out.events.filter((e) => e.kind === 'damage' && e.target === 'target');
function replay(input: CombatSnapshot) {
  const before = structuredClone(input),
    out = runBattleRecorded(input);
  expect(runBattleRecorded(input)).toEqual(out);
  expect(input).toEqual(before);
  return out;
}
function withoutStatuses() {
  const actual = getSkill('paladin.vengeance');
  if (!actual) throw new Error('Missing registered Vengeance');
  registerSkill({
    ...actual,
    effects: actual.effects.map((effect) => {
      if (effect.kind !== 'damage') return effect;
      const { applyStatus, applyStatuses, ...rest } = effect;
      void applyStatus;
      void applyStatuses;
      return rest;
    })
  });
}
function againstPlayer(input: CombatSnapshot): CombatSnapshot {
  const caster = input.playerTeam[0],
    target = input.enemyTeam[0];
  if (!caster || !target) throw new Error('Missing reverse shield fixture');
  // Shields belong to a living player hero. This reverses only the pure-engine fixture,
  // without claiming a native enemy can learn Paladin skills.
  return {
    ...input,
    playerTeam: [{ ...target, side: 'player', kind: 'hero' }],
    enemyTeam: [{ ...caster, side: 'enemy', kind: 'monster' }]
  };
}
beforeEach(loadDefaultSkills);
afterEach(() => {
  resetRegistry();
  loadDefaultSkills();
});

describe('Vengeance one shared-roll composite strike', () => {
  it('registers one effect with typed components and statuses; other mixed skills stay scalar', () => {
    const actual = getSkill('paladin.vengeance');
    expect(getSkill('skills-paladin-vengeance')).toBe(actual);
    expect(actual?.effects).toEqual([
      expect.objectContaining({
        kind: 'damage',
        base: [90, 150],
        perRank: [9, 9],
        components: [
          { damageType: 'fire', weight: 50 },
          { damageType: 'cold', weight: 50 },
          { damageType: 'lightning', weight: 50 }
        ],
        applyStatuses: [
          { id: 'burn', damageType: 'fire', dotPctOfDamage: 0.1 },
          { id: 'chill', damageType: 'cold' },
          { id: 'paralyze', damageType: 'lightning' }
        ]
      })
    ]);
    const row = PLAYABLE_CLASS_SKILL_DATA.paladin.find((s) => s.id === 'skills-paladin-vengeance');
    if (!row) throw new Error('Missing authored Vengeance');
    expect(registeredSkillFromJson(row)).toEqual(actual);
    expect(
      listSkills().filter((id) =>
        getSkill(id)?.effects.some((e) => e.kind === 'damage' && 'components' in e)
      )
    ).toEqual(['paladin.vengeance']);
  });
  it.each([1, 2, 20])(
    'rank%i pays once and emits three same-clock real typed hits, without self-combo',
    (rank) => {
      const out = replay(fixture(rank)),
        amount = 31 + 3 * (rank - 1);
      expect(hits(out)).toEqual(
        ['fire', 'cold', 'lightning'].map((damageType): unknown =>
          expect.objectContaining({
            damageType,
            amount,
            crit: false,
            dodged: false,
            simClockMs: 1700
          })
        )
      );
      expect(out.result.playerTeam[0]?.mana).toBe(0);
      expect(out.events.filter((e) => e.kind === 'action')).toEqual([
        expect.objectContaining({ actor: 'hero', skillId: 'paladin.vengeance', simClockMs: 1700 })
      ]);
      expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'cast')).toEqual([
        expect.objectContaining({ target: 'hero', mana: 0, simClockMs: 1700 })
      ]);
      expect(out.events.filter((e) => e.kind === 'status').map((e) => e.statusId)).toEqual([
        'burn',
        'chill',
        'paralyze'
      ]);
      expect(out.result.enemyTeam[0]?.life).toBe(
        100000 - 3 * amount - Math.floor(amount * 0.1) * 3
      );
    }
  );
  it('uses exactly one total-base and one critical roll across 64 deterministic seeds', () => {
    withoutStatuses();
    for (let seed = 1; seed <= 64; seed++) {
      const f = fixture(),
        h = f.playerTeam[0];
      if (!h) throw new Error('Missing hero');
      const rng = createRng(seed),
        landed = rng.chance(0.85);
      const base = landed ? rng.nextInt(90, 150) : 0,
        crit = landed ? rng.chance(0.5) : false;
      const out = runBattleRecorded({
        ...patch(f, { stats: { ...h.stats, critChance: 0.5 } }),
        seed
      });
      expect(hits(out), 'seed ' + String(seed)).toEqual(
        ['fire', 'cold', 'lightning'].map((damageType): unknown =>
          expect.objectContaining({
            damageType,
            amount: landed ? Math.floor((base / 3) * (crit ? 1.5 : 1)) : 0,
            crit,
            dodged: !landed
          })
        )
      );
    }
  });
  it('applies each type source bonus, resistance, flat mitigation and preexisting combo separately', () => {
    const f = fixture(),
      t = f.enemyTeam[0];
    if (!t) throw new Error('Missing target');
    const out = replay(
      patch(
        f,
        { increasedDamagePct: { fire: 1, cold: 0.5, lightning: 0.25 } },
        {
          statuses: [
            hold(),
            { id: 'chill', sourceId: 'old', remaining: -1, stacks: 1 },
            { id: 'paralyze', sourceId: 'old', remaining: -1, stacks: 1 }
          ],
          stats: {
            ...t.stats,
            defense: 4,
            magicResist: 7,
            resistances: { ...t.stats.resistances, fire: 50, cold: -20, lightning: 25 }
          }
        }
      )
    );
    expect(hits(out)).toEqual([
      expect.objectContaining({ damageType: 'fire', amount: 33 }),
      expect.objectContaining({ damageType: 'cold', amount: 48 }),
      expect.objectContaining({ damageType: 'lightning', amount: 30 })
    ]);
    expect(
      out.events.some(
        (e) =>
          e.kind === 'status-state' &&
          e.target === 'target' &&
          e.statuses.some(
            (s) => s.id === 'ignite' && s.dotPerStack === 3 && s.damageType === 'fire'
          )
      )
    ).toBe(true);
  });
  it('misses all elements and applies no status or later DoT, while paying once', () => {
    const f = fixture(),
      t = f.enemyTeam[0];
    if (!t) throw new Error('Missing target');
    const out = replay({ ...patch(f, {}, { stats: { ...t.stats, magicDodge: 1 } }), seed: 1 });
    expect(hits(out)).toEqual(
      ['fire', 'cold', 'lightning'].map((damageType): unknown =>
        expect.objectContaining({ damageType, amount: 0, dodged: true })
      )
    );
    expect(out.events.filter((e) => e.kind === 'status' || e.kind === 'dot')).toEqual([]);
    expect(out.result.playerTeam[0]?.mana).toBe(0);
    expect(out.result.enemyTeam[0]?.life).toBe(100000);
  });
  it('consumes one finite shield across components and keeps Fire-only Burn potency', () => {
    const out = replay(
      againstPlayer(
        patch(
          fixture(),
          {},
          {
            statuses: [
              hold(),
              {
                id: 'bone-armor',
                sourceId: 'target',
                remaining: -1,
                stacks: 1,
                boneArmor: { rank: 20, remaining: 40 }
              }
            ]
          }
        )
      )
    );
    expect(hits(out)).toEqual([
      expect.objectContaining({ damageType: 'fire', amount: 0, absorbed: 31 }),
      expect.objectContaining({ damageType: 'cold', amount: 22, absorbed: 9 }),
      expect.objectContaining({ damageType: 'lightning', amount: 31 })
    ]);
    expect(out.result.playerTeam[0]?.life).toBe(100000 - 53 - 9);
    expect(out.result.playerTeam[0]?.statuses.some((s) => s.id === 'bone-armor')).toBe(false);
  });
  it('pays Energy Shield from the remaining MP for each ordered component, with absolute playback', () => {
    withoutStatuses();
    const out = replay(againstPlayer(patch(fixture(), {}, { mana: 25, energyShieldRank: 20 })));
    expect(hits(out)).toEqual([
      expect.objectContaining({ damageType: 'fire', amount: 13 }),
      expect.objectContaining({ damageType: 'cold', amount: 24 }),
      expect.objectContaining({ damageType: 'lightning', amount: 31 })
    ]);
    expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'energy-shield')).toEqual([
      expect.objectContaining({ target: 'target', mana: 7 }),
      expect.objectContaining({ target: 'target', mana: 0 })
    ]);
    expect(out.result.playerTeam[0]).toMatchObject({ life: 99932, mana: 0 });
  });
  it('finishes the complete strike before one death, one corpse and any orb settlement', () => {
    const f = fixture(),
      hero = f.playerTeam[0];
    if (!hero) throw new Error('Missing actual attacker');
    const observer = {
      ...hero,
      id: 'observer',
      skillOrder: [],
      skillLevels: {},
      statuses: [hold()]
    };
    const input = {
      ...patch(f, {}, { life: 1 }),
      playerTeam: [hero, observer],
      corpseExplosion: [{ sourceHeroId: 'observer', rank: 1 }]
    };
    const out = replay(input),
      damageIndices = out.events.flatMap((e, i) => (e.kind === 'damage' ? [i] : []));
    expect(hits(out)).toHaveLength(3);
    const deathIndex = out.events.findIndex((e) => e.kind === 'death' && e.target === 'target');
    expect(deathIndex).toBeGreaterThan(Math.max(...damageIndices));
    expect(out.events.filter((e) => e.kind === 'death' && e.target === 'target')).toHaveLength(1);
    expect(
      out.events.filter((e) => e.kind === 'message' && e.messageKey === 'combat:corpses.available')
    ).toEqual([expect.objectContaining({ params: { count: 1 } })]);
    const actual = getSkill('paladin.vengeance');
    if (!actual) throw new Error('Missing actual Vengeance');
    registerSkill({
      ...actual,
      effects: [
        {
          kind: 'damage',
          damageType: 'fire',
          base: [90, 150],
          perRank: [9, 9],
          applyStatuses: [{ id: 'burn', dotPctOfDamage: 0.1 }, { id: 'chill' }, { id: 'paralyze' }]
        }
      ]
    });
    const scalar = runBattleRecorded(input);
    expect(out.events.filter((e) => e.kind === 'orb')).toEqual(
      scalar.events.filter((e) => e.kind === 'orb')
    );
    expect(out.result.winner).toBe('player');
    expect(out.events.some((e) => e.kind === 'damage' && e.damageType === 'thorns')).toBe(false);
  });
  it('applies real Burn HP loss, Chill cadence and Paralyze suppression from the authored attack', () => {
    const f = fixture(),
      h = f.playerTeam[0];
    if (!h) throw new Error('Missing hero');
    const out = replay(
      patch(
        f,
        { stats: { ...h.stats, attackSpeed: 150 }, statuses: [hold(1301)] },
        { statuses: [] }
      )
    );
    const firstSuppressed = out.events.find((e) => e.kind === 'stunned' && e.target === 'target');
    expect(firstSuppressed?.simClockMs).toBeCloseTo(30100 / 17, 8);
    const actions = out.events.filter((e) => e.kind === 'action' && e.actor === 'target');
    expect(actions[0]?.simClockMs).toBeCloseTo(3700, 8);
    expect(actions[1]?.simClockMs).toBeCloseTo(5400, 8);
    expect(
      out.events
        .filter((e) => e.kind === 'dot' && e.target === 'target')
        .reduce((sum, e) => sum + (e.kind === 'dot' ? e.amount : 0), 0)
    ).toBe(9);
    expect(out.result.enemyTeam[0]?.stats.attackSpeed).toBe(100);
  });
  it('keeps the original shield eligibility through an otherwise lethal first component', () => {
    withoutStatuses();
    const out = replay(
      againstPlayer(patch(fixture(), {}, { life: 1, mana: 100, energyShieldRank: 20 }))
    );
    expect(hits(out)).toEqual(
      ['fire', 'cold', 'lightning'].map((damageType): unknown =>
        expect.objectContaining({ damageType, amount: 13 })
      )
    );
    expect(out.events.filter((e) => e.kind === 'mana' && e.reason === 'energy-shield')).toEqual(
      [82, 64, 46].map((mana): unknown => expect.objectContaining({ target: 'target', mana }))
    );
    expect(out.result.playerTeam[0]).toMatchObject({ life: 0, mana: 46 });
    expect(out.events.filter((e) => e.kind === 'death' && e.target === 'target')).toHaveLength(1);
    const death = out.events.findIndex((e) => e.kind === 'death');
    expect(out.events.slice(death + 1).some((e) => e.kind === 'damage' || e.kind === 'mana')).toBe(
      false
    );
  });
  it('retaliates with paid Frozen Armor once for the complete strike, without physical reflection or recovery', () => {
    const out = replay(
      againstPlayer(
        patch(
          fixture(),
          { life: 5000 },
          {
            frozenArmor: { rank: 1, defensePct: 0.15 },
            physicalReflectionPct: 10
          }
        )
      )
    );
    expect(hits(out)).toHaveLength(3);
    expect(out.events.filter((e) => e.kind === 'status' && e.target === 'hero')).toEqual([
      expect.objectContaining({ statusId: 'chill' })
    ]);
    expect(
      out.events.filter(
        (e) => e.kind === 'heal' || (e.kind === 'damage' && e.damageType === 'thorns')
      )
    ).toEqual([]);
    expect(out.result.enemyTeam[0]?.life).toBe(5000);
  });
  it.each(['boss', 'chapter-boss'] as const)(
    'retains ordinary %s status duration rules',
    (tier) => {
      const out = replay(patch(fixture(), {}, { tier }));
      const state = out.events.find(
        (e) =>
          e.kind === 'status-state' &&
          e.target === 'target' &&
          e.statuses.some((s) => s.id === 'paralyze')
      );
      if (state?.kind !== 'status-state')
        throw new Error('Missing actual three-status publication');
      expect(state.statuses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'ignite', expiresAtMs: 4700, damageType: 'fire' }),
          expect.objectContaining({ id: 'chill', expiresAtMs: 3700, damageType: 'cold' }),
          expect.objectContaining({ id: 'paralyze', expiresAtMs: 2700, damageType: 'lightning' })
        ])
      );
    }
  );
  it('honors the carried cooldown boundary and never makes components into extra casts', () => {
    for (const expires of [1699, 1700, 1701]) {
      const out = replay(patch(fixture(), { cooldowns: { 'skills-paladin-vengeance': expires } }));
      expect(out.events.filter((e) => e.kind === 'action')).toEqual([
        expect.objectContaining({ skillId: expires <= 1700 ? 'paladin.vengeance' : null })
      ]);
      expect(out.result.playerTeam[0]?.mana).toBe(expires <= 1700 ? 0 : 30);
      expect(hits(out)).toHaveLength(expires <= 1700 ? 3 : 1);
    }
  });
});
