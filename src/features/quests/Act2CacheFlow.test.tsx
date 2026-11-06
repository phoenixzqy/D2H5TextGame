/** Constructed UI capabilities; no claim of owner-earned Act II access or campaign pacing. */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import i18n from '@/i18n';
import { loadMercPool } from '@/data/loaders/mercs';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { xpRequired, xpTotal } from '@/engine/progression/xp';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { AreaObjectsPanel } from '@/features/map/AreaObjectsPanel';
import { QuestItemsPanel } from '@/features/inventory/QuestItemsPanel';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { createMercFromDef } from '@/stores/mercFactory';
import { mercXpForLevel } from '@/stores/mercStore';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { QuestsScreen } from './QuestsScreen';
import { hasAreaObjects } from './interactObject';

const caches = [
  { quest: 'quests/side-act2-summoners-secret', objective: 'obj-find', item: 'quest/horazon_lockbox',
    area: 'areas/act2-arcane-sanctuary', localeKey: 'horazonLockbox', xp: 5000, mercXp: 3750,
    uniqueId: 'items/unique/manald-heal', ilvl: 23, uniqueSlug: 'manald-heal' },
  { quest: 'quests/side-act2-lost-caravan', objective: 'obj-find-box', item: 'quest/elzix_strongbox',
    area: 'areas/act2-far-oasis', localeKey: 'elzixStrongbox', xp: 3000, mercXp: 2250,
    uniqueId: 'items/unique/eye-of-etlich', ilvl: 18, uniqueSlug: 'eye-of-etlich' }
] as const;
const stores = [useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore] as const;
const originalLocale = i18n.language;
const hydration = useHydrationStore.getState();
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing retained-cache UI fixture');
  return value;
}
const wrap = (children: ReactNode) => <I18nextProvider i18n={i18n}>
  <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</MemoryRouter>
</I18nextProvider>;
const reset = () => { abortSubAreaRun(); stores.forEach(store => { store.getState().reset(); }); };
const heroXp = () => {
  const hero = required(usePlayerStore.getState().player);
  return xpTotal(hero.level) + hero.experience;
};
function mercXp(id: string) {
  const mercs = useMercStore.getState();
  const merc = required(mercs.ownedMercs.find(row => row.id === id));
  let total = mercs.getMercProgress(id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  __resetPersistenceForTests(); reset();
  useHydrationStore.getState().setStatus('ready');
  const fresh = createMockPlayer('Cache explorer', 'sorceress');
  const player = { ...fresh, level: 35, equipment: [], experience: 0, experienceToNextLevel: xpRequired(35) };
  const derivedStats = deriveEquippedPlayerStats(player, 35, {});
  usePlayerStore.getState().setPlayer({ ...player, derivedStats: { ...derivedStats, life: 17, mana: 7 } });
  // Only the existing Act I chapter clear grants Act II access; neither cache area is cleared.
  useMapStore.setState({ currentAct: 2, selectedDifficulty: 'normal', clearedSubAreas: ['areas/act1-catacombs'] });
  useInventoryStore.setState({ currencies: { gold: 123, 'opaque-wallet': 4 } });
});
afterEach(async () => {
  reset(); __resetPersistenceForTests();
  useHydrationStore.setState(hydration);
  await i18n.changeLanguage(originalLocale);
  vi.restoreAllMocks();
});

