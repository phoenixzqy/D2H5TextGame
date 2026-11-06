import { loadCountedQuestItems, type CountedQuestMetadata } from '@/data/loaders/counted-quest-items';
import { validateCountedQuestGraphs } from '@/engine/map/counted-quest';
import { validateQuestItemLedger } from '@/engine/save/validate';
import type { QuestItemLedger } from '@/engine/types/save';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { usePlayerStore } from '@/stores/playerStore';
import { pick } from './cainPublication';
import { assertCountedData, replaceCountedDataKeys as replace, sameCountedData, snapshotCountedData } from './countedQuestContract';

type Progress = ReturnType<typeof useMapStore.getState>['questProgress'][string];

/** Publish finite Recover/Give sources and their coherent prospective row under a held lease. */
export function publishCountedQuestSourceChange(definition: CountedQuestMetadata, row: Progress,
  items: QuestItemLedger, context: () => boolean): 'ok' | 'invalid-state' | 'grant-failed' {
  const map = useMapStore.getState(), inventory = useInventoryStore.getState(), hero = usePlayerStore.getState().player;
  const keys = definition.sources, quests = [definition.quest];
  const before = snapshotCountedData({ rows: pick(map.questProgress, quests), items: pick(inventory.questItems, keys), hero });
  const expected = snapshotCountedData({ rows: { [definition.quest]: row }, items: pick(items, keys) });
  const validateShadow = (): void => {
    const live = useMapStore.getState(), inv = useInventoryStore.getState();
    const progress = replace(live.questProgress, expected.rows, quests), ledger = replace(inv.questItems, expected.items, keys);
    validateCountedQuestGraphs(progress, ledger, loadCountedQuestItems());
    validateQuestItemLedger(ledger, progress, live.questReceipts);
  };
  try { if (!hero || !context()) return 'invalid-state'; validateShadow(); } catch { return 'invalid-state'; }
  const check = (sourcesPublished: boolean, rowPublished: boolean): void => {
    const live = useMapStore.getState(), inv = useInventoryStore.getState();
    assertCountedData(live.questProgress); assertCountedData(inv.questItems);
    if (!context() || usePlayerStore.getState().player !== hero || !sameCountedData(hero, before.hero)
      || !sameCountedData(pick(live.questProgress, quests), rowPublished ? expected.rows : before.rows)
      || !sameCountedData(pick(inv.questItems, keys), sourcesPublished ? expected.items : before.items)) throw new Error('Counted action publication changed');
    validateShadow();
    if (rowPublished) validateQuestItemLedger(inv.questItems, live.questProgress, live.questReceipts);
  };
  try {
    check(false, false);
    useInventoryStore.setState(state => ({ questItems: replace(state.questItems, structuredClone(expected.items), keys) }));
    check(true, false);
    useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(expected.rows), quests) }));
    check(true, true);
    return 'ok';
  } catch (cause) {
    const errors: unknown[] = [];
    const attempt = (fn: () => void): void => { try { fn(); } catch (error) { errors.push(error); } };
    attempt(() => { useInventoryStore.setState(state => ({ questItems: replace(state.questItems, structuredClone(before.items), keys) })); });
    attempt(() => { useMapStore.setState(state => ({ questProgress: replace(state.questProgress, structuredClone(before.rows), quests) })); });
    attempt(() => {
      const live = useMapStore.getState(), inv = useInventoryStore.getState();
      assertCountedData(live.questProgress); assertCountedData(inv.questItems);
      if (!sameCountedData(pick(live.questProgress, quests), before.rows) || !sameCountedData(pick(inv.questItems, keys), before.items)) throw new Error('Counted action restoration changed');
      validateQuestItemLedger(inv.questItems, live.questProgress, live.questReceipts);
    });
    if (errors.length) throw new AggregateError(errors, 'Counted action restoration failed', { cause });
    return 'grant-failed';
  }
}
