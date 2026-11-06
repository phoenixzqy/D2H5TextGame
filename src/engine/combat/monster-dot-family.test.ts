import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { monsters } from '@/data/index';
import * as rngModule from '../rng';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { actionPeriodMs, runBattle, runBattleRecorded, type CombatSnapshot, type RecordedBattleEvent } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit } from './types';

const cases = [
  { skill: 'fire-bolt', id: 'monsters/act2.salamander', act: 2, base: [25, 40], cd: 2, target: 'single-enemy', delivery: 'spell', flight: 500, status: 'ignite', rate: .1, duration: 3000 },
  { skill: 'fire-ball', id: 'monsters/act3.serpent-magus', act: 3, base: [40, 60], cd: 3, target: 'area-enemies', delivery: 'spell', flight: 500, status: 'ignite', rate: .1, duration: 3000 },
  { skill: 'fire-arrow', id: 'monsters/act1.dark-ranger', act: 1, base: [20, 35], cd: 1, target: 'single-enemy', delivery: 'ranged', flight: 500, status: 'ignite', rate: .1, duration: 3000 },
  { skill: 'inferno', id: 'monsters/act4.mega-demon', act: 4, base: [40, 60], cd: 3, target: 'all-enemies', delivery: 'spell', flight: 0, status: 'ignite', rate: .1, duration: 3000 },
  { skill: 'poison-cloud', id: 'monsters/act3.swamp-dweller', act: 3, base: [15, 25], cd: 3, target: 'all-enemies', delivery: 'spell', flight: 0, status: 'poison', rate: .05, duration: 5000 },
  { skill: 'poison-dagger', id: 'monsters/act3.fetish', act: 3, base: [20, 30], cd: 1, target: 'single-enemy', delivery: 'melee', flight: 0, status: 'poison', rate: .05, duration: 5000 },
  { skill: 'plague-spit', id: 'monsters/act3.infector', act: 3, base: [20, 30], cd: 2, target: 'single-enemy', delivery: 'spell', flight: 500, status: 'plague', rate: .05, duration: 5000 }
] as const;
type Case = typeof cases[number];
function snapshot(spec: Case, singleCast = true): CombatSnapshot {
  const def = monsters.find(row => row.id === spec.id);
  if (!def) throw new Error('Missing native monster');
  const native = buildMonsterUnit({ def, level: 20, tier: 'trash', rng: rngModule.createRng(7), id: 'enemy' });
  const period = actionPeriodMs(native.stats.attackSpeed);
  const enemy = singleCast ? { ...native, skillOrder: ['monster-' + spec.skill],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1, appliedAtMs: period + 1 }] } : native;
  // Passive synthetic tanks isolate one real registered payload, not earned viability.
  const hero: CombatUnit = { ...native, id: 'hero', kind: 'hero', side: 'player',
    life: 100_000, mana: 0, skillOrder: [],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...native.stats, attack: 0, life: 100_000, lifeMax: 100_000,
      defense: 10, magicResist: 10, physDodge: 0, magicDodge: 0,
      resistances: { physical: 25, fire: 25, cold: 25, lightning: 25, poison: 25, arcane: 25 } } };
  return { seed: 13, act: spec.act, enemyTeam: [enemy], playerTeam: [hero] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), output = runBattleRecorded(input);
  expect(runBattleRecorded(input)).toEqual(output);
  expect(runBattle(input)).toEqual(output.result);
  expect(input).toEqual(before);
  return output;
}
beforeEach(() => {
  resetRegistry(); loadDefaultSkills();
  const create = rngModule.createRng;
  vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
    const rng = create(seed);
    vi.spyOn(rng, 'nextInt').mockImplementation((min) => min);
    vi.spyOn(rng, 'chance').mockImplementation(probability => probability > .5);
    return rng;
  });
});
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe.each(cases)('native monster $skill DoT', spec => {
  it('resolves aliases with preserved direct hit, delivery, cooldown and projectile', () => {
    const skill = getSkill('monster-' + spec.skill);
    expect(getSkill('monster.' + spec.skill.replaceAll('-', '_'))).toBe(skill);
    expect(skill).toMatchObject({ archetype: 'monster', manaCost: 0, minLevel: 1,
      cooldown: spec.cd, target: spec.target, effects: [{ kind: 'damage', base: spec.base,
        damageType: spec.status === 'ignite' ? 'fire' : 'poison',
        applyStatus: { id: spec.status, chance: 1, stacksOnApply: 1,
          dotPctOfDamage: spec.rate, durationMs: spec.duration } }] });
    if (!skill || skill.effects[0]?.kind !== 'damage') throw new Error('Missing native skill');
    expect(getSkillDamageDelivery(skill)).toBe(spec.delivery);
    expect(skill.effects[0].projectileFlightMs ?? 0).toBe(spec.flight);
    expect(skill.effects[0].tags).toBeUndefined();
  });
  it('integrates finite positive potency from the mitigated hit without a second mitigation', () => {
    const input = snapshot(spec), output = record(input);
    const enemy = input.enemyTeam[0]; if (!enemy) throw new Error('Missing fixture monster');
    const hits = output.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage' && e.source === 'enemy');
    expect(hits).toHaveLength(1);
    const hit = hits[0]; if (!hit) throw new Error('Missing landed hit');
    const expectedHit = Math.max(1, Math.floor(spec.base[0] * .75 - 10));
    expect(hit).toMatchObject({ amount: expectedHit, dodged: false, crit: false,
      simClockMs: actionPeriodMs(enemy.stats.attackSpeed) + spec.flight });
    const rate = Math.max(1, Math.floor(expectedHit * spec.rate));
    expect(output.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'hero',
      simClockMs: hit.simClockMs, statuses: expect.arrayContaining([expect.objectContaining({
        id: spec.status, stacks: 1, dotPerStack: rate, sourceId: 'enemy',
        appliedAtMs: hit.simClockMs, expiresAtMs: hit.simClockMs + spec.duration })]) as unknown }));
    const dots = output.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'dot' }> => e.kind === 'dot' && e.target === 'hero');
    expect(dots.reduce((sum, e) => sum + e.amount, 0)).toBe(rate * spec.duration / 1000);
    expect(dots.every(e => e.simClockMs > hit.simClockMs && e.simClockMs <= hit.simClockMs + spec.duration)).toBe(true);
    expect(output.result.playerTeam[0]?.statuses.some(s => s.id === spec.status)).toBe(false);
  });
  it('does not apply statuses or DoT on a missed typed hit', () => {
    const input = snapshot(spec);
    const output = record({ ...input, playerTeam: input.playerTeam.map(hero => ({ ...hero,
      stats: { ...hero.stats, physDodge: 0, magicDodge: 1 } })) });
    // Poison Dagger has Poison damage and therefore uses the magical dodge pool too.
    expect(output.events.filter(e => e.kind === 'damage' && e.source === 'enemy'))
      .toEqual([expect.objectContaining({ amount: 0, dodged: true })]);
    expect(output.events.filter(e => e.kind === 'dot' || e.kind === 'status' && e.statusId === spec.status)).toEqual([]);
  });
  it('retains the actual bundled order and emits positive periodic damage in native cadence', () => {
    const input = snapshot(spec, false), enemy = input.enemyTeam[0];
    const def = monsters.find(row => row.id === spec.id);
    expect(enemy?.skillOrder).toEqual(def?.skills);
    const output = record(input);
    expect(output.events.some(e => e.kind === 'action' && e.skillId === 'monster.' + spec.skill.replaceAll('-', '_'))).toBe(true);
    expect(output.events.some(e => e.kind === 'dot' && e.target === 'hero' && e.amount > 0)).toBe(true);
  });
});

