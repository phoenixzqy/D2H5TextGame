import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ACT1_IMBUE_SOURCES, ACT1_QUEST_RECEIPTS } from '@/engine/map/act1-quest-sources';
import type { Item } from '@/engine/types/items';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { Button, ItemTooltip, tItemName } from '@/ui';
import { canPresentCharsiItem, charsiImbueCandidates, charsiImbueSources, currentCharsiImbueItem,
  currentCharsiPresentItem, imbueCharsiItem, presentCharsiItem, restoreCharsiImbue,
  selectCharsiImbueItem, selectCharsiPresentItem,
  type CharsiImbueResult, type CharsiImbueSelection, type CharsiImbueSource, type CharsiPresentSelection } from './charsiImbue';

type Feedback = CharsiImbueResult | 'restoration-failed' | 'busy';
interface ScopedFeedback {
  result: Feedback;
  hero: ReturnType<typeof usePlayerStore.getState>['player'];
  act: number;
  difficulty: ReturnType<typeof useMapStore.getState>['selectedDifficulty'];
}
const controlClass = 'min-h-[44px] min-w-[44px] max-w-full whitespace-normal break-words';
function perform(action: () => CharsiImbueResult): Feedback {
  try { return action(); }
  catch (error) {
    if (error instanceof AggregateError) return 'restoration-failed';
    if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) return 'busy';
    throw error;
  }
}
function recordFeedback(action: () => CharsiImbueResult): ScopedFeedback {
  const result = perform(action), map = useMapStore.getState();
  return { result, hero: usePlayerStore.getState().player, act: map.currentAct, difficulty: map.selectedDifficulty };
}
function currentFeedback(feedback: ScopedFeedback | null, present = false): Feedback | null {
  const map = useMapStore.getState();
  if (!feedback || usePlayerStore.getState().player !== feedback.hero || map.currentAct !== feedback.act
    || map.selectedDifficulty !== feedback.difficulty) return null;
  if (present && feedback.result === 'ok' && map.questReceipts[ACT1_QUEST_RECEIPTS.presentItem] !== true) return null;
  return feedback.result;
}
function FeedbackMessage({ feedback, successKey = 'services.feedback.ok' }: { feedback: Feedback | null; successKey?: string }) {
  const { t } = useTranslation('town');
  return feedback && <p role={feedback === 'ok' ? 'status' : 'alert'} aria-live="polite" className="text-sm text-d2-white/90">
    {t(feedback === 'ok' ? successKey : `services.feedback.${feedback}`)}
  </p>;
}
function ItemChoice({ candidates, selected, onSelect, label, testId }: {
  candidates: readonly Item[]; selected: Item | null; onSelect: (item: Item | null) => void; label: string; testId: string;
}) {
  const { t } = useTranslation(['town', 'items']);
  const inputId = useId();
  return <>
    <label htmlFor={inputId} className="block text-sm text-d2-white">{label}</label>
    <select id={inputId} value={selected?.id ?? ''} data-testid={testId}
      className="block min-h-[44px] w-full min-w-0 max-w-full rounded border border-d2-border bg-d2-bg p-2 text-base text-d2-white focus-visible:ring-2 focus-visible:ring-d2-gold"
      onChange={event => { onSelect(candidates.find(item => item.id === event.target.value) ?? null); }}>
      <option value="">{t('services.selectItem')}</option>
      {candidates.map((item, index) => <option key={item.id} value={item.id}>
        {t('services.itemOption', { name: tItemName(t, item), level: item.level, number: index + 1 })}
      </option>)}
    </select>
    {candidates.length === 0 && <p className="text-sm text-d2-white/90">{t('imbue.noCandidates')}</p>}
  </>;
}
function ImbueSourceRow({ service, candidates }: { service: CharsiImbueSource; candidates: readonly Item[] }) {
  const { t } = useTranslation(['town', 'quests', 'inventory', 'items']);
  const [selection, setSelection] = useState<CharsiImbueSelection | null>(null);
  const [feedback, setFeedback] = useState<ScopedFeedback | null>(null);
  const selected = currentCharsiImbueItem(selection);
  return <div data-testid={`charsi-source-${service.source}`} className="min-w-0 space-y-2 border-t border-d2-border pt-3">
    <h5 className="font-serif text-d2-gold">{t(service.source === ACT1_IMBUE_SOURCES.main ? 'imbue.mainReward' : 'imbue.sideReward')}</h5>
    <p role="status" className="text-sm text-d2-white/90">{t(service.state === 'restorable' ? 'imbue.restorable' : `services.${service.state}`)}</p>
    {service.state === 'restorable' && <Button type="button" className={controlClass} data-testid={`charsi-restore-${service.source}`}
      onClick={() => { setFeedback(recordFeedback(() => restoreCharsiImbue(service.source))); }}>{t('imbue.restore')}</Button>}
    {service.state === 'available' && <>
      <ItemChoice candidates={candidates} selected={selected} label={t('services.chooseItem')} testId={`charsi-imbue-target-${service.source}`}
        onSelect={item => { setSelection(item ? selectCharsiImbueItem(service.source, item) : null); setFeedback(null); }} />
      {selected && <div data-testid={`charsi-imbue-preview-${service.source}`} className="max-w-full"><ItemTooltip item={selected} className="max-w-full" /></div>}
      <Button type="button" variant="primary" disabled={!selected} className={controlClass} data-testid={`charsi-imbue-use-${service.source}`}
        onClick={() => { if (selected) setFeedback(recordFeedback(() => imbueCharsiItem(selection))); }}>{t('imbue.use')}</Button>
    </>}
    <FeedbackMessage feedback={currentFeedback(feedback)} successKey={service.state === 'consumed' ? 'imbue.useSuccess' : 'imbue.restoreSuccess'} />
  </div>;
}

