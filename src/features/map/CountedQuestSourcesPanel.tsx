import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCombatStore, useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { Button, tDataKey } from '@/ui';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { areaCountedQuestSources, countedQuestCounters, countedSourceStatus,
  recoverCountedQuestSource } from '@/features/quests/countedQuestActions';

/** Named finite ingredient finds; discovery and rendering never recover an item. */
export function CountedQuestSourcesPanel({ act, areaId }: { act: number; areaId: string }) {
  const { t } = useTranslation(['quests', 'inventory']);
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
  const sources = areaCountedQuestSources(areaId).filter(({ definition }) => definition.actId === `acts/act${String(act)}`);
  if (sources.length === 0) return null;
  return <div className="w-full min-w-0 space-y-3" data-testid="counted-quest-sources">
    {sources.map(({ definition, placement, ordinal }) => {
      const status = countedSourceStatus(placement.source);
      const counts = countedQuestCounters(definition.key);
      const item = tDataKey(t, definition.nameKey);
      return <div key={placement.source} className="min-w-0 space-y-2 break-words border-t border-d2-border pt-3">
        {ordinal === 1 && <>
          <p className="text-sm text-d2-white/90">{tDataKey(t, definition.descKey)}</p>
          <p role="status" aria-live="polite" className="text-sm text-d2-gold"
            data-testid={`counted-area-progress-${definition.key}`}>{t('counted.progress', { ...counts })}</p>
        </>}
        <h3 className="d2-section-title font-semibold text-d2-white">{t('counted.find', { item, number: ordinal })}</h3>
        <p role="status" className="text-sm text-d2-white/90">{t(`counted.status.${status}`)}</p>
        <Button type="button" variant="primary" className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal break-words"
          data-testid={`counted-recover-${placement.targetId}`} disabled={status !== 'available'} onClick={() => {
            try {
              const result = recoverCountedQuestSource(placement.source);
              setFailure(result === 'ok' || result === 'already-recovered' ? null : result);
            } catch (error) {
              if (error instanceof AggregateError) setFailure('restoration-failed');
              else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFailure('busy');
              else throw error;
            }
          }}>{t('counted.recover', { item, number: ordinal })}</Button>
      </div>;
    })}
    {failure && <p role="alert" className="text-sm text-d2-white/90">{t(`counted.status.${failure}`)}</p>}
  </div>;
}
