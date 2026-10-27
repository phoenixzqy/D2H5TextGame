import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import * as questLoader from '@/data/loaders/quests';
import { act5Runtime } from '@/data/loaders/act5-runtime';
import { endgameDefinition } from '@/data/loaders/endgame';
import { subAreas } from '@/data/index';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { buildSave, toJsonSafe } from './serialize';
import { decodeSave, validateFrozenV22Save } from './validate';
import { FROZEN_V22 } from './frozen-v22';
import type { QuestItemLedger, QuestProgressData, SaveCurrent } from '../types/save';

// Only the catalogs vary: the production validators and save data remain real.
vi.mock('@/data/loaders/act5-runtime', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/act5-runtime')>();
  return { ...actual, act5Runtime: structuredClone(actual.act5Runtime) };
});
vi.mock('@/data/loaders/endgame', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/endgame')>();
  return { ...actual, endgameDefinition: structuredClone(actual.endgameDefinition) };
});
const quests = structuredClone(questLoader.loadQuests());
const originalActions = structuredClone(act5Runtime.actions);
const originalEncounters = structuredClone(act5Runtime.encounters);
const originalTitle = endgameDefinition.achievement.reward.titleId;
const originalAreas = [...subAreas];
afterEach(() => {
  vi.restoreAllMocks();
  act5Runtime.actions.splice(0, act5Runtime.actions.length, ...structuredClone(originalActions));
  act5Runtime.encounters.splice(0, act5Runtime.encounters.length, ...structuredClone(originalEncounters));
  Reflect.set(endgameDefinition.achievement.reward, 'titleId', originalTitle);
  subAreas.splice(0, subAreas.length, ...originalAreas);
});

const serviceSources = [
  ['quests/act5-siege-on-harrogath', 'socket_item'],
  ['quests/side-act5-larzuks-sockets', 'socket_item'],
  ['quests/side-act4-halbus-soul', 'socket_armor'],
  ['quests/act5-prison-of-ice', 'personalize_item'],
  ['quests/side-act5-anyas-gift', 'personalize_item']
] as const;

/** Constructed authority graph, never evidence of earned gameplay. */
function serviceHistory(): SaveCurrent {
  const save = sample(), prison = 'quests/act5-prison-of-ice', guardian = 'quests/act3-guardian';
  const khalim = 'quests/act3-khalims-will', forge = 'quests/act4-hellforge', staff = 'quests/act2-horadric-staff';
  const questItems: QuestItemLedger = {
    [`${staff}#objective:obj-cube`]: { itemId: 'quest/horadric_cube', state: 'owned' },
    ...Object.fromEntries(['heart', 'brain', 'eye', 'flail'].map(part =>
      [`${khalim}#objective:obj-${part}`, { itemId: `quest/khalims_${part}`, state: 'consumed' as const }])),
    [`${khalim}#objective:obj-transmute`]: { itemId: 'items/khalims_will', state: 'consumed' },
    [`${guardian}#reward:questItem`]: { itemId: 'items/soulstone_mephisto', state: 'consumed' },
    [`${forge}#objective:obj-kill-hephasto`]: { itemId: 'quest/hellforge_hammer', state: 'consumed' },
    [`${prison}#action:receive-potion`]: { itemId: 'quest/malahs_potion', state: 'consumed' },
    [`${prison}#reward:questItem`]: { itemId: 'items/scroll_of_resist', state: 'owned' }
  };
  const questProgress = Object.fromEntries([...serviceSources.map(([id]) => id), guardian, khalim, forge]
    .map(id => [id, completed(id)]));
  questProgress[staff] = { id: staff, status: 'inProgress', rewardClaimed: false,
    objectives: { 'obj-cube': true, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } };
  const questReceipts = Object.fromEntries([
    `${khalim}#action:council-victory`, `${guardian}#action:break-compelling-orb`,
    `${forge}#action:hephasto-victory`, `${forge}#action:shatter-soulstone`,
    'quests/act5-siege-on-harrogath#action:shenk-victory', `${prison}#action:nihlathak-victory`,
    `${prison}#action:inspect-anya`, `${prison}#action:receive-potion`, `${prison}#action:thaw-anya`
  ].map(source => [source, true as const]));
  return { ...save, map: { ...save.map, questProgress, questReceipts }, inventory: { ...save.inventory, questItems } };
}

