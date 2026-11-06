import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { subAreas } from '@/data';
import { questI18nKey, type QuestDef } from '@/data/loaders/quests';
import { REGIONAL_BOUNTY_MAX_CLAIMS, type RegionalBountyDefinition } from '@/engine/map/regional-bounties';
import { useCombatStore, useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { Button, Panel, tDataKey } from '@/ui';
import { acceptRegionalBounty, canAcceptRegionalBounty, canRepeatRegionalBounty,
  regionalBountyStatus, repeatRegionalBounty, type BountyActionResult } from './bountyQuestActions';
import { canClaim, claimQuestReward } from './claimReward';

/** Journal rendering delegates all acceptance, victory and reward authority to public actions. */
export function RegionalBountyCard({ quest, definition }: {
  quest: QuestDef;
  definition: RegionalBountyDefinition;
}) {
  const { t } = useTranslation(['quests', 'maps']);
  useMapStore(state => state.questProgress);
  const entry = useMapStore(state => state.bounties[definition.quest]);
  useMapStore(state => state.clearedSubAreas);
  useInventoryStore(state => state.currencies);
  useInventoryStore(state => state.questItems);
  useMapStore(state => state.questReceipts);
  usePlayerStore(state => state.player);
  useCombatStore(state => state.inCombat);
  useHydrationStore(state => state.status);
  const [feedback, setFeedback] = useState('');
  const stage = regionalBountyStatus(quest.id);
  const slug = questI18nKey(quest.id);
  const area = subAreas.find(row => row.id === definition.area);
  const exhausted = stage === 'paid' && entry?.claims === REGIONAL_BOUNTY_MAX_CLAIMS;
  const done = stage === 'completed' || stage === 'paid';
  const run = (action: () => BountyActionResult): void => {
    try { setFeedback(t(`regionalBounty.feedback.${action()}`)); }
    catch (error) { showFailure(error); }
  };
  const showFailure = (error: unknown): void => {
    if (error instanceof AggregateError) setFeedback(t('regionalBounty.feedback.restoration-failed'));
    else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) {
      setFeedback(t('regionalBounty.feedback.busy'));
    } else throw error;
  };
  const claim = (): void => {
    try { setFeedback(t(`feedback.claim.${claimQuestReward(quest.id)}`)); }
    catch (error) { showFailure(error); }
  };
  const buttonClass = 'min-h-[44px] min-w-[44px] max-w-full whitespace-normal break-words';
  return <Panel className={`min-w-0 break-words ${done ? 'border-d2-set' : ''}`} data-testid={`quest-${quest.id}`}>
    <h3 className="font-serif text-d2-gold text-sm sm:text-base">{t(`byId.${slug}.name`, { defaultValue: quest.name })}</h3>
    <p className="mt-2 text-sm text-d2-white/90">{t(`byId.${slug}.desc`, { defaultValue: quest.description })}</p>
    <p className="mt-2 text-sm text-d2-white/90">{t('regionalBounty.source', {
      area: area ? tDataKey(t, area.name) : t('regionalBounty.unavailable')
    })}</p>
    <p role="status" aria-live="polite" className="mt-2 text-sm text-d2-gold">
      {t(stage ? `regionalBounty.stage.${stage}` : 'regionalBounty.unavailable')}
    </p>
    <div className="mt-3 text-sm">
      <p className="text-d2-white/60">{t('objectives')}</p>
      <ul className="list-disc list-inside my-1">
        {quest.objectives.map((objective, index) => <li key={objective.id} className={done ? 'text-d2-set' : ''}>
          {t(`byId.${slug}.obj${String(index + 1)}`, { defaultValue: objective.description })}
        </li>)}
      </ul>
      <p data-testid={`bounty-progress-${quest.id}`}>{t('regionalBounty.progress', { done: done ? 1 : 0 })}</p>
      <p data-testid={`bounty-claims-${quest.id}`}>{t('regionalBounty.claims', { count: entry?.claims ?? 0 })}</p>
      <p className="mt-2 text-d2-white/60">{t('rewards')}</p>
      {typeof quest.rewards?.gemShards === 'number' &&
        <p className="my-1">{quest.rewards.gemShards} {t('rewardLabel.gemShards')}</p>}
    </div>
    {exhausted && <p className="my-2 text-sm text-d2-white/90">{t('regionalBounty.exhausted')}</p>}
    <div className="mt-3 flex flex-wrap gap-2">
      {stage === 'never-accepted' && <Button type="button" className={buttonClass} variant="primary"
        data-testid={`bounty-accept-${quest.id}`} disabled={!canAcceptRegionalBounty(quest.id)}
        onClick={() => { run(() => acceptRegionalBounty(quest.id)); }}>{t('regionalBounty.accept')}</Button>}
      {done && <Button type="button" className={buttonClass} variant="primary"
        data-testid={`quest-claim-${quest.id}`} disabled={!canClaim(quest.id)} onClick={claim}>
        {t(stage === 'paid' ? 'rewardClaimed' : 'claimReward')}
      </Button>}
      {stage === 'paid' && <Button type="button" className={buttonClass} variant="secondary"
        data-testid={`bounty-repeat-${quest.id}`} disabled={!canRepeatRegionalBounty(quest.id)}
        onClick={() => { run(() => repeatRegionalBounty(quest.id)); }}>{t('regionalBounty.repeat')}</Button>}
    </div>
    {feedback && <p role="status" className="mt-2 text-sm text-d2-white/90">{feedback}</p>}
  </Panel>;
}
