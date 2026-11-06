import { FROZEN_V28, FROZEN_V28_ITEM_BASES } from './frozen-v28';
import type { FrozenNativeQuestDomain } from './quest-domain';

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** Accepted actual29 authority, captured before the town-enlistment family. */
export const FROZEN_V29: FrozenNativeQuestDomain = Object.freeze({ ...FROZEN_V28,
  quests: Object.freeze(FROZEN_V28.quests.map(quest => quest.id === 'quests/side-act5-nihlathaks-treasure'
    ? deepFreeze({
  "id": "quests/side-act5-nihlathaks-treasure",
  "name": "Nihlathak's Treasure",
  "type": "side",
  "actId": "acts/act5",
  "giver": "npc/cain",
  "description": "After freeing Anya and defeating Nihlathak in Crystalline Passage, recover his hidden relic there. Keep it and claim Cain’s XP and Mara’s Kaleidoscope separately in Quests.",
  "objectives": [
    {
      "id": "obj-fetch",
      "type": "fetch",
      "itemId": "quest/nihlathak_relic",
      "areaId": "areas/act5-crystalline-passage",
      "targetId": "objects/nihlathak_relic_cache",
      "description": "Recover Nihlathak's relic."
    }
  ],
  "rewards": {
    "xp": 12000,
    "itemDrop": {
      "uniqueId": "items/unique/mara-kaleidoscope",
      "ilvl": 82
    }
  }
} as const) : quest)),
  items: Object.freeze([...FROZEN_V28.items, Object.freeze({
  "id": "quest/nihlathak_relic",
  "sourceQuestId": "quests/side-act5-nihlathaks-treasure",
  "kind": "tool",
  "sourceObjectiveId": "obj-fetch",
  "nameKey": "inventory:questItems.nihlathakRelic.name",
  "descKey": "inventory:questItems.nihlathakRelic.description"
} as const)]),
  nihlathak: Object.freeze({ quest: 'quests/side-act5-nihlathaks-treasure', objective: 'obj-fetch',
    source: 'quests/side-act5-nihlathaks-treasure#objective:obj-fetch', itemId: 'quest/nihlathak_relic',
    prerequisite: 'quests/act5-prison-of-ice' }) });
/** Actual29 retains accepted28 bases; equality is proved before live30 authoring. */
export const FROZEN_V29_ITEM_BASES = FROZEN_V28_ITEM_BASES;
