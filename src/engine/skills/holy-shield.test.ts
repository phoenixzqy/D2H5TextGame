import { expect, it } from 'vitest';
import skills from '../../data/skills/paladin.json';
import type { CombatUnit } from '../combat/types';
import { absorbHolyShield, activeHolyShield, composeHolyShieldRank,
  HOLY_SHIELD_DEFINITION, holyShieldLethalBound, holyShieldDefense,
  payHolyShield, refreshHolyShieldState, resolveHolyShieldDefinition } from './holy-shield';

const id = 'skills-paladin-holy-shield';
const source = skills.find(s => s.id === id);
if (!source) throw new Error('Missing authored Holy Shield');
const altered = (patch: object) => skills.map(row => row.id === id ? { ...row, ...patch } : row);
function hero(patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id: 'hero', name: 'hero', side: 'player', kind: 'hero', level: 30, tier: 'trash',
    life: 500, mana: 50, holyShieldRank: 20, statuses: [], activeBuffIds: [],
    skillOrder: [], cooldowns: {}, enraged: false,
    stats: { life: 1000, lifeMax: 1000, mana: 100, manaMax: 100, attack: 10, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } }, ...patch };
}

it('copies the exact authored values without rewriting their source', () => {
  const rows = structuredClone(skills), before = structuredClone(rows);
  const d = resolveHolyShieldDefinition(rows);
  expect(d).toEqual({ requiredLevel: 24, maxRank: 20, absorbPerRank: .02, defensePerRank: .04,
    manaCost: 35, cooldown: 4, costPerRank: -.2, cooldownPerRank: -.05 });
  expect(rows).toEqual(before); expect(Object.isFrozen(d)).toBe(true);
  expect(HOLY_SHIELD_DEFINITION).toEqual(d);
});

it.each([
  { trigger: 'passive' }, { target: 'all-allies' }, { cost: {} }, { appliesStatus: ['armor'] },
  { prerequisites: [] }, { damage: { min: 1, max: 2 } }, { timedBuff: { durationMs: 1000 } },
  ...[undefined, 0, -1, NaN, Infinity, .05, '0.02'].map(shieldAbsorbPct => ({
    scaling: { ...source.scaling, passiveStatsPerLevel: { shieldAbsorbPct, defensePct: .04 } } })),
  ...[0, -1, NaN, Infinity, '0.04'].map(defensePct => ({
    scaling: { ...source.scaling, passiveStatsPerLevel: { shieldAbsorbPct: .02, defensePct } } }))
])('rejects malformed or contradictory authored defense %j', patch => {
  expect(() => resolveHolyShieldDefinition(altered(patch))).toThrow();
});
it('rejects missing or duplicate identity', () => {
  expect(() => resolveHolyShieldDefinition(skills.filter(s => s.id !== id))).toThrow();
  expect(() => resolveHolyShieldDefinition([...skills, source])).toThrow();
});

it('uses native exact aliases/MAX and complete class/unlock/prerequisite authority', () => {
  const p = { class: 'paladin' as const, level: 30,
    skillLevels: { 'paladin.smite': 1, 'paladin.charge': 1, [id]: 1, 'paladin.holy_shield': 20 } };
  expect(composeHolyShieldRank(p)).toBe(20);
  expect(composeHolyShieldRank({ ...p, class: 'sorceress' })).toBe(0);
  expect(composeHolyShieldRank({ ...p, level: 23 })).toBe(0);
  expect(composeHolyShieldRank({ ...p, skillLevels: { [id]: 20 } })).toBe(0);
  expect(composeHolyShieldRank({ ...p, skillLevels: { 'paladin.charge': 1, [id]: 20 } })).toBe(0);
  for (const rank of [0, -1, .5, NaN, Infinity, 21]) expect(composeHolyShieldRank({ ...p,
    skillLevels: { 'paladin.smite': 1, 'paladin.charge': 1, [id]: rank } })).toBe(0);
});

it('pays one source-bound power without resource/stat refill and refreshes native rank on carry', () => {
  const input = hero(), before = structuredClone(input), paid = payHolyShield(input);
  expect(activeHolyShield(paid)).toBe(20); expect(holyShieldDefense(paid)).toBe(.8);
  expect(paid.life).toBe(500); expect(paid.mana).toBe(50); expect(paid.stats).toBe(input.stats);
  expect(Object.isFrozen(paid.holyShield)).toBe(true); expect(input).toEqual(before);
  const next = refreshHolyShieldState({ ...paid, holyShieldRank: 1 });
  expect(activeHolyShield(next)).toBe(1); expect(next.life).toBe(500); expect(next.mana).toBe(50);
  expect(refreshHolyShieldState({ ...paid, holyShieldRank: 0 }).activeBuffIds).toEqual([]);
  expect(refreshHolyShieldState({ ...paid, holyShieldRank: 0 }).holyShield).toBeUndefined();
});

it('does not infer paid power from a marker, another source, or a foreign role', () => {
  const paid = payHolyShield(hero());
  expect(activeHolyShield(hero({ activeBuffIds: ['holy-shield'] }))).toBe(0);
  for (const patch of [{ side: 'enemy' as const }, { kind: 'merc' as const }, { kind: 'summon' as const },
    { ownerId: 'owner' }, { life: 0 }, { holyShieldRank: 21 }, { level: 23 },
    { holyShield: { sourceHeroId: 'other', rank: 20 } }]) {
    const invalid = { ...paid, ...patch };
    expect(activeHolyShield(invalid)).toBe(0);
    expect(refreshHolyShieldState(invalid).holyShield).toBeUndefined();
  }
});

it('uses exact cumulative quota differences and a sufficient Shatter bound', () => {
  const paid = payHolyShield(hero({ holyShieldRank: 1 }));
  expect(absorbHolyShield(paid, 50)).toEqual({ damage: 49, absorbed: 1 });
  expect(absorbHolyShield(paid, 25, 25)).toEqual({ damage: 24, absorbed: 1 });
  expect(absorbHolyShield(paid, 20)).toEqual({ damage: 20, absorbed: 0 });
  expect(holyShieldLethalBound(payHolyShield(hero()), 100)).toBe(167);
});
