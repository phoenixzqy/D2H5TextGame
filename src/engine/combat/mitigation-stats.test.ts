import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020';
import monsterSchema from '../../data/schema/monster.schema.json';
import { createRng } from '../rng';
import { deriveStats } from '../progression/stats';
import { deriveEquippedMercStats } from '../progression/merc-equipment-stats';
import { aggregateEquipmentMods, equipmentModsToDerivedModifiers } from '../progression/equipment-mods';
import { getSummonStats } from '../skills/summons';
import type { Mercenary } from '../types/entities';
import type { Item, Affix, UniqueItemDef, SetPieceDef, SetDef } from '../types/items';
import { computeStats } from '../items/computeStats';
import type { MonsterDef } from '../types/monsters';
import { buildMonsterUnit } from './monster-factory';

const core = { strength: 10, dexterity: 10, vitality: 10, energy: 10 };
const monster: MonsterDef = {
  id: 'monsters/mitigation', name: 'Fixture', life: [100, 100], lifeGrowth: [0, 0],
  skills: ['monster-weak-melee'], defense: 100, baseExperience: 10, canBeElite: true, canBeBoss: true
};

describe('D04 independent MR producers and equipment', () => {
  it('gives players zero base MR without armor/core/level inheritance', () => {
    for (const level of [1, 30, 90]) {
      const stats = deriveStats({ ...core, vitality: 500, energy: 500 }, level, { flatDefense: 100 });
      expect(stats).toHaveProperty('magicResist', 0);
      expect(stats.defense).toBe(120 + (level - 1) * 3);
    }
  });

  it('uses explicit signed MR modifiers, floor and nonnegative clamp', () => {
    for (const [flatMagicResist, expected] of [[7.9, 7], [-3, 0]] as const) {
      const mods = { flatMagicResist, flatDefense: 500 };
      expect(deriveStats(core, 1, mods)).toHaveProperty('magicResist', expected);
    }
  });

  it.each([
    ['trash', 3], ['elite', 5], ['champion', 6], ['rare-elite', 5],
    ['rare-minion', 3], ['boss', 9], ['chapter-boss', 9]
  ] as const)('scales default monster MR independently for %s', (tier, expected) => {
    const rng = createRng(7);
    const unit = buildMonsterUnit({ def: monster, level: 4, tier, rng });
    expect(unit.stats).toHaveProperty('magicResist', expected);
    const control = createRng(7);
    buildMonsterUnit({ def: { ...monster, defense: 0 }, level: 4, tier, rng: control });
    expect(rng.next()).toBe(control.next());
  });

  it('accepts authored MR/growth, including explicit zero, independently of armor', () => {
    const validate = new Ajv2020({ strict: true }).compile(monsterSchema);
    const def = { ...monster, magicResist: 2, magicResistGrowth: 0.5 };
    expect(validate(def)).toBe(true);
    expect(buildMonsterUnit({ def, level: 4, tier: 'elite', rng: createRng(7) }).stats).toHaveProperty('magicResist', 5);
    expect(buildMonsterUnit({ def: { ...def, magicResist: 0, magicResistGrowth: 0 }, level: 90,
      tier: 'chapter-boss', rng: createRng(7) }).stats).toHaveProperty('magicResist', 0);
    for (const key of ['magicResist', 'magicResistGrowth']) {
      for (const bad of [-1, '5', null]) expect(validate({ ...def, [key]: bad })).toBe(false);
    }
  });

  it('lets only an explicit MR override replace the computed monster value', () => {
    const options = { def: monster, level: 4, tier: 'chapter-boss' as const,
      rng: createRng(7), statOverrides: { defense: 800, magicResist: 0 } };
    expect(buildMonsterUnit(options).stats).toMatchObject({ defense: 800, magicResist: 0 });
    expect(buildMonsterUnit({ ...options, statOverrides: { defense: 800 }, rng: createRng(7) }).stats).toHaveProperty('magicResist', 9);
  });

  it('projects explicit MR gear once over a saved grown merc without changing armor/resources/baseline', () => {
    const bare = { ...deriveStats(core, 9), defense: 26, magicResist: 4, life: 17, mana: 3 };
    const merc: Mercenary = { id: 'merc', name: 'Merc', type: 'mercenary', team: 'player', level: 9,
      coreStats: core, derivedStats: bare, statusEffects: [], cooldowns: [], skills: [], comboOrder: [],
      alive: true, turnOrder: 0, archetype: 'back', rarity: 'R', equipment: [] };
    const glove: Item = { id: 'glove', baseId: 'items/base/glove-leather', rarity: 'normal', level: 1,
      identified: true, equipped: true, equipSlot: 'gloves', baseRolls: { defense: 4 },
      affixes: [{ affixId: 'legacy-mr', values: new Map([['statMods.magicResist', 7]]) }] };
    const before = structuredClone(merc);
    const mods = aggregateEquipmentMods({ gloves: glove });
    expect(mods).toMatchObject({ defense: 4, magicResist: 7 });
    expect(equipmentModsToDerivedModifiers(mods)).toMatchObject({ flatDefense: 4, flatMagicResist: 7 });
    expect(deriveEquippedMercStats(merc, { gloves: glove })).toMatchObject({ defense: 30, magicResist: 11, life: 17, mana: 3 });
    expect(deriveEquippedMercStats(merc, {})).toEqual(bare);
    expect(merc).toEqual(before);
  });

  it('applies signed merc MR gear before the final floor and clamp', () => {
    const merc: Mercenary = { id: 'merc', name: 'Merc', type: 'mercenary', team: 'player', level: 9,
      coreStats: core, derivedStats: { ...deriveStats(core, 9), magicResist: 4, life: 17, mana: 3 },
      statusEffects: [], cooldowns: [], skills: [], comboOrder: [], alive: true, turnOrder: 0,
      archetype: 'back', rarity: 'R', equipment: [] };
    for (const [flat, expected] of [[-1, 3], [-7, 0], [-1.2, 2]] as const) {
      const glove: Item = { id: 'glove', baseId: 'items/base/glove-leather', rarity: 'normal', level: 1,
        identified: true, equipped: true, affixes: [
          { affixId: 'signed-mr', values: new Map([['statMods.magicResist', flat]]) }
        ] };
      expect(deriveEquippedMercStats(merc, { gloves: glove })).toMatchObject({ magicResist: expected, life: 17, mana: 3 });
    }
  });

  it('carries MR through modern affixes and definition-backed unique/set packages', () => {
    const item: Item = { id: 'modern', baseId: 'items/base/ring-iron', rarity: 'magic', level: 1,
      identified: true, equipped: true, affixes: [{ id: 'mr-affix', tier: 0, rolledValue: 7 }] };
    const affix: Affix = { id: 'mr-affix', kind: 'prefix', appliesTo: ['jewelry'],
      stat: 'magicResist', tiers: [], rarityWeights: {}, i18nKey: 'fixture' };
    expect(computeStats(item, undefined, new Map([[affix.id, affix]]))).toMatchObject({ magicResist: 7, defense: 0 });
    const unique: UniqueItemDef = { id: 'items/unique/mr', name: 'fixture', baseId: item.baseId,
      reqLevel: 1, stats: { statMods: { magicResist: { roll: 'mr-roll', min: 2, max: 5 } } } };
    const piece: SetPieceDef = { id: 'sets/mr/ring', setId: 'sets/mr', name: 'fixture',
      baseId: item.baseId, reqLevel: 1, stats: { statMods: { magicResist: 3 } } };
    const set: SetDef = { id: 'sets/mr', name: 'fixture', items: [piece.id], pieces: [piece],
      bonuses: { '1': { statMods: { magicResist: 2 } } } };
    const mods = aggregateEquipmentMods({
      left: { ...item, affixes: [], rarity: 'unique', uniqueId: unique.id, statRolls: { 'mr-roll': 4 } },
      right: { ...item, affixes: [], rarity: 'set', setId: set.id, setPieceId: piece.id }
    }, { uniques: [unique], setPieces: [piece], sets: [set] });
    expect(mods).toMatchObject({ magicResist: 9 });
  });

  it('keeps the exact pre-MR factory random draw count', () => {
    const rng = createRng(7);
    const control = createRng(7);
    const idTag = (control.nextInt(0, 0xffff) + 0x10000).toString(16).slice(1);
    const unit = buildMonsterUnit({ def: monster, level: 4, tier: 'chapter-boss', rng });
    expect(unit.id).toBe(`enemy-mitigation-0-${idTag}`);
    expect(rng.next()).toBe(control.next());
  });

  it('initializes summons to MR0 regardless of template armor or skill rank', () => {
    for (const id of ['skeleton', 'clay_golem', 'fire_golem']) {
      expect(getSummonStats(id, { skillLevel: 20, statScaling: { defense: 100 } })).toHaveProperty('magicResist', 0);
    }
  });
});
