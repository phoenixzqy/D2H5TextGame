import { expect, it } from 'vitest';
import skills from '../../data/skills/druid.json';
import type { CombatUnit } from '../combat/types';
import { absorbCycloneArmor, activeCycloneArmor, composeCycloneArmorRank,
  CYCLONE_ARMOR_DEFINITION, cycloneArmorLethalBound, cycloneArmorResistance,
  payCycloneArmor, refreshCycloneArmorState, resolveCycloneArmorDefinition } from './cyclone-armor';

const id = 'skills-druid-cyclone-armor';
const source = skills.find(s => s.id === id);
if (!source) throw new Error('Missing authored Cyclone Armor');
const altered = (patch: object) => skills.map(row => row.id === id ? { ...row, ...patch } : row);
function hero(patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id: 'hero', name: 'hero', side: 'player', kind: 'hero', level: 30, tier: 'trash',
    life: 500, mana: 50, cycloneArmorRank: 20, statuses: [], activeBuffIds: [],
    skillOrder: [], cooldowns: {}, enraged: false,
    stats: { life: 1000, lifeMax: 1000, mana: 100, manaMax: 100, attack: 10, defense: 0,
      magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
      physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } }, ...patch };
}

it('copies the exact authored values without rewriting their source', () => {
  const rows = structuredClone(skills), before = structuredClone(rows);
  const d = resolveCycloneArmorDefinition(rows);
  expect(d).toEqual({ requiredLevel: 12, maxRank: 20, absorbPerRank: .025, resistPerRank: .01,
    manaCost: 17, cooldown: 4, costPerRank: -.2, cooldownPerRank: -.05 });
  expect(rows).toEqual(before); expect(Object.isFrozen(d)).toBe(true);
  expect(CYCLONE_ARMOR_DEFINITION).toEqual(d);
});

it.each([
  { trigger: 'passive' }, { target: 'all-allies' }, { cost: {} }, { appliesStatus: ['armor'] },
  { prerequisites: [] }, { damage: { min: 1, max: 2 } }, { timedBuff: { durationMs: 1000 } },
  ...[undefined, 0, -1, NaN, Infinity, .05, '0.025'].map(shieldAbsorbPct => ({
    scaling: { ...source.scaling, passiveStatsPerLevel: { shieldAbsorbPct, resistAllPct: .01 } } })),
  ...[0, -1, NaN, Infinity, '0.01'].map(resistAllPct => ({
    scaling: { ...source.scaling, passiveStatsPerLevel: { shieldAbsorbPct: .025, resistAllPct } } }))
])('rejects malformed or contradictory authored defense %j', patch => {
  expect(() => resolveCycloneArmorDefinition(altered(patch))).toThrow();
});
it('rejects missing or duplicate identity', () => {
  expect(() => resolveCycloneArmorDefinition(skills.filter(s => s.id !== id))).toThrow();
  expect(() => resolveCycloneArmorDefinition([...skills, source])).toThrow();
});

it('uses native exact aliases/MAX and complete class/unlock/prerequisite authority', () => {
  const p = { class: 'druid' as const, level: 30,
    skillLevels: { 'druid.arctic_blast': 1, [id]: 1, 'druid.cyclone_armor': 20 } };
  expect(composeCycloneArmorRank(p)).toBe(20);
  expect(composeCycloneArmorRank({ ...p, class: 'sorceress' })).toBe(0);
  expect(composeCycloneArmorRank({ ...p, level: 11 })).toBe(0);
  expect(composeCycloneArmorRank({ ...p, skillLevels: { [id]: 20 } })).toBe(0);
  for (const rank of [0, -1, .5, NaN, Infinity, 21]) expect(composeCycloneArmorRank({ ...p,
    skillLevels: { 'druid.arctic_blast': 1, [id]: rank } })).toBe(0);
});

it('pays one source-bound power without resource/stat refill and refreshes native rank on carry', () => {
  const input = hero(), before = structuredClone(input), paid = payCycloneArmor(input);
  expect(activeCycloneArmor(paid)).toBe(20); expect(cycloneArmorResistance(paid)).toBe(20);
  expect(paid.life).toBe(500); expect(paid.mana).toBe(50); expect(paid.stats).toBe(input.stats);
  expect(Object.isFrozen(paid.cycloneArmor)).toBe(true); expect(input).toEqual(before);
  const next = refreshCycloneArmorState({ ...paid, cycloneArmorRank: 1 });
  expect(activeCycloneArmor(next)).toBe(1); expect(next.life).toBe(500); expect(next.mana).toBe(50);
  expect(refreshCycloneArmorState({ ...paid, cycloneArmorRank: 0 }).activeBuffIds).toEqual([]);
  expect(refreshCycloneArmorState({ ...paid, cycloneArmorRank: 0 }).cycloneArmor).toBeUndefined();
});

it('does not infer paid power from a marker, another source, or a foreign role', () => {
  const paid = payCycloneArmor(hero());
  expect(activeCycloneArmor(hero({ activeBuffIds: ['cyclone-armor'] }))).toBe(0);
  for (const patch of [{ side: 'enemy' as const }, { kind: 'merc' as const }, { kind: 'summon' as const },
    { ownerId: 'owner' }, { life: 0 }, { cycloneArmorRank: 21 }, { level: 11 },
    { cycloneArmor: { sourceHeroId: 'other', rank: 20 } }]) {
    const invalid = { ...paid, ...patch };
    expect(activeCycloneArmor(invalid)).toBe(0);
    expect(refreshCycloneArmorState(invalid).cycloneArmor).toBeUndefined();
  }
});

it('uses exact cumulative quota differences and a sufficient Shatter bound', () => {
  const paid = payCycloneArmor(hero({ cycloneArmorRank: 1 }));
  expect(absorbCycloneArmor(paid, 40)).toEqual({ damage: 39, absorbed: 1 });
  expect(absorbCycloneArmor(paid, 20, 20)).toEqual({ damage: 19, absorbed: 1 });
  expect(absorbCycloneArmor(paid, 20)).toEqual({ damage: 20, absorbed: 0 });
  expect(cycloneArmorLethalBound(payCycloneArmor(hero()), 100)).toBe(200);
});
