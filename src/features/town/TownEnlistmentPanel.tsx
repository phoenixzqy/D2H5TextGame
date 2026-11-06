import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadMercPool } from '@/data/loaders/mercs';
import { TOWN_ENLISTMENTS, type TownEnlistmentKey } from '@/engine/map/town-enlistment-quest';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { Button } from '@/ui';
import { canEnlistTownMercenary, townEnlistmentCandidates, selectTownEnlistmentRecruit,
  isCurrentTownEnlistmentSelection, currentTownEnlistmentRecruit, enlistTownMercenary,
  type TownEnlistmentResult, type TownEnlistmentSelection } from './townEnlistment';

type Feedback = TownEnlistmentResult | 'restoration-failed' | 'busy';
interface ScopedFeedback {
  readonly result: Feedback;
  readonly hero: ReturnType<typeof usePlayerStore.getState>['player'];
  readonly act: number;
  readonly difficulty: ReturnType<typeof useMapStore.getState>['selectedDifficulty'];
}
function perform(key: TownEnlistmentKey, selection: TownEnlistmentSelection | null): ScopedFeedback {
  let result: Feedback;
  try { result = enlistTownMercenary(key, selection); }
  catch (error) {
    if (error instanceof AggregateError) result = 'restoration-failed';
    else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) result = 'busy';
    else throw error;
  }
  const map = useMapStore.getState();
  return { result, hero: usePlayerStore.getState().player, act: map.currentAct, difficulty: map.selectedDifficulty };
}

/** An explicit actual-instance selection stays separate from the one-time journal Claim. */
export function TownEnlistmentPanel({ enlistmentKey }: { readonly enlistmentKey: TownEnlistmentKey }) {
  const { t } = useTranslation(['town', 'mercs', 'quests']);
  const inputId = useId();
  const [selection, setSelection] = useState<TownEnlistmentSelection | null>(null);
  const [feedback, setFeedback] = useState<ScopedFeedback | null>(null);
  useInventoryStore(); useMapStore(); useMercStore(); usePlayerStore(); useCombatStore(); useHydrationStore();
  const contract = TOWN_ENLISTMENTS[enlistmentKey], map = useMapStore.getState();
  const message = feedback && feedback.hero === usePlayerStore.getState().player && feedback.act === map.currentAct
    && feedback.difficulty === map.selectedDifficulty && (feedback.result !== 'ok' || map.questReceipts[contract.proof] === true)
    ? feedback.result : null;
  const canEnlist = canEnlistTownMercenary(enlistmentKey);
  if (!canEnlist && !message) return null;
  const candidates = townEnlistmentCandidates(enlistmentKey);
  const valid = isCurrentTownEnlistmentSelection(enlistmentKey, selection);
  const selected = currentTownEnlistmentRecruit(enlistmentKey, selection);
  const definition = loadMercPool().pool.find(row => row.id === contract.mercId);
  const name = t(`mercs:byId.${contract.mercId.slice('mercs/'.length)}.name`);
  const quest = t(`quests:byId.${contract.quest.slice('quests/side-'.length)}.name`);
  const fresh = valid && selection?.kind === 'fresh';
  return <div data-testid="town-enlistment" className="w-full min-w-0 space-y-3 break-words border-t border-d2-border pt-3">
    <h4 className="d2-section-title font-serif text-d2-gold">{quest}</h4>
    <p className="text-sm text-d2-white/90">{t(`enlistment.requirements.${enlistmentKey}`)}</p>
    <p className="text-sm text-d2-white/90">{t('enlistment.description')}</p>
    {canEnlist && <>
      <label htmlFor={inputId} className="block text-sm text-d2-white">{t('enlistment.chooseRecruit')}</label>
      <select id={inputId} value={fresh ? 'fresh' : selected?.id ?? ''} data-testid="town-enlistment-target"
        className="d2-field block min-h-[44px] w-full min-w-0 max-w-full rounded border border-d2-border bg-d2-bg p-2 text-base text-d2-white focus-visible:ring-2 focus-visible:ring-d2-gold"
        onChange={event => {
          const value = event.target.value, merc = candidates.find(row => row.id === value);
          setSelection(value === 'fresh' && candidates.length === 0 ? selectTownEnlistmentRecruit(enlistmentKey, null)
            : merc ? selectTownEnlistmentRecruit(enlistmentKey, merc) : null);
          setFeedback(null);
        }}>
        <option value="">{t('enlistment.selectRecruit')}</option>
        {candidates.length === 0 && definition && <option value="fresh">
          {t('enlistment.freshOption', { name, level: definition.reqLevel })}
        </option>}
        {candidates.map((merc, index) => <option key={merc.id} value={merc.id}>
          {t('enlistment.ownedOption', { name, level: merc.level, number: index + 1, id: merc.id })}
        </option>)}
      </select>
      {valid && <div data-testid="town-enlistment-preview" className="max-w-full space-y-1 text-sm text-d2-white/90">
        <p>{t(fresh ? 'enlistment.freshOption' : 'enlistment.ownedPreview', {
          name, level: selected?.level ?? definition?.reqLevel, id: selected?.id
        })}</p>
        <p>{t(fresh ? 'enlistment.freshDescription' : 'enlistment.retainedDescription')}</p>
      </div>}
      <Button type="button" disabled={!valid} data-testid="town-enlistment-use"
        className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal break-words"
        onClick={() => { if (valid) setFeedback(perform(enlistmentKey, selection)); }}>
        {t(candidates.length === 0 ? 'enlistment.enlist' : 'enlistment.reenlist')}
      </Button>
    </>}
    {message && <p role={message === 'ok' ? 'status' : 'alert'} aria-live="polite" className="text-sm text-d2-white/90">
      {message === 'ok' ? t('enlistment.success', { quest }) : t(`services.feedback.${message}`)}
    </p>}
  </div>;
}
