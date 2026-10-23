import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { selectReplayProfile } from './replayProfile';
import { useMapStore } from '@/stores';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { Button, Panel } from '@/ui';

/** Selects an owned replay profile through the guarded runtime API. */
export function ReplayProfileControls() {
  const { t } = useTranslation('map');
  const profile = useMapStore(state => state.selectedDifficulty);
  const difficulties = useMapStore(state => state.questDifficulties);
  const [feedback, setFeedback] = useState<string | null>(null);
  return <Panel title={t('replay.title')} data-testid="replay-profile-controls">
    <p className="mb-3 text-sm text-d2-white/90">{t('replay.description')}</p>
    <div className="flex flex-wrap gap-2" role="group" aria-label={t('replay.title')}>
      {(['normal', 'nightmare'] as const).map(value => <Button key={value} type="button"
        variant={profile === value ? 'primary' : 'secondary'} aria-pressed={profile === value}
        disabled={value === 'nightmare' && difficulties['difficulty/nightmare'] !== true}
        className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal"
        data-testid={`replay-profile-${value}`} onClick={() => {
          try { setFeedback(selectReplayProfile(value)); }
          catch (error) {
            if (error instanceof AggregateError) setFeedback('restoration-failed');
            else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFeedback('busy');
            else throw error;
          }
        }}>{t(`replay.${value}`)}</Button>)}
    </div>
    {difficulties['difficulty/nightmare'] !== true && <p className="mt-3 text-sm text-d2-white/80">{t('replay.locked')}</p>}
    <p role="status" aria-live="polite" className="mt-3 text-sm text-d2-gold">
      {feedback ? t(`replay.feedback.${feedback}`) : t('replay.selected', { profile: t(`replay.${profile}`) })}
    </p>
  </Panel>;
}
