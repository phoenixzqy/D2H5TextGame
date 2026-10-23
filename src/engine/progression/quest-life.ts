import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { loadQuests } from '@/data/loaders/quests';
import type { QuestItemLedger } from '../types/save';
import type { QuestProgressContext } from './quest-resistance';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

/** Resolve permanent Life only from a consumed reward and its actual completed hand-in graph. */
export function resolveQuestLifeBonus(progress: QuestProgressContext, ledger: QuestItemLedger): number {
  if (!Object.values(ledger).some(entry => entry.state === 'consumed')) return 0;
  const definitions = loadQuestItems();
  const quests = loadQuests();
  let bonus = 0;
  for (const item of definitions) {
    if (item.kind !== undefined || item.effect.maxLife === undefined) continue;
    const source = questItemSource(item);
    const entry = Object.hasOwn(ledger, source) ? ledger[source] : undefined;
    const row = Object.hasOwn(progress, item.sourceQuestId) ? progress[item.sourceQuestId] : undefined;
    const quest = quests.find(quest => quest.id === item.sourceQuestId);
    if (!entry || !Object.hasOwn(entry, 'itemId') || !Object.hasOwn(entry, 'state') ||
      entry.itemId !== item.id || entry.state !== 'consumed' || !row || !quest ||
      !Object.hasOwn(row, 'id') || !Object.hasOwn(row, 'status') || !Object.hasOwn(row, 'rewardClaimed') ||
      !Object.hasOwn(row, 'objectives') || !isRecord(row.objectives) ||
      row.id !== quest.id || row.status !== 'completed' || row.rewardClaimed !== true ||
      !quest.objectives.every(objective => Object.hasOwn(row.objectives, objective.id) && row.objectives[objective.id] === true) ||
      !quest.objectives.filter(objective => objective.type === 'give').every(objective => {
        const input = definitions.find(input => input.kind === 'delivery' &&
          input.sourceQuestId === quest.id && input.consumeObjectiveId === objective.id);
        if (!input) return false;
        const inputSource = questItemSource(input);
        const receipt = Object.hasOwn(ledger, inputSource) ? ledger[inputSource] : undefined;
        return receipt !== undefined && Object.hasOwn(receipt, 'itemId') && Object.hasOwn(receipt, 'state') &&
          receipt.itemId === input.id && receipt.state === 'consumed';
      })) continue;
    if (!Number.isSafeInteger(item.effect.maxLife) || item.effect.maxLife <= 0 ||
      !Number.isSafeInteger(bonus + item.effect.maxLife)) throw new Error('Unsafe quest Life bonus');
    bonus += item.effect.maxLife;
  }
  return bonus;
}