describe('literal22 ownership and historical journals', () => {
  it.each(serviceSources)('preserves available and consumed %s, including absent salvaged targets', (id, serviceId) => {
    for (const state of ['available', 'consumed'] as const) {
      const save = serviceHistory(), input = { ...save, inventory: { ...save.inventory, questServices:
        { [`${id}#reward:service`]: state === 'available' ? { serviceId, state }
          : { serviceId, state, targetItemId: 'salvaged-long-ago' } } } };
      const before = structuredClone(input);
      expect(validateFrozenV22Save(input)).toEqual(toJsonSafe(input));
      expect(decodeSave(toJsonSafe(input))).toEqual(input);
      expect(input).toEqual(before);
    }
  });

  it.each([17, 18, 19, 20, 21, 22])('decodes native%s services using the frozen nested definitions', version => {
    const save = serviceHistory();
    const services = Object.fromEntries(serviceSources.map(([id, serviceId], index) => [`${id}#reward:service`,
      index % 2 ? { serviceId, state: 'consumed', targetItemId: `salvaged-${String(index)}` } : { serviceId, state: 'available' }]));
    const raw = toJsonSafe({ ...save, inventory: { ...save.inventory, questServices: services } }) as SaveCurrent;
    const input = { ...raw, version };
    if (version < 21) Reflect.deleteProperty(input.player, 'respecsRemaining');
    if (version < 20) Reflect.deleteProperty(input, 'endgame');
    if (version < 19) {
      Reflect.deleteProperty(input.inventory, 'materialActionOrdinal');
      Reflect.deleteProperty(input.inventory, 'socketQuarantine');
    }
    if (version < 18) Reflect.deleteProperty(input.inventory, 'materials');
    const before = structuredClone(input);
    vi.spyOn(questLoader, 'loadQuests').mockReturnValue(quests.map(quest =>
      ({ ...quest, rewards: {}, objectives: [...quest.objectives, { id: 'future', type: 'talk', description: 'Future' }] })));
    const decoded = decodeSave(input);
    expect(decoded.inventory.questServices).toEqual(services);
    expect(decoded.inventory.questItems).toEqual(save.inventory.questItems);
    expect(decoded.map).toEqual(save.map);
    expect(decoded.inventory.currencies).toEqual(save.inventory.currencies);
    expect(decoded.player.derivedStats.life).toBe(save.player.derivedStats.life);
    expect(decoded.player.derivedStats.mana).toBe(save.player.derivedStats.mana);
    expect(input).toEqual(before);
  });

  it.each(['quests/act1-search-for-cain', 'quests/side-act1-cains-favor', 'quests/act1-forgotten-tower',
    'quests/act1-tools-of-the-trade', 'quests/side-act1-charsis-imbue'])(
    'preserves partial completed/claimed %s without inferring proof or entitlement', id => {
      for (const claimed of [false, true]) for (const objectives of [{}, Object.fromEntries(
        Object.keys(completed(id).objectives).map(key => [key, false]))]) {
        const save = sample(), row = { id, status: 'completed' as const, rewardClaimed: claimed, objectives };
        const input = { ...save, map: { ...save.map, questProgress: { [id]: row } } };
        const before = structuredClone(input), decoded = decodeSave(toJsonSafe(input));
        expect(decoded).toEqual(input);
        expect(decoded.inventory.questItems).toEqual({});
        expect(decoded.inventory.questServices).toEqual({});
        expect(decoded.map.questReceipts).toEqual({});
        expect(input).toEqual(before);
      }
    });

  it('keeps literal Nightmare areas and refuses future areas despite live catalog changes', () => {
    const save = sample(), evidence = campaignEvidence();
    const input = { ...save, map: { ...save.map, questProgress: evidence.questProgress,
      questReceipts: evidence.questReceipts, questTitles: { 'titles/slayer_of_baal': true as const },
      questDifficulties: { 'difficulty/nightmare': true as const }, selectedDifficulty: 'nightmare' as const,
      nightmareClearedSubAreas: ['areas/act1-dark-wood'] } };
    subAreas.splice(0, subAreas.length);
    expect(validateFrozenV22Save(input)).toEqual(toJsonSafe(input));
    const originalArea = originalAreas[0];
    if (!originalArea) throw new Error('Missing live area fixture');
    subAreas.push({ ...originalArea, id: 'areas/future-expansion' });
    expect(() => validateFrozenV22Save({ ...input, map: { ...input.map,
      nightmareClearedSubAreas: ['areas/future-expansion'] } })).toThrow('Nightmare clear');
  });

  it.each(['quest-item', 'action', 'victory', 'imbue'])(
    'refuses a future Act I %s under raw22 without inferring any migration grant', kind => {
      const save = sample(), id = kind === 'imbue' ? 'quests/act1-tools-of-the-trade' : 'quests/act1-search-for-cain';
      const map = { ...save.map, questProgress: { [id]: completed(id) }, questReceipts: kind === 'action'
        ? { [`${id}#action:rescue-cain`]: true } : kind === 'victory'
          ? { 'quests/act1-forgotten-tower#action:countess-victory': true } : {} };
      const inventory = { ...save.inventory, ...(kind === 'quest-item' ? { questItems:
        { [`${id}#objective:obj-inifuss-tree`]: { itemId: 'quest/scroll_of_inifuss', state: 'owned' } } }
        : kind === 'imbue' ? { questServices: { [`${id}#reward:service`]: { serviceId: 'imbue_item', state: 'available' } } } : {}) };
      const input = { ...save, map, inventory }, before = structuredClone(input);
      expect(() => decodeSave(input)).toThrow();
      expect(input).toEqual(before);
    });

  it('deeply freezes the literal nested authority without freezing live catalogs', () => {
    for (const value of [FROZEN_V22, FROZEN_V22.act5, FROZEN_V22.quests[0],
      FROZEN_V22.quests[0]?.objectives, FROZEN_V22.serviceSources, FROZEN_V22.act5.actions[0]]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(Reflect.set(FROZEN_V22.act5, 'prisonQuest', 'future')).toBe(false);
  });

  it('decodes Golden Bird, Sun, Rescue and a read scroll with current cache repairs and unchanged resources', () => {
    const save = serviceHistory(), bird = 'quests/act3-golden-bird', sun = 'quests/act2-tainted-sun';
    const rescue = 'quests/act5-rescue-on-mount-arreat', prison = 'quests/act5-prison-of-ice';
    const input = { ...save, player: { ...save.player,
      derivedStats: { ...save.player.derivedStats, life: 19, mana: 7 } },
      map: { ...save.map, questProgress: { ...save.map.questProgress,
        [bird]: completed(bird), [sun]: completed(sun), [rescue]: completed(rescue) },
      questReceipts: { ...save.map.questReceipts, [`${prison}#action:read-resistance-scroll`]: true as const,
        ...Object.fromEntries([1, 2, 3].map(n => [`${rescue}#action:release-cage-${String(n)}`, true as const])) } },
      inventory: { ...save.inventory, questItems: { ...save.inventory.questItems,
        [`${prison}#reward:questItem`]: { itemId: 'items/scroll_of_resist', state: 'consumed' as const },
        [`${bird}#objective:obj-find-figurine`]: { itemId: 'quest/jade_figurine', state: 'consumed' as const },
        [`${bird}#objective:obj-give-cain`]: { itemId: 'quest/golden_bird', state: 'consumed' as const },
        [`${bird}#reward:questItem`]: { itemId: 'items/potion_of_life_q', state: 'consumed' as const } } } };
    const before = structuredClone(input), decoded = decodeSave(toJsonSafe(input));
    const stats = decoded.player.derivedStats;
    expect(stats.lifeMax).toBe(save.player.derivedStats.lifeMax + 20);
    // Rescue contributes5, the read scroll10, and Sun another30 fire/cold.
    expect(stats.resistances).toEqual({ fire: 45, cold: 45, lightning: 15, poison: 15, physical: 15, arcane: 15 });
    expect(stats.life).toBe(19); expect(stats.mana).toBe(7);
    expect(decoded.inventory).toEqual(input.inventory);
    expect(decoded.map).toEqual(input.map);
    expect(decodeSave(toJsonSafe(decoded))).toEqual(decoded);
    expect(input).toEqual(before);
  });
});

describe('literal22 reciprocal refusals', () => {
  it.each(['potion-action', 'inspect', 'thaw', 'scroll-read', 'hammer', 'soulstone', 'hephasto', 'shatter'])(
    'rejects broken %s while retaining historical ownership', fault => {
      const save = serviceHistory(), prison = 'quests/act5-prison-of-ice', forge = 'quests/act4-hellforge';
      const input = { ...save, map: { ...save.map, questReceipts: { ...save.map.questReceipts } } };
      if (fault === 'potion-action') Reflect.deleteProperty(input.map.questReceipts, `${prison}#action:receive-potion`);
      if (fault === 'inspect') Reflect.deleteProperty(input.map.questReceipts, `${prison}#action:inspect-anya`);
      if (fault === 'thaw') Reflect.deleteProperty(input.map.questReceipts, `${prison}#action:thaw-anya`);
      if (fault === 'scroll-read') input.map.questReceipts = { ...input.map.questReceipts, [`${prison}#action:read-resistance-scroll`]: true };
      if (fault === 'hammer') Reflect.deleteProperty(input.inventory.questItems, `${forge}#objective:obj-kill-hephasto`);
      if (fault === 'soulstone') Reflect.deleteProperty(input.inventory.questItems, 'quests/act3-guardian#reward:questItem');
      if (fault === 'hephasto') Reflect.deleteProperty(input.map.questReceipts, `${forge}#action:hephasto-victory`);
      if (fault === 'shatter') Reflect.deleteProperty(input.map.questReceipts, `${forge}#action:shatter-soulstone`);
      expect(() => validateFrozenV22Save(input)).toThrow();
    });

  it('requires the full cage graph to match its actual completion flag', () => {
    const save = sample(), id = 'quests/act5-rescue-on-mount-arreat';
    const input = { ...save, map: { ...save.map, questProgress: { [id]: completed(id) },
      questReceipts: Object.fromEntries([1, 2, 3].map(n => [`${id}#action:release-cage-${String(n)}`, true as const])) } };
    expect(validateFrozenV22Save(input)).toEqual(toJsonSafe(input));
    expect(() => validateFrozenV22Save({ ...input, map: { ...input.map, questProgress: { [id]: { ...completed(id),
      status: 'inProgress', rewardClaimed: false, objectives: { 'obj-free-15': false } } } } })).toThrow();
  });

  it.each(['throne', 'baal', 'flag-only'])(
    'refuses %s campaign/title/Nightmare/endgame authority', fault => {
      const save = sample(), evidence = campaignEvidence(), receipts = { ...evidence.questReceipts };
      if (fault !== 'baal') Reflect.deleteProperty(receipts, 'quests/act5-eve-of-destruction#action:throne-waves-victory');
      if (fault !== 'throne') Reflect.deleteProperty(receipts, 'quests/act5-eve-of-destruction#action:baal-victory');
      const map = { ...save.map, questProgress: evidence.questProgress, questReceipts: receipts };
      for (const patch of [{ questTitles: { 'titles/slayer_of_baal': true } },
        { questDifficulties: { 'difficulty/nightmare': true } }]) {
        expect(() => validateFrozenV22Save({ ...save, map: { ...map, ...patch } })).toThrow();
      }
      expect(() => validateFrozenV22Save({ ...save, map, endgame: { attemptOrdinal: 1,
        clearCounts: { ashen: 1, glacial: 0 }, achievementRewardClaimed: false } })).toThrow();
    });
});

function completed(id: string): QuestProgressData {
  const quest = quests.find(row => row.id === id);
  if (!quest) throw new Error(`Missing literal22 fixture ${id}`);
  return { id, status: 'completed', rewardClaimed: true,
    objectives: Object.fromEntries(quest.objectives.map(row => [row.id, true])) };
}
function sample() {
  return buildSave({ timestamp: 1000, player: createMockPlayer('Literal22', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
}

describe('literal22 catalogs remain independent of live authoring', () => {
  it('keeps a claimed reward item valid after live objectives and rewards change', () => {
    const save = sample(), id = 'quests/act2-radaments-lair';
    const input = { ...save, map: { ...save.map, questProgress: { [id]: completed(id) } },
      inventory: { ...save.inventory, questItems: { [`${id}#reward:questItem`]:
        { itemId: 'items/book_of_skill', state: 'owned' as const } } } };
    expect(validateFrozenV22Save(input)).toEqual(toJsonSafe(input));
    vi.spyOn(questLoader, 'loadQuests').mockReturnValue(quests.map(quest => quest.id === id
      ? { ...quest, objectives: [...quest.objectives, { id: 'future-objective', type: 'talk', description: 'Future' }] }
      : quest));
    expect(validateFrozenV22Save(input)).toEqual(toJsonSafe(input));
  });

  it('keeps the original source service mapping and claimed quest definition', () => {
    const save = sample(), id = 'quests/act5-siege-on-harrogath';
    const input = { ...save, map: { ...save.map, questProgress: { [id]: completed(id) },
      questReceipts: { [`${id}#action:shenk-victory`]: true as const } }, inventory: { ...save.inventory,
      questServices: { [`${id}#reward:service`]: { serviceId: 'socket_item' as const, state: 'available' as const } } } };
    expect(validateFrozenV22Save(input)).toEqual(toJsonSafe(input));
    vi.spyOn(questLoader, 'loadQuests').mockReturnValue(quests.map(quest => quest.id === id
      ? { ...quest, rewards: { ...quest.rewards, service: 'future-service' } } : quest));
    expect(validateFrozenV22Save(input)).toEqual(toJsonSafe(input));
  });

  it('resolves the original potion source after live action identities change', () => {
    const save = sample(), id = 'quests/act5-prison-of-ice', source = `${id}#action:receive-potion`;
    const input = { ...save, map: { ...save.map, questProgress: { [id]: { ...completed(id),
      status: 'inProgress' as const, rewardClaimed: false, objectives:
        { 'obj-find-anya': true, 'obj-thaw': false, 'obj-kill-nihlathak': false } } },
      questReceipts: { [`${id}#action:inspect-anya`]: true as const, [source]: true as const } },
      inventory: { ...save.inventory, questItems: { [source]: { itemId: 'quest/malahs_potion', state: 'owned' as const } } } };
    expect(validateFrozenV22Save(input)).toEqual(toJsonSafe(input));
    const potion = act5Runtime.actions.find(row => row.kind === 'potion');
    if (!potion) throw new Error('Missing live potion fixture');
    potion.receiptSource = `${id}#action:future-potion`;
    expect(validateFrozenV22Save(input)).toEqual(toJsonSafe(input));
  });

  it('keeps the original achievement title and nested campaign authority', () => {
    const save = sample(), evidence = campaignEvidence();
    const input = { ...save, endgame: { attemptOrdinal: 2, clearCounts: { ashen: 1, glacial: 1 },
      achievementRewardClaimed: true }, map: { ...save.map, questProgress: evidence.questProgress,
      questReceipts: evidence.questReceipts, selectedTitle: 'titles/worldstone-adapt' } };
    expect(validateFrozenV22Save(input)).toEqual(toJsonSafe(input));
    Reflect.set(endgameDefinition.achievement.reward, 'titleId', 'titles/future-achievement');
    const encounter = act5Runtime.encounters.at(-1);
    if (!encounter) throw new Error('Missing live encounter fixture');
    act5Runtime.encounters[act5Runtime.encounters.length - 1] = { ...encounter,
      proof: 'quests/act5-eve-of-destruction#action:future-victory' };
    expect(validateFrozenV22Save(input)).toEqual(toJsonSafe(input));
  });
});
