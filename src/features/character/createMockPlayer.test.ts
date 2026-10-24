import { afterEach, assert, describe, it, expect, vi } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import amazonDocument from '@/data/classes/amazon.json';
import basesDocument from '@/data/items/bases.json';
import classSchema from '@/data/schema/class.schema.json';
import { loadItemBases } from '@/data/loaders/loot';
import { computeStats } from '@/engine/items/computeStats';
import { checkEligibility } from '@/features/inventory/compareEquip';
import { createMockPlayer, CHARACTER_CLASSES } from './createMockPlayer';

const trainingId = 'items/base/weapon-bow-training';
const recipe = { baseId: trainingId, baseRolls: { attack: 13 } };
const validateClass = new Ajv2020({ strict: true, allErrors: true }).compile(classSchema);

async function factoryWithAmazon(document: unknown) {
  vi.resetModules();
  vi.doMock('@/data/classes/amazon.json', () => ({ default: document }));
  return (await import('./createMockPlayer')).createMockPlayer;
}

afterEach(() => {
  vi.doUnmock('@/data/classes/amazon.json');
  vi.doUnmock('@/data/items/bases.json');
  vi.resetModules();
});

describe('createMockPlayer', () => {
  it.each(CHARACTER_CLASSES)('initializes independent reset allowances for a fresh %s before saving', cls => {
    const first = createMockPlayer('First', cls);
    const second = createMockPlayer('Second', cls);
    expect(first.respecsRemaining).toEqual({ stat: 3, skill: 3 });
    expect(second.respecsRemaining).toEqual({ stat: 3, skill: 3 });
    expect(first.respecsRemaining).not.toBe(second.respecsRemaining);
  });

  it('grants new level-1 characters 1 skill point', () => {
    const p = createMockPlayer('Hero', 'barbarian');
    expect(p.level).toBe(1);
    expect(p.skillPoints).toBe(1);
    expect(p.statPoints).toBe(0);
  });

  it('grants 1 skill point for every supported class', () => {
    for (const cls of CHARACTER_CLASSES) {
      const p = createMockPlayer('A', cls);
      expect(p.skillPoints, `class ${cls}`).toBe(1);
    }
  });
});

