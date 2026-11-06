import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { canUseCainIdentify, cainIdentifyCandidates, selectCainIdentifyItem, currentCainIdentifyItem,
  identifyCainItem, type CainIdentifySelection } from './cainIdentify';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { Button, ItemTooltip, tItemName } from '@/ui';

/** Explicit free service at the current Cain; each selection retains its original instance witness. */
export function CainIdentifyPanel({ npcId }: { npcId: string }) {
  const { t } = useTranslation(['town', 'inventory', 'quests', 'items']);
  const inputId = useId();
  const [selection, setSelection] = useState<CainIdentifySelection | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  useInventoryStore(state => state.backpack);
  useInventoryStore(state => state.stash);
  useInventoryStore(state => state.equipped);
  useInventoryStore(state => state.legacyGearQuarantine);
  useInventoryStore(state => state.socketQuarantine);
  useInventoryStore(state => state.questItems);
  useMapStore(state => state.currentAct);
  useMapStore(state => state.currentSubAreaId);
  useMapStore(state => state.selectedDifficulty);
  useMapStore(state => state.clearedSubAreas);
  useMapStore(state => state.questProgress);
  useMapStore(state => state.questReceipts);
  useMercStore(state => state.mercEquipment);
  useMercStore(state => state.ownedMercs);
  usePlayerStore(state => state.player);
  useCombatStore(state => state.inCombat);
  useCombatStore(state => state.subAreaRunId);
  useHydrationStore(state => state.status);
  if (npcId !== 'npc/cain' || !canUseCainIdentify()) return null;
  const candidates = cainIdentifyCandidates(), selected = currentCainIdentifyItem(selection);
  return <div data-testid="cain-identify" className="w-full min-w-0 space-y-2 break-words border-t border-d2-border pt-3">
    <h4 className="d2-section-title font-serif text-d2-gold">{t('identify.title')}</h4>
    <p className="text-sm text-d2-white/90">{t('identify.description')}</p>
    <label htmlFor={inputId} className="block text-sm text-d2-white">{t('services.chooseItem')}</label>
    <select id={inputId} value={selected?.id ?? ''} data-testid="cain-identify-target"
      className="d2-field block min-h-[44px] w-full min-w-0 max-w-full rounded border border-d2-border bg-d2-bg p-2 text-base text-d2-white focus-visible:ring-2 focus-visible:ring-d2-gold"
      onChange={event => {
        const item = candidates.find(row => row.id === event.target.value);
        setSelection(item ? selectCainIdentifyItem(item) : null); setFeedback(null);
      }}>
      <option value="">{t('services.selectItem')}</option>
      {candidates.map((item, index) => <option key={item.id} value={item.id}>
        {t('services.itemOption', { name: tItemName(t, item), level: item.level, number: index + 1 })}
      </option>)}
    </select>
    {selected && <div data-testid="cain-identify-preview" className="max-w-full"><ItemTooltip item={selected} className="max-w-full" /></div>}
    {candidates.length === 0 && <p className="text-sm text-d2-white/90">{t('identify.noCandidates')}</p>}
    <Button type="button" variant="primary" disabled={!selected} data-testid="cain-identify-use"
      className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal break-words" onClick={() => {
        if (!selected) return;
        try { setFeedback(identifyCainItem(selection)); }
        catch (error) {
          if (error instanceof AggregateError) setFeedback('restoration-failed');
          else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFeedback('busy');
          else throw error;
        }
      }}>{t('identify.use')}</Button>
    {feedback && <p role={feedback === 'ok' ? 'status' : 'alert'} aria-live="polite" className="text-sm text-d2-white/90">
      {t(feedback === 'ok' ? 'identify.success' : `services.feedback.${feedback}`)}
    </p>}
  </div>;
}