it('retains the first real arrow potency while stacking and refreshing finite Ignite', () => {
  vi.restoreAllMocks();
  const spec = cases[2];
  let pairs = 0, distinctRates = 0;
  for (let seed = 0; seed < 16; seed++) {
    const input = snapshot(spec), enemy = input.enemyTeam[0];
    if (!enemy) throw new Error('Missing fixture monster');
    const period = actionPeriodMs(enemy.stats.attackSpeed);
    const output = record({ ...input, seed, enemyTeam: [{ ...enemy,
      stats: { ...enemy.stats, critChance: 0 },
      statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1, appliedAtMs: 2 * period + 1 }] }],
      playerTeam: input.playerTeam.map(hero => ({ ...hero, stats: { ...hero.stats, magicResist: 0,
        resistances: { ...hero.stats.resistances, fire: 0 } } })) });
    const hits = output.events.filter((e): e is Extract<RecordedBattleEvent, { kind: 'damage' }> => e.kind === 'damage' && e.source === 'enemy');
    expect(hits).toHaveLength(2);
    const [first, second] = hits;
    if (!first || !second || first.dodged || second.dodged) continue;
    pairs++;
    const rate = Math.max(1, Math.floor(first.amount * .1));
    if (Math.max(1, Math.floor(second.amount * .1)) !== rate) distinctRates++;
    expect(output.events).toContainEqual(expect.objectContaining({ kind: 'status-state', target: 'hero',
      simClockMs: second.simClockMs, statuses: expect.arrayContaining([expect.objectContaining({
        id: 'ignite', stacks: 2, dotPerStack: rate, appliedAtMs: first.simClockMs,
        expiresAtMs: second.simClockMs + 3000 })]) as unknown }));
    expect(output.result.playerTeam[0]?.statuses.some(s => s.id === 'ignite')).toBe(false);
  }
  expect(pairs).toBeGreaterThan(0);
  expect(distinctRates).toBeGreaterThan(0);
});

it('carries real positive Plague Spit potency through the existing death-spread transaction', () => {
  const input = snapshot(cases[6]), hero = input.playerTeam[0];
  if (!hero) throw new Error('Missing fixture hero');
  // The actual mitigated Spit is5; one further periodic HP loss kills this target.
  const output = record({ ...input, playerTeam: [{ ...hero, life: 6,
    stats: { ...hero.stats, life: 6, lifeMax: 6 } }, { ...hero, id: 'ally', kind: 'merc' }] });
  expect(output.events.some(e => e.kind === 'dot' && e.target === 'hero' && e.amount > 0)).toBe(true);
  expect(output.events.some(e => e.kind === 'death' && e.target === 'hero')).toBe(true);
  expect(output.events.some(e => e.kind === 'status-state' && e.target === 'ally' &&
    e.statuses.some(s => s.id === 'poison' && s.sourceId === 'hero' && s.dotPerStack === 1 && s.stacks === 1))).toBe(true);
});
