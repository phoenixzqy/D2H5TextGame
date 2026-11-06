import { useId, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { MaterialActionShortageError, type MaterialActionSelection } from '@/engine/crafting/material-actions';
import { validateLiveMaterialAction } from '@/stores/materialActions';
import { useInventoryStore } from '@/stores/inventoryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useMercStore } from '@/stores/mercStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import { inspectRecordedWaves, subscribeRecordedWaves } from '@/stores/recordedWaveReceipt';
import { inspectWaveGuard, subscribeWaveGuard } from '@/stores/waveTransitionGuard';
import { Button } from '@/ui';
import { craftingBalanceName, craftingErrorKey } from './craftingPresentation';

/** Live native eligibility, isolated from the form's target-list preparation and localization. */
export function CraftingReadiness({ selection, onPreview }: {
  readonly selection: MaterialActionSelection;
  readonly onPreview: (opener: HTMLButtonElement) => void;
}) {
  const { t } = useTranslation(['inventory', 'items']);
  const id = useId();
  useInventoryStore(useShallow(state => [state.materials, state.currencies, state.backpack, state.stash,
    state.equipped, state.socketQuarantine, state.legacyGearQuarantine, state.questItems, state.questServices,
    state.materialActionOrdinal, state.latestMaterialAction]));
  useMapStore(useShallow(state => [state.selectedDifficulty, state.questProgress, state.questReceipts,
    state.questTitles, state.questDifficulties, state.selectedTitle, state.clearedSubAreas,
    state.nightmareClearedSubAreas, state.hellClearedSubAreas, state.challengeOrdinals, state.endgame]));
  usePlayerStore(state => state.player?.id);
  useMercStore(state => state.mercEquipment);
  useCombatStore(useShallow(state => [state.inCombat, state.subAreaRunId, state.runVictory, state.runDefeat]));
  const hydrated = useHydrationStore(state => state.status === 'ready');
  useIronGolemSelectionStore(state => state.selection);
  useSyncExternalStore(subscribeRecordedWaves, inspectRecordedWaves, inspectRecordedWaves);
  useSyncExternalStore(subscribeWaveGuard, inspectWaveGuard, inspectWaveGuard);
  let allowed = true, failure: unknown;
  try { validateLiveMaterialAction(selection); } catch (error) { allowed = false; failure = error; }
  return <>
    {!allowed && <div id={id} role="status" data-testid="crafting-readiness" className="space-y-1 break-words text-sm text-d2-white/90">
      <p>{t(hydrated ? craftingErrorKey(failure) : 'crafting.recoveryRequired')}</p>
      {failure instanceof MaterialActionShortageError && <ul>
        {failure.shortfalls.map(entry => <li key={`${entry.kind}:${entry.id}`}>
          {t('crafting.shortfall', { name: craftingBalanceName(t, entry.id), quantity: entry.missing })}
        </li>)}
      </ul>}
    </div>}
    <Button type="button" disabled={!allowed} aria-describedby={allowed ? undefined : id}
      className="min-h-[44px] max-w-full whitespace-normal" onClick={event => { onPreview(event.currentTarget); }}>
      {t('crafting.preview')}
    </Button>
  </>;
}
