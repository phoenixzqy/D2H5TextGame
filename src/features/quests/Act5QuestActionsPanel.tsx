import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { areaAct5QuestActions, npcAct5QuestActions, act5QuestActionStatus, executeAct5QuestAction, rescuedBarbarianCount } from './act5QuestActions';
import { useInventoryStore, useMapStore } from '@/stores';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { Button } from '@/ui';

type Context = { act: number; areaId: string; npcId?: never } | { npcId: string; act?: never; areaId?: never };

/** Authored Act V interactions. Rendering and opening a conversation never execute an action. */
export function Act5QuestActionsPanel(context: Context) {
  const { t } = useTranslation('quests');
  useMapStore(state => state.questProgress);
  useMapStore(state => state.questReceipts);
  useMapStore(state => state.clearedSubAreas);
  useMapStore(state => state.currentAct);
  useMapStore(state => state.currentSubAreaId);
  useMapStore(state => state.selectedDifficulty);
  useInventoryStore(state => state.questItems);
  const [feedback, setFeedback] = useState<string | null>(null);
  const actions = context.npcId !== undefined ? npcAct5QuestActions(context.npcId)
    : areaAct5QuestActions(context.act, context.areaId);
  if (actions.length === 0) return null;
  return <div className="w-full min-w-0 space-y-3" data-testid="act5-quest-actions">
    {actions.some(action => action.kind === 'cage') && <p role="status" className="text-sm text-d2-gold">{t('act5RescueCount', { count: rescuedBarbarianCount() })}</p>}
    {actions.map(action => {
      const status = act5QuestActionStatus(action.receiptSource);
      const key = `areaObjects.actions.${action.id.replace(/^actions\//, '')}`;
      return <div key={action.receiptSource} className="min-w-0 space-y-2 break-words border-t border-d2-border pt-3">
        <h3 className="font-semibold text-d2-white">{t(`${key}.name`)}</h3>
        <p className="text-sm text-d2-white/90">{t(`${key}.description`)}</p>
        <p role="status" aria-live="polite" className="text-sm text-d2-white/90">{t(`${key}.${status}`)}</p>
        <Button type="button" variant="primary" className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal break-words"
          data-testid={`quest-action-${action.id}`} disabled={status !== 'ready'} onClick={() => {
            try { setFeedback(executeAct5QuestAction(action.receiptSource)); }
            catch (error) {
              if (error instanceof AggregateError) setFeedback('restoration-failed');
              else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFeedback('busy');
              else throw error;
            }
          }}>{t(`${key}.action`)}</Button>
      </div>;
    })}
    {feedback && <p role="status" aria-live="polite" className="text-sm text-d2-white/90">{t(`act5Feedback.${feedback}`)}</p>}
  </div>;
}
