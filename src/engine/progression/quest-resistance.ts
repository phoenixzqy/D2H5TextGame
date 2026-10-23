import { loadQuests } from '@/data/loaders/quests';
import type { QuestProgressData } from '../types/save';

export type QuestProgressContext = Readonly<Record<string, QuestProgressData>>;
export const TAINTED_SUN_QUEST_ID = 'quests/act2-tainted-sun';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

/** Require the character's own canonical altar completion, independently of Claim. */
export function hasTaintedSunCompletion(progress: QuestProgressContext): boolean {
  if (!Object.hasOwn(progress, TAINTED_SUN_QUEST_ID)) return false;
  const row: unknown = progress[TAINTED_SUN_QUEST_ID];
  return isRecord(row) && Object.hasOwn(row, 'id') && row.id === TAINTED_SUN_QUEST_ID
    && Object.hasOwn(row, 'status') && row.status === 'completed'
    && Object.hasOwn(row, 'objectives') && isRecord(row.objectives)
    && Object.hasOwn(row.objectives, 'obj-destroy-altar')
    && row.objectives['obj-destroy-altar'] === true;
}

/** A valid claimed altar row is the sole permanent resistance entitlement. */
export function hasTaintedSunEntitlement(progress: QuestProgressContext): boolean {
  const row = progress[TAINTED_SUN_QUEST_ID];
  return hasTaintedSunCompletion(progress) && row !== undefined
    && Object.hasOwn(row, 'rewardClaimed') && row.rewardClaimed === true;
}

/** Closed executable stat shape; other historical stat rewards stay unsupported. */
export function isQuestResistanceReward(value: unknown): value is { fire_resist: number; cold_resist: number } {
  if (value === null || typeof value !== 'object' || Object.keys(value).length !== 2) return false;
  return ['fire_resist', 'cold_resist'].every(key => Object.hasOwn(value, key)
    && typeof Reflect.get(value, key) === 'number'
    && Number.isSafeInteger(Reflect.get(value, key)) && Reflect.get(value, key) >= 0);
}

/** Resolve authored bonuses from explicit immutable character progress, never cached stats. */
export function resolveQuestResistanceBonus(progress: QuestProgressContext): { fire: number; cold: number } {
  if (!hasTaintedSunEntitlement(progress)) return { fire: 0, cold: 0 };
  const reward = loadQuests().find(quest => quest.id === TAINTED_SUN_QUEST_ID)?.rewards?.stat;
  if (!isQuestResistanceReward(reward)) throw new Error('Invalid Tainted Sun resistance reward');
  return { fire: reward.fire_resist, cold: reward.cold_resist };
}
