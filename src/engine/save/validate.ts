import { readRespecsRemaining } from '../progression/respec';
import { PLAYER_AURA_IDS } from '../types/auras';
import { rejectPreV21Respec } from './respec-state';
import { readEndgameSaveField, rejectPreV20State } from './endgame-state';
import frozenItemSchema from './frozen-v16-item.schema.json';
import { readMaterialLedger } from './material-state';
import { rejectPreV19State } from './pre-v19-state';
import { rejectSocketSaveAccessors, validateNativeSocketState } from './native-socket-state';
import { ACT5_RECEIPTS, validateAct5QuestGraph } from './act5-state';
import { ACT5_ENCOUNTERS } from '../map/act5-admission';
import { validateAct5CampaignRewards } from './act5-campaign';
import { validateCurrentCampaignRewards } from './current-campaign';
import { validateNativeItemState, rejectHistoricalServiceFields, validateLegacyQuarantine } from './service-item-state';
import frozenV16 from './frozen-v16-quests.json';
/** Structural validation at the untrusted save boundary; never mutates input. */
import Ajv, { type AnySchema } from 'ajv';
import { restoreEquipment, restoreItem, restoreUnit } from './restore';
import { repairEquipmentRateCache, repairQuestLifeCache, repairQuestResistanceCache, repairRunewordStatCache } from './equipment-rate-cache';
import { COUNCIL_RECEIPT_SOURCE, isCouncilReceiptProgress } from '../map/council-admission';
import type { QuestActionReceipts } from '../types/save';
import frozenV15 from './frozen-v15-quests.json';
import { ACT4_ENCOUNTERS } from '../map/act4-admission';
import { loadQuestActions, questActionInputs, type QuestItemActionDef } from '../../data/loaders/quest-actions';
import { repairMercenaryGrowth } from '../progression/merc-growth';
import { LEVEL_CAP } from '../progression/xp';
import { type SaveCurrent, type SaveV17, type SaveV18, type SaveV19, type SaveV20, type SaveV21, type SaveV7, type SaveV8, type SaveV9, type SaveV10, type SaveV11, type QuestItemEntry, type QuestItemLedger } from '../types/save';
import { runMigrations, type VersionedSave } from './migrate';
import { loadQuestItems, type QuestItemDef, questItemSource } from '../../data/loaders/quest-items';
import { loadQuests, type QuestDef } from '../../data/loaders/quests';
import { questObjectivePrerequisitesMet } from '../map/questStages';

const number = { type: 'number' };
const text = { type: 'string' };
const bool = { type: 'boolean' };
const strings = { type: 'array', items: text };
const positiveInteger = { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER };
const numericMap = {
  anyOf: [
    dictSchema(),
    { type: 'array', items: { type: 'array', items: [text, number], minItems: 2, maxItems: 2 } }
  ]
};
function dictSchema() {
  return { type: 'object', additionalProperties: number };
}
const nullableText = { type: ['string', 'null'] };
const dict = (values: AnySchema): AnySchema => ({ type: 'object', additionalProperties: values });
const array = (items: AnySchema): AnySchema => ({ type: 'array', items });
const object = (
  properties: Record<string, AnySchema>,
  optional: Record<string, AnySchema> = {}
): AnySchema => ({
  type: 'object',
  required: Object.keys(properties),
  properties: { ...properties, ...optional }
});
const numbers = (keys: string): Record<string, AnySchema> =>
  Object.fromEntries(keys.split(' ').map((key) => [key, number]));
