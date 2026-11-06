/** Constructed Radament/Act II capabilities; real conversation, Claim and crafting UI. */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { Suspense, type ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { loadMercPool } from '@/data/loaders/mercs';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { CraftingPanel } from '@/features/inventory/CraftingPanel';
import { TownScreen } from '@/features/town/TownScreen';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { createMercFromDef } from '@/stores/mercFactory';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore } from '@/stores';
import { QuestsScreen } from './QuestsScreen';

const quest = 'quests/side-act2-fara-favored';
const proof = `${quest}#action:talk-fara`;
const prerequisite = 'quests/act2-radaments-lair';
const rememberedArea = 'areas/act2-arcane-sanctuary';
const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore] as const;
const originalLocale = i18n.language;
const originalHydration = useHydrationStore.getState();
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing Fara UI fixture');
  return value;
}
const wrap = (children: ReactNode) => <I18nextProvider i18n={i18n}><Suspense fallback={null}>
  <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</MemoryRouter>
</Suspense></I18nextProvider>;
function reset() {
  cleanup(); abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of stores) store.getState().reset();
}
function actors() {
  return { hero: structuredClone(usePlayerStore.getState().player), mercs: JSON.stringify(useMercStore.getState()) };
}
function sideTab() { fireEvent.click(screen.getByRole('tab', { name: i18n.t('side', { ns: 'quests' }) })); }
function talk() {
  const npc = screen.getByTestId('town-npc-fara');
  expect(npc).toHaveAccessibleName(i18n.t('town.npc.fara', { ns: 'town' }));
  fireEvent.click(npc);
  expect(npc).toHaveFocus();
  expect(npc).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByTestId('town-greeting')).toHaveTextContent(i18n.t('dialogue.greetings.act2.fara', { ns: 'town' }));
}

beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  const fresh = createMockPlayer('Fara visitor', 'sorceress');
  const hero = { ...fresh, equipment: [] };
  const canonical = deriveEquippedPlayerStats(hero, 1, {});
  // Deliberately stale caches and damaged pools: a currency-only Talk/Claim must not normalize actors.
  usePlayerStore.getState().setPlayer({ ...hero, derivedStats: { ...canonical, defense: canonical.defense + 7, life: 17, mana: 7 } });
  const def = required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee'));
  const merc = createMercFromDef(def, 'fara-ui');
  useMercStore.getState().addMerc(merc); useMercStore.getState().setFieldedMerc(merc.id);
  useMercStore.setState({ ownedMercs: [{ ...merc, derivedStats: { ...merc.derivedStats, defense: merc.derivedStats.defense + 5, life: 11, mana: 3 } }] });
  useMapStore.setState({ currentAct: 2, currentSubAreaId: rememberedArea, selectedDifficulty: 'normal',
    clearedSubAreas: ['areas/act1-catacombs'], questProgress: {
      [prerequisite]: { id: prerequisite, status: 'completed', rewardClaimed: false, objectives: { 'obj-kill-radament': true } },
      [quest]: { id: quest, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-talk': false } }
    }, questReceipts: {} });
  // These three ordinary gems are supplied by the capability, never by Fara.
  useInventoryStore.setState({ materials: { 'gems/amethyst/chipped': 3 },
    currencies: { 'gem-shard': 0, gemShards: 77, gold: 123, 'opaque-wallet': 4 } });
});
afterEach(async () => {
  reset(); useHydrationStore.setState(originalHydration);
  await i18n.changeLanguage(originalLocale); vi.restoreAllMocks();
});

