import { withoutV17Fields, withV17Defaults } from '../../../tests/helpers/save-fixtures';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { deriveStats } from '../progression/stats';
import type { Player, Mercenary } from '../types/entities';
import { CURRENT_SAVE_VERSION, MIGRATIONS, type SaveV10, type SaveV11, type SaveCurrent } from '../types/save';
import { runMigrations } from './migrate';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateSave } from './validate';

function sampleSave() {
  const coreStats = { strength: 20, dexterity: 20, vitality: 25, energy: 15 };
  const player: Player = {
    id: 'hero', name: 'Hero', type: 'player', team: 'player', class: 'paladin', level: 3,
    coreStats, derivedStats: { ...deriveStats(coreStats, 3), life: 17, mana: 9, magicResist: 11 },
    statusEffects: [], cooldowns: [], skills: [], comboOrder: [], alive: true, turnOrder: 0,
    experience: 43, experienceToNextLevel: 500, statPoints: 3, skillPoints: 4,
    skillLevels: { 'paladin.might': 2 }, equipment: []
  };
  const merc = (id: string): Mercenary => ({ ...player, id, type: 'mercenary',
    archetype: 'back', rarity: 'R', derivedStats: { ...player.derivedStats, life: 7, mana: 2 } });
  const save = buildSave({ player, timestamp: 1000,
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { 'rune-shard': 71 } },
    mercs: { ownedMercs: [merc('fielded'), merc('bench')], fieldedMercId: 'fielded',
      mercEquipment: {}, mercProgress: { fielded: { experience: 19, experienceToNextLevel: 200 } } },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: ['act1.blood-moor'],
      clearedSubAreas: ['blood-moor'], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: true, musicEnabled: true,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 13, activeMultiplier: 2 },
      gachaState: { currency: 3, ownedMercIds: [], pityCounter: 4 } },
    formation: { playerPosition: { row: 2, col: 2 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] }
  });
  // These historical fixtures predate both the v12 ledger and v15 action receipts.
  const historical = withoutV17Fields(save);
  const { questItems: _ledger, ...inventory } = historical.inventory;
  const { questReceipts: _receipts, ...map } = historical.map;
  return { ...historical, version: 11 as const, inventory, map };
}
function currentShape<T extends { inventory: object; map: object }>(save: T) {
  return withV17Defaults({ ...save, inventory: { ...save.inventory, questItems: {} },
    map: { ...save.map, questReceipts: {} } });
}

const versions = [7, 8, 9, 10, 11] as const;
const malformedSelections: readonly unknown[] = [
  undefined, null, '', 'skills-paladin-might', 'aura-might', 'paladin.Might', 'skills-paladin-meditation', 'mskill-aura-meditation',
  'paladin.Meditation', ' paladin.meditation', 'paladin.meditation ',
  ' paladin.might', 'paladin.might ', 'paladin.holy-fire', 0, 1, NaN, Infinity,
  false, true, [], ['paladin.might'], {}, { id: 'paladin.might' }
];

