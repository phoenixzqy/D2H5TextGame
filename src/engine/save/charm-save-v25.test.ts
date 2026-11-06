import { withoutV32Fields, withV32Defaults } from '../../../tests/helpers/save-fixtures';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as loot from '@/data/loaders/loot';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMercFromDef } from '@/stores/mercFactory';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { deriveStats } from '../progression/stats';
import type { Item, ItemBase, UniqueItemDef } from '../types/items';
import type { SaveV24 } from '../types/save';
import { migrateSaveV25 } from './migrate-v25';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateFrozenV24Save, validateFrozenV25Save as validateSave } from './validate';

const charmBase: ItemBase = { id: 'items/base/small-charm', name: 'items.base.small-charm',
  type: 'charm', slot: 'charm', reqLevel: 1, maxSockets: 0, metal: false, canHaveAffixes: false };
const unique: UniqueItemDef = { id: 'items/unique/ormus-charm', baseId: charmBase.id,
  name: 'items.unique.ormus-charm.name', reqLevel: 1, stats: { statMods: { life: 20, mana: 10 } } };
const bases = loot.loadItemBases(), uniques = loot.loadUniques().filter(row => row.id !== unique.id);
const ormus = 'quests/side-act3-ormus-charm';
function item(id: string, fields: Partial<Item> = {}): Item {
  return { id, baseId: 'items/base/helm-cap', rarity: 'normal', level: 1, identified: true,
    equipped: true, socketCapacity: 0, ...fields };
}
function literal24(): SaveV24 {
  const player = createMockPlayer('Recovery tester', 'sorceress');
  const save = buildSave({ timestamp: 1000, player: { ...player,
    derivedStats: { ...deriveStats(player.coreStats, player.level), life: 7, mana: 3 } },
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
  return { ...withoutV32Fields(save), version: 24 };
}
function detach(value: Item): Item {
  const { equipSlot: _slot, ...fields } = value;
  return { ...fields, equipped: false };
}
beforeEach(() => {
  vi.spyOn(loot, 'loadItemBases').mockReturnValue(new Map([...bases, [charmBase.id, charmBase]]));
  vi.spyOn(loot, 'loadUniques').mockReturnValue([...uniques, unique]);
});
afterEach(() => { vi.restoreAllMocks(); });

describe('literal24 reserved-key recovery', () => {
  it.each([false, true])('recovers all owners in deterministic order with overflow and payload conservation (JSON=%s)', json => {
    const save = literal24(), def = loadMercPool().pool[0];
    if (!def) throw new Error('Missing fixture merc');
    const owned = createMercFromDef(def), hero = item('hero-old', { equipSlot: 'head',
      personalizedBy: { characterId: 'old-hero', name: 'Old hero' }, socketCapacity: 2,
      socketContents: [{ kind: 'rune', id: 'runes/eld' }], affixes: [{ affixId: 'old', values: new Map([['statMods.life', 20]]) }],
      uniqueId: unique.id, statRolls: { 'statMods.life': 20 } });
    const a = item('a-old'), z = item('z-old'), retained = item('retained', { baseRolls: { defense: 5 },
      affixes: [{ affixId: 'retained-values', values: new Map([['statMods.life', 11], ['statMods.mana', 6]]) }] });
    const old = { ...save, inventory: { ...save.inventory,
      backpack: Array.from({ length: 41 }, (_, i) => item(`bag-${String(i)}`, { equipped: false })),
      stash: [item('stash', { equipped: false })], equipped: { head: retained, charm: hero, unrelated: null },
      legacyCharmRecovery: { untouched: ['old', 17] } },
      player: { ...save.player, equipment: [hero, retained], derivedStats: { ...save.player.derivedStats, lifeMax: 999 } },
      mercs: { ...save.mercs, ownedMercs: [{ ...owned, equipment: [z] }], mercEquipment: {
        [owned.id]: { charm: z }, 'a-orphan': { charm: a, head: null }, 'null-orphan': { charm: null } } } };
    const input = json ? toJsonSafe(old) : old, before = structuredClone(input);
    expect(() => validateFrozenV24Save(input)).not.toThrow();
    const out = decodeSave(input);
    expect(out.version).toBe(33); expect(input).toEqual(before);
    const recovered = [hero, ...Object.keys(old.mercs.mercEquipment).sort().flatMap(id => {
      const value = old.mercs.mercEquipment[id as keyof typeof old.mercs.mercEquipment]?.charm;
      return value ? [value] : [];
    })].map(detach);
    expect(toJsonSafe(out.inventory.backpack)).toEqual(toJsonSafe([...old.inventory.backpack, ...recovered]));
    expect(out.inventory.equipped).toEqual({ head: retained, charm: null, unrelated: null });
    expect(out.player.equipment).toEqual([retained]);
    expect(out.player.derivedStats).toMatchObject({ life: 7, mana: 3,
      lifeMax: deriveStats(save.player.coreStats, save.player.level).lifeMax + 11,
      manaMax: deriveStats(save.player.coreStats, save.player.level).manaMax + 6, defense: deriveStats(save.player.coreStats, save.player.level).defense + 5 });
    expect(out.mercs.mercEquipment).toEqual({ [owned.id]: {}, 'a-orphan': { head: null }, 'null-orphan': {} });
    expect(out.mercs.ownedMercs[0]?.equipment).toEqual([]);
    expect(out.mercs.ownedMercs[0]?.derivedStats).toEqual(owned.derivedStats);
    expect(Reflect.get(out.inventory, 'legacyCharmRecovery')).toEqual(old.inventory.legacyCharmRecovery);
    expect(out.inventory.stash).toEqual(old.inventory.stash);
    expect(out.inventory.currencies).toEqual(old.inventory.currencies);
    expect(out.map).toEqual(withV32Defaults(old).map); expect(decodeSave(toJsonSafe(out))).toEqual(out);
  });
  it.each([false, true])('preserves hero cache and mirror exactly without hero recovery (merc-only=%s)', mercOnly => {
    const save = literal24(), old = { ...save,
      player: { ...save.player, equipment: [], derivedStats: { ...save.player.derivedStats, attack: 333 } },
      mercs: { ...save.mercs, mercEquipment: mercOnly ? { orphan: { charm: item('old') } } : {} } };
    const out = decodeSave(old);
    expect(migrateSaveV25(old).player).toBe(old.player);
    expect(out.version).toBe(33);
    expect(out.player).toEqual(old.player); expect(Object.hasOwn(out.inventory.equipped, 'charm')).toBe(false);
    expect(out.inventory.backpack).toEqual(mercOnly ? [detach(item('old'))] : []);
  });
  it.each([0, 999])('only clamps resources after actual hero recovery (Life/Mana=%s)', resource => {
    const save = literal24(), old = { ...save,
      player: { ...save.player, derivedStats: { ...save.player.derivedStats,
        life: resource, mana: resource, lifeMax: 1000, manaMax: 1000 } },
      inventory: { ...save.inventory, equipped: { charm: item('old') } } };
    const out = decodeSave(old), base = deriveStats(save.player.coreStats, save.player.level);
    expect([out.player.derivedStats.life, out.player.derivedStats.mana]).toEqual([
      Math.min(resource, base.lifeMax), Math.min(resource, base.manaMax)]);
  });
  it.each([false, true])('infers no Ormus proof, objective, reward or compensation (claimed=%s)', claimed => {
    const save = literal24(), old = { ...save, map: { ...save.map,
      questProgress: { [ormus]: { id: ormus, status: 'completed' as const, rewardClaimed: claimed, objectives: {} } } } };
    const out = decodeSave(old);
    expect(out.map).toEqual(withV32Defaults(old).map); expect(out.inventory).toEqual(old.inventory);
    expect(out.player).toEqual(old.player);
  });
  it('retains existing quest Life entitlements during hero recovery', () => {
    const save = literal24(), quest = 'quests/act3-golden-bird';
    const old = { ...save, inventory: { ...save.inventory, equipped: { charm: item('old') }, questItems: {
      [`${quest}#objective:obj-find-figurine`]: { itemId: 'quest/jade_figurine', state: 'consumed' as const },
      [`${quest}#objective:obj-give-cain`]: { itemId: 'quest/golden_bird', state: 'consumed' as const },
      [`${quest}#reward:questItem`]: { itemId: 'items/potion_of_life_q', state: 'consumed' as const }
    } }, map: { ...save.map, questProgress: { [quest]: { id: quest, status: 'completed' as const,
      rewardClaimed: true, objectives: { 'obj-find-figurine': true, 'obj-give-cain': true, 'obj-give-alkor': true } } } } };
    const out = decodeSave(old);
    expect(out.player.derivedStats.lifeMax).toBe(deriveStats(save.player.coreStats, save.player.level).lifeMax + 20);
    expect([out.player.derivedStats.life, out.player.derivedStats.mana]).toEqual([7, 3]);
    expect(out.inventory.questItems).toEqual(old.inventory.questItems); expect(out.map).toEqual(withV32Defaults(old).map);
  });
  it.each(['normal', 'nightmare', 'hell'] as const)('retains qualified %s selection and three independent histories/counters', profile => {
    const save = literal24(), evidence = campaignEvidence();
    const old = { ...save, inventory: { ...save.inventory, questItems: evidence.questItems },
      endgame: { attemptOrdinal: 5, clearCounts: { ashen: 1, glacial: 1 }, achievementRewardClaimed: true },
      map: { ...save.map, questProgress: evidence.questProgress, questReceipts: evidence.questReceipts,
        questTitles: { 'titles/slayer_of_baal': true as const }, selectedTitle: 'titles/slayer_of_baal',
        questDifficulties: { 'difficulty/nightmare': true as const }, selectedDifficulty: profile,
        clearedSubAreas: ['areas/act1-blood-moor'], nightmareClearedSubAreas: ['areas/act1-cold-plains'],
        hellClearedSubAreas: ['areas/act1-dark-wood'], challengeOrdinals: { normal: 13, nightmare: 7, hell: 2 } } };
    expect(() => validateFrozenV24Save(old)).not.toThrow();
    const out = decodeSave(old);
    expect(out.map).toEqual(withV32Defaults(old).map); expect(out.endgame).toEqual(old.endgame);
    expect(out.inventory).toEqual(old.inventory); expect(out.version).toBe(33);
  });
  it('validates its literal predecessor before recovering malformed ownership', () => {
    const save = literal24(), duplicate = item('collision'), old = { ...save,
      inventory: { ...save.inventory, backpack: [duplicate], equipped: { charm: duplicate } } };
    const before = structuredClone(old);
    expect(() => decodeSave(old)).toThrow('Invalid'); expect(old).toEqual(before);
    expect(() => decodeSave({ ...save, inventory: { ...save.inventory, equipped: {
      charm: item('future', { baseId: charmBase.id, uniqueId: unique.id }) } } })).toThrow('Invalid');
  });
});

describe('native25 charm slot admission', () => {
  it('admits one exact hero charm and bag copies without using actor mirrors as owners', () => {
    const save = literal24(), charm = item('live', { baseId: charmBase.id, uniqueId: unique.id, equipSlot: 'charm' });
    const current = { ...withoutV32Fields(save), version: 25, player: { ...save.player, equipment: [charm] }, inventory: { ...save.inventory,
      equipped: { charm }, backpack: [{ ...charm, id: 'bag', equipped: false }], stash: [{ ...charm, id: 'stash', equipped: false }] } };
    expect(validateSave(current)).toEqual(toJsonSafe(current));
    expect(validateSave(toJsonSafe(current))).toEqual(toJsonSafe(current));
    expect(() => validateFrozenV24Save({ ...current, version: 24 })).toThrow('Invalid');
  });
  it.each(['hero-wrong-slot', 'hero-wrong-base', 'merc-charm', 'merc-other-slot', 'merc-null', 'duplicate'] as const)(
    'rejects malformed %s ownership before normalization', fault => {
      const save = literal24(), charm = item('live', { baseId: charmBase.id, uniqueId: unique.id });
      const equipped = fault === 'hero-wrong-slot' ? { head: charm } : fault === 'hero-wrong-base' ? { charm: item('cap') }
        : fault === 'duplicate' ? { charm } : {};
      const current = { ...withoutV32Fields(save), version: 25, inventory: { ...save.inventory, equipped,
        backpack: fault === 'duplicate' ? [charm] : [] }, mercs: { ...save.mercs,
        mercEquipment: fault === 'merc-charm' ? { orphan: { charm } } : fault === 'merc-other-slot'
          ? { orphan: { head: charm } } : fault === 'merc-null' ? { orphan: { charm: null } } : {} } };
      const before = structuredClone(current);
      expect(() => validateSave(current)).toThrow('Invalid'); expect(current).toEqual(before);
      expect(() => validateSave(toJsonSafe(current))).toThrow('Invalid');
    });
  it('preserves unrelated arbitrary equipment keys and unknown unique strings on known bases', () => {
    const save = literal24(), sword = item('old', { baseId: 'items/base/wp1h-short-sword', uniqueId: unique.id });
    const current = { ...withoutV32Fields(save), version: 25, inventory: { ...save.inventory, equipped: { legacy: sword } } };
    expect(validateSave(current)).toEqual(toJsonSafe(current));
  });
  it('rejects accessors without invoking them', () => {
    const save = literal24(), current = { ...withoutV32Fields(save), version: 25 }; let invoked = false;
    Object.defineProperty(current.inventory.equipped, 'charm', { enumerable: true, get: () => { invoked = true; return null; } });
    expect(() => validateSave(current)).toThrow('Invalid'); expect(invoked).toBe(false);
  });
});
