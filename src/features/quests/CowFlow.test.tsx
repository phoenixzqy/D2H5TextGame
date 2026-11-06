/** Constructed Dark Wood clear/retained-Cube capabilities; real Cow source UI actions. */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import { Suspense, type ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, useLocation } from 'react-router-dom';
import i18n from '@/i18n';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { xpRequired } from '@/engine/progression/xp';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { QuestItemsPanel } from '@/features/inventory/QuestItemsPanel';
import { AreaObjectsPanel } from '@/features/map/AreaObjectsPanel';
import { TownScreen } from '@/features/town/TownScreen';
import { abortSubAreaRun } from '@/stores/combatHelpers';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore } from '@/stores';
import { QuestsScreen } from './QuestsScreen';

const quest = 'quests/side-act1-pandemonium-cow-rumor';
const leg = `${quest}#objective:obj-find-leg`;
const tome = `${quest}#action:receive-portal-tome`;
const opened = `${quest}#action:open-cow-portal`;
const cubeQuest = 'quests/act2-horadric-staff';
const cube = `${cubeQuest}#objective:obj-cube`;
const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore, useMercStore, useMetaStore, usePlayerStore] as const;
const originalLocale = i18n.language;
const originalHydration = useHydrationStore.getState();
function RouteProbe() { const route = useLocation(); return <output data-testid="test-route">{route.pathname}{route.search}</output>; }
const wrap = (children: ReactNode) => <I18nextProvider i18n={i18n}><Suspense fallback={null}>
  <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}<RouteProbe /></MemoryRouter>
</Suspense></I18nextProvider>;
function reset() {
  cleanup(); abortSubAreaRun(); __resetPersistenceForTests();
  for (const store of stores) store.getState().reset();
}
function snapshot() {
  return { hero: structuredClone(usePlayerStore.getState().player), inventory: JSON.stringify(useInventoryStore.getState()),
    merc: JSON.stringify(useMercStore.getState()) };
}
function sideTab() { fireEvent.click(screen.getByRole('tab', { name: i18n.t('side', { ns: 'quests' }) })); }
const world = () => <><AreaObjectsPanel act={1} areaId="areas/act1-dark-wood" onClose={() => undefined} /><QuestItemsPanel /></>;
function talk() { fireEvent.click(screen.getByTestId('town-npc-akara')); }

beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  reset(); useHydrationStore.getState().setStatus('ready');
  const fresh = createMockPlayer('Cow explorer', 'sorceress');
  const hero = { ...fresh, level: 35, experience: 0, experienceToNextLevel: xpRequired(35), equipment: [] };
  const stats = deriveEquippedPlayerStats(hero, 35, {});
  usePlayerStore.getState().setPlayer({ ...hero, derivedStats: { ...stats, defense: stats.defense + 7, life: 17, mana: 7 } });
  useMapStore.setState({ currentAct: 1, currentSubAreaId: 'areas/act1-dark-wood', selectedDifficulty: 'normal',
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act1-dark-wood'], questProgress: {
      [quest]: { id: quest, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-find-leg': false, 'obj-open-portal': false } },
      [cubeQuest]: { id: cubeQuest, status: 'inProgress', objectives: {
        'obj-cube': true, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false
      } }
    }, questReceipts: {} });
  // The actual retained Cube is supplied by the capability, never by Cow flags.
  useInventoryStore.setState({ questItems: { [cube]: { itemId: 'quest/horadric_cube', state: 'owned' } },
    currencies: { gold: 123, 'opaque-wallet': 4 } });
});
afterEach(async () => {
  reset(); useHydrationStore.setState(originalHydration);
  await i18n.changeLanguage(originalLocale); vi.restoreAllMocks();
});

