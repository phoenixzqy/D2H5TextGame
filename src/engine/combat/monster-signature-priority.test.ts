import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { monsters } from '@/data/index';
import * as rngModule from '../rng';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit } from './types';

const cases = [
  { id: 'monsters/act2.claw-viper', act: 2, level: 15, period: 1620, signature: 'monster-poison-spit',
    canonical: 'monster.poison_spit', melee: 'monster-weak-melee', cooldown: 2, base: [20, 30],
    damageType: 'poison', delivery: 'spell', flight: 500, targets: 1, status: 'poison' },
  { id: 'monsters/act2.vulture-demon', act: 2, level: 14, period: 1580, signature: 'monster-charge',
    canonical: 'monster.charge', melee: 'monster-strong-melee', cooldown: 4, base: [60, 90],
    damageType: 'physical', delivery: 'melee', flight: 0, targets: 1, status: null },
  { id: 'monsters/act3.jungle-hunter', act: 3, level: 27, period: 1620, signature: 'monster-leap',
    canonical: 'monster.leap', melee: 'monster-weak-melee', cooldown: 3, base: [40, 60],
    damageType: 'physical', delivery: 'melee', flight: 0, targets: 1, status: null },
  { id: 'monsters/act3.spider', act: 3, level: 27, period: 1700, signature: 'monster-poison-spit',
    canonical: 'monster.poison_spit', melee: 'monster-weak-melee', cooldown: 2, base: [20, 30],
    damageType: 'poison', delivery: 'spell', flight: 500, targets: 1, status: 'poison' },
  { id: 'monsters/act3.swamp-dweller', act: 3, level: 29, period: 1780, signature: 'monster-poison-cloud',
    canonical: 'monster.poison_cloud', melee: 'monster-weak-melee', cooldown: 3, base: [15, 25],
    damageType: 'poison', delivery: 'spell', flight: 0, targets: 2, status: 'poison' },
  { id: 'monsters/act3.doom-ape', act: 3, level: 30, period: 1580, signature: 'monster-charge',
    canonical: 'monster.charge', melee: 'monster-strong-melee', cooldown: 4, base: [60, 90],
    damageType: 'physical', delivery: 'melee', flight: 0, targets: 1, status: null },
  { id: 'monsters/act4.abyss-knight', act: 4, level: 42, period: 1620, signature: 'monster-charge',
    canonical: 'monster.charge', melee: 'monster-strong-melee', cooldown: 4, base: [60, 90],
    damageType: 'physical', delivery: 'melee', flight: 0, targets: 1, status: null },
  { id: 'monsters/act4.oblivion-knight', act: 4, level: 45, period: 1700, signature: 'monster-bone-spirit',
    canonical: 'monster.bone_spirit', melee: 'monster-strong-melee', cooldown: 2, base: [40, 60],
    damageType: 'arcane', delivery: 'spell', flight: 500, targets: 1, status: null }
] as const;
type Case = typeof cases[number];

