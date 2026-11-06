/** Permanent literal31 retention controls. The pre-widening equality proof is archived separately. */
import { describe, expect, it } from 'vitest';
import { FROZEN_V30, FROZEN_V30_ITEM_BASES } from './frozen-v30';
import { FROZEN_V31, FROZEN_V31_ITEM_BASES } from './frozen-v31';

// Accepted historical literals: deliberately independent of current loaders and quest data.
const EXPECTED_COUNTED_QUESTS = [
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
] as const;
const EXPECTED_COUNTED_DOMAINS = [
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
] as const;
const countedQuestIds: readonly string[] = EXPECTED_COUNTED_QUESTS.map(row => row.id);

function expectDeepFrozen(value: unknown): void {
  if (value !== null && typeof value === 'object') {
    expect(Object.isFrozen(value)).toBe(true);
    Object.values(value).forEach(expectDeepFrozen);
  }
}

describe('accepted literal31 authority', () => {
  it('retains the four complete accepted counted quest rows', () => {
    const counted = FROZEN_V31.quests.filter(row => countedQuestIds.includes(row.id));
    expect(counted).toEqual(EXPECTED_COUNTED_QUESTS);
    expect(counted).toHaveLength(4);
    for (const quest of counted) {
      expect(quest).not.toBe(FROZEN_V30.quests.find(row => row.id === quest.id));
      expect(quest).not.toEqual(FROZEN_V30.quests.find(row => row.id === quest.id));
    }
  });

  it('inherits every other literal30 quest and authority by identity', () => {
    expect(FROZEN_V31.quests).toHaveLength(46);
    expect(FROZEN_V31.quests.map(row => row.id)).toEqual(FROZEN_V30.quests.map(row => row.id));
    const retained = FROZEN_V31.quests.filter(row => !countedQuestIds.includes(row.id));
    expect(retained).toHaveLength(42);
    for (const quest of retained) {
      expect(quest).toBe(FROZEN_V30.quests.find(row => row.id === quest.id));
    }
    expect(Object.keys(FROZEN_V31).sort()).toEqual([...Object.keys(FROZEN_V30), 'countedSources'].sort());
    for (const key of Object.keys(FROZEN_V30)) {
      if (key !== 'quests') expect(Reflect.get(FROZEN_V31, key)).toBe(Reflect.get(FROZEN_V30, key));
    }
    expect(FROZEN_V31_ITEM_BASES).toBe(FROZEN_V30_ITEM_BASES);
    expect(Object.hasOwn(FROZEN_V30, 'countedSources')).toBe(false);
  });

  it('retains exactly four minimal counted domains and sixteen distinct source identities', () => {
    expect(FROZEN_V31.countedSources).toEqual(EXPECTED_COUNTED_DOMAINS);
    const domains = FROZEN_V31.countedSources ?? [];
    expect(domains).toHaveLength(4);
    expect(domains.map(domain => domain.sources.length)).toEqual([3, 3, 5, 5]);
    expect(domains.map(domain => domain.quest)).toEqual(countedQuestIds);
    expect(new Set(domains.flatMap(domain => domain.sources)).size).toBe(16);
    for (const domain of domains) {
      expect(Object.keys(domain).sort()).toEqual(
        ['key', 'quest', 'objective', 'objectiveType', 'itemId', 'sink', 'sources'].sort());
    }
  });

  it('deeply freezes the accepted counted rows, domains, sources and retained enlistments', () => {
    expect(Object.isFrozen(FROZEN_V31)).toBe(true);
    expect(Object.isFrozen(FROZEN_V31.quests)).toBe(true);
    // Includes objective rows, Jamella's lootTable and Malah's nested stat reward.
    FROZEN_V31.quests.filter(row => countedQuestIds.includes(row.id)).forEach(expectDeepFrozen);
    expectDeepFrozen(FROZEN_V31.countedSources);
    expectDeepFrozen(FROZEN_V31.townEnlistments);
  });
});
