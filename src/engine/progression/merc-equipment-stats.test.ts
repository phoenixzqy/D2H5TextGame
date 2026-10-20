import { describe, expect, it, vi } from 'vitest';
import type { Mercenary } from '../types/entities';
import type { DerivedStats } from '../types/attributes';
import type { Item } from '../types/items';
import { resolveDamage } from '../combat/damage';
import { createRng } from '../rng';

type Gear = Readonly<Record<string, Item | null>>;
type Composer = (merc: Mercenary, gear: Gear) => DerivedStats;
// Deferred actual import records each missing feature assertion as RED. No mock,
// fallback or catch; existing transfer/caller tests separately reproduce the bug.
async function compose(merc: Mercenary, gear: Gear): Promise<DerivedStats> {
  const actual = await vi.importActual<{ deriveEquippedMercStats: Composer }>('./merc-equipment-stats');
  return actual.deriveEquippedMercStats(merc, gear);
}
function baseline(): DerivedStats {
  return { life: 160, lifeMax: 172, mana: 60, manaMax: 79, attack: 25, defense: 26, magicResist: 0,
    attackSpeed: 122, critChance: 0.05, critDamage: 2, physDodge: 0.094,
    magicDodge: 0.05, magicFind: 0, goldFind: 0,
    resistances: { fire: 0, cold: 0, lightning: 0, poison: 0, arcane: 0, physical: 0 } };
}
function merc(): Mercenary {
  return { id: 'grown-rogue', name: 'Controlled grown rogue', type: 'mercenary',
    team: 'player', level: 6,
    coreStats: { strength: 15, dexterity: 31, vitality: 16, energy: 17 },
    derivedStats: baseline(), statusEffects: [], cooldowns: [], skills: [],
    comboOrder: ['mskill-basic-arrow'], alive: true, turnOrder: 0,
    archetype: 'back', rarity: 'R', classId: 'rogue', equipment: [] };
}
function gearItem(id: string, baseId = 'fixture/unknown',
  values: readonly (readonly [string, number])[] = []): Item {
  return { id, baseId, rarity: 'rare', level: 1, identified: true, equipped: true,
    affixes: [{ affixId: 'fixture-legacy', values: new Map(values) }] };
}
function sword(): Item {
  return { ...gearItem('rolled-sword', 'items/base/wp1h-short-sword'), baseRolls: { attack: 7 } };
}
function cap(): Item {
  return { ...gearItem('rolled-cap', 'items/base/helm-cap'), baseRolls: { defense: 6 } };
}
function rich(): Gear {
  return { weapon: sword(), head: { ...cap(), affixes: [{ affixId: 'rich-control', values: new Map([
    ['coreStats.strength', 5], ['coreStats.dexterity', 3], ['coreStats.vitality', 2],
    ['coreStats.energy', 2], ['statMods.life', 10], ['statMods.mana', 5],
    ['statMods.attack', 4], ['statMods.defense', 3], ['statMods.attackSpeed', 5],
    ['statMods.critChance', 0.1], ['statMods.critDamage', 0.25], ['statMods.physDodge', 0.01],
    ['statMods.magicDodge', 0.02], ['statMods.magicFind', 15], ['statMods.goldFind', 7],
    ['resistances.all', 5], ['resistances.fire', 10], ['resistances.lightning', 20]
  ]) }] } };
}
function expectStats(actual: DerivedStats, expected: DerivedStats): void {
  expect(actual.critChance).toBeCloseTo(expected.critChance, 12);
  expect(actual.physDodge).toBeCloseTo(expected.physDodge, 12);
  expect(actual.magicDodge).toBeCloseTo(expected.magicDodge, 12);
  expect({ ...actual, critChance: expected.critChance,
    physDodge: expected.physDodge, magicDodge: expected.magicDodge }).toEqual(expected);
}