const damage = object({ min: number, max: number, breakdown: dict(number) });
// Literal pre-v19 shape: current socket schemas must not reinterpret history.
const item: AnySchema = frozenItemSchema;
const status = object(
  {
    id: text,
    name: text,
    type: { enum: ['buff', 'debuff', 'dot'] },
    ...numbers('duration maxStacks stacks remaining')
  },
  {
    damagePerTurn: damage,
    statMods: dict(number),
    resistMods: dict(number),
    tags: strings
  }
);
const skill = object(
  {
    id: text,
    name: text,
    description: text,
    trigger: text,
    target: text,
    cooldown: number,
    cost: dict(number),
    minLevel: number,
    level: number,
    maxLevel: number
  },
  {
    damage,
    damageType: text,
    appliesStatus: strings,
    statusEffect: dict(number),
    appliesTags: strings,
    heal: object({ min: number, max: number, target: text }),
    summonId: text,
    synergies: numericMap,
    icon: text,
    aoeShape: text,
    requires: object({}, { weaponType: strings, handedness: strings }),
    scaling: object(
      {},
      {
        damagePerLevel: number,
        cooldownPerLevel: number,
        costPerLevel: number,
        summonMaxCount: object({
          kind: { enum: ['first-three-then-every-three', 'raise-skeleton-1-6-12-cap-3'] }
        }),
        summonStatsPerLevel: dict(number),
        passiveStatsPerLevel: dict(number)
      }
    )
  }
);
const magicResist = { type: 'number', minimum: 0 };
const derivedStatProperties = {
  ...numbers(
    'life lifeMax mana manaMax attack defense attackSpeed critChance critDamage physDodge magicDodge magicFind goldFind'
  ),
  resistances: object(numbers('fire cold lightning poison arcane physical'))
};
const unitProperties = {
  id: text,
  name: text,
  type: text,
  team: text,
  level: positiveInteger,
  coreStats: object(numbers('strength dexterity vitality energy')),
  derivedStats: object({ ...derivedStatProperties, magicResist }),
  statusEffects: array(status),
  cooldowns: array(object({ skillId: text, remaining: number, total: number })),
  skills: array(skill),
  comboOrder: strings,
  alive: bool,
  turnOrder: number,
  equipment: array(item)
};
const position = object({
  row: { type: 'integer', minimum: 0, maximum: 2 },
  col: { type: 'integer', minimum: 0, maximum: 2 }
});
const questProgressSchema = dict(object({
  id: text,
  status: { enum: ['locked', 'available', 'inProgress', 'completed'] },
  objectives: dict(bool)
}, { rewardClaimed: bool }));
const questItemLedgerSchema = dict({
  type: 'object', required: ['itemId', 'state'], additionalProperties: false,
  properties: { itemId: text, state: { enum: ['owned', 'consumed'] } }
});
const saveSchema = (
  version: AnySchema,
  actorProperties: Record<string, AnySchema>,
  playerOptional: Record<string, AnySchema> = {},
  inventoryProperties: Record<string, AnySchema> = {},
  mapProperties: Record<string, AnySchema> = {},
  itemSchema: AnySchema = item
): AnySchema => object({
  version,
  timestamp: number,
  player: object(
    {
      ...actorProperties,
      equipment: array(itemSchema),
      type: { const: 'player' },
      team: { const: 'player' },
      class: text,
      level: { type: 'integer', minimum: 1, maximum: LEVEL_CAP },
      ...numbers('experience experienceToNextLevel statPoints skillPoints')
    },
    { skillLevels: dict(number), ...playerOptional }
  ),
  inventory: object({
    backpack: array(itemSchema),
    stash: array(itemSchema),
    equipped: dict({ anyOf: [itemSchema, { type: 'null' }] }),
    currencies: dict(number),
    ...inventoryProperties
  }),
  mercs: object({
    ownedMercs: array(
      object(
        { ...actorProperties, equipment: array(itemSchema), type: { const: 'mercenary' }, archetype: text, rarity: text },
        { classId: text, signatureSkillId: text }
      )
    ),
    fieldedMercId: nullableText,
    mercEquipment: dict(dict({ anyOf: [itemSchema, { type: 'null' }] })),
    mercProgress: dict(
      object(
        { experience: number, experienceToNextLevel: { type: 'number', exclusiveMinimum: 0 } },
        { level: positiveInteger }
      )
    )
  }),
  map: object({
    currentAct: { type: 'integer', minimum: 1, maximum: 5 },
    currentSubAreaId: nullableText,
    discoveredAreas: strings,
    clearedSubAreas: strings,
    questProgress: questProgressSchema,
    ...mapProperties
  }),
  meta: object({
    settings: object({
      locale: { enum: ['zh-CN', 'en'] },
      stealthMode: bool,
      soundEnabled: bool,
      musicEnabled: bool,
      combatSpeed: number,
      autoCombat: bool
    }),
    idleState: object(
      numbers('lastOnline offlineTime multiplierSecondsRemaining activeMultiplier'),
      { idleTarget: text }
    ),
    gachaState: object({ currency: number, ownedMercIds: strings, pityCounter: number })
  }),
  formation: object({
    playerPosition: position,
    mercPosition: position,
    summonPositions: array(position)
  })
});
const ajv = new Ajv({ strictNumbers: true });
// The shared structural shell injects the item contract at every ownership/mirror site.
// Literal predecessor schemas never acquire live socket fields through closure capture.
const canonicalItem: AnySchema = { ...frozenItemSchema,
  properties: { ...frozenItemSchema.properties,
    socketContents: array(object({ kind: { enum: ['rune', 'gem'] }, id: text })) },
  not: { required: ['runes'] } };
const nativeSaveSchema = (version: 17 | 18 | 19 | 20 | 21 | 22) => saveSchema({ const: version }, unitProperties, {
  selectedAuraId: { enum: version >= 22 ? PLAYER_AURA_IDS : ['paladin.might', 'paladin.meditation'] }
}, {
  questItems: questItemLedgerSchema, questServices: { type: 'object' }, legacyGearQuarantine: array({ type: 'object' }),
  ...(version >= 18 ? { materials: { type: 'object' } } : {}),
  ...(version >= 19 ? { materialActionOrdinal: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER },
    socketQuarantine: array({ type: 'object' }) } : {})
}, {
  questTitles: { type: 'object' }, questDifficulties: { type: 'object' },
  selectedTitle: nullableText, selectedDifficulty: { enum: ['normal', 'nightmare'] },
  nightmareClearedSubAreas: strings, challengeOrdinals: { type: 'object' },
  // The exact Council and Guardian Orb actions form the current closed domain.
  questReceipts: { type: 'object', additionalProperties: false,
    properties: { [COUNCIL_RECEIPT_SOURCE]: { const: true },
      'quests/act3-guardian#action:break-compelling-orb': { const: true },
      ...Object.fromEntries([...ACT4_ENCOUNTERS.map(row => row.proof), ...ACT5_RECEIPTS].map(source => [source, { const: true }])),
      'quests/act4-hellforge#action:shatter-soulstone': { const: true } } }
}, version >= 19 ? canonicalItem : item);
const validateV17 = ajv.compile<SaveV17>(nativeSaveSchema(17));
const validateV18 = ajv.compile<SaveV18>(nativeSaveSchema(18));
const validateV19 = ajv.compile<SaveV19>(nativeSaveSchema(19));
const validateV20 = ajv.compile<SaveV20>(nativeSaveSchema(20));
const validateV21 = ajv.compile<SaveV21>(nativeSaveSchema(21));
const validateV22 = ajv.compile<SaveCurrent>(nativeSaveSchema(22));
interface LedgerContext {
  questItems: QuestItemLedger;
  questProgress: SaveCurrent['map']['questProgress'];
}
const validateLedgerContext = ajv.compile<LedgerContext>(
  object({ questItems: questItemLedgerSchema, questProgress: questProgressSchema }));
