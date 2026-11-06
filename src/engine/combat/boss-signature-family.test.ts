import { afterEach, beforeEach, expect, it } from 'vitest';
import { monsters } from '../../data';
import { createRng } from '../rng';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit, MonsterTier } from './types';

const cases = [
  {
    "id": "monsters/act1.corpsefire",
    "act": 1,
    "base": 28.8,
    "growth": 4.5,
    "values": [
      46,
      125,
      687
    ],
    "skills": [
      "monster-fire-breath"
    ],
    "first": [
      [
        1860,
        "monster.fire_breath"
      ],
      [
        3720,
        null
      ],
      [
        5580,
        "monster.fire_breath"
      ],
      [
        7440,
        null
      ],
      [
        9300,
        "monster.fire_breath"
      ],
      [
        11160,
        null
      ],
      [
        13020,
        "monster.fire_breath"
      ],
      [
        14880,
        null
      ]
    ],
    "ordinary": true
  },
  {
    "id": "monsters/act1.rakanishu",
    "act": 1,
    "base": 32,
    "growth": 5,
    "values": [
      51,
      139,
      763
    ],
    "skills": [
      "monster-lightning-bolt",
      "monster-charge"
    ],
    "first": [
      [
        1620,
        "monster.lightning_bolt"
      ],
      [
        3240,
        "monster.charge"
      ],
      [
        4860,
        "monster.lightning_bolt"
      ],
      [
        6480,
        null
      ],
      [
        8100,
        "monster.lightning_bolt"
      ],
      [
        9720,
        "monster.charge"
      ],
      [
        11340,
        "monster.lightning_bolt"
      ],
      [
        12960,
        null
      ]
    ],
    "ordinary": true
  },
  {
    "id": "monsters/act1.coldcrow",
    "act": 1,
    "base": 35.2,
    "growth": 5.5,
    "values": [
      56,
      153,
      840
    ],
    "skills": [
      "monster-frost-bolt",
      "monster-frost-nova"
    ],
    "first": [
      [
        1540,
        "monster.frost_bolt"
      ],
      [
        3080,
        "monster.frost_nova"
      ],
      [
        4620,
        "monster.frost_bolt"
      ],
      [
        6160,
        "monster.frost_nova"
      ],
      [
        7700,
        "monster.frost_bolt"
      ],
      [
        9240,
        "monster.frost_nova"
      ],
      [
        10780,
        "monster.frost_bolt"
      ],
      [
        12320,
        "monster.frost_nova"
      ]
    ],
    "ordinary": false
  },
  {
    "id": "monsters/act1.treehead-woodfist",
    "act": 1,
    "base": 40,
    "growth": 6.25,
    "values": [
      64,
      174,
      954
    ],
    "skills": [
      "monster-leap-attack",
      "monster-enrage"
    ],
    "first": [
      [
        1820,
        "monster.leap_attack"
      ],
      [
        3640,
        "monster.enrage"
      ],
      [
        5460,
        "monster.leap_attack"
      ],
      [
        7280,
        null
      ],
      [
        9100,
        "monster.leap_attack"
      ],
      [
        10920,
        "monster.enrage"
      ],
      [
        12740,
        "monster.leap_attack"
      ],
      [
        14560,
        null
      ]
    ],
    "ordinary": true
  },
  {
    "id": "monsters/act1.pitspawn-fouldog",
    "act": 1,
    "base": 35.2,
    "growth": 5.5,
    "values": [
      56,
      153,
      840
    ],
    "skills": [
      "monster-poison-spit",
      "monster-rend"
    ],
    "first": [
      [
        1460,
        "monster.poison_spit"
      ],
      [
        2920,
        "monster.rend"
      ],
      [
        4380,
        "monster.poison_spit"
      ],
      [
        5840,
        "monster.rend"
      ],
      [
        7300,
        "monster.poison_spit"
      ],
      [
        8760,
        "monster.rend"
      ],
      [
        10220,
        "monster.poison_spit"
      ],
      [
        11680,
        "monster.rend"
      ]
    ],
    "ordinary": false
  },
  {
    "id": "monsters/act1.the-countess",
    "act": 1,
    "base": 13,
    "growth": 2,
    "values": [
      21,
      56,
      306
    ],
    "skills": [
      "monster-fire-bolt",
      "monster-fire-ball"
    ],
    "first": [
      [
        1660,
        "monster.fire_bolt"
      ],
      [
        3320,
        "monster.fire_ball"
      ],
      [
        4980,
        "monster.fire_bolt"
      ],
      [
        6640,
        "monster.fire_ball"
      ],
      [
        8300,
        "monster.fire_bolt"
      ],
      [
        9960,
        "monster.fire_ball"
      ],
      [
        11620,
        "monster.fire_bolt"
      ],
      [
        13280,
        "monster.fire_ball"
      ]
    ],
    "ordinary": false
  },
  {
    "id": "monsters/act1.griswold",
    "act": 1,
    "base": 40,
    "growth": 6.25,
    "values": [
      64,
      174,
      954
    ],
    "skills": [
      "monster-charge",
      "monster-rend"
    ],
    "first": [
      [
        1740,
        "monster.charge"
      ],
      [
        3480,
        "monster.rend"
      ],
      [
        5220,
        null
      ],
      [
        6960,
        "monster.charge"
      ],
      [
        8700,
        "monster.rend"
      ],
      [
        10440,
        null
      ],
      [
        12180,
        "monster.charge"
      ],
      [
        13920,
        "monster.rend"
      ]
    ],
    "ordinary": true
  },
  {
    "id": "monsters/act1.the-smith",
    "act": 1,
    "base": 40,
    "growth": 6.25,
    "values": [
      64,
      174,
      954
    ],
    "skills": [
      "monster-leap-attack",
      "monster-enrage"
    ],
    "first": [
      [
        1780,
        "monster.leap_attack"
      ],
      [
        3560,
        "monster.enrage"
      ],
      [
        5340,
        "monster.leap_attack"
      ],
      [
        7120,
        null
      ],
      [
        8900,
        "monster.leap_attack"
      ],
      [
        10680,
        "monster.enrage"
      ],
      [
        12460,
        "monster.leap_attack"
      ],
      [
        14240,
        null
      ]
    ],
    "ordinary": true
  },
  {
    "id": "monsters/act1.andariel",
    "act": 1,
    "base": 40,
    "growth": 6.25,
    "values": [
      64,
      174,
      954
    ],
    "skills": [
      "monster-poison-spit",
      "monster-poison-cloud",
      "monster-charge"
    ],
    "first": [
      [
        1620,
        "monster.poison_spit"
      ],
      [
        3240,
        "monster.poison_cloud"
      ],
      [
        4860,
        "monster.poison_spit"
      ],
      [
        6480,
        "monster.poison_cloud"
      ],
      [
        8100,
        "monster.poison_spit"
      ],
      [
        9720,
        "monster.poison_cloud"
      ],
      [
        11340,
        "monster.poison_spit"
      ],
      [
        12960,
        "monster.poison_cloud"
      ]
    ],
    "ordinary": false
  },
  {
    "id": "monsters/act1.cow-king",
    "act": 1,
    "base": 40,
    "growth": 6.25,
    "values": [
      64,
      174,
      954
    ],
    "skills": [
      "monster-leap-attack",
      "monster-enrage"
    ],
    "first": [
      [
        1820,
        "monster.leap_attack"
      ],
      [
        3640,
        "monster.enrage"
      ],
      [
        5460,
        "monster.leap_attack"
      ],
      [
        7280,
        null
      ],
      [
        9100,
        "monster.leap_attack"
      ],
      [
        10920,
        "monster.enrage"
      ],
      [
        12740,
        "monster.leap_attack"
      ],
      [
        14560,
        null
      ]
    ],
    "ordinary": true
  },
  {
    "id": "monsters/act2.fire-eye",
    "act": 2,
    "base": 40,
    "growth": 6.25,
    "values": [
      64,
      174,
      954
    ],
    "skills": [
      "monster-fire-breath",
      "monster-charge"
    ],
    "first": [
      [
        1580,
        "monster.fire_breath"
      ],
      [
        3160,
        "monster.charge"
      ],
      [
        4740,
        "monster.fire_breath"
      ],
      [
        6320,
        null
      ],
      [
        7900,
        "monster.fire_breath"
      ],
      [
        9480,
        "monster.charge"
      ],
      [
        11060,
        "monster.fire_breath"
      ],
      [
        12640,
        null
      ]
    ],
    "ordinary": true
  },
  {
    "id": "monsters/act2.coldworm-the-burrower",
    "act": 2,
    "base": 13,
    "growth": 2,
    "values": [
      21,
      56,
      306
    ],
    "skills": [
      "monster-poison-cloud",
      "monster-summon-adds"
    ],
    "first": [
      [
        0,
        "monster.summon_adds"
      ],
      [
        1780,
        "monster.poison_cloud"
      ],
      [
        3560,
        null
      ],
      [
        5340,
        "monster.poison_cloud"
      ],
      [
        7120,
        "monster.summon_adds"
      ],
      [
        8900,
        "monster.poison_cloud"
      ],
      [
        10680,
        null
      ],
      [
        12460,
        "monster.poison_cloud"
      ]
    ],
    "ordinary": true
  },
  {
    "id": "monsters/act2.fangskin",
    "act": 2,
    "base": 35.2,
    "growth": 5.5,
    "values": [
      56,
      153,
      840
    ],
    "skills": [
      "monster-lightning-bolt",
      "monster-charge"
    ],
    "first": [
      [
        1500,
        "monster.lightning_bolt"
      ],
      [
        3000,
        "monster.charge"
      ],
      [
        4500,
        "monster.lightning_bolt"
      ],
      [
        6000,
        null
      ],
      [
        7500,
        "monster.lightning_bolt"
      ],
      [
        9000,
        "monster.charge"
      ],
      [
        10500,
        "monster.lightning_bolt"
      ],
      [
        12000,
        null
      ]
    ],
    "ordinary": true
  },
  {
    "id": "monsters/act2.ancient-kaa",
    "act": 2,
    "base": 32,
    "growth": 5,
    "values": [
      51,
      139,
      763
    ],
    "skills": [
      "monster-curse",
      "monster-bone-spirit"
    ],
    "first": [
      [
        1700,
        "monster.curse"
      ],
      [
        3400,
        "monster.bone_spirit"
      ],
      [
        5100,
        null
      ],
      [
        6800,
        "monster.curse"
      ],
      [
        8500,
        "monster.bone_spirit"
      ],
      [
        10200,
        null
      ],
      [
        11900,
        "monster.curse"
      ],
      [
        13600,
        "monster.bone_spirit"
      ]
    ],
    "ordinary": true
  },
  {
    "id": "monsters/act2.radament",
    "act": 2,
    "base": 32,
    "growth": 5,
    "values": [
      51,
      139,
      763
    ],
    "skills": [
      "monster-poison-cloud",
      "monster-summon-adds",
      "monster-fire-breath"
    ],
    "first": [
      [
        0,
        "monster.summon_adds"
      ],
      [
        1700,
        "monster.poison_cloud"
      ],
      [
        3400,
        "monster.fire_breath"
      ],
      [
        5100,
        "monster.poison_cloud"
      ],
      [
        6800,
        "monster.summon_adds"
      ],
      [
        8500,
        "monster.poison_cloud"
      ],
      [
        10200,
        "monster.fire_breath"
      ],
      [
        11900,
        "monster.poison_cloud"
      ]
    ],
    "ordinary": false
  },
  {
    "id": "monsters/act2.beetleburst",
    "act": 2,
    "base": 35.2,
    "growth": 5.5,
    "values": [
      56,
      153,
      840
    ],
    "skills": [
      "monster-thunder-storm",
      "monster-lightning"
    ],
    "first": [
      [
        1740,
        "monster.thunder_storm"
      ],
      [
        3480,
        "monster.lightning"
      ],
      [
        5220,
        "monster.thunder_storm"
      ],
      [
        6960,
        "monster.lightning"
      ],
      [
        8700,
        "monster.thunder_storm"
      ],
      [
        10440,
        "monster.lightning"
      ],
      [
        12180,
        "monster.thunder_storm"
      ],
      [
        13920,
        "monster.lightning"
      ]
    ],
    "ordinary": false
  },
  {
    "id": "monsters/act2.duriel",
    "act": 2,
    "base": 40,
    "growth": 6.25,
    "values": [
      64,
      174,
      954
    ],
    "skills": [
      "monster-charge"
    ],
    "first": [
      [
        1500,
        "monster.charge"
      ],
      [
        3000,
        null
      ],
      [
        4500,
        null
      ],
      [
        6000,
        "monster.charge"
      ],
      [
        7500,
        null
      ],
      [
        9000,
        null
      ],
      [
        10500,
        "monster.charge"
      ],
      [
        12000,
        null
      ]
    ],
    "ordinary": true
  },
  {
    "id": "monsters/act4.izual",
    "act": 4,
    "base": 40,
    "growth": 6.25,
    "values": [
      64,
      174,
      954
    ],
    "skills": [
      "monster-frost-nova",
      "monster-charge"
    ],
    "first": [
      [
        1500,
        "monster.frost_nova"
      ],
      [
        3000,
        "monster.charge"
      ],
      [
        4500,
        "monster.frost_nova"
      ],
      [
        6000,
        null
      ],
      [
        7500,
        "monster.frost_nova"
      ],
      [
        9000,
        "monster.charge"
      ],
      [
        10500,
        "monster.frost_nova"
      ],
      [
        12000,
        null
      ]
    ],
    "ordinary": true
  },
  {
    "id": "monsters/act5.ancient-barbarian",
    "act": 5,
    "base": 40,
    "growth": 6.25,
    "values": [
      64,
      174,
      954
    ],
    "skills": [
      "monster-whirlwind",
      "monster-shout"
    ],
    "first": [
      [
        1460,
        "monster.whirlwind"
      ],
      [
        2920,
        "monster.shout"
      ],
      [
        4380,
        null
      ],
      [
        5840,
        "monster.whirlwind"
      ],
      [
        7300,
        null
      ],
      [
        8760,
        "monster.shout"
      ],
      [
        10220,
        "monster.whirlwind"
      ],
      [
        11680,
        null
      ]
    ],
    "ordinary": true
  }
] as const;
function definition(id: string) {
  const def = monsters.find(row => row.id === id);
  if (!def) throw new Error('Missing native boss ' + id);
  return def;
}
function build(id: string, level = 12, tier: MonsterTier = 'boss') {
  return buildMonsterUnit({ def: definition(id), id: 'enemy', level, tier, rng: createRng(7) });
}
function input(enemy: CombatUnit, act: 1 | 2 | 3 | 4 | 5): CombatSnapshot {
  const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player',
    life: 10_000_000, mana: 0, skillOrder: [], attackRange: [0, 0],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...enemy.stats, attack: 0, life: 10_000_000, lifeMax: 10_000_000,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  return { seed: 13, act, playerTeam: [hero], enemyTeam: [enemy] };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot), out = runBattleRecorded(snapshot);
  expect(snapshot).toEqual(before); expect(runBattle(snapshot)).toEqual(out.result);
  expect(runBattleRecorded(snapshot)).toEqual(out); return out;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

