import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { endgameDefinition } from '@/data/loaders/endgame';
import type { EndgameModifierId } from '@/engine/endgame/types';
import { checkEndgameEntry, claimEndgameAchievement, readEndgamePanelModel } from '@/stores/endgameActions';
import { useMapStore } from '@/stores/mapStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { craftingBalanceName } from '@/features/inventory/craftingPresentation';
import { Button, Panel, tDataKey } from '@/ui';

/** Explicit manual dungeon admission and achievement Claim, projected from authoritative stores. */
export function EndgamePanel() {
  const { t } = useTranslation('endgame');
  const navigate = useNavigate();
  useMapStore(state => state.endgame);
  useMapStore(state => state.questProgress);
  useMapStore(state => state.questReceipts);
  useMapStore(state => state.selectedTitle);
  useInventoryStore(state => state.questItems);
  useInventoryStore(state => state.questServices);
  const ready = useHydrationStore(state => state.status === 'ready');
  const model = readEndgamePanelModel();
  const [modifier, setModifier] = useState<EndgameModifierId>('ashen');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [failedRecovery, setFailedRecovery] = useState(false);
  const disabled = !ready || failedRecovery || model.kind !== 'unlocked';
  const materialsText = (materials: Readonly<Record<string, number>>) => Object.entries(materials)
    .map(([id, count]) => `${String(count)} × ${craftingBalanceName(t, id)}`).join(' · ');
  const action = (run: () => void) => {
    try { run(); }
    catch (error) {
      if (error instanceof AggregateError) { setFailedRecovery(true); setFeedback('restoration-failed'); }
      else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFeedback('busy');
      else throw error;
    }
  };
  return <Panel title={tDataKey(t, endgameDefinition.nameKey)} data-testid="endgame-panel">
    <p className="mb-3 text-sm text-d2-white/90">{t('summary', { level: endgameDefinition.monsterLevel, waves: endgameDefinition.waves.length })}</p>
    {model.kind !== 'unlocked' && <p data-testid="endgame-lock" className="mb-3 text-sm text-d2-gold">{t(model.kind)}</p>}
    <fieldset disabled={disabled} className="min-w-0 space-y-2">
      <legend className="mb-2 font-serif text-d2-gold">{t('choose')}</legend>
      {endgameDefinition.modifiers.map(row => <label key={row.id}
        className={`flex min-h-11 cursor-pointer items-start gap-3 rounded border p-3 focus-within:ring-2 focus-within:ring-d2-gold ${modifier === row.id ? 'border-d2-gold bg-black/30' : 'border-d2-border'}`}>
        <input type="radio" name="endgame-modifier" value={row.id} checked={modifier === row.id}
          onChange={() => { setModifier(row.id); }} className="mt-1 accent-d2-gold" data-testid={`endgame-modifier-${row.id}`} />
        <span className="min-w-0 space-y-1 text-sm">
          <span className="block font-serif text-base text-d2-gold">{tDataKey(t, row.nameKey)}</span>
          <span className="block text-d2-white/90">{tDataKey(t, row.descriptionKey)}</span>
          <span className="block text-d2-white/80">{t('cache', { materials: materialsText(row.completionMaterials) })}</span>
          {model.kind !== 'invalid' && <span className="block text-d2-set">{t('clears', { count: model.state.clearCounts[row.id] })}</span>}
        </span>
      </label>)}
    </fieldset>
    <p className="my-3 text-sm text-d2-white/80">{t('rewards')}</p>
    <Button type="button" className="min-h-11 max-w-full whitespace-normal" disabled={disabled} data-testid="endgame-enter"
      onClick={() => { action(() => {
        const result = checkEndgameEntry(modifier);
        if (result === 'ok') navigate(`/combat?endgame=${modifier}`);
        else setFeedback(result);
      }); }}>{t('enter')}</Button>
    <div className="mt-4 border-t border-d2-border pt-3">
      <h3 className="font-serif text-lg text-d2-gold">{t('achievement.title')}</h3>
      <p className="mt-1 text-sm text-d2-white/90">{t('achievement.requirement')}</p>
      <p className="mt-1 text-sm text-d2-white/80">{t('achievement.reward', { materials: materialsText(endgameDefinition.achievement.reward.materials) })}</p>
      {model.kind !== 'invalid' && (model.achievement.claimed || model.achievement.available) &&
        <p className="mt-2 text-sm text-d2-set">{t(model.achievement.claimed ? 'achievement.claimed' : 'achievement.ready')}</p>}
      <Button type="button" variant="secondary" className="mt-3 min-h-11 max-w-full whitespace-normal"
        data-testid="endgame-claim" disabled={disabled || !model.achievement.available}
        onClick={() => { action(() => { setFeedback(claimEndgameAchievement()); }); }}>{t('achievement.claim')}</Button>
    </div>
    {feedback && <p role="status" aria-live="polite" className="mt-3 text-sm text-d2-gold">{t(`feedback.${feedback}`)}</p>}
  </Panel>;
}
