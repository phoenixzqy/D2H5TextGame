/** Real router transitions, canonical inventory and production recording lifecycle. */
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
import { CombatScreen } from './CombatScreen';

function reset() {
  abortSubAreaRun();
  for (const store of [useCombatStore, useFormationStore, useInventoryStore,
    useMapStore, useMercStore, useMetaStore, usePlayerStore]) store.getState().reset();
}
beforeEach(async () => { reset(); await i18n.changeLanguage('en'); });
afterEach(() => { cleanup(); reset(); vi.restoreAllMocks(); vi.useRealTimers(); });

function arrange(idle: boolean) {
  const clock = vi.spyOn(Date, 'now').mockReturnValue(1792497600000);
  const player = { ...createMockPlayer('Exit Authority', 'amazon'), equipment: [] };
  usePlayerStore.getState().setPlayer(player);
  const bow: Item = { id: 'lifecycle-bow', baseId: 'items/base/weapon-bow-training',
    rarity: 'normal', level: 1, ilvl: 1, baseRolls: { attack: 13 }, identified: true, equipped: false };
  useInventoryStore.getState().addItem(bow);
  expect(useInventoryStore.getState().equipItem(bow)).toEqual({ ok: true });
  useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
  if (idle) useMetaStore.getState().setIdleTarget('areas/act1-blood-moor');
  render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter initialEntries={['/combat']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <nav><Link to="/skills">Test Skills</Link><Link to="/inventory">Test Inventory</Link>
        <Link to="/combat">Test Combat</Link></nav>
      <Routes><Route path="/combat" element={<CombatScreen />} />
        <Route path="/map" element={<MapScreen />} /><Route path="/town" element={<TownScreen />} />
        <Route path="/skills" element={<SkillsScreen />} /><Route path="/inventory" element={<InventoryScreen />} /></Routes>
    </MemoryRouter>
  </Suspense></I18nextProvider>);
  expect(hasActiveSubAreaRun()).toBe(true);
  expect(useCombatStore.getState().recordedEvents.some(event => event.kind === 'action' &&
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
