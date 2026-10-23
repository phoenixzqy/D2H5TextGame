import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { loadQuests } from '@/data/loaders/quests';
import { loadItemBases } from '@/data/loaders/loot';
import type { Item } from '@/engine/types/items';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { EquipPicker } from '@/features/inventory/EquipPicker';
import { QuestItemsPanel } from '@/features/inventory/QuestItemsPanel';
import { LegacyGearQuarantinePanel } from '@/features/inventory/LegacyGearQuarantinePanel';
import { QuestsScreen } from '@/features/quests/QuestsScreen';
import { claimQuestReward, readQuestItem } from '@/features/quests/claimReward';
import { TownScreen } from '@/features/town/TownScreen';
import { QuestServicePanel } from '@/features/town/QuestServicePanel';
import { useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { AreaObjectsPanel } from './AreaObjectsPanel';
import { ReplayProfileControls } from './ReplayProfileControls';

const SIEGE = 'quests/act5-siege-on-harrogath', RESCUE = 'quests/act5-rescue-on-mount-arreat';
const PRISON = 'quests/act5-prison-of-ice', RITE = 'quests/act5-rite-of-passage', EVE = 'quests/act5-eve-of-destruction';
const FRIGID = 'areas/act5-frigid-highlands', PASSAGE = 'areas/act5-crystalline-passage';
const SCROLL = `${PRISON}#reward:questItem`, POTION = `${PRISON}#action:receive-potion`;
const hydration = useHydrationStore.getState();
const stores = [useCombatStore, useInventoryStore, useMapStore, useMercStore, usePlayerStore] as const;

function row(id: string, completed = false) {
  const quest = loadQuests().find(quest => quest.id === id);
  if (!quest) throw new Error(`Missing actual Act V quest ${id}`);
  return { id, status: completed ? 'completed' as const : 'inProgress' as const,
    objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, completed])) };
}
function mount(children: React.ReactNode) {
  return render(<I18nextProvider i18n={i18n}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</MemoryRouter></I18nextProvider>);
}
function action(id: string) { return screen.getByTestId(`quest-action-actions/act5-${id}`); }
function sourceProof(quest: string, suffix: string) {
  useMapStore.setState(state => ({ questReceipts: { ...state.questReceipts, [`${quest}#action:${suffix}`]: true } }));
}
function gear(id: string): Item {
  return { id, baseId: 'items/base/wp1h-short-sword', rarity: 'normal', level: 1,
    socketCapacity: 0, identified: true, equipped: false };
}
function readySiege() {
  // Constructed accepted source proof tests UI wiring, not earned combat or balance.
  useMapStore.setState({ questProgress: { [SIEGE]: row(SIEGE, true) } });
  sourceProof(SIEGE, 'shenk-victory');
  expect(claimQuestReward(SIEGE)).toBe('ok');
}
function campaignFixture() {
  // Constructed complete source graph exercises actual Claim/selection APIs only.
  // Qualified battle admission and earned campaign balance are covered by core/simulation suites.
  useMapStore.setState({ questProgress: Object.fromEntries([SIEGE, RESCUE, PRISON, RITE, EVE].map(id => [id, row(id, true)])),
    questReceipts: {
      [`${SIEGE}#action:shenk-victory`]: true,
      ...Object.fromEntries([1, 2, 3].map(n => [`${RESCUE}#action:release-cage-${String(n)}`, true as const])),
      [`${PRISON}#action:inspect-anya`]: true, [POTION]: true, [`${PRISON}#action:thaw-anya`]: true,
      [`${PRISON}#action:nihlathak-victory`]: true, [`${RITE}#action:ancients-victory`]: true,
      [`${EVE}#action:throne-waves-victory`]: true, [`${EVE}#action:baal-victory`]: true
    } });
  useInventoryStore.setState({ questItems: { [POTION]: { itemId: 'quest/malahs_potion', state: 'consumed' } } });
  for (const id of [SIEGE, RESCUE, PRISON, RITE, EVE]) expect(claimQuestReward(id)).toBe('ok');
}

beforeEach(() => {
  stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer(createMockPlayer('A5 Visitor', 'sorceress'));
  useMapStore.setState({ currentAct: 5, currentSubAreaId: FRIGID,
    clearedSubAreas: ['areas/act1-catacombs', 'areas/act2-tomb-of-tal-rasha', 'areas/act3-durance-of-hate', 'areas/act4-chaos-sanctuary'] });
});
afterEach(() => {
  act(() => { stores.forEach(store => { store.getState().reset(); }); });
  useHydrationStore.setState(hydration);
});

