import { expect, it } from 'vitest';
import skills from '../../data/skills/necromancer.json';
import { createSkillValidator } from './skill-validator';
import { resolveBoneArmorDefinition, absorbBoneArmor, boneArmorPool, copyBoneArmorStatuses } from './bone-armor';
import type { ActiveStatus, CombatUnit } from '../combat/types';

it('requires one exact passive personal authored definition, copies tuning and rejects contradictions', () => {
  const row = skills.find(s => s.id === 'skills-necromancer-bone-armor');
  if (!row) throw new Error('Missing Bone Armor');
  const validate = createSkillValidator();
  expect(resolveBoneArmorDefinition(skills)).toEqual({ requiredLevel: 1, maxRank: 20, absorbPerRank: 12 });
  const changed = { ...row, maxLevel: 4, scaling: { passiveStatsPerLevel: { boneArmorAbsorb: 7 } } };
  const d = resolveBoneArmorDefinition([changed]);
  changed.scaling.passiveStatsPerLevel.boneArmorAbsorb = 999;
  expect(d.absorbPerRank).toBe(7); expect(Object.isFrozen(d)).toBe(true);
  expect(() => resolveBoneArmorDefinition([])).toThrow();
  expect(() => resolveBoneArmorDefinition([row, row])).toThrow();
  for (const patch of [{ trigger: 'active' }, { target: 'all-allies' }, { cost: { mana: 1 } },
    { cooldown: 1 }, { requiredLevel: undefined }, { damage: { min: 1, max: 2 } },
    ...[-1, NaN, Infinity, '12'].map(boneArmorAbsorb => ({ scaling: { passiveStatsPerLevel: { boneArmorAbsorb } } })),
    { scaling: { passiveStatsPerLevel: { boneArmorAbsorb: 12, lifePct: 1 } } }]) {
    expect(validate({ ...row, ...patch })).toBe(false);
    expect(() => resolveBoneArmorDefinition([{ ...row, ...patch }])).toThrow();
  }
  expect(resolveBoneArmorDefinition([{ ...row, scaling: { passiveStatsPerLevel: { boneArmorAbsorb: 0 } } }]).absorbPerRank).toBe(0);
});

const status: ActiveStatus = { id: 'bone-armor', sourceId: 'hero', stacks: 1, remaining: -1, boneArmor: { rank: 1, remaining: 12 } };
const hero: CombatUnit = { id: 'hero', name: 'hero', side: 'player', kind: 'hero', level: 1,
  tier: 'trash', life: 10, mana: 0, statuses: [status], cooldowns: {}, skillOrder: [],
  activeBuffIds: [], enraged: false, stats: { life: 10, lifeMax: 10, mana: 0, manaMax: 0,
    attack: 1, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0, critDamage: 1.5,
    physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
    resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0 } } };
it('copies valid payloads without retaining or freezing caller objects', () => {
  const input = structuredClone(hero), copied = copyBoneArmorStatuses(input);
  expect(copied).toEqual(input);
  expect(copied.statuses[0]?.boneArmor).not.toBe(input.statuses[0]?.boneArmor);
  expect(Object.isFrozen(input.statuses[0]?.boneArmor)).toBe(false);
  expect(absorbBoneArmor(copied, 3).unit.statuses[0]?.boneArmor?.remaining).toBe(9);
  expect(input.statuses[0]?.boneArmor?.remaining).toBe(12);
});
it('rejects malformed, duplicate, foreign, dead and nonhero pools without allocating replacement capacity', () => {
  const badStatuses = [
    { ...status, sourceId: 'other' }, { ...status, stacks: 2 }, { ...status, remaining: 1 },
    { ...status, expiresAtMs: 9999 }, { id: 'bone-armor', sourceId: 'hero', stacks: 1, remaining: -1 },
    ...[0, -1, 13, NaN, Infinity].map(remaining => ({ ...status, boneArmor: { rank: 1, remaining } })),
    ...[0, -1, 1.5, 21, NaN, Infinity].map(rank => ({ ...status, boneArmor: { rank, remaining: 1 } }))
  ];
  for (const s of badStatuses) expect(boneArmorPool({ ...hero, statuses: [s] })).toBeUndefined();
  for (const fields of [{ side: 'enemy' as const }, { kind: 'merc' as const }, { summon: true },
    { ownerId: 'other' }, { summonOwnerId: 'other' }, { level: NaN }, { life: 0 }, { life: Infinity },
    { statuses: [status, status] }]) {
    const unit = { ...hero, ...fields };
    expect(boneArmorPool(unit)).toBeUndefined();
    expect(absorbBoneArmor(unit, 5)).toEqual({ unit, damage: 5, absorbed: 0 });
  }
});