const validateV11 = ajv.compile<SaveV11>(saveSchema({ const: 11 }, unitProperties, {
  selectedAuraId: { enum: ['paladin.might', 'paladin.meditation'] }
}));
const validateV10 = ajv.compile<SaveV10>(saveSchema({ const: 10 }, unitProperties, {
  selectedAuraId: { const: 'paladin.might' }
}));
const validateV9 = ajv.compile<SaveV9>(saveSchema({ const: 9 }, unitProperties));
const validateHistorical = ajv.compile<SaveV7 | SaveV8>(saveSchema({ enum: [7, 8] }, {
  ...unitProperties,
  derivedStats: object(derivedStatProperties, { magicResist })
}));

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Ajv treats optional undefined as absent; an explicitly present MR is not absent. */
function rejectUndefinedMagicResist(value: unknown): void {
  if (!record(value)) return;
  const actors = [value.player];
  if (record(value.mercs) && Array.isArray(value.mercs.ownedMercs)) {
    const ownedMercs: readonly unknown[] = value.mercs.ownedMercs;
    actors.push(...ownedMercs);
  }
  for (const actor of actors) {
    if (record(actor) && record(actor.derivedStats) &&
      Object.hasOwn(actor.derivedStats, 'magicResist') && actor.derivedStats.magicResist === undefined) {
      throw new Error('Invalid save: present magicResist must be a finite nonnegative number');
    }
  }
}

/** Frozen v7/v8 requirements, checked before compatibility can replace fields. */
function validateHistoricalSave(value: unknown): void {
  const normalized = normalizeMaps(value);
  rejectUndefinedMagicResist(normalized);
  if (!validateHistorical(normalized)) {
    throw new Error(`Invalid save: ${ajv.errorsText(validateHistorical.errors)}`);
  }
}

/** Frozen v9 actor requirements precede the v10 selection migration. */
function validateV9Save(value: unknown): void {
  const normalized = normalizeMaps(value);
  rejectUndefinedMagicResist(normalized);
  if (!validateV9(normalized)) {
    throw new Error(`Invalid save: ${ajv.errorsText(validateV9.errors)}`);
  }
}

/** Ajv treats optional undefined as absent; native IndexedDB preserves own undefined. */
function rejectUndefinedSelection(normalized: unknown): void {
  if (record(normalized) && record(normalized.player) &&
    Object.hasOwn(normalized.player, 'selectedAuraId') && normalized.player.selectedAuraId === undefined) {
    throw new Error('Invalid save: present selectedAuraId must be a canonical aura');
  }
}

/** Frozen v10 requirements precede widening selection in v11. */
function validateV10Save(value: unknown): void {
  const normalized = normalizeMaps(value);
  rejectUndefinedMagicResist(normalized);
  rejectUndefinedSelection(normalized);
  if (!validateV10(normalized)) {
    throw new Error(`Invalid save: ${ajv.errorsText(validateV10.errors)}`);
  }
}

/** Freeze v11 before the ledger migration can add defaults or replace reserved extras. */
function validateV11Save(value: unknown): void {
  const normalized = normalizeMaps(value);
  rejectUndefinedMagicResist(normalized);
  rejectUndefinedSelection(normalized);
  if (!validateV11(normalized)) throw new Error(`Invalid save: ${ajv.errorsText(validateV11.errors)}`);
  if (Object.hasOwn((normalized as SaveV11).inventory, 'questItems')) {
    throw new Error('Invalid save: historical inventory cannot contain questItems');
  }
}

/** Validate raw JSON records before generic normalization can erase invalid prototypes. */
function ledgerContext(questItems: unknown, questProgress: unknown): LedgerContext {
  // Generic save normalization must not erase a Date, Map or inherited receipt.
  const plainRecord = (value: unknown): value is Record<string, unknown> => {
    if (!record(value)) return false;
    const prototype: unknown = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  };
  if (!plainRecord(questItems) || !plainRecord(questProgress) ||
    !Object.values(questItems).every(plainRecord) ||
    !Object.values(questProgress).every(progress => plainRecord(progress) && plainRecord(progress.objectives))) {
    throw new Error('Invalid save: quest ledger and progress must be JSON records');
  }
  const context = { questItems, questProgress };
  if (!validateLedgerContext(context)) {
    throw new Error(`Invalid save: ${ajv.errorsText(validateLedgerContext.errors)}`);
  }
  return context as LedgerContext;
}

/** Receipt sources require own true predecessors; completed legacy rows stay internally complete. */
function validObjectiveProgress(context: LedgerContext, questId: string, objectiveIds: readonly string[], index: number): boolean {
  if (index < 0 || !Object.hasOwn(context.questProgress, questId)) return false;
  const progress = context.questProgress[questId];
  return progress?.id === questId && (progress.status === 'inProgress' || progress.status === 'completed') &&
    (progress.rewardClaimed !== true || progress.status === 'completed') &&
    objectiveIds.slice(0, index + 1).every(id => Object.hasOwn(progress.objectives, id) && progress.objectives[id] === true) &&
    (progress.status !== 'completed' || objectiveIds.every(id =>
      Object.hasOwn(progress.objectives, id) && progress.objectives[id] === true));
}