describe('D05 v11 exclusive selected aura save boundary', () => {
  it('retains the v11 contract and its migrations with the current receipt format', () => {
    expect(CURRENT_SAVE_VERSION).toBe(17);
    for (const version of [8, 9, 10, 11]) expect(MIGRATIONS[version]).toBeDefined();
  });

  it.each(versions)('preserves absent=None from v%s without inventing a property or refilling resources', version => {
    const input = { ...sampleSave(), version };
    const original = structuredClone(input);
    const output = decodeSave(input);
    expect(output).toEqual(currentShape(input));
    expect(Object.hasOwn(output.player, 'selectedAuraId')).toBe(false);
    expect(input).toEqual(original);
    expect(decodeSave(structuredClone(output))).toEqual(output);
    expect(decodeSave(toJsonSafe(output))).toEqual(output);
  });

  it.each(versions)('preserves canonical selection and all domains from v%s through JSON/native round trips', version => {
    const base = sampleSave();
    const input = { ...base, version, player: { ...base.player, selectedAuraId: 'paladin.might' } };
    const original = structuredClone(input);
    const output = decodeSave(input);
    expect(output).toEqual(currentShape(input));
    expect(output.player.selectedAuraId).toBe('paladin.might');
    expect(input).toEqual(original);
    expect(decodeSave(structuredClone(output))).toEqual(output);
    expect(decodeSave(toJsonSafe(output))).toEqual(output);
  });

  it.each(versions)('rejects every malformed present selection from v%s without normalizing or mutating it', version => {
    for (const selectedAuraId of malformedSelections) {
      const base = sampleSave();
      const input = { ...base, version, player: { ...base.player, selectedAuraId } };
      const original = structuredClone(input);
      expect(() => decodeSave(input), `selection ${String(selectedAuraId)}`).toThrow('Invalid save');
      expect(input).toEqual(original);
      expect(Object.hasOwn(input.player, 'selectedAuraId')).toBe(true);
    }
  });

  it('rejects present undefined at the direct current native validation boundary', () => {
    const base = sampleSave();
    expect(() => validateSave({ ...currentShape(base),
      player: { ...base.player, selectedAuraId: undefined } })).toThrow('Invalid save');
  });

  it.each([
    { class: 'sorceress', level: 3, skillLevels: { 'paladin.might': 2 } },
    { class: 'paladin', level: 1, skillLevels: {} },
    { class: 'paladin', level: 1, skillLevels: { 'paladin.might': 0 } }
  ])('retains canonical selection independently of gameplay eligibility %#', patch => {
    const base = sampleSave();
    const input = { ...base, version: 9,
      player: { ...base.player, ...patch, selectedAuraId: 'paladin.might' } };
    expect(decodeSave(input)).toEqual(currentShape(input));
  });

  it('keeps explicit historical9/10 targets and chains to current with an empty ledger', () => {
    const base = sampleSave();
    const input = { ...base, version: 9 as const,
      player: { ...base.player, selectedAuraId: 'paladin.might' } };
    const original = structuredClone(input);
    expect(runMigrations(input, 9)).toBe(input);
    expect(runMigrations(input, 9).version).toBe(9);
    expect(runMigrations(input, 10)).toEqual({ ...input, version: 10 });
    expect(runMigrations(input)).toEqual(currentShape(input));
    expect(input).toEqual(original);
  });

  it.each(['player', 'fielded', 'bench'])('rejects frozen v9 missing/nonfinite/negative MR on %s before cutover', target => {
    for (const bad of ['missing', undefined, null, '11', NaN, Infinity, -Infinity, -1]) {
      const input = structuredClone({ ...sampleSave(), version: 9 });
      const actor = target === 'player' ? input.player : input.mercs.ownedMercs.find(m => m.id === target);
      expect(actor).toBeDefined();
      const stats = actor?.derivedStats as unknown as Record<string, unknown>;
      if (bad === 'missing') delete stats.magicResist;
      else stats.magicResist = bad;
      const original = structuredClone(input);
      expect(() => decodeSave(input)).toThrow('Invalid save');
      expect(input).toEqual(original);
    }
  });
});


