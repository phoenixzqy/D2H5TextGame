/** Constructed clear/Cube capabilities, real source actions and native recordings; no earned pacing acceptance. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '@/i18n';
import { COW } from '@/engine/map/cow-quest';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { AreaObjectsPanel } from '@/features/map/AreaObjectsPanel';
import { recoverQuestTool } from '@/features/quests/interactObject';
import { receiveCowTome, transmuteCowPortal } from '@/features/quests/cowQuestActions';
import { useMapStore, useMetaStore, useInventoryStore, useCombatStore, usePlayerStore, useMercStore, useFormationStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { abortSubAreaRun, readCombatRunOrigin, startSubAreaRun } from '@/stores/combatHelpers';
import { combatRunLifecycle } from '@/stores/combatRunLifecycle';
import { inspectRecordedWaves } from '@/stores/recordedWaveReceipt';
import { CombatScreen } from './CombatScreen';

const stores = [useMapStore, useMetaStore, useInventoryStore, useCombatStore, usePlayerStore, useMercStore, useFormationStore] as const;
function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname + location.search}</output>; }
function mount(route = `/combat?questEncounter=${COW.encounter}`) {
  return render(<MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes><Route path="/combat" element={<CombatScreen />} /><Route path="/map" element={
      <AreaObjectsPanel act={1} areaId={COW.area} onClose={() => undefined} />
    } /></Routes><Location />
  </MemoryRouter>);
}
function drain() {
  act(() => {
    let remaining = 10_000;
    while (!useCombatStore.getState().playbackComplete && remaining-- > 0) useCombatStore.getState().advanceEvent();
  });
  expect(useCombatStore.getState().playbackComplete).toBe(true);
  act(() => { vi.advanceTimersByTime(1500); });
}
beforeEach(async () => {
  abortSubAreaRun(); for (const store of stores) store.getState().reset();
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Cow screen fixture', 'sorceress'), comboOrder: [] });
  const cubeQuest = 'quests/act2-horadric-staff';
  useMapStore.setState({ currentAct: 1, currentSubAreaId: COW.area, selectedDifficulty: 'normal',
    clearedSubAreas: [COW.area, 'areas/act1-catacombs'], questProgress: {
      [COW.quest]: { id: COW.quest, status: 'inProgress', rewardClaimed: false,
        objectives: { [COW.legObjective]: false, [COW.portalObjective]: false } },
      [cubeQuest]: { id: cubeQuest, status: 'inProgress', objectives: {
        'obj-cube': true, 'obj-shaft': false, 'obj-amulet': false, 'obj-transmute': false
      } }
    }, questReceipts: {} });
  useInventoryStore.setState({ questItems: { [COW.cubeSource]: { itemId: COW.cubeItemId, state: 'owned' } } });
  useHydrationStore.getState().setStatus('ready');
  expect(recoverQuestTool(COW.legSource)).toBe('ok');
  expect(receiveCowTome()).toBe('ok'); expect(transmuteCowPortal()).toBe('ok');
  const gear = { id: 'cow-ui-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, affixes: [{ affixId: 'constructed-power', values: new Map([
      ['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]
    ]) }] };
  useInventoryStore.getState().addItem(gear); expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
  useMetaStore.getState().setIdleTarget(COW.area);
  await i18n.changeLanguage('en'); vi.useFakeTimers();
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); abortSubAreaRun(); for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('idle'); vi.useRealTimers();
});
describe.each(['en', 'zh-CN'])('explicit Cow screen in %s', locale => {
  it('starts the exact one-battle encounter, settles native victory once, and never offers idle or ordinary continuation', async () => {
    await i18n.changeLanguage(locale); const before = useMapStore.getState(); const view = mount();
    expect(readCombatRunOrigin()).toMatchObject({ kind: 'area', questEncounter: COW.encounter });
    expect(combatRunLifecycle.activeRun?.mode).toBe('manual');
    expect(screen.getByTestId('combat-sub-area-name')).toHaveTextContent(i18n.t('quests:cow.name'));
    expect(screen.queryByTestId('idle-loop-panel')).toBeNull(); drain();
    expect(screen.getByTestId('victory-panel')).toBeVisible();
    expect(useMapStore.getState().questReceipts[COW.victoryProof]).toBe(true);
    expect(useMapStore.getState().clearedSubAreas).toBe(before.clearedSubAreas);
    expect(useMapStore.getState().challengeOrdinals).toBe(before.challengeOrdinals);
    expect(screen.queryByTestId('continue-next-subarea')).toBeNull();
    expect(screen.queryByTestId('idle-loop-next-run')).toBeNull();
    const recording = useCombatStore.getState().recordedEvents;
    act(() => { vi.advanceTimersByTime(5000); }); expect(useCombatStore.getState().recordedEvents).toBe(recording);
    fireEvent.click(screen.getByTestId('return-to-map'));
    expect(screen.queryByTestId('cow-enter-portal')).toBeNull(); view.unmount();
    const settled = stores.map(store => store.getState()); mount();
    expect(screen.getByTestId('quest-encounter-entry-refusal')).toHaveTextContent(i18n.t('quests:cow.feedback.refused'));
    expect(screen.getByRole('heading', { name: i18n.t('quests:cow.name') })).toBeVisible();
    stores.forEach((store, index) => { expect(store.getState()).toBe(settled[index]); });
    expect(readCombatRunOrigin()).toBeNull();
  });
});
it.each(['source-free', 'nightmare', 'wrong-area', 'untracked'] as const)('refuses direct %s requests without fallback or mutations', state => {
  if (state === 'source-free') useInventoryStore.setState({ questItems: {} });
  if (state === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
  if (state === 'wrong-area') useMapStore.setState({ currentSubAreaId: 'areas/act1-blood-moor' });
  if (state === 'untracked') useMapStore.setState({ questProgress: {} });
  const before = stores.map(store => store.getState()); mount();
  expect(screen.getByTestId('quest-encounter-entry-refusal')).toBeVisible();
  stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
  expect(readCombatRunOrigin()).toBeNull(); expect(inspectRecordedWaves().currentPublished).toBeNull();
});
it('allows an explicit retry after native defeat with consumed ingredients and no premature victory proof', () => {
  useInventoryStore.setState({ backpack: [], equipped: {} }); mount(); drain();
  expect(screen.getByTestId('defeat-panel')).toBeVisible();
  expect(useMapStore.getState().questReceipts[COW.victoryProof]).toBeUndefined();
  expect(useInventoryStore.getState().questItems[COW.legSource]?.state).toBe('consumed');
  expect(useInventoryStore.getState().questItems[COW.tomeSource]?.state).toBe('consumed');
  expect(screen.queryByTestId('continue-next-subarea')).toBeNull();
  const recording = useCombatStore.getState().recordedEvents;
  act(() => { vi.advanceTimersByTime(5000); }); expect(useCombatStore.getState().recordedEvents).toBe(recording);
  fireEvent.click(screen.getByTestId('return-to-map')); fireEvent.click(screen.getByTestId('cow-enter-portal'));
  expect(screen.getByTestId('location')).toHaveTextContent(`/combat?questEncounter=${COW.encounter}`);
  expect(readCombatRunOrigin()).toMatchObject({ questEncounter: COW.encounter });
  expect(useCombatStore.getState().recordedEvents).not.toBe(recording);
});
it('refuses to reuse an unrelated in-flight run for an explicit Cow request', () => {
  startSubAreaRun({ mode: 'manual', runSeed: 7 });
  const before = stores.map(store => store.getState()), issued = inspectRecordedWaves().currentPublished;
  mount(); expect(screen.getByTestId('quest-encounter-entry-refusal')).toBeVisible();
  stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
  expect(inspectRecordedWaves().currentPublished).toBe(issued);
});
it('recovers the exact pending Cow publication without its query and retains finite battle routing', () => {
  vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(() => { throw new Error('before publication'); });
  const view = mount(), pending = inspectRecordedWaves().pending;
  expect(pending?.binding.origin).toMatchObject({ questEncounter: COW.encounter });
  expect(screen.getByRole('alert')).toBeVisible(); view.unmount(); mount('/combat');
  expect(screen.getByTestId('combat-sub-area-name')).toHaveTextContent(i18n.t('quests:cow.name'));
  fireEvent.click(screen.getByRole('button', { name: i18n.t('common:retry') }));
  expect(inspectRecordedWaves().currentPublished?.receipt).toBe(pending?.receipt); drain();
  expect(useMapStore.getState().questReceipts[COW.victoryProof]).toBe(true);
  expect(screen.queryByTestId('continue-next-subarea')).toBeNull();
});
