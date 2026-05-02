/**
 * Aggregate game-data index.
 *
 * Provides:
 *   - File-path manifests (relative to `src/data/`) for every JSON game-data
 *     file. Useful for tooling, schema runners, and documentation.
 *   - Eagerly-loaded, typed datasets consumed by {@link ../loader.ts | loader.ts}.
 *
 * All JSON in `src/data/` is bundled at build time via Vite's
 * `import.meta.glob` so that no runtime `fetch` is required (works in
 * production, in unit tests, and inside Web Workers).
 *
 * @module data/index
 */

import type {
  MonsterDef,
  SkillDef,
  ItemBase,
  Affix,
  UniqueItemDef,
  Rune,
  RuneWord,
  SetDef,
  ActDef,
  SubAreaDef,
  EliteConfigDef
} from '../engine/types';

// ---------------------------------------------------------------------------
// File-path manifests (relative to `src/data/`)
// ---------------------------------------------------------------------------

/** Skill JSON files (one per character class + monsters). */
export const skillFiles = [
  './skills/amazon.json',
  './skills/assassin.json',
  './skills/barbarian.json',
  './skills/druid.json',
  './skills/necromancer.json',
  './skills/paladin.json',
  './skills/sorceress.json',
  './skills/monsters.json',
  './skills/mercenary.json'
] as const;

/** Monster archetype JSON files (one per act). */
export const monsterFiles = [
  './monsters/act1.json',
  './monsters/act2.json',
  './monsters/act3.json',
  './monsters/act4.json',
  './monsters/act5.json'
] as const;

/** Item base files. */
export const itemBaseFiles = ['./items/bases.json'] as const;

/** Affix files (prefixes + suffixes). */
export const affixFiles = [
  './items/affixes-prefix.json',
  './items/affixes-suffix.json'
] as const;

/** Rune definition files. */
export const runeFiles = ['./items/runes.json'] as const;

/** Unique item files. */
export const uniqueFiles = ['./items/uniques.json'] as const;

/** Set item files. */
export const setFiles = ['./items/sets.json'] as const;

/** Runeword recipe files. */
export const runewordFiles = ['./items/runewords.json'] as const;

/** Act overview files. */
export const actFiles = ['./maps/acts.json'] as const;

/** Sub-area files (one per act). */
export const subAreaFiles = [
  './maps/sub-areas/act1.json',
  './maps/sub-areas/act2.json',
  './maps/sub-areas/act3.json',
  './maps/sub-areas/act4.json',
  './maps/sub-areas/act5.json'
] as const;

/** Treasure-class / drop-table files. */
export const dropTableFiles = ['./loot/treasure-classes.json'] as const;

/** Magic-find curve singleton. */
export const mfCurveFile = './loot/mf-curve.json';

/** Rarity rules singleton. */
export const rarityRulesFile = './items/rarity-rules.json';

/** Mercenary definition files. */
export const mercFiles = ['./gacha/mercenaries.json'] as const;

/** Gacha banner singleton. */
export const bannerConfigFile = './gacha/banner-config.json';

/** Elite spawn configuration singleton. */
export const eliteConfigFile = './elite/elite-config.json';

/** Dialogue files. */
export const dialogueFiles = ['./dialogue/act1/*.json'] as const;

/** Quest files. */
export const mainQuestsFile = './quests/main.json';
export const sideQuestsFile = './quests/side.json';

// ---------------------------------------------------------------------------
// Eagerly-loaded datasets
//
// `import.meta.glob` with `eager: true` inlines every JSON module at build
// time. Each glob covers exactly the file-list above; if a file is added or
// removed the manifest constants must be updated to match.
// ---------------------------------------------------------------------------

type JsonModule<T> = Record<string, T>;

const skillModules = import.meta.glob<unknown[]>('./skills/*.json', {
  eager: true,
  import: 'default'
}) as JsonModule<unknown[]>;

const monsterModules = import.meta.glob<unknown[]>('./monsters/*.json', {
  eager: true,
  import: 'default'
}) as JsonModule<unknown[]>;

const itemBaseModules = import.meta.glob<unknown[]>('./items/bases.json', {
  eager: true,
  import: 'default'
}) as JsonModule<unknown[]>;

const affixModules = import.meta.glob<unknown[]>(
  './items/affixes-*.json',
  { eager: true, import: 'default' }
) as JsonModule<unknown[]>;

const runeModules = import.meta.glob<unknown[]>('./items/runes.json', {
  eager: true,
  import: 'default'
}) as JsonModule<unknown[]>;

const uniqueModules = import.meta.glob<unknown[]>('./items/uniques.json', {
  eager: true,
  import: 'default'
}) as JsonModule<unknown[]>;

const setModules = import.meta.glob<unknown[]>('./items/sets.json', {
  eager: true,
  import: 'default'
}) as JsonModule<unknown[]>;

const runewordModules = import.meta.glob<unknown[]>('./items/runewords.json', {
  eager: true,
  import: 'default'
}) as JsonModule<unknown[]>;

