import { hasCountedQuestClaimedConsumption, type CountedQuestDomain,
  type CountedQuestProgress } from '../map/counted-quest';
import type { QuestItemLedger } from '../types/save';

/** Resolve Malah's one-use effective Vitality from explicit physical quest authority. */
export function resolveQuestVitalityBonus(progress: CountedQuestProgress, items: QuestItemLedger,
  domains: readonly CountedQuestDomain[]): number {
  const malah = domains.find(domain => domain.key === 'malah');
  return malah && hasCountedQuestClaimedConsumption(progress, items, malah) ? 10 : 0;
}
