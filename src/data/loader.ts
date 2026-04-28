/**
 * Game data loader and validator
 * Loads JSON game data and validates against JSON Schema
 * @module data/loader
 */

import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import type {
  MonsterDef,
  SkillDef,
  ItemBase,
  Affix,
  Rune,
  RuneWord,
  SetDef,
  ActDef,
  SubAreaDef
} from '../engine/types';

// Import schemas
import monsterSchema from './schema/monster.schema.json';
import skillSchema from './schema/skill.schema.json';
import itemBaseSchema from './schema/item-base.schema.json';
import affixSchema from './schema/affix.schema.json';
import uniqueSchema from './schema/unique.schema.json';
import setSchema from './schema/set.schema.json';
import runeSchema from './schema/rune.schema.json';
import runewordSchema from './schema/runeword.schema.json';
import actSchema from './schema/act.schema.json';
import subAreaSchema from './schema/sub-area.schema.json';
import mercSchema from './schema/merc.schema.json';
import dropTableSchema from './schema/drop-table.schema.json';
import dialogueSchema from './schema/dialogue.schema.json';
import rarityRulesSchema from './schema/rarity-rules.schema.json';

// Eagerly-loaded JSON datasets (see ./index.ts)
import {
  monsters as monsterEntries,
  skills as skillEntries,
  itemBases as itemBaseEntries,
  affixes as affixEntries,
  uniques as uniqueEntries,
  sets as setEntries,
  runes as runeEntries,
  runewords as runewordEntries,
  acts as actEntries,
  subAreas as subAreaEntries,
  mercenaries as mercEntries,
  dropTables as dropTableEntries,
  dialogues as dialogueEntries,
  mfCurve,
  bannerConfig,
  rarityRules,
  mainQuests,
  sideQuests
} from './index';

/**
 * Custom error for game data validation failures
 */
export class GameDataValidationError extends Error {
  constructor(
    public readonly filePath: string,
    public readonly errors: unknown[]
  ) {
    super(`Game data validation failed for ${filePath}`);
    this.name = 'GameDataValidationError';
  }
}

/**
 * Game data container
 */
export interface GameData {
  readonly monsters: ReadonlyMap<string, MonsterDef>;
  readonly skills: ReadonlyMap<string, SkillDef>;
  readonly itemBases: ReadonlyMap<string, ItemBase>;
  readonly affixes: ReadonlyMap<string, Affix>;
  readonly uniques: ReadonlyMap<string, unknown>; // TODO: type after unique impl
  readonly sets: ReadonlyMap<string, SetDef>;
  readonly runes: ReadonlyMap<string, Rune>;
  readonly runewords: ReadonlyMap<string, RuneWord>;
  readonly acts: ReadonlyMap<string, ActDef>;
  readonly subAreas: ReadonlyMap<string, SubAreaDef>;
  readonly mercenaries: ReadonlyMap<string, unknown>; // TODO: type after merc impl
  readonly dropTables: ReadonlyMap<string, unknown>; // TODO: type after drop impl
  readonly dialogues: ReadonlyMap<string, unknown>;
  /** Magic-find diminishing-returns curve singleton. */
  readonly mfCurve: Readonly<Record<string, unknown>>;
  /** Gacha banner configuration singleton. */
  readonly bannerConfig: Readonly<Record<string, unknown>>;
  /** Rarity rules configuration singleton. */
  readonly rarityRules: Readonly<Record<string, unknown>>;
  /** All quests (main + side), keyed by quest id. */
  readonly quests: ReadonlyMap<string, Readonly<Record<string, unknown>>>;
}

/**
 * Create and configure Ajv validator
 */
function createValidator(): Ajv2020 {
  const ajv = new Ajv2020({
    strict: true,
    allErrors: true,
    verbose: true,
    // Enable formats (e.g. date-time, uri)
    validateFormats: true
  });

  addFormats(ajv);

  // Add all schemas
  ajv.addSchema(monsterSchema);
  ajv.addSchema(skillSchema);
  ajv.addSchema(itemBaseSchema);
  ajv.addSchema(affixSchema);
  ajv.addSchema(uniqueSchema);
  ajv.addSchema(setSchema);
  ajv.addSchema(runeSchema);
  ajv.addSchema(runewordSchema);
  ajv.addSchema(actSchema);
  ajv.addSchema(subAreaSchema);
  ajv.addSchema(mercSchema);
  ajv.addSchema(dropTableSchema);
  ajv.addSchema(dialogueSchema);
  ajv.addSchema(rarityRulesSchema);

  return ajv;
}

// Singleton validator
let validatorInstance: Ajv2020 | null = null;

function getValidator(): Ajv2020 {
  if (!validatorInstance) {
    validatorInstance = createValidator();
  }
  return validatorInstance;
}

/**
 * Validate data against a schema
 */
function validateData<T>(
  schemaId: string,
  data: unknown,
  filePath: string
): T {
  const ajv = getValidator();
  const validate = ajv.getSchema(schemaId) as ValidateFunction<T> | undefined;

  if (!validate) {
    throw new Error(`Schema not found: ${schemaId}`);
  }

  if (!validate(data)) {
    throw new GameDataValidationError(filePath, validate.errors ?? []);
  }

  return data;
}