/** Live stages govern prerequisites; a receipt additionally requires its own true source. */
function validLiveObjectiveProgress(context: LedgerContext, quest: QuestDef, objectiveId: string): boolean {
  if (!Object.hasOwn(context.questProgress, quest.id)) return false;
  const progress = context.questProgress[quest.id];
  const ownTrue = (id: string) => progress !== undefined &&
    Object.hasOwn(progress.objectives, id) && progress.objectives[id] === true;
  return progress?.id === quest.id && (progress.status === 'inProgress' || progress.status === 'completed') &&
    (progress.rewardClaimed !== true || progress.status === 'completed') && ownTrue(objectiveId) &&
    questObjectivePrerequisitesMet(quest, progress.objectives, objectiveId) &&
    (progress.status !== 'completed' || quest.objectives.every(objective => ownTrue(objective.id)));
}

/** One nonrecursive prospective graph check shared by saves and every item/action transaction. */
interface QuestStateDomain {
  readonly actions: readonly QuestItemActionDef[];
  readonly items: readonly QuestItemDef[];
  readonly quests: readonly QuestDef[];
  readonly victories?: readonly { readonly questId: string; readonly objectiveId: string; readonly proof: string }[];
}
function validateLiveQuestState(questItems: unknown, questProgress: unknown, receipts: unknown, domain?: QuestStateDomain):
  LedgerContext & { questReceipts: QuestActionReceipts } {
  const validated = ledgerContext(questItems, questProgress);
  const actions = domain?.actions ?? loadQuestActions();
  const victories = domain?.victories ?? (domain ? [] : [...ACT4_ENCOUNTERS, ...ACT5_ENCOUNTERS]);
  if (!record(receipts) || (Object.getPrototypeOf(receipts) !== Object.prototype &&
    Object.getPrototypeOf(receipts) !== null) || Reflect.ownKeys(receipts).some(key =>
      typeof key !== 'string' ||
      (key !== COUNCIL_RECEIPT_SOURCE && !victories.some(row => row.proof === key) && !(domain === undefined && ACT5_RECEIPTS.includes(key)) && !actions.some(action => action.receiptSource === key)) || receipts[key] !== true)) {
    throw new Error('Invalid save: questReceipts requires a closed JSON action receipt map');
  }
  const questReceipts = receipts as QuestActionReceipts;
  if (Object.hasOwn(questReceipts, COUNCIL_RECEIPT_SOURCE) && !isCouncilReceiptProgress(validated.questProgress)) {
    throw new Error('Invalid save: Council proof requires canonical tracked Khalim progress');
  }
  const entries = Object.entries(validated.questItems);
  const definitions = domain?.items ?? loadQuestItems();
  const quests = domain?.quests ?? loadQuests();
  if (domain === undefined) validateAct5QuestGraph(validated.questItems, validated.questProgress, questReceipts);
  for (const contract of victories) {
    if (!Object.hasOwn(questReceipts, contract.proof)) continue;
    const quest = quests.find(row => row.id === contract.questId);
    if (!quest || !validLiveObjectiveProgress(validated, quest, contract.objectiveId)) {
      throw new Error('Invalid save: Act IV victory proof requires its canonical objective source');
    }
  }
  const itemEntry = (itemId: string): QuestItemEntry | undefined => {
    const definition = definitions.find(item => item.id === itemId);
    if (!definition) return undefined;
    const source = questItemSource(definition);
    return Object.hasOwn(validated.questItems, source) ? validated.questItems[source] : undefined;
  };
  for (const [source, entry] of entries) {
    const definition = definitions.find(item => questItemSource(item) === source);
    if (!definition || definition.id !== entry.itemId ||
      !Object.hasOwn(validated.questProgress, definition.sourceQuestId)) {
      throw new Error('Invalid save: unknown quest item source or item');
    }
    const progress = validated.questProgress[definition.sourceQuestId];
    const quest = quests.find(row => row.id === definition.sourceQuestId);
    if (definition.kind === 'action') continue; // Validated as one reciprocal Act V action/potion graph above.
    if (definition.kind !== undefined && definition.kind !== 'retained') {
      if (!quest || !validLiveObjectiveProgress(validated, quest, definition.sourceObjectiveId)) {
        throw new Error('Invalid save: quest item requires its completed objective source');
      }
      if (definition.kind === 'tool' && entry.state !== 'owned') {
        throw new Error('Invalid save: retained tools cannot be consumed');
      }
      if (definition.kind === 'component' &&
        ((entry.state === 'consumed') !== (itemEntry(definition.consumedBy) !== undefined))) {
        throw new Error('Invalid save: component consumption requires its exact assembled output');
      }
      if ((definition.kind === 'component' || definition.kind === 'encounter') && definition.requiredActionSource !== undefined &&
        (!Object.hasOwn(questReceipts, definition.requiredActionSource) || questReceipts[definition.requiredActionSource] !== true)) {
        throw new Error('Invalid save: component requires its qualified action proof');
      }
      if (definition.kind === 'delivery' && entry.state === 'consumed' &&
        !validLiveObjectiveProgress(validated, quest, definition.consumeObjectiveId)) {
        throw new Error('Invalid save: delivered item requires its exact hand-in objective');
      }
      if (definition.kind === 'delivery') {
        if (definition.outputItemId !== undefined &&
          ((entry.state === 'consumed') !== (itemEntry(definition.outputItemId) !== undefined))) {
          throw new Error('Invalid save: exchange input requires its exact output receipt');
        }
        const issuingObjective = quest.objectives.find(objective => objective.id === definition.sourceObjectiveId);
        if (issuingObjective?.type === 'give') {
          const input = definitions.find(item => item.kind === 'delivery' && item.outputItemId === definition.id);
          if (!input || itemEntry(input.id)?.state !== 'consumed') {
            throw new Error('Invalid save: exchange output requires its consumed input');
          }
        }
      }
      if (definition.kind === 'assembled') {
        if (itemEntry(definition.requiredTool)?.state !== 'owned' ||
          !definition.ingredients.every(id => itemEntry(id)?.state === 'consumed')) {
          throw new Error('Invalid save: assembled output requires consumed ingredients and owned tool');
        }
        if (definition.consumeActionId !== undefined) {
          const action = actions.find(row => row.id === definition.consumeActionId);
          if (!action || ((entry.state === 'consumed') !== Object.hasOwn(questReceipts, action.receiptSource))) {
            throw new Error('Invalid save: assembled consumption requires its exact action receipt');
          }
        } else if (entry.state === 'consumed' && definition.consumeObjectiveId !== undefined) {
          const consumer = quests.find(row => row.id === definition.consumeQuestId);
          if (!consumer || !validLiveObjectiveProgress(validated, consumer, definition.consumeObjectiveId)) {
            throw new Error('Invalid save: consumed output requires its exact interaction source');
          }
        }
      }
    } else if (!quest || progress?.id !== definition.sourceQuestId || progress.status !== 'completed' ||
      progress.rewardClaimed !== true || !quest.objectives.every(objective =>
        Object.hasOwn(progress.objectives, objective.id) && progress.objectives[objective.id] === true)) {
      throw new Error('Invalid save: quest item source must be completed and claimed');
    } else if (!quest.objectives.filter(objective => objective.type === 'give').every(objective => {
      const input = definitions.find(item => item.kind === 'delivery' &&
        item.sourceQuestId === quest.id && item.consumeObjectiveId === objective.id);
      return input !== undefined && itemEntry(input.id)?.state === 'consumed';
    })) {
      throw new Error('Invalid save: reward item requires its real consumed hand-in graph');
    }
    if (definition.kind === 'retained' && !Object.hasOwn(questReceipts, definition.requiredActionSource)) {
      throw new Error('Invalid save: retained reward requires its actual action graph');
    }
    if (definition.kind === 'retained' || definition.kind === 'encounter') {
      const consumer = actions.find(action => action.id === definition.consumeActionId);
      if ((entry.state === 'consumed') !== (consumer !== undefined && Object.hasOwn(questReceipts, consumer.receiptSource))) {
        throw new Error('Invalid save: retained reward/encounter consumption requires its exact action graph');
      }
    }
  }
  for (const action of actions) {
    if (!Object.hasOwn(questReceipts, action.receiptSource)) continue;
    const owner = validated.questProgress[action.questId];
    const quest = quests.find(row => row.id === action.questId);
    if (!Object.hasOwn(validated.questProgress, action.questId) || !quest || owner?.id !== action.questId ||
      !quest.objectives.every(objective => Object.hasOwn(owner.objectives, objective.id) &&
        typeof owner.objectives[objective.id] === 'boolean') ||
      !(owner.status === 'inProgress' && owner.rewardClaimed !== true || owner.status === 'completed' &&
        quest.objectives.every(objective => owner.objectives[objective.id] === true)) ||
      (action.completeObjectiveId !== undefined && !validLiveObjectiveProgress(validated, quest, action.completeObjectiveId)) ||
      !questActionInputs(action).every(input => Object.hasOwn(validated.questItems, input.inputSource) &&
        validated.questItems[input.inputSource]?.itemId === input.itemId &&
        validated.questItems[input.inputSource]?.state === 'consumed')) {
      throw new Error('Invalid save: action proof requires its tracked owner and exact consumed assembled input');
    }
  }
  return { ...validated, questReceipts };
}