describe('equipment deltas over immutable mercenary growth baseline', () => {
  it.each<Gear>([{}, { head: null }, { head: gearItem('unknown') },
    { head: gearItem('unsupported', 'fixture/unknown', [['statMods.attackPct', 99]]) },
    { head: { ...cap(), affixes: [{ affixId: 'cancel-base',
      values: new Map([['statMods.defense', -6]]) }] } }
  ])('preserves all saved fields exactly for zero-delta gear %j', async gear => {
    const owned = merc();
    const result = await compose(owned, gear);
    expect(result).toEqual(owned.derivedStats);
    expect(result).not.toBe(owned.derivedStats);
    expect(result.resistances).not.toBe(owned.derivedStats.resistances);
  });

  it('adds persisted base rolls without replacing earned growth by current-core formulas', async () => {
    expectStats(await compose(merc(), { weapon: sword(), head: cap() }),
      { ...baseline(), attack: 32, defense: 32 });
  });

  it('projects every supported scalar/core/resistance contribution once', async () => {
    expectStats(await compose(merc(), rich()), { ...baseline(), lifeMax: 186, manaMax: 87,
      attack: 38, defense: 35, attackSpeed: 130, critChance: 0.15, critDamage: 2.25,
      physDodge: 0.11, magicDodge: 0.07, magicFind: 15, goldFind: 7,
      resistances: { fire: 15, cold: 5, lightning: 25, poison: 5, arcane: 5, physical: 5 } });
  });
});


describe('resource and legacy boundaries', () => {
  it('preserves current resources when positive maximum gear is added or removed', async () => {
    const owned = merc();
    const equipped = await compose(owned, rich());
    expect(equipped).toMatchObject({ life: 160, lifeMax: 186, mana: 60, manaMax: 87 });
    expect(await compose(owned, {})).toEqual(baseline());
    expect(owned.derivedStats).toEqual(baseline());
  });

  it('clips pools only when effective maxima differ from the saved baseline', async () => {
    const owned = { ...merc(), derivedStats: { ...baseline(), mana: 75 } };
    expect(await compose(owned, { head: gearItem('negative', 'fixture/unknown',
      [['statMods.life', -20], ['statMods.mana', -10]]) })).toEqual({ ...baseline(),
      life: 152, lifeMax: 152, mana: 69, manaMax: 69 });
    expect(owned.derivedStats).toEqual({ ...baseline(), mana: 75 });
  });

  it('preserves legacy overflow at zero delta without persisting prior projections', async () => {
    const owned = { ...merc(), derivedStats: { ...baseline(), life: 180, mana: 85 } };
    expect(await compose(owned, rich())).toMatchObject({ life: 180, lifeMax: 186,
      mana: 85, manaMax: 87 });
    expect(await compose(owned, {})).toEqual({ ...baseline(), life: 180, mana: 85 });
  });

  it('floors changed speed after adding its delta to the grown baseline', async () => {
    const owned = merc();
    const slow = { head: gearItem('slow', 'fixture/unknown', [['statMods.attackSpeed', -500]]) };
    expect((await compose(owned, slow)).attackSpeed).toBe(1);
    expect((await compose(owned, {})).attackSpeed).toBe(122);
    const legacy = { ...owned, derivedStats: { ...baseline(), attackSpeed: 0 } };
    expect((await compose(legacy, {})).attackSpeed).toBe(0);
  });

  it.each([
    [199, 0, 299, 109, 0.448], [199, 3, 301, 110, 0.452],
    [499, 0, 449, 184, 0.749], [499, 5, 450, 185, 0.75],
    [501, 0, 450, 185, 0.75], [501, 5, 450, 185, 0.75]
  ])('uses shared cap/floor semantics for raw Dex%d +%d', async (dex, bonus, speed, attack, dodge) => {
    const bareSpeed = dex === 199 ? 299 : dex === 499 ? 449 : 450;
    const bareAttack = dex === 199 ? 109 : dex === 499 ? 184 : 185;
    const bareDodge = dex === 199 ? 0.448 : dex === 499 ? 0.749 : 0.75;
    const owned = { ...merc(), level: 1,
      coreStats: { strength: 0, dexterity: dex, vitality: 0, energy: 0 },
      derivedStats: { ...baseline(), life: 100, lifeMax: 100, mana: 50, manaMax: 50,
        defense: 20, attack: bareAttack, attackSpeed: bareSpeed, physDodge: bareDodge } };
    const result = await compose(owned, { head: gearItem('dex', 'fixture/unknown',
      [['coreStats.dexterity', bonus]]) });
    expectStats(result, { ...owned.derivedStats, attackSpeed: speed, attack, physDodge: dodge });
    expect(owned.coreStats.dexterity).toBe(dex);
  });

  it('never accumulates gear or aliases inputs across repeated composition', async () => {
    const owned = merc();
    const gear = rich();
    const before = structuredClone({ owned, gear });
    const first = await compose(owned, gear);
    const second = await compose(owned, gear);
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second.resistances).not.toBe(first.resistances);
    Object.assign(first.resistances, { fire: 999 });
    expect({ owned, gear }).toEqual(before);
    expect((await compose(owned, gear)).resistances.fire).toBe(15);
    expect(await compose(owned, {})).toEqual(baseline());
  });
});


