/** Real router transitions, canonical inventory and production recording lifecycle. */
import { useHydrationStore } from '@/stores/hydrationStore';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { TownScreen } from '@/features/town/TownScreen';
import { SkillsScreen } from '@/features/skills/SkillsScreen';
import { InventoryScreen } from '@/features/inventory/InventoryScreen';
import { MapScreen } from '@/features/map/MapScreen';
import { useCombatStore, useFormationStore, useInventoryStore, useMapStore,
  useMercStore, useMetaStore, usePlayerStore } from '@/stores';
import { abortSubAreaRun, hasActiveSubAreaRun } from '@/stores/combatHelpers';
import type { Item } from '@/engine/types/items';
import { armIronGolemSelection, useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore } from '@/stores/waveTransitionGuard';
import { getIdleEliteMisses } from '@/stores/idleElitePity';
import { CombatScreen } from './CombatScreen';

function reset() {
  abortSubAreaRun();
  for (const store of [useCombatStore, useFormationStore, useInventoryStore,
    useMapStore, useMercStore, useMetaStore, usePlayerStore]) store.getState().reset();
}
beforeEach(async () => { reset(); useHydrationStore.getState().setStatus('ready'); await i18n.changeLanguage('en'); });
afterEach(() => { cleanup(); reset(); useHydrationStore.getState().setStatus('idle'); vi.restoreAllMocks(); vi.useRealTimers(); });

function arrange(idle: boolean, options: { beforeRender?: () => void; active?: boolean } = {}) {
  const clock = vi.spyOn(Date, 'now').mockReturnValue(1792497600000);
  const player = { ...createMockPlayer('Exit Authority', 'amazon'), equipment: [] };
  usePlayerStore.getState().setPlayer(player);
  const bow: Item = { id: 'lifecycle-bow', baseId: 'items/base/weapon-bow-training',
    rarity: 'normal', level: 1, ilvl: 1, baseRolls: { attack: 13 }, identified: true, equipped: false };
  useInventoryStore.getState().addItem(bow);
  expect(useInventoryStore.getState().equipItem(bow)).toEqual({ ok: true });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  if (idle) useMetaStore.getState().setIdleTarget('areas/act1-blood-moor');
  options.beforeRender?.();
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter initialEntries={['/combat']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <nav><Link to="/skills">Test Skills</Link><Link to="/inventory">Test Inventory</Link>
        <Link to="/combat">Test Combat</Link></nav>
      <Routes><Route path="/combat" element={<CombatScreen />} />
        <Route path="/map" element={<MapScreen />} /><Route path="/town" element={<TownScreen />} />
        <Route path="/skills" element={<SkillsScreen />} /><Route path="/inventory" element={<InventoryScreen />} /></Routes>
    </MemoryRouter>
  </Suspense></I18nextProvider>);
  expect(hasActiveSubAreaRun()).toBe(options.active ?? true);
  if (options.active !== false) expect(useCombatStore.getState().recordedEvents.some(event => event.kind === 'action' &&
    event.actor === player.id && event.skillId === 'amazon.magic_arrow')).toBe(true);
  return { clock, player };
}

describe('combat exit cancels the run through deferred router navigation', () => {
  for (const idle of [false, true]) {
    it(`${idle ? 'Stop Idle' : 'Flee'} leaves map with no hidden run or recording`, async () => {
      arrange(idle);
      fireEvent.click(screen.getByRole('button', { name: i18n.t(idle ? 'combat:idleLoop.stop' : 'combat:flee') }));
      await screen.findByTestId('map-screen');
      expect.soft(hasActiveSubAreaRun()).toBe(false);
      const combat = useCombatStore.getState();
      expect.soft(combat.inCombat).toBe(false);
      expect.soft(combat.recordedEvents).toEqual([]);
      expect.soft(combat.outcome).toBeNull();
      expect.soft(combat.subAreaRunId).toBeNull();
      expect(useMetaStore.getState().idleState.idleTarget).toBeUndefined();
    });
  }

  it('Flee then Enter records current canonical weapon and Date instead of a hidden old battle', async () => {
    const { clock, player } = arrange(false);
    expect(useCombatStore.getState().enemyTeam.map(unit => unit.id)).toContain('enemy-act1.fallen-0-db2c');
    fireEvent.click(screen.getByRole('button', { name: 'Flee' }));
    await screen.findByTestId('map-screen');
    clock.mockReturnValue(1792497600055);
    act(() => { expect(useInventoryStore.getState().unequipItem('weapon')).toEqual({ ok: true }); });
    fireEvent.click(within(screen.getByTestId('sub-area-row-a1-blood-moor')).getByRole('button', { name: 'Enter' }));
    await waitFor(() => { expect(screen.getByTestId('combat-screen')).toBeVisible(); });
    const combat = useCombatStore.getState();
    // Independent hash/Mulberry32 arithmetic: seed2330410414, wave349193247;
    // third draw .03885212447 ->floor(*65536)=2546=0x09f2. Count/ordinal independent.
    expect.soft(combat.enemyTeam.map(unit => unit.id)).toContain('enemy-act1.fallen-0-09f2');
    expect.soft(combat.playerTeam.find(unit => unit.id === player.id)?.stats.attack).toBe(22);
    expect.soft(combat.recordedEvents.filter(event => event.kind === 'action' &&
      event.actor === player.id && event.skillId === 'amazon.magic_arrow')).toEqual([]);
    expect(combat.recordedEvents.some(event => event.kind === 'action' &&
      event.actor === player.id && event.skillId === null)).toBe(true);
  });
});