/** Validate actual item entitlements and their action graph; omitted context supports older item families only. */
export function validateQuestItemLedger(questItems: unknown, questProgress: unknown,
  questReceipts: unknown = {}): QuestItemLedger {
  return validateLiveQuestState(questItems, questProgress, questReceipts).questItems;
}

// v12 admitted only the Radament Book. Keep this closed historical domain
// independent of future live definitions, objectives and reward additions.
const validateV12 = ajv.compile(saveSchema({ const: 12 }, unitProperties, {
  selectedAuraId: { enum: ['paladin.might', 'paladin.meditation'] }
}, { questItems: questItemLedgerSchema }));

function validFrozenBookReceipt(context: LedgerContext, source: string, entry: QuestItemEntry): boolean {
  const id = 'quests/act2-radaments-lair';
  const progress = context.questProgress[id];
  return source === `${id}#reward:questItem` && entry.itemId === 'items/book_of_skill' &&
    Object.hasOwn(context.questProgress, id) && progress?.id === id &&
    progress.status === 'completed' && progress.rewardClaimed === true &&
    Object.hasOwn(progress.objectives, 'obj-kill-radament') && progress.objectives['obj-kill-radament'] === true;
}

function validateV12Save(value: unknown): void {
  if (!record(value) || !record(value.inventory) || !record(value.map)) throw new Error('Invalid save: v12 structure');
  const context = ledgerContext(value.inventory.questItems, value.map.questProgress);
  for (const [source, entry] of Object.entries(context.questItems)) {
    if (!validFrozenBookReceipt(context, source, entry)) {
      throw new Error('Invalid save: unsupported v12 quest item source');
    }
  }
  const normalized = normalizeMaps(value);
  rejectUndefinedMagicResist(normalized);
  rejectUndefinedSelection(normalized);
  if (!validateV12(normalized)) throw new Error(`Invalid save: ${ajv.errorsText(validateV12.errors)}`);
}

// v13's closed domain is exactly Book plus owned Cube, independent of live H2 definitions.
const validateV13 = ajv.compile(saveSchema({ const: 13 }, unitProperties, {
  selectedAuraId: { enum: ['paladin.might', 'paladin.meditation'] }
}, { questItems: questItemLedgerSchema }));