it.each(cases)('$id authors literal role curves and preserves nonattack construction/RNG', ({ id, base, growth, values, skills }) => {
  const def = definition(id);
  expect(def).toMatchObject({ attack: [base, base], attackGrowth: [growth, growth], skills,
    canBeElite: false, canBeBoss: true });
  expect([1, 12, 90].map(level => build(id, level).stats.attack)).toEqual(values);
  expect([1, 12, 90].map(level => build(id, level).attackRange)).toEqual(values.map(n => [n, n]));
  expect(build(id).basicAttackDelivery).toBe(id === 'monsters/act1.coldcrow' ? 'ranged' : 'melee');
  const legacy = { ...def }; Reflect.deleteProperty(legacy, 'attack'); Reflect.deleteProperty(legacy, 'attackGrowth');
  const a = createRng(7), b = createRng(7);
  const current = buildMonsterUnit({ def, level: 12, tier: 'boss', rng: a });
  const old = buildMonsterUnit({ def: legacy, level: 12, tier: 'boss', rng: b });
  const normalized = { ...current, stats: { ...current.stats, attack: old.stats.attack } };
  for (const unit of [normalized, old]) { Reflect.deleteProperty(unit, 'attackRange'); Reflect.deleteProperty(unit, 'basicAttackDelivery'); }
  expect(normalized).toEqual(old); expect(a.next()).toBe(b.next());
});
it.each(cases)('$id exposes its actual signature cadence and declared ordinary coverage', ({ id, act, skills, first, ordinary }) => {
  const enemy = build(id); expect(enemy.skillOrder).toEqual(skills);
  const out = record(input(enemy, act));
  const actions = out.events.filter(e => e.kind === 'action' && e.actor === 'enemy');
  expect(actions.length).toBeGreaterThan(8);
  expect(actions.slice(0, 8).map(e => e.kind === 'action' ? [e.simClockMs, e.skillId] : null)).toEqual(first);
  expect(actions.some(e => e.kind === 'action' && e.skillId === null)).toBe(ordinary);
  expect(actions.every(e => e.kind === 'action' && !['monster.strong_melee', 'monster.weak_ranged'].includes(e.skillId ?? ''))).toBe(true);
  if (ordinary) {
    const clocks = new Set(actions.filter(e => e.kind === 'action' && e.skillId === null).map(e => e.simClockMs));
    const hits = out.events.filter(e => e.kind === 'damage' && e.source === 'enemy' && e.damageType === 'physical' && clocks.has(e.simClockMs) && !e.dodged);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every(e => e.kind === 'damage' && e.damageType === 'physical' && e.amount > 0)).toBe(true);
  }
  if (id === 'monsters/act1.andariel') expect(actions.some(e => e.kind === 'action' && e.skillId === 'monster.charge')).toBe(false);
});
it.each(cases)('$id deals literal ordinary damage under native ManaBurn with immutable replay', ({ id, act, values }) => {
  const enemy = { ...build(id), statuses: [{ id: 'mana-burn', sourceId: 'fixture', remaining: -1, stacks: 1 }] };
  const out = record(input(enemy, act));
  const actions = out.events.filter(e => e.kind === 'action' && e.actor === 'enemy');
  expect(actions.length).toBeGreaterThan(0); expect(actions.every(e => e.kind === 'action' && e.skillId === null)).toBe(true);
  const hits = out.events.filter(e => e.kind === 'damage' && e.source === 'enemy' && e.damageType === 'physical' && !e.dodged && !e.crit);
  expect(hits.length).toBeGreaterThan(0);
  expect(hits.map(e => e.kind === 'damage' ? [e.amount, e.damageType] : null))
    .toEqual(hits.map(e => {
      // The copied tank retains boss tier: Chill's physical bonus is halved,
      // so floor(174 * 1.05) = 182 during each [pulse, pulse + 2000ms) window.
      const chilled = id === 'monsters/act2.duriel' && e.simClockMs >= 5000 && e.simClockMs % 5000 < 2000;
      return [chilled ? 182 : values[1], 'physical'];
    }));
  if (id === 'monsters/act2.duriel') {
    expect(hits.some(e => e.kind === 'damage' && e.amount === 174)).toBe(true);
    expect(hits.some(e => e.kind === 'damage' && e.amount === 182)).toBe(true);
    // Mana Burn suppresses active skills; Duriel's adopted passive still pulses.
    expect(definition(id).frostAura).toEqual({ damage: 15, intervalMs: 5000, chillDurationMs: 2000 });
    const pulses = out.events.filter(e => e.kind === 'damage' && e.source === 'enemy' && e.damageType === 'cold');
    expect(pulses).toHaveLength(12);
    for (const [i, pulse] of pulses.entries()) expect(pulse).toMatchObject({
      target: 'hero', damageType: 'cold', amount: 15, simClockMs: (i + 1) * 5000, dodged: false, crit: false
    });
    expect(out.events.filter(e => e.kind === 'status' && e.target === 'hero' && e.statusId === 'chill')
      .map(e => e.simClockMs)).toEqual(Array.from({ length: 12 }, (_, i) => (i + 1) * 5000));
  }
});
