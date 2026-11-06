import { loadQuests } from '@/data/loaders/quests';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { NIHLATHAK } from '@/engine/map/nihlathak-quest';

/** Fail closed when the authored relic source or exact unique reward changes. */
export function hasCanonicalNihlathakDefinition(): boolean {
  try {
    const quest = loadQuests().find(row => row.id === NIHLATHAK.quest);
    const item = loadQuestItems().find(row => row.id === NIHLATHAK.itemId);
    const objective = quest?.objectives[0], drop = quest?.rewards?.itemDrop;
    return quest?.type === 'side' && quest.actId === NIHLATHAK.actId && quest.giver === NIHLATHAK.npc &&
      quest.objectives.length === 1 && objective?.id === NIHLATHAK.objective && objective.type === 'fetch' &&
      objective.itemId === NIHLATHAK.itemId && objective.areaId === NIHLATHAK.areaId && objective.targetId === NIHLATHAK.targetId &&
      quest.objectiveStages === undefined && quest.prerequisites === undefined && quest.unlocks === undefined &&
      quest.rewards !== undefined && Object.keys(quest.rewards).length === 3 &&
      Object.hasOwn(quest.rewards, 'wishstones') && quest.rewards.wishstones === 10 &&
      Object.hasOwn(quest.rewards, 'xp') && quest.rewards.xp === 12000 && Object.hasOwn(quest.rewards, 'itemDrop') &&
      typeof drop === 'object' && drop !== null && Object.keys(drop).length === 2 &&
      Object.hasOwn(drop, 'uniqueId') && 'uniqueId' in drop && drop.uniqueId === 'items/unique/mara-kaleidoscope' &&
      Object.hasOwn(drop, 'ilvl') && 'ilvl' in drop && drop.ilvl === 82 &&
      item?.kind === 'tool' && item.sourceQuestId === NIHLATHAK.quest &&
      item.sourceObjectiveId === NIHLATHAK.objective && questItemSource(item) === NIHLATHAK.source;
  } catch { return false; }
}