/** Terminal flags isolate exit/restart controls; no campaign victory claim. */
function terminal() {
  act(() => { abortSubAreaRun(); useCombatStore.getState().markRunVictory(); });
}
describe('explicit terminal exits and intentional restarts', () => {
  for (const target of ['map', 'town']) {
    it(`Return to ${target} leaves no hidden replacement run`, async () => {
      arrange(false);
      terminal();
      fireEvent.click(screen.getByTestId(`return-to-${target}`));
      await screen.findByTestId(`${target}-screen`);
      expect.soft(hasActiveSubAreaRun()).toBe(false);
      expect.soft(useCombatStore.getState().inCombat).toBe(false);
      expect.soft(useCombatStore.getState().recordedEvents).toEqual([]);
      expect.soft(useCombatStore.getState().outcome).toBeNull();
      expect(useCombatStore.getState().subAreaRunId).toBeNull();
    });
  }
  for (const target of ['Skills', 'Inventory']) {
    it(`ordinary navigation to ${target} preserves the active recording and return`, async () => {
      arrange(false);
      act(() => { useCombatStore.getState().pausePlayback(); });
      const before = useCombatStore.getState();
      const snapshot = structuredClone({ events: before.recordedEvents, team: before.playerTeam, outcome: before.outcome });
      fireEvent.click(screen.getByRole('link', { name: `Test ${target}` }));
      await screen.findByTestId(`${target.toLowerCase()}-screen`);
      expect(hasActiveSubAreaRun()).toBe(true);
      fireEvent.click(screen.getByRole('link', { name: 'Test Combat' }));
      await screen.findByTestId('combat-screen');
      const after = useCombatStore.getState();
      expect(after.recordedEvents).toBe(before.recordedEvents);
      expect(after.playerTeam).toBe(before.playerTeam);
      expect(after.outcome).toBe(before.outcome);
      expect({ events: after.recordedEvents, team: after.playerTeam, outcome: after.outcome }).toEqual(snapshot);
      expect(after.eventCursor).toBe(before.eventCursor);
      expect(after.isPaused).toBe(true);
    });
  }
  it('Continue to next area intentionally starts its new recording in screen', () => {
    const { clock, player } = arrange(false);
    terminal();
    const previous = useCombatStore.getState().recordedEvents;
    clock.mockReturnValue(1792497600055);
    act(() => { expect(useInventoryStore.getState().unequipItem('weapon')).toEqual({ ok: true }); });
    fireEvent.click(screen.getByTestId('continue-next-subarea'));
    expect(screen.getByTestId('combat-screen')).toBeVisible();
    expect(useMapStore.getState().currentSubAreaId).toBe('areas/act1-den-of-evil');
    expect(hasActiveSubAreaRun()).toBe(true);
    expect(useCombatStore.getState().recordedEvents).not.toBe(previous);
    expect(useCombatStore.getState().playerTeam.find(unit => unit.id === player.id)?.stats.attack).toBe(22);
  });
  for (const automatic of [false, true]) {
    it(`${automatic ? 'timed' : 'manual'} idle continuation intentionally starts a new recording`, () => {
      vi.useFakeTimers();
      const { clock } = arrange(true);
      terminal();
      const previous = useCombatStore.getState().recordedEvents;
      clock.mockReturnValue(1792497600055);
      if (automatic) act(() => { vi.advanceTimersByTime(1500); });
      else fireEvent.click(screen.getByTestId('idle-loop-next-run'));
      expect(screen.getByTestId('combat-screen')).toBeVisible();
      expect(hasActiveSubAreaRun()).toBe(true);
      expect(useCombatStore.getState().recordedEvents).not.toBe(previous);
      expect(useMetaStore.getState().idleState.idleTarget).toBe('areas/act1-blood-moor');
    });
  }
});


