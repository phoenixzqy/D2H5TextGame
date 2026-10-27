/** Constructed UI fixtures exercise real recordings; no earned gameplay or balance acceptance. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '@/i18n';
import { COUNTESS } from '@/engine/map/countess-admission';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { MapScreen } from '@/features/map/MapScreen';
import { useMapStore, useMetaStore, useInventoryStore, useCombatStore, usePlayerStore, useMercStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { abortSubAreaRun, readCombatRunOrigin, startSubAreaRun } from '@/stores/combatHelpers';
import { combatRunLifecycle } from '@/stores/combatRunLifecycle';
import { inspectRecordedWaves } from '@/stores/recordedWaveReceipt';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore } from '@/stores/waveTransitionGuard';
import { CombatScreen } from './CombatScreen';

const stores = [useMapStore, useMetaStore, useInventoryStore, useCombatStore, usePlayerStore, useMercStore] as const;
function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname + location.search}</output>; }
function mount(route = '/combat?questEncounter=act1-dw-countess') {
  return render(<MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes><Route path="/combat" element={<CombatScreen />} /><Route path="/map" element={<MapScreen />} /></Routes><Location />
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
  usePlayerStore.getState().setPlayer({ ...createMockPlayer('Countess UI fixture', 'sorceress'), comboOrder: [] });
  const gear = { id: 'countess-ui-cap', baseId: 'items/base/helm-cap', rarity: 'rare' as const,
    level: 1, identified: true, equipped: false, affixes: [{ affixId: 'constructed-power', values: new Map([
      ['statMods.attack', 99978], ['statMods.defense', 99973], ['statMods.life', 999880]
    ]) }] };
  useInventoryStore.getState().addItem(gear); expect(useInventoryStore.getState().equipItem(gear)).toEqual({ ok: true });
  useMapStore.setState({ currentAct: 1, currentSubAreaId: COUNTESS.area, clearedSubAreas: [],
    questProgress: { [COUNTESS.quest]: { id: COUNTESS.quest, status: 'inProgress', rewardClaimed: false,
      objectives: { [COUNTESS.objective]: false } } } });
  useMetaStore.getState().setIdleTarget(COUNTESS.area);
  useHydrationStore.getState().setStatus('ready'); await i18n.changeLanguage('en'); vi.useFakeTimers();
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); abortSubAreaRun(); for (const store of stores) store.getState().reset();
  useHydrationStore.getState().setStatus('idle'); vi.useRealTimers();
});
describe.each(['en', 'zh-CN'])('explicit Countess UI in %s', locale => {
  it('enters from the uncleared Dark Wood, settles once, and offers no idle/ordinary continuation', async () => {
    await i18n.changeLanguage(locale); mount('/map');
    const action = screen.getByRole('button', { name: locale === 'en' ? 'Challenge the Countess' : '挑战大伯爵' });
    const before = useMapStore.getState(); fireEvent.click(action);
    expect(screen.getByTestId('location')).toHaveTextContent('/combat?questEncounter=act1-dw-countess');
    expect(readCombatRunOrigin()).toMatchObject({ kind: 'area', questEncounter: COUNTESS.encounter });
    expect(combatRunLifecycle.activeRun?.mode).toBe('manual');
    expect(screen.queryByTestId('idle-loop-panel')).toBeNull(); drain();
    expect(screen.getByTestId('victory-panel')).toBeVisible();
    expect(useMapStore.getState().questReceipts[COUNTESS.receipt]).toBe(true);
    expect(useMapStore.getState().clearedSubAreas).toBe(before.clearedSubAreas);
    expect(useMapStore.getState().challengeOrdinals).toBe(before.challengeOrdinals);
    expect(screen.queryByTestId('continue-next-subarea')).toBeNull();
    expect(screen.queryByTestId('idle-loop-next-run')).toBeNull();
    const recording = useCombatStore.getState().recordedEvents;
    act(() => { vi.advanceTimersByTime(5000); }); expect(useCombatStore.getState().recordedEvents).toBe(recording);
    fireEvent.click(screen.getByTestId('return-to-map'));
    expect(screen.queryByRole('button', { name: locale === 'en' ? 'Challenge the Countess' : '挑战大伯爵' })).toBeNull();
  });
  it('refuses a stale victory request without starting an ordinary run', async () => {
    await i18n.changeLanguage(locale);
    useMapStore.setState({ questProgress: { [COUNTESS.quest]: { id: COUNTESS.quest, status: 'completed',
      objectives: { [COUNTESS.objective]: true } } }, questReceipts: { [COUNTESS.receipt]: true } });
    const before = stores.map(store => store.getState()); mount();
    expect(screen.getByTestId('quest-encounter-entry-refusal')).toHaveTextContent(locale === 'en'
      ? 'This challenge is unavailable. Return to the map to choose an available encounter.' : '当前无法挑战。请返回地图选择可用的战斗。');
    stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
    expect(readCombatRunOrigin()).toBeNull(); expect(inspectRecordedWaves().currentPublished).toBeNull();
    expect(screen.getByRole('heading', { name: locale === 'en' ? 'The Forgotten Tower' : '被遗忘的高塔' })).toBeVisible();
  });
});
it.each(['unknown', '', 'act1-dw-countess&questEncounter=act1-dw-countess', 'act1-dw-countess&endgame=ashen'])(
  'refuses invalid or mixed selected request %s without fallback', query => {
    const before = stores.map(store => store.getState()); mount(`/combat?questEncounter=${query}`);
    expect(screen.getByTestId('quest-encounter-entry-refusal')).toBeVisible();
    stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
    expect(readCombatRunOrigin()).toBeNull(); expect(inspectRecordedWaves().currentPublished).toBeNull();
  }
);
it.each(['untracked', 'nightmare', 'wrong-area'] as const)('refuses direct %s request with no changes', state => {
  if (state === 'untracked') useMapStore.setState({ questProgress: {} });
  if (state === 'nightmare') useMapStore.setState({ selectedDifficulty: 'nightmare' });
  if (state === 'wrong-area') useMapStore.setState({ currentSubAreaId: 'areas/act1-blood-moor' });
  const before = stores.map(store => store.getState()); mount();
  expect(screen.getByTestId('quest-encounter-entry-refusal')).toBeVisible();
  stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
  expect(readCombatRunOrigin()).toBeNull();
});
it('allows a fresh explicit retry after native defeat, preserving the unproved quest', () => {
  useInventoryStore.getState().reset(); mount(); drain();
  expect(screen.getByTestId('defeat-panel')).toBeVisible();
  expect(useMapStore.getState().questReceipts[COUNTESS.receipt]).toBeUndefined();
  expect(screen.queryByTestId('continue-next-subarea')).toBeNull();
  const recording = useCombatStore.getState().recordedEvents;
  act(() => { vi.advanceTimersByTime(5000); }); expect(useCombatStore.getState().recordedEvents).toBe(recording);
  fireEvent.click(screen.getByTestId('return-to-map'));
  fireEvent.click(screen.getByRole('button', { name: 'Challenge the Countess' }));
  expect(readCombatRunOrigin()).toMatchObject({ questEncounter: COUNTESS.encounter });
  expect(useCombatStore.getState().recordedEvents).not.toBe(recording);
});

it('refuses to reuse an unrelated in-flight run for an explicit Countess request', () => {
  startSubAreaRun({ mode: 'manual', runSeed: 7 });
  const before = stores.map(store => store.getState()), issued = inspectRecordedWaves().currentPublished;
  mount(); expect(screen.getByTestId('quest-encounter-entry-refusal')).toBeVisible();
  stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
  expect(inspectRecordedWaves().currentPublished).toBe(issued);
});
it('recovers the exact pending Countess publication after returning without its query', () => {
  vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(() => { throw new Error('before publication'); });
  const view = mount(), pending = inspectRecordedWaves().pending;
  expect(pending?.binding.origin).toMatchObject({ questEncounter: COUNTESS.encounter });
  expect(screen.getByRole('alert')).toBeVisible(); view.unmount(); mount('/combat');
  expect(screen.getByTestId('combat-sub-area-name')).toHaveTextContent('The Countess');
  fireEvent.click(screen.getByRole('button', { name: i18n.t('common:retry') }));
  expect(inspectRecordedWaves().currentPublished?.receipt).toBe(pending?.receipt); drain();
  expect(useMapStore.getState().questReceipts[COUNTESS.receipt]).toBe(true);
  expect(screen.queryByTestId('continue-next-subarea')).toBeNull();
});

it.each(['ordinary', 'countess'] as const)('rejects invalid quest queries despite an existing %s origin', kind => {
  startSubAreaRun({ mode: 'manual', runSeed: 7, ...(kind === 'countess' ? { questEncounter: COUNTESS.encounter } : {}) });
  const before = stores.map(store => store.getState()), issued = inspectRecordedWaves().currentPublished;
  mount('/combat?questEncounter=unknown&endgame=ashen');
  expect(screen.getByTestId('quest-encounter-entry-refusal')).toBeVisible();
  stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
  expect(inspectRecordedWaves().currentPublished).toBe(issued);
});
it.each(['combat', 'hydration', 'wave', 'restore'] as const)('refuses Countess map travel during %s before changing location', owner => {
  useMapStore.setState({ currentSubAreaId: 'areas/act1-blood-moor' });
  if (owner === 'combat') startSubAreaRun({ mode: 'manual', runSeed: 7 });
  if (owner === 'hydration') useHydrationStore.getState().setStatus('idle');
  const before = stores.map(store => store.getState()); mount('/map');
  const wave = owner === 'wave' ? beginWaveTransition(true) : undefined;
  const restore = owner === 'restore' ? reserveWaveRestore() : undefined;
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Challenge the Countess' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/map');
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('quests:countess.refused'));
    stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
  } finally {
    if (wave) endWaveTransition(wave);
    if (restore) releaseWaveRestore(restore);
  }
});
