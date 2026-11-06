/** Constructed qualified Rescue capabilities; real town, enlistment and journal controls. */
import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import i18n from '@/i18n';
import { loadMercPool } from '@/data/loaders/mercs';
import { WARBAND } from '@/engine/map/warband-quest';
import { CAGE_PROOFS } from '@/engine/save/act5-state';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { QuestsScreen } from '@/features/quests/QuestsScreen';
import { createMercFromDef } from '@/stores/mercFactory';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { useMapStore, usePlayerStore, useInventoryStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { TownScreen } from './TownScreen';
import { WarbandEnlistPanel } from './WarbandEnlistPanel';

const stores = [useMapStore, usePlayerStore, useInventoryStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const unlock = useMapStore.getState().isActUnlocked;
function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing Warband fixture'); return value; }
const definition = required(loadMercPool().pool.find(row => row.id === WARBAND.mercId));
const map = () => useMapStore.getState();
const mercs = () => useMercStore.getState();
function mount(kind: 'panel' | 'town' | 'journal' = 'panel') {
  return render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    {kind === 'town' ? <TownScreen /> : kind === 'journal' ? <QuestsScreen /> : <WarbandEnlistPanel />}
  </MemoryRouter></Suspense></I18nextProvider>);
}
function choose(id = 'fresh') { fireEvent.change(screen.getByTestId('warband-enlist-target'), { target: { value: id } }); }
function own(suffix: string) {
  const merc = createMercFromDef(definition, suffix); mercs().addMerc(merc); return merc;
}
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Warband town', 'sorceress'), level: 35, equipment: [] });
  useMapStore.setState({ currentAct: 5, currentSubAreaId: 'areas/act5-frigid-highlands', isActUnlocked: () => true,
    questProgress: {
      [WARBAND.prerequisite]: { id: WARBAND.prerequisite, status: 'completed', rewardClaimed: false, objectives: { 'obj-free-15': true } },
      [WARBAND.quest]: { id: WARBAND.quest, status: 'inProgress', rewardClaimed: false, objectives: { [WARBAND.objective]: false } }
    }, questReceipts: Object.fromEntries(CAGE_PROOFS.map(source => [source, true as const])) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); useMapStore.setState({ isActUnlocked: unlock }); __resetPersistenceForTests(); });

