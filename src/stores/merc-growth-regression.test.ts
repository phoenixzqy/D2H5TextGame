/**
 * BUG095 contract regressions independently drafted by QA.
 * These exercise public production boundaries; fixtures use the real catalog.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { loadMercPool, type MercDef } from '@/data/loaders/mercs';
import { deriveStats } from '@/engine/progression/stats';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import { buildSave, toJsonSafe } from '@/engine/save/serialize';
import { decodeSave } from '@/engine/save/validate';
import type { CoreStats, DerivedStats } from '@/engine/types/attributes';
import type { Mercenary, Player } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import type { SaveCurrent } from '@/engine/types/save';
import { createMercFromDef } from '@/stores/mercFactory';
import { mercXpForLevel, useMercStore } from '@/stores/mercStore';

const ROGUE = 'mercs/act1-rogue-inner-sight';
interface Gains { life: number; strength: number; dexterity: number; energy: number }
const GAINS: Readonly<Record<string, Gains>> = {
  rogue: { life: 8, strength: 1, dexterity: 3, energy: 1 },
  'desert-merc': { life: 14, strength: 3, dexterity: 1, energy: 1 },
  'iron-wolf': { life: 6, strength: 1, dexterity: 1, energy: 4 },
  barbarian: { life: 16, strength: 3, dexterity: 2, energy: 0 },
  paladin: { life: 12, strength: 2, dexterity: 1, energy: 1 },
  militia: { life: 10, strength: 2, dexterity: 1, energy: 1 },
  thief: { life: 7, strength: 1, dexterity: 3, energy: 1 },
  acolyte: { life: 6, strength: 1, dexterity: 1, energy: 4 }
};
const FALLBACK: Gains = { life: 10, strength: 2, dexterity: 1, energy: 1 };
const CLASS_HIRES = [
  ['mercs/act1-rogue-inner-sight', 'rogue'],
  ['mercs/act2-prayer', 'desert-merc'],
  ['mercs/act3-iron-wolf-fire', 'iron-wolf'],
  ['mercs/act5-barbarian-recruit', 'barbarian'],
  ['mercs/act4-paladin-initiate', 'paladin'],
  ['mercs/act3-militia-pikeman', 'militia'],
  ['mercs/tavern-thief-pickpocket', 'thief'],
  ['mercs/tavern-acolyte-priestess', 'acolyte']
] as const;

function definition(id = ROGUE): MercDef {
  const def = loadMercPool().pool.find(entry => entry.id === id);
  if (!def) throw new Error(`Missing real mercenary definition: ${id}`);
  return def;
}
function hire(id = ROGUE, suffix?: string): Mercenary {
  return createMercFromDef(definition(id), suffix);
}
function owned(id: string): Mercenary {
  const merc = useMercStore.getState().ownedMercs.find(entry => entry.id === id);
  if (!merc) throw new Error(`Missing owned mercenary: ${id}`);
  return merc;
}
function xpBetween(from: number, to: number): number {
  let total = 0;
  for (let level = from; level < to; level++) total += mercXpForLevel(level);
  return total;
}
function coreAfter(core: CoreStats, gain: Gains, levels: number): CoreStats {
  return { strength: core.strength + gain.strength * levels,
    dexterity: core.dexterity + gain.dexterity * levels,
    vitality: core.vitality, energy: core.energy + gain.energy * levels };
}
function expectFive(stats: DerivedStats, expected: Pick<DerivedStats,
  'attack' | 'defense' | 'attackSpeed' | 'manaMax' | 'physDodge'>): void {
  expect(stats.attack).toBe(expected.attack);
  expect(stats.defense).toBe(expected.defense);
  expect(stats.attackSpeed).toBe(expected.attackSpeed);
  expect(stats.manaMax).toBe(expected.manaMax);
  expect(stats.physDodge).toBeCloseTo(expected.physDodge, 12);
}
/** Reproduce the old public XP path exactly, including its frozen five fields. */
function historical(id = ROGUE, level = 16, suffix?: string,
  persistedClass: string | null = definition(id).classRef): Mercenary {
  const fresh = hire(id, suffix);
  const gain = persistedClass && Object.prototype.hasOwnProperty.call(GAINS, persistedClass)
    ? GAINS[persistedClass] ?? FALLBACK : FALLBACK;
  const n = level - fresh.level;
  const { classId: _classId, ...rest } = fresh;
  return { ...rest, ...(persistedClass === null ? {} : { classId: persistedClass }), level,
    coreStats: coreAfter(fresh.coreStats, gain, n),
    derivedStats: { ...fresh.derivedStats,
      life: 17, lifeMax: fresh.derivedStats.lifeMax + gain.life * n,
      mana: 23, magicResist: 17, critChance: 0.17, critDamage: 2.75,
      magicDodge: 0.19, magicFind: 23, goldFind: 31,
      resistances: { ...fresh.derivedStats.resistances, fire: 27, cold: -8 } } };
}
function saveWith(mercs: readonly Mercenary[]): SaveCurrent {
  const core = { strength: 10, dexterity: 10, vitality: 10, energy: 10 };
  const player: Player = { id: 'hero', name: 'Hero', type: 'player', team: 'player',
    class: 'amazon', level: 1, coreStats: core, derivedStats: deriveStats(core, 1),
    statusEffects: [], cooldowns: [], skills: [], comboOrder: [], alive: true, turnOrder: 0,
    experience: 0, experienceToNextLevel: 100, statPoints: 0, skillPoints: 1, equipment: [] };
  return buildSave({ player,
    inventory: { backpack: [], stash: [], equipped: {}, currencies: {} },
    mercs: { ownedMercs: mercs, fieldedMercId: mercs[0]?.id ?? null,
      mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [],
      clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'zh-CN', stealthMode: false, soundEnabled: true,
      musicEnabled: true, combatSpeed: 1, autoCombat: true },
      idleState: { lastOnline: 1000, offlineTime: 0, multiplierSecondsRemaining: 0, activeMultiplier: 1 },
      gachaState: { currency: 0, ownedMercIds: mercs.map(merc => merc.id), pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 },
      summonPositions: [] }, timestamp: 1000 });
}
function decodedMerc(merc: Mercenary): Mercenary {
  const result = decodeSave(saveWith([merc])).mercs.ownedMercs[0];
  if (!result) throw new Error('Decoder lost mercenary');
  return result;
}
function repairedExpected(merc: Mercenary): Mercenary {
  const bare = deriveStats(merc.coreStats, merc.level);
  return { ...merc, derivedStats: { ...merc.derivedStats, attack: bare.attack,
    defense: bare.defense, attackSpeed: bare.attackSpeed, manaMax: bare.manaMax,
    physDodge: bare.physDodge } };
}

