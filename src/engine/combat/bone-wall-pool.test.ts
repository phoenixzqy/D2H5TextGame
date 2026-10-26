import { expect, it } from 'vitest';
import type { ActiveStatus, CombatUnit } from './types';
import { rebaseStatusClock } from './status';
import { absorbBoneWall, boneWallPool, boneWallRank, composeBoneWallRank,
  copyBoneWallStatuses, payBoneWall } from '../skills/bone-wall';

function unit(patch: Partial<CombatUnit> = {}): CombatUnit {
  return { id: 'hero', name: 'Synthetic barrier hero', side: 'player', kind: 'hero', tier: 'trash', level: 30,
    boneWallRank: 1, life: 1000, mana: 1000, stats: { life: 1000, lifeMax: 1000, mana: 1000,
      manaMax: 1000, attack: 10, defense: 0, magicResist: 0, attackSpeed: 100, critChance: 0,
      critDamage: 1.5, physDodge: 0, magicDodge: 0, magicFind: 0, goldFind: 0,
      resistances: { physical: 0, fire: 0, cold: 0, lightning: 0, arcane: 0, poison: 0 } },
    statuses: [], cooldowns: {}, skillOrder: [], activeBuffIds: [], enraged: false, ...patch };
}
const status = (patch: Partial<ActiveStatus> = {}): ActiveStatus => ({ id: 'bone-wall', sourceId: 'hero',
  stacks: 1, remaining: 6, appliedAtMs: 500, expiresAtMs: 6500, boneWall: { rank: 1, remaining: 40 }, ...patch });
it.each([[1, 40], [6, 90], [12, 150], [20, 230]])('captures rank%i capacity%i once without changing caller state or resources', (rank, capacity) => {
  const hero = unit({ boneWallRank: rank }), before = structuredClone(hero), paid = payBoneWall(hero, rank, 500);
  expect(boneWallPool(paid, 500)?.boneWall).toEqual({ rank, remaining: capacity });
  expect(paid.mana).toBe(1000); expect(paid.stats).toBe(hero.stats); expect(hero).toEqual(before);
  expect(Object.isFrozen(boneWallPool(paid, 500)?.boneWall)).toBe(true);
  expect(payBoneWall(paid, rank, 600)).toBe(paid);
});
it('consumes a finite pool before life, preserves partial power, and permits payment again only after exhaustion or expiry', () => {
  const hero = payBoneWall(unit(), 1, 500), before = structuredClone(hero);
  const first = absorbBoneWall(hero, 15, 600);
  expect(first).toMatchObject({ damage: 0, absorbed: 15 });
  expect(boneWallPool(first.unit, 600)?.boneWall?.remaining).toBe(25);
  const second = absorbBoneWall(first.unit, 30, 700);
  expect(second).toMatchObject({ damage: 5, absorbed: 25 });
  expect(boneWallPool(second.unit, 700)).toBeUndefined();
  expect(payBoneWall(second.unit, 1, 701).statuses.find(s => s.id === 'bone-wall')?.boneWall?.remaining).toBe(40);
  expect(payBoneWall(hero, 1, 6500).statuses.find(s => s.id === 'bone-wall')?.expiresAtMs).toBe(12500);
  expect(hero).toEqual(before);
});
it('includes start, excludes expiry, and preserves fractional clocks and spent potency across wave rebasing', () => {
  const hero = unit({ statuses: [status({ appliedAtMs: 400.1, expiresAtMs: 6400.1 })] });
  const spent = absorbBoneWall(hero, 13, 500.1).unit, carried = rebaseStatusClock(spent, 700.2);
  expect(boneWallPool(hero, 400.099)).toBeUndefined(); expect(boneWallPool(hero, 400.1)).toBeDefined();
  expect(boneWallPool(carried, 0)?.boneWall?.remaining).toBe(27);
  expect(boneWallPool(carried, 6400.1 - 700.2)).toBeUndefined();
  const copied = copyBoneWallStatuses({ ...carried, boneWallRank: 20 });
  expect(copied.statuses).toEqual(carried.statuses);
  expect(copied.statuses[0]?.boneWall).not.toBe(carried.statuses[0]?.boneWall);
});
it.each<Partial<ActiveStatus>>([
  { id: 'bone-armor' }, { sourceId: 'other' }, { sourceId: '' }, { stacks: 0 }, { stacks: 2 },
  { remaining: NaN }, { remaining: -1 }, { appliedAtMs: NaN }, { expiresAtMs: Infinity },
  { expiresAtMs: 500 }, { expiresAtMs: 6500.01 }, { dotPerStack: 10 }, { damageType: 'fire' },
  { boneWall: { rank: 21, remaining: 240 } },
  { boneWall: { rank: .5, remaining: 10 } }, { boneWall: { rank: 1, remaining: 41 } },
  { boneWall: { rank: 1, remaining: 0 } }, { boneWall: { rank: 1, remaining: NaN } }
])('refuses marker-only or malformed paid payload %j', patch => {
  const hero = unit({ statuses: [status(patch)] });
  expect(boneWallPool(hero, 600)).toBeUndefined(); expect(absorbBoneWall(hero, 50, 600)).toMatchObject({ damage: 50, absorbed: 0 });
});
it.each<Partial<CombatUnit>>([{ boneWallRank: 0 }, { boneWallRank: .5 }, { boneWallRank: NaN },
  { boneWallRank: Infinity }, { boneWallRank: 21 }, { level: 11 }, { kind: 'merc' },
  { summon: true }, { ownerId: 'other' }, { summonOwnerId: 'other' }, { side: 'enemy' }, { life: 0 }, { id: '' }])(
  'does not grant paid power to ineligible heroes %j', patch => {
    const hero = unit(patch); expect(boneWallRank(hero)).toBe(0); expect(payBoneWall(hero, 1, 500)).toBe(hero);
  });
