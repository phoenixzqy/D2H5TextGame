/** Accepted literal31 authority captured before successor authoring. */
import { FROZEN_V30, FROZEN_V30_ITEM_BASES } from './frozen-v30';
import type { FrozenNativeQuestDomain } from './quest-domain';

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** Full prospective31 counted rows; explicit literals, never a live loader snapshot. */
const acceptedCountedQuests = deepFreeze([
  {
    "id": "quests/side-act3-alkors-experiment",
    "name": "Alkor's Experiment",
    "type": "side",
    "actId": "acts/act3",
    "giver": "npc/alkor",
    "description": "Recover three distinct venom glands in the Spider Forest on Normal. Claim in your journal to exchange all three for XP and five unallocated stat points.",
    "objectives": [
      {
        "id": "obj-collect",
        "type": "collect",
        "itemId": "quest/spider_venom_gland",
        "count": 3,
        "areaId": "areas/act3-spider-forest",
        "description": "Recover 3 venom glands in the Spider Forest."
      }
    ],
    "rewards": {
      "xp": 4500,
      "statPoints": 5
    }
  },
  {
    "id": "quests/side-act3-jade-statuette",
    "name": "Jade Figurine Buyer",
    "type": "side",
    "actId": "acts/act3",
    "giver": "npc/meshif",
    "description": "Recover three distinct jade trinkets in Kurast Bazaar on Normal. Give all three to Meshif in Kurast, then separately Claim XP and 1,000 rune shards in your journal.",
    "objectives": [
      {
        "id": "obj-deliver",
        "type": "deliver",
        "itemId": "quest/jade_trinket",
        "count": 3,
        "areaId": "areas/act3-kurast-bazaar",
        "npcId": "npc/meshif",
        "description": "Recover 3 jade trinkets in Kurast Bazaar and give them to Meshif."
      }
    ],
    "rewards": {
      "xp": 3500,
      "runeShards": 1000
    }
  },
  {
    "id": "quests/side-act4-jamella-trade",
    "name": "Jamella's Stockpile",
    "type": "side",
    "actId": "acts/act4",
    "giver": "npc/jamella",
    "description": "Recover five distinct Forge Embers in the River of Flame on Normal. Claim in your journal to exchange all five for XP and one perfect gem.",
    "objectives": [
      {
        "id": "obj-collect",
        "type": "collect",
        "itemId": "quest/forge_ember",
        "count": 5,
        "areaId": "areas/act4-river-of-flame",
        "description": "Recover 5 Forge Embers in the River of Flame."
      }
    ],
    "rewards": {
      "xp": 7000,
      "lootTable": {
        "tableId": "loot/side-jamella-perfect-gem",
        "ilvl": 51,
        "picks": 1
      }
    }
  },
  {
    "id": "quests/side-act5-malahs-elixir",
    "name": "Malah's Elixir",
    "type": "side",
    "actId": "acts/act5",
    "giver": "npc/malah",
    "description": "Recover five distinct Frost Lichens in the Ancients' Way on Normal. Claim in your journal to exchange all five for XP and +10 effective Vitality after the ordinary soft cap, without changing allocated points or restoring Life.",
    "objectives": [
      {
        "id": "obj-collect",
        "type": "collect",
        "itemId": "quest/frost_lichen",
        "count": 5,
        "areaId": "areas/act5-ancients-way",
        "description": "Recover 5 Frost Lichens in the Ancients' Way."
      }
    ],
    "rewards": {
      "xp": 9000,
      "stat": {
        "vitality": 10
      }
    }
  }
] as const);

/** Prospective31 authority only; acceptance/equality have NOT occurred. */
export const FROZEN_V31: FrozenNativeQuestDomain = Object.freeze({ ...FROZEN_V30,
  quests: Object.freeze(FROZEN_V30.quests.map(quest =>
    acceptedCountedQuests.find(row => row.id === quest.id) ?? quest)),
  countedSources: deepFreeze([
  {
    "key": "alkor",
    "quest": "quests/side-act3-alkors-experiment",
    "objective": "obj-collect",
    "objectiveType": "collect",
    "itemId": "quest/spider_venom_gland",
    "sink": "claim",
    "sources": [
      "quests/side-act3-alkors-experiment#objective:obj-collect:source:gland-1",
      "quests/side-act3-alkors-experiment#objective:obj-collect:source:gland-2",
      "quests/side-act3-alkors-experiment#objective:obj-collect:source:gland-3"
    ]
  },
  {
    "key": "jade",
    "quest": "quests/side-act3-jade-statuette",
    "objective": "obj-deliver",
    "objectiveType": "deliver",
    "itemId": "quest/jade_trinket",
    "sink": "town-delivery",
    "sources": [
      "quests/side-act3-jade-statuette#objective:obj-deliver:source:trinket-1",
      "quests/side-act3-jade-statuette#objective:obj-deliver:source:trinket-2",
      "quests/side-act3-jade-statuette#objective:obj-deliver:source:trinket-3"
    ]
  },
  {
    "key": "jamella",
    "quest": "quests/side-act4-jamella-trade",
    "objective": "obj-collect",
    "objectiveType": "collect",
    "itemId": "quest/forge_ember",
    "sink": "claim",
    "sources": [
      "quests/side-act4-jamella-trade#objective:obj-collect:source:ember-1",
      "quests/side-act4-jamella-trade#objective:obj-collect:source:ember-2",
      "quests/side-act4-jamella-trade#objective:obj-collect:source:ember-3",
      "quests/side-act4-jamella-trade#objective:obj-collect:source:ember-4",
      "quests/side-act4-jamella-trade#objective:obj-collect:source:ember-5"
    ]
  },
  {
    "key": "malah",
    "quest": "quests/side-act5-malahs-elixir",
    "objective": "obj-collect",
    "objectiveType": "collect",
    "itemId": "quest/frost_lichen",
    "sink": "claim",
    "sources": [
      "quests/side-act5-malahs-elixir#objective:obj-collect:source:lichen-1",
      "quests/side-act5-malahs-elixir#objective:obj-collect:source:lichen-2",
      "quests/side-act5-malahs-elixir#objective:obj-collect:source:lichen-3",
      "quests/side-act5-malahs-elixir#objective:obj-collect:source:lichen-4",
      "quests/side-act5-malahs-elixir#objective:obj-collect:source:lichen-5"
    ]
  }
] as const)
});
/** Retain only after complete root equality proves the actual31 base catalog. */
export const FROZEN_V31_ITEM_BASES = FROZEN_V30_ITEM_BASES;
