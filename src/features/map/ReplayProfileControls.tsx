import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { canSelectReplayProfile, selectReplayProfile, type ReplayProfileResult } from './replayProfile';
import { useCombatStore, useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { Button, Panel } from '@/ui';

function feedbackContext() {
  const inventory = useInventoryStore.getState(), combat = useCombatStore.getState();
  return {
    map: useMapStore.getState(), items: inventory.questItems, services: inventory.questServices,
    player: usePlayerStore.getState().player, status: useHydrationStore.getState().status,
    inCombat: combat.inCombat, runId: combat.subAreaRunId
  };
}

interface Feedback {
  result: ReplayProfileResult | 'restoration-failed' | 'busy';
  context: ReturnType<typeof feedbackContext>;
}

/** Selects a source-authorized replay profile through the guarded runtime API. */
export function ReplayProfileControls() {
  const { t } = useTranslation('map');
  // The pure authority reads the full campaign graph, including endgame and reciprocal item/service sources.
  const map = useMapStore(state => state);
  const items = useInventoryStore(state => state.questItems);
  const services = useInventoryStore(state => state.questServices);
  const player = usePlayerStore(state => state.player);
  const status = useHydrationStore(state => state.status);
  const inCombat = useCombatStore(state => state.inCombat);
  const runId = useCombatStore(state => state.subAreaRunId);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const requirementId = useId();
  const nightmareRequirementId = `${requirementId}-nightmare`;
  const hellRequirementId = `${requirementId}-hell`;
  const nightmareOwned = canSelectReplayProfile('nightmare');
  const hellOwned = canSelectReplayProfile('hell');
  const ready = status === 'ready' && player !== null && !inCombat && runId === null;
  const feedbackCurrent = feedback !== null && feedback.context.map === map && feedback.context.items === items &&
    feedback.context.services === services && feedback.context.player === player && feedback.context.status === status &&
    feedback.context.inCombat === inCombat && feedback.context.runId === runId;
  const result = feedbackCurrent ? feedback.result : null;

  return <Panel title={t('replay.title')} className="min-w-0" data-testid="replay-profile-controls">
    <p className="mb-3 break-words text-sm text-d2-white/90">{t('replay.description')}</p>
    <p className="mb-3 break-words text-sm text-d2-white/80">{t('replay.levelScaling')}</p>
    <div className="flex flex-wrap gap-2" role="group" aria-label={t('replay.title')}>
      {(['normal', 'nightmare', 'hell'] as const).map(value => <Button key={value} type="button"
        variant={map.selectedDifficulty === value ? 'primary' : 'secondary'} aria-pressed={map.selectedDifficulty === value}
        disabled={!ready || !canSelectReplayProfile(value)}
        aria-describedby={value === 'hell' ? hellRequirementId : value === 'nightmare' && !nightmareOwned ? nightmareRequirementId : undefined}
        className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal break-words focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-d2-gold"
        data-testid={`replay-profile-${value}`} onClick={() => {
          let result: Feedback['result'];
          try { result = selectReplayProfile(value); }
          catch (error) {
            if (error instanceof AggregateError) result = 'restoration-failed';
            else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) result = 'busy';
            else throw error;
          }
          // Capture after publication/recovery, so success and recovery errors survive their own store changes.
          setFeedback({ result, context: feedbackContext() });
        }}>{t(`replay.${value}`)}</Button>)}
    </div>
    {!nightmareOwned && <p id={nightmareRequirementId} className="mt-3 break-words text-sm text-d2-white/80">{t('replay.locked')}</p>}
    <p id={hellRequirementId} className="mt-3 break-words text-sm text-d2-white/80">{t('replay.hellRequirement')}</p>
    {hellOwned && <p className="mt-3 break-words text-sm text-d2-white/80">{t('replay.hellMaterials')}</p>}
    <p role="status" aria-live="polite" className="mt-3 break-words text-sm text-d2-gold">
      {result && result !== 'ok' ? t(`replay.feedback.${result}`) : t('replay.selected', { profile: t(`replay.${map.selectedDifficulty}`) })}
    </p>
  </Panel>;
}
