import { Suspense } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useMapStore, usePlayerStore, useCombatStore, useMetaStore, useInventoryStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { QuestItemsPanel } from '@/features/inventory/QuestItemsPanel';
import { AreaObjectsPanel } from './AreaObjectsPanel';
import { MapScreen } from './MapScreen';

const questId = 'quests/act2-horadric-staff';
const source = `${questId}#objective:obj-cube`, areaId = 'areas/act2-dry-hills';
const hydrationBefore = useHydrationStore.getState();
beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); useCombatStore.getState().reset(); useMetaStore.getState().setIdleTarget(undefined);
  usePlayerStore.getState().setPlayer(createMockPlayer('UI journal diagnostic', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
  useMapStore.setState({ clearedSubAreas: ['areas/act1-catacombs'] });
  useMapStore.getState().updateQuestProgress(questId, { status: 'inProgress',
    objectives: { 'obj-cube': false, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false } });
});
afterEach(() => {
  useInventoryStore.getState().reset(); useMapStore.getState().reset(); usePlayerStore.getState().reset(); useCombatStore.getState().reset();
  useHydrationStore.setState(hydrationBefore);
});
function renderMap() {
  return render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><MapScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
}
describe.each(['en', 'zh-CN'])('explicit Cube player path %s', locale => {
  it('offers Inspect, grants only on Recover and retains inert inventory ownership', async () => {
    const english = locale === 'en'; await i18n.changeLanguage(locale);
    const rendered = renderMap();
    const toggle = screen.getAllByRole('button', { expanded: false })[0];
    if (!toggle) throw new Error('Missing Act II'); fireEvent.click(toggle);
    const trigger = await screen.findByTestId('area-objects-a2-dry-hills');
    const before = useMapStore.getState().questProgress;
    fireEvent.click(trigger);
    const panel = await screen.findByTestId('area-object-panel');
    expect(useMapStore.getState().questProgress).toBe(before);
    expect(useInventoryStore.getState().questItems).toEqual({});
    expect(within(panel).getByRole('heading', { name: english ? 'Horadric Cube Coffer' : '霍拉德里克方块宝匣' })).toBeInTheDocument();
    const recover = within(panel).getByRole('button', { name: english ? 'Recover' : '取回' });
    expect(within(panel).queryByRole('button', { name: english ? 'Read' : '阅读' })).toBeNull();
    fireEvent.click(recover);
    expect(useInventoryStore.getState().questItems).toEqual({ [source]: { itemId: 'quest/horadric_cube', state: 'owned' } });
    expect(useMapStore.getState().questProgress[questId]).toEqual({ ...before[questId],
      objectives: { ...before[questId]?.objectives, 'obj-cube': true } });
    expect(recover).toBeDisabled();
    expect(panel).toHaveTextContent(english ? 'Cube recovered.' : '方块已取回。');
    fireEvent.click(within(panel).getByTestId('area-object-close')); expect(trigger).toHaveFocus();
    fireEvent.click(trigger); expect(await screen.findByTestId('area-object-panel')).toHaveTextContent(english ? 'Cube recovered.' : '方块已取回。');
    rendered.unmount();
    render(<I18nextProvider i18n={i18n}><QuestItemsPanel /></I18nextProvider>);
    const inventory = screen.getByTestId('quest-items-panel');
    expect(inventory).toHaveTextContent(english ? 'Horadric Cube' : '霍拉德里克方块');
    expect(inventory).toHaveTextContent(english ? 'Retained tool' : '保留的工具');
    expect(inventory).toHaveTextContent(english ? 'Owned' : '已持有');
    expect(within(inventory).queryByRole('button')).toBeNull();
    expect(inventory.textContent).not.toMatch(/questItems\.|quest\/|undefined/);
  });

  it('does not infer ownership from a legacy flag and refreshes after ledger restoration', async () => {
    await i18n.changeLanguage(locale);
    useMapStore.setState({ currentAct: 2, currentSubAreaId: areaId });
    useMapStore.getState().updateQuestProgress(questId, { objectives: { 'obj-cube': true } });
    render(<I18nextProvider i18n={i18n}><AreaObjectsPanel act={2} areaId={areaId} onClose={() => undefined} /></I18nextProvider>);
    const recover = screen.getByRole('button', { name: locale === 'en' ? 'Recover' : '取回' });
    expect(recover).toBeEnabled(); expect(useInventoryStore.getState().questItems).toEqual({});
    fireEvent.click(recover); expect(recover).toBeDisabled();
    act(() => { useInventoryStore.setState({ questItems: {} }); });
    expect(recover).toBeEnabled();
    expect(screen.queryByText(locale === 'en' ? 'Cube recovered.' : '方块已取回。')).toBeNull();
  });
  it('keeps recovered feedback after the quest completes and is claimed', async () => {
    await i18n.changeLanguage(locale);
    useMapStore.setState({ currentAct: 2, currentSubAreaId: areaId });
    useMapStore.getState().updateQuestProgress(questId, { status: 'completed', rewardClaimed: true,
      objectives: { 'obj-cube': true, 'obj-shaft': true, 'obj-amulet': true, 'obj-transmute': true } });
    useInventoryStore.setState({ questItems: { [source]: { itemId: 'quest/horadric_cube', state: 'owned' } } });
    render(<I18nextProvider i18n={i18n}><AreaObjectsPanel act={2} areaId={areaId} onClose={() => undefined} /></I18nextProvider>);
    expect(screen.getByText(locale === 'en' ? 'Cube recovered.' : '方块已取回。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: locale === 'en' ? 'Recover' : '取回' })).toBeDisabled();
  });

});
