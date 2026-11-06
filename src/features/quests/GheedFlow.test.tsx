/** Constructed Cold Plains capabilities; real Recover, Claim and gem-fusion UI. */
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
import { xpRequired, xpTotal } from '@/engine/progression/xp';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { CraftingPanel } from '@/features/inventory/CraftingPanel';
import { QuestItemsPanel } from '@/features/inventory/QuestItemsPanel';
import { AreaObjectsPanel } from '@/features/map/AreaObjectsPanel';
import { TownScreen } from '@/features/town/TownScreen';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { createMercFromDef } from '@/stores/mercFactory';
import { mercXpForLevel } from '@/stores/mercStore';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore } from '@/stores';
import { QuestsScreen } from './QuestsScreen';

const quest = 'quests/side-act1-gheeds-gamble';
const source = (n: number) => `${quest}#objective:obj-gamble-5:source:lot-${String(n)}`;
const recoverId = (n: number) => `counted-recover-objects/gheed_salvage_lot_${String(n)}`;
const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore] as const;
const originalLocale = i18n.language;
const originalHydration = useHydrationStore.getState();
function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Missing Gheed UI fixture');
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
function mercXp() {
  const state = useMercStore.getState();
  const merc = required(state.ownedMercs.find(row => row.id === state.fieldedMercId));
  let total = state.getMercProgress(merc.id).experience;
  for (let level = 1; level < merc.level; level++) total += mercXpForLevel(level);
  return total;
}
function sideTab() { fireEvent.click(screen.getByRole('tab', { name: i18n.t('side', { ns: 'quests' }) })); }
const finds = () => <><AreaObjectsPanel act={1} areaId="areas/act1-cold-plains" onClose={() => undefined} /><QuestItemsPanel /></>;
const journal = () => <><QuestsScreen /><QuestItemsPanel /></>;

beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  const fresh = createMockPlayer('Salvage explorer', 'sorceress');
  const hero = { ...fresh, level: 35, experience: 0, experienceToNextLevel: xpRequired(35), equipment: [] };
  const canonical = deriveEquippedPlayerStats(hero, 35, {});
  usePlayerStore.getState().setPlayer({ ...hero, derivedStats: { ...canonical, defense: canonical.defense + 7, life: 17, mana: 7 } });
  const def = required(loadMercPool().pool.find(row => row.id === 'mercs/act1-rogue-trainee'));
  const merc = createMercFromDef(def, 'gheed-ui');
  useMercStore.getState().addMerc(merc); useMercStore.getState().setFieldedMerc(merc.id);
  useMercStore.setState({ ownedMercs: [{ ...merc, derivedStats: { ...merc.derivedStats, defense: merc.derivedStats.defense + 5, life: 11, mana: 3 } }] });
  useMapStore.setState({ currentAct: 1, currentSubAreaId: 'areas/act1-cold-plains', selectedDifficulty: 'normal',
    clearedSubAreas: [], questProgress: {
      [quest]: { id: quest, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-gamble-5': false } }
    }, questReceipts: {} });
  // These matching ordinary gems are supplied by the capability, never by Gheed.
  useInventoryStore.setState({ materials: { 'gems/amethyst/chipped': 3 },
    currencies: { 'gem-shard': 0, gemShards: 77, gold: 123, 'opaque-wallet': 4 } });
});
afterEach(async () => {
  reset(); useHydrationStore.setState(originalHydration);
  await i18n.changeLanguage(originalLocale); vi.restoreAllMocks();
});

