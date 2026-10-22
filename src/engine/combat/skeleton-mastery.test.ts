import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { legacyRecording } from '@/test/combat-oracle';
import { getSkill, loadDefaultSkills, registerSkill, resetRegistry } from '../skills/registry';
import { buildSummon, getSummon, registerSummon } from '../skills/summons';
import { runBattle, runBattleRecorded, type CombatSnapshot, type BattleEvent } from './combat';
import type { CombatUnit } from './types';

interface ProjectedSnapshot extends CombatSnapshot {
  readonly skeletonMastery?: { readonly sourceHeroId: string; readonly rank: number; readonly maxRank: number;
    readonly summonLifePct: number; readonly summonAttackPct: number; readonly summonDefensePct: number };
}
const projection = (rank: number): NonNullable<ProjectedSnapshot['skeletonMastery']> =>
  ({ sourceHeroId: 'hero', rank, maxRank: 20, summonLifePct: rank * .04,
    summonAttackPct: rank * .02, summonDefensePct: rank * .01 });
function unit(id: string, side: CombatUnit['side']): CombatUnit {
  return { id, name: id, side, kind: side === 'player' ? 'hero' : 'monster', level: 24, tier: 'trash',
    life: 10000, mana: 60, stats: { life: 10000, lifeMax: 10000, mana: 60, manaMax: 60,
      attack: 1, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false };
}
function snapshot(rank = 0, template = 'skeleton'): ProjectedSnapshot {
  const skill = template === 'skeletal_mage' ? 'necromancer.raise_skeletal_mage' : 'necromancer.raise_skeleton';
  return { seed: 7, playerTeam: [{ ...unit('hero', 'player'), skillOrder: [skill], skillLevels: { [skill]: 6 },
    gridPosition: { row: 0, col: 0 }, summonGridPositions: [{ row: 1, col: 0 }, { row: 1, col: 1 }] }],
    enemyTeam: [{ ...unit('target', 'enemy'), life: 1000000,
      stats: { ...unit('target', 'enemy').stats, life: 1000000, lifeMax: 1000000 },
      statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] }],
    ...(rank > 0 ? { skeletonMastery: projection(rank) } : {}) };
}
function record(input: ProjectedSnapshot) {
  const before = structuredClone(input);
  const result = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattle(input)).toEqual(result.result);
  expect(runBattleRecorded(input)).toEqual(result);
  for (const out of [...result.result.playerTeam, ...result.result.enemyTeam]) {
    expect(out).not.toHaveProperty('skeletonMastery');
  }
  return result;
}
function summons(result: ReturnType<typeof record>) {
  return result.events.filter((event): event is Extract<BattleEvent, { kind: 'summon' }> &
    { readonly simClockMs: number; readonly uiDelayMs: number } => event.kind === 'summon');
}
function first(result: ReturnType<typeof record>) {
  const value = summons(result)[0]?.unit;
  if (!value) throw new Error('Missing actual summon event');
  return value;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

// Captured on unchanged production at 47023e1; complete input and recording.
const PREPATCH = {
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
        "life": 10000,
        "mana": 60,
        "stats": {
          "life": 10000,
          "lifeMax": 10000,
          "mana": 60,
          "manaMax": 60,
          "attack": 1,
          "defense": 0,
          "magicResist": 0,
          "attackSpeed": 100,
          "critChance": 0,
          "critDamage": 1.5,
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
        "skillOrder": [
          "necromancer.raise_skeleton"
        ],
        "activeBuffIds": [],
        "enraged": false,
        "skillLevels": {
          "necromancer.raise_skeleton": 6
        },
        "gridPosition": {
          "row": 0,
          "col": 0
        },
        "summonGridPositions": [
          {
            "row": 1,
            "col": 0
          },
          {
            "row": 1,
            "col": 1
          }
        ]
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
        "mana": 60,
        "stats": {
          "life": 1,
          "lifeMax": 1,
          "mana": 60,
          "manaMax": 60,
          "attack": 1,
          "defense": 0,
          "magicResist": 0,
          "attackSpeed": 100,
          "critChance": 0,
          "critDamage": 1.5,
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
        "kind": "action",
        "actor": "hero",
        "skillId": "necromancer.raise_skeleton",
        "simClockMs": 0,
        "uiDelayMs": 50
      },
      {
        "kind": "mana",
        "target": "hero",
        "mana": 45,
        "reason": "cast",
        "simClockMs": 0,
        "uiDelayMs": 50
      },
      {
        "kind": "summon",
        "owner": "hero",
        "summonId": "skeleton",
        "unit": {
          "id": "hero-summon-skeleton-1",
          "name": "Skeleton Warrior",
          "side": "player",
          "level": 24,
          "tier": "trash",
          "stats": {
            "life": 162,
            "lifeMax": 162,
            "mana": 0,
            "manaMax": 0,
            "attack": 35,
            "defense": 19,
            "magicResist": 0,
            "attackSpeed": 70,
            "critChance": 0.05,
            "critDamage": 1.5,
            "physDodge": 0.05,
            "magicDodge": 0.05,
            "magicFind": 0,
            "goldFind": 0,
            "resistances": {
              "fire": 0,
              "cold": 0,
              "lightning": 0,
              "poison": 0,
              "arcane": 0,
              "physical": 0
            }
          },
          "life": 162,
          "mana": 0,
          "statuses": [],
          "cooldowns": {},
          "skillOrder": [],
          "activeBuffIds": [],
          "enraged": false,
          "summonedAdds": false,
          "summon": true,
          "kind": "summon",
          "summonOwnerId": "hero",
          "summonTemplateId": "skeleton",
          "gridPosition": {
            "row": 1,
            "col": 0
          }
        },
        "simClockMs": 0,
        "uiDelayMs": 50
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
        "skillId": "necromancer.raise_skeleton",
        "simClockMs": 1700,
        "uiDelayMs": 50
      },
      {
        "kind": "mana",
        "target": "hero",
        "mana": 30,
        "reason": "cast",
        "simClockMs": 1700,
        "uiDelayMs": 50
      },
      {
        "kind": "summon",
        "owner": "hero",
        "summonId": "skeleton",
        "unit": {
          "id": "hero-summon-skeleton-2",
          "name": "Skeleton Warrior",
          "side": "player",
          "level": 24,
          "tier": "trash",
          "stats": {
            "life": 162,
            "lifeMax": 162,
            "mana": 0,
            "manaMax": 0,
            "attack": 35,
            "defense": 19,
            "magicResist": 0,
            "attackSpeed": 70,
            "critChance": 0.05,
            "critDamage": 1.5,
            "physDodge": 0.05,
            "magicDodge": 0.05,
            "magicFind": 0,
            "goldFind": 0,
            "resistances": {
              "fire": 0,
              "cold": 0,
              "lightning": 0,
              "poison": 0,
              "arcane": 0,
              "physical": 0
            }
          },
          "life": 162,
          "mana": 0,
          "statuses": [],
          "cooldowns": {},
          "skillOrder": [],
          "activeBuffIds": [],
          "enraged": false,
          "summonedAdds": false,
          "summon": true,
          "kind": "summon",
          "summonOwnerId": "hero",
          "summonTemplateId": "skeleton",
          "gridPosition": {
            "row": 1,
            "col": 1
          }
        },
        "simClockMs": 1700,
        "uiDelayMs": 50
      },
      {
        "kind": "action",
        "actor": "hero-summon-skeleton-1",
        "skillId": null,
        "simClockMs": 1940,
        "uiDelayMs": 240
      },
      {
        "kind": "damage",
        "source": "hero-summon-skeleton-1",
        "target": "target",
        "damageType": "physical",
        "amount": 35,
        "crit": false,
        "dodged": false,
        "simClockMs": 1940,
        "uiDelayMs": 50
      },
      {
        "kind": "death",
        "target": "target",
        "simClockMs": 1940,
        "uiDelayMs": 50
      },
      {
        "kind": "end",
        "winner": "player",
        "simClockMs": 1940,
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
          "kind": "action",
          "actor": "hero",
          "skillId": "necromancer.raise_skeleton"
        },
        {
          "kind": "mana",
          "target": "hero",
          "mana": 45,
          "reason": "cast"
        },
        {
          "kind": "summon",
          "owner": "hero",
          "summonId": "skeleton",
          "unit": {
            "id": "hero-summon-skeleton-1",
            "name": "Skeleton Warrior",
            "side": "player",
            "level": 24,
            "tier": "trash",
            "stats": {
              "life": 162,
              "lifeMax": 162,
              "mana": 0,
              "manaMax": 0,
              "attack": 35,
              "defense": 19,
              "magicResist": 0,
              "attackSpeed": 70,
              "critChance": 0.05,
              "critDamage": 1.5,
              "physDodge": 0.05,
              "magicDodge": 0.05,
              "magicFind": 0,
              "goldFind": 0,
              "resistances": {
                "fire": 0,
                "cold": 0,
                "lightning": 0,
                "poison": 0,
                "arcane": 0,
                "physical": 0
              }
            },
            "life": 162,
            "mana": 0,
            "statuses": [],
            "cooldowns": {},
            "skillOrder": [],
            "activeBuffIds": [],
            "enraged": false,
            "summonedAdds": false,
            "summon": true,
            "kind": "summon",
            "summonOwnerId": "hero",
            "summonTemplateId": "skeleton",
            "gridPosition": {
              "row": 1,
              "col": 0
            }
          }
        },
        {
          "kind": "stunned",
          "target": "target"
        },
        {
          "kind": "action",
          "actor": "hero",
          "skillId": "necromancer.raise_skeleton"
        },
        {
          "kind": "mana",
          "target": "hero",
          "mana": 30,
          "reason": "cast"
        },
        {
          "kind": "summon",
          "owner": "hero",
          "summonId": "skeleton",
          "unit": {
            "id": "hero-summon-skeleton-2",
            "name": "Skeleton Warrior",
            "side": "player",
            "level": 24,
            "tier": "trash",
            "stats": {
              "life": 162,
              "lifeMax": 162,
              "mana": 0,
              "manaMax": 0,
              "attack": 35,
              "defense": 19,
              "magicResist": 0,
              "attackSpeed": 70,
              "critChance": 0.05,
              "critDamage": 1.5,
              "physDodge": 0.05,
              "magicDodge": 0.05,
              "magicFind": 0,
              "goldFind": 0,
              "resistances": {
                "fire": 0,
                "cold": 0,
                "lightning": 0,
                "poison": 0,
                "arcane": 0,
                "physical": 0
              }
            },
            "life": 162,
            "mana": 0,
            "statuses": [],
            "cooldowns": {},
            "skillOrder": [],
            "activeBuffIds": [],
            "enraged": false,
            "summonedAdds": false,
            "summon": true,
            "kind": "summon",
            "summonOwnerId": "hero",
            "summonTemplateId": "skeleton",
            "gridPosition": {
              "row": 1,
              "col": 1
            }
          }
        },
        {
          "kind": "action",
          "actor": "hero-summon-skeleton-1",
          "skillId": null
        },
        {
          "kind": "damage",
          "source": "hero-summon-skeleton-1",
          "target": "target",
          "damageType": "physical",
          "amount": 35,
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
          "life": 10000,
          "mana": 30,
          "stats": {
            "life": 10000,
            "lifeMax": 10000,
            "mana": 60,
            "manaMax": 60,
            "attack": 1,
            "defense": 0,
            "magicResist": 0,
            "attackSpeed": 100,
            "critChance": 0,
            "critDamage": 1.5,
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
          "skillOrder": [
            "necromancer.raise_skeleton"
          ],
          "activeBuffIds": [],
          "enraged": false,
          "skillLevels": {
            "necromancer.raise_skeleton": 6
          },
          "gridPosition": {
            "row": 0,
            "col": 0
          },
          "summonGridPositions": [
            {
              "row": 1,
              "col": 0
            },
            {
              "row": 1,
              "col": 1
            }
          ]
        },
        {
          "id": "hero-summon-skeleton-1",
          "name": "Skeleton Warrior",
          "side": "player",
          "level": 24,
          "tier": "trash",
          "stats": {
            "life": 162,
            "lifeMax": 162,
            "mana": 0,
            "manaMax": 0,
            "attack": 35,
            "defense": 19,
            "magicResist": 0,
            "attackSpeed": 70,
            "critChance": 0.05,
            "critDamage": 1.5,
            "physDodge": 0.05,
            "magicDodge": 0.05,
            "magicFind": 0,
            "goldFind": 0,
            "resistances": {
              "fire": 0,
              "cold": 0,
              "lightning": 0,
              "poison": 0,
              "arcane": 0,
              "physical": 0
            }
          },
          "life": 162,
          "mana": 0,
          "statuses": [],
          "cooldowns": {},
          "skillOrder": [],
          "activeBuffIds": [],
          "enraged": false,
          "summonedAdds": false,
          "summon": true,
          "kind": "summon",
          "summonOwnerId": "hero",
          "summonTemplateId": "skeleton",
          "gridPosition": {
            "row": 1,
            "col": 0
          }
        },
        {
          "id": "hero-summon-skeleton-2",
          "name": "Skeleton Warrior",
          "side": "player",
          "level": 24,
          "tier": "trash",
          "stats": {
            "life": 162,
            "lifeMax": 162,
            "mana": 0,
            "manaMax": 0,
            "attack": 35,
            "defense": 19,
            "magicResist": 0,
            "attackSpeed": 70,
            "critChance": 0.05,
            "critDamage": 1.5,
            "physDodge": 0.05,
            "magicDodge": 0.05,
            "magicFind": 0,
            "goldFind": 0,
            "resistances": {
              "fire": 0,
              "cold": 0,
              "lightning": 0,
              "poison": 0,
              "arcane": 0,
              "physical": 0
            }
          },
          "life": 162,
          "mana": 0,
          "statuses": [],
          "cooldowns": {},
          "skillOrder": [],
          "activeBuffIds": [],
          "enraged": false,
          "summonedAdds": false,
          "summon": true,
          "kind": "summon",
          "summonOwnerId": "hero",
          "summonTemplateId": "skeleton",
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
          "mana": 60,
          "stats": {
            "life": 1,
            "lifeMax": 1,
            "mana": 60,
            "manaMax": 60,
            "attack": 1,
            "defense": 0,
            "magicResist": 0,
            "attackSpeed": 100,
            "critChance": 0,
            "critDamage": 1.5,
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
} as const;

// PREPATCH remains the original canonical recording captured at 47023e1 above.
// The compatibility replay changes only exact skill-identity strings (including
// object keys); all resources, IDs, positions, timestamps and other events stay literal.
const LEGACY_PREPATCH = JSON.parse(JSON.stringify(PREPATCH).replaceAll(
  '"necromancer.raise_skeleton"', '"fixture.mastery-skeleton"'
)) as { readonly input: CombatSnapshot; readonly actual: ReturnType<typeof runBattleRecorded> };

describe('P07a05B creation-only native Skeleton Mastery', () => {
  it('preserves every prepatch recording field except explicit synthetic skill identity with no projection and explicit rank zero', () => {
    const source = getSkill('necromancer.raise_skeleton');
    if (!source) throw new Error('Missing actual Skeleton source');
    registerSkill({ ...source, id: 'fixture.mastery-skeleton', archetype: 'fixture' });
    expect(legacyRecording(record(LEGACY_PREPATCH.input))).toEqual(LEGACY_PREPATCH.actual);
    expect(legacyRecording(record({ ...LEGACY_PREPATCH.input, skeletonMastery: projection(0) }))).toEqual(LEGACY_PREPATCH.actual);
    const actual = record(LEGACY_PREPATCH.input);
    const spawned = summons(actual);
    expect(spawned.map(e => [e.unit.id, e.simClockMs, e.unit.gridPosition])).toEqual([
      ['hero-summon-skeleton-1', 0, { row: 1, col: 0 }],
      ['hero-summon-skeleton-2', 1700, { row: 1, col: 1 }]
    ]);
    expect(actual.events.filter(e => e.kind === 'mana')).toEqual([
      { kind: 'mana', target: 'hero', mana: 45, reason: 'cast', simClockMs: 0, uiDelayMs: 50 },
      { kind: 'mana', target: 'hero', mana: 30, reason: 'cast', simClockMs: 1700, uiDelayMs: 50 }
    ]);
    expect(getSkill('necromancer.raise_skeleton')).toMatchObject({ manaCost: 15, cooldown: 1 });
    expect(actual.result.playerTeam.find(u => u.id === 'hero')?.cooldowns).toEqual({});
  });

  it.each([
    { template: 'skeleton', rank: 0, life: 162, attack: 35, defense: 19 },
    { template: 'skeleton', rank: 1, life: 168.48, attack: 35.7, defense: 19.19 },
    { template: 'skeleton', rank: 20, life: 291.6, attack: 49, defense: 22.8 },
    { template: 'skeletal_mage', rank: 0, life: 123, attack: 45, defense: 10 },
    { template: 'skeletal_mage', rank: 1, life: 127.92, attack: 45.9, defense: 10.1 },
    { template: 'skeletal_mage', rank: 20, life: 221.4, attack: 63, defense: 12 }
  ])('rank6 $template Mastery$rank creates literal stats', values => {
    const active = first(record(snapshot(values.rank, values.template)));
    const control = first(record(snapshot(0, values.template)));
    expect.soft(active.stats.lifeMax).toBeCloseTo(values.life, 12);
    expect.soft(active.stats.life).toBeCloseTo(values.life, 12);
    expect.soft(active.life).toBeCloseTo(values.life, 12);
    expect.soft(active.stats.attack).toBeCloseTo(values.attack, 12);
    expect.soft(active.stats.defense).toBeCloseTo(values.defense, 12);
    expect({ ...active, life: control.life, stats: { ...active.stats, lifeMax: control.stats.lifeMax,
      life: control.stats.life, attack: control.stats.attack, defense: control.stats.defense } }).toEqual(control);
    if (values.template === 'skeletal_mage') expect(active.stats.magicDodge).toBe(.09);
  });

  it('consumes retained Attack in actual neutral basic hits49 vs35', () => {
    for (const [rank, amount] of [[0, 35], [20, 49]] as const) {
      const actual = record(snapshot(rank)); const summon = first(actual);
      const hit = actual.events.find(event => event.kind === 'damage' && event.source === summon.id &&
        event.target === 'target' && !event.dodged && !event.crit);
      expect(hit).toMatchObject({ kind: 'damage', damageType: 'physical', amount });
    }
  });

  it('consumes fractional Defense19.19 against neutral100 for80 and loses real life after spawning full', () => {
    registerSkill({ id: 'fixture.skeleton-hit', archetype: 'fixture', target: 'all-enemies',
      minLevel: 1, cooldown: 100, manaCost: 0,
      effects: [{ kind: 'damage', damageType: 'physical', base: [100, 100] }] });
    for (const [rank, life, amount] of [[0, 162, 81], [1, 168.48, 80]] as const) {
      const base = snapshot(rank);
      const actual = record({ ...base, enemyTeam: base.enemyTeam.map(enemy => ({ ...enemy,
        statuses: [], skillOrder: ['fixture.skeleton-hit'], stats: { ...enemy.stats, attack: 0 } })) });
      const initial = first(actual);
      const hits = actual.events.filter(event => event.kind === 'damage' && event.target === initial.id);
      expect(hits).toContainEqual(expect.objectContaining({ amount, damageType: 'physical', dodged: false }));
      expect.soft(initial.life).toBeCloseTo(life, 12);
      expect.soft(initial.stats.life).toBeCloseTo(life, 12);
      const final = actual.result.playerTeam.find(u => u.id === initial.id);
      if (!final) throw new Error('Missing final spawned skeleton');
      const lost = hits.reduce((sum, event) => sum + (event.kind === 'damage' ? event.amount : 0), 0);
      expect(lost).toBeGreaterThan(0);
      expect(final.life).toBeLessThan(life);
      expect(final.life).toBeCloseTo(life - lost, 12);
      expect(final.stats.lifeMax).toBeCloseTo(life, 12);
      expect(actual.events.filter(e => e.kind === 'heal')).toEqual([]);
    }
  });

  it('copies entry primitives before a factory mutates the caller projection during the first spawn', () => {
    const factory = getSummon('skeleton');
    if (!factory) throw new Error('Missing skeleton factory');
    const mutable = { ...projection(1) };
    const input = { ...snapshot(1), skeletonMastery: mutable };
    registerSummon('skeleton', owner => {
      mutable.rank = 20; mutable.summonLifePct = 9;
      mutable.summonAttackPct = 8; mutable.summonDefensePct = 7;
      return factory(owner);
    });
    try {
      // The fixture deliberately mutates its caller: ordinary nonmutation is checked by record() elsewhere.
      const actual = runBattleRecorded(input);
      expect(mutable.rank).toBe(20);
      expect(Object.isFrozen(mutable)).toBe(false);
      const spawned = summons(actual);
      expect(spawned.length).toBeGreaterThanOrEqual(2);
      for (const event of spawned) {
        expect.soft(event.unit.stats.lifeMax).toBeCloseTo(168.48, 12);
        expect.soft(event.unit.stats.attack).toBeCloseTo(35.7, 12);
        expect.soft(event.unit.stats.defense).toBeCloseTo(19.19, 12);
      }
    } finally { registerSummon('skeleton', factory); }
  });

  it.each(['clay_golem', 'blood_golem', 'iron_golem', 'fire_golem', 'revived',
    'valkyrie', 'raven', 'spirit_wolf', 'dire_wolf', 'grizzly', 'poison_creeper',
    'carrion_vine', 'solar_creeper', 'shadow_warrior', 'shadow_master'])(
    'preserves a complete recording for excluded template%s', template => {
      registerSkill({ id: 'fixture.mastery-other', archetype: 'fixture', target: 'summon',
        minLevel: 1, cooldown: 100, manaCost: 0, summonOnStart: true,
        effects: [{ kind: 'summon', summonId: template, maxCount: 1 }] });
      const base = snapshot(); const input = { ...base,
        playerTeam: base.playerTeam.map(owner => ({ ...owner, skillOrder: ['fixture.mastery-other'] })) };
      const control = record(input);
      expect(summons(control).map(e => e.summonId)).toContain(template);
      expect(record({ ...input, skeletonMastery: projection(20) })).toEqual(control);
    });

  it.each([
    { sourceHeroId: 'other' }, { rank: 0 }, { rank: -1 }, { rank: 1.5 }, { rank: NaN },
    { rank: Infinity }, { rank: 21 }, { maxRank: 0 }, { maxRank: 1.5 }, { maxRank: Infinity },
    { summonLifePct: -1 }, { summonLifePct: NaN }, { summonLifePct: Infinity },
    { summonAttackPct: -1 }, { summonAttackPct: NaN }, { summonAttackPct: Infinity },
    { summonDefensePct: -1 }, { summonDefensePct: NaN }, { summonDefensePct: Infinity }
  ])('invalid projection preserves complete unboosted recording%j', fields => {
    const input = snapshot();
    expect(record({ ...input, skeletonMastery: { ...projection(1), ...fields } })).toEqual(record(input));
  });

  it.each([
    { kind: 'merc' as const }, { kind: 'summon' as const }, { summon: true },
    { ownerId: '' }, { ownerId: 'other' }, { summonOwnerId: '' }, { summonOwnerId: 'other' }
  ])('does not empower a nonhero or owned/forged source%j', fields => {
    const base = snapshot(); const input = { ...base, playerTeam: base.playerTeam.map(u => ({ ...u, ...fields })) };
    expect(record({ ...input, skeletonMastery: projection(20) })).toEqual(record(input));
  });

  it('does not empower enemy-side summons even with matching source identity', () => {
    const base = snapshot(); const hero = base.playerTeam[0];
    if (!hero) throw new Error('Missing fixture hero');
    const enemy = { ...hero, side: 'enemy' as const, kind: 'hero' as const };
    const target = { ...unit('target', 'player'), statuses: [{ id: 'stun', sourceId: 'fixture', stacks: 1, remaining: -1 }] };
    const input = { ...base, playerTeam: [target], enemyTeam: [enemy] };
    const control = record(input);
    expect(summons(control).length).toBeGreaterThan(0);
    expect(record({ ...input, skeletonMastery: projection(20) })).toEqual(control);
  });

  it('never infers a projection from allocations, combo or markers', () => {
    const base = snapshot(); const input = { ...base, playerTeam: base.playerTeam.map(hero => ({ ...hero,
      skillLevels: { ...hero.skillLevels, 'necromancer.skeleton_mastery': 20 },
      skillOrder: [...hero.skillOrder, 'necromancer.skeleton_mastery'],
      activeBuffIds: ['necromancer.skeleton_mastery'] })) };
    expect(first(record(input)).stats).toEqual(first(record(base)).stats);
  });

  it('does not retrofit or refill preloaded damaged summons', () => {
    const base = snapshot(20); const owner = base.playerTeam[0];
    if (!owner) throw new Error('Missing fixture hero');
    const built = buildSummon(owner, 'skeleton', { skillLevel: 6, statScaling: { lifeMax: 10, attack: 2, defense: 1 } });
    if (!built) throw new Error('Missing skeleton template');
    const preloaded = { ...built, id: 'preloaded', life: 17 };
    const actual = record({ ...base, playerTeam: [{ ...owner, skillOrder: [] }, preloaded] });
    const final = actual.result.playerTeam.find(u => u.id === preloaded.id);
    expect(final?.stats).toEqual(preloaded.stats);
    expect(final?.life).toBe(17);
    expect(summons(actual)).toEqual([]);
  });
});
