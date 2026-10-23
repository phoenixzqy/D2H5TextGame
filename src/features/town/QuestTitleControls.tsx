import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { selectQuestTitle } from '@/features/quests/questTitles';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { useMapStore } from '@/stores';
import { Button, Panel } from '@/ui';

/** An earned title changes only the displayed nameplate. */
export function QuestTitleControls() {
  const { t } = useTranslation('town');
  const owned = useMapStore(state => state.questTitles);
  const selected = useMapStore(state => state.selectedTitle);
  const [feedback, setFeedback] = useState<string | null>(null);
  if (owned['titles/slayer_of_baal'] !== true) return null;
  return <Panel title={t('titles.title')} data-testid="quest-title-controls">
    <p className="mb-3 text-sm text-d2-white/90">{t('titles.description')}</p>
    <div role="group" aria-label={t('titles.title')} className="flex flex-wrap gap-2">
      {([null, 'titles/slayer_of_baal'] as const).map(title => <Button key={title ?? 'none'} type="button"
        variant={selected === title ? 'primary' : 'secondary'} aria-pressed={selected === title}
        className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal"
        data-testid={title ? 'quest-title-slayer' : 'quest-title-none'} onClick={() => {
          try { setFeedback(selectQuestTitle(title)); }
          catch (error) {
            if (error instanceof AggregateError) setFeedback('restoration-failed');
            else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFeedback('busy');
            else throw error;
          }
        }}>
        {t(title ? 'titles.slayer' : 'titles.none')}
      </Button>)}
    </div>
    {feedback && <p role="status" aria-live="polite" className="mt-3 text-sm text-d2-gold">{t(`services.feedback.${feedback}`)}</p>}
  </Panel>;
}