beforeEach(() => { useMercStore.getState().reset(); });

describe('BUG095 real-store mercenary derived growth', () => {
  it('retains all eight class HP/core gain rows and the mercenary MR policy', () => {
    for (const [id, classId] of CLASS_HIRES) {
      const before = hire(id);
      const gain = GAINS[classId];
      if (!gain) throw new Error(`Missing gain oracle: ${classId}`);
      useMercStore.getState().addMerc(before);
      useMercStore.getState().addExperience(id, mercXpForLevel(before.level));
      const after = owned(id);
      expect(after.coreStats).toEqual(coreAfter(before.coreStats, gain, 1));
      expectFive(after.derivedStats, deriveStats(after.coreStats, after.level));
      expect(after.derivedStats).toMatchObject({ life: before.derivedStats.life + gain.life,
        lifeMax: before.derivedStats.lifeMax + gain.life,
        mana: before.derivedStats.mana, magicResist: before.derivedStats.magicResist });
    }
  });

  it('applies formula deltas over custom offsets without refilling mana or replacing unrelated fields', () => {
    const fresh = hire();
    const merc: Mercenary = { ...fresh, alive: false, derivedStats: { ...fresh.derivedStats,
      life: 50, lifeMax: 200, mana: 40, manaMax: 104, attack: 425, defense: 33,
      attackSpeed: 133, physDodge: 0.124, magicResist: 17, critChance: 0.17,
      critDamage: 2.75, magicDodge: 0.19, magicFind: 23, goldFind: 31,
      resistances: { ...fresh.derivedStats.resistances, fire: 27 } } };
    useMercStore.getState().addMerc(merc);
    useMercStore.getState().addExperience(merc.id, mercXpForLevel(3));
    const after = owned(merc.id);
    expectFive(after.derivedStats, { attack: 428, defense: 36, attackSpeed: 136,
      manaMax: 109, physDodge: 0.13 });
    expect(after.derivedStats).toMatchObject({ life: 58, lifeMax: 208, mana: 40,
      magicResist: 17, critChance: 0.17, critDamage: 2.75, magicDodge: 0.19,
      magicFind: 23, goldFind: 31, resistances: merc.derivedStats.resistances });
    expect(after.alive).toBe(false);
    expect(after.skills).toBe(merc.skills);
    expect(after.cooldowns).toBe(merc.cooldowns);
    expect(after.statusEffects).toBe(merc.statusEffects);
    expect(after.comboOrder).toBe(merc.comboOrder);
    expect(merc.derivedStats.manaMax).toBe(104);
  });

  it('composes a multi-level XP grant exactly like successive single-level grants', () => {
    const merc = hire();
    useMercStore.getState().addMerc(merc);
    useMercStore.getState().addExperience(merc.id, xpBetween(3, 16) + 9);
    const bulk = owned(merc.id);
    const bulkProgress = useMercStore.getState().getMercProgress(merc.id);
    useMercStore.getState().reset();
    useMercStore.getState().addMerc(merc);
    for (let level = 3; level < 16; level++) {
      useMercStore.getState().addExperience(merc.id, mercXpForLevel(level));
    }
    useMercStore.getState().addExperience(merc.id, 9);
    const single = owned(merc.id);
    expect(single.derivedStats.physDodge).toBeCloseTo(bulk.derivedStats.physDodge, 12);
    expect({ ...single, derivedStats: { ...single.derivedStats, physDodge: bulk.derivedStats.physDodge } })
      .toEqual(bulk);
    expect(useMercStore.getState().getMercProgress(merc.id)).toEqual(bulkProgress);
  });

  it('keeps equipment out of saved growth and projects the same item exactly once', () => {
    const merc = hire();
    const sword: Item = { id: 'growth-sword', baseId: 'items/base/wp1h-short-sword',
      rarity: 'normal', level: 1, identified: true, equipped: true,
      baseRolls: { attack: 7 }, affixes: [] };
    const equipment = { weapon: sword };
    useMercStore.getState().addMerc(merc);
    useMercStore.setState({ mercEquipment: { [merc.id]: equipment } });
    useMercStore.getState().addExperience(merc.id, xpBetween(3, 16));
    const after = owned(merc.id);
    expect(after.derivedStats.attack).toBe(70);
    expect(deriveEquippedMercStats(after, equipment).attack).toBe(77);
    expect(deriveEquippedMercStats(after, equipment).attack).toBe(77);
    expect(deriveEquippedMercStats(after, {}).attack).toBe(70);
    expect(useMercStore.getState().mercEquipment[merc.id]).toBe(equipment);
    expect(useMercStore.getState().mercEquipment[merc.id]?.weapon).toBe(sword);
    expect(sword.baseRolls).toEqual({ attack: 7 });
  });

  it('keeps zero/negative XP and unknown IDs as pure no-ops, including an unrepaired cache', () => {
    const merc = historical();
    useMercStore.setState({ ownedMercs: [merc] });
    const before = useMercStore.getState();
    expect(before.addExperience(merc.id, 0)).toEqual({ levelsGained: 0, newLevel: 16 });
    expect(before.addExperience(merc.id, -1)).toEqual({ levelsGained: 0, newLevel: 16 });
    expect(before.addExperience('unknown', 10)).toEqual({ levelsGained: 0, newLevel: 1 });
    expect(useMercStore.getState()).toBe(before);
    expect(before.mercProgress).toEqual({});
  });

  it('credits noncrossing XP to a custom history without replacing its mercenary object', () => {
    const stale = historical();
    const merc = { ...stale, derivedStats: { ...stale.derivedStats, attack: 999 } };
    useMercStore.getState().addMerc(merc);
    expect(useMercStore.getState().addExperience(merc.id, 1)).toEqual({ levelsGained: 0, newLevel: 16 });
    expect(owned(merc.id)).toBe(merc);
    expect(useMercStore.getState().getMercProgress(merc.id))
      .toEqual({ experience: 1, experienceToNextLevel: mercXpForLevel(16) });
  });

  it('retains historical repair even when positive XP crosses no level threshold', () => {
    const merc = historical();
    useMercStore.getState().addMerc(merc);
    expect(useMercStore.getState().addExperience(merc.id, 1)).toEqual({ levelsGained: 0, newLevel: 16 });
    expect(owned(merc.id)).toEqual(repairedExpected(merc));
    expect(useMercStore.getState().getMercProgress(merc.id).experience).toBe(1);
    expect(merc.derivedStats.attack).toBe(25);
  });

  it('uses finite fallback growth for missing, unknown and prototype-like class IDs', () => {
    for (const classId of [null, 'no-such-class', 'constructor', '__proto__', 'toString']) {
      const fresh = hire();
      const { classId: _classId, ...rest } = fresh;
      const merc: Mercenary = { ...rest, id: `custom/fallback-${String(classId)}`,
        ...(classId === null ? {} : { classId }) };
      useMercStore.getState().addMerc(merc);
      useMercStore.getState().addExperience(merc.id, mercXpForLevel(3));
      const after = owned(merc.id);
      expect(after.coreStats).toEqual({ strength: 14, dexterity: 23, vitality: 16, energy: 15 });
      expectFive(after.derivedStats, { attack: 27, defense: 29, attackSpeed: 123,
        manaMax: 84, physDodge: 0.096 });
      expect(after.derivedStats.lifeMax).toBe(158);
      for (const value of Object.values(after.coreStats)) expect(Number.isFinite(value)).toBe(true);
      for (const value of Object.values(after.derivedStats)) {
        if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
      }
    }
  });

  it('routes upgrade through the same growth transition and advances existing canonical progress', () => {
    const merc = hire();
    useMercStore.getState().addMerc(merc);
    useMercStore.setState({ mercProgress: { [merc.id]: { experience: 17, experienceToNextLevel: 304 } } });
    useMercStore.getState().upgradeMerc(merc.id);
    const upgraded = owned(merc.id);
    expect(upgraded.level).toBe(4);
    expect(upgraded.coreStats).toEqual({ strength: 13, dexterity: 25, vitality: 16, energy: 15 });
    expectFive(upgraded.derivedStats, { attack: 28, defense: 29, attackSpeed: 125,
      manaMax: 84, physDodge: 0.1 });
    expect(upgraded.derivedStats).toMatchObject({ life: 156, lifeMax: 156, mana: 79 });
    expect(useMercStore.getState().getMercProgress(merc.id))
      .toEqual({ experience: 17, experienceToNextLevel: mercXpForLevel(4) });
  });

  it('preserves explicit custom progress and leaves missing progress absent on upgrade', () => {
    const explicitMerc = hire(ROGUE, 'explicit');
    const missingMerc = hire(ROGUE, 'missing');
    const progress = { experience: 17, experienceToNextLevel: 50 };
    useMercStore.setState({ ownedMercs: [explicitMerc, missingMerc],
      mercProgress: { [explicitMerc.id]: progress } });
    useMercStore.getState().upgradeMerc(explicitMerc.id);
    expect(useMercStore.getState().mercProgress[explicitMerc.id]).toEqual(progress);
    const progressMap = useMercStore.getState().mercProgress;
    useMercStore.getState().upgradeMerc(missingMerc.id);
    expect(owned(missingMerc.id).level).toBe(4);
    expect(useMercStore.getState().mercProgress).toBe(progressMap);
    expect(useMercStore.getState().mercProgress[missingMerc.id]).toBeUndefined();
    expect(useMercStore.getState().getMercProgress(missingMerc.id))
      .toEqual({ experience: 0, experienceToNextLevel: mercXpForLevel(4) });
  });

  it('refuses nonfinite transition output before either mutation publishes state', () => {
    const fresh = hire();
    const corrupt: Mercenary = { ...fresh, id: 'custom/nonfinite-baseline',
      derivedStats: { ...fresh.derivedStats, defense: Infinity } };
    for (const action of ['xp', 'upgrade'] as const) {
      useMercStore.getState().reset();
      useMercStore.getState().addMerc(corrupt);
      const before = useMercStore.getState();
      // The contract permits throwing or refusing; either must leave the store untouched.
      try {
        if (action === 'xp') before.addExperience(corrupt.id, mercXpForLevel(corrupt.level));
        else before.upgradeMerc(corrupt.id);
      } catch {
        // Refusal is verified by the publication assertion below.
      }
      expect(useMercStore.getState()).toBe(before);
      expect(owned(corrupt.id)).toBe(corrupt);
    }
  });

  it('repairs an exact historical cache before upgrading without baking its frozen tuple', () => {
    const merc = historical();
    useMercStore.getState().addMerc(merc);
    useMercStore.getState().upgradeMerc(merc.id);
    const after = owned(merc.id);
    expect(after.level).toBe(17);
    expectFive(after.derivedStats, { attack: 74, defense: 68, attackSpeed: 164,
      manaMax: 156, physDodge: 0.178 });
    expect(after.derivedStats).toMatchObject({ life: 25, lifeMax: 260, mana: 23, magicResist: 17 });
  });

  it('refuses finite-input XP sum overflow without publishing progress or growth', () => {
    const merc = { ...hire(), id: 'custom/xp-overflow' };
    useMercStore.setState({ ownedMercs: [merc], mercProgress: { [merc.id]: {
      experience: Number.MAX_VALUE, experienceToNextLevel: Number.MAX_VALUE } } });
    const before = useMercStore.getState();
    expect(() => before.addExperience(merc.id, Number.MAX_VALUE)).toThrow('Invalid mercenary XP');
    expect(useMercStore.getState()).toBe(before);
  });

  it.each(['xp', 'upgrade'] as const)('refuses canonical threshold overflow on %s atomically', action => {
    // Last finite canonical threshold; L2661 overflows despite finite level/stats.
    const merc = { ...hire(), id: 'custom/threshold-overflow', level: 2660 };
    const threshold = mercXpForLevel(2660);
    expect(Number.isFinite(threshold)).toBe(true);
    expect(mercXpForLevel(2661)).toBe(Infinity);
    useMercStore.setState({ ownedMercs: [merc], mercProgress: { [merc.id]: {
      experience: 0, experienceToNextLevel: threshold } } });
    const before = useMercStore.getState();
    expect(() => {
      if (action === 'xp') before.addExperience(merc.id, threshold);
      else before.upgradeMerc(merc.id);
    }).toThrow('Invalid mercenary XP');
    expect(useMercStore.getState()).toBe(before);
  });
});

