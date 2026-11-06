import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LARZUK } from '@/engine/map/larzuk-quest';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { Button, ItemTooltip, tItemName } from '@/ui';
import { canPresentLarzukItem, larzukPresentCandidates, currentLarzukPresentItem, selectLarzukPresentItem, presentLarzukItem,
  type LarzukPresentResult, type LarzukPresentSelection } from './larzukPresent';

type Feedback = LarzukPresentResult | 'restoration-failed' | 'busy';
interface ScopedFeedback {
  readonly result: Feedback;
  readonly hero: ReturnType<typeof usePlayerStore.getState>['player'];
  readonly act: number;
  readonly difficulty: ReturnType<typeof useMapStore.getState>['selectedDifficulty'];
}
function perform(selection: LarzukPresentSelection | null): ScopedFeedback {
  let result: Feedback;
  try { result = presentLarzukItem(selection); }
  catch (error) {
    if (error instanceof AggregateError) result = 'restoration-failed';
    else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) result = 'busy';
    else throw error;
  }
  const map = useMapStore.getState();
  return { result, hero: usePlayerStore.getState().player, act: map.currentAct, difficulty: map.selectedDifficulty };
}
/** Present retains the displayed instance witness and leaves Claim/use as separate player actions. */
export function LarzukPresentPanel() {
  const { t } = useTranslation(['town', 'items']);
  const inputId = useId();
  const [selection, setSelection] = useState<LarzukPresentSelection | null>(null);
  const [feedback, setFeedback] = useState<ScopedFeedback | null>(null);
  useInventoryStore(); useMapStore(); useMercStore(); usePlayerStore(); useCombatStore(); useHydrationStore();
  const map = useMapStore.getState();
  const message = feedback && feedback.hero === usePlayerStore.getState().player && feedback.act === map.currentAct
    && feedback.difficulty === map.selectedDifficulty && (feedback.result !== 'ok' || map.questReceipts[LARZUK.proof] === true) ? feedback.result : null;
  const canPresent = canPresentLarzukItem();
  if (!canPresent && !message) return null;
  const candidates = larzukPresentCandidates(), selected = currentLarzukPresentItem(selection);
  return <div data-testid="larzuk-present" className="w-full min-w-0 space-y-3 break-words border-t border-d2-border pt-3">
    <h4 className="d2-section-title font-serif text-d2-gold">{t('larzukPresent.title')}</h4>
    <p className="text-sm text-d2-white/90">{t('larzukPresent.description')}</p>
    {canPresent && <>
      <label htmlFor={inputId} className="block text-sm text-d2-white">{t('larzukPresent.chooseItem')}</label>
      <select id={inputId} value={selected?.id ?? ''} data-testid="larzuk-present-target"
        className="d2-field block min-h-[44px] w-full min-w-0 max-w-full rounded border border-d2-border bg-d2-bg p-2 text-base text-d2-white focus-visible:ring-2 focus-visible:ring-d2-gold"
        onChange={event => {
          const item = candidates.find(row => row.id === event.target.value);
          setSelection(item ? selectLarzukPresentItem(item) : null); setFeedback(null);
        }}>
        <option value="">{t('services.selectItem')}</option>
        {candidates.map((item, index) => <option key={item.id} value={item.id}>
          {t('services.itemOption', { name: tItemName(t, item), level: item.level, number: index + 1 })}
        </option>)}
      </select>
      {selected && <div data-testid="larzuk-present-preview" className="max-w-full"><ItemTooltip item={selected} className="max-w-full" /></div>}
      {candidates.length === 0 && <p className="text-sm text-d2-white/90">{t('services.noCandidates')}</p>}
      <Button type="button" disabled={!selected} data-testid="larzuk-present-use"
        className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal break-words"
        onClick={() => { if (selected) setFeedback(perform(selection)); }}>{t('larzukPresent.present')}</Button>
    </>}
    {message && <p role={message === 'ok' ? 'status' : 'alert'} aria-live="polite" className="text-sm text-d2-white/90">
      {t(message === 'ok' ? 'larzukPresent.success' : `services.feedback.${message}`)}
    </p>}
  </div>;
}
