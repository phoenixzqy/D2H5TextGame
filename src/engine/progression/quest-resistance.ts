import { loadQuestItems } from '@/data/loaders/quest-items';
import { RESCUE_QUEST, PRISON_QUEST } from '../map/act5-admission';
import { hasAct5Completion, READ_PROOF, SCROLL_SOURCE } from '../save/act5-state';
import type { QuestItemLedger, QuestActionReceipts } from '../types/save';
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

/** Actual Act V sources compose once across every canonical equipment/stat projection. */
export function resolveAct5ResistanceBonus(progress: QuestProgressContext, items: QuestItemLedger,
  receipts: QuestActionReceipts): number {
  const rescue = progress[RESCUE_QUEST];
  const direct = rescue?.rewardClaimed === true && hasAct5Completion(RESCUE_QUEST, progress, receipts, items)
    ? loadQuests().find(quest => quest.id === RESCUE_QUEST)?.rewards?.stat : undefined;
  let amount = 0;
  if (direct !== undefined) {
    if (direct === null || typeof direct !== 'object' || Object.keys(direct).length !== 1 ||
      !Object.hasOwn(direct, 'all_resist') || Reflect.get(direct, 'all_resist') !== 5) {
      throw new Error('Invalid Rescue resistance reward');
    }
    amount += 5;
  }
  if (Object.hasOwn(items, SCROLL_SOURCE) && items[SCROLL_SOURCE]?.itemId === 'items/scroll_of_resist' &&
    items[SCROLL_SOURCE].state === 'consumed' && Object.hasOwn(receipts, READ_PROOF) &&
    progress[PRISON_QUEST]?.rewardClaimed === true && hasAct5Completion(PRISON_QUEST, progress, receipts, items)) {
    const scroll = loadQuestItems().find(item => item.id === 'items/scroll_of_resist');
    if (!scroll || scroll.kind !== undefined || scroll.effect.allResist !== 10) throw new Error('Invalid resistance scroll effect');
    amount += scroll.effect.allResist;
  }
  return amount;
}