describe.each(['en', 'zh-CN'] as const)('guarded combat exit feedback in %s', locale => {
  it.each([
    { idle: false, owner: 'wave' }, { idle: true, owner: 'wave' },
    { idle: false, owner: 'restore' }, { idle: true, owner: 'restore' }
  ] as const)('keeps idle=$idle state intact during $owner ownership and allows retry', async ({ idle, owner }) => {
    await i18n.changeLanguage(locale);
    const { player } = arrange(idle);
    act(() => { useCombatStore.getState().pausePlayback(); }); // Isolate the handler from playback timers.
    const selection = armIronGolemSelection(player.id, 'exit-selection', true);
    const stores = [useCombatStore, useFormationStore, useInventoryStore, useMapStore,
      useMercStore, useMetaStore, usePlayerStore] as const;
    const before = stores.map(store => store.getState());
    const recording = useCombatStore.getState().recordedEvents;
    const pity = getIdleEliteMisses();
    const notified = vi.fn();
    const stops = [...stores.map(store => store.subscribe(notified)), useIronGolemSelectionStore.subscribe(notified)];
    const wave = owner === 'wave' ? beginWaveTransition(true) : undefined;
    const restore = owner === 'restore' ? reserveWaveRestore() : undefined;
    const label = i18n.t(idle ? 'combat:idleLoop.stop' : 'combat:flee');
    try {
      fireEvent.click(screen.getByRole('button', { name: label }));
      expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('common:error'));
      expect(screen.getByTestId('combat-screen')).toBeVisible();
      expect(screen.queryByTestId('map-screen')).not.toBeInTheDocument();
      expect(hasActiveSubAreaRun()).toBe(true);
      stores.forEach((store, index) => { expect(store.getState()).toBe(before[index]); });
      expect(useIronGolemSelectionStore.getState().selection).toBe(selection);
      expect(getIdleEliteMisses()).toBe(pity);
      expect(notified).not.toHaveBeenCalled();
    } finally {
      stops.forEach(stop => { stop(); });
      if (wave) endWaveTransition(wave);
      if (restore) releaseWaveRestore(restore);
    }
    // A rejected exit must not leave the hidden exiting ref set: auto-start still runs.
    act(() => { useCombatStore.getState().endCombat(); });
    expect(hasActiveSubAreaRun()).toBe(true);
    const restarted = useCombatStore.getState();
    expect(restarted.inCombat).toBe(true);
    expect(restarted.recordedEvents.length).toBeGreaterThan(0);
    expect(restarted.recordedEvents).not.toBe(recording);
    expect(restarted.subAreaRunId).toBe('areas/act1-blood-moor');
    expect(restarted.outcome).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: label }));
    await screen.findByTestId('map-screen');
    expect(hasActiveSubAreaRun()).toBe(false);
    expect(useIronGolemSelectionStore.getState().selection).toBeNull();
    expect(useMetaStore.getState().idleState.idleTarget).toBeUndefined();
    expect(useCombatStore.getState()).toMatchObject({
      inCombat: false, recordedEvents: [], outcome: null, subAreaRunId: null
    });
  });
});


const readinessDomains = [useCombatStore, useFormationStore, useInventoryStore,
  useMapStore, useMercStore, useMetaStore, usePlayerStore, useIronGolemSelectionStore] as const;
function holdTransition(owner: 'wave' | 'restore') {
  if (owner === 'wave') {
    const lease = beginWaveTransition(true);
    return () => { endWaveTransition(lease); };
  }
  const lease = reserveWaveRestore();
  return () => { releaseWaveRestore(lease); };
}