function validateV13Save(value: unknown): void {
  if (!record(value) || !record(value.inventory) || !record(value.map)) throw new Error('Invalid save: v13 structure');
  const context = ledgerContext(value.inventory.questItems, value.map.questProgress);
  for (const [source, entry] of Object.entries(context.questItems)) {
    if (validFrozenBookReceipt(context, source, entry)) continue;
    const id = 'quests/act2-horadric-staff';
    if (source !== `${id}#objective:obj-cube` || entry.itemId !== 'quest/horadric_cube' || entry.state !== 'owned' ||
      !validObjectiveProgress(context, id, ['obj-cube', 'obj-shaft', 'obj-amulet', 'obj-transmute'], 0)) {
      throw new Error('Invalid save: unsupported v13 quest item source');
    }
  }
  const normalized = normalizeMaps(value);
  rejectUndefinedMagicResist(normalized);
  rejectUndefinedSelection(normalized);
  if (!validateV13(normalized)) throw new Error(`Invalid save: ${ajv.errorsText(validateV13.errors)}`);
}

// v14's graph is literal historical data. Never consult live stages or item definitions here.
const validateV14 = ajv.compile(saveSchema({ const: 14 }, unitProperties, {
  selectedAuraId: { enum: ['paladin.might', 'paladin.meditation'] }
}, { questItems: questItemLedgerSchema }));

function validateV14Save(value: unknown): void {
  if (!record(value) || !record(value.inventory) || !record(value.map)) throw new Error('Invalid save: v14 structure');
  const context = ledgerContext(value.inventory.questItems, value.map.questProgress);
  const staffQuest = 'quests/act2-horadric-staff';
  const source = (objectiveId: string) => `${staffQuest}#objective:${objectiveId}`;
  const receipt = (objectiveId: string) => Object.hasOwn(context.questItems, source(objectiveId))
    ? context.questItems[source(objectiveId)] : undefined;
  const objectiveIds = ['obj-cube', 'obj-shaft', 'obj-amulet', 'obj-transmute'];
  const itemIds = ['quest/horadric_cube', 'quest/staff_of_kings', 'quest/viper_amulet', 'quest/horadric_staff'];
  for (const [key, entry] of Object.entries(context.questItems)) {
    if (validFrozenBookReceipt(context, key, entry)) continue;
    const index = objectiveIds.findIndex(id => key === source(id));
    if (index < 0 || entry.itemId !== itemIds[index] ||
      !validObjectiveProgress(context, staffQuest, objectiveIds, index)) {
      throw new Error('Invalid save: unsupported v14 quest item source');
    }
    if (index === 0 && entry.state !== 'owned') throw new Error('Invalid save: v14 Cube must remain owned');
    if ((index === 1 || index === 2) &&
      ((entry.state === 'consumed') !== (receipt('obj-transmute') !== undefined))) {
      throw new Error('Invalid save: v14 consumed components require Staff output');
    }
    if (index === 3) {
      if (receipt('obj-cube')?.state !== 'owned' || receipt('obj-shaft')?.state !== 'consumed' ||
        receipt('obj-amulet')?.state !== 'consumed') {
        throw new Error('Invalid save: v14 Staff requires its owned Cube and consumed ingredients');
      }
      if (entry.state === 'consumed' && !validObjectiveProgress(context, 'quests/act2-seven-tombs',
        ['obj-open-tomb', 'obj-kill-duriel'], 0)) {
        throw new Error('Invalid save: v14 consumed Staff requires its insertion source');
      }
    }
  }
  const normalized = normalizeMaps(value);
  rejectUndefinedMagicResist(normalized);
  rejectUndefinedSelection(normalized);
  if (!validateV14(normalized)) throw new Error(`Invalid save: ${ajv.errorsText(validateV14.errors)}`);
}

/** Reserved future proofs must be rejected before normalization or a migration can erase them. */
function rejectHistoricalQuestReceipts(value: unknown): void {
  if (record(value) && typeof value.version === 'number' && value.version <= 14 &&
    record(value.map) && Object.hasOwn(value.map, 'questReceipts')) {
    throw new Error('Invalid save: historical map cannot contain questReceipts');
  }
}

// Frozen literal v15 domain: future live definitions cannot widen historical imports.
const validateV15 = ajv.compile(saveSchema({ const: 15 }, unitProperties, {
  selectedAuraId: { enum: ['paladin.might', 'paladin.meditation'] }
}, { questItems: questItemLedgerSchema }, {
  questReceipts: { type: 'object', additionalProperties: false, properties: {
    'quests/act3-khalims-will#action:council-victory': { const: true },
    'quests/act3-guardian#action:break-compelling-orb': { const: true }
  } }
}));
function validateV15Save(value: unknown): void {
  if (!record(value) || !record(value.inventory) || !record(value.map)) throw new Error('Invalid save: v15 structure');
  validateLiveQuestState(value.inventory.questItems, value.map.questProgress, value.map.questReceipts,
    frozenV15 as unknown as QuestStateDomain);
  const normalized = normalizeMaps(value);
  rejectUndefinedMagicResist(normalized); rejectUndefinedSelection(normalized);
  if (!validateV15(normalized)) throw new Error(`Invalid save: ${ajv.errorsText(validateV15.errors)}`);
}

