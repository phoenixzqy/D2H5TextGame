/** Permanent literal30 controls. The pre-widening equality proof is retained in the shared task packet. */
import { describe, expect, it } from 'vitest';
import { FROZEN_V29, FROZEN_V29_ITEM_BASES } from './frozen-v29';
import { FROZEN_V30, FROZEN_V30_ITEM_BASES } from './frozen-v30';

const townQuestIds = ['quests/side-act1-rogue-merc-unlock', 'quests/side-act2-greiz-merc-roster',
  'quests/side-act3-asheara-merc'];

describe('accepted literal30 authority', () => {
  it('captures the full accepted three town rows and excludes future counted authority', () => {
    expect(FROZEN_V30.quests.filter(row => townQuestIds.includes(row.id))).toEqual([
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
]);
    expect(FROZEN_V30.townEnlistments).toEqual([
      { quest: townQuestIds[0], objective: 'obj-hire', proof: `${townQuestIds[0] ?? ''}#action:enlist-recruit`,
        prerequisite: { quest: 'quests/act1-sisters-burial-grounds', objectiveIds: ['obj-kill-blood-raven', 'obj-return'] } },
      { quest: townQuestIds[1], objective: 'obj-hire', proof: `${townQuestIds[1] ?? ''}#action:enlist-recruit`,
        prerequisite: { quest: 'quests/act2-radaments-lair', objectiveIds: ['obj-kill-radament'] } },
      { quest: townQuestIds[2], objective: 'obj-hire', proof: `${townQuestIds[2] ?? ''}#action:enlist-recruit` }
    ]);
    expect(Object.hasOwn(FROZEN_V30, 'countedSources')).toBe(false);
  });
  it('retains all other literal29 quest, source, campaign and item-base authorities', () => {
    expect(FROZEN_V30.quests.filter(row => !townQuestIds.includes(row.id)))
      .toEqual(FROZEN_V29.quests.filter(row => !townQuestIds.includes(row.id)));
    const retained = Object.fromEntries(Object.entries(FROZEN_V30).filter(([key]) =>
      key !== 'quests' && key !== 'townEnlistments'));
    const previous = Object.fromEntries(Object.entries(FROZEN_V29).filter(([key]) => key !== 'quests'));
    expect(retained).toEqual(previous);
    expect(FROZEN_V30_ITEM_BASES).toEqual(FROZEN_V29_ITEM_BASES);
  });
  it('deeply freezes the full accepted town delta', () => {
    for (const value of [FROZEN_V30, FROZEN_V30.quests, FROZEN_V30.townEnlistments]) expect(Object.isFrozen(value)).toBe(true);
    for (const quest of FROZEN_V30.quests.filter(row => townQuestIds.includes(row.id))) {
      for (const value of [quest, quest.objectives, ...quest.objectives, quest.rewards,
        ...(quest.prerequisites === undefined ? [] : [quest.prerequisites])]) expect(Object.isFrozen(value)).toBe(true);
    }
    for (const domain of FROZEN_V30.townEnlistments ?? []) {
      expect(Object.isFrozen(domain)).toBe(true);
      if (domain.prerequisite) {
        expect(Object.isFrozen(domain.prerequisite)).toBe(true);
        expect(Object.isFrozen(domain.prerequisite.objectiveIds)).toBe(true);
      }
    }
  });
});