describe.each(['en', 'zh-CN'] as const)('Cow actual source UI %s', locale => {
  it('Recovers, Receives and Transmutes real ingredients without income, then enters the exact Cow route while Claim waits for victory', async () => {
    await i18n.changeLanguage(locale);
    const before = snapshot();
    const view = render(wrap(world()));
    expect(useMapStore.getState().questReceipts).toEqual({});
    expect(snapshot()).toEqual(before);
    expect(screen.queryByTestId('quest-recover-quest/wirts_leg')).not.toBeInTheDocument();
    expect(screen.getByTestId('area-object-panel').textContent).not.toMatch(/areaObjects\.tools\.wirts_leg|questItems\.|undefined/);
    const recover = screen.getByTestId('cow-recover-leg');
    expect(recover).toBeEnabled(); fireEvent.click(recover); expect(recover).toBeDisabled();
    expect(useInventoryStore.getState().questItems[leg]).toEqual({ itemId: 'quest/wirts_leg', state: 'owned' });
    expect(useMapStore.getState().questProgress[quest]).toMatchObject({ status: 'inProgress',
      objectives: { 'obj-find-leg': true, 'obj-open-portal': false } });
    view.rerender(wrap(<TownScreen />)); talk();
    expect(useInventoryStore.getState().questItems[tome]).toBeUndefined();
    const receive = screen.getByTestId('cow-receive-tome');
    expect(receive).toBeEnabled(); fireEvent.click(receive); expect(receive).toBeDisabled();
    expect(useInventoryStore.getState().questItems[tome]).toEqual({ itemId: 'quest/cow_portal_tome', state: 'owned' });
    expect(useMapStore.getState().questReceipts).toEqual({ [tome]: true });
    const transmute = screen.getByTestId('cow-transmute');
    expect(transmute).toBeEnabled(); fireEvent.click(transmute); expect(transmute).toBeDisabled();
    expect(useInventoryStore.getState().questItems).toEqual({
      [cube]: { itemId: 'quest/horadric_cube', state: 'owned' },
      [leg]: { itemId: 'quest/wirts_leg', state: 'consumed' },
      [tome]: { itemId: 'quest/cow_portal_tome', state: 'consumed' }
    });
    expect(useMapStore.getState().questReceipts).toEqual({ [tome]: true, [opened]: true });
    expect(useMapStore.getState().questProgress[quest]).toMatchObject({ status: 'completed', rewardClaimed: false,
      objectives: { 'obj-find-leg': true, 'obj-open-portal': true } });
    expect(usePlayerStore.getState().player).toEqual(before.hero);
    expect(JSON.stringify(useMercStore.getState())).toBe(before.merc);
    expect(useInventoryStore.getState().currencies).toEqual({ gold: 123, 'opaque-wallet': 4 });
    expect(useInventoryStore.getState().backpack).toEqual([]);
    view.rerender(wrap(<><QuestsScreen /><QuestItemsPanel /></>)); sideTab();
    expect(screen.getByTestId(`quest-claim-${quest}`)).toBeDisabled();
    expect(screen.getByTestId('cow-stage')).toHaveTextContent(i18n.t('cow.stage.portal-open', { ns: 'quests' }));
    expect(screen.getByTestId(`quest-${quest}`).textContent).not.toMatch(/secret_cow_level|Secret Cow Level|秘密奶牛关|quests\/|undefined/);
    const enter = screen.getByTestId('cow-enter-portal');
    expect(enter).toBeEnabled(); fireEvent.click(enter);
    expect(screen.getByTestId('test-route')).toHaveTextContent('/combat?questEncounter=act1-dw-cow-king');
    expect(useMapStore.getState().currentSubAreaId).toBe('areas/act1-dark-wood');
    expect(useMapStore.getState().questReceipts).toEqual({ [tome]: true, [opened]: true });
    expect(usePlayerStore.getState().player).toEqual(before.hero);
  });

  it('explains a missing actual Cube after Receive and never treats Talk or completed flags as a portal', async () => {
    await i18n.changeLanguage(locale);
    useInventoryStore.setState({ questItems: {} });
    const before = snapshot();
    const view = render(wrap(world())); fireEvent.click(screen.getByTestId('cow-recover-leg'));
    view.rerender(wrap(<TownScreen />)); talk();
    expect(useMapStore.getState().questReceipts).toEqual({});
    fireEvent.click(screen.getByTestId('cow-receive-tome'));
    expect(screen.getByTestId('cow-stage')).toHaveTextContent(i18n.t('cow.stage.need-cube', { ns: 'quests' }));
    expect(screen.getByTestId('cow-transmute')).toBeDisabled();
    expect(screen.queryByTestId('cow-enter-portal')).not.toBeInTheDocument();
    expect(useInventoryStore.getState().questItems[leg]?.state).toBe('owned');
    expect(useInventoryStore.getState().questItems[tome]?.state).toBe('owned');
    expect(useMapStore.getState().questReceipts).toEqual({ [tome]: true });
    expect(usePlayerStore.getState().player).toEqual(before.hero);
    expect(useInventoryStore.getState().currencies).toEqual({ gold: 123, 'opaque-wallet': 4 });
  });

  it('withholds Claim for a source-free legacy completion and leaves a claimed legacy row able to earn its missing excursion', async () => {
    await i18n.changeLanguage(locale);
    useMapStore.setState({ questProgress: { ...useMapStore.getState().questProgress,
      [quest]: { id: quest, status: 'completed', rewardClaimed: false, objectives: { 'obj-find-leg': true, 'obj-open-portal': true } }
    } });
    const before = snapshot();
    const view = render(wrap(<QuestsScreen />)); sideTab();
    expect(screen.getByTestId(`quest-claim-${quest}`)).toBeDisabled();
    expect(screen.getByTestId('cow-stage')).toHaveTextContent(i18n.t('cow.stage.need-leg', { ns: 'quests' }));
    view.unmount();
    useMapStore.setState({ questProgress: { ...useMapStore.getState().questProgress,
      [quest]: { id: quest, status: 'completed', rewardClaimed: true, objectives: { 'obj-find-leg': true, 'obj-open-portal': true } }
    } });
    render(wrap(world()));
    expect(screen.getByTestId('cow-recover-leg')).toBeEnabled();
    fireEvent.click(screen.getByTestId('cow-recover-leg'));
    expect(useMapStore.getState().questProgress[quest]?.rewardClaimed).toBe(true);
    expect(useInventoryStore.getState().questItems[leg]).toEqual({ itemId: 'quest/wirts_leg', state: 'owned' });
    expect(usePlayerStore.getState().player).toEqual(before.hero);
    expect(useInventoryStore.getState().currencies).toEqual({ gold: 123, 'opaque-wallet': 4 });
  });
});
