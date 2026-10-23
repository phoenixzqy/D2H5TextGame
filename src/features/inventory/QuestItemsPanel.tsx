import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Panel, tDataKey } from '@/ui';
import { loadQuestItems, questItemSource, type ReadQuestItemDef } from '@/data/loaders/quest-items';
import { useInventoryStore } from '@/stores/inventoryStore';
import { readQuestItem, recoverClaimedQuestRewardItem, questRewardItemRecoveryStatus } from '@/features/quests/claimReward';
import { assembleQuestItem, questAssemblyStatus } from '@/features/quests/questCrafting';
import { useMapStore } from '@/stores/mapStore';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';

/** Bound quest rewards and consumed receipts, independent of equipment capacity. */
export function QuestItemsPanel() {
  const { t, i18n } = useTranslation('inventory');
  const ledger = useInventoryStore(state => state.questItems);
  const progress = useMapStore(state => state.questProgress);
  const [feedback, setFeedback] = useState<{ key: string; skillPoints?: number; maxLife?: number; allResist?: number; item?: string } | null>(null);
  const definitions = loadQuestItems();
  const items = definitions.filter(item => {
    const source = questItemSource(item);
    return Object.hasOwn(ledger, source) && ledger[source]?.itemId === item.id;
  });
  const assemblies = definitions.filter(item => item.kind === 'assembled' &&
    (Object.hasOwn(ledger, questItemSource(item)) || item.ingredients.some(id => items.some(input => input.id === id))));
  const recoveries = definitions.filter(item => item.kind === undefined &&
    questRewardItemRecoveryStatus(item.sourceQuestId) === 'ready');
  const read = (item: ReadQuestItemDef): void => {
    try {
      const result = readQuestItem(questItemSource(item));
      const key = item.effect.allResist !== undefined && result === 'ok' ? 'resistance-increased'
        : item.effect.allResist !== undefined && result === 'already-consumed' ? 'resistance-already-consumed'
        : item.effect.maxLife !== undefined && result === 'ok' ? 'life-increased'
        : item.effect.maxLife !== undefined && result === 'already-consumed' ? 'life-already-consumed' : result;
      setFeedback({ key, ...item.effect });
    } catch (error) {
      setFeedback({ key: error instanceof AggregateError
        ? item.effect.allResist !== undefined ? 'resistance-restoration-failed'
          : item.effect.maxLife !== undefined ? 'life-restoration-failed' : 'restoration-failed'
        : error instanceof WaveGuardError || error instanceof RecordedWaveAccessError ? 'busy' : 'action-failed' });
    }
  };

  return (
    <Panel title={t('questItems.title')} className="mb-4" data-testid="quest-items-panel">
      <p className="text-sm text-d2-white/80 mb-3">{t('questItems.bound')}</p>
      {items.length === 0 ? (
        <p className="text-sm text-d2-white/70">{t('questItems.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map(item => {
            const source = questItemSource(item);
            const consumed = ledger[source]?.state === 'consumed';
            return (
              <li key={source} data-testid={`quest-item-${item.id}`} className="min-w-0 flex flex-col gap-3 break-words sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-serif text-d2-gold">{tDataKey(t, item.nameKey)}</h3>
                  <p className="text-sm text-d2-white/80">
                    {t(item.descKey, item.kind !== undefined ? {} : item.effect)}
                  </p>
                </div>
                {item.kind !== undefined ? (
                  <p className="text-sm text-d2-gold">{t(consumed
                    ? item.kind === 'component' ? 'questItems.usedInAssembly'
                      : item.kind === 'delivery' ? 'questItems.delivered' : 'questItems.usedAtDestination'
                    : 'questItems.owned')}</p>
                ) : <Button
                  type="button"
                  variant="secondary"
                  className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal shrink-0"
                  data-testid={`quest-item-read-${item.id}`}
                  aria-disabled={consumed}
                  onClick={() => { read(item); }}
                >
                  {t(consumed ? 'questItems.consumed' : 'questItems.read')}
                </Button>}
              </li>
            );
          })}
        </ul>
      )}
      {recoveries.map(item => (
        <div key={questItemSource(item)} className="w-full min-w-0 mt-3 space-y-2 break-words"
          data-testid={`quest-reward-recovery-${item.sourceQuestId}`}>
          <p className="text-sm text-d2-white/90">{t('questItems.recovery.ready')}</p>
          <Button type="button" variant="secondary" className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal"
            data-testid={`quest-reward-recover-${item.sourceQuestId}`} onClick={() => {
              try {
                const result = recoverClaimedQuestRewardItem(item.sourceQuestId);
                setFeedback({ key: result === 'ok' ? 'reward-recovered'
                  : result === 'already-consumed' && item.kind === undefined && item.effect.maxLife !== undefined
                    ? 'life-already-consumed' : result });
              } catch (error) {
                if (error instanceof AggregateError) setFeedback({ key: 'life-restoration-failed' });
                else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFeedback({ key: 'busy' });
                else throw error;
              }
            }}>{t('questItems.recovery.action', { item: tDataKey(t, item.nameKey) })}</Button>
        </div>
      ))}
      {assemblies.map(item => {
        if (item.kind !== 'assembled') return null;
        const source = questItemSource(item), status = questAssemblyStatus(source);
        const feedbackStatus = status === 'owned' && progress[item.sourceQuestId]?.rewardClaimed === true ? 'claimed' : status;
        const name = tDataKey(t, item.nameKey);
        const ingredientNames = item.ingredients.map(id => {
          const ingredient = definitions.find(row => row.id === id);
          return ingredient ? tDataKey(t, ingredient.nameKey) : '';
        });
        const tool = definitions.find(row => row.id === item.requiredTool);
        const summary = { item: name, ingredients: new Intl.ListFormat(i18n.resolvedLanguage ?? i18n.language,
          { style: 'long', type: 'conjunction' }).format(ingredientNames), tool: tool ? tDataKey(t, tool.nameKey) : '' };
        return <div key={source} className="w-full min-w-0 mt-3 space-y-2 break-words" data-testid="quest-assembly">
          <h3 className="font-serif text-d2-gold">{name}</h3>
          <p className="text-sm text-d2-white/90">{t(`questItems.recipe.${feedbackStatus}`, summary)}</p>
          <p className="text-sm text-d2-white/90">{t('questItems.recipe.inputs', summary)}</p>
          <Button type="button" variant="secondary" className="min-h-[44px] min-w-[44px] max-w-full whitespace-normal"
            data-testid={`quest-assemble-${item.id}`} disabled={status !== 'ready'} onClick={() => {
              try {
                const result = assembleQuestItem(source);
                setFeedback({ key: result === 'ok' ? 'item-assembled' : result, item: name });
              } catch (error) {
                if (error instanceof AggregateError) setFeedback({ key: 'assembly-restoration-failed' });
                else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setFeedback({ key: 'busy' });
                else throw error;
              }
            }}>{t('questItems.recipe.action', { item: name })}</Button>
        </div>;
      })}
      <p role="status" aria-atomic="true" className="mt-3 text-sm text-d2-gold">
        {feedback ? t(`questItems.feedback.${feedback.key}`, { skillPoints: feedback.skillPoints, maxLife: feedback.maxLife, allResist: feedback.allResist, item: feedback.item }) : ''}
      </p>
    </Panel>
  );
}
