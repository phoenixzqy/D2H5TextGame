import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui';
import { useInventoryStore } from '@/stores/inventoryStore';
import { questItemSource } from '@/data/loaders/quest-items';
import { useMapStore } from '@/stores/mapStore';
import { subAreas } from '@/data/index';
import { loadQuests } from '@/data/loaders/quests';
import { objectInteractionStatus } from '@/engine/map/questInteractions';
import { areaObjectTargets, areaQuestTools, questToolStatus, recoverQuestTool, interactWithAreaObject, type RecoverToolResult } from '@/features/quests/interactObject';
import { areaQuestInsertions, questInsertionStatus, insertQuestItem, type QuestCraftingResult } from '@/features/quests/questCrafting';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';

interface Props { act: number; areaId: string; onClose: () => void }

/** Reusable authored area objects; rendering/opening never emits an interaction. */
export function AreaObjectsPanel({ act, areaId, onClose }: Props) {
  const { t } = useTranslation(['quests', 'common', 'inventory']);
  const progress = useMapStore(state => state.questProgress);
  useMapStore(state => state.clearedSubAreas);
  useInventoryStore(state => state.questItems);
  const [failure, setFailure] = useState<RecoverToolResult | QuestCraftingResult | 'busy' | 'restoration-failed' | null>(null);
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
              {t(`${key}.${status}`, { defaultValue: t(`areaObjects.${status}`) })}
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
              }}>{t(`${key}.action`, { defaultValue: t('areaObjects.read') })}</Button>
          </div>
        );
      })}
      {areaQuestInsertions(act, areaId).map(item => {
        const source = questItemSource(item), status = questInsertionStatus(source);
        return (
          <div key={source} className="space-y-2">
            <h3 className="text-d2-white font-semibold">{t('areaObjects.orifice.name')}</h3>
            <p role="status" className="text-sm text-d2-white/90">{t(`areaObjects.orifice.${status}`)}</p>
            <Button variant="primary" className="min-h-[44px] min-w-[44px]" disabled={status !== 'ready'} onClick={() => {
              try {
                const result = insertQuestItem(source);
                setFailure(result === 'ok' || result === 'already-consumed' ? null : result);
              } catch (error) {
                if (error instanceof AggregateError) setFailure('restoration-failed');
                else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFailure('busy');
                else throw error;
              }
            }}>{t('areaObjects.orifice.insert')}</Button>
          </div>
        );
      })}
      {areaQuestTools(act, areaId).map(tool => {
        const source = questItemSource(tool), status = questToolStatus(source);
        const key = `areaObjects.tools.${tool.id.replace(/^quest\//, '')}`;
        return (
          <div key={source} className="min-w-0 space-y-2 break-words">
            <h3 className="text-d2-white font-semibold">{t(tool.kind === 'delivery' ? tool.nameKey : `${key}.name`)}</h3>
            {tool.kind === 'delivery' && <p className="text-sm text-d2-white/90">{t(tool.descKey)}</p>}
            <p role="status" className="text-sm text-d2-white/90">
              {t(tool.kind === 'delivery' ? `areaObjects.delivery.${status}` : `${key}.${status}`)}
            </p>
            <Button variant="primary" className="min-h-[44px] min-w-[44px]"
              disabled={status !== 'ready'} onClick={() => {
                try {
                  const result = recoverQuestTool(source);
                  setFailure(result === 'ok' || result === 'already-owned' ? null : result);
                } catch (error) {
                  if (error instanceof AggregateError) setFailure('restoration-failed');
                  else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFailure('busy');
                  else throw error;
                }
              }}>{t('areaObjects.recover')}</Button>
          </div>
        );
      })}
      {failure && <p role="alert" className="text-sm text-d2-white/90">{t(`areaObjects.feedback.${failure}`)}</p>}
      <Button variant="secondary" className="min-h-[44px] min-w-[44px]" data-testid="area-object-close"
        onClick={onClose}>{t('common:close')}</Button>
    </section>
  );
}
