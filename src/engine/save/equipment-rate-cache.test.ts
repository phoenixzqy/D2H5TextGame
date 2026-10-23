import { describe, expect, it } from 'vitest';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave } from './validate';
import { deriveStats } from '../progression/stats';
import type { Item } from '../types/items';
import type { SaveCurrent } from '../types/save';
import { loadSets, loadUniques } from '@/data/loaders/loot';

function item(affixes: NonNullable<Item['affixes']> = []): Item {
  return { id: 'saved-rate-item', baseId: 'items/base/amu-tin', rarity: 'rare',
    level: 9, identified: true, equipped: true, affixes };
}
function saved(equipped: Record<string, Item | null> = {}): SaveCurrent {
  const coreStats = { strength: 10, dexterity: 25, vitality: 37, energy: 63 };
  return buildSave({
    timestamp: 1000,
    player: {
      id: 'saved-hero', name: 'Saved hero', type: 'player', team: 'player',
      class: 'sorceress', level: 12, coreStats,
      derivedStats: { ...deriveStats(coreStats, 12), life: 53, mana: 47,
        lifeMax: 900, manaMax: 800, attack: 777, magicResist: 17,
        critChance: .37, critDamage: 7, physDodge: 2.1, magicDodge: .44 },
      statusEffects: [], cooldowns: [], skills: [], comboOrder: [],
      alive: true, turnOrder: 0, experience: 21631, experienceToNextLevel: 49883,
      statPoints: 5, skillPoints: 0, equipment: []
    },
    inventory: { backpack: [], stash: [], equipped, currencies: { rune: 3 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [],
      clearedSubAreas: [], questProgress: {} },
    meta: {
      settings: { locale: 'zh-CN', stealthMode: false, soundEnabled: true,
        musicEnabled: true, combatSpeed: 1, autoCombat: true },
      idleState: { lastOnline: 1000, offlineTime: 0,
        multiplierSecondsRemaining: 0, activeMultiplier: 1 },
      gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 }
    },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 },
      summonPositions: [] }
  });
}
const modern = [
  ['affix.precise.crit-chance', 'critChance', 2, .07],
  ['affix.savage.crit-damage', 'critDamage', 5, 2.05],
  ['affix.nimble.phys-dodge', 'physDodge', 2, .12],
  ['affix.ethereal.magic-dodge', 'magicDodge', 1, .06]
] as const;
const correctedUniques = [
  ['crushflange', 'critChance', .15], ['goblin-toe', 'critChance', .20],
  ['whistan-guard', 'physDodge', .20], ['ribcracker', 'critChance', .15],
  ['razor-tine', 'critChance', .15], ['hone-sundan', 'critChance', .15],
  ['darksight-helm', 'magicDodge', .15], ['spirit-ward', 'magicDodge', .20],
  ['earth-shaker', 'critChance', .15], ['gerke-sanctuary', 'magicDodge', .25],
  ['steel-shade', 'magicDodge', .20], ['steelshade', 'physDodge', .25],
  ['buriza-do-kyanon', 'physDodge', .18], ['kerke-sanctuary', 'magicDodge', .25],
  ['eaglehorn', 'critChance', .13], ['eaglehorn', 'magicDodge', .15],
  ['shadow-dancer', 'magicDodge', .20], ['the-stone-crusher', 'critChance', .20],
  ['the-gladiator-bane', 'magicDodge', .20], ['the-cranium-basher', 'critChance', .25],
  ['the-cranium-basher-greater', 'critChance', .30]
] as const;
function unique(slug: string): Item {
  const def = loadUniques().find(row => row.id === `items/unique/${slug}`);
  if (!def) throw new Error(`missing unique ${slug}`);
  return { ...item(), id: slug, baseId: def.baseId, uniqueId: def.id, rarity: 'unique',
    statRolls: { irrelevant: 987 } };
}
function set(id: string, count: number): Record<string, Item> {
  const def = loadSets().find(row => row.id === id);
  if (!def?.pieces || def.pieces.length < count) throw new Error(`missing set ${id}`);
  return Object.fromEntries(def.pieces.slice(0, count).map(piece => [piece.id, {
    ...item(), id: piece.id, baseId: piece.baseId, rarity: 'set',
    setPieceId: piece.id, setId: id
  }]));
}

