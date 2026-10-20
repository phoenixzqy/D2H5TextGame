/** Structural validation at the untrusted save boundary; never mutates input. */
import Ajv, { type AnySchema } from 'ajv';
import { restoreEquipment, restoreItem, restoreUnit } from './restore';
import { LEVEL_CAP } from '../progression/xp';
import { CURRENT_SAVE_VERSION, type SaveCurrent, type SaveV7, type SaveV8 } from '../types/save';
import { runMigrations, type VersionedSave } from './migrate';

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
const item = object(
  {
    id: text,
    baseId: text,
    rarity: { enum: ['normal', 'magic', 'rare', 'unique', 'set', 'runeword'] },
    level: number,
    identified: bool,
    equipped: bool
  },
  {
    ilvl: number,
    equipSlot: text,
    uniqueId: text,
    setId: text,
    setPieceId: text,
    runewordId: text,
    runes: strings,
    statRolls: dict(number),
    baseRolls: dict(number),
    generatedName: object({}, { prefix: text, suffix: text }),
    affixes: array({
      anyOf: [
        object({ id: text, tier: number, rolledValue: number }),
        object({
          affixId: text,
          values: {
            anyOf: [
              dict(number),
              array({ type: 'array', items: [text, number], minItems: 2, maxItems: 2 })
            ]
          }
        })
      ]
    })
  }
);
const equipment = dict({ anyOf: [item, { type: 'null' }] });
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
const saveSchema = (version: AnySchema, actorProperties: Record<string, AnySchema>): AnySchema => object({
  version,
  timestamp: number,
  player: object(
    {
      ...actorProperties,
      type: { const: 'player' },
      team: { const: 'player' },
      class: text,
      level: { type: 'integer', minimum: 1, maximum: LEVEL_CAP },
      ...numbers('experience experienceToNextLevel statPoints skillPoints')
    },
    { skillLevels: dict(number) }
  ),
  inventory: object({
    backpack: array(item),
    stash: array(item),
    equipped: equipment,
    currencies: dict(number)
  }),
  mercs: object({
    ownedMercs: array(
      object(
        { ...actorProperties, type: { const: 'mercenary' }, archetype: text, rarity: text },
        { classId: text, signatureSkillId: text }
      )
    ),
    fieldedMercId: nullableText,
    mercEquipment: dict(equipment),
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
    questProgress: dict(
      object(
        {
          id: text,
          status: { enum: ['locked', 'available', 'inProgress', 'completed'] },
          objectives: dict(bool)
        },
        { rewardClaimed: bool }
      )
    )
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
const validate = ajv.compile<SaveCurrent>(saveSchema({ const: CURRENT_SAVE_VERSION }, unitProperties));
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

/** Validate a migrated save before any IO or store mutation. Preserves optional fields. */
export function validateSave(value: unknown): SaveCurrent {
  const normalized = normalizeMaps(value);
  rejectUndefinedMagicResist(normalized);
  if (!validate(normalized)) throw new Error(`Invalid save: ${ajv.errorsText(validate.errors)}`);
  return normalized as SaveCurrent;
}

/** IndexedDB preserves Maps, whose entries JSON Schema cannot otherwise inspect. */
function normalizeMaps(value: unknown): unknown {
  if (value instanceof Map) return [...value.entries()].map(normalizeMaps);
  if (Array.isArray(value)) return value.map(normalizeMaps);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, normalizeMaps(entry)])
    );
  }
  return value;
}

/** Decode any supported version, migrating and validating without changing the source. */
export function decodeSave(value: unknown): SaveCurrent {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('version' in value) ||
    !Number.isInteger(value.version) ||
    (value.version as number) < 1
  ) {
    throw new Error('Invalid save: version must be a positive integer');
  }
  let input = value as VersionedSave;
  if (input.version < 8) {
    input = runMigrations(input, 7);
  }
  if (input.version === 7 || input.version === 8) validateHistoricalSave(input);
  const save = validateSave(runMigrations(input));
  return {
    ...save,
    player: restoreUnit(save.player),
    inventory: {
      ...save.inventory,
      backpack: save.inventory.backpack.map(restoreItem),
      stash: save.inventory.stash.map(restoreItem),
      equipped: restoreEquipment(save.inventory.equipped)
    },
    mercs: {
      ...save.mercs,
      ownedMercs: save.mercs.ownedMercs.map(restoreUnit),
      mercEquipment: Object.fromEntries(
        Object.entries(save.mercs.mercEquipment).map(([id, equip]) => [id, restoreEquipment(equip)])
      )
    }
  };
}
