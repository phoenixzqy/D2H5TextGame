import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui';
import { useMapStore } from '@/stores/mapStore';
import { subAreas } from '@/data/index';
import { loadQuests } from '@/data/loaders/quests';
import { objectInteractionStatus } from '@/engine/map/questInteractions';
import { areaObjectTargets, interactWithAreaObject, type ObjectActionResult } from '@/features/quests/interactObject';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';

interface Props { act: number; areaId: string; onClose: () => void }

/** Reusable authored area objects; rendering/opening never emits an interaction. */
export function AreaObjectsPanel({ act, areaId, onClose }: Props) {
  const { t } = useTranslation(['quests', 'common']);
  const progress = useMapStore(state => state.questProgress);
  const [failure, setFailure] = useState<ObjectActionResult | 'busy' | null>(null);
  return (
    <section id="area-objects" data-testid="area-object-panel" aria-labelledby="area-objects-title"
      className="w-full min-w-0 rounded border border-d2-border bg-d2-bg/60 p-3 space-y-3">
      <h2 id="area-objects-title" className="text-d2-gold font-serif">{t('areaObjects.title')}</h2>
      {areaObjectTargets(act, areaId).map(targetId => {
        const status = objectInteractionStatus(loadQuests(), subAreas, progress,
          { actId: `acts/act${String(act)}`, areaId, targetId });
        const key = `areaObjects.objects.${targetId.replace(/^objects\//, '')}`;
        return (
          <div key={targetId} className="space-y-2">
            <h3 className="text-d2-white font-semibold">{t(`${key}.name`)}</h3>
            <p role="status" className="text-sm text-d2-white/90">
              {status === 'completed' || status === 'claimed' ? t(`${key}.${status}`) : t(`areaObjects.${status}`)}
            </p>
            {(status === 'completed' || status === 'claimed') && (
              <p data-testid="area-object-excerpt" className="text-sm text-d2-white/90 break-words">{t(`${key}.excerpt`)}</p>
            )}
            <Button variant="primary" className="min-h-[44px] min-w-[44px]"
              disabled={status !== 'ready'} onClick={() => {
                try {
                  const result = interactWithAreaObject(targetId);
                  setFailure(result === 'ok' || result === 'already-read' ? null : result);
                } catch (error) {
                  if (!(error instanceof WaveGuardError || error instanceof RecordedWaveAccessError)) throw error;
                  setFailure('busy');
                }
              }}>{t('areaObjects.read')}</Button>
          </div>
        );
      })}
      {failure && <p role="alert" className="text-sm text-d2-white/90">{t(`areaObjects.feedback.${failure}`)}</p>}
      <Button variant="secondary" className="min-h-[44px] min-w-[44px]" data-testid="area-object-close"
        onClick={onClose}>{t('common:close')}</Button>
    </section>
  );
}