describe('historical equipped-rate cache compatibility', () => {
  it.each(modern)('repairs only %s source field %s', (id, key, raw, expected) => {
    const input = saved({ amulet: item([{ id, tier: 0, rolledValue: raw }]) });
    const before = structuredClone(input);
    const output = decodeSave(input);
    expect(output.player.derivedStats[key]).toBeCloseTo(expected, 12);
    const preserved = { ...output, player: { ...output.player,
      derivedStats: { ...output.player.derivedStats } } };
    preserved.player.derivedStats[key] = input.player.derivedStats[key];
    expect(preserved).toEqual(input);
    expect(input).toEqual(before);
    expect(decodeSave(output)).toEqual(output);
    expect(decodeSave(toJsonSafe(input))).toEqual(output);
  });

  it('preserves naked and legacy-map-only caches exactly', () => {
    const naked = saved();
    const legacy = saved({ amulet: item([{ affixId: 'legacy',
      values: new Map([['statMods.critDamage', .25], ['statMods.physDodge', .02]]) }]) });
    expect(decodeSave(naked)).toEqual(naked);
    expect(decodeSave(legacy)).toEqual(legacy);
    expect(decodeSave(toJsonSafe(legacy))).toEqual(legacy);
  });

  it.each(correctedUniques)('repairs canonical %s %s without rewriting its item', (slug, key, value) => {
    const input = saved({ gear: unique(slug) });
    const output = decodeSave(input);
    expect(output.player.derivedStats[key]).toBeCloseTo(value, 12);
    const preserved = { ...output, player: { ...output.player,
      derivedStats: { ...output.player.derivedStats } } };
    preserved.player.derivedStats[key] = input.player.derivedStats[key];
    if (slug === 'eaglehorn') {
      expect(output.player.derivedStats.critChance).toBeCloseTo(.13, 12);
      expect(output.player.derivedStats.magicDodge).toBeCloseTo(.15, 12);
      preserved.player.derivedStats.critChance = input.player.derivedStats.critChance;
      preserved.player.derivedStats.magicDodge = input.player.derivedStats.magicDodge;
    }
    expect(preserved).toEqual(input);
  });

  it.each([
    ['sets/cleglaw-brace', 3, { physDodge: .25 }],
    ['sets/natalyas-odium', 3, { critChance: .20 }],
    ['sets/natalyas-odium', 4, { critChance: .20, critDamage: 2.50 }]
  ] as const)('repairs only active corrected bonuses of %s at %s pieces', (id, count, changes) => {
    const input = saved(set(id, count));
    const output = decodeSave(input);
    expect(output).toEqual({ ...input, player: { ...input.player,
      derivedStats: { ...input.player.derivedStats, ...changes } } });
    expect(decodeSave(toJsonSafe(output))).toEqual(output);
  });

  it('counts distinct canonical set pieces with authoritative set membership', () => {
    const pieces = Object.values(set('sets/cleglaw-brace', 3));
    const [first, second, third] = pieces;
    if (!first || !second || !third) throw new Error('missing Cleglaw pieces');
    const duplicate = saved({ a: first, b: second, c: { ...first, id: 'duplicate-instance' } });
    expect(decodeSave(duplicate)).toEqual(duplicate);
    const mismatched = saved({ a: first, b: second, c: { ...third, setId: 'sets/unknown' } });
    expect(decodeSave(mismatched).player.derivedStats.physDodge).toBe(.25);
  });

  it('preserves already-canonical uniques, set boots, zero and unknown rolls', () => {
    const boots = set('sets/natalyas-odium', 4)['sets/natalyas-odium/boots'];
    if (!boots) throw new Error('missing Natalya boots');
    const input = saved({ a: unique('silkweave'), b: unique('carrion-wind'), boots,
      zero: item([{ id: 'affix.nimble.phys-dodge', tier: 0, rolledValue: 0 },
        { id: 'unknown-rate', tier: 0, rolledValue: 100 }]) });
    expect(decodeSave(input)).toEqual(input);
  });

  it('ignores backpack, stash, player legacy equipment and mercenary sources', () => {
    const gear = item([{ id: 'affix.savage.crit-damage', tier: 0, rolledValue: 5 }]);
    const input = saved();
    const external = { ...input, player: { ...input.player, equipment: [gear] },
      inventory: { ...input.inventory, backpack: [gear], stash: [unique('crushflange')] },
      mercs: { ...input.mercs, mercEquipment: { unfielded: { amulet: gear } } } };
    expect(decodeSave(external)).toEqual(external);
  });

  it('composes legacy Maps before repair even when their contribution cancels the modern roll', () => {
    const input = saved({ amulet: item([
      { id: 'affix.precise.crit-chance', tier: 0, rolledValue: 1 },
      { affixId: 'legacy-cancel', values: new Map([['statMods.critChance', -.01]]) }
    ]) });
    const output = decodeSave(toJsonSafe(input));
    expect(output.player.derivedStats.critChance).toBe(.05);
    expect(output.inventory).toEqual(input.inventory);
  });

  it('rejects malformed old cache values before they could be repaired', () => {
    const input = saved({ amulet: item([{ id: 'affix.savage.crit-damage', tier: 0, rolledValue: 5 }]) });
    expect(() => decodeSave({ ...input, player: { ...input.player,
      derivedStats: { ...input.player.derivedStats, critDamage: NaN } } })).toThrow('Invalid save');
  });

  it.each(['constructor', '__proto__', 'toString'])('preserves unknown unique ID %s', uniqueId => {
    const input = saved({ amulet: { ...item(), uniqueId } });
    expect(decodeSave(input)).toEqual(input);
  });

  it('rejects nonfinite repaired arithmetic despite finite individual inputs', () => {
    const input = saved({ amulet: item([
      { id: 'affix.precise.crit-chance', tier: 0, rolledValue: 1 },
      { affixId: 'overflow', values: new Map([['statMods.critChance', 1e308]]) },
      { affixId: 'overflow-2', values: new Map([['statMods.critChance', 1e308]]) }
    ]) });
    expect(() => decodeSave(input)).toThrow('Invalid save: nonfinite equipment critChance');
  });

  it.each([7, 8, 9, 10])('repairs identifiable gear after migrating v%s', version => {
    const input = saved({ amulet: item([{ id: 'affix.savage.crit-damage', tier: 0, rolledValue: 5 }]) });
    const { questItems: _ledger, ...inventory } = input.inventory;
    expect(decodeSave({ ...input, inventory, version })).toEqual({ ...input, player: { ...input.player,
      derivedStats: { ...input.player.derivedStats, critDamage: 2.05 } } });
  });
});


describe('qualified Sun resistance cache compatibility', () => {
  it('repairs exactly two resistance fields, preserves pools and inputs, and decodes idempotently', () => {
    const original = saved({ amulet: item([{ affixId: 'saved-resists', values: new Map([
      ['resistances.fire', 91], ['resistances.cold', -12.5]
    ]) }]) });
    const id = 'quests/act2-tainted-sun';
    const save = { ...original, map: { ...original.map, questProgress: { [id]: {
      id, status: 'completed' as const, rewardClaimed: true, objectives: { 'obj-destroy-altar': true }
    } } } };
    const raw = toJsonSafe(save), before = structuredClone(raw);
    const expected = { ...save, player: { ...save.player, derivedStats: { ...save.player.derivedStats,
      resistances: { ...save.player.derivedStats.resistances, fire: 121, cold: 17.5 } } } };
    const decoded = decodeSave(raw);
    expect(decoded).toEqual(expected); expect(raw).toEqual(before);
    expect(decodeSave(toJsonSafe(decoded))).toEqual(expected);
  });
});