/**
 * Validate every entry in an in-memory dataset against its schema and
 * return a frozen `Map<id, entry>`.
 *
 * @throws GameDataValidationError if any entry fails schema validation.
 * @throws Error if duplicate ids are detected within the dataset.
 */
function buildDataMap<T extends { id: string }>(
  entries: readonly unknown[],
  schemaId: string,
  context: string
): ReadonlyMap<string, T> {
  const map = new Map<string, T>();
  entries.forEach((entry, idx) => {
    const validated = validateData<T>(
      schemaId,
      entry,
      `${context}[${String(idx)}]`
    );
    if (map.has(validated.id)) {
      throw new Error(
        `Duplicate id "${validated.id}" in ${context} (entry ${String(idx)})`
      );
    }
    map.set(validated.id, validated);
  });
  return map;
}

/**
 * Load all game data
 * This is the main entry point for loading game data
 *
 * @returns Frozen GameData object with all game content
 */
// eslint-disable-next-line @typescript-eslint/require-await -- async signature reserved for future network-backed content packs
export async function loadGameData(): Promise<GameData> {
  // All JSON is bundled at build time via `./index.ts` (uses
  // `import.meta.glob`). Loading is therefore synchronous; the async
  // signature is preserved for forward-compatibility (e.g. switching to
  // network-backed content packs in the future).

  const monsters = buildDataMap<MonsterDef>(
    monsterEntries,
    monsterSchema.$id,
    'monsters'
  );
  const skills = buildDataMap<SkillDef>(
    skillEntries,
    skillSchema.$id,
    'skills'
  );
  const itemBases = buildDataMap<ItemBase>(
    itemBaseEntries,
    itemBaseSchema.$id,
    'itemBases'
  );
  const affixes = buildDataMap<Affix>(
    affixEntries,
    affixSchema.$id,
    'affixes'
  );
  const uniques = buildDataMap<{ id: string }>(
    uniqueEntries,
    uniqueSchema.$id,
    'uniques'
  );
  const sets = buildDataMap<SetDef>(setEntries, setSchema.$id, 'sets');
  const runes = buildDataMap<Rune>(runeEntries, runeSchema.$id, 'runes');
  const runewords = buildDataMap<RuneWord>(
    runewordEntries,
    runewordSchema.$id,
    'runewords'
  );
  const acts = buildDataMap<ActDef>(actEntries, actSchema.$id, 'acts');
  const subAreas = buildDataMap<SubAreaDef>(
    subAreaEntries,
    subAreaSchema.$id,
    'subAreas'
  );
  const mercenaries = buildDataMap<{ id: string }>(
    mercEntries,
    mercSchema.$id,
    'mercenaries'
  );
  const dropTables = buildDataMap<{ id: string }>(
    dropTableEntries,
    dropTableSchema.$id,
    'dropTables'
  );
  const dialogues = buildDataMap<{ id: string }>(
    dialogueEntries,
    dialogueSchema.$id,
    'dialogues'
  );

  // Singletons + quests — no per-entry schema validation yet (no schemas
  // committed for these documents). They are surfaced as opaque records
  // so call-sites can reference them while content stabilises.
  const quests = new Map<string, Readonly<Record<string, unknown>>>();
  const collectQuests = (
    file: { quests?: { id: string }[] },
    context: string
  ): void => {
    const list = file.quests ?? [];
    list.forEach((q, idx) => {
      if (typeof q.id !== 'string') {
        throw new Error(`Quest at ${context}[${String(idx)}] is missing string id`);
      }
      if (quests.has(q.id)) {
        throw new Error(`Duplicate quest id "${q.id}" in ${context}`);
      }
      quests.set(q.id, q as Readonly<Record<string, unknown>>);
    });
  };
  collectQuests(mainQuests, 'mainQuests');
  collectQuests(sideQuests, 'sideQuests');

  // Freeze all data for immutability
  const gameData: GameData = Object.freeze({
    monsters: Object.freeze(monsters),
    skills: Object.freeze(skills),
    itemBases: Object.freeze(itemBases),
    affixes: Object.freeze(affixes),
    uniques: Object.freeze(uniques),
    sets: Object.freeze(sets),
    runes: Object.freeze(runes),
    runewords: Object.freeze(runewords),
    acts: Object.freeze(acts),
    subAreas: Object.freeze(subAreas),
    mercenaries: Object.freeze(mercenaries),
    dropTables: Object.freeze(dropTables),
    dialogues: Object.freeze(dialogues),
    mfCurve: Object.freeze(mfCurve as Record<string, unknown>),
    bannerConfig: Object.freeze(bannerConfig),
    rarityRules: Object.freeze(rarityRules as Record<string, unknown>),
    quests: Object.freeze(quests)
  });

  return gameData;
}

/**
 * Validate a single data object (for testing)
 */
export function validateGameData<T>(
  schemaId: string,
  data: unknown,
  context = 'test'
): T {
  return validateData<T>(schemaId, data, context);
}