describe.each(['en', 'zh-CN'])('Act V actual-core player controls %s', locale => {
  beforeEach(async () => { await i18n.changeLanguage(locale); });

  it('frees three distinct groups in any order after clear, leaves Claim explicit, and keeps repeated cages inert', () => {
    useMapStore.setState({ questProgress: { [RESCUE]: row(RESCUE) } });
    mount(<><AreaObjectsPanel act={5} areaId={FRIGID} onClose={() => undefined} /><QuestsScreen /></>);
    for (const n of [1, 2, 3]) expect(action(`release-barbarian-cage-${String(n)}`)).toBeDisabled();
    act(() => { useMapStore.getState().markCleared(FRIGID); });
    const player = usePlayerStore.getState().player;
    for (const n of [3, 1, 2]) {
      const button = action(`release-barbarian-cage-${String(n)}`);
      expect(button).toBeEnabled();
      expect(button).toHaveClass('min-h-[44px]', 'min-w-[44px]', 'max-w-full', 'whitespace-normal');
      fireEvent.click(button);
      expect(button).toBeDisabled();
      const receipts = useMapStore.getState().questReceipts;
      fireEvent.click(button);
      expect(useMapStore.getState().questReceipts).toBe(receipts);
    }
    expect(usePlayerStore.getState().player).toBe(player);
    expect(useMapStore.getState().questProgress[RESCUE]?.status).toBe('completed');
    expect(useMapStore.getState().questProgress[RESCUE]?.rewardClaimed).not.toBe(true);
    fireEvent.click(screen.getByTestId(`quest-claim-${RESCUE}`));
    expect(useMapStore.getState().questProgress[RESCUE]?.rewardClaimed).toBe(true);
    expect(screen.getByTestId('area-object-panel').textContent).not.toMatch(/areaObjects\.|act5Feedback\.|undefined/);
  });

  it('inspects without a clear, receives a real potion from Malah, thaws Anya, then Claims and Reads the actual scroll once', () => {
    useMapStore.setState({ currentSubAreaId: PASSAGE, questProgress: { [PRISON]: row(PRISON) } });
    mount(<><AreaObjectsPanel act={5} areaId={PASSAGE} onClose={() => undefined} /><TownScreen /><QuestsScreen /><QuestItemsPanel /></>);
    expect(screen.queryByTestId('town-npc-anya')).not.toBeInTheDocument();
    expect(action('thaw-anya')).toBeDisabled();
    expect(action('inspect-anya')).toBeEnabled();
    fireEvent.click(action('inspect-anya'));
    fireEvent.click(screen.getByTestId('town-npc-malah'));
    const getPotion = action('receive-malah-potion');
    expect(getPotion).toBeEnabled();
    expect(useInventoryStore.getState().questItems[POTION]).toBeUndefined();
    fireEvent.click(getPotion);
    expect(useInventoryStore.getState().questItems[POTION]).toEqual({ itemId: 'quest/malahs_potion', state: 'owned' });
    expect(getPotion).toBeDisabled();
    fireEvent.click(action('thaw-anya'));
    expect(useInventoryStore.getState().questItems[POTION]?.state).toBe('consumed');
    expect(screen.getByTestId('town-npc-anya')).toBeVisible();
    expect(screen.queryByTestId('quest-item-items/scroll_of_resist')).not.toBeInTheDocument();
    // Inject a constructed accepted Nihlathak settlement, rather than bypassing the Claim API.
    act(() => {
      useMapStore.getState().updateQuestProgress(PRISON, row(PRISON, true));
      sourceProof(PRISON, 'nihlathak-victory');
    });
    fireEvent.click(screen.getByTestId(`quest-claim-${PRISON}`));
    expect(useInventoryStore.getState().questItems[SCROLL]?.state).toBe('owned');
    const before = usePlayerStore.getState().player?.derivedStats.resistances;
    fireEvent.click(screen.getByTestId('quest-item-read-items/scroll_of_resist'));
    expect(useInventoryStore.getState().questItems[SCROLL]?.state).toBe('consumed');
    for (const channel of ['fire', 'cold', 'lightning', 'poison', 'arcane', 'physical'] as const) {
      expect(usePlayerStore.getState().player?.derivedStats.resistances[channel]).toBe((before?.[channel] ?? 0) + 10);
    }
    const paid = usePlayerStore.getState().player;
    fireEvent.click(screen.getByTestId('quest-item-read-items/scroll_of_resist'));
    expect(usePlayerStore.getState().player).toBe(paid);
    expect(screen.getByTestId('quest-items-panel').textContent).not.toMatch(/questItems\.|undefined|allResist/);
  });

  it('shows historical Anya dialogue without inventing thaw proof, potion, scroll or service charges', () => {
    useMapStore.setState({ questProgress: { [PRISON]: { ...row(PRISON, true), rewardClaimed: true } } });
    mount(<TownScreen />);
    fireEvent.click(screen.getByTestId('town-npc-anya'));
    expect(screen.getByTestId('town-conversation')).toHaveTextContent(i18n.t('dialogue.legacyAnya', { ns: 'town' }));
    expect(useMapStore.getState().questReceipts).toEqual({});
    expect(useInventoryStore.getState().questItems).toEqual({});
    expect(useInventoryStore.getState().questServices).toEqual({});
  });

  it('requires an explicit eligible item selection and spends only the chosen socket charge', () => {
    readySiege();
    const selected = gear('selected-sword'), other = gear('other-sword');
    useInventoryStore.setState({ backpack: [selected, other] });
    const source = `${SIEGE}#reward:service`;
    mount(<QuestServicePanel npcId="npc/larzuk" />);
    const use = screen.getByTestId(`quest-service-use-${source}`);
    expect(use).toBeDisabled();
    expect(useInventoryStore.getState().backpack).toEqual([selected, other]);
    fireEvent.change(screen.getByTestId(`quest-service-target-${source}`), { target: { value: selected.id } });
    fireEvent.click(use);
    const transformed = useInventoryStore.getState().backpack.find(item => item.id === selected.id);
    expect(transformed?.socketCapacity).toBe(loadItemBases().get(selected.baseId)?.maxSockets);
    expect(useInventoryStore.getState().backpack.find(item => item.id === other.id)).toBe(other);
    expect(useInventoryStore.getState().questServices[source]).toEqual({ serviceId: 'socket_item', state: 'consumed', targetItemId: selected.id });
    expect(screen.queryByTestId(`quest-service-target-${source}`)).not.toBeInTheDocument();
  });

  it('personalizes only the selected actual item with the current character identity and leaves stats unchanged', () => {
    campaignFixture();
    const target = gear('personalization-target'), other = gear('unselected-item');
    useInventoryStore.setState({ backpack: [target, other] });
    const player = usePlayerStore.getState().player;
    const source = `${PRISON}#reward:service`;
    mount(<QuestServicePanel npcId="npc/anya" />);
    fireEvent.change(screen.getByTestId(`quest-service-target-${source}`), { target: { value: target.id } });
    fireEvent.click(screen.getByTestId(`quest-service-use-${source}`));
    expect(useInventoryStore.getState().backpack.find(item => item.id === target.id)?.personalizedBy)
      .toEqual({ characterId: player?.id, name: player?.name });
    expect(useInventoryStore.getState().backpack.find(item => item.id === other.id)).toBe(other);
    expect(usePlayerStore.getState().player).toBe(player);
    expect(useInventoryStore.getState().questServices[source]?.state).toBe('consumed');
  });

  it('uses actual claimed campaign rewards to select a title and Nightmare, preserving Normal clear records', () => {
    campaignFixture();
    const normalClears = useMapStore.getState().clearedSubAreas;
    mount(<><TownScreen /><ReplayProfileControls /></>);
    fireEvent.click(screen.getByTestId('quest-title-slayer'));
    expect(useMapStore.getState().selectedTitle).toBe('titles/slayer_of_baal');
    expect(screen.getByTestId('town-screen')).toHaveTextContent(i18n.t('titles.slayer', { ns: 'town' }));
    fireEvent.click(screen.getByTestId('replay-profile-nightmare'));
    expect(useMapStore.getState().selectedDifficulty).toBe('nightmare');
    expect(useMapStore.getState().clearedSubAreas).toBe(normalClears);
    expect(useMapStore.getState().nightmareClearedSubAreas).toEqual([]);
    fireEvent.click(screen.getByTestId('quest-title-none'));
    expect(useMapStore.getState().selectedTitle).toBeNull();
    expect(screen.getByTestId('replay-profile-controls').textContent).not.toMatch(/replay\.|undefined/);
  });

  it('keeps permanent rescue and scroll resistance in equipment candidate previews', () => {
    campaignFixture();
    expect(readQuestItem(SCROLL)).toBe('ok');
    useInventoryStore.setState({ backpack: [gear('comparison-target')] });
    mount(<EquipPicker slot="weapon" onClose={() => undefined} />);
    const table = screen.getByTestId('stat-compare-table');
    for (const channel of ['fire', 'cold', 'lightning', 'poison', 'arcane', 'physical']) {
      const label = i18n.t(`equipFlow.compare.resist.${channel}`, { ns: 'inventory' });
      const row = within(table).getAllByRole('row').find(row => within(row).queryByRole('rowheader', { name: label }));
      expect(row).toBeDefined();
      expect(row && within(row).getAllByRole('cell').at(-1)).toHaveTextContent('15%');
    }
  });

  it('keeps preserved duplicate legacy instances inspectable with distinct origins and no ownership actions', () => {
    const { socketCapacity: _capacity, ...oldItem } = gear('legacy-collision');
    const quarantine = [{ item: oldItem, origin: { container: 'backpack' as const, index: 0 } },
      { item: oldItem, origin: { container: 'stash' as const, index: 4 } }];
    useInventoryStore.setState({ legacyGearQuarantine: quarantine });
    mount(<LegacyGearQuarantinePanel />);
    const panel = screen.getByTestId('legacy-gear-quarantine');
    expect(panel.querySelectorAll('details')).toHaveLength(2);
    expect(within(panel).queryByRole('button')).not.toBeInTheDocument();
    expect(useInventoryStore.getState().legacyGearQuarantine).toBe(quarantine);
    expect(useInventoryStore.getState().backpack).toEqual([]);
    expect(panel.textContent).not.toMatch(/quarantine\.|undefined/);
  });
});
