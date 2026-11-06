import { loadQuests } from '@/data/loaders/quests';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { DROGNAN } from '@/engine/map/drognan-quest';

/** Fail closed when Drognan's authored physical source or numeric reward changes. */
export function hasCanonicalDrognanDefinition(): boolean {
  try {
    const quest = loadQuests().find(row => row.id === DROGNAN.quest);
    const item = loadQuestItems().find(row => row.id === DROGNAN.itemId);
    const objective = quest?.objectives[0];
    return quest?.type === 'side' && quest.actId === DROGNAN.actId && quest.giver === DROGNAN.npc &&
      quest.objectives.length === 1 && objective?.id === DROGNAN.objective && objective.type === 'fetch' &&
      objective.itemId === DROGNAN.itemId && objective.areaId === DROGNAN.areaId && objective.targetId === DROGNAN.targetId &&
      quest.objectiveStages === undefined && quest.prerequisites === undefined && quest.unlocks === undefined &&
      quest.rewards !== undefined && Object.keys(quest.rewards).length === 3 &&
      Object.hasOwn(quest.rewards, 'wishstones') && quest.rewards.wishstones === 10 &&
      Object.hasOwn(quest.rewards, 'xp') && quest.rewards.xp === 4000 &&
      Object.hasOwn(quest.rewards, 'skillPoints') && quest.rewards.skillPoints === 1 &&
      item?.kind === 'tool' && item.sourceQuestId === DROGNAN.quest &&
      item.sourceObjectiveId === DROGNAN.objective && questItemSource(item) === DROGNAN.source;
  } catch { return false; }
}
