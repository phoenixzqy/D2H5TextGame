import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { questItemSource } from '@/data/loaders/quest-items';
import { giveQuestItem, npcQuestDeliveries, questDeliveryStatus } from '@/features/quests/questDelivery';
import type { QuestCraftingResult } from '@/features/quests/questCrafting';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { Button } from '@/ui';

/** Explicit item handover within an authored NPC conversation; opening only lists actions. */
export function QuestDeliveryPanel({ npcId }: { npcId: string }) {
  const { t } = useTranslation(['town', 'inventory', 'quests']);
  useInventoryStore(state => state.questItems);
  useMapStore(state => state.questProgress);
  useMapStore(state => state.currentAct);
  const [failure, setFailure] = useState<QuestCraftingResult | 'busy' | 'restoration-failed' | null>(null);
  const deliveries = npcQuestDeliveries(npcId);
  if (deliveries.length === 0) return null;

  return (
    <div className="w-full min-w-0 space-y-3" data-testid="quest-deliveries">
      {deliveries.map(item => {
        const source = questItemSource(item), status = questDeliveryStatus(source, npcId);
        const name = t(item.nameKey);
        return (
          <div key={source} className="w-full min-w-0 space-y-2 break-words border-t border-d2-border pt-3">
            <h4 className="font-serif text-d2-gold">{name}</h4>
            <p className="text-sm text-d2-white/90">{t(item.descKey)}</p>
            <p className="text-sm text-d2-white/90">{t('delivery.consumes', { item: name })}</p>
            <p role="status" aria-live="polite" className="text-sm text-d2-white/90">
              {t(`delivery.${status}`)}
            </p>
            <Button type="button" variant="primary" data-testid={`quest-give-${item.id}`}
              className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal break-words"
              disabled={status !== 'ready'} onClick={() => {
                try {
                  const result = giveQuestItem(source, npcId);
                  setFailure(result === 'ok' || result === 'already-consumed' ? null : result);
                } catch (error) {
                  if (error instanceof AggregateError) setFailure('restoration-failed');
                  else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFailure('busy');
                  else throw error;
                }
              }}>{t('delivery.give', { item: name })}</Button>
          </div>
        );
      })}
      {failure && <p role="alert" className="text-sm text-d2-white/90 break-words">
        {t(`quests:areaObjects.feedback.${failure}`)}
      </p>}
    </div>
  );
}