describe('authored starter weapon preparation', () => {
  it('prepares the actual legal Training Bow with persisted attack 13 and ilvl 1', () => {
    const player = createMockPlayer('Archer', 'amazon');
    expect(player.equipment).toHaveLength(1);
    const bow = player.equipment[0];
    assert(bow);
    expect(bow).toMatchObject({
      baseId: trainingId, rarity: 'normal', level: 1, ilvl: 1,
      baseRolls: { attack: 13 }, identified: true, equipped: true, equipSlot: 'weapon'
    });
    expect(bow.id).toMatch(/^starter-amazon-bow-/);
    expect(checkEligibility(bow, player)).toEqual({ eligible: true, reasons: [] });
    expect(computeStats(bow, loadItemBases().get(bow.baseId), new Map()).attack).toBe(13);
    expect(bow.affixes ?? []).toEqual([]);
    expect(bow.uniqueId).toBeUndefined();
    expect(bow.setPieceId).toBeUndefined();
    expect(bow.runewordId).toBeUndefined();
  });

  it.each([12, 8, 18])('consumes authored attack %s including both inclusive bounds', async (attack) => {
    const document = { ...amazonDocument, starterWeapon: { ...recipe, baseRolls: { attack } } };
    const before = structuredClone(document);
    const factory = await factoryWithAmazon(document);
    const player = factory('Archer', 'amazon');
    expect(player.equipment[0]).toMatchObject({ baseId: trainingId, baseRolls: { attack } });
    expect(document).toEqual(before);
  });

  it('omitting even the Amazon recipe means no equipment', async () => {
    const document: Record<string, unknown> = { ...amazonDocument };
    delete document.starterWeapon;
    const factory = await factoryWithAmazon(document);
    expect(factory('Unarmed', 'amazon').equipment).toEqual([]);
  });

  it.each(CHARACTER_CLASSES.filter((cls) => cls !== 'amazon'))('%s stays unarmed with existing progression fields', (cls) => {
    const player = createMockPlayer('Hero', cls);
    expect(player.equipment).toEqual([]);
    expect(player).toMatchObject({ class: cls, level: 1, experience: 0, experienceToNextLevel: 100, statPoints: 0, skillPoints: 1 });
    expect(player.skills).toEqual([]);
    expect(player.statusEffects).toEqual([]);
    expect(player.cooldowns).toEqual([]);
  });

  it('returns independent items and rolls without mutating authored content', () => {
    const before = structuredClone({ amazonDocument, basesDocument });
    const first = createMockPlayer('A', 'amazon');
    const second = createMockPlayer('B', 'amazon');
    const one = first.equipment[0];
    const two = second.equipment[0];
    assert(one && two);
    expect(one).not.toBe(two);
    expect(one.baseRolls).toEqual({ attack: 13 });
    expect(two.baseRolls).toEqual({ attack: 13 });
    expect(one.baseRolls).not.toBe(two.baseRolls);
    assert(one.baseRolls);
    Reflect.set(one.baseRolls, 'attack', 8);
    expect(two.baseRolls).toEqual({ attack: 13 });
    expect({ amazonDocument, basesDocument }).toEqual(before);
  });

  it.each([
    ['null recipe', null],
    ['missing base', { baseRolls: { attack: 13 } }],
    ['missing rolls', { baseId: trainingId }],
    ['missing attack', { baseId: trainingId, baseRolls: {} }],
    ['negative attack', { ...recipe, baseRolls: { attack: -1 } }],
    ['fractional attack', { ...recipe, baseRolls: { attack: 12.5 } }],
    ['extra roll', { ...recipe, baseRolls: { attack: 13, defense: 2 } }],
    ['rarity override', { ...recipe, rarity: 'unique' }],
    ['invalid ID', { ...recipe, baseId: '../weapon' }],
    ['unknown base', { ...recipe, baseId: 'items/base/weapon-missing' }],
    ['armor', { ...recipe, baseId: 'items/base/helm-cap' }],
    ['level 10 bow', { ...recipe, baseId: 'items/base/weapon-bow' }],
    ['below base range', { ...recipe, baseRolls: { attack: 7 } }],
    ['above base range', { ...recipe, baseRolls: { attack: 19 } }]
  ])('rejects %s before returning a player', async (_label, starterWeapon) => {
    const factory = await factoryWithAmazon({ ...amazonDocument, starterWeapon });
    expect(() => factory('Invalid', 'amazon')).toThrow(/classes\/amazon.*starterWeapon/);
  });

  it('rejects a full class document with invalid unrelated tuning', async () => {
    const factory = await factoryWithAmazon({ ...amazonDocument, lifePerLevel: -1, starterWeapon: recipe });
    expect(() => factory('Invalid', 'amazon')).toThrow(/classes\/amazon.*lifePerLevel/);
  });

  it('rejects a class identity mismatch', async () => {
    const factory = await factoryWithAmazon({ ...amazonDocument, id: 'classes/paladin', starterWeapon: recipe });
    expect(() => factory('Invalid', 'amazon')).toThrow(/classes\/amazon.*id/);
  });

  it('rejects actual equipment requirements the new character cannot meet', async () => {
    const bases = basesDocument.map((base) => base.id === trainingId
      ? { ...base, reqStats: { strength: 21 } } : base);
    vi.doMock('@/data/items/bases.json', () => ({ default: bases }));
    const factory = await factoryWithAmazon({ ...amazonDocument, starterWeapon: recipe });
    expect(() => factory('Too weak', 'amazon')).toThrow(/classes\/amazon.*starterWeapon.*strength/);
  });
});

describe('class recipe schema boundary', () => {
  it('accepts an optional complete recipe and omission', () => {
    expect(validateClass({ ...amazonDocument, starterWeapon: recipe }), JSON.stringify(validateClass.errors)).toBe(true);
    const document: Record<string, unknown> = { ...amazonDocument };
    delete document.starterWeapon;
    expect(validateClass(document)).toBe(true);
  });

  it.each([
    null, {}, { ...recipe, baseRolls: null }, { baseId: trainingId },
    { ...recipe, baseRolls: {} }, { ...recipe, baseRolls: { attack: -1 } },
    { ...recipe, baseRolls: { attack: 1.5 } }, { ...recipe, baseRolls: { attack: 13, defense: 1 } },
    { ...recipe, identified: false }, { ...recipe, baseId: 'weapon-bow-training' }
  ])('rejects malformed recipe %#', (starterWeapon) => {
    expect(validateClass({ ...amazonDocument, starterWeapon })).toBe(false);
  });
});