// Frozen actual v16 source domain; new17 actions, items and reserved fields cannot enter history.
const validateV16 = ajv.compile(saveSchema({ const: 16 }, unitProperties, {
  selectedAuraId: { enum: ['paladin.might', 'paladin.meditation'] }
}, { questItems: questItemLedgerSchema }, {
  questReceipts: { type: 'object', additionalProperties: false, properties: {
    [COUNCIL_RECEIPT_SOURCE]: { const: true }, 'quests/act3-guardian#action:break-compelling-orb': { const: true },
    ...Object.fromEntries(frozenV16.victories.map(row => [row.proof, { const: true }])),
    'quests/act4-hellforge#action:shatter-soulstone': { const: true }
  } }
}));
function validateV16Save(value: unknown): void {
  rejectHistoricalServiceFields(value);
  if (!record(value) || !record(value.inventory) || !record(value.map)) throw new Error('Invalid save: v16 structure');
  validateLiveQuestState(value.inventory.questItems, value.map.questProgress, value.map.questReceipts,
    frozenV16 as unknown as QuestStateDomain);
  const normalized = normalizeMaps(value);
  rejectUndefinedMagicResist(normalized); rejectUndefinedSelection(normalized);
  if (!validateV16(normalized)) throw new Error(`Invalid save: ${ajv.errorsText(validateV16.errors)}`);
}
/** Frozen structural item validator for quarantined predecessor payloads, before normalization. */
const validateLegacyItem = ajv.compile(item);
export function validateFrozenV16Item(value: unknown): void {
  if (!validateLegacyItem(value)) throw new Error('Invalid save: quarantine item is not valid frozen16 data');
}

/** Closed finite proof map; validates retained history but never reconstructs a proof. */
export function validateQuestActionReceipts(receipts: unknown, questProgress: unknown,
  questItems: unknown = {}): QuestActionReceipts {
  return validateLiveQuestState(questItems, questProgress, receipts).questReceipts;
}

/** Preserve the v17 native graph/item validator before the v18 ownership-only migration. */
function validateNativeSave(value: unknown, version: 17 | 18 | 19 | 20 | 21 | 22): SaveV17 | SaveV18 | SaveV19 | SaveV20 | SaveV21 | SaveCurrent {
  rejectHistoricalQuestReceipts(value);
  if (record(value) && record(value.inventory) && record(value.map)) {
    validateLiveQuestState(value.inventory.questItems, value.map.questProgress,
      value.version === version ? value.map.questReceipts : {});
  } else if (record(value) && value.version === version && record(value.map)) {
    validateQuestActionReceipts(value.map.questReceipts, value.map.questProgress);
  }
  if (record(value) && value.version === version && record(value.map) && record(value.inventory)) {
    if (version >= 20) validateCurrentCampaignRewards(value.map as unknown as SaveCurrent['map'],
      value.inventory.questItems as QuestItemLedger, value.inventory.questServices, value.endgame);
    else validateAct5CampaignRewards(value.map as unknown as SaveV19['map'], value.inventory.questItems as QuestItemLedger, value.inventory.questServices);
  }
  if (version >= 19) validateNativeSocketState(value, validateFrozenV16Item);
  const normalized = normalizeMaps(value);
  rejectUndefinedMagicResist(normalized);
  rejectUndefinedSelection(normalized);
  const check = version === 17 ? validateV17 : version === 18 ? validateV18 : version === 19 ? validateV19
    : version === 20 ? validateV20 : version === 21 ? validateV21 : validateV22;
  if (!check(normalized)) throw new Error(`Invalid save: ${ajv.errorsText(check.errors)}`);
  const save = normalized;
  // Own undefined, inherited values and accessors must not disappear through normalization.
  validateLegacyQuarantine(value as SaveV17 | SaveV18 | SaveV19, validateFrozenV16Item);
  if (version < 19) validateNativeItemState(value as SaveV17 | SaveV18);
  if (save.version >= 20) validateCurrentCampaignRewards(save.map, save.inventory.questItems, save.inventory.questServices, (save as SaveV20).endgame);
  else validateAct5CampaignRewards((save as SaveV19).map, save.inventory.questItems, save.inventory.questServices);
  validateLegacyQuarantine(save, validateFrozenV16Item);
  if (version >= 19) validateNativeSocketState(save, validateFrozenV16Item);
  else validateNativeItemState(save as SaveV17 | SaveV18);
  return save;
}

/** Frozen native20 validation before reset counters were available. */
export function validateEndgameSave(value: unknown): SaveV20 {
  rejectPreV21Respec(value);
  return validateCurrentNativeSave(value, 20) as SaveV20;
}
function validateCurrentNativeSave(value: unknown, version: 20 | 21 | 22): SaveV20 | SaveV21 | SaveCurrent {
  rejectSocketSaveAccessors(value);
  if (!record(value) || !record(value.map) || !record(value.inventory)) throw new Error('Invalid save: endgame structure');
  const endgame = readEndgameSaveField(value, { questProgress: value.map.questProgress as SaveCurrent['map']['questProgress'],
    questReceipts: value.map.questReceipts as QuestActionReceipts, questItems: value.inventory.questItems as QuestItemLedger });
  readMaterialLedger(value.inventory);
  const save = validateNativeSave(value, version) as SaveV20 | SaveV21 | SaveCurrent;
  return { ...save, endgame };
}
/** Validate frozen v21 counters and selection before a version-only migration. */
export function validateRespecSave(value: unknown): SaveV21 {
  return validateRespecNativeSave(value, 21) as SaveV21;
}

/** Validate strict current counters before normalization can erase a descriptor. */
export function validateSave(value: unknown): SaveCurrent {
  return validateRespecNativeSave(value, 22) as SaveCurrent;
}