describe.each(['en', 'zh-CN'] as const)('retained-cache public UI %s', locale => {
  it.each(caches)('$quest: real Recover, owned memento and separate named Claim', async entry => {
    await i18n.changeLanguage(locale);
    const mercDef = required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee'));
    const merc = createMercFromDef(mercDef, 'cache-ui');
    useMercStore.getState().addMerc(merc);
    useMercStore.getState().setFieldedMerc(merc.id);
    const source = `${entry.quest}#objective:${entry.objective}`;
    useMapStore.setState({ currentSubAreaId: entry.area, questProgress: {
      [entry.quest]: { id: entry.quest, status: 'inProgress', rewardClaimed: false, objectives: { [entry.objective]: false } }
    } });
    const beforeHero = structuredClone(usePlayerStore.getState().player);
    const beforeMercs = JSON.stringify(useMercStore.getState());
    const beforeWallet = structuredClone(useInventoryStore.getState().currencies);
    const beforeHeroXp = heroXp(), beforeMercXp = mercXp(merc.id);
    expect(hasAreaObjects(2, entry.area)).toBe(true);
    expect(hasAreaObjects(1, entry.area)).toBe(false);
    const view = render(wrap(<><AreaObjectsPanel act={2} areaId={entry.area} onClose={() => undefined} /><QuestItemsPanel /></>));
    const recover = screen.getByTestId(`quest-recover-${entry.item}`);
    expect(recover).toHaveAccessibleName(i18n.t('areaObjects.recover', { ns: 'quests' }));
    expect(recover).toBeEnabled();
    expect(useInventoryStore.getState().questItems).toEqual({});
    expect(usePlayerStore.getState().player).toEqual(beforeHero);
    fireEvent.click(recover);
    expect(recover).toBeDisabled();
    expect(useMapStore.getState().questProgress[entry.quest]).toEqual({ id: entry.quest, status: 'completed',
      rewardClaimed: false, objectives: { [entry.objective]: true } });
    expect(useInventoryStore.getState().questItems).toEqual({ [source]: { itemId: entry.item, state: 'owned' } });
    expect(usePlayerStore.getState().player).toEqual(beforeHero);
    expect(JSON.stringify(useMercStore.getState())).toBe(beforeMercs);
    expect(useInventoryStore.getState().currencies).toEqual(beforeWallet);
    expect(useInventoryStore.getState().backpack).toEqual([]);
    const proof = screen.getByTestId(`quest-item-${entry.item}`);
    expect(proof).toHaveTextContent(i18n.t(`questItems.${entry.localeKey}.name`, { ns: 'inventory' }));
    expect(proof).toHaveTextContent(i18n.t('questItems.owned', { ns: 'inventory' }));
    expect(within(proof).queryByRole('button')).toBeNull();
    expect(proof.textContent).not.toMatch(/questItems\.|quest\/|undefined/);

    act(() => { useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor'); });
    view.rerender(wrap(<><QuestsScreen /><QuestItemsPanel /></>));
    fireEvent.click(screen.getByRole('tab', { name: i18n.t('side', { ns: 'quests' }) }));
    const card = screen.getByTestId(`quest-${entry.quest}`);
    expect(card).toHaveTextContent(i18n.t(`unique.${entry.uniqueSlug}.name`, { ns: 'items' }));
    expect(card.textContent).not.toMatch(/items\/|rewardLabel\.|ilvl|unique_.*_random|undefined/);
    const claim = screen.getByTestId(`quest-claim-${entry.quest}`);
    expect(claim).toBeEnabled();
    fireEvent.click(claim);
    expect(claim).toBeDisabled();
    expect(useMapStore.getState().questProgress[entry.quest]?.rewardClaimed).toBe(true);
    expect(heroXp()).toBe(beforeHeroXp + entry.xp);
    expect(mercXp(merc.id)).toBe(beforeMercXp + entry.mercXp);
    expect(useInventoryStore.getState().backpack).toHaveLength(1);
    expect(useInventoryStore.getState().backpack[0]).toMatchObject({ uniqueId: entry.uniqueId, ilvl: entry.ilvl,
      identified: true, equipped: false });
    expect(useInventoryStore.getState().equipped).toEqual({});
    expect(useInventoryStore.getState().questItems[source]).toEqual({ itemId: entry.item, state: 'owned' });
    expect(useInventoryStore.getState().currencies).toEqual({ ...beforeWallet, wishstone: 10 });
    const paidHero = structuredClone(usePlayerStore.getState().player);
    expect(paidHero?.derivedStats.life).toBe(beforeHero?.derivedStats.life);
    expect(paidHero?.derivedStats.mana).toBe(beforeHero?.derivedStats.mana);
    const paidMerc = mercXp(merc.id), paidItems = structuredClone(useInventoryStore.getState().backpack);
    fireEvent.click(claim);
    expect(usePlayerStore.getState().player).toEqual(paidHero);
    expect(mercXp(merc.id)).toBe(paidMerc);
    expect(useInventoryStore.getState().backpack).toEqual(paidItems);
    expect(screen.getByTestId(`quest-item-${entry.item}`)).toHaveTextContent(i18n.t('questItems.owned', { ns: 'inventory' }));
  });

  it.each(caches)('$quest: source-free legacy completion does not expose a payable Claim', async entry => {
    await i18n.changeLanguage(locale);
    useMapStore.setState({ currentSubAreaId: entry.area, questProgress: {
      [entry.quest]: { id: entry.quest, status: 'completed', rewardClaimed: false, objectives: { [entry.objective]: true } }
    } });
    const view = render(wrap(<QuestsScreen />));
    fireEvent.click(screen.getByRole('tab', { name: i18n.t('side', { ns: 'quests' }) }));
    const claim = screen.getByTestId(`quest-claim-${entry.quest}`);
    expect(claim).toBeDisabled();
    const before = heroXp();
    fireEvent.click(claim);
    expect(heroXp()).toBe(before);
    expect(useInventoryStore.getState().questItems).toEqual({});
    view.rerender(wrap(<AreaObjectsPanel act={2} areaId={entry.area} onClose={() => undefined} />));
    const recover = screen.getByTestId(`quest-recover-${entry.item}`);
    expect(recover).toBeEnabled();
    fireEvent.click(recover);
    expect(useInventoryStore.getState().questItems[`${entry.quest}#objective:${entry.objective}`]).toEqual({ itemId: entry.item, state: 'owned' });
    expect(heroXp()).toBe(before);
  });
});