/** Charsi's explicit Present and independent rewards retain actual item/source witnesses. */
export function CharsiImbuePanel() {
  const { t } = useTranslation(['town', 'quests', 'inventory', 'items']);
  const [selection, setSelection] = useState<CharsiPresentSelection | null>(null);
  const [feedback, setFeedback] = useState<ScopedFeedback | null>(null);
  useInventoryStore(state => state.questServices);
  useInventoryStore(state => state.backpack);
  useInventoryStore(state => state.stash);
  useInventoryStore(state => state.equipped);
  useInventoryStore(state => state.legacyGearQuarantine);
  useInventoryStore(state => state.socketQuarantine);
  useInventoryStore(state => state.questItems);
  useMapStore(state => state.currentAct);
  useMapStore(state => state.currentSubAreaId);
  useMapStore(state => state.selectedDifficulty);
  useMapStore(state => state.questDifficulties);
  useMapStore(state => state.clearedSubAreas);
  useMapStore(state => state.questProgress);
  useMapStore(state => state.questReceipts);
  useMapStore(state => state.endgame);
  useMercStore(state => state.mercEquipment);
  useMercStore(state => state.ownedMercs);
  usePlayerStore(state => state.player);
  useCombatStore(state => state.inCombat);
  useCombatStore(state => state.subAreaRunId);
  useHydrationStore(state => state.status);
  const canPresent = canPresentCharsiItem(), services = charsiImbueSources();
  const message = currentFeedback(feedback, true);
  if (!canPresent && services.length === 0 && !message) return null;
  const candidates = charsiImbueCandidates(), selected = currentCharsiPresentItem(selection);
  return <div data-testid="charsi-imbue" className="w-full min-w-0 space-y-3 break-words border-t border-d2-border pt-3">
    <h4 className="font-serif text-d2-gold">{t('imbue.title')}</h4>
    <p className="text-sm text-d2-white/90">{t('imbue.description')}</p>
    {canPresent && <div className="min-w-0 space-y-2">
      <h5 className="font-serif text-d2-gold">{t('imbue.presentTitle')}</h5>
      <p className="text-sm text-d2-white/90">{t('imbue.presentDescription')}</p>
      <ItemChoice candidates={candidates} selected={selected} label={t('imbue.presentChoose')} testId="charsi-present-target"
        onSelect={item => { setSelection(item ? selectCharsiPresentItem(item) : null); setFeedback(null); }} />
      {selected && <div data-testid="charsi-present-preview" className="max-w-full"><ItemTooltip item={selected} className="max-w-full" /></div>}
      <Button type="button" disabled={!selected} className={controlClass} data-testid="charsi-present-use"
        onClick={() => { if (selected) setFeedback(recordFeedback(() => presentCharsiItem(selection))); }}>{t('imbue.present')}</Button>
    </div>}
    <FeedbackMessage feedback={message} successKey="imbue.presentSuccess" />
    {services.map(service => <ImbueSourceRow key={service.source} service={service} candidates={candidates} />)}
  </div>;
}