describe('D05 native Maps and genuine historical migration', () => {
  it('preserves canonical selection, native affix/synergy Maps and resources through JSON/native round trips', () => {
    const base = sampleSave();
    const input = { ...base, version: 9,
      player: { ...base.player, selectedAuraId: 'paladin.might', skills: [{
        id: 'test-skill', name: 'Test', description: '', trigger: 'active', target: 'single-enemy',
        cooldown: 1, cost: {}, minLevel: 1, level: 1, maxLevel: 20,
        synergies: new Map([['physical', 0.2]])
      }] },
      inventory: { ...base.inventory, equipped: { head: {
        id: 'retained-hat', baseId: 'items/base/helm-cap', rarity: 'magic', level: 1,
        identified: true, equipped: true,
        affixes: [{ affixId: 'legacy', values: new Map([['statMods.life', 20]]) }]
      } } }
    };
    const original = structuredClone(input);
    const output = decodeSave(input);
    expect(output).toEqual({ ...currentShape(input),
      inventory: { ...currentShape(input).inventory, equipped: { head: { ...input.inventory.equipped.head, socketCapacity: 2 } } },
      player: { ...input.player, equipment: [{ ...input.inventory.equipped.head, socketCapacity: 2 }] } });
    const affix = output.inventory.equipped.head?.affixes?.[0];
    expect(affix && 'values' in affix && affix.values).toEqual(new Map([['statMods.life', 20]]));
    expect(output.player.skills[0]?.synergies).toEqual(new Map([['physical', 0.2]]));
    expect(decodeSave(structuredClone(output))).toEqual(output);
    expect(decodeSave(toJsonSafe(output))).toEqual(output);
    expect(input).toEqual(original);
  });

  it.each([7, 8])('upgrades genuine pre-MR v%s with absent/canonical selection without refill or source mutation', version => {
    const withoutMR = (stats: Player['derivedStats']) => {
      const { magicResist: _mr, ...old } = stats;
      return old;
    };
    for (const selected of [false, true]) {
      const base = sampleSave();
      const input = { ...base, version, player: { ...base.player,
        derivedStats: withoutMR(base.player.derivedStats),
        ...(selected ? { selectedAuraId: 'paladin.might' } : {}) },
        mercs: { ...base.mercs, ownedMercs: base.mercs.ownedMercs.map(m => ({ ...m,
          derivedStats: withoutMR(m.derivedStats) })) } };
      const original = structuredClone(input);
      const output = decodeSave(input);
      expect(input.player.derivedStats).not.toHaveProperty('magicResist');
      expect(input.mercs.ownedMercs.every(m => !Object.hasOwn(m.derivedStats, 'magicResist'))).toBe(true);
      expect(output).toEqual({ ...currentShape(input),
        player: { ...input.player, derivedStats: { ...input.player.derivedStats, magicResist: 0 } },
        mercs: { ...input.mercs, ownedMercs: input.mercs.ownedMercs.map(m => ({ ...m,
          derivedStats: { ...m.derivedStats, magicResist: 0 } })) } });
      expect(Object.hasOwn(output.player, 'selectedAuraId')).toBe(selected);
      expect(output.player.derivedStats).toMatchObject({ life: 17, mana: 9, magicResist: 0 });
      expect(output.mercs.ownedMercs.map(m => m.derivedStats.magicResist)).toEqual([0, 0]);
      expect(decodeSave(structuredClone(output))).toEqual(output);
      expect(decodeSave(toJsonSafe(output))).toEqual(output);
      expect(input).toEqual(original);
    }
  });
});


