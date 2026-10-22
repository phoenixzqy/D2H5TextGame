import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { legacyRecording } from '@/test/combat-oracle';
import { loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import type { DamageType } from '../types/attributes';
import { runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleResult } from './combat';
import type { CombatUnit } from './types';

function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 24, tier: 'trash',
    life: 100, mana: 50,
    stats: { life: 100, lifeMax: 100, mana: 100, manaMax: 100, attack: 100, defense: 0, magicResist: 0,
      attackSpeed: 100, critChance: 0, critDamage: 2, physDodge: 0, magicDodge: 0,
      magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}

// Structural extension deliberately collects against unchanged prepatch combat.
interface ProjectedSnapshot extends CombatSnapshot {
  readonly mightAura?: { readonly selectedAuraId: 'paladin.might'; readonly sourceHeroId: string;
    readonly fieldedMercCombatId?: string; readonly rank: number; readonly maxRank: number;
    readonly physicalDamagePct: number; readonly attackPct: number };
}
function projection(rank: number, fieldedMercCombatId?: string): NonNullable<ProjectedSnapshot['mightAura']> {
  return { selectedAuraId: 'paladin.might', sourceHeroId: 'hero', rank, maxRank: 20,
    physicalDamagePct: rank * 0.03, attackPct: rank * 0.01,
    ...(fieldedMercCombatId === undefined ? {} : { fieldedMercCombatId }) };
}
function snapshot(rank = 0): ProjectedSnapshot {
  return { seed: 7, playerTeam: [unit('hero', 'player')],
    enemyTeam: [{ ...unit('target', 'enemy'), life: 1,
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] }],
    ...(rank > 0 ? { mightAura: projection(rank) } : {}) };
}
function record(input: ProjectedSnapshot) {
  const before = structuredClone(input);
  const actual = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(actual.result);
  expect(runBattleRecorded(input)).toEqual(actual);
  for (const out of [...actual.result.playerTeam, ...actual.result.enemyTeam]) {
    const original = [...input.playerTeam, ...input.enemyTeam].find(u => u.id === out.id);
    expect(out.stats).toEqual(original?.stats);
    expect(out).not.toHaveProperty('mightAura');
  }
  return actual;
}
function damage(input: ProjectedSnapshot) {
  return record(input).events.filter(e => e.kind === 'damage');
}
function fixed(type: DamageType, rank = 20): ProjectedSnapshot {
  registerSkill({ id: 'fixture.might', archetype: 'fixture', target: 'single-enemy', minLevel: 1,
    manaCost: 0, cooldown: 100, effects: [{ kind: 'damage', damageType: type, base: [100, 100] }] });
  const input = snapshot(rank);
  return { ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero, skillOrder: ['fixture.might'] })) };
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe('selected Might native combat projection', () => {
  it.each([{ rank: 0, amount: 100 }, { rank: 1, amount: 104 }, { rank: 20, amount: 192 }])(
    'basic Attack100 at rank$rank resolves $amount from both distinct bonuses', ({ rank, amount }) => {
      expect(damage(snapshot(rank))).toEqual([expect.objectContaining({ source: 'hero', target: 'target',
        damageType: 'physical', amount, crit: false, dodged: false, simClockMs: 1700 })]);
    });
  it.each([{ rank: 0, amount: 100 }, { rank: 1, amount: 103 }, { rank: 20, amount: 160 }])(
    'fixed physical100 at rank$rank resolves $amount without weapon scaling', ({ rank, amount }) => {
      const input = fixed('physical', rank);
      expect(damage(input)[0]?.amount).toBe(amount);
      expect(damage({ ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
        stats: { ...hero.stats, attack: 9999 } })) })[0]?.amount).toBe(amount);
    });
  it('adds physical increases before later multipliers while keeping Attack separate', () => {
    const input = snapshot(20);
    const boosted = { ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
      increasedDamagePct: { physical: 0.25 } })) };
    expect(damage(boosted)[0]?.amount).toBe(222);
    const skill = fixed('physical');
    expect(damage({ ...skill, playerTeam: skill.playerTeam.map(hero => ({ ...hero,
      increasedDamagePct: { physical: 0.25 } })) })[0]?.amount).toBe(185);
  });
  it('floors effective Attack only after its rank1 bonus', () => {
    const input = snapshot(1);
    expect(damage({ ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
      stats: { ...hero.stats, attack: 99.9 } })) })[0]?.amount).toBe(103);
  });
  it('keeps increased→real bleed combo→crit→resistance→defense→floor ordering', () => {
    const input = snapshot(20);
    const r = damage({ ...input,
      playerTeam: input.playerTeam.map(hero => ({ ...hero, increasedDamagePct: { physical: 0.25 },
        stats: { ...hero.stats, critChance: 1 } })),
      enemyTeam: input.enemyTeam.map(target => ({ ...target, stats: { ...target.stats, defense: 7,
        resistances: { ...target.stats.resistances, physical: 25 } }, statuses: [...target.statuses,
          { id: 'bleed', sourceId: 'fixture', stacks: 1, remaining: -1 }] })) });
    // floor(120 * (1 + .25 + .60) * 1.1 * 2 * .75 - 7) = 359.
    expect(r[0]).toMatchObject({ amount: 359, crit: true, dodged: false });
  });
  it.each(['fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'] as const)(
    'does not apply either bonus to fixed %s', type => {
      const input = fixed(type);
      const extra = { ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
        increasedDamagePct: { [type]: 0.25 } })) };
      expect(damage(input)[0]?.amount).toBe(100);
      expect(damage(extra)[0]?.amount).toBe(125);
      const { mightAura: _aura, ...none } = extra;
      expect(record(extra)).toEqual(record(none));
    });
  it.each([
    { id: 'merc-fielded', kind: 'merc' as const, listed: true, amount: 192 },
    { id: 'merc-unlisted', kind: 'merc' as const, listed: false, amount: 100 },
    { id: 'summon', kind: 'summon' as const, listed: true, amount: 100 },
    { id: 'forged-summon', kind: 'merc' as const, listed: true, amount: 100, summon: true }
  ])('affects only the explicit living fielded merc: $id', fixture => {
    const input = snapshot(20);
    const recipient: CombatUnit = { ...unit(fixture.id, 'player'), kind: fixture.kind,
      ...(fixture.summon ? { summon: true } : {}),
      stats: { ...unit(fixture.id, 'player').stats, attackSpeed: 200 } };
    expect(damage({ ...input, mightAura: projection(20, fixture.listed ? fixture.id : 'other'),
      playerTeam: [...input.playerTeam, recipient] })[0]).toMatchObject({ source: fixture.id, amount: fixture.amount });
  });
  it.each(['stun', 'freeze'])('keeps the fielded merc empowered while the live hero has %s', id => {
    const input = snapshot(20);
    expect(damage({ ...input, mightAura: projection(20, 'merc-fielded'),
      playerTeam: [{ ...unit('hero', 'player'), statuses: [{ id, sourceId: 'fixture', stacks: 1, remaining: -1 }] },
        { ...unit('merc-fielded', 'player'), kind: 'merc' }] })[0])
      .toMatchObject({ source: 'merc-fielded', amount: 192 });
  });
  it('does not empower enemy attacks from an enemy-side projection source', () => {
    const input = snapshot();
    const enemy = { ...unit('enemy-hero', 'enemy'), kind: 'hero' as const,
      stats: { ...unit('enemy-hero', 'enemy').stats, attackSpeed: 200 } };
    const r = damage({ ...input, mightAura: { ...projection(20), sourceHeroId: 'enemy-hero' },
      playerTeam: [{ ...unit('hero', 'player'), life: 1 }], enemyTeam: [enemy] });
    expect(r[0]).toMatchObject({ source: 'enemy-hero', target: 'hero', amount: 100 });
  });
  it('keeps hero-death termination before later merc actions', () => {
    const input = snapshot(20);
    const r = record({ ...input, mightAura: projection(20, 'merc-fielded'),
      playerTeam: [{ ...unit('hero', 'player'), life: 1,
        statuses: [{ id: 'poison', sourceId: 'fixture', stacks: 1, remaining: -1, dotPerStack: 1 }] },
        { ...unit('merc-fielded', 'player'), kind: 'merc' }] });
    expect(r.result.winner).toBe('enemy');
    expect(r.events.filter(e => e.kind === 'action')).toEqual([]);
    expect(r.events).toContainEqual(expect.objectContaining({ kind: 'death', target: 'hero', simClockMs: 1000 }));
    expect(r.events.at(-1)).toMatchObject({ kind: 'end', winner: 'enemy', simClockMs: 1000 });
  });
  it('has no aura cast, mana cost, cooldown, status or cadence event', () => {
    const control = record(snapshot()); const active = record(snapshot(20));
    expect(active.events.filter(e => e.kind !== 'damage')).toEqual(control.events.filter(e => e.kind !== 'damage'));
    expect(active.result.playerTeam).toEqual(control.result.playerTeam);
    expect(active.events.some(e => e.kind === 'action' && e.skillId === 'paladin.might')).toBe(false);
  });
  it('does not infer selection from allocated aliases, combo or active buff markers', () => {
    const input = snapshot();
    expect(damage({ ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
      skillLevels: { 'paladin.might': 20 }, skillOrder: ['paladin.might', 'aura-might'],
      activeBuffIds: ['paladin.might', 'aura-might'] })) })[0]?.amount).toBe(100);
  });
});