describe('existing loot semantics and combat consumers', () => {
  it('uses modern persisted affix values without rerolling the definition', async () => {
    const rolled = { ...sword(), affixes: [{ id: 'affix.weapon.attack.flat', tier: 0, rolledValue: 3 }] };
    expectStats(await compose(merc(), { weapon: rolled }), { ...baseline(), attack: 35 });
  });

  it('uses real unique definition and persisted package roll', async () => {
    const unique: Item = { ...gearItem('pelta', 'items/base/sh-buckler'), rarity: 'unique',
      uniqueId: 'items/unique/pelta-lunata', baseRolls: { defense: 5 },
      statRolls: { 'pelta-lunata-defense': 27 } };
    expectStats(await compose(merc(), { offhand: unique }),
      { ...baseline(), lifeMax: 182, defense: 58 });
  });

  it('keeps duplicate-piece stats but counts distinct set pieces for thresholds', async () => {
    const ring: Item = { ...gearItem('ring-one', 'items/base/ring-iron'), rarity: 'set',
      setPieceId: 'sets/angelic-raiment/ring', setId: 'sets/angelic-raiment',
      statRolls: { 'angelic-halo-mf': 21 } };
    const amulet: Item = { ...gearItem('amulet', 'items/base/amu-tin'), rarity: 'set',
      setPieceId: 'sets/angelic-raiment/amulet', setId: 'sets/angelic-raiment' };
    expectStats(await compose(merc(), { 'ring-left': ring,
      'ring-right': { ...ring, id: 'ring-two' }, amulet }), { ...baseline(),
      lifeMax: 212, manaMax: 99, attack: 28, attackSpeed: 127, physDodge: 0.104,
      magicFind: 42 });
  });

  it('retains uncapped raw resistance points for the existing damage-time cap', async () => {
    const result = await compose(merc(), { head: gearItem('resists', 'fixture/unknown',
      [['resistances.fire', 120], ['resistances.cold', -150]]) });
    expect(result.resistances).toEqual({ fire: 120, cold: -150, lightning: 0,
      poison: 0, arcane: 0, physical: 0 });
  });

  it('produces independently calculated lower landed lightning damage', async () => {
    const stats = [await compose(merc(), {}),
      await compose(merc(), { weapon: sword(), head: cap() }), await compose(merc(), rich())];
    const damage = stats.map(defender => resolveDamage({ baseMin: 70, baseMax: 70,
      flatBonus: 0, increasedPct: 0, comboMult: 1, type: 'lightning',
      critChance: 0, critMult: 2, defenderResistances: defender.resistances,
      defenderArmor: defender.defense, defenderMagicResist: defender.defense,
      defenderDodge: defender.magicDodge, ignoreDodge: true }, createRng(7)));
    expect(damage.map(row => row.final)).toEqual([44, 38, 17]);
    expect(damage.map(row => [row.hit, row.crit, row.dodged])).toEqual([
      [true, false, false], [true, false, false], [true, false, false]
    ]);
  });
});


it('adds modifier deltas over noncanonical saved crit/reward/resistance baselines', async () => {
  const owned = { ...merc(), derivedStats: { ...baseline(), critChance: 0.2,
    critDamage: 1.5, magicFind: 9, goldFind: 4,
    resistances: { ...baseline().resistances, fire: 30, cold: -50 } } };
  const gear = { head: gearItem('legacy-baseline', 'fixture/unknown', [
    ['resistances.fire', 10], ['resistances.cold', 5], ['statMods.critChance', 0.1],
    ['statMods.critDamage', 0.25], ['statMods.magicFind', 15], ['statMods.goldFind', 7]
  ]) };
  expectStats(await compose(owned, gear), { ...owned.derivedStats,
    critChance: 0.3, critDamage: 1.75, magicFind: 24, goldFind: 11,
    resistances: { ...baseline().resistances, fire: 40, cold: -45 } });
});