describe('D05 Meditation v11 acceptance and frozen historical v10', () => {
  it('freezes the historical v10 selection type while widening live and current selection', () => {
    expectTypeOf<SaveV10['player']['selectedAuraId']>().toEqualTypeOf<'paladin.might' | undefined>();
    expectTypeOf<Player['selectedAuraId']>().toEqualTypeOf<'paladin.might' | 'paladin.meditation' | undefined>();
    expectTypeOf<SaveCurrent['player']['selectedAuraId']>().toEqualTypeOf<'paladin.might' | 'paladin.meditation' | undefined>();
  });
  it.each([11, CURRENT_SAVE_VERSION].flatMap(version =>
    ['paladin.might', 'paladin.meditation'].map(selectedAuraId => ({ version, selectedAuraId }))))(
    'preserves canonical $selectedAuraId in frozen v$version through current native and JSON round trips', ({ version, selectedAuraId }) => {
    const base = sampleSave();
    const input = { ...(version === 11 ? base : currentShape(base)), version,
      player: { ...base.player, selectedAuraId } };
    const before = structuredClone(input);
    const expected = currentShape(input);
    expect(validateSave(expected)).toEqual(expected);
    const output = decodeSave(input);
    expect(output).toEqual(expected);
    expect(output.player.derivedStats).toMatchObject({ life: 17, mana: 9 });
    expect(decodeSave(structuredClone(output))).toEqual(output);
    expect(decodeSave(toJsonSafe(output))).toEqual(output);
    expect(input).toEqual(before);
  });

  it.each([7, 8, 9, 10])('rejects Meditation in historical v%s before version-only widening can accept it', version => {
    const base = sampleSave();
    const input = { ...base, version, player: { ...base.player, selectedAuraId: 'paladin.meditation' } };
    const before = structuredClone(input);
    expect(() => decodeSave(input)).toThrow('Invalid save');
    expect(input).toEqual(before);
  });

  it('changes only version for 10→11, retaining the explicit historical target10 and native Maps', () => {
    const base = sampleSave();
    for (const selected of [false, true]) {
      const input = { ...base, version: 10 as const, player: { ...base.player,
        ...(selected ? { selectedAuraId: 'paladin.might' as const } : {}), skills: [{
          id: 'map-skill', name: 'Map', description: '', trigger: 'active', target: 'single-enemy',
          cooldown: 1, cost: {}, minLevel: 1, level: 1, maxLevel: 20,
          synergies: new Map([['physical', 0.2]])
        }] } };
      const before = structuredClone(input);
      expect(runMigrations(input, 10)).toBe(input);
      expect(runMigrations(input, 10).version).toBe(10);
      const migrated = runMigrations(input, 11) as SaveV11;
      expect(migrated).toEqual({ ...input, version: 11 });
      expect(migrated.player).toBe(input.player);
      expect(migrated.inventory).toBe(input.inventory);
      expect(migrated.mercs).toBe(input.mercs);
      expect(migrated.player.skills[0]?.synergies).toBe(input.player.skills[0]?.synergies);
      expect(Object.hasOwn(migrated.player, 'selectedAuraId')).toBe(selected);
      expect(decodeSave(input)).toEqual(currentShape(input));
      expect(input).toEqual(before);
    }
  });

  it.each([
    { class: 'sorceress', level: 24, skillLevels: { 'paladin.meditation': 2 } },
    { class: 'paladin', level: 23, skillLevels: { 'paladin.meditation': 2 } },
    { class: 'paladin', level: 24, skillLevels: {} },
    { class: 'paladin', level: 24, skillLevels: { 'paladin.meditation': 0 } }
  ])('retains current canonical Meditation independently of gameplay eligibility %#', patch => {
    const base = sampleSave();
    const input = { ...currentShape(base),
      player: { ...base.player, ...patch, selectedAuraId: 'paladin.meditation' } };
    expect(decodeSave(input)).toEqual(input);
  });

  it.each(['player', 'fielded', 'bench'])('preserves frozen v10 MR requirements on %s before migration11', target => {
    for (const bad of ['missing', undefined, null, '11', NaN, Infinity, -Infinity, -1]) {
      const input = structuredClone({ ...sampleSave(), version: 10 });
      const actor = target === 'player' ? input.player : input.mercs.ownedMercs.find(m => m.id === target);
      expect(actor).toBeDefined();
      const stats = actor?.derivedStats as unknown as Record<string, unknown>;
      if (bad === 'missing') delete stats.magicResist;
      else stats.magicResist = bad;
      const before = structuredClone(input);
      expect(() => decodeSave(input)).toThrow('Invalid save');
      expect(input).toEqual(before);
    }
  });

  it('retains Meditation, native affix and synergy Maps and all resources at the current version', () => {
    const base = sampleSave();
    const input = { ...currentShape(base), player: { ...base.player, selectedAuraId: 'paladin.meditation',
      skills: [{ id: 'current-map-skill', name: 'Map', description: '', trigger: 'active', target: 'single-enemy',
        cooldown: 1, cost: {}, minLevel: 1, level: 1, maxLevel: 20, synergies: new Map([['physical', 0.2]]) }] },
      inventory: { ...currentShape(base).inventory, equipped: { head: { id: 'current-hat', baseId: 'items/base/helm-cap',
        rarity: 'magic', level: 1, identified: true, equipped: true, socketCapacity: 0,
        affixes: [{ affixId: 'legacy', values: new Map([['statMods.life', 20]]) }] } } } };
    const before = structuredClone(input); const output = decodeSave(input);
    expect(output).toEqual(input);
    const affix = output.inventory.equipped.head?.affixes?.[0];
    expect(affix && 'values' in affix && affix.values).toEqual(new Map([['statMods.life', 20]]));
    expect(output.player.skills[0]?.synergies).toEqual(new Map([['physical', 0.2]]));
    expect(decodeSave(toJsonSafe(output))).toEqual(output);
    expect(decodeSave(structuredClone(output))).toEqual(output);
    expect(input).toEqual(before);
  });
});
