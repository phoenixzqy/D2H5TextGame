import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/ui';
import { COW } from '@/engine/map/cow-quest';
import { useCombatStore, useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { recoverQuestTool, type RecoverToolResult } from './interactObject';
import { canSelectCowEncounter, cowQuestStage, cowRecoveryStatus, cowTomeStatus, cowTransmuteStatus,
  receiveCowTome, transmuteCowPortal, travelToCowEncounter, type CowActionResult } from './cowQuestActions';

type Context = 'map' | 'town' | 'journal';
type Feedback = CowActionResult | RecoverToolResult | 'busy' | 'restoration-failed' | 'refused';

/** Localized consumers of finite Cow actions; rendering never creates source proof. */
export function CowQuestActionsPanel({ context }: { context: Context }) {
  const { t } = useTranslation(['quests', 'inventory']);
  const navigate = useNavigate();
  useInventoryStore(state => state.questItems);
  useMapStore(state => state.questProgress);
  useMapStore(state => state.questReceipts);
  useMapStore(state => state.currentAct);
  useMapStore(state => state.currentSubAreaId);
  useMapStore(state => state.selectedDifficulty);
  useMapStore(state => state.clearedSubAreas);
  usePlayerStore(state => state.player);
  useCombatStore(state => state.inCombat);
  useHydrationStore(state => state.status);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const stage = cowQuestStage();
  const recovery = cowRecoveryStatus();
  const tome = cowTomeStatus();
  const transmute = cowTransmuteStatus();
  const available = canSelectCowEncounter();
  const run = (action: () => CowActionResult | RecoverToolResult): void => {
    try { setFeedback(action()); }
    catch (error) {
      if (error instanceof AggregateError) setFeedback('restoration-failed');
      else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFeedback('busy');
      else throw error;
    }
  };
  const enter = (): void => {
    try {
      if (!travelToCowEncounter()) { setFeedback('refused'); return; }
      setFeedback(null);
      navigate(`/combat?questEncounter=${COW.encounter}`);
    } catch (error) {
      if (error instanceof AggregateError) setFeedback('restoration-failed');
      else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFeedback('busy');
      else throw error;
    }
  };
  const buttonClass = 'min-h-[44px] min-w-[44px] max-w-full whitespace-normal break-words';
  return <section className="w-full min-w-0 space-y-3 break-words border-t border-d2-border pt-3"
    data-testid={`cow-quest-panel-${context}`} aria-label={t('cow.name')}>
    <h3 className="d2-section-title font-semibold text-d2-white">{t('cow.name')}</h3>
    <p role="status" aria-live="polite" className="text-sm text-d2-gold" data-testid="cow-stage">{t(`cow.stage.${stage}`)}</p>
    {context === 'map' && <div className="space-y-2">
      <h4 className="d2-section-title font-semibold text-d2-white">{t('cow.remains')}</h4>
      <p className="text-sm text-d2-white/90">{t('cow.remainsDescription')}</p>
      <p role="status" className="text-sm text-d2-white/90">{t(`cow.source.${recovery}`)}</p>
      <Button type="button" variant="primary" className={buttonClass} data-testid="cow-recover-leg"
        disabled={recovery !== 'ready'} onClick={() => { run(() => recoverQuestTool(COW.legSource)); }}>{t('cow.recover')}</Button>
    </div>}
    {context === 'town' && <div className="space-y-3">
      <p className="text-sm text-d2-white/90">{t('cow.ingredients', {
        leg: t('inventory:questItems.wirtsLeg.name'), tome: t('inventory:questItems.cowPortalTome.name'),
        cube: t('inventory:questItems.horadricCube.name')
      })}</p>
      <div className="space-y-2">
        <p role="status" className="text-sm text-d2-white/90">{t(`cow.source.${tome}`)}</p>
        <Button type="button" variant="primary" className={buttonClass} data-testid="cow-receive-tome"
          disabled={tome !== 'ready'} onClick={() => { run(receiveCowTome); }}>{t('cow.receive')}</Button>
      </div>
      <Button type="button" variant="primary" className={buttonClass} data-testid="cow-transmute"
        disabled={transmute !== 'ready'} onClick={() => { run(transmuteCowPortal); }}>{t('cow.transmute')}</Button>
    </div>}
    {stage === 'portal-open' && <div className="space-y-2">
      <p className="text-sm text-d2-white/90">{t('cow.retry')}</p>
      <Button type="button" variant="primary" className={buttonClass} data-testid="cow-enter-portal"
        disabled={!available} onClick={enter}>{t('cow.enter')}</Button>
    </div>}
    {feedback && <p role={feedback === 'ok' ? 'status' : 'alert'} className="text-sm text-d2-white/90">
      {t(`cow.feedback.${feedback}`)}
    </p>}
  </section>;
}