function snapshot(spec: Case): CombatSnapshot {
  const def = monsters.find(row => row.id === spec.id);
  if (!def) throw new Error('Missing canonical monster: ' + spec.id);
  const enemy = buildMonsterUnit({ def, level: spec.level, tier: 'trash', rng: rngModule.createRng(7), id: 'enemy' });
  // Two unearned passive tanks expose actual target counts and native cadence.
  // They do not represent a player build or establish balance acceptance.
  const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player',
    life: 100_000, mana: 0, skillOrder: [],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...enemy.stats, attack: 0, life: 100_000, lifeMax: 100_000,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  return { seed: 13, act: spec.act, playerTeam: [hero, { ...hero, id: 'ally', kind: 'merc' }], enemyTeam: [enemy] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), output = runBattleRecorded(input);
  expect(runBattleRecorded(input)).toEqual(output);
  expect(input).toEqual(before);
  return output;
}
function controlDamage(endpoint: 'min' | 'max'): void {
  const create = rngModule.createRng;
  vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
    const rng = create(seed);
    vi.spyOn(rng, 'nextInt').mockImplementation((min, max) => endpoint === 'min' ? min : max);
    vi.spyOn(rng, 'chance').mockImplementation(probability => probability > 0.5);
    return rng;
  });
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe.each(cases)('$id native signature priority', spec => {
  it('uses its signature and intended cooldown filler with native delivery and no extra attack', () => {
    const input = snapshot(spec), enemy = input.enemyTeam[0];
    if (!enemy) throw new Error('Missing fixture monster');
    const authoredOrdinary = ['monsters/act2.vulture-demon', 'monsters/act3.jungle-hunter',
      'monsters/act3.doom-ape', 'monsters/act4.abyss-knight', 'monsters/act2.claw-viper',
      'monsters/act3.spider', 'monsters/act3.swamp-dweller', 'monsters/act4.oblivion-knight'].includes(spec.id);
    const output = record(input), generic = authoredOrdinary ? null :
      spec.melee === 'monster-weak-melee' ? 'monster.weak_melee' : 'monster.strong_melee';
    expect(enemy.skillOrder).toEqual(authoredOrdinary ? [spec.signature] : [spec.signature, spec.melee]);
    expect(enemy.mana).toBe(0);
    const actions = output.events.filter(event => event.kind === 'action' && event.actor === 'enemy');
    const sequence = spec.cooldown === 4 ? [spec.canonical, generic, generic, spec.canonical] : [spec.canonical, generic, spec.canonical];
    expect(actions.slice(0, sequence.length)).toEqual(sequence.map((skillId, index): unknown =>
      expect.objectContaining({ skillId, simClockMs: spec.period * (index + 1) })));
    const skill = getSkill(spec.signature), melee = getSkill(spec.melee);
    if (!skill || !melee) throw new Error('Missing native skill');
    expect(skill).toMatchObject({ id: spec.canonical, manaCost: 0, cooldown: spec.cooldown,
      target: spec.targets === 2 ? 'all-enemies' : 'single-enemy',
      effects: [{ kind: 'damage', damageType: spec.damageType, base: spec.base }] });
    expect(getSkillDamageDelivery(skill)).toBe(spec.delivery);
    expect(getSkillDamageDelivery(melee)).toBe('melee');
    expect(melee).toMatchObject({ cooldown: 1, manaCost: 0,
      effects: [{ kind: 'damage', damageType: 'physical', base: spec.melee === 'monster-weak-melee' ? [10, 15] : [30, 50] }] });
    const effect = skill.effects[0];
    if (effect?.kind !== 'damage') throw new Error('Missing native damage');
    expect(effect.projectileFlightMs ?? 0).toBe(spec.flight);
    expect(effect.applyStatus?.id ?? null).toBe(spec.status);
    expect(actions.some(event => event.kind === 'action' && event.skillId === null)).toBe(authoredOrdinary);
  });

  it.each(['min', 'max'] as const)('lands its %s signature endpoint with exact impact time and targets', endpoint => {
    const input = snapshot(spec);
    controlDamage(endpoint);
    const output = record(input), impact = spec.period + spec.flight;
    const hits = output.events.filter(event => event.kind === 'damage' && event.source === 'enemy' && event.simClockMs === impact);
    expect(hits).toHaveLength(spec.targets);
    expect(new Set(hits.flatMap(event => event.kind === 'damage' ? [event.target] : [])).size).toBe(spec.targets);
    for (const hit of hits) expect(hit).toMatchObject({ kind: 'damage', damageType: spec.damageType,
      amount: spec.base[endpoint === 'min' ? 0 : 1] +
        (spec.signature === 'monster-charge' ? input.enemyTeam[0]?.stats.attack ?? 0 : 0), crit: false, dodged: false });
    expect(output.events.filter(event => event.kind === 'damage' && event.source === 'enemy' && event.simClockMs < impact)).toEqual([]);
    const statuses = output.events.filter(event => event.kind === 'status' && event.simClockMs === impact);
    if (spec.status) {
      expect(statuses).toHaveLength(spec.targets);
      for (const status of statuses) expect(status).toMatchObject({ statusId: spec.status });
    } else expect(statuses).toEqual([]);
    // The following action is just one intended filler hit, never an additional basic attack.
    expect(output.events.filter(event => event.kind === 'damage' && event.source === 'enemy' &&
      event.simClockMs === spec.period * 2)).toHaveLength(1);
  });

  it('uses its native physical or magical dodge channel', () => {
    const base = snapshot(spec);
    const dodging: CombatSnapshot = { ...base, playerTeam: base.playerTeam.map(unit => ({ ...unit,
      stats: { ...unit.stats, physDodge: spec.delivery === 'melee' ? 1 : 0, magicDodge: spec.delivery === 'spell' ? 1 : 0 } })) };
    const other: CombatSnapshot = { ...base, playerTeam: base.playerTeam.map(unit => ({ ...unit,
      stats: { ...unit.stats, physDodge: spec.delivery === 'spell' ? 1 : 0, magicDodge: spec.delivery === 'melee' ? 1 : 0 } })) };
    controlDamage('min');
    for (const [input, dodged] of [[dodging, true], [other, false]] as const) {
      const hits = record(input).events.filter(event => event.kind === 'damage' && event.source === 'enemy' &&
        event.simClockMs === spec.period + spec.flight);
      expect(hits).toHaveLength(spec.targets);
      for (const hit of hits) expect(hit).toMatchObject({ dodged, amount: dodged ? 0 : spec.base[0] +
        (spec.signature === 'monster-charge' ? input.enemyTeam[0]?.stats.attack ?? 0 : 0) });
    }
  });
});
