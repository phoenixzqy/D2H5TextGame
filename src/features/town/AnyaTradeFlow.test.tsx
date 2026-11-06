/** Constructed historical Prison completion, unlocks and resources; actual public thaw repair, Talk, Claim and trades. */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { xpRequired } from '@/engine/progression/xp';
import { INSPECT_PROOF, POTION_SOURCE, THAW_PROOF } from '@/engine/save/act5-state';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { executeAct5QuestAction } from '@/features/quests/act5QuestActions';
import { QuestsScreen } from '@/features/quests/QuestsScreen';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore } from '@/stores';
import { TownScreen } from './TownScreen';

const quest = 'quests/side-act5-anyas-gift', prison = 'quests/act5-prison-of-ice';
const proof = `${quest}#action:talk-anya`, service = `${quest}#reward:service`;
const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore] as const;
const oldLocale = i18n.language, oldHydration = useHydrationStore.getState();
const oldShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
function hero() { const player = usePlayerStore.getState().player; if (!player) throw new Error('Missing Anya fixture hero'); return player; }
function mount(kind: 'town' | 'quests' = 'town') {
  const view = render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{kind === 'town' ? <TownScreen /> : <QuestsScreen />}</MemoryRouter></Suspense></I18nextProvider>);
  if (kind === 'quests') fireEvent.click(screen.getByRole('tab', { name: i18n.t('side', { ns: 'quests' }) }));
  return view;
}
function thaw() {
  // The source is repaired through supported real actions; no native victory or receipt is fabricated.
  expect(executeAct5QuestAction(INSPECT_PROOF)).toBe('ok');
  expect(executeAct5QuestAction(POTION_SOURCE)).toBe('ok');
  expect(executeAct5QuestAction(THAW_PROOF)).toBe('ok');
  expect(useInventoryStore.getState().questItems[POTION_SOURCE]?.state).toBe('consumed');
}
function talk() { fireEvent.click(screen.getByTestId('town-npc-anya')); }
function claimThroughJournal() {
  const view = mount('quests'); const card = within(screen.getByTestId(`quest-${quest}`));
  fireEvent.click(card.getByTestId(`quest-claim-${quest}`)); view.unmount();
}
beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
  // jsdom has no dialog renderer; real headed-browser focus/keyboard checks remain root-owned.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, writable: true,
    value(this: HTMLDialogElement) { this.open = true; } });
});
afterAll(() => {
  if (oldShowModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', oldShowModal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
});
beforeEach(() => {
  cleanup(); abortSubAreaRun(); __resetPersistenceForTests(); for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('ready');
  const fresh = createMockPlayer('Anya UI <hero>', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...fresh, level: 35, experience: 0, experienceToNextLevel: xpRequired(35), comboOrder: [] });
  usePlayerStore.setState(state => ({ player: state.player ? { ...state.player,
    derivedStats: { ...state.player.derivedStats, life: 17, mana: 11 } } : null }));
  useMapStore.setState({ currentAct: 5, currentSubAreaId: 'areas/act5-crystalline-passage', selectedDifficulty: 'normal',
    clearedSubAreas: ['areas/act4-chaos-sanctuary'], questProgress: {
      [prison]: { id: prison, status: 'completed', rewardClaimed: false,
        objectives: { 'obj-find-anya': true, 'obj-thaw': true, 'obj-kill-nihlathak': true } },
      [quest]: { id: quest, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-talk': false } }
    }, questReceipts: {} });
  useInventoryStore.setState({ materials: { 'materials/scrap': 80, 'gems/amethyst/chipped': 3 },
    currencies: { 'rune-shard': 4000, 'gem-shard': 7, gold: 123, 'opaque-wallet': 4 } });
});
afterEach(async () => {
  cleanup(); abortSubAreaRun(); __resetPersistenceForTests(); for (const store of stores) store.getState().reset();
  useHydrationStore.setState(oldHydration); await i18n.changeLanguage(oldLocale); vi.restoreAllMocks();
});

describe.each(['en', 'zh-CN'] as const)('Anya actual town/journal UI %s', locale => {
  it('uses real repaired thaw and town Talk, then separately Claims direct protection, charge and named catalog', async () => {
    await i18n.changeLanguage(locale); thaw(); const before = structuredClone(hero()), inventoryBefore = useInventoryStore.getState();
    const town = mount(); talk();
    expect(useMapStore.getState().questReceipts[proof]).toBe(true);
    expect(useMapStore.getState().questProgress[quest]).toMatchObject({ status: 'completed', rewardClaimed: false, objectives: { 'obj-talk': true } });
    expect(hero()).toEqual(before); expect(useInventoryStore.getState()).toBe(inventoryBefore);
    const panel = within(screen.getByTestId('anya-trades'));
    expect(panel.getAllByRole('button')).toHaveLength(2); for (const button of panel.getAllByRole('button')) expect(button).toBeDisabled();
    expect(screen.getByTestId('town-npc-anya')).toHaveFocus();
    expect(screen.getByTestId('town-greeting').textContent).not.toMatch(/town:|undefined/);
    town.unmount(); const journal = mount('quests'), card = within(screen.getByTestId(`quest-${quest}`));
    expect(card.getByText(i18n.t('items:unique.frostburn-gauntlet.name'), { exact: false })).toBeVisible();
    expect(card.getByText(i18n.t('items:unique.waterwalk.name'), { exact: false })).toBeVisible();
    expect(card.getByTestId(`quest-claim-${quest}`)).toBeEnabled(); fireEvent.click(card.getByTestId(`quest-claim-${quest}`));
    expect(useMapStore.getState().questProgress[quest]?.rewardClaimed).toBe(true);
    expect(useInventoryStore.getState().questServices[service]).toEqual({ serviceId: 'personalize_item', state: 'available' });
    expect(useInventoryStore.getState().questServices[`${prison}#reward:service`]).toBeUndefined();
    const after = hero();
    for (const channel of ['fire', 'cold', 'lightning', 'poison', 'arcane', 'physical'] as const) {
      expect(after.derivedStats.resistances[channel]).toBe(before.derivedStats.resistances[channel] + 10);
    }
    expect({ ...after, derivedStats: { ...after.derivedStats, resistances: before.derivedStats.resistances } }).toEqual(before);
    expect(useInventoryStore.getState().backpack).toBe(inventoryBefore.backpack);
    expect(useInventoryStore.getState().materials).toBe(inventoryBefore.materials); expect(useInventoryStore.getState().currencies).toEqual({ ...inventoryBefore.currencies, wishstone: 10 });
    expect(card.getByTestId(`quest-claim-${quest}`)).toBeDisabled();
    expect(screen.getByTestId(`quest-${quest}`).textContent).not.toMatch(/vendors\/|vendorUnlock|all_resist|undefined/); journal.unmount();
  });

  it('previews without payment, cancels with focus restored, then confirms two fixed one-stock trades without healing or autoequip', async () => {
    await i18n.changeLanguage(locale); thaw(); let town = mount(); talk(); town.unmount(); claimThroughJournal(); town = mount(); talk();
    const before = structuredClone(hero()), wallet = useInventoryStore.getState().currencies, materials = useInventoryStore.getState().materials,
      equippedBefore = useInventoryStore.getState().equipped;
    const first = screen.getByTestId('anya-trade-frostburn-gauntlet'), firstButton = within(first).getByRole('button');
    expect(first).toHaveTextContent('40'); expect(first).toHaveTextContent('2000'); expect(first).toHaveTextContent('49');
    firstButton.focus(); fireEvent.click(firstButton);
    expect(screen.getByRole('dialog')).toBeVisible(); expect(screen.getByTestId('anya-trade-cancel')).toHaveFocus();
    expect(hero()).toEqual(before); expect(useInventoryStore.getState().currencies).toBe(wallet); expect(useInventoryStore.getState().materials).toBe(materials);
    fireEvent.click(screen.getByTestId('anya-trade-cancel')); expect(firstButton).toHaveFocus();
    expect(screen.queryByRole('dialog')).toBeNull();
    for (const entry of ['frostburn-gauntlet', 'waterwalk']) {
      fireEvent.click(within(screen.getByTestId(`anya-trade-${entry}`)).getByRole('button'));
      fireEvent.click(screen.getByTestId('anya-trade-confirm'));
      expect(useMapStore.getState().questReceipts[`${quest}#trade:${entry}`]).toBe(true);
      expect(within(screen.getByTestId(`anya-trade-${entry}`)).getByRole('button')).toBeDisabled();
      const item = useInventoryStore.getState().backpack.find(row => row.uniqueId === `items/unique/${entry}`);
      expect(item).toMatchObject({ identified: true, equipped: false, level: 66, socketCapacity: 3 });
      expect(item?.socketContents ?? []).toEqual([]);
    }
    expect(useInventoryStore.getState().currencies).toEqual({ ...wallet, 'rune-shard': 0 });
    expect(useInventoryStore.getState().materials).toEqual({ 'gems/amethyst/chipped': 3 });
    expect(hero()).toEqual(before); expect(useInventoryStore.getState().equipped).toBe(equippedBefore);
    expect(useInventoryStore.getState().questServices[service]?.state).toBe('available');
    expect(screen.getByTestId('anya-trades').textContent).not.toMatch(/items\/|materials\/|anyaTrades\.|undefined/);
    town.unmount();
  });

  it('keeps source-free legacy claimed gift inert and shows locked stock without granting a replacement charge', async () => {
    await i18n.changeLanguage(locale);
    useMapStore.setState(state => ({ questProgress: { ...state.questProgress,
      [prison]: { id: prison, status: 'completed', rewardClaimed: true, objectives: { 'obj-find-anya': true, 'obj-thaw': true, 'obj-kill-nihlathak': true } },
      [quest]: { id: quest, status: 'completed', rewardClaimed: true, objectives: { 'obj-talk': true } } } }));
    const before = structuredClone(hero()), inventory = useInventoryStore.getState(), receipts = useMapStore.getState().questReceipts;
    mount(); talk();
    expect(screen.getByTestId('anya-trades')).toBeVisible();
    for (const button of within(screen.getByTestId('anya-trades')).getAllByRole('button')) expect(button).toBeDisabled();
    expect(hero()).toEqual(before); expect(useInventoryStore.getState()).toBe(inventory); expect(useMapStore.getState().questReceipts).toBe(receipts);
    act(() => { useHydrationStore.getState().setStatus('loading'); });
    for (const button of within(screen.getByTestId('anya-trades')).getAllByRole('button')) expect(button).toBeDisabled();
  });

  it.each(['hero', 'loading'] as const)('refuses the prepared confirmation after %s changes without payment or stock loss', async change => {
    await i18n.changeLanguage(locale); thaw(); const town = mount(); talk(); town.unmount(); claimThroughJournal(); mount(); talk();
    const inventory = useInventoryStore.getState(), receipts = useMapStore.getState().questReceipts;
    fireEvent.click(within(screen.getByTestId('anya-trade-frostburn-gauntlet')).getByRole('button'));
    expect(screen.getByRole('dialog')).toBeVisible();
    act(() => {
      if (change === 'hero') usePlayerStore.setState({ player: { ...hero(), name: 'Independent rename' } });
      else useHydrationStore.getState().setStatus('loading');
    });
    const currentHero = hero(); fireEvent.click(screen.getByTestId('anya-trade-confirm'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t(`anyaTrades.${change === 'hero' ? 'staleSelection' : 'busy'}`, { ns: 'town' }));
    expect(hero()).toBe(currentHero); expect(useInventoryStore.getState()).toBe(inventory);
    expect(useMapStore.getState().questReceipts).toBe(receipts);
    expect(Object.hasOwn(receipts, `${quest}#trade:frostburn-gauntlet`)).toBe(false);
    act(() => { useHydrationStore.getState().setStatus('ready'); });
    expect(within(screen.getByTestId('anya-trade-frostburn-gauntlet')).getByRole('button')).toBeEnabled();
  });
});
