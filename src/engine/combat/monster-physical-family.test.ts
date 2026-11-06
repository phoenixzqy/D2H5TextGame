import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import { monsters } from '@/data/index';
import monsterSchema from '@/data/schema/monster.schema.json';
import { createRng } from '../rng';
import { loadDefaultSkills, resetRegistry } from '../skills/registry';
import { prepareEndgameAttempt } from '../endgame/runtime';
import { emptyEndgameState } from '../endgame/state';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit, MonsterTier } from './types';

// Literal design oracles, independent of bundled values and factory math.
const cases = [
  { id: "monsters/act1.zombie", base: 18, growth: 4.5, period: 2000, delivery: "melee", attacks: [18, 68, 117, 135, 135, 419, 144, 99] },
  { id: "monsters/act1.quill-rat", base: 17, growth: 4.25, period: 1540, delivery: "melee", attacks: [17, 64, 111, 128, 128, 395, 136, 94] },
  { id: "monsters/act1.carver", base: 33.6, growth: 5.25, period: 1700, delivery: "melee", attacks: [34, 91, 153, 176, 176, 501, 188, 129] },
  { id: "monsters/act1.dark-archer", base: 35.2, growth: 5.5, period: 1700, delivery: "ranged", attacks: [35, 96, 160, 185, 185, 525, 197, 136] },
  { id: "monsters/act1.bone-warrior", base: 35.2, growth: 5.5, period: 1780, delivery: "melee", attacks: [35, 96, 160, 185, 185, 525, 197, 136] },
  { id: "monsters/act1.spike-fiend", base: 27.2, growth: 4.25, period: 1460, delivery: "melee", attacks: [27, 74, 124, 143, 143, 405, 152, 105] },
  { id: "monsters/act1.misshapen", base: 32, growth: 5, period: 1740, delivery: "melee", attacks: [32, 87, 146, 168, 168, 477, 179, 123] },
  { id: "monsters/act1.hungry-dead", base: 28.8, growth: 4.5, period: 1980, delivery: "melee", attacks: [29, 78, 131, 151, 151, 429, 161, 111] },
  { id: "monsters/act1.ghoul", base: 32, growth: 5, period: 1860, delivery: "melee", attacks: [32, 87, 146, 168, 168, 477, 179, 123] },
  { id: "monsters/act1.returned", base: 35.2, growth: 5.5, period: 1740, delivery: "melee", attacks: [35, 96, 160, 185, 185, 525, 197, 136] },
  { id: "monsters/act1.returned-archer", base: 35.2, growth: 5.5, period: 1620, delivery: "ranged", attacks: [35, 96, 160, 185, 185, 525, 197, 136] },
  { id: "monsters/act2.sand-raider", base: 32, growth: 5, period: 1740, delivery: "melee", attacks: [32, 87, 146, 168, 168, 477, 179, 123] },
  { id: "monsters/act2.sand-maggot", base: 27.2, growth: 4.25, period: 1820, delivery: "melee", attacks: [27, 74, 124, 143, 143, 405, 152, 105] },
  { id: "monsters/act2.sand-maggot-young", base: 19.2, growth: 3, period: 1700, delivery: "melee", attacks: [19, 52, 87, 101, 101, 286, 108, 74] },
  { id: "monsters/act2.mummy", base: 32, growth: 5, period: 1940, delivery: "melee", attacks: [32, 87, 146, 168, 168, 477, 179, 123] },
  { id: "monsters/act2.scarab", base: 27.2, growth: 4.25, period: 1860, delivery: "melee", attacks: [27, 74, 124, 143, 143, 405, 152, 105] },
  { id: "monsters/act2.undead-flayer", base: 35.2, growth: 5.5, period: 1620, delivery: "melee", attacks: [35, 96, 160, 185, 185, 525, 197, 136] },
  { id: "monsters/act3.flayer", base: 35.2, growth: 5.5, period: 1660, delivery: "melee", attacks: [35, 96, 160, 185, 185, 525, 197, 136] },
  { id: "monsters/act4.damned", base: 32, growth: 5, period: 1780, delivery: "melee", attacks: [32, 87, 146, 168, 168, 477, 179, 123] },
  { id: "monsters/act5.barbarian-savage", base: 40, growth: 6.25, period: 1700, delivery: "melee", attacks: [40, 109, 182, 210, 210, 596, 224, 154] },
 ] as const;
function definition(id: string) {
  const def = monsters.find(row => row.id === id);
  if (!def) throw new Error('Missing bundled monster: ' + id);
  return def;
}
function build(id: string, level = 12, tier: MonsterTier = 'trash') {
  return buildMonsterUnit({ def: definition(id), level, tier, rng: createRng(7), id: 'enemy' });
}
function record(enemy: CombatUnit, act: 1 | 2 | 3 | 4 | 5 = 1) {
  // Passive unmitigated tank proves natural sources/cadence, not viability.
  const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player',
    life: 10_000_000, mana: 0, skillOrder: [],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...enemy.stats, attack: 0, life: 10_000_000, lifeMax: 10_000_000,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  const input: CombatSnapshot = { seed: 13, act, playerTeam: [hero], enemyTeam: [enemy] };
  const before = structuredClone(input), output = runBattleRecorded(input);
  expect(input).toEqual(before);
  expect(runBattleRecorded(input)).toEqual(output);
  return output;
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { resetRegistry(); loadDefaultSkills(); });

