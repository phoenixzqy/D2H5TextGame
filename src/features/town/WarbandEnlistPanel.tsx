import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadMercPool } from '@/data/loaders/mercs';
import { WARBAND } from '@/engine/map/warband-quest';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { Button } from '@/ui';
import { canEnlistWarband, warbandEnlistCandidates, selectWarbandRecruit, currentWarbandRecruit,
  isCurrentWarbandSelection, enlistWarband, type WarbandEnlistResult, type WarbandEnlistSelection } from './warbandEnlist';

type Feedback = WarbandEnlistResult | 'restoration-failed' | 'busy';
interface ScopedFeedback {
  readonly result: Feedback;
  readonly hero: ReturnType<typeof usePlayerStore.getState>['player'];
  readonly act: number;
  readonly difficulty: ReturnType<typeof useMapStore.getState>['selectedDifficulty'];
}
function perform(selection: WarbandEnlistSelection | null): ScopedFeedback {
  let result: Feedback;
  try { result = enlistWarband(selection); }
  catch (error) {
    if (error instanceof AggregateError) result = 'restoration-failed';
    else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) result = 'busy';
    else throw error;
  }
  const map = useMapStore.getState();
  return { result, hero: usePlayerStore.getState().player, act: map.currentAct, difficulty: map.selectedDifficulty };
}

/** Player selection retains its witness until explicit confirmation; journal Claim stays separate. */
export function WarbandEnlistPanel() {
  const { t } = useTranslation(['town', 'mercs']);
  const inputId = useId();
  const [selection, setSelection] = useState<WarbandEnlistSelection | null>(null);
  const [feedback, setFeedback] = useState<ScopedFeedback | null>(null);
  useInventoryStore(); useMapStore(); useMercStore(); usePlayerStore(); useCombatStore(); useHydrationStore();
  const map = useMapStore.getState();
  const message = feedback && feedback.hero === usePlayerStore.getState().player && feedback.act === map.currentAct
    && feedback.difficulty === map.selectedDifficulty && (feedback.result !== 'ok' || map.questReceipts[WARBAND.proof] === true) ? feedback.result : null;
  const canEnlist = canEnlistWarband();
  if (!canEnlist && !message) return null;
  const candidates = warbandEnlistCandidates();
  const validSelection = isCurrentWarbandSelection(selection), selected = currentWarbandRecruit(selection);
  const definition = loadMercPool().pool.find(row => row.id === WARBAND.mercId);
  const name = t('mercs:byId.act5-barbarian-recruit.name', { defaultValue: definition?.name });
  const fresh = validSelection && selection?.kind === 'fresh';
  return <div data-testid="warband-enlist" className="w-full min-w-0 space-y-3 break-words border-t border-d2-border pt-3">
    <h4 className="d2-section-title font-serif text-d2-gold">{t('warband.title')}</h4>
    <p className="text-sm text-d2-white/90">{t('warband.description')}</p>
    {canEnlist && <>
      <label htmlFor={inputId} className="block text-sm text-d2-white">{t('warband.chooseRecruit')}</label>
      <select id={inputId} value={fresh ? 'fresh' : selected?.id ?? ''} data-testid="warband-enlist-target"
        className="d2-field block min-h-[44px] w-full min-w-0 max-w-full rounded border border-d2-border bg-d2-bg p-2 text-base text-d2-white focus-visible:ring-2 focus-visible:ring-d2-gold"
        onChange={event => {
          const value = event.target.value, merc = candidates.find(row => row.id === value);
          setSelection(value === 'fresh' && candidates.length === 0 ? selectWarbandRecruit(null)
            : merc ? selectWarbandRecruit(merc) : null);
          setFeedback(null);
        }}>
        <option value="">{t('warband.selectRecruit')}</option>
        {candidates.length === 0 && definition && <option value="fresh">
          {t('warband.freshOption', { name, level: definition.reqLevel })}
        </option>}
        {candidates.map((merc, index) => <option key={merc.id} value={merc.id}>
          {t('warband.ownedOption', { name, level: merc.level, number: index + 1, id: merc.id })}
        </option>)}
      </select>
      {validSelection && <div data-testid="warband-enlist-preview" className="max-w-full space-y-1 text-sm text-d2-white/90">
        <p>{t(fresh ? 'warband.freshOption' : 'warband.ownedPreview', { name,
          level: selected?.level ?? definition?.reqLevel, id: selected?.id })}</p>
        <p>{t(fresh ? 'warband.freshDescription' : 'warband.retainedDescription')}</p>
      </div>}
      <Button type="button" disabled={!validSelection} data-testid="warband-enlist-use"
        className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal break-words"
        onClick={() => { if (validSelection) setFeedback(perform(selection)); }}>
        {t(candidates.length === 0 ? 'warband.enlist' : 'warband.reenlist')}
      </Button>
    </>}
    {message && <p role={message === 'ok' ? 'status' : 'alert'} aria-live="polite" className="text-sm text-d2-white/90">
      {t(message === 'ok' ? 'warband.success' : `services.feedback.${message}`)}
    </p>}
  </div>;
}
