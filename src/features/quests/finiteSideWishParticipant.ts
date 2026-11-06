import sideDocument from '@/data/quests/side.json';
import { loadQuests } from '@/data/loaders/quests';
import { useInventoryStore } from '@/stores/inventoryStore';
import { beginQuestCurrencyPublication, endQuestCurrencyPublication, verifyQuestCurrencyPublication } from '@/stores/questCurrencyJournal';
import { assertCountedData, sameCountedData, snapshotCountedData } from './countedQuestContract';

/** Reserve the authored finite bonus inside the caller's existing source transaction. */
export function captureFiniteSideWishParticipant(source: string) {
  assertCountedData(sideDocument);
  const quests = loadQuests(); assertCountedData(quests);
  const matches = quests.filter(row => row.id === source), quest = matches[0];
  const amount = quest?.rewards?.wishstones;
  if (matches.length !== 1 || quest?.type !== 'side' || amount !== 10) throw new Error('Invalid finite side wish reward');
  const definition = snapshotCountedData(quest);
  const owner = beginQuestCurrencyPublication(source, 'wishstone', amount, useInventoryStore.getState().currencies);
  let published = false;
  const check = () => {
    assertCountedData(sideDocument);
    const current = loadQuests(); assertCountedData(current);
    const matches = current.filter(row => row.id === source);
    if (matches.length !== 1 || !sameCountedData(matches[0], definition)) throw new Error('Finite side wish authority changed');
    verifyQuestCurrencyPublication(owner, useInventoryStore.getState().currencies, published);
  };
  return {
    check,
    publish: () => { useInventoryStore.getState().addQuestCurrency(owner); published = true; check(); },
    restore: () => { useInventoryStore.getState().restoreQuestCurrency(owner); published = false; },
    verifyRestored: () => { verifyQuestCurrencyPublication(owner, useInventoryStore.getState().currencies, false); },
    dispose: () => { endQuestCurrencyPublication(owner); }
  };
}
export type FiniteSideWishParticipant = ReturnType<typeof captureFiniteSideWishParticipant>;