function validateRespecNativeSave(value: unknown, version: 21 | 22): SaveV21 | SaveCurrent {
  if (!record(value)) throw new Error('Invalid save');
  const player = Object.getOwnPropertyDescriptor(value, 'player');
  if (!player || !Object.hasOwn(player, 'value') || !record(player.value)) throw new Error('Invalid save: player');
  const respecsRemaining = readRespecsRemaining(player.value);
  const save = validateCurrentNativeSave(value, version) as SaveV21 | SaveCurrent;
  if (save.version === 21) return { ...save, player: { ...save.player, respecsRemaining } };
  return { ...save, player: { ...save.player, respecsRemaining } };
}

/** Validate the complete raw predecessor before any v19 conversion or defaulting. */
export function validateFrozenV18Save(value: unknown): SaveV18 {
  rejectPreV20State(value);
  rejectPreV19State(value);
  if (record(value) && record(value.inventory)) readMaterialLedger(value.inventory);
  return validateNativeSave(value, 18) as SaveV18;
}

/** Frozen native v19 boundary; future dungeon state cannot be laundered through history. */
export function validateSocketSave(value: unknown): SaveV19 {
  rejectPreV20State(value);
  rejectSocketSaveAccessors(value);
  if (record(value) && record(value.inventory)) readMaterialLedger(value.inventory);
  return validateNativeSave(value, 19) as SaveV19;
}

/** IndexedDB preserves Maps, whose entries JSON Schema cannot otherwise inspect. */
function normalizeMaps(value: unknown): unknown {
  if (value instanceof Map) return [...Map.prototype.entries.call(value)].map(normalizeMaps);
  if (Array.isArray(value)) return Array.from({ length: value.length }, (_, index) =>
    normalizeMaps(Object.getOwnPropertyDescriptor(value, String(index))?.value));
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeMaps(entry)])
    );
  }
  return value;
}

/** Decode any supported version, migrating and validating without changing the source. */
export function decodeSave(value: unknown): SaveCurrent {
  const version: unknown = value !== null && typeof value === 'object'
    ? Object.getOwnPropertyDescriptor(value, 'version')?.value : undefined;
  if (
    typeof value !== 'object' ||
    value === null ||
    !Number.isInteger(version) ||
    (version as number) < 1
  ) {
    throw new Error('Invalid save: version must be a positive integer');
  }
  let input = value as VersionedSave;
  // Reject getters before even historical direct-field reads/normalization.
  if (input.version < 21) rejectPreV21Respec(input);
  if (input.version < 20) rejectPreV20State(input);
  if (input.version < 19) rejectPreV19State(input);
  rejectSocketSaveAccessors(input);
  const originalInventory = 'inventory' in value ? value.inventory : undefined;
  if (input.version < 18 && record(originalInventory) && 'materials' in originalInventory) {
    throw new Error('Invalid save: reserved materials in historical inventory');
  }
  if (input.version < 17) rejectHistoricalServiceFields(input);
  rejectHistoricalQuestReceipts(input);
  const rawInventory = 'inventory' in value ? value.inventory : undefined;
  if (input.version < 12 && record(rawInventory) && Object.hasOwn(rawInventory, 'questItems')) {
    throw new Error('Invalid save: historical inventory cannot contain questItems');
  }
  if (input.version < 8) {
    input = runMigrations(input, 7);
  }
  if (input.version === 7 || input.version === 8) validateHistoricalSave(input);
  if (input.version < 9) input = runMigrations(input, 9);
  if (input.version === 9) validateV9Save(input);
  if (input.version < 10) input = runMigrations(input, 10);
  if (input.version === 10) validateV10Save(input);
  if (input.version < 11) input = runMigrations(input, 11);
  if (input.version === 11) validateV11Save(input);
  if (input.version < 12) input = runMigrations(input, 12);
  if (input.version === 12) validateV12Save(input);
  if (input.version < 13) input = runMigrations(input, 13);
  if (input.version === 13) validateV13Save(input);
  if (input.version < 14) input = runMigrations(input, 14);
  if (input.version === 14) validateV14Save(input);
  if (input.version < 15) input = runMigrations(input, 15);
  if (input.version === 15) validateV15Save(input);
  if (input.version < 16) input = runMigrations(input, 16);
  if (input.version === 16) validateV16Save(input);
  if (input.version < 17) input = runMigrations(input, 17);
  if (input.version === 17) validateNativeSave(input, 17);
  if (input.version < 18) input = runMigrations(input, 18);
  if (input.version === 18) input = validateFrozenV18Save(input);
  if (input.version < 19) input = runMigrations(input, 19);
  if (input.version === 19) input = validateSocketSave(input);
  const save = validateSave(runMigrations(input));
  return repairRunewordStatCache(repairQuestLifeCache(repairQuestResistanceCache(repairEquipmentRateCache({
    ...save,
    player: restoreUnit(save.player),
    inventory: {
      ...save.inventory,
      backpack: save.inventory.backpack.map(restoreItem),
      stash: save.inventory.stash.map(restoreItem),
      equipped: restoreEquipment(save.inventory.equipped),
      legacyGearQuarantine: save.inventory.legacyGearQuarantine.map(entry => ({ ...entry, item: restoreItem(entry.item) })),
      socketQuarantine: save.inventory.socketQuarantine.map(entry => ({ ...entry, item: restoreItem(entry.item) }))
    },
    mercs: {
      ...save.mercs,
      ownedMercs: save.mercs.ownedMercs.map(merc => repairMercenaryGrowth(restoreUnit(merc))),
      mercEquipment: Object.fromEntries(
        Object.entries(save.mercs.mercEquipment).map(([id, equip]) => [id, restoreEquipment(equip)])
      )
    }
  }))));
}
