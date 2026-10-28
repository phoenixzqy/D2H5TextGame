/** Constructed save authority only; these fixtures never represent earned gameplay. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import * as questLoader from '@/data/loaders/quests';
import * as itemLoader from '@/data/loaders/quest-items';
import * as actionLoader from '@/data/loaders/quest-actions';
import { act5Runtime } from '@/data/loaders/act5-runtime';
import { endgameDefinition } from '@/data/loaders/endgame';
import { subAreas } from '@/data/index';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { withoutV17Fields, withoutV19Fields, withoutV20Fields, withoutV24Fields, withV24Defaults } from '../../../tests/helpers/save-fixtures';
import { ACT1_IMBUE_SOURCES, ACT1_QUEST_RECEIPTS } from '../map/act1-quest-sources';
import { CAIN_QUEST, CAIN_SIDE_QUEST, CAIN_SCROLL_SOURCE, CAIN_SCROLL_ITEM } from '../map/cain-quest';
import { MALUS_QUEST, MALUS_SIDE_QUEST, MALUS_SOURCE, MALUS_ITEM } from '../map/malus-quest';
import { COUNTESS } from '../map/countess-admission';
import { CURRENT_SAVE_VERSION, MIGRATIONS, type QuestItemLedger, type QuestProgressData, type SaveV23 } from '../types/save';
import { buildSave, toJsonSafe } from './serialize';
import * as validation from './validate';
import { runMigrations } from './migrate';

vi.mock('@/data/loaders/act5-runtime', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/act5-runtime')>();
  return { ...actual, act5Runtime: structuredClone(actual.act5Runtime) };
});
vi.mock('@/data/loaders/endgame', async importOriginal => {
  const actual = await importOriginal<typeof import('@/data/loaders/endgame')>();
  return { ...actual, endgameDefinition: structuredClone(actual.endgameDefinition) };
});
const quests = structuredClone(questLoader.loadQuests());
const items = structuredClone(itemLoader.loadQuestItems());
const actions = structuredClone(actionLoader.loadQuestActions());
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

// The original-source fallback used for causal RED is retained in the evidence copy.
const literal23 = validation.validateFrozenV23Save;
function sample(): SaveV23 {
  const current = buildSave({ timestamp: 1000, player: createMockPlayer('Literal23', 'sorceress'),
    inventory: { backpack: [], stash: [], equipped: {}, currencies: { wishstone: 17 } },
    mercs: { ownedMercs: [], fieldedMercId: null, mercEquipment: {}, mercProgress: {} },
    map: { currentAct: 1, currentSubAreaId: null, discoveredAreas: [], clearedSubAreas: [], questProgress: {} },
    meta: { settings: { locale: 'en', stealthMode: false, soundEnabled: false, musicEnabled: false,
      combatSpeed: 1, autoCombat: false }, idleState: { lastOnline: 1000, offlineTime: 0,
      multiplierSecondsRemaining: 0, activeMultiplier: 1 }, gachaState: { currency: 0, ownedMercIds: [], pityCounter: 0 } },
    formation: { playerPosition: { row: 1, col: 1 }, mercPosition: { row: 0, col: 0 }, summonPositions: [] } });
  return { ...withoutV24Fields(current), version: 23 };
}
function completed(id: string, claimed = true): QuestProgressData {
  const quest = quests.find(row => row.id === id);
  if (!quest) throw new Error(`Missing constructed quest ${id}`);
  return { id, status: 'completed', rewardClaimed: claimed,
    objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, true])) };
}
function act1History(): SaveV23 {
  const save = sample();
  return { ...save, map: { ...save.map,
    questProgress: Object.fromEntries([CAIN_QUEST, CAIN_SIDE_QUEST, MALUS_QUEST, MALUS_SIDE_QUEST, COUNTESS.quest]
      .map(id => [id, completed(id)])),
    questReceipts: Object.fromEntries(Object.values(ACT1_QUEST_RECEIPTS).map(source => [source, true as const])) },
  inventory: { ...save.inventory, questItems: {
    [CAIN_SCROLL_SOURCE]: { itemId: CAIN_SCROLL_ITEM, state: 'consumed' },
    [MALUS_SOURCE]: { itemId: MALUS_ITEM, state: 'consumed' }
  }, questServices: {
    [ACT1_IMBUE_SOURCES.main]: { serviceId: 'imbue_item', state: 'available' },
    [ACT1_IMBUE_SOURCES.side]: { serviceId: 'imbue_item', state: 'consumed', targetItemId: 'already-salvaged' }
  } } };
}
function replayHistory(): SaveV23 {
  const save = sample(), evidence = campaignEvidence();
  return { ...save, endgame: { attemptOrdinal: 2, clearCounts: { ashen: 1, glacial: 1 }, achievementRewardClaimed: true },
    map: { ...save.map, ...evidence, questDifficulties: { 'difficulty/nightmare': true },
      selectedDifficulty: 'nightmare', selectedTitle: 'titles/worldstone-adapt',
      nightmareClearedSubAreas: ['areas/act1-blood-moor'], challengeOrdinals: { normal: 13, nightmare: 2 } } };
}
function predecessor(version: number): Record<string, unknown> & { version: number } {
  const save = sample();
  const historical = version < 17 ? withoutV17Fields(save) : version < 19 ? withoutV19Fields(save)
    : version < 20 ? withoutV20Fields(save) : save;
  const value = structuredClone({ ...historical, version }) as unknown as Record<string, unknown> & {
    version: number; inventory: Record<string, unknown>; map: Record<string, unknown>; player: Record<string, unknown> };
  if (version < 21) Reflect.deleteProperty(value.player, 'respecsRemaining');
  if (version < 20) Reflect.deleteProperty(value, 'endgame');
  if (version < 18) Reflect.deleteProperty(value.inventory, 'materials');
  if (version < 15) Reflect.deleteProperty(value.map, 'questReceipts');
  if (version < 12) Reflect.deleteProperty(value.inventory, 'questItems');
  if (version < 9) Reflect.deleteProperty(value.player.derivedStats as object, 'magicResist');
  if (version < 7) Reflect.deleteProperty(value, 'formation');
  if (version === 1) return { version, timestamp: value.timestamp, player: value.player,
    inventory: { backpack: [], stash: [], equipment: new Map() }, mercenaries: [],
    mapProgress: { currentAct: 1, currentSubArea: null, completedSubAreas: [] },
    idleState: save.meta.idleState, gachaState: save.meta.gachaState, settings: save.meta.settings };
  return value;
}
function predecessorMap(value: Record<string, unknown> & { version: number }): Record<string, unknown> {
  return value[value.version === 1 ? 'mapProgress' : 'map'] as Record<string, unknown>;
}

const serviceSources = [
  ['quests/act5-siege-on-harrogath', 'socket_item'],
  ['quests/side-act5-larzuks-sockets', 'socket_item'],
  ['quests/side-act4-halbus-soul', 'socket_armor'],
  ['quests/act5-prison-of-ice', 'personalize_item'],
  ['quests/side-act5-anyas-gift', 'personalize_item']
] as const;

/** Constructed authority graph, never evidence of earned gameplay. */
function serviceHistory(): SaveV23 {
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

describe('literal23 baseline and retained Act I authority', () => {
  it('keeps a distinct literal23 reader after native24 registration', () => {
    expect(Reflect.get(validation, 'validateFrozenV23Save')).toBeTypeOf('function');
    expect(CURRENT_SAVE_VERSION).toBe(24); expect(MIGRATIONS[24]).toBeTypeOf('function');
  });
  it.each([sample, act1History, replayHistory])('preserves a valid constructed history without mutation', fixture => {
    const save = fixture(), before = structuredClone(save);
    expect(validation.validateSave(withV24Defaults(save))).toEqual(toJsonSafe(withV24Defaults(save)));
    expect(literal23(save)).toEqual(toJsonSafe(save));
    expect(save).toEqual(before);
  });
  it.each([false, true])('preserves sparse historical journals with claimed=%s without fabricating proof', claimed => {
    const save = sample(), input = { ...save, map: { ...save.map, questProgress: {
      [CAIN_QUEST]: { ...completed(CAIN_QUEST, claimed), objectives: { 'obj-inifuss-tree': true, 'obj-decode': false } },
      [MALUS_QUEST]: { ...completed(MALUS_QUEST, claimed), objectives: {} },
      [COUNTESS.quest]: { ...completed(COUNTESS.quest, claimed), objectives: {} }
    } } };
    expect(literal23(input)).toEqual(toJsonSafe(input));
    expect(validation.validateSave(withV24Defaults(input))).toEqual(toJsonSafe(withV24Defaults(input)));
  });
  it.each(['cain-owned-scroll', 'cain-no-tree', 'cain-no-main', 'cain-no-rescue',
    'malus-owned-item', 'malus-no-recover', 'malus-no-main', 'malus-no-present',
    'countess-false-objective', 'countess-no-row', 'countess-in-progress'])(
    'keeps the original reciprocal %s refusal', fault => {
      const save = structuredClone(act1History());
      if (fault === 'cain-owned-scroll') Reflect.set(save.inventory.questItems, CAIN_SCROLL_SOURCE, { itemId: CAIN_SCROLL_ITEM, state: 'owned' });
      if (fault === 'cain-no-tree') Reflect.deleteProperty(save.map.questProgress[CAIN_QUEST]?.objectives ?? {}, 'obj-inifuss-tree');
      if (fault === 'cain-no-main') Reflect.deleteProperty(save.map.questProgress, CAIN_QUEST);
      if (fault === 'cain-no-rescue') Reflect.deleteProperty(save.map.questReceipts, ACT1_QUEST_RECEIPTS.rescueCain);
      if (fault === 'malus-owned-item') Reflect.set(save.inventory.questItems, MALUS_SOURCE, { itemId: MALUS_ITEM, state: 'owned' });
      if (fault === 'malus-no-recover') Reflect.deleteProperty(save.map.questProgress[MALUS_QUEST]?.objectives ?? {}, 'obj-recover-malus');
      if (fault === 'malus-no-main') Reflect.deleteProperty(save.map.questProgress, MALUS_QUEST);
      if (fault === 'malus-no-present') Reflect.deleteProperty(save.map.questReceipts, ACT1_QUEST_RECEIPTS.presentItem);
      if (fault === 'countess-false-objective') Reflect.set(save.map.questProgress[COUNTESS.quest]?.objectives ?? {}, COUNTESS.objective, false);
      if (fault === 'countess-no-row') Reflect.deleteProperty(save.map.questProgress, COUNTESS.quest);
      if (fault === 'countess-in-progress') Reflect.set(save.map.questProgress[COUNTESS.quest] ?? {}, 'status', 'inProgress');
      const before = structuredClone(save);
      expect(() => validation.validateSave(withV24Defaults(save))).toThrow('Invalid');
      expect(() => literal23(save)).toThrow('Invalid'); expect(save).toEqual(before);
    });
});

describe('literal23 catalog independence with current24 remaining live', () => {
  it.each(['malus', 'book'])('retains the original %s quest after live objective drift', family => {
    const id = family === 'malus' ? MALUS_QUEST : 'quests/act2-radaments-lair';
    const save = family === 'book' ? sample() : act1History();
    const input = family === 'book' ? { ...save, map: { ...save.map, questProgress: { [id]: completed(id) } },
      inventory: { ...save.inventory, questItems: { [`${id}#reward:questItem`]: { itemId: 'items/book_of_skill', state: 'owned' as const } } } } : save;
    expect(validation.validateSave(withV24Defaults(input))).toEqual(toJsonSafe(withV24Defaults(input)));
    vi.spyOn(questLoader, 'loadQuests').mockReturnValue(quests.map(quest => quest.id === id
      ? { ...quest, objectives: [...quest.objectives, { id: 'future-objective', type: 'talk', description: 'Future' }] } : quest));
    expect(() => validation.validateSave(withV24Defaults(input))).toThrow('Invalid');
    expect(literal23(input)).toEqual(toJsonSafe(input));
  });
  it.each([MALUS_ITEM, CAIN_SCROLL_ITEM])('retains original %s after the live item catalog changes', id => {
    const save = act1History();
    vi.spyOn(itemLoader, 'loadQuestItems').mockReturnValue(items.filter(item => item.id !== id));
    expect(() => validation.validateSave(withV24Defaults(save))).toThrow('Invalid');
    expect(literal23(save)).toEqual(toJsonSafe(save));
  });
  it('keeps both original claimed imbue mappings after live reward changes', () => {
    const save = act1History();
    vi.spyOn(questLoader, 'loadQuests').mockReturnValue(quests.map(quest => quest.id === MALUS_QUEST
      ? { ...quest, rewards: { ...quest.rewards, service: 'future-service' } } : quest));
    expect(() => validation.validateSave(withV24Defaults(save))).toThrow('Invalid');
    expect(literal23(save)).toEqual(toJsonSafe(save));
  });
  it('keeps its original area domain after live areas move', () => {
    const save = replayHistory();
    subAreas.splice(0, subAreas.length);
    expect(() => validation.validateSave(withV24Defaults(save))).toThrow();
    expect(literal23(save)).toEqual(toJsonSafe(save));
  });
  it('keeps its original achievement title after live title changes', () => {
    const save = replayHistory();
    Reflect.set(endgameDefinition.achievement.reward, 'titleId', 'titles/future-achievement');
    // Current24 captures this title at module load, so mutation alone does not
    // change its reader. This preserves that real baseline, without inventing RED.
    expect(validation.validateSave(withV24Defaults(save))).toEqual(toJsonSafe(withV24Defaults(save)));
    expect(literal23(save)).toEqual(toJsonSafe(save));
  });
  it('keeps its original Act V source after live proof changes', () => {
    const save = replayHistory();
    const encounter = act5Runtime.encounters.at(-1);
    if (!encounter) throw new Error('Missing fixture encounter');
    act5Runtime.encounters[act5Runtime.encounters.length - 1] = { ...encounter,
      proof: 'quests/act5-eve-of-destruction#action:future-victory' };
    expect(() => validation.validateSave(withV24Defaults(save))).toThrow('Invalid');
    expect(literal23(save)).toEqual(toJsonSafe(save));
  });
  it('refuses a future-only area that current24 accepts after authoring changes', () => {
    const save = replayHistory(), area = originalAreas[0];
    if (!area) throw new Error('Missing fixture area');
    subAreas.push({ ...area, id: 'areas/future-only' });
    const input = { ...save, map: { ...save.map, nightmareClearedSubAreas: ['areas/future-only'] } };
    expect(validation.validateSave(withV24Defaults(input))).toEqual(toJsonSafe(withV24Defaults(input)));
    expect(() => literal23(input)).toThrow('Invalid');
  });
  it('refuses a future-only physical item admitted by the current catalog', () => {
    const save = sample(), id = 'quests/act2-radaments-lair';
    const future: itemLoader.QuestItemDef = { id: 'quest/future-tool', kind: 'tool',
      sourceQuestId: id, sourceObjectiveId: 'obj-kill-radament', nameKey: 'future', descKey: 'future' };
    vi.spyOn(itemLoader, 'loadQuestItems').mockReturnValue([...items, future]);
    const input = { ...save, map: { ...save.map, questProgress: { [id]: completed(id) } },
      inventory: { ...save.inventory, questItems: { [`${id}#objective:obj-kill-radament`]:
        { itemId: future.id, state: 'owned' as const } } } };
    expect(validation.validateSave(withV24Defaults(input))).toEqual(toJsonSafe(withV24Defaults(input)));
    expect(() => literal23(input)).toThrow('Invalid');
  });
  it('does not consult the live action catalog for historical source authority', () => {
    const save = act1History();
    vi.spyOn(actionLoader, 'loadQuestActions').mockImplementation(() => { throw new Error('Future action catalog'); });
    expect(() => validation.validateSave(withV24Defaults(save))).toThrow('Future action catalog');
    expect(literal23(save)).toEqual(toJsonSafe(save));
    expect(actions).toHaveLength(2);
  });
});

describe('narrow raw24 reservation before predecessor migration or normalization', () => {
  const versions = Array.from({ length: 23 }, (_, index) => index + 1);
  it.each(versions)('accepts the unmodified valid v%s predecessor', version => {
      const input = predecessor(version), before = structuredClone(input);
    expect(validation.decodeSave(input).version).toBe(24); expect(input).toEqual(before);
  });
  it.each(versions.flatMap(version => ['clears', 'selection', 'ordinal'].map(field => ({ version, field }))))(
    'rejects reserved $field in raw v$version before it can be stripped', ({ version, field }) => {
      const input = predecessor(version), map = predecessorMap(input);
      if (field === 'clears') map.hellClearedSubAreas = [];
      if (field === 'selection') map.selectedDifficulty = 'hell';
      if (field === 'ordinal') map.challengeOrdinals = { normal: 0, nightmare: 0, hell: 0 };
      const before = structuredClone(input);
      expect(() => validation.decodeSave(input)).toThrow('Invalid save');
      expect(() => runMigrations(input)).toThrow('Invalid save'); expect(input).toEqual(before);
    });
  it.each(['undefined', 'inherited', 'nonenumerable', 'accessor', 'map-ordinal'])(
    'refuses a raw %s reserved namespace without reading a getter', shape => {
      const input = predecessor(23), map = predecessorMap(input); let reads = 0;
      if (shape === 'undefined') map.hellClearedSubAreas = undefined;
      if (shape === 'inherited') Object.setPrototypeOf(map, { hellClearedSubAreas: [] });
      if (shape === 'nonenumerable') Object.defineProperty(map, 'hellClearedSubAreas', { value: [] });
      if (shape === 'accessor') Object.defineProperty(map, 'hellClearedSubAreas', { enumerable: true, get: () => { reads++; return []; } });
      if (shape === 'map-ordinal') map.challengeOrdinals = new Map([['normal', 0], ['nightmare', 0], ['hell', 0]]);
      expect(() => literal23(input)).toThrow('Invalid save');
      expect(() => validation.decodeSave(input)).toThrow('Invalid save');
      expect(() => runMigrations(input)).toThrow('Invalid save'); expect(reads).toBe(0);
    });
  it.each([1, 16].flatMap(version => ['own', 'hidden', 'inherited'].map(shape => ({ version, shape }))))(
    'rejects a Map-attached $shape Hell ordinal in raw v$version before replacement', ({ version, shape }) => {
      const input = predecessor(version), ordinals = new Map([['normal', 0], ['nightmare', 0]]);
      if (shape === 'own') Reflect.set(ordinals, 'hell', undefined);
      if (shape === 'hidden') Object.defineProperty(ordinals, 'hell', { value: 0 });
      if (shape === 'inherited') Object.setPrototypeOf(ordinals, Object.assign(Object.create(Map.prototype) as object, { hell: 0 }));
      predecessorMap(input).challengeOrdinals = ordinals;
      expect(() => validation.decodeSave(input)).toThrow('Invalid save');
      expect(() => runMigrations(input)).toThrow('Invalid save');
    });
  it('preserves unrelated v23 mapProgress without reading its accessor when targeting23', () => {
    const input = predecessor(23); let reads = 0;
    Object.defineProperty(input, 'mapProgress', { enumerable: true, get: () => {
      reads++; return { hellClearedSubAreas: [], selectedDifficulty: 'hell', challengeOrdinals: { hell: 0 } };
    } });
    expect(runMigrations(input, 23)).toBe(input); expect(reads).toBe(0);
  });
  it('does not tighten unrelated unknown historical fields', () => {
    for (const version of [6, 16, 22, 23]) {
      const input = predecessor(version); predecessorMap(input).unrelatedHistoricalNote = 'preserve';
      expect(validation.decodeSave(input).version).toBe(24);
    }
    const current = sample(), input = { ...current, map: { ...current.map, unrelatedHistoricalNote: 'preserve' } };
    expect(literal23(input)).toEqual(toJsonSafe(input));
  });
});


describe('literal23 nested source authority', () => {
  it('preserves all five historical service chains with read Prison scroll and salvaged targets', () => {
    const save = serviceHistory(), prison = 'quests/act5-prison-of-ice';
    const input = { ...save, map: { ...save.map, questReceipts: { ...save.map.questReceipts,
      [`${prison}#action:read-resistance-scroll`]: true as const } },
    inventory: { ...save.inventory, questItems: { ...save.inventory.questItems,
      [`${prison}#reward:questItem`]: { itemId: 'items/scroll_of_resist', state: 'consumed' as const } },
    questServices: Object.fromEntries(serviceSources.map(([id, serviceId], index) => [`${id}#reward:service`,
      index % 2 ? { serviceId, state: 'consumed' as const, targetItemId: `salvaged-${String(index)}` }
        : { serviceId, state: 'available' as const }])) } };
    const before = structuredClone(input);
    expect(validation.validateSave(withV24Defaults(input))).toEqual(toJsonSafe(withV24Defaults(input)));
    expect(literal23(input)).toEqual(toJsonSafe(input)); expect(input).toEqual(before);
    vi.spyOn(questLoader, 'loadQuests').mockReturnValue(quests.map(quest => ({ ...quest,
      rewards: {}, objectives: [...quest.objectives, { id: 'future', type: 'talk', description: 'Future' }] })));
    expect(() => validation.validateSave(withV24Defaults(input))).toThrow();
    expect(literal23(input)).toEqual(toJsonSafe(input));
  });
  it.each(['council', 'guardian-input', 'forge-input', 'potion', 'scroll', 'service-claim'])(
    'retains reciprocal nested refusal for %s', fault => {
      const save = serviceHistory(), khalim = 'quests/act3-khalims-will', prison = 'quests/act5-prison-of-ice';
      if (fault === 'council') Reflect.deleteProperty(save.map.questProgress[khalim]?.objectives ?? {}, 'obj-flail');
      if (fault === 'guardian-input') Reflect.set(save.inventory.questItems, `${khalim}#objective:obj-transmute`,
        { itemId: 'items/khalims_will', state: 'owned' });
      if (fault === 'forge-input') Reflect.deleteProperty(save.inventory.questItems, 'quests/act3-guardian#reward:questItem');
      if (fault === 'potion') Reflect.set(save.inventory.questItems, `${prison}#action:receive-potion`,
        { itemId: 'quest/malahs_potion', state: 'owned' });
      if (fault === 'scroll') Reflect.set(save.inventory.questItems, `${prison}#reward:questItem`,
        { itemId: 'items/scroll_of_resist', state: 'consumed' });
      if (fault === 'service-claim') {
        Reflect.set(save.inventory.questServices, `${prison}#reward:service`, { serviceId: 'personalize_item', state: 'available' });
        Reflect.set(save.map.questProgress[prison] ?? {}, 'rewardClaimed', false);
      }
      const before = structuredClone(save);
      expect(() => validation.validateSave(withV24Defaults(save))).toThrow('Invalid');
      expect(() => literal23(save)).toThrow('Invalid'); expect(save).toEqual(before);
    });
});
