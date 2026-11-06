/** Constructed literal25 compatibility; no earned progression or acquisition claim. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { withoutV32Fields } from '../../../tests/helpers/save-fixtures';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import * as quests from '@/data/loaders/quests';
import type { Item } from '../types/items';
import { FROZEN_V24 } from './frozen-v24';
import { buildSave, toJsonSafe } from './serialize';
import { validateFrozenV25Save as literal25 } from './validate';

const ORMUS = { quest: 'quests/side-act3-ormus-charm', first: 'obj-kill-shamans', talk: 'obj-return-ormus',
  proof: 'quests/side-act3-ormus-charm#action:flayer-jungle-victory' };

// Future live domains change BEFORE validator import. A module-load snapshot of
// live loaders must not substitute for the accepted literal25 authority.
vi.mock('@/data/loaders/loot', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/loot')>();
  const bases = new Map(actual.loadItemBases());
  bases.delete('items/base/wp1h-short-sword');
  bases.delete('items/base/small-charm');
  return { ...actual, loadItemBases: () => bases };
});
vi.mock('@/data/loaders/act5-runtime', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/act5-runtime')>();
  const runtime = structuredClone(actual.act5Runtime);
  runtime.encounters = runtime.encounters.map(row => row.questId === 'quests/act5-eve-of-destruction'
    ? { ...row, proof: 'quests/act5-eve-of-destruction#action:future-baal' } : row);
  return { ...actual, act5Runtime: runtime };
});
vi.mock('../map/ormus-quest', async importOriginal => {
  const actual = await importOriginal<typeof import('../map/ormus-quest')>();
  return { ...actual, ORMUS: { ...actual.ORMUS, first: 'obj-future', proof: 'future-ormus-proof' } };
});
afterEach(() => { vi.restoreAllMocks(); });
const side = 'quests/side-act5-larzuks-sockets', siege = 'quests/act5-siege-on-harrogath';
function sample() {
  return { ...withoutV32Fields(buildSave({ timestamp: 1000, player: createMockPlayer('Literal25', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } })), version: 25 as const };
}
function ormus() {
  const save = sample();
  return { ...save, map: { ...save.map,
    questProgress: { [ORMUS.quest]: { id: ORMUS.quest, status: 'completed', rewardClaimed: true,
      objectives: { [ORMUS.first]: true, [ORMUS.talk]: true } } }, questReceipts: { [ORMUS.proof]: true as const } } };
}
function completed(id: string) {
  const quest = FROZEN_V24.quests.find(row => row.id === id);
  if (!quest) throw new Error('Missing historical fixture quest');
  return { id, status: 'completed', rewardClaimed: true,
    objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, true])) };
}
describe('literal25 frozen quest/item/charm and nested campaign authority', () => {
  it('retains accepted Ormus objectives when live definitions add a new obligation', () => {
    const live = quests.loadQuests();
    vi.spyOn(quests, 'loadQuests').mockReturnValue(live.map(row => row.id === ORMUS.quest
      ? { ...row, objectives: [...row.objectives, { id: 'obj-future', type: 'talk', description: 'Future' }] } : row));
    const save = ormus(), before = structuredClone(save);
    expect(literal25(save)).toEqual(toJsonSafe(save));
    expect(literal25(toJsonSafe(save))).toEqual(toJsonSafe(save));
    expect(save).toEqual(before);
  });
  it.each(['backpack', 'stash', 'hero', 'hero-mirror', 'merc-mirror'] as const)(
    'retains a historical charm and affix Map in %s after live base removal', location => {
      const save = sample();
      const charm: Item = { id: 'historical-charm', baseId: 'items/base/small-charm',
        uniqueId: 'items/unique/ormus-charm', rarity: 'unique', level: 32, socketCapacity: 0,
        identified: true, equipped: location === 'hero',
        affixes: [{ affixId: 'historical-map', values: new Map([['statMods.life', 7]]) }] };
      const input = { ...save, inventory: { ...save.inventory,
        backpack: location === 'backpack' ? [charm] : [], stash: location === 'stash' ? [charm] : [],
        equipped: location === 'hero' ? { charm } : {} },
        player: { ...save.player, equipment: location === 'hero-mirror' ? [charm] : [] },
        mercs: { ...save.mercs, ownedMercs: location === 'merc-mirror' ? [{ ...save.player,
          id: 'merc', type: 'mercenary' as const, archetype: 'rogue', rarity: 'R' as const, equipment: [charm] }] : [] } };
      const before = structuredClone(input);
      expect(literal25(input)).toEqual(toJsonSafe(input));
      expect(literal25(toJsonSafe(input))).toEqual(toJsonSafe(input));
      expect(input).toEqual(before);
    });
  it.each(['available', 'consumed', 'absent'] as const)('preserves proofless claimed legacy service %s', state => {
    const save = ormus(), encounter = FROZEN_V24.act5.encounters.find(row => row.questId === siege);
    if (!encounter) throw new Error('Missing historical Siege fixture');
    const input = { ...save, map: { ...save.map,
      questProgress: { ...save.map.questProgress, [siege]: completed(siege), [side]: completed(side) },
      questReceipts: { ...save.map.questReceipts, [encounter.proof]: true as const } },
      inventory: { ...save.inventory, questServices: state === 'absent' ? {} : {
        [`${side}#reward:service`]: { serviceId: 'socket_item', state,
          ...(state === 'consumed' ? { targetItemId: 'historical-consumed-target' } : {}) } } } };
    expect(literal25(input)).toEqual(toJsonSafe(input));
  });
  it.each(['normal', 'nightmare', 'hell'] as const)('threads the same literal domain into nested %s and achievement checks', profile => {
    const save = ormus(), eve = FROZEN_V24.act5.eveQuest;
    const encounter = FROZEN_V24.act5.encounters.find(row => row.questId === eve);
    if (!encounter) throw new Error('Missing historical Eve fixture');
    const input = { ...save, endgame: { attemptOrdinal: 2, clearCounts: { ashen: 1, glacial: 1 }, achievementRewardClaimed: true },
      map: { ...save.map, questProgress: { ...save.map.questProgress, [eve]: completed(eve) },
        questReceipts: { ...save.map.questReceipts, [encounter.proof]: true as const, [FROZEN_V24.act5.throneProof]: true as const },
        questTitles: { 'titles/slayer_of_baal': true as const }, questDifficulties: { 'difficulty/nightmare': true as const },
        selectedTitle: 'titles/worldstone-adapt', selectedDifficulty: profile,
        nightmareClearedSubAreas: ['areas/act1-blood-moor'], hellClearedSubAreas: ['areas/act1-blood-moor'],
        challengeOrdinals: { normal: 13, nightmare: 2, hell: 3 } } };
    expect(literal25(input)).toEqual(toJsonSafe(input));
    expect(literal25(toJsonSafe(input))).toEqual(toJsonSafe(input));
  });
  it('rejects future Present proof even with completed Siege and side rows', () => {
    const save = sample(), encounter = FROZEN_V24.act5.encounters.find(row => row.questId === siege);
    if (!encounter) throw new Error('Missing historical Siege fixture');
    const input = { ...save, map: { ...save.map, questProgress: { [siege]: completed(siege), [side]: completed(side) },
      questReceipts: { [encounter.proof]: true, [`${side}#action:present-item`]: true } } };
    expect(() => literal25(input)).toThrow('Invalid');
  });
  it.each(['wrong-slot', 'merc-slot', 'duplicate', 'missing-objective', 'orphan-proof'] as const)(
    'retains accepted refusal for %s', fault => {
      const save = ormus(), charm: Item = { id: 'charm', baseId: 'items/base/small-charm',
        rarity: 'normal', level: 1, identified: true, equipped: true, socketCapacity: 0 };
      if (fault === 'wrong-slot') Reflect.set(save.inventory.equipped, 'head', charm);
      if (fault === 'merc-slot') Reflect.set(save.mercs.mercEquipment, 'orphan', { charm });
      if (fault === 'duplicate') {
        Reflect.set(save.inventory.equipped, 'charm', charm);
        Reflect.set(save.inventory, 'stash', [charm]);
      }
      if (fault === 'missing-objective') Reflect.deleteProperty(save.map.questProgress[ORMUS.quest]?.objectives ?? {}, ORMUS.first);
      if (fault === 'orphan-proof') Reflect.deleteProperty(save.map.questProgress, ORMUS.quest);
      expect(() => literal25(save)).toThrow('Invalid');
    });
});