describe.each(['en', 'zh-CN'] as const)('Gheed real public flow %s', locale => {
  it('Recovers five distinct unpaid lots, separately Claims1000/750 and one shard, then fuses supplied gems', async () => {
    await i18n.changeLanguage(locale);
    const before = actors(), mercBefore = mercXp();
    const mercStatsBefore = required(useMercStore.getState().ownedMercs[0]).derivedStats;
    const wallet = structuredClone(useInventoryStore.getState().currencies);
    const materials = structuredClone(useInventoryStore.getState().materials);
    const view = render(wrap(finds()));
    expect(useInventoryStore.getState().questItems).toEqual({});
    expect(within(screen.getByTestId('counted-quest-sources')).getAllByRole('button')).toHaveLength(5);
    for (const [index, n] of [3, 1, 5, 2, 4].entries()) {
      const button = screen.getByTestId(recoverId(n));
      expect(button).toHaveAccessibleName(i18n.t('counted.recover', { ns: 'quests',
        item: i18n.t('questItems.counted.gheed.name', { ns: 'inventory' }), number: n }));
      expect(button).toBeEnabled(); fireEvent.click(button); expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(Object.keys(useInventoryStore.getState().questItems)).toHaveLength(index + 1);
      expect(useInventoryStore.getState().questItems[source(n)]).toEqual({ itemId: 'quest/gheed_salvage_lot', state: 'owned' });
      expect(useMapStore.getState().questProgress[quest]).toMatchObject({ status: index === 4 ? 'completed' : 'inProgress',
        rewardClaimed: false, objectives: { 'obj-gamble-5': index === 4 } });
      expect(screen.getByTestId('counted-area-progress-gheed')).toHaveTextContent(`${String(index + 1)}/5`);
      expect(actors()).toEqual(before);
      expect(useInventoryStore.getState().currencies).toEqual(wallet);
      expect(useInventoryStore.getState().materials).toEqual(materials);
      expect(useMapStore.getState().questReceipts).toEqual({});
    }
    const items = screen.getByTestId('quest-counted-item-gheed');
    expect(within(items).queryByRole('button')).toBeNull();
    expect(items.textContent).not.toMatch(/questItems\.|objects\/|undefined/);
    // Claim follows ordinary readiness and can occur away from the source on another difficulty.
    act(() => { useMapStore.setState({ currentSubAreaId: null, selectedDifficulty: 'nightmare' }); });
    view.rerender(wrap(journal())); sideTab();
    const card = screen.getByTestId(`quest-${quest}`);
    expect(card).toHaveTextContent('1000');
    expect(card).toHaveTextContent(`1 ${i18n.t('rewardLabel.gemShards', { ns: 'quests' })}`);
    expect(card).toHaveTextContent(`10 ${i18n.t('wishstones', { ns: 'gacha' })}`);
    expect(card.textContent).not.toMatch(/gold|gambl|金币|赌博|items\/|gemShards|rewardLabel\.|undefined/i);
    const claim = screen.getByTestId(`quest-claim-${quest}`);
    expect(claim).toBeEnabled(); fireEvent.click(claim); expect(claim).toBeDisabled();
    expect(useInventoryStore.getState().currencies).toEqual({ ...wallet, 'gem-shard': 1, wishstone: 10 });
    expect(useInventoryStore.getState().materials).toEqual(materials);
    expect(useInventoryStore.getState().backpack).toEqual([]);
    expect(useInventoryStore.getState().questItems).toEqual(Object.fromEntries([1, 2, 3, 4, 5].map(n =>
      [source(n), { itemId: 'quest/gheed_salvage_lot', state: 'consumed' }])));
    expect(useMapStore.getState().questProgress[quest]?.rewardClaimed).toBe(true);
    const paidHero = required(usePlayerStore.getState().player);
    expect(xpTotal(paidHero.level) + paidHero.experience).toBe(xpTotal(35) + 1000);
    expect(mercXp()).toBe(mercBefore + 750);
    expect(usePlayerStore.getState().player?.derivedStats).toMatchObject({ life: 17, mana: 7 });
    const mercStatsAfter = required(useMercStore.getState().ownedMercs[0]).derivedStats;
    expect(mercStatsAfter.lifeMax - mercStatsAfter.life).toBe(mercStatsBefore.lifeMax - mercStatsBefore.life);
    expect(mercStatsAfter.mana).toBe(3);
    const paid = actors();
    fireEvent.click(claim);
    expect(actors()).toEqual(paid);
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(1);

    // The alternate profile above tests Claim; crafting keeps its own earned-profile guard.
    act(() => { useMapStore.setState({ selectedDifficulty: 'normal' }); });
    view.rerender(wrap(<CraftingPanel />));
    fireEvent.change(screen.getByLabelText(i18n.t('crafting.action', { ns: 'inventory' })), { target: { value: 'gem-fusion' } });
    fireEvent.change(screen.getByLabelText(i18n.t('crafting.recipeLabel', { ns: 'inventory' })),
      { target: { value: 'recipes/gem-fusion/amethyst/chipped' } });
    fireEvent.click(screen.getByRole('button', { name: i18n.t('crafting.preview', { ns: 'inventory' }) }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).not.toMatch(/recipes\/|gems\/|undefined/);
    expect(useInventoryStore.getState().materials).toEqual(materials);
    expect(useInventoryStore.getState().currencies['gem-shard']).toBe(1);
    fireEvent.click(within(dialog).getByRole('button', { name: i18n.t('crafting.confirm', { ns: 'inventory' }) }));
    expect(useInventoryStore.getState().materials).toEqual({ 'gems/amethyst/flawed': 1 });
    expect(useInventoryStore.getState().currencies).toEqual({ ...wallet, wishstone: 10 });
    expect(useInventoryStore.getState().materialActionOrdinal).toBe(1);
    expect(actors()).toEqual(paid);
  });

  it('refuses copied completed flags until five real Recover actions supply Claim proof', async () => {
    await i18n.changeLanguage(locale);
    useMapStore.setState({ questProgress: { [quest]: { id: quest, status: 'completed', rewardClaimed: false,
      objectives: { 'obj-gamble-5': true } } } });
    const before = actors(), wallet = structuredClone(useInventoryStore.getState().currencies);
    const view = render(wrap(journal())); sideTab();
    expect(screen.getByTestId(`quest-claim-${quest}`)).toBeDisabled();
    expect(screen.getByTestId('counted-journal-gheed')).toHaveTextContent('0/5');
    expect(screen.getByTestId('counted-journal-gheed')).toHaveTextContent(i18n.t('counted.repair', { ns: 'quests' }));
    view.rerender(wrap(finds()));
    for (const n of [1, 2, 3, 4, 5]) fireEvent.click(screen.getByTestId(recoverId(n)));
    expect(useInventoryStore.getState().currencies).toEqual(wallet);
    expect(actors()).toEqual(before);
    view.rerender(wrap(journal())); sideTab();
    expect(screen.getByTestId(`quest-claim-${quest}`)).toBeEnabled();
  });

  it('keeps wrong difficulty/location and historical claimed sources inert while Talk only explains the deal', async () => {
    await i18n.changeLanguage(locale);
    const before = actors(), wallet = structuredClone(useInventoryStore.getState().currencies);
    useMapStore.setState({ selectedDifficulty: 'nightmare' });
    const view = render(wrap(finds()));
    expect(screen.getByTestId(recoverId(1))).toBeDisabled();
    act(() => { useMapStore.setState({ selectedDifficulty: 'normal', currentSubAreaId: 'areas/act1-dark-wood' }); });
    expect(screen.getByTestId(recoverId(1))).toBeDisabled();
    act(() => { useMapStore.setState({ currentSubAreaId: 'areas/act1-cold-plains', questProgress: {
      [quest]: { id: quest, status: 'completed', rewardClaimed: true, objectives: { 'obj-gamble-5': true } }
    } }); });
    expect(screen.getByTestId(recoverId(1))).toBeDisabled();
    view.rerender(wrap(<TownScreen />));
    const npc = screen.getByTestId('town-npc-gheed');
    expect(npc).toHaveAccessibleName(i18n.t('town.npc.gheed', { ns: 'town' }));
    fireEvent.click(npc);
    expect(npc).toHaveFocus();
    expect(screen.getByTestId('town-greeting')).toHaveTextContent(i18n.t('dialogue.greetings.gheed', { ns: 'town' }));
    expect(screen.getByTestId('town-greeting').textContent).not.toMatch(/gold|gambl|hire|金币|赌博|雇佣|吉德/i);
    expect(useInventoryStore.getState().questItems).toEqual({});
    expect(useMapStore.getState().questReceipts).toEqual({});
    expect(useInventoryStore.getState().currencies).toEqual(wallet);
    expect(actors()).toEqual(before);
    fireEvent.click(screen.getByTestId('town-conversation-close'));
    expect(npc).toHaveFocus();
  });
});
