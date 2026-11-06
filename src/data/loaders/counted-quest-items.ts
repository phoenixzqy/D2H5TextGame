import { compileAuthoredValidator } from '../authored-validators';
import Ajv2020 from 'ajv/dist/2020';
import document from '../quests/counted-items.json';
import mainQuests from '../quests/main.json';
import sideQuests from '../quests/side.json';
import { subAreas } from '../index';
import { loadQuests } from './quests';
import { loadTownNpcs } from './towns';
import type { CountedQuestDomain } from '../../engine/map/counted-quest';
export type { CountedQuestKey, CountedQuestDomain, CountedQuestCounts, CountedQuestProgress } from '../../engine/map/counted-quest';

export interface CountedQuestPlacement { readonly source: string; readonly targetId: string }
export interface CountedQuestMetadata extends CountedQuestDomain {
  readonly actId: string;
  readonly areaId: string;
  readonly npc: string;
  readonly nameKey: string;
  readonly descKey: string;
  readonly placements: readonly CountedQuestPlacement[];
}
export interface CountedQuestLookup {
  readonly definition: CountedQuestMetadata;
  readonly placement: CountedQuestPlacement;
}
type AuthoredItem = Omit<CountedQuestMetadata, 'sources'>;
const ajv = new Ajv2020({ strict: true, allErrors: true });
const validate = compileAuthoredValidator<{ readonly items: readonly AuthoredItem[] }>(ajv, 'countedItems');

/** Inspect descriptors before either the canonical schema loader or this resolver reads live data. */
function ownJsonTree(value: unknown, seen = new Set<object>()): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object' || seen.has(value)) return false;
  const array = Array.isArray(value), prototype: unknown = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) return false;
  seen.add(value);
  const keys = Reflect.ownKeys(value);
  const valid = keys.every(key => {
    if (array && key === 'length') return true;
    const field = Object.getOwnPropertyDescriptor(value, key);
    return typeof key === 'string' && field?.enumerable === true && Object.hasOwn(field, 'value') &&
      ownJsonTree(field.value, seen);
  }) && (!array || keys.length === value.length + 1);
  seen.delete(value);
  return valid;
}

/** Five independent items, twenty-one exact Recover placements; no singular-source definition is widened. */
export function loadCountedQuestItems(): readonly CountedQuestMetadata[] {
  if (![document, mainQuests, sideQuests, subAreas].every(value => ownJsonTree(value))) {
    throw new Error('quests/counted-items.json: canonical data requires own JSON descriptors');
  }
  if (!validate(document)) throw new Error(`quests/counted-items.json: ${ajv.errorsText(validate.errors)}`);
  const keys = new Set<string>(), quests = new Set<string>(), items = new Set<string>();
  const sources = new Set<string>(), targets = new Set<string>(), canonicalQuests = loadQuests();
  if (!ownJsonTree(canonicalQuests)) throw new Error('quests/counted-items.json: canonical quests require own JSON descriptors');
  const definitions = document.items.map((item: AuthoredItem): CountedQuestMetadata => {
    const quest = canonicalQuests.find(row => row.id === item.quest), objective = quest?.objectives[0];
    const act = Number(item.actId.slice('acts/act'.length));
    const npcs = loadTownNpcs(act);
    if (!ownJsonTree(npcs)) throw new Error('quests/counted-items.json: canonical NPCs require own JSON descriptors');
    if (keys.has(item.key) || quests.has(item.quest) || items.has(item.itemId) || !quest ||
      quest.type !== 'side' || quest.actId !== item.actId || quest.giver !== item.npc || quest.objectives.length !== 1 ||
      quest.objectiveStages !== undefined || quest.prerequisites !== undefined || quest.unlocks !== undefined ||
      objective?.id !== item.objective || objective.type !== item.objectiveType || objective.itemId !== item.itemId ||
      objective.count !== item.placements.length || objective.areaId !== item.areaId ||
      (item.sink === 'town-delivery' && objective.npcId !== item.npc) ||
      !subAreas.some(area => area.id === item.areaId && area.actId === item.actId) ||
      !npcs.some(npc => npc.id === item.npc)) {
      throw new Error('quests/counted-items.json: duplicate identity or canonical quest/area/NPC mismatch');
    }
    keys.add(item.key); quests.add(item.quest); items.add(item.itemId);
    const placements = item.placements.map(placement => {
      if (sources.has(placement.source) || targets.has(placement.targetId)) {
        throw new Error('quests/counted-items.json: duplicate source or target');
      }
      sources.add(placement.source); targets.add(placement.targetId);
      return Object.freeze({ ...placement });
    });
    return Object.freeze({ ...item, placements: Object.freeze(placements),
      sources: Object.freeze(placements.map(placement => placement.source)) });
  });
  if (keys.size !== 5 || sources.size !== 21) throw new Error('quests/counted-items.json: incomplete finite family');
  return Object.freeze(definitions);
}

export function countedQuestSources(definition: CountedQuestDomain): readonly string[] { return definition.sources; }
export function findCountedQuestById(questId: string): CountedQuestMetadata | undefined {
  return loadCountedQuestItems().find(item => item.quest === questId);
}
export function resolveCountedQuestSource(source: string): CountedQuestLookup | undefined {
  for (const definition of loadCountedQuestItems()) {
    const placement = definition.placements.find(row => row.source === source);
    if (placement) return { definition, placement };
  }
  return undefined;
}
export function resolveCountedQuestTarget(targetId: string): CountedQuestLookup | undefined {
  for (const definition of loadCountedQuestItems()) {
    const placement = definition.placements.find(row => row.targetId === targetId);
    if (placement) return { definition, placement };
  }
  return undefined;
}
