import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { monsters } from '@/data/index';
import * as rngModule from '../rng';
import { getSkill, loadDefaultSkills, resetRegistry } from '../skills/registry';
import { runBattle, runBattleRecorded, type CombatSnapshot } from './combat';
import { buildMonsterUnit } from './monster-factory';
import type { ActiveStatus, CombatUnit, MonsterTier } from './types';

const hold = (appliedAtMs = 0): ActiveStatus => ({ id: 'stun', sourceId: 'fixture',
  remaining: -1, stacks: 1, appliedAtMs });
let rangeEndpoint: 0 | 1 = 0;
const specs = [
  { id: 'monster-frost-nova', canonical: 'monster.frost_nova', type: 'cold', base: [6, 9], growth: [1, 2], cd: 3, flight: 0 },
  { id: 'monster-arcane-bolt', canonical: 'monster.arcane_bolt', type: 'arcane', base: [12, 18], growth: [2, 3], cd: 2, flight: 500 }
] as const;
function input(id: string, level: number, tier: MonsterTier = 'trash'): CombatSnapshot {
  const def = monsters.find(row => row.id === 'monsters/act1.fallen');
  if (!def) throw new Error('Missing native monster');
  const enemy = buildMonsterUnit({ def, level, tier, id: 'enemy',
    extraSkillIds: [id], skillOrderOverride: [id], rng: rngModule.createRng(7) });
  const hero: CombatUnit = { ...enemy, id: 'hero', kind: 'hero', side: 'player',
    life: 100_000, mana: 100, skillOrder: [], statuses: [hold()],
    stats: { ...enemy.stats, life: 100_000, lifeMax: 100_000, mana: 100, manaMax: 100,
      defense: 0, magicResist: 0, physDodge: 0, magicDodge: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } } };
  return { act: 1, seed: 13, playerTeam: [hero], enemyTeam: [{ ...enemy,
    statuses: [hold(1005)], stats: { ...enemy.stats, attackSpeed: 187, critChance: 0 } }] };
}
function record(snapshot: CombatSnapshot) {
  const before = structuredClone(snapshot), output = runBattleRecorded(snapshot);
  expect(runBattleRecorded(snapshot)).toEqual(output);
  expect(runBattle(snapshot)).toEqual(output.result);
  expect(snapshot).toEqual(before);
  return output;
}
beforeEach(() => {
  rangeEndpoint = 0;
  resetRegistry(); loadDefaultSkills();
  const create = rngModule.createRng;
  vi.spyOn(rngModule, 'createRng').mockImplementation(seed => {
    const rng = create(seed);
    vi.spyOn(rng, 'nextInt').mockImplementation((min, max) => rangeEndpoint === 0 ? min : max);
    vi.spyOn(rng, 'chance').mockImplementation(chance => chance > .5);
    return rng;
  });
});
afterEach(() => { vi.restoreAllMocks(); resetRegistry(); loadDefaultSkills(); });

