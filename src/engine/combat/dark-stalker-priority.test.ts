import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { monsters } from '@/data/index';
import * as rngModule from '../rng';
import { getSkill, getSkillDamageDelivery, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattleRecorded, type CombatSnapshot } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { CombatUnit } from './types';

function monster(id = 'monsters/act1.dark-stalker'): CombatUnit {
  const def = monsters.find(row => row.id === id);
  if (!def) throw new Error('Missing canonical monster: ' + id);
  return buildMonsterUnit({ def, level: 6, tier: 'trash', rng: rngModule.createRng(7), id: 'enemy' });
}
function snapshot(enemy = monster()): CombatSnapshot {
  // An unearned passive tank isolates native priority; it proves no build viability.
  const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player',
    life: 100_000, mana: 0, skillOrder: [],
    statuses: [{ id: 'stun', sourceId: 'fixture', remaining: -1, stacks: 1 }],
    stats: { ...enemy.stats, attack: 0, life: 100_000, lifeMax: 100_000,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
  return { seed: 13, act: 1, playerTeam: [hero], enemyTeam: [enemy] };
}
function record(input: CombatSnapshot) {
  const before = structuredClone(input), recorded = runBattleRecorded(input);
  expect(runBattleRecorded(input)).toEqual(recorded);
  expect(input).toEqual(before);
  return recorded;
}
function controlDamage(endpoint: 'min' | 'max'): void {
  const create = rngModule.createRng;
  vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
    const rng = create(seed);
    vi.spyOn(rng, 'nextInt').mockImplementation((min, max) => endpoint === 'min' ? min : max);
    // Controlled landed noncrit or physical-dodge outcomes; no skill/order override.
    vi.spyOn(rng, 'chance').mockImplementation(probability => probability > 0.5);
    return rng;
  });
}
beforeEach(() => { resetRegistry(); loadDefaultSkills(); });
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe('Dark Stalker native Charge priority', () => {
  it('uses Charge then authored ordinary attacks during its cooldown with one hit per action', () => {
    const enemy = monster(), output = record(snapshot(enemy));
    expect(enemy.skillOrder).toEqual(['monster-charge']);
    expect(enemy.attackRange).toEqual([63, 63]);
    expect(enemy.basicAttackDelivery).toBe('melee');
    expect(enemy.mana).toBe(0);
    const actions = output.events.filter(event => event.kind === 'action' && event.actor === enemy.id);
    expect(actions.slice(0, 4)).toEqual([
      expect.objectContaining({ skillId: 'monster.charge', simClockMs: 1540 }),
      expect.objectContaining({ skillId: null, simClockMs: 3080 }),
      expect.objectContaining({ skillId: null, simClockMs: 4620 }),
      expect.objectContaining({ skillId: 'monster.charge', simClockMs: 6160 })
    ]);
    for (const action of actions) {
      expect(output.events.filter(event => event.kind === 'damage' && event.source === enemy.id &&
        event.simClockMs === action.simClockMs)).toHaveLength(1);
    }
    expect(output.events.filter(event => event.kind === 'status' && event.target === 'hero')).toEqual([]);
  });

  it.each(['min', 'max'] as const)('preserves %s physical endpoints and normal resistance/DEF mitigation', endpoint => {
    const input = snapshot(), hero = input.playerTeam[0];
    if (!hero) throw new Error('Missing fixture hero');
    const mitigated: CombatSnapshot = { ...input, playerTeam: [{ ...hero,
      stats: { ...hero.stats, defense: 10, resistances: { ...hero.stats.resistances, physical: 25 } } }] };
    controlDamage(endpoint);
    for (const [fixture, charge, melee] of [[input, endpoint === 'min' ? 60 : 90, 63],
      [mitigated, endpoint === 'min' ? 35 : 57, 37]] as const) {
      const events = record(fixture).events;
      for (const [simClockMs, amount] of [[1540, charge], [3080, melee], [4620, melee], [6160, charge]]) {
        expect(events).toContainEqual(expect.objectContaining({ kind: 'damage', source: 'enemy',
          target: 'hero', damageType: 'physical', amount, dodged: false, crit: false, simClockMs }));
      }
    }
  });

  it('uses physical dodge for both actions rather than magical dodge', () => {
    const base = snapshot(), hero = base.playerTeam[0];
    if (!hero) throw new Error('Missing fixture hero');
    const input: CombatSnapshot = { ...base, playerTeam: [{ ...hero, stats: { ...hero.stats, magicDodge: 1 } }] };
    const physical: CombatSnapshot = { ...base, playerTeam: [{ ...hero, stats: { ...hero.stats, physDodge: 1 } }] };
    controlDamage('min');
    const hits = record(input).events.filter(event => event.kind === 'damage' && event.source === 'enemy');
    const misses = record(physical).events.filter(event => event.kind === 'damage' && event.source === 'enemy');
    expect(hits.length).toBeGreaterThan(0);
    expect(misses.length).toBe(hits.length);
    expect(hits.every(event => event.kind === 'damage' && !event.dodged && event.amount > 0)).toBe(true);
    expect(misses.every(event => event.kind === 'damage' && event.dodged && event.amount === 0)).toBe(true);
  });

  it('reuses Charge at the exact four-second cooldown boundary under stable Chill', () => {
    const enemy = { ...monster(), statuses: [{ id: 'chill', sourceId: 'fixture', remaining: -1, stacks: 1 }] };
    const actions = record(snapshot(enemy)).events.filter(event => event.kind === 'action' && event.actor === 'enemy');
    expect(actions.slice(0, 3)).toEqual([
      expect.objectContaining({ skillId: 'monster.charge', simClockMs: 2000 }),
      expect.objectContaining({ skillId: null, simClockMs: 4000 }),
      expect.objectContaining({ skillId: 'monster.charge', simClockMs: 6000 })
    ]);
  });

  it('preserves native skill payloads and Vile Hunter now shares the authored ordinary fallback', () => {
    const charge = getSkill('monster-charge'), melee = getSkill('monster-strong-melee');
    if (!charge || !melee) throw new Error('Missing native monster skills');
    expect(charge).toMatchObject({ id: 'monster.charge', cooldown: 4, manaCost: 0,
      effects: [{ kind: 'damage', damageType: 'physical', base: [60, 90] }] });
    expect(melee).toMatchObject({ id: 'monster.strong_melee', cooldown: 1, manaCost: 0,
      effects: [{ kind: 'damage', damageType: 'physical', base: [30, 50] }] });
    expect(getSkillDamageDelivery(charge)).toBe('melee');
    expect(getSkillDamageDelivery(melee)).toBe('melee');
    const enemy = monster('monsters/act1.vile-hunter');
    expect(enemy.skillOrder).toEqual(['monster-charge']);
    expect(enemy.attackRange).toEqual([63, 63]);
    const actions = record(snapshot(enemy)).events.filter(event => event.kind === 'action' && event.actor === 'enemy');
    expect(actions.slice(0, 4)).toEqual([
      expect.objectContaining({ skillId: 'monster.charge', simClockMs: 1540 }),
      expect.objectContaining({ skillId: null, simClockMs: 3080 }),
      expect.objectContaining({ skillId: null, simClockMs: 4620 }),
      expect.objectContaining({ skillId: 'monster.charge', simClockMs: 6160 })
    ]);
  });
});