describe('BUG095 validated-save historical repair boundary', () => {
  it('repairs only the five exact stale fields for a known suffixed catalog hire', () => {
    const merc = historical(ROGUE, 16, 'saved-instance');
    const result = decodedMerc(merc);
    expect(result).toEqual(repairedExpected(merc));
    expectFive(result.derivedStats, { attack: 70, defense: 65, attackSpeed: 161,
      manaMax: 150, physDodge: 0.172 });
    expect(result.derivedStats).toMatchObject({ life: 17, lifeMax: 252, mana: 23,
      magicResist: 17, critChance: 0.17, critDamage: 2.75, magicDodge: 0.19,
      magicFind: 23, goldFind: 31, resistances: merc.derivedStats.resistances });
  });

  it('recognizes the same complete stale signature for every catalog class and fallback', () => {
    for (const [id] of CLASS_HIRES) {
      const merc = historical(id, definition(id).reqLevel + 3);
      expect(decodedMerc(merc)).toEqual(repairedExpected(merc));
    }
    for (const classId of [null, 'unknown-class', 'constructor', '__proto__', 'toString']) {
      const merc = historical(ROGUE, 6, undefined, classId);
      expect(decodedMerc(merc)).toEqual(repairedExpected(merc));
    }
  });

  it('does not repair when any one member of the complete five-field stale tuple differs', () => {
    const merc = historical();
    const keys = ['attack', 'defense', 'attackSpeed', 'manaMax', 'physDodge'] as const;
    for (const key of keys) {
      const custom = { ...merc, derivedStats: { ...merc.derivedStats,
        [key]: merc.derivedStats[key] + (key === 'physDodge' ? 0.001 : 1) } };
      expect(decodedMerc(custom)).toEqual(custom);
    }
  });

  it('does not repair unknown IDs, altered core/class-life histories or unadvanced hires', () => {
    const merc = historical();
    const controls: readonly Mercenary[] = [
      { ...merc, id: 'custom/unknown-catalog-merc' },
      { ...merc, coreStats: { ...merc.coreStats, strength: merc.coreStats.strength + 1 } },
      { ...merc, coreStats: { ...merc.coreStats, vitality: merc.coreStats.vitality + 1 } },
      { ...merc, classId: 'barbarian' },
      { ...merc, derivedStats: { ...merc.derivedStats, lifeMax: merc.derivedStats.lifeMax + 1 } },
      hire(),
      { ...hire(), level: 2 }
    ];
    for (const control of controls) expect(decodedMerc(control)).toEqual(control);
  });

  it('preserves already current growth, custom histories and immutable/idempotent save contents', () => {
    const merc = historical();
    const fixed = repairedExpected(merc);
    const custom = { ...merc, id: `${ROGUE}#custom`, derivedStats: { ...merc.derivedStats, attack: 999 } };
    const base = saveWith([merc, custom]);
    const save: SaveCurrent = { ...base, mercs: { ...base.mercs,
      mercProgress: { [merc.id]: { experience: 17, experienceToNextLevel: 50 } } } };
    const snapshot = structuredClone(save);
    const first = decodeSave(toJsonSafe(save));
    const second = decodeSave(toJsonSafe(first));
    expect(save).toEqual(snapshot);
    expect(first.mercs.ownedMercs).toEqual([fixed, custom]);
    expect(second).toEqual(first);
    expect(first.mercs.mercProgress).toEqual(save.mercs.mercProgress);
    expect(first.inventory).toEqual(save.inventory);
    expect(first.map).toEqual(save.map);
    expect(first.meta).toEqual(save.meta);
    expect(first.formation).toEqual(save.formation);
    expect(decodedMerc(fixed)).toEqual(fixed);
  });

  it('rejects nonfinite save input instead of repairing or publishing corrupt derived data', () => {
    const merc = historical();
    for (const value of [NaN, Infinity, -Infinity]) {
      const bad = { ...merc, derivedStats: { ...merc.derivedStats, attack: value } };
      const save = saveWith([bad]);
      const savedMerc = save.mercs.ownedMercs[0];
      expect(() => decodeSave(save)).toThrow('Invalid save');
      expect(save.mercs.ownedMercs[0]).toBe(savedMerc);
      expect(savedMerc).toEqual(bad);
      expect(savedMerc?.derivedStats).toBe(bad.derivedStats);
      expect(Object.is(bad.derivedStats.attack, value)).toBe(true);
    }
  });
});