describe.each(specs)('$id native monster-level power', spec => {
  it.each([1, 3, 7, 15, 50, 90])('deals both exact L%i damage endpoints in real combat', level => {
    for (const endpoint of [0, 1] as const) {
      // Only the range endpoint is controlled; the real damage/status pipeline runs.
      rangeEndpoint = endpoint;
      const output = record(input(spec.id, level));
      expect(output.events.filter(e => e.kind === 'damage' && e.source === 'enemy')).toEqual([
        expect.objectContaining({ amount: spec.base[endpoint] + (level - 1) * spec.growth[endpoint],
          damageType: spec.type, dodged: false, simClockMs: 1004 + spec.flight })
      ]);
    }
  });
  it.each(['champion', 'rare-minion', 'rare-elite', 'boss'] as const)('uses monster level independently of %s Attack and allocated rank', tier => {
    const snapshot = input(spec.id, 7, tier);
    const output = record({ ...snapshot, playerTeam: snapshot.playerTeam.map(h => ({ ...h, level: 99 })),
      enemyTeam: snapshot.enemyTeam.map(e => ({ ...e, stats: { ...e.stats, attack: 9999 },
        skillLevels: { [spec.canonical]: 99, [spec.id]: 99 } })) });
    expect(output.events.filter(e => e.kind === 'damage' && e.source === 'enemy'))
      .toEqual([expect.objectContaining({ amount: spec.base[0] + 6 * spec.growth[0] })]);
  });
  it('uses the native target scope and keeps flight, cooldown and Chill', () => {
    const snapshot = input(spec.id, 7), hero = snapshot.playerTeam[0];
    if (!hero) throw new Error('Missing fixture hero');
    const output = record({ ...snapshot, playerTeam: [hero, { ...hero, id: 'merc', kind: 'merc' }] });
    expect(getSkill(spec.id)).toMatchObject({ id: spec.canonical, cooldown: spec.cd, manaCost: 0 });
    const targets = spec.type === 'cold' ? ['hero', 'merc'] : ['hero'];
    expect(output.events.flatMap(e => e.kind === 'damage' && e.source === 'enemy' ? [e.target] : [])).toEqual(targets);
    expect(output.events.filter(e => e.kind === 'status' && e.statusId === 'chill')).toHaveLength(spec.type === 'cold' ? 2 : 0);
  });
  it('retains magical dodge without applying Chill to a rejected hit', () => {
    const snapshot = input(spec.id, 7);
    const output = record({ ...snapshot, playerTeam: snapshot.playerTeam.map(h => ({ ...h,
      stats: { ...h.stats, magicDodge: 1 } })) });
    expect(output.events.filter(e => e.kind === 'damage' && e.source === 'enemy'))
      .toEqual([expect.objectContaining({ amount: 0, dodged: true })]);
    expect(output.events.some(e => e.kind === 'status' && e.statusId === 'chill')).toBe(false);
  });
  it('applies normal resistance, MR and crit after level growth', () => {
    const snapshot = input(spec.id, 7), base = spec.base[0] + 6 * spec.growth[0];
    const output = record({ ...snapshot, enemyTeam: snapshot.enemyTeam.map(e => ({ ...e,
      stats: { ...e.stats, critChance: 1, critDamage: 1.5 } })),
    playerTeam: snapshot.playerTeam.map(h => ({ ...h, stats: { ...h.stats, defense: 9999, magicResist: 3,
      resistances: { ...h.stats.resistances, [spec.type]: 20 } } })) });
    expect(output.events.filter(e => e.kind === 'damage' && e.source === 'enemy'))
      .toEqual([expect.objectContaining({ amount: Math.floor(base * 1.5 * .8 - 3), crit: true })]);
  });
  it.each(['hero', 'merc', 'summon'] as const)('does not give a %s caster monster-level growth', kind => {
    const snapshot = input(spec.id, 90);
    const output = record({ ...snapshot, enemyTeam: snapshot.enemyTeam.map(e => ({ ...e, kind })) });
    expect(output.events.filter(e => e.kind === 'damage' && e.source === 'enemy'))
      .toEqual([expect.objectContaining({ amount: spec.base[0] })]);
  });
  it('keeps monster-level power when the monster fights on the player side', () => {
    const snapshot = input(spec.id, 7), caster = snapshot.enemyTeam[0], target = snapshot.playerTeam[0];
    if (!caster || !target) throw new Error('Missing fixture participants');
    const output = record({ ...snapshot, playerTeam: [{ ...caster, side: 'player' }],
      enemyTeam: [{ ...target, side: 'enemy' }] });
    expect(output.events.filter(e => e.kind === 'damage' && e.source === 'enemy'))
      .toEqual([expect.objectContaining({ amount: spec.base[0] + 6 * spec.growth[0] })]);
  });
  it('preserves the authored cooldown through repeated real casts and fallback attacks', () => {
    const snapshot = input(spec.id, 7);
    const output = record({ ...snapshot, enemyTeam: snapshot.enemyTeam.map(e => ({ ...e,
      attackRange: [0, 0], statuses: [], stats: { ...e.stats, attack: 0 } })) });
    const casts = output.events.filter(e => e.kind === 'action' && e.skillId === spec.canonical);
    expect(casts.length).toBeGreaterThan(2);
    for (let i = 1; i < casts.length; i++) {
      const gap = (casts[i]?.simClockMs ?? 0) - (casts[i - 1]?.simClockMs ?? 0);
      expect(gap).toBeGreaterThanOrEqual(spec.cd * 1000);
      expect(gap).toBeLessThan(spec.cd * 1000 + 1004);
    }
  });
});
