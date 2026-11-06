import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCombatStore, useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { Button } from '@/ui';
import { countedJadeGiveStatus, countedQuestCounters, giveCountedJade } from '@/features/quests/countedQuestActions';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';

/** Explicit Meshif hand-in; opening this panel grants and consumes nothing. */
export function CountedJadeDeliveryPanel() {
  const { t } = useTranslation('quests');
  useInventoryStore(state => state.questItems);
  useMapStore(state => state.questProgress);
  useMapStore(state => state.currentAct);
  useMapStore(state => state.currentSubAreaId);
  useMapStore(state => state.selectedDifficulty);
  useMapStore(state => state.clearedSubAreas);
  usePlayerStore(state => state.player);
  useCombatStore(state => state.inCombat);
  useHydrationStore(state => state.status);
  const [failure, setFailure] = useState<string | null>(null);
  const status = countedJadeGiveStatus();
  const counts = countedQuestCounters('jade');
  return <div className="w-full min-w-0 space-y-2 break-words border-t border-d2-border pt-3" data-testid="counted-jade-delivery">
    <h4 className="font-serif text-d2-gold">{t('counted.jade.title')}</h4>
    <p className="text-sm text-d2-white/90">{t('counted.jade.description')}</p>
    <p role="status" aria-live="polite" className="text-sm text-d2-gold">{t('counted.progress', { ...counts })}</p>
    <p role="status" className="text-sm text-d2-white/90">{t(`counted.status.${status}`)}</p>
    <Button type="button" variant="primary" className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal break-words"
      data-testid="counted-jade-give" disabled={status !== 'available'} onClick={() => {
        try {
          const result = giveCountedJade();
          setFailure(result === 'ok' || result === 'already-delivered' ? null : result);
        } catch (error) {
          if (error instanceof AggregateError) setFailure('restoration-failed');
          else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFailure('busy');
          else throw error;
        }
      }}>{t('counted.jade.give')}</Button>
    {failure && <p role="alert" className="text-sm text-d2-white/90">{t(`counted.status.${failure}`)}</p>}
  </div>;
}