describe('Qual-Kehk’s explicit localized Warband enlistment', () => {
  it.each(['en', 'zh-CN'])('%s keeps NPC opening, named fresh selection, Enlist and journal Claim separate', async locale => {
    await i18n.changeLanguage(locale); const before = map().questProgress; mount('town');
    expect(screen.queryByTestId('warband-enlist')).not.toBeInTheDocument();
    const tile = screen.getByTestId('town-npc-qual-kehk'); fireEvent.click(tile);
    expect(tile).toHaveFocus(); expect(map().questProgress).toBe(before); expect(mercs().ownedMercs).toEqual([]);
    const select = screen.getByTestId('warband-enlist-target'), button = screen.getByTestId('warband-enlist-use');
    expect(select).toHaveAccessibleName(i18n.t('warband.chooseRecruit', { ns: 'town' })); expect(button).toBeDisabled();
    choose();
    expect(screen.getByTestId('warband-enlist-preview')).toHaveTextContent(i18n.t('byId.act5-barbarian-recruit.name', { ns: 'mercs' }));
    expect(screen.getByTestId('warband-enlist-preview')).toHaveTextContent(String(definition.reqLevel));
    expect(mercs().ownedMercs).toEqual([]); expect(map().questReceipts).not.toHaveProperty(WARBAND.proof);
    fireEvent.click(button);
    expect(map().questProgress[WARBAND.quest]).toMatchObject({ status: 'completed', rewardClaimed: false });
    expect(map().questReceipts[WARBAND.proof]).toBe(true); expect(mercs().ownedMercs).toHaveLength(1);
    expect(mercs().fieldedMercId).toBe(mercs().ownedMercs[0]?.id);
    expect(screen.getByText(i18n.t('warband.success', { ns: 'town' }))).toBeVisible();
    expect(screen.queryByTestId('warband-enlist-use')).not.toBeInTheDocument();
    expect(map().currentSubAreaId).toBe('areas/act5-frigid-highlands');
    fireEvent.click(screen.getByTestId('town-conversation-close')); expect(tile).toHaveFocus();
    act(() => { useMercStore.setState({ fieldedMercId: null }); });
    cleanup(); mount('journal'); fireEvent.click(screen.getByRole('tab', { name: i18n.t('side', { ns: 'quests' }) }));
    const card = within(screen.getByTestId(`quest-${WARBAND.quest}`));
    expect(card.getByText(i18n.t('rewardLabel.warbandEnsureOwned', { ns: 'quests' }), { exact: false })).toBeVisible();
    expect(card.getByTestId(`quest-claim-${WARBAND.quest}`)).toBeEnabled();
    fireEvent.click(card.getByTestId(`quest-claim-${WARBAND.quest}`));
    expect(map().questProgress[WARBAND.quest]?.rewardClaimed).toBe(true);
    expect(mercs().ownedMercs).toHaveLength(1); expect(mercs().fieldedMercId).toBeNull();
  });

  it.each(['en', 'zh-CN'])('%s names and numbers actual owned IDs and re-enlists only the selected instance', async locale => {
    await i18n.changeLanguage(locale); const first = own('first'), chosen = own('veteran');
    const before = structuredClone(mercs().ownedMercs); mount();
    const options = within(screen.getByTestId('warband-enlist-target')).getAllByRole('option');
    expect(options[1]).toHaveTextContent(first.id); expect(options[2]).toHaveTextContent(chosen.id);
    expect(options[1]).toHaveTextContent('1.'); expect(options[2]).toHaveTextContent('2.');
    choose(chosen.id);
    expect(screen.getByTestId('warband-enlist-preview')).toHaveTextContent(chosen.id);
    expect(screen.getByTestId('warband-enlist-use')).toHaveAccessibleName(i18n.t('warband.reenlist', { ns: 'town' }));
    fireEvent.click(screen.getByTestId('warband-enlist-use'));
    expect(mercs().ownedMercs).toEqual(before); expect(mercs().ownedMercs[1]).toBe(chosen);
    expect(mercs().fieldedMercId).toBe(chosen.id); expect(map().questProgress[WARBAND.quest]?.rewardClaimed).toBe(false);
  });

  it.each(['replacement', 'deep', 'progress', 'hero'])('disables a stale %s witness until explicit reselection', kind => {
    const chosen = own('selected'); mount(); choose(chosen.id);
    act(() => {
      if (kind === 'replacement') useMercStore.setState({ ownedMercs: [structuredClone(chosen)] });
      if (kind === 'deep') { Object.assign(chosen, { name: 'Changed after selection' }); useMercStore.setState({ ownedMercs: [...mercs().ownedMercs] }); }
      if (kind === 'progress') useMercStore.setState({ mercProgress: { ...mercs().mercProgress,
        [chosen.id]: { experience: 1, experienceToNextLevel: 100 } } });
      if (kind === 'hero') usePlayerStore.setState(state => ({ player: state.player ? { ...state.player } : null }));
    });
    expect(screen.getByTestId('warband-enlist-use')).toBeDisabled();
    expect(screen.queryByTestId('warband-enlist-preview')).not.toBeInTheDocument();
    expect(map().questReceipts).not.toHaveProperty(WARBAND.proof);
    choose(chosen.id); expect(screen.getByTestId('warband-enlist-use')).toBeEnabled();
  });

  it('does not silently refresh a fresh selection after hero replacement', () => {
    mount(); choose();
    act(() => { usePlayerStore.setState(state => ({ player: state.player ? { ...state.player } : null })); });
    expect(screen.getByTestId('warband-enlist-use')).toBeDisabled();
    expect(screen.queryByTestId('warband-enlist-preview')).not.toBeInTheDocument();
    choose(); expect(screen.getByTestId('warband-enlist-use')).toBeEnabled();
  });

  it.each(['hero', 'proof', 'difficulty'])('clears successful feedback on %s replacement', kind => {
    mount(); choose(); fireEvent.click(screen.getByTestId('warband-enlist-use'));
    const success = i18n.t('warband.success', { ns: 'town' }); expect(screen.getByText(success)).toBeVisible();
    act(() => {
      if (kind === 'hero') usePlayerStore.setState(state => ({ player: state.player ? { ...state.player } : null }));
      if (kind === 'proof') useMapStore.setState({ questReceipts: Object.fromEntries(CAGE_PROOFS.map(source => [source, true as const])) });
      if (kind === 'difficulty') useMapStore.setState({ selectedDifficulty: 'nightmare' });
    });
    expect(screen.queryByText(success)).not.toBeInTheDocument();
  });

  it('shows publication failure without success or an automatic retry', () => {
    mount(); choose();
    const real = useMapStore.setState; vi.spyOn(useMapStore, 'setState').mockImplementationOnce(update => { real(update); throw new Error('test failure'); });
    fireEvent.click(screen.getByTestId('warband-enlist-use'));
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('services.feedback.grant-failed', { ns: 'town' }));
    expect(screen.queryByText(i18n.t('warband.success', { ns: 'town' }))).not.toBeInTheDocument();
    expect(map().questReceipts).not.toHaveProperty(WARBAND.proof); expect(mercs().ownedMercs).toEqual([]);
  });

  it('keeps the panel out of other conversations and unavailable before qualified Rescue', () => {
    mount('town'); fireEvent.click(screen.getByTestId('town-npc-larzuk'));
    expect(screen.queryByTestId('warband-enlist')).not.toBeInTheDocument();
    act(() => { useMapStore.setState({ questReceipts: {} }); });
    fireEvent.click(screen.getByTestId('town-npc-qual-kehk'));
    expect(screen.queryByTestId('warband-enlist-use')).not.toBeInTheDocument();
    expect(map().questProgress[WARBAND.quest]?.objectives[WARBAND.objective]).toBe(false);
  });
});