const actModules = import.meta.glob<unknown[]>('./maps/acts.json', {
  eager: true,
  import: 'default'
}) as JsonModule<unknown[]>;

const subAreaModules = import.meta.glob<unknown[]>(
  './maps/sub-areas/*.json',
  { eager: true, import: 'default' }
) as JsonModule<unknown[]>;

const dropTableModules = import.meta.glob<unknown[]>(
  './loot/treasure-classes.json',
  { eager: true, import: 'default' }
) as JsonModule<unknown[]>;

const mercModules = import.meta.glob<unknown[]>(
  './gacha/mercenaries.json',
  { eager: true, import: 'default' }
) as JsonModule<unknown[]>;

const dialogueModules = import.meta.glob<unknown[]>(
  './dialogue/act1/*.json',
  { eager: true, import: 'default' }
) as JsonModule<unknown[]>;

const mfCurveModules = import.meta.glob<unknown>('./loot/mf-curve.json', {
  eager: true,
  import: 'default'
}) as JsonModule<unknown>;

const rarityRulesModules = import.meta.glob<unknown>('./items/rarity-rules.json', {
  eager: true,
  import: 'default'
}) as JsonModule<unknown>;

const bannerConfigModules = import.meta.glob<unknown>(
  './gacha/banner-config.json',
  { eager: true, import: 'default' }
) as JsonModule<unknown>;

const eliteConfigModules = import.meta.glob<unknown>(
  './elite/elite-config.json',
  { eager: true, import: 'default' }
) as JsonModule<unknown>;

const mainQuestsModules = import.meta.glob<unknown>('./quests/main.json', {
  eager: true,
  import: 'default'
}) as JsonModule<unknown>;

const sideQuestsModules = import.meta.glob<unknown>('./quests/side.json', {
  eager: true,
  import: 'default'
}) as JsonModule<unknown>;

/** Flatten an `import.meta.glob` array-module map into a single array. */
function flatten<T>(modules: JsonModule<T[]>): T[] {
  return Object.values(modules).flat();
}

function single<T>(modules: JsonModule<T>): T {
  const values = Object.values(modules);
  const [first] = values;
  if (values.length !== 1 || first === undefined) {
    throw new Error(
      `Expected exactly one module, got ${String(values.length)}: ${Object.keys(modules).join(', ')}`
    );
  }
  return first;
}

// ---------------------------------------------------------------------------
// Typed dataset exports — these are consumed by `loader.ts`.
// Validation is performed per entry by the loader.
// ---------------------------------------------------------------------------

export const skills = flatten<SkillDef>(skillModules as JsonModule<SkillDef[]>);
export const monsters = flatten<MonsterDef>(
  monsterModules as JsonModule<MonsterDef[]>
);
export const itemBases = flatten<ItemBase>(
  itemBaseModules as JsonModule<ItemBase[]>
);
export const affixes = flatten<Affix>(affixModules as JsonModule<Affix[]>);
export const runes = flatten<Rune>(runeModules as JsonModule<Rune[]>);
export const uniques = flatten<UniqueItemDef>(
  uniqueModules as JsonModule<UniqueItemDef[]>
);
export const sets = flatten<SetDef>(setModules as JsonModule<SetDef[]>);
export const runewords = flatten<RuneWord>(
  runewordModules as JsonModule<RuneWord[]>
);
export const acts = flatten<ActDef>(actModules as JsonModule<ActDef[]>);
export const subAreas = flatten<SubAreaDef>(
  subAreaModules as JsonModule<SubAreaDef[]>
);
export const dropTables = flatten<{ id: string }>(
  dropTableModules as JsonModule<{ id: string }[]>
);
export const mercenaries = flatten<{ id: string }>(
  mercModules as JsonModule<{ id: string }[]>
);
export const dialogues = flatten<{ id: string }>(
  dialogueModules as JsonModule<{ id: string }[]>
);

/** Singleton: magic-find diminishing-returns curve. */
export const mfCurve = single<{ id: string }>(
  mfCurveModules as JsonModule<{ id: string }>
);
/** Singleton: rarity rules. */
export const rarityRules = single<{ id: string }>(
  rarityRulesModules as JsonModule<{ id: string }>
);
/** Singleton: gacha banner configuration. */
export const bannerConfig = single<Record<string, unknown>>(
  bannerConfigModules as JsonModule<Record<string, unknown>>
);
/** Singleton: elite spawn configuration. */
export const eliteConfig = single<EliteConfigDef>(
  eliteConfigModules as JsonModule<EliteConfigDef>
);
/** Singleton: main quest line. */
export const mainQuests = single<{ quests: { id: string }[] }>(
  mainQuestsModules as JsonModule<{ quests: { id: string }[] }>
);
/** Singleton: side quests. */
export const sideQuests = single<{ quests: { id: string }[] }>(
  sideQuestsModules as JsonModule<{ quests: { id: string }[] }>
);