describe.each(cases)('ordinary physical family $id', spec => {
  it('selects actual ordinary actions and lands level-scaled damage at native cadence', () => {
    const enemy = build(spec.id), before = structuredClone(definition(spec.id));
    const output = record(enemy);
    expect(enemy.skillOrder).toEqual([]);
    expect(enemy.basicAttackDelivery).toBe(spec.delivery);
    const actions = output.events.filter(event => event.kind === 'action' && event.actor === 'enemy');
    expect(actions.slice(0, 3)).toEqual([1, 2, 3].map((n): unknown => expect.objectContaining({
      skillId: null, simClockMs: n * spec.period })));
    expect(actions.every(event => event.kind === 'action' && event.skillId === null)).toBe(true);
    const hits = output.events.filter(event => event.kind === 'damage' && event.source === 'enemy');
    expect(hits.slice(0, 3).map(event => event.simClockMs)).toEqual([spec.period, spec.period * 2, spec.period * 3]);
    const landed = hits.filter(event => event.kind === 'damage' && !event.dodged && !event.crit);
    expect(landed.length).toBeGreaterThan(0);
    for (const hit of landed) expect(hit).toMatchObject({ damageType: 'physical', amount: spec.attacks[1] });
    expect(definition(spec.id)).toEqual(before);
  });
  it('resolves exact level/tier point ranges and preserves spawn RNG', () => {
    // Arithmetic probes do not authorize tiers; explicit encounters can override catalog eligibility.
    const probes: [number, MonsterTier][] = [[1, 'trash'], [12, 'trash'], [17, 'elite'],
      [17, 'champion'], [17, 'rare-elite'], [90, 'trash'], [17, 'boss'], [17, 'rare-minion']];
    expect(probes.map(([level, tier]) => build(spec.id, level, tier).stats.attack)).toEqual(spec.attacks);
    expect(probes.map(([level, tier]) => build(spec.id, level, tier).attackRange))
      .toEqual(spec.attacks.map(value => [value, value]));
    expect(definition(spec.id)).toMatchObject({ attack: [spec.base, spec.base],
      attackGrowth: [spec.growth, spec.growth],
      canBeElite: spec.id !== 'monsters/act2.sand-maggot-young', canBeBoss: false });
    const rng = createRng(7), other = createRng(7), def = definition(spec.id);
    const legacy = { ...def }; Reflect.deleteProperty(legacy, 'attack'); Reflect.deleteProperty(legacy, 'attackGrowth');
    const native = buildMonsterUnit({ def, level: 12, tier: 'trash', rng });
    const old = buildMonsterUnit({ def: legacy, level: 12, tier: 'trash', rng: other });
    expect([native.id, native.life, native.stats.defense, native.stats.magicResist])
      .toEqual([old.id, old.life, old.stats.defense, old.stats.magicResist]);
    expect(rng.next()).toBe(other.next());
  });
});

it('allows required-empty skills, but still rejects omission and malformed IDs', () => {
  const validate = new Ajv2020({ strict: true }).compile(monsterSchema);
  const def = definition(cases[0].id), absent = { ...def }; Reflect.deleteProperty(absent, 'skills');
  expect(validate({ ...def, skills: [] })).toBe(true);
  expect(validate(absent)).toBe(false);
  expect(validate({ ...def, skills: ['bad ID'] })).toBe(false);
});

it('uses the same ordinary Zombie body when Blood Raven naturally raises it', () => {
  const output = record(build('monsters/act1.blood-raven'));
  const summons = output.events.filter(event => event.kind === 'summon');
  expect(summons.length).toBeGreaterThan(0);
  for (const event of summons) {
    expect(event.unit).toMatchObject({ monsterArchetypeId: 'monsters/act1.zombie', skillOrder: [],
      attackRange: [68, 68], basicAttackDelivery: 'melee' });
    expect(output.events.some(action => action.kind === 'action' && action.actor === event.unit.id &&
      action.skillId === null)).toBe(true);
  }
  expect(output.events.find(event => event.kind === 'action' && event.actor === 'enemy'))
    .toMatchObject({ skillId: 'monster-blood-raven-raise-dead' });
});

it('builds both actual endgame W1 Savages at L90 Attack596 with ordinary actions', () => {
  const { progress } = prepareEndgameAttempt({ heroId: 'hero', modifierId: 'ashen',
    state: emptyEndgameState(), campaign: campaignEvidence() });
  const spawns = progress.plan.waves[0]?.spawns.filter(spawn => spawn.archetypeId === 'monsters/act5.barbarian-savage');
  expect(spawns).toHaveLength(2);
  for (const spawn of spawns ?? []) {
    expect(spawn).toMatchObject({ level: 90, tier: 'trash' });
    const enemy = buildMonsterUnit({ def: definition(spawn.archetypeId), level: spawn.level,
      tier: spawn.tier, rng: createRng(7), id: 'enemy' });
    expect(enemy.stats.attack).toBe(596);
    expect(enemy.attackRange).toEqual([596, 596]);
    const output = record(enemy, 5);
    expect(output.events.find(event => event.kind === 'action' && event.actor === 'enemy'))
      .toMatchObject({ skillId: null, simClockMs: 1700 });
    expect(output.events.some(event => event.kind === 'damage' && event.source === 'enemy' &&
      !event.dodged && !event.crit && event.amount === 596)).toBe(true);
  }
});
