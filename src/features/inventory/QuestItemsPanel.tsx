import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Panel, tDataKey } from '@/ui';
import { loadQuestItems, questItemSource } from '@/data/loaders/quest-items';
import { useInventoryStore } from '@/stores/inventoryStore';
import { readQuestItem } from '@/features/quests/claimReward';

/** Bound quest rewards and consumed receipts, independent of equipment capacity. */
export function QuestItemsPanel() {
  const { t } = useTranslation('inventory');
  const ledger = useInventoryStore(state => state.questItems);
  const [feedback, setFeedback] = useState<{ key: string; skillPoints?: number } | null>(null);
  const items = loadQuestItems().filter(item => {
    const source = questItemSource(item);
    return Object.hasOwn(ledger, source) && ledger[source]?.itemId === item.id;
  });
  const read = (source: string, skillPoints: number): void => {
    try {
      setFeedback({ key: readQuestItem(source), skillPoints });
    } catch (error) {
      setFeedback({ key: error instanceof AggregateError ? 'restoration-failed' : 'action-failed' });
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
              <li key={source} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-serif text-d2-gold">{tDataKey(t, item.nameKey)}</h3>
                  <p className="text-sm text-d2-white/80">
                    {t(item.descKey, { skillPoints: item.effect.skillPoints })}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="min-h-[44px] shrink-0"
                  aria-disabled={consumed}
                  onClick={() => { read(source, item.effect.skillPoints); }}
                >
                  {t(consumed ? 'questItems.consumed' : 'questItems.read')}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      <p role="status" aria-atomic="true" className="mt-3 text-sm text-d2-gold">
        {feedback ? t(`questItems.feedback.${feedback.key}`, { skillPoints: feedback.skillPoints }) : ''}
      </p>
    </Panel>
  );
}
