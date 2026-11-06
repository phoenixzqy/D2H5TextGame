import { FROZEN_V29, FROZEN_V29_ITEM_BASES } from './frozen-v29';
import type { FrozenNativeQuestDomain } from './quest-domain';

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

/** Full accepted30 town rows, captured before counted-source authoring. */
const acceptedTownQuests = deepFreeze([
  {
    "id": "quests/side-act1-rogue-merc-unlock",
    "name": "Kashya's Recruit",
    "type": "side",
    "actId": "acts/act1",
    "giver": "npc/kashya",
    "description": "Defeat Blood Raven and return to Kashya. In Normal, explicitly enlist a Rogue Scout — Trainee, then separately Claim one-time ensure-owned support in your journal.",
    "objectives": [
      {
        "id": "obj-hire",
        "type": "hire-mercenary",
        "mercId": "mercs/act1-rogue-trainee",
        "description": "Enlist or re-enlist a Rogue Scout — Trainee at Kashya."
      }
    ],
    "rewards": {
      "mercenaryUnlock": "mercs/act1-rogue-trainee"
    },
    "prerequisites": [
      "quests/act1-sisters-burial-grounds"
    ]
  },
  {
    "id": "quests/side-act2-greiz-merc-roster",
    "name": "Greiz's Roster",
    "type": "side",
    "actId": "acts/act2",
    "giver": "npc/greiz",
    "description": "After completing Radament's Lair, heroes of level 12 or higher can explicitly enlist a Desert Merc — Blessed Aim at Greiz in Normal. Separately Claim one-time ensure-owned support in your journal.",
    "objectives": [
      {
        "id": "obj-hire",
        "type": "hire-mercenary",
        "mercId": "mercs/act2-blessed-aim",
        "description": "Enlist or re-enlist a Desert Merc — Blessed Aim at Greiz."
      }
    ],
    "rewards": {
      "mercenaryUnlock": "mercs/act2-blessed-aim"
    },
    "prerequisites": [
      "quests/act2-radaments-lair"
    ]
  },
  {
    "id": "quests/side-act3-asheara-merc",
    "name": "Asheara's Iron Wolves",
    "type": "side",
    "actId": "acts/act3",
    "giver": "npc/asheara",
    "description": "With Act III unlocked, heroes of level 18 or higher can explicitly enlist an Iron Wolf — Frozen Armor at Asheara in Normal. Separately Claim one-time ensure-owned support in your journal.",
    "objectives": [
      {
        "id": "obj-hire",
        "type": "hire-mercenary",
        "mercId": "mercs/act3-iron-wolf-frozen-armor",
        "description": "Enlist or re-enlist an Iron Wolf — Frozen Armor at Asheara."
      }
    ],
    "rewards": {
      "mercenaryUnlock": "mercs/act3-iron-wolf-frozen-armor"
    }
  }
] as const);

/** Accepted actual30 authority; live quest/family catalogs cannot reinterpret it. */
export const FROZEN_V30: FrozenNativeQuestDomain = Object.freeze({ ...FROZEN_V29,
  quests: Object.freeze(FROZEN_V29.quests.map(quest =>
    acceptedTownQuests.find(row => row.id === quest.id) ?? quest)),
  townEnlistments: deepFreeze([
    { quest: 'quests/side-act1-rogue-merc-unlock', objective: 'obj-hire',
      proof: 'quests/side-act1-rogue-merc-unlock#action:enlist-recruit',
      prerequisite: { quest: 'quests/act1-sisters-burial-grounds',
        objectiveIds: ['obj-kill-blood-raven', 'obj-return'] } },
    { quest: 'quests/side-act2-greiz-merc-roster', objective: 'obj-hire',
      proof: 'quests/side-act2-greiz-merc-roster#action:enlist-recruit',
      prerequisite: { quest: 'quests/act2-radaments-lair', objectiveIds: ['obj-kill-radament'] } },
    { quest: 'quests/side-act3-asheara-merc', objective: 'obj-hire',
      proof: 'quests/side-act3-asheara-merc#action:enlist-recruit' }
  ] as const) });
/** Actual30 retains accepted29 bases; full equality is proved before live widening. */
export const FROZEN_V30_ITEM_BASES = FROZEN_V29_ITEM_BASES;