describe.each(['en', 'zh-CN'] as const)('wave readiness feedback in %s', locale => {
  it.each(['wave', 'restore'] as const)('retains a refused mount during %s ownership and retries explicitly', async owner => {
    await i18n.changeLanguage(locale);
    let release: (() => void) | undefined;
    let before: unknown[] = [];
    let stops: (() => void)[] = [];
    const notified = vi.fn();
    try {
      arrange(false, { active: false, beforeRender: () => {
        const player = usePlayerStore.getState().player;
        if (!player) throw new Error('Missing mount fixture');
        armIronGolemSelection(player.id, 'mount-selection', true);
        release = holdTransition(owner);
        before = readinessDomains.map(store => store.getState());
        stops = readinessDomains.map(store => store.subscribe(notified));
      } });
      expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('common:error'));
      expect(screen.getByTestId('combat-screen')).toBeVisible();
      readinessDomains.forEach((store, i) => { expect(store.getState()).toBe(before[i]); });
      expect(notified).not.toHaveBeenCalled();
    } finally { stops.forEach(stop => { stop(); }); release?.(); }
    expect(hasActiveSubAreaRun()).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: i18n.t('common:retry') }));
    expect(hasActiveSubAreaRun()).toBe(true);
    expect(useCombatStore.getState().recordedEvents.length).toBeGreaterThan(0);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each(['wave', 'restore'] as const)('catches a real advance timer during %s ownership without looping or losing its recording', async owner => {
    await i18n.changeLanguage(locale);
    vi.useFakeTimers();
    const { player } = arrange(false);
    fireEvent.click(screen.getByTestId('skip-button'));
    expect(useCombatStore.getState().playbackComplete).toBe(true);
    armIronGolemSelection(player.id, 'advance-selection', true);
    const before = readinessDomains.map(store => store.getState());
    const pity = getIdleEliteMisses();
    const notified = vi.fn();
    const stops = readinessDomains.map(store => store.subscribe(notified));
    const release = holdTransition(owner);
    try {
      act(() => { vi.advanceTimersByTime(1500); });
      expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('common:error'));
      expect(screen.queryByTestId('next-wave-banner')).not.toBeInTheDocument();
      act(() => { vi.advanceTimersByTime(6000); });
      readinessDomains.forEach((store, i) => { expect(store.getState()).toBe(before[i]); });
      expect(hasActiveSubAreaRun()).toBe(true);
      expect(getIdleEliteMisses()).toBe(pity);
      expect(notified).not.toHaveBeenCalled();
    } finally { stops.forEach(stop => { stop(); }); release(); }
    fireEvent.click(screen.getByRole('button', { name: i18n.t('common:retry') }));
    act(() => { vi.advanceTimersByTime(1500); });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(useCombatStore.getState().runDefeat || useCombatStore.getState().currentWave === 2).toBe(true);
  });
});

it.each(['idle', 'loading', 'error'] as const)('waits through %s hydration on mount and starts when ready', status => {
  vi.useFakeTimers();
  let before: unknown[] = [];
  arrange(false, { active: false, beforeRender: () => {
    useHydrationStore.getState().setStatus(status, 'mount-loading-marker');
    before = readinessDomains.map(store => store.getState());
  } });
  expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('common:error'));
  expect(screen.getByRole('button', { name: i18n.t('common:retry') })).toBeDisabled();
  act(() => { vi.advanceTimersByTime(6000); });
  readinessDomains.forEach((store, i) => { expect(store.getState()).toBe(before[i]); });
  expect(hasActiveSubAreaRun()).toBe(false);
  act(() => { useHydrationStore.getState().setStatus('ready'); });
  expect(hasActiveSubAreaRun()).toBe(true);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('suspends playback and a pending advance while hydration is unready, then resumes', () => {
  vi.useFakeTimers();
  arrange(false);
  const opening = useCombatStore.getState();
  act(() => { useHydrationStore.getState().setStatus('loading'); });
  act(() => { vi.advanceTimersByTime(6000); });
  expect(useCombatStore.getState()).toBe(opening);
  act(() => { useHydrationStore.getState().setStatus('ready'); });
  act(() => { vi.advanceTimersByTime(6000); });
  expect(useCombatStore.getState().eventCursor).toBeGreaterThan(opening.eventCursor);
  fireEvent.click(screen.getByTestId('skip-button'));
  expect(screen.getByTestId('next-wave-banner')).toBeVisible();
  act(() => { useHydrationStore.getState().setStatus('loading'); });
  const completed = readinessDomains.map(store => store.getState());
  expect(screen.queryByTestId('next-wave-banner')).not.toBeInTheDocument();
  act(() => { vi.advanceTimersByTime(6000); });
  readinessDomains.forEach((store, i) => { expect(store.getState()).toBe(completed[i]); });
  act(() => { useHydrationStore.getState().setStatus('ready'); });
  act(() => { vi.advanceTimersByTime(1500); });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(useCombatStore.getState().runDefeat || useCombatStore.getState().currentWave === 2).toBe(true);
});


it('retains a finalized idle recording until hydration allows its timed continuation', () => {
  vi.useFakeTimers();
  arrange(true);
  terminal(); // Synthetic terminal flag isolates the continuation timer.
  act(() => { useHydrationStore.getState().setStatus('loading'); });
  const before = useCombatStore.getState();
  act(() => { vi.advanceTimersByTime(6000); });
  expect(useCombatStore.getState()).toBe(before);
  expect(hasActiveSubAreaRun()).toBe(false);
  act(() => { useHydrationStore.getState().setStatus('ready'); });
  act(() => { vi.advanceTimersByTime(1500); });
  expect(hasActiveSubAreaRun()).toBe(true);
  expect(useCombatStore.getState().recordedEvents).not.toBe(before.recordedEvents);
});