describe.each(['en', 'zh-CN'] as const)('Fara real public flow %s', locale => {
  it('Talks without income, Claims exactly one shard without actor normalization, then confirms existing gem fusion', async () => {
    await i18n.changeLanguage(locale);
    const before = actors();
    const materials = structuredClone(useInventoryStore.getState().materials);
    const wallet = structuredClone(useInventoryStore.getState().currencies);
    const view = render(wrap(<TownScreen />));
    expect(useMapStore.getState().questReceipts).toEqual({});
    expect(actors()).toEqual(before);
    talk();
    expect(useMapStore.getState().questReceipts).toEqual({ [proof]: true });
    expect(useMapStore.getState().questProgress[quest]).toEqual({ id: quest, status: 'completed', rewardClaimed: false,
      objectives: { 'obj-talk': true } });
    expect(useMapStore.getState().questProgress[prerequisite]?.rewardClaimed).toBe(false);
    expect(useMapStore.getState().currentSubAreaId).toBe(rememberedArea);
    expect(actors()).toEqual(before);
    expect(useInventoryStore.getState().currencies).toEqual(wallet);
    expect(useInventoryStore.getState().materials).toEqual(materials);
    expect(useInventoryStore.getState().backpack).toEqual([]);
    talk();
    expect(useMapStore.getState().questReceipts).toEqual({ [proof]: true });
    expect(useInventoryStore.getState().currencies).toEqual(wallet);

    act(() => { useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor'); });
    view.rerender(wrap(<QuestsScreen />)); sideTab();
    const card = screen.getByTestId(`quest-${quest}`);
    expect(card).toHaveTextContent(`1 ${i18n.t('rewardLabel.gemShards', { ns: 'quests' })}`);
    expect(card).toHaveTextContent(`10 ${i18n.t('wishstones', { ns: 'gacha' })}`);
    expect(card.textContent).not.toMatch(/repair_discount|repair|discount|修理|折扣|gemShards|rewardLabel\.|undefined/i);
    const claim = screen.getByTestId(`quest-claim-${quest}`);
    expect(claim).toBeEnabled();
    expect(actors()).toEqual(before);
    fireEvent.click(claim);
    expect(claim).toBeDisabled();
    expect(useInventoryStore.getState().currencies).toEqual({ ...wallet, 'gem-shard': 1, wishstone: 10 });
    expect(useInventoryStore.getState().materials).toEqual(materials);
    expect(useInventoryStore.getState().backpack).toEqual([]);
    expect(actors()).toEqual(before);
    expect(useMapStore.getState().questReceipts).toEqual({ [proof]: true });
    expect(useMapStore.getState().questProgress[quest]?.rewardClaimed).toBe(true);
    fireEvent.click(claim);
    expect(useInventoryStore.getState().currencies).toEqual({ ...wallet, 'gem-shard': 1, wishstone: 10 });

    view.rerender(wrap(<CraftingPanel />));
    fireEvent.change(screen.getByLabelText(i18n.t('crafting.action', { ns: 'inventory' })), { target: { value: 'gem-fusion' } });
    fireEvent.change(screen.getByLabelText(i18n.t('crafting.recipeLabel', { ns: 'inventory' })),
      { target: { value: 'recipes/gem-fusion/amethyst/chipped' } });
    fireEvent.click(screen.getByRole('button', { name: i18n.t('crafting.preview', { ns: 'inventory' }) }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).not.toMatch(/recipes\/|gems\/|undefined/);
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(1);
    expect(useInventoryStore.getState().materials).toEqual(materials);
    const confirm = within(dialog).getByRole('button', { name: i18n.t('crafting.confirm', { ns: 'inventory' }) });
    fireEvent.click(confirm); fireEvent.click(confirm);
    expect(useInventoryStore.getState().materials).toEqual({ 'gems/amethyst/flawed': 1 });
    expect(useInventoryStore.getState().currencies).toEqual({ ...wallet, wishstone: 10 });
    expect(useInventoryStore.getState().materialActionOrdinal).toBe(1);
    expect(useMapStore.getState().questReceipts).toEqual({ [proof]: true });
    expect(useMapStore.getState().questProgress[quest]?.rewardClaimed).toBe(true);
    expect(actors()).toEqual(before);
  });

  it('keeps the real conversation available before Radament without creating proof or rewards', async () => {
    await i18n.changeLanguage(locale);
    useMapStore.setState({ questProgress: { [quest]: { id: quest, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-talk': false } } } });
    const before = actors(), wallet = structuredClone(useInventoryStore.getState().currencies);
    render(wrap(<TownScreen />)); talk();
    expect(screen.getByTestId('town-greeting')).toHaveTextContent(locale === 'en' ? 'Radament' : '拉达门特');
    expect(useMapStore.getState().questProgress[quest]).toMatchObject({ status: 'inProgress', objectives: { 'obj-talk': false } });
    expect(useMapStore.getState().questReceipts).toEqual({});
    expect(useInventoryStore.getState().currencies).toEqual(wallet);
    expect(actors()).toEqual(before);
    fireEvent.click(screen.getByTestId('town-conversation-close'));
    expect(screen.queryByTestId('town-conversation')).not.toBeInTheDocument();
    expect(screen.getByTestId('town-npc-fara')).toHaveFocus();
  });

  it('refuses copied completed flags until an actual eligible Fara conversation earns the missing receipt', async () => {
    await i18n.changeLanguage(locale);
    useMapStore.setState({ questProgress: { ...useMapStore.getState().questProgress,
      [quest]: { id: quest, status: 'completed', rewardClaimed: false, objectives: { 'obj-talk': true } } } });
    const before = actors(), wallet = structuredClone(useInventoryStore.getState().currencies);
    const view = render(wrap(<QuestsScreen />)); sideTab();
    expect(screen.getByTestId(`quest-claim-${quest}`)).toBeDisabled();
    fireEvent.click(screen.getByTestId(`quest-claim-${quest}`));
    expect(useInventoryStore.getState().currencies).toEqual(wallet);
    expect(useMapStore.getState().questReceipts).toEqual({});
    view.rerender(wrap(<TownScreen />)); talk();
    expect(useMapStore.getState().questReceipts).toEqual({ [proof]: true });
    expect(useInventoryStore.getState().currencies).toEqual(wallet);
    view.rerender(wrap(<QuestsScreen />)); sideTab();
    expect(screen.getByTestId(`quest-claim-${quest}`)).toBeEnabled();
    expect(actors()).toEqual(before);
  });
});
