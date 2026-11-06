import { FROZEN_V27, FROZEN_V27_ITEM_BASES } from './frozen-v27';
import type { FrozenNativeQuestDomain } from './quest-domain';

/** Accepted actual28 authority, captured before Nihlathak's physical recovery. */
export const FROZEN_V28: FrozenNativeQuestDomain = Object.freeze({ ...FROZEN_V27,
  quests: Object.freeze(FROZEN_V27.quests.map(quest => quest.id === 'quests/side-act2-drognan-tome'
    ? Object.freeze({ ...quest,
      description: 'Recover the Sun-Cult Tome in the Lost City. Drognan will share its arcane knowledge; claim XP and a skill point separately in Quests.',
      objectives: Object.freeze([Object.freeze({ id: 'obj-fetch', type: 'fetch', itemId: 'quest/sun_cult_tome',
        areaId: 'areas/act2-lost-city', targetId: 'objects/sun_cult_tome_cache', description: 'Find the Sun-Cult Tome.' })]) })
    : quest)),
  items: Object.freeze([...FROZEN_V27.items, Object.freeze({ id: 'quest/sun_cult_tome',
    sourceQuestId: 'quests/side-act2-drognan-tome', kind: 'tool' as const, sourceObjectiveId: 'obj-fetch',
    nameKey: 'inventory:questItems.sunCultTome.name', descKey: 'inventory:questItems.sunCultTome.description' })]),
  drognan: Object.freeze({ quest: 'quests/side-act2-drognan-tome', objective: 'obj-fetch',
    source: 'quests/side-act2-drognan-tome#objective:obj-fetch', itemId: 'quest/sun_cult_tome' }) });
/** Actual28 retains the accepted27 bases; equality is recorded before live29 edits. */
export const FROZEN_V28_ITEM_BASES = FROZEN_V27_ITEM_BASES;
