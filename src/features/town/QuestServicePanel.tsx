import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { questServicesForNpc, questServiceCandidates, useQuestService as applyQuestService } from './questServices';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { Button, ItemTooltip, tItemName } from '@/ui';
import { CharsiImbuePanel } from './CharsiImbuePanel';

type Service = ReturnType<typeof questServicesForNpc>[number];

function ServiceRow({ service }: { service: Service }) {
  const { t } = useTranslation(['town', 'inventory', 'quests', 'items']);
  const inputId = useId();
  const [selectedId, setSelectedId] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const candidates = questServiceCandidates(service.source);
  const selected = candidates.find(item => item.id === selectedId);
  return <div className="min-w-0 space-y-2 break-words border-t border-d2-border pt-3" data-testid={`quest-service-${service.source}`}>
    <h4 className="font-serif text-d2-gold">{t(`quests:rewardValue.${service.serviceId}`)}</h4>
    <p className="text-xs text-d2-white/70">{t(service.source.startsWith('quests/side-') ? 'services.sourceSide' : 'services.sourceMain')}</p>
    <p className="text-sm text-d2-white/90">{t(`services.description.${service.serviceId}`)}</p>
    <p role="status" className="text-sm text-d2-white/90">{t(`services.${service.state}`)}</p>
    {service.state === 'available' && <>
      <label htmlFor={inputId} className="block text-sm text-d2-white">{t('services.chooseItem')}</label>
      <select id={inputId} value={selected?.id ?? ''} data-testid={`quest-service-target-${service.source}`}
        className="block min-h-[44px] w-full min-w-0 max-w-full rounded border border-d2-border bg-d2-bg p-2 text-d2-white focus-visible:ring-2 focus-visible:ring-d2-gold"
        onChange={event => { setSelectedId(event.target.value); setFeedback(null); }}>
        <option value="">{t('services.selectItem')}</option>
        {candidates.map((item, index) => <option key={item.id} value={item.id}>
          {t('services.itemOption', { name: tItemName(t, item), level: item.level, number: index + 1 })}
        </option>)}
      </select>
      {selected && <div data-testid={`quest-service-preview-${service.source}`} className="max-w-full"><ItemTooltip item={selected} className="max-w-full" /></div>}
      {candidates.length === 0 && <p className="text-sm text-d2-white/80">{t('services.noCandidates')}</p>}
      <Button type="button" variant="primary" disabled={!selected}
        className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal break-words"
        data-testid={`quest-service-use-${service.source}`} onClick={() => {
          if (!selected) return;
          try {
            setFeedback(applyQuestService(service.source, selected.id));
          } catch (error) {
            if (error instanceof AggregateError) setFeedback('restoration-failed');
            else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFeedback('busy');
            else throw error;
          }
        }}>{t('services.use')}</Button>
    </>}
    {feedback && <p role={feedback === 'ok' ? 'status' : 'alert'} aria-live="polite" className="text-sm text-d2-white/90">
      {t(`services.feedback.${feedback}`)}
    </p>}
  </div>;
}

/** Lists earned charges at the current NPC; only an explicit selected-item action spends one. */
export function QuestServicePanel({ npcId }: { npcId: string }) {
  useInventoryStore(state => state.questServices);
  useInventoryStore(state => state.backpack);
  useInventoryStore(state => state.stash);
  useInventoryStore(state => state.equipped);
  useInventoryStore(state => state.legacyGearQuarantine);
  useInventoryStore(state => state.questItems);
  useMapStore(state => state.currentAct);
  useMapStore(state => state.currentSubAreaId);
  useMapStore(state => state.selectedDifficulty);
  useMapStore(state => state.questProgress);
  useMapStore(state => state.questReceipts);
  useMercStore(state => state.mercEquipment);
  useMercStore(state => state.ownedMercs);
  usePlayerStore(state => state.player);
  useCombatStore(state => state.inCombat);
  useHydrationStore(state => state.status);
  const services = questServicesForNpc(npcId);
  if (services.length === 0) return npcId === 'npc/charsi' ? <CharsiImbuePanel /> : null;
  return <div className="w-full min-w-0 space-y-3" data-testid="quest-services">
    {npcId === 'npc/charsi' && <CharsiImbuePanel />}
    {services.map(service => <ServiceRow key={service.source} service={service} />)}
  </div>;
}
