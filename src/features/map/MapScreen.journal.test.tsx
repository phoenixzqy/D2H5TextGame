import { Suspense } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useMapStore, usePlayerStore, useCombatStore, useMetaStore } from '@/stores';
import { useHydrationStore } from '@/stores/persistence';
import { MapScreen } from './MapScreen';

const questId = 'quests/act2-arcane-sanctuary';
const hydrationBefore = useHydrationStore.getState();
beforeAll(async () => {
  if (!i18n.isInitialized) await new Promise<void>(resolve => { i18n.on('initialized', resolve); });
});
beforeEach(() => {
  useMapStore.getState().reset(); useCombatStore.getState().reset(); useMetaStore.getState().setIdleTarget(undefined);
  usePlayerStore.getState().setPlayer(createMockPlayer('UI journal diagnostic', 'sorceress'));
  useHydrationStore.getState().setStatus('ready');
  useMapStore.setState({ clearedSubAreas: ['areas/act1-catacombs'] });
  useMapStore.getState().updateQuestProgress(questId, { status: 'inProgress',
    objectives: { 'obj-find-summoner': true, 'obj-read-journal': false } });
});
afterEach(() => {
  useMapStore.getState().reset(); usePlayerStore.getState().reset(); useCombatStore.getState().reset();
  useHydrationStore.setState(hydrationBefore);
});
function renderMap() {
  return render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><MapScreen /></MemoryRouter>
  </Suspense></I18nextProvider>);
}
async function openJournal() {
  const toggle = screen.getByRole('button', { name: /Act 2 ·|第 2 章 ·/, expanded: false });
  fireEvent.click(toggle);
  const trigger = await screen.findByTestId('area-objects-a2-arcane-sanctuary');
  fireEvent.click(trigger);
  return { trigger, panel: await screen.findByTestId('area-object-panel') };
}

describe('recoverable map journal flow', () => {
  it.each([
    ['en', "Horazon's Journal", 'Read', 'Journal read. Claim your quest rewards from Quests.'],
    ['zh-CN', '赫拉森的日记', '阅读', '日记已阅读。请前往任务界面领取奖励。']
  ])('opens without credit and explicitly reads once in %s', async (locale, name, read, completed) => {
    await i18n.changeLanguage(locale);
    renderMap();
    const before = useMapStore.getState().questProgress;
    const { trigger, panel } = await openJournal();
    expect(within(panel).getByRole('heading', { name })).toBeInTheDocument();
    expect(useMapStore.getState().questProgress).toBe(before);
    expect(useMapStore.getState().currentSubAreaId).toBe('areas/act2-arcane-sanctuary');
    expect(useCombatStore.getState().inCombat).toBe(false);
    const readButton = within(panel).getByRole('button', { name: read });
    expect(readButton.className).toContain('min-h-[44px]');
    const player = usePlayerStore.getState().player;
    fireEvent.click(readButton);
    expect(useMapStore.getState().questProgress[questId]?.status).toBe('completed');
    expect(usePlayerStore.getState().player).toBe(player);
    expect(within(panel).getByText(completed)).toBeInTheDocument();
    expect(within(panel).getByTestId('area-object-excerpt')).toBeInTheDocument();
    expect(readButton).toBeDisabled();
    fireEvent.click(within(panel).getByTestId('area-object-close'));
    expect(screen.queryByTestId('area-object-panel')).toBeNull();
    expect(trigger).toHaveFocus();
    fireEvent.click(trigger);
    expect(await screen.findByText(completed)).toBeInTheDocument();
  });

  it('opening/closing/language changes cannot bank an early read', async () => {
    useMapStore.getState().updateQuestProgress(questId, { objectives: {} });
    await i18n.changeLanguage('en'); renderMap();
    const before = useMapStore.getState().questProgress;
    const { panel } = await openJournal();
    expect(within(panel).getByRole('button', { name: 'Read' })).toBeDisabled();
    expect(within(panel).queryByTestId('area-object-excerpt')).toBeNull();
    await act(async () => { await i18n.changeLanguage('zh-CN'); });
    expect(within(panel).getByRole('button', { name: '阅读' })).toBeDisabled();
    fireEvent.click(within(panel).getByTestId('area-object-close'));
    expect(useMapStore.getState().questProgress).toBe(before);
  });

  it('subscribed restored progress replaces completed feedback and offers Read again', async () => {
    await i18n.changeLanguage('en'); renderMap();
    const { panel } = await openJournal();
    fireEvent.click(within(panel).getByRole('button', { name: 'Read' }));
    act(() => { useMapStore.getState().updateQuestProgress(questId, { status: 'inProgress',
      objectives: { 'obj-find-summoner': true, 'obj-read-journal': false } }); });
    expect(within(panel).getByRole('button', { name: 'Read' })).toBeEnabled();
    expect(within(panel).queryByTestId('area-object-excerpt')).toBeNull();
    expect(within(panel).queryByText('Journal read. Claim your quest rewards from Quests.')).toBeNull();
  });

  it('claimed receipts show claimed feedback instead of another claim instruction', async () => {
    useMapStore.getState().updateQuestProgress(questId, { status: 'completed', rewardClaimed: true,
      objectives: { 'obj-find-summoner': true, 'obj-read-journal': true } });
    await i18n.changeLanguage('en'); renderMap();
    const { panel } = await openJournal();
    expect(within(panel).getByText('Journal read. Quest rewards claimed.')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Read' })).toBeDisabled();
  });
});