// Complete actual seed7 input/output captured at e1c976d before runtime implementation.
const prepatch = {
  "input": {
    "seed": 7,
    "playerTeam": [
      {
        "id": "hero",
        "name": "hero",
        "side": "player",
        "kind": "hero",
        "level": 24,
        "tier": "trash",
        "life": 100,
        "mana": 50,
        "stats": {
          "life": 100,
          "lifeMax": 100,
          "mana": 100,
          "manaMax": 100,
          "attack": 100,
          "defense": 0,
          "magicResist": 0,
          "attackSpeed": 100,
          "critChance": 0,
          "critDamage": 2,
          "physDodge": 0,
          "magicDodge": 0,
          "magicFind": 0,
          "goldFind": 0,
          "resistances": {
            "physical": 0,
            "fire": 0,
            "cold": 0,
            "lightning": 0,
            "arcane": 0,
            "poison": 0
          }
        },
        "statuses": [],
        "cooldowns": {},
        "skillOrder": [],
        "activeBuffIds": [],
        "enraged": false
      }
    ],
    "enemyTeam": [
      {
        "id": "target",
        "name": "target",
        "side": "enemy",
        "kind": "monster",
        "level": 24,
        "tier": "trash",
        "life": 1,
        "mana": 50,
        "stats": {
          "life": 100,
          "lifeMax": 100,
          "mana": 100,
          "manaMax": 100,
          "attack": 100,
          "defense": 0,
          "magicResist": 0,
          "attackSpeed": 100,
          "critChance": 0,
          "critDamage": 2,
          "physDodge": 0,
          "magicDodge": 0,
          "magicFind": 0,
          "goldFind": 0,
          "resistances": {
            "physical": 0,
            "fire": 0,
            "cold": 0,
            "lightning": 0,
            "arcane": 0,
            "poison": 0
          }
        },
        "statuses": [
          {
            "id": "stun",
            "sourceId": "fixture",
            "stacks": 1,
            "remaining": -1
          }
        ],
        "cooldowns": {},
        "skillOrder": [],
        "activeBuffIds": [],
        "enraged": false
      }
    ]
  },
  "actual": {
    "events": [
      {
        "kind": "turn-start",
        "turn": 1,
        "simClockMs": 0,
        "uiDelayMs": 200
      },
      {
        "kind": "stunned",
        "target": "target",
        "simClockMs": 1700,
        "uiDelayMs": 1700
      },
      {
        "kind": "action",
        "actor": "hero",
        "skillId": null,
        "simClockMs": 1700,
        "uiDelayMs": 50
      },
      {
        "kind": "damage",
        "source": "hero",
        "target": "target",
        "damageType": "physical",
        "amount": 100,
        "crit": false,
        "dodged": false,
        "simClockMs": 1700,
        "uiDelayMs": 50
      },
      {
        "kind": "death",
        "target": "target",
        "simClockMs": 1700,
        "uiDelayMs": 50
      },
      {
        "kind": "end",
        "winner": "player",
        "simClockMs": 1700,
        "uiDelayMs": 50
      }
    ],
    "result": {
      "events": [
        {
          "kind": "turn-start",
          "turn": 1
        },
        {
          "kind": "stunned",
          "target": "target"
        },
        {
          "kind": "action",
          "actor": "hero",
          "skillId": null
        },
        {
          "kind": "damage",
          "source": "hero",
          "target": "target",
          "damageType": "physical",
          "amount": 100,
          "crit": false,
          "dodged": false
        },
        {
          "kind": "death",
          "target": "target"
        },
        {
          "kind": "end",
          "winner": "player"
        }
      ],
      "winner": "player",
      "playerTeam": [
        {
          "id": "hero",
          "name": "hero",
          "side": "player",
          "kind": "hero",
          "level": 24,
          "tier": "trash",
          "life": 100,
          "mana": 50,
          "stats": {
            "life": 100,
            "lifeMax": 100,
            "mana": 100,
            "manaMax": 100,
            "attack": 100,
            "defense": 0,
            "magicResist": 0,
            "attackSpeed": 100,
            "critChance": 0,
            "critDamage": 2,
            "physDodge": 0,
            "magicDodge": 0,
            "magicFind": 0,
            "goldFind": 0,
            "resistances": {
              "physical": 0,
              "fire": 0,
              "cold": 0,
              "lightning": 0,
              "arcane": 0,
              "poison": 0
            }
          },
          "statuses": [],
          "cooldowns": {},
          "skillOrder": [],
          "activeBuffIds": [],
          "enraged": false,
          "gridPosition": {
            "row": 1,
            "col": 1
          }
        }
      ],
      "enemyTeam": [
        {
          "id": "target",
          "name": "target",
          "side": "enemy",
          "kind": "monster",
          "level": 24,
          "tier": "trash",
          "life": 0,
          "mana": 50,
          "stats": {
            "life": 100,
            "lifeMax": 100,
            "mana": 100,
            "manaMax": 100,
            "attack": 100,
            "defense": 0,
            "magicResist": 0,
            "attackSpeed": 100,
            "critChance": 0,
            "critDamage": 2,
            "physDodge": 0,
            "magicDodge": 0,
            "magicFind": 0,
            "goldFind": 0,
            "resistances": {
              "physical": 0,
              "fire": 0,
              "cold": 0,
              "lightning": 0,
              "arcane": 0,
              "poison": 0
            }
          },
          "statuses": [
            {
              "id": "stun",
              "sourceId": "fixture",
              "stacks": 1,
              "remaining": -1
            }
          ],
          "cooldowns": {},
          "skillOrder": [],
          "activeBuffIds": [],
          "enraged": false,
          "gridPosition": {
            "row": 1,
            "col": 1
          }
        }
      ],
      "rounds": 1
    }
  }
} satisfies { input: CombatSnapshot; actual: RecordedBattleResult };
it('preserves the complete unaffected prepatch recording including times, delays and final teams', () => {
  expect(legacyRecording(record(prepatch.input))).toEqual(prepatch.actual);
});
