/**
 * Quest loader — reads `quests/main.json` + `quests/side.json` and surfaces a
 * typed view consumed by `QuestsScreen` and other UI/engine code.
 *
 * Validates both complete bundled documents before collecting any rows.
 * Structural validation does not promise gameplay support for every reward.
 *
 * @module data/loaders/quests
 */

import Ajv2020 from 'ajv/dist/2020';
import questSchema from '../schema/quest.schema.json';
import mainQuestsJson from '../quests/main.json';
import sideQuestsJson from '../quests/side.json';

/** A single quest objective (the JSON shape varies by `type`; we keep it
 *  intentionally loose and only require an `id` + `description`). */
export interface QuestObjective {
  readonly id: string;
  readonly type: string;
  readonly description: string;
  readonly count?: number;
  readonly [extra: string]: unknown;
}

/** Reward bag — a free-form map; UI shows the keys it knows about and
 *  falls back to a generic chip for the rest. */
export type QuestRewards = Readonly<Record<string, unknown>>;

/** Quest type — `main` (act questline), `side` (optional), `bounty` (boss). */
export type QuestType = 'main' | 'side' | 'bounty';

export interface QuestDef {
  readonly id: string;
  readonly name: string;
  readonly type: QuestType;
  readonly actId: string;
  readonly giver?: string;
  readonly description: string;
  readonly objectives: readonly QuestObjective[];
  /** Complete ordered partition; peers may progress in any order. Omitted means serial objectives. */
  readonly objectiveStages?: readonly (readonly string[])[];
  readonly rewards?: QuestRewards;
  readonly unlocks?: string;
  readonly prerequisites?: readonly string[];
  readonly order?: number;
}

interface QuestFile {
  readonly quests: readonly QuestDef[];
}

const ajv = new Ajv2020({ strict: true, allErrors: true });
const validateQuests = ajv.compile<QuestFile>(questSchema);

function validateDocument(document: unknown, context: string): QuestFile {
  if (!validateQuests(document)) {
    throw new Error(`${context}: ${ajv.errorsText(validateQuests.errors, { dataVar: context })}`);
  }
  return document;
}

/** Load main + side in authored order; reject malformed documents or duplicate IDs. */
export function loadQuests(): readonly QuestDef[] {
  const main = validateDocument(mainQuestsJson, 'quests/main.json');
  const side = validateDocument(sideQuestsJson, 'quests/side.json');
  const ids = new Set<string>();
  const quests: QuestDef[] = [];
  for (const [document, context] of [[main, 'quests/main.json'], [side, 'quests/side.json']] as const) {
    for (const quest of document.quests) {
      if (ids.has(quest.id)) throw new Error(`Duplicate quest id "${quest.id}" in ${context}`);
      const objectiveIds = new Set(quest.objectives.map(objective => objective.id));
      if (objectiveIds.size !== quest.objectives.length) {
        throw new Error(`Duplicate objective id in ${context}: ${quest.id}`);
      }
      if (quest.objectiveStages !== undefined) {
        const stagedIds = quest.objectiveStages.flat();
        if (stagedIds.length !== objectiveIds.size || new Set(stagedIds).size !== stagedIds.length ||
          stagedIds.some(id => !objectiveIds.has(id))) {
          throw new Error(`Invalid objectiveStages partition in ${context}: ${quest.id}`);
        }
      }
      ids.add(quest.id);
      quests.push(quest);
    }
  }
  return Object.freeze(quests);
}

/** Group quests by act id (e.g. `"acts/act1"`). Stable order:
 *  main first, then side, both ordered by `order` field if present. */
export function loadQuestsByAct(): ReadonlyMap<string, readonly QuestDef[]> {
  const all = loadQuests();
  const byAct = new Map<string, QuestDef[]>();
  for (const q of all) {
    const list = byAct.get(q.actId) ?? [];
    list.push(q);
    byAct.set(q.actId, list);
  }
  for (const list of byAct.values()) {
    list.sort((a, b) => {
      // main quests before side; then by `order`; then by id
      if (a.type !== b.type) {
        if (a.type === 'main') return -1;
        if (b.type === 'main') return 1;
      }
      const ao = a.order ?? Number.MAX_SAFE_INTEGER;
      const bo = b.order ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.id.localeCompare(b.id);
    });
  }
  return byAct;
}

/** Extract the trailing slug of a quest id (`"quests/act1-den-of-evil"` →
 *  `"act1-den-of-evil"`). Used to resolve i18n keys against
 *  `quests:byId.<slug>`. */
export function questSlug(questId: string): string {
  const idx = questId.indexOf('/');
  return idx >= 0 ? questId.slice(idx + 1) : questId;
}

/** Strip the `side-` / `bounty-` prefix from a slug for i18n lookup. The
 *  `byId.<key>` map in `i18n/quests.json` uses the same keys for both main
 *  and side variants of the same beat (`act1-andariel`, etc.). */
export function questI18nKey(questId: string): string {
  let slug = questSlug(questId);
  if (slug.startsWith('side-')) slug = slug.slice('side-'.length);
  return slug;
}

/** Slug an act id (`"acts/act1"` → `"1"`). */
export function actNumber(actId: string): string {
  const m = /act(\d+)/.exec(actId);
  return m?.[1] ?? actId;
}
