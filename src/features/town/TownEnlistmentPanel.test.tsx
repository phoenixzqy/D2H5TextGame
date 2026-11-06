/** Constructed prerequisite capabilities; real town selection, Enlist and journal Claim. */
import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/stores/save-adapter', () => ({ hasSave: vi.fn(), loadSave: vi.fn(),
  saveSave: vi.fn(() => Promise.resolve(undefined)), deleteSave: vi.fn() }));
import i18n from '@/i18n';
import { loadMercPool } from '@/data/loaders/mercs';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { QuestsScreen } from '@/features/quests/QuestsScreen';
import { createMercFromDef } from '@/stores/mercFactory';
import { __resetPersistenceForTests, useHydrationStore } from '@/stores/persistence';
import { useMapStore, usePlayerStore, useInventoryStore, useMercStore, useCombatStore, useMetaStore, useFormationStore } from '@/stores';
import { TownScreen } from './TownScreen';

const cases = [
  { key: 'kashya', act: 1, quest: 'quests/side-act1-rogue-merc-unlock', merc: 'mercs/act1-rogue-trainee',
    level: 3, main: 'quests/act1-sisters-burial-grounds', flags: ['obj-kill-blood-raven', 'obj-return'] },
  { key: 'greiz', act: 2, quest: 'quests/side-act2-greiz-merc-roster', merc: 'mercs/act2-blessed-aim',
    level: 10, main: 'quests/act2-radaments-lair', flags: ['obj-kill-radament'] },
  { key: 'asheara', act: 3, quest: 'quests/side-act3-asheara-merc', merc: 'mercs/act3-iron-wolf-frozen-armor',
    level: 16, main: null, flags: [] }
] as const;
type Scenario = typeof cases[number];
const stores = [useMapStore, usePlayerStore, useInventoryStore, useMercStore, useCombatStore, useMetaStore, useFormationStore] as const;
const unlock = useMapStore.getState().isActUnlocked;
const map = () => useMapStore.getState(), mercs = () => useMercStore.getState();
function definition(test: Scenario) {
  const row = loadMercPool().pool.find(item => item.id === test.merc);
  if (!row) throw new Error('Missing authored enlistment recruit');
  return row;
}
function setup(test: Scenario) {
  useMapStore.setState({ currentAct: test.act, currentSubAreaId: 'areas/act1-blood-moor', isActUnlocked: () => true,
    questProgress: {
      ...(test.main ? { [test.main]: { id: test.main, status: 'completed' as const, rewardClaimed: false,
        objectives: Object.fromEntries(test.flags.map(id => [id, true])) } } : {}),
      [test.quest]: { id: test.quest, status: 'inProgress', rewardClaimed: false, objectives: { 'obj-hire': false } }
    } });
}
function mount(journal = false) {
  return render(<I18nextProvider i18n={i18n}><Suspense fallback={null}><MemoryRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    {journal ? <QuestsScreen /> : <TownScreen />}
  </MemoryRouter></Suspense></I18nextProvider>);
}
const target = () => screen.getByTestId('town-enlistment-target');
const confirm = () => screen.getByTestId('town-enlistment-use');
function choose(id = 'fresh') { fireEvent.change(target(), { target: { value: id } }); }
function open(test: Scenario) { fireEvent.click(screen.getByTestId(`town-npc-${test.key}`)); }
beforeEach(() => {
  __resetPersistenceForTests(); stores.forEach(store => { store.getState().reset(); });
  useHydrationStore.getState().setStatus('ready');
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Town recruit', 'sorceress'), level: 18, equipment: [] });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); useMapStore.setState({ isActUnlocked: unlock }); __resetPersistenceForTests(); });

describe.each(cases)('$key explicit town enlistment', test => {
  it.each(['en', 'zh-CN'])('%s keeps NPC opening, named selection, Enlist and Claim separate', async locale => {
    await i18n.changeLanguage(locale); setup(test); const before = map().questProgress;
    mount(); expect(screen.queryByTestId('town-enlistment')).not.toBeInTheDocument();
    open(test); expect(map().questProgress).toBe(before); expect(mercs().ownedMercs).toEqual([]);
    expect(target()).toHaveAccessibleName(i18n.t('enlistment.chooseRecruit', { ns: 'town' }));
    expect(confirm()).toBeDisabled(); choose();
    const name = i18n.t(`byId.${test.merc.slice('mercs/'.length)}.name`, { ns: 'mercs' });
    expect(screen.getByTestId('town-enlistment-preview')).toHaveTextContent(name);
    expect(screen.getByTestId('town-enlistment-preview')).toHaveTextContent(String(test.level));
    const hero = structuredClone(usePlayerStore.getState().player), currencies = structuredClone(useInventoryStore.getState().currencies);
    fireEvent.click(confirm());
    expect(map().questProgress[test.quest]).toEqual({ id: test.quest, status: 'completed', rewardClaimed: false, objectives: { 'obj-hire': true } });
    expect(map().questReceipts[`${test.quest}#action:enlist-recruit`]).toBe(true);
    expect(mercs().ownedMercs).toHaveLength(1); expect(mercs().ownedMercs[0]?.level).toBe(test.level);
    expect(mercs().fieldedMercId).toBe(mercs().ownedMercs[0]?.id);
    expect(usePlayerStore.getState().player).toEqual(hero);
    expect(useInventoryStore.getState().currencies).toEqual(currencies);
    expect(map().currentSubAreaId).toBe('areas/act1-blood-moor');
    expect(within(screen.getByTestId('town-enlistment')).getByRole('status')).toBeVisible();
    expect(screen.queryByTestId('town-enlistment-use')).not.toBeInTheDocument();
    act(() => { useMercStore.setState({ fieldedMercId: null }); });
    cleanup(); mount(true); fireEvent.click(screen.getByRole('tab', { name: i18n.t('side', { ns: 'quests' }) }));
    const card = within(screen.getByTestId(`quest-${test.quest}`));
    expect(card.getByText(i18n.t('rewardLabel.townEnlistmentEnsureOwned', { ns: 'quests', name }), { exact: false })).toBeVisible();
    const roster = mercs().ownedMercs;
    const writes = vi.spyOn(useMercStore, 'setState');
    fireEvent.click(card.getByTestId(`quest-claim-${test.quest}`));
    expect(map().questProgress[test.quest]?.rewardClaimed).toBe(true);
    expect(mercs().ownedMercs).toBe(roster); expect(mercs().fieldedMercId).toBeNull();
    expect(writes).not.toHaveBeenCalled();
  });

  it.each(['en', 'zh-CN'])('%s preserves multiple invested recruits and fields the explicitly selected actual ID', async locale => {
    await i18n.changeLanguage(locale); setup(test);
    const first = createMercFromDef(definition(test), 'first');
    const selected = { ...createMercFromDef(definition(test), 'veteran'), level: test.level + 1 };
    mercs().addMerc(first); mercs().addMerc(selected);
    const before = structuredClone(mercs().ownedMercs); mount(); open(test);
    const options = within(target()).getAllByRole('option');
    expect(options[1]).toHaveTextContent(first.id); expect(options[2]).toHaveTextContent(selected.id);
    expect(options[1]).toHaveTextContent('1.'); expect(options[2]).toHaveTextContent('2.');
    choose(selected.id); expect(screen.getByTestId('town-enlistment-preview')).toHaveTextContent(selected.id);
    expect(confirm()).toHaveAccessibleName(i18n.t('enlistment.reenlist', { ns: 'town' }));
    fireEvent.click(confirm());
    expect(mercs().ownedMercs).toEqual(before); expect(mercs().ownedMercs[1]).toBe(selected);
    expect(mercs().fieldedMercId).toBe(selected.id); expect(map().questProgress[test.quest]?.rewardClaimed).toBe(false);
  });

  it('keeps stale selection disabled until the player explicitly reselects', () => {
    setup(test); const selected = createMercFromDef(definition(test), 'selected'); mercs().addMerc(selected);
    mount(); open(test); choose(selected.id);
    act(() => { useMercStore.setState({ ownedMercs: [structuredClone(selected)] }); });
    expect(confirm()).toBeDisabled(); expect(screen.queryByTestId('town-enlistment-preview')).not.toBeInTheDocument();
    expect(map().questReceipts).not.toHaveProperty(`${test.quest}#action:enlist-recruit`);
    choose(selected.id); expect(confirm()).toBeEnabled();
  });

  it('keeps the action out of other NPC conversations and locked acts', () => {
    setup(test); mount();
    const other = screen.getAllByTestId(/^town-npc-/).find(button => button.getAttribute('data-testid') !== `town-npc-${test.key}`);
    if (!other) throw new Error('Expected another current-town NPC');
    fireEvent.click(other); expect(screen.queryByTestId('town-enlistment')).not.toBeInTheDocument();
    act(() => { useMapStore.setState({ isActUnlocked: () => false }); });
    open(test); expect(screen.queryByTestId('town-enlistment-use')).not.toBeInTheDocument();
  });

  it('does not offer an action before its main prerequisite or hero gate', () => {
    setup(test);
    const main = test.main;
    if (main) useMapStore.setState(state => ({ questProgress: { ...state.questProgress,
      [main]: { id: main, status: 'inProgress', rewardClaimed: false,
        objectives: Object.fromEntries(test.flags.map(id => [id, false])) }
    } }));
    else usePlayerStore.setState(state => ({ player: state.player ? { ...state.player, level: 17 } : null }));
    mount(); open(test);
    expect(screen.queryByTestId('town-enlistment-use')).not.toBeInTheDocument();
    expect(mercs().ownedMercs).toEqual([]);
    expect(map().questProgress[test.quest]?.objectives['obj-hire']).toBe(false);
  });

  it('shows publication failure without success or an automatic retry', () => {
    setup(test); mount(); open(test); choose();
    const real = useMapStore.setState;
    vi.spyOn(useMapStore, 'setState').mockImplementationOnce(update => { real(update); throw new Error('test publication fault'); });
    fireEvent.click(confirm());
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('services.feedback.grant-failed', { ns: 'town' }));
    expect(map().questReceipts).not.toHaveProperty(`${test.quest}#action:enlist-recruit`);
    expect(map().questProgress[test.quest]?.objectives['obj-hire']).toBe(false);
    expect(mercs().ownedMercs).toEqual([]);
  });
});