it('requires real class allocation and the complete prerequisite, with exact alias MAX', () => {
  const p = { class: 'necromancer', level: 12, skillLevels: { 'necromancer.bone_armor': 1,
    'necromancer.bone_wall': 1, 'skills-necromancer-bone-wall': 20 } };
  expect(composeBoneWallRank(p)).toBe(20); expect(composeBoneWallRank({ ...p, class: 'sorceress' })).toBe(0);
  expect(composeBoneWallRank({ ...p, level: 11 })).toBe(0);
  expect(composeBoneWallRank({ ...p, skillLevels: { 'necromancer.bone_wall': 20 } })).toBe(0);
});
it('requires paid +1 provenance for captured rank21 and never lets a bonus grant an unlearned skill', () => {
  const hero = unit({ boneWallRank: 20 });
  expect(payBoneWall(hero, 21, 500)).toBe(hero);
  expect(boneWallPool(payBoneWall(hero, 21, 500, 1), 600)?.boneWall).toEqual({ rank: 21, rankBonus: 1, remaining: 240 });
  const unlearned = unit({ boneWallRank: 0 }); expect(payBoneWall(unlearned, 1, 500, 1)).toBe(unlearned);
});
it('rejects duplicate pools and nonfinite clocks without consuming zero, negative or invalid damage', () => {
  const duplicate = unit({ statuses: [status(), status()] }); expect(boneWallPool(duplicate, 600)).toBeUndefined();
  const hero = unit({ statuses: [status()] });
  for (const damage of [0, -1, NaN, Infinity]) expect(absorbBoneWall(hero, damage, 600).unit).toBe(hero);
  for (const clock of [NaN, Infinity, -Infinity, Number.MAX_VALUE]) {
    expect(boneWallPool(hero, clock)).toBeUndefined(); expect(payBoneWall(unit(), 1, clock).statuses).toEqual([]);
  }
});

it('a marker with an absent paid payload grants no protection', () => {
  const { boneWall, ...marker } = status(); void boneWall;
  const hero = unit({ statuses: [marker] });
  expect(boneWallPool(hero, 600)).toBeUndefined();
  expect(absorbBoneWall(hero, 50, 600)).toMatchObject({ damage: 50, absorbed: 0 });
});
