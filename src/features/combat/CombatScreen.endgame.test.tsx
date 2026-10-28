import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import i18n from '@/i18n';
import { campaignEvidence } from '../../../tests/helpers/endgame';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useMapStore, useMetaStore, useInventoryStore, useCombatStore, usePlayerStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { abortSubAreaRun, readCombatRunOrigin } from '@/stores/combatHelpers';
import { getIdleEliteMisses, setIdleEliteMisses } from '@/stores/idleElitePity';
import { inspectRecordedWaves } from '@/stores/recordedWaveReceipt';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { CombatScreen } from './CombatScreen';
import * as combatEngine from '@/engine/combat/combat';

function Location() { return <output data-testid="combat-location">{useLocation().pathname}</output>; }
function mount(query = '?endgame=glacial') {
  return render(<MemoryRouter initialEntries={[`/combat${query}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <CombatScreen /><Location />
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
  abortSubAreaRun();
  for (const store of [useMapStore, useMetaStore, useInventoryStore, useCombatStore, usePlayerStore]) store.getState().reset();
  loadDefaultSkills();
  // Constructed UI functional fixture around real native recordings; no earned/balance assertion.
  registerSkill({ id: 'fixture.dungeon-ui', archetype: 'fixture', target: 'all-enemies', cooldown: 1,
    manaCost: 0, minLevel: 1, effects: [{ kind: 'damage', damageType: 'physical', base: [100_000_000, 100_000_000] }] });
  const player = createMockPlayer('Dungeon UI', 'sorceress');
  usePlayerStore.getState().setPlayer({ ...player, level: 99, comboOrder: ['fixture.dungeon-ui'] });
  const campaign = campaignEvidence();
  useMapStore.setState({ questProgress: campaign.questProgress, questReceipts: campaign.questReceipts,
    questDifficulties: { 'difficulty/nightmare': true }, selectedDifficulty: 'nightmare',
    currentAct: 1, currentSubAreaId: 'areas/act1-blood-moor', challengeOrdinals: { normal: 17, nightmare: 23, hell: 0 } });
  useMetaStore.getState().setIdleTarget('areas/act1-blood-moor');
  useHydrationStore.getState().setStatus('ready'); setIdleEliteMisses(11);
  await i18n.changeLanguage('en'); vi.useFakeTimers();
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); abortSubAreaRun(); resetRegistry(); vi.useRealTimers();
  useHydrationStore.getState().setStatus('idle'); setIdleEliteMisses(0);
});
describe('explicit native dungeon combat UI', () => {
  it.each(['en', 'zh-CN'])('completes the chosen trial without idle/campaign actions, then starts a fresh attempt in %s', async locale => {
    await i18n.changeLanguage(locale); const map = useMapStore.getState(); mount();
    expect(readCombatRunOrigin()).toMatchObject({ kind: 'endgame', modifierId: 'glacial', attemptOrdinal: 0 });
    expect(screen.getByTestId('combat-sub-area-name')).toHaveTextContent(i18n.t('endgame:worldstoneRemnant.name'));
    expect(screen.getByTestId('combat-act-name')).toHaveTextContent(i18n.t('endgame:modifiers.glacial.name'));
    expect(screen.queryByTestId('idle-loop-panel')).toBeNull();
    for (let wave = 0; wave < 4; wave++) drain();
    expect(screen.getByTestId('victory-panel')).toBeVisible();
    expect(screen.queryByTestId('continue-next-subarea')).toBeNull();
    expect(screen.queryByTestId('idle-loop-next-run')).toBeNull();
    expect(useMapStore.getState().endgame.clearCounts).toEqual({ ashen: 0, glacial: 1 });
    expect(useMapStore.getState().challengeOrdinals).toBe(map.challengeOrdinals);
    expect(useMapStore.getState().clearedSubAreas).toBe(map.clearedSubAreas);
    expect(useMapStore.getState().nightmareClearedSubAreas).toBe(map.nightmareClearedSubAreas);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(useMapStore.getState().endgame.attemptOrdinal).toBe(1);
    expect(getIdleEliteMisses()).toBe(11);
    fireEvent.click(screen.getByTestId('endgame-new-attempt'));
    expect(readCombatRunOrigin()).toMatchObject({ kind: 'endgame', modifierId: 'glacial', attemptOrdinal: 1 });
    expect(useMapStore.getState().endgame.attemptOrdinal).toBe(2);
    expect(useCombatStore.getState().runVictory).toBe(false);
  });
  it.each(['?endgame=unknown', '?endgame=', '?endgame=ashen&endgame=glacial'])('refuses %s without ordinary area admission', query => {
    const map = useMapStore.getState(), inventory = useInventoryStore.getState(); mount(query);
    expect(screen.getByTestId('endgame-entry-refusal')).toBeVisible();
    expect(useMapStore.getState()).toBe(map); expect(useInventoryStore.getState()).toBe(inventory);
    expect(inspectRecordedWaves().currentPublished).toBeNull();
    expect(readCombatRunOrigin()).toBeNull();
  });
  it('recovers the same issued modifier after a conflicting route request without another simulation or ordinal', () => {
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(() => { throw new Error('before publication'); });
    const view = mount();
    const pending = inspectRecordedWaves().pending;
    expect(pending?.binding.origin).toMatchObject({ kind: 'endgame', modifierId: 'glacial' });
    expect(screen.getByRole('alert')).toBeVisible();
    view.unmount(); mount('?endgame=ashen');
    expect(screen.getByTestId('combat-act-name')).toHaveTextContent(i18n.t('endgame:modifiers.glacial.name'));
    act(() => { vi.advanceTimersByTime(5000); });
    expect(inspectRecordedWaves().pending).toBe(pending);
    fireEvent.click(screen.getByRole('button', { name: i18n.t('common:retry') }));
    expect(inspectRecordedWaves().currentPublished?.receipt).toBe(pending?.receipt);
    expect(useMapStore.getState().endgame.attemptOrdinal).toBe(1);
    expect(engine).toHaveBeenCalledTimes(1);
  });
  it('offers a fresh attempt after an actual native defeat without granting a clear or cache', () => {
    usePlayerStore.getState().setPlayer(createMockPlayer('Unprepared dungeon challenger', 'sorceress'));
    mount(); drain();
    expect(useCombatStore.getState().outcome?.winner).not.toBe('player');
    expect(screen.getByTestId('defeat-panel')).toBeVisible();
    expect(useMapStore.getState().endgame.clearCounts).toEqual({ ashen: 0, glacial: 0 });
    expect(useInventoryStore.getState().materials).toEqual({});
    fireEvent.click(screen.getByTestId('endgame-new-attempt'));
    expect(readCombatRunOrigin()).toMatchObject({ modifierId: 'glacial', attemptOrdinal: 1 });
    expect(useMapStore.getState().endgame.attemptOrdinal).toBe(2);
  });
  it('refuses direct locked entry without spending any ordinal or falling back', () => {
    useMapStore.setState({ questProgress: {}, questReceipts: {} }); mount('?endgame=ashen');
    expect(screen.getByTestId('endgame-entry-refusal')).toBeVisible();
    expect(useMapStore.getState().endgame.attemptOrdinal).toBe(0);
    expect(inspectRecordedWaves().currentPublished).toBeNull();
  });
  it('flee keeps campaign idle target and pity while abandoning the dungeon', () => {
    mount(); fireEvent.click(screen.getByRole('button', { name: i18n.t('combat:flee') }));
    expect(screen.getByTestId('combat-location')).toHaveTextContent('/map');
    expect(readCombatRunOrigin()).toBeNull(); expect(getIdleEliteMisses()).toBe(11);
    expect(useMetaStore.getState().idleState.idleTarget).toBe('areas/act1-blood-moor');
    expect(useMapStore.getState().endgame.clearCounts).toEqual({ ashen: 0, glacial: 0 });
  });
  it.each(['map', 'town'] as const)('terminal return to %s preserves campaign idle state and permits ordinary entry', destination => {
    const view = mount(); for (let wave = 0; wave < 4; wave++) drain();
    fireEvent.click(screen.getByTestId(`return-to-${destination}`));
    expect(screen.getByTestId('combat-location')).toHaveTextContent(`/${destination}`);
    expect(getIdleEliteMisses()).toBe(11);
    expect(useMetaStore.getState().idleState.idleTarget).toBe('areas/act1-blood-moor');
    view.unmount(); mount('');
    expect(readCombatRunOrigin()).toMatchObject({ kind: 'area' });
    expect(useMapStore.getState().endgame.attemptOrdinal).toBe(1);
  });
  it('terminal campaign return releases its receipt before explicit dungeon entry', () => {
    useMetaStore.getState().setIdleTarget(undefined);
    const view = mount('');
    expect(readCombatRunOrigin()).toMatchObject({ kind: 'area' });
    let remaining = 12;
    while (!useCombatStore.getState().runVictory && remaining-- > 0) drain();
    expect(screen.getByTestId('victory-panel')).toBeVisible();
    const ordinals = useMapStore.getState().challengeOrdinals;
    fireEvent.click(screen.getByTestId('return-to-map'));
    expect(readCombatRunOrigin()).toBeNull();
    view.unmount(); mount('?endgame=ashen');
    expect(readCombatRunOrigin()).toMatchObject({ kind: 'endgame', modifierId: 'ashen', attemptOrdinal: 0 });
    expect(useMapStore.getState().challengeOrdinals).toBe(ordinals);
    expect(useMapStore.getState().endgame.attemptOrdinal).toBe(1);
  });
});
