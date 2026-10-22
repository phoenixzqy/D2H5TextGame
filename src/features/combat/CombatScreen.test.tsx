import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useHydrationStore } from '@/stores/hydrationStore';
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useCombatStore, useMapStore, useMetaStore, usePlayerStore } from '@/stores';
import { abortSubAreaRun, playerToCombatUnit, startSubAreaRun, advanceWaveOrFinish, performCombatScreenTransition, readCombatTransitionRecovery } from '@/stores/combatHelpers';
import type { CombatUnit } from '@/engine/combat/types';
import { CombatScreen } from './CombatScreen';
import * as combatEngine from '@/engine/combat/combat';
import { loadDefaultSkills, registerSkill, resetRegistry } from '@/engine/skills/registry';
import { synthDefaultPlan } from '@/engine/combat';
import type { ActiveRun } from '@/stores/combatRunLifecycle';
import { stageRecordedBattle } from '@/stores/recordedBattlePublication';
import { prepareRecordedWave, commitPreparedRecordedWave, inspectRecordedWaves,
  abandonRecordedWaves } from '@/stores/recordedWaveReceipt';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore } from '@/stores/waveTransitionGuard';

beforeEach(() => {
  abortSubAreaRun();
  useCombatStore.getState().reset();
  useMapStore.getState().reset();
  useMetaStore.getState().reset();
  usePlayerStore.getState().reset();
  useHydrationStore.getState().setStatus('ready');
});

afterEach(() => {
  cleanup();
  abortSubAreaRun();
  useCombatStore.getState().reset();
  usePlayerStore.getState().reset();
  useMetaStore.getState().reset();
  useHydrationStore.getState().setStatus('idle');
});

describe('combat terminal outcome copy', () => {
  for (const locale of ['en', 'zh-CN'] as const) {
    it.each(['draw', 'defeat', 'victory'] as const)('%s preserves its actual terminal label in ' + locale, async (result) => {
      await i18n.changeLanguage(locale);
      const player = createMockPlayer('TerminalCopy', 'sorceress');
      const hero = playerToCombatUnit(player);
      const winner = result === 'draw' ? null : result === 'defeat' ? 'enemy' : 'player';
      usePlayerStore.getState().setPlayer(player);
      useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
      useCombatStore.setState({
        inCombat: false,
        playerTeam: [hero],
        playbackComplete: true,
        outcome: { winner, finalPlayerTeam: [hero], finalEnemyTeam: [] },
        runVictory: result === 'victory',
        runDefeat: result !== 'victory'
      });
      render(
        <I18nextProvider i18n={i18n}>
          <Suspense fallback={null}>
            <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <CombatScreen />
            </MemoryRouter>
          </Suspense>
        </I18nextProvider>
      );

      const panel = screen.getByTestId(result === 'victory' ? 'victory-panel' : 'defeat-panel');
      const titleKey = result === 'draw' ? 'event.draw' : result === 'victory' ? 'runVictoryTitle' : 'runDefeatTitle';
      expect(within(panel).getByRole('heading')).toHaveTextContent(i18n.t(`combat:${titleKey}`));
      expect(within(panel).getByTestId('return-to-map')).toBeEnabled();
      expect(within(panel).getByTestId('return-to-town')).toBeEnabled();
      expect(useCombatStore.getState().outcome?.winner).toBe(winner);
      if (result !== 'victory') {
        expect(screen.queryByTestId('continue-next-subarea')).not.toBeInTheDocument();
        expect(screen.queryByTestId('victory-panel')).not.toBeInTheDocument();
      }
    });
  }
});


/** UI-only playback fixtures; no campaign, recovery or timing behavior is injected. */
describe('live combat resource display', () => {
  function fixture(): CombatUnit {
    const player = createMockPlayer('ResourceDisplay', 'sorceress');
    usePlayerStore.getState().setPlayer(player);
    return { ...playerToCombatUnit(player), id: 'visible-hero', kind: 'hero',
      life: 64, mana: 53,
      stats: { ...player.derivedStats, life: 120, lifeMax: 128, mana: 0, manaMax: 106 },
      gridPosition: { row: 1, col: 1 } };
  }

  function renderTeams(team: readonly CombatUnit[], enemy: readonly CombatUnit[] = []) {
    useCombatStore.setState({ inCombat: true, isPaused: true, playbackComplete: false,
      playerTeam: [...team], enemyTeam: [...enemy], recordedEvents: [], eventCursor: 0,
      currentWave: 1, totalWaves: 3,
      outcome: { winner: 'player', finalPlayerTeam: team.map(unit => ({ ...unit, mana: 1 })),
        finalEnemyTeam: enemy } });
    return render(
      <I18nextProvider i18n={i18n}>
        <Suspense fallback={null}>
          <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <CombatScreen />
          </MemoryRouter>
        </Suspense>
      </I18nextProvider>
    );
  }

  for (const locale of ['en', 'zh-CN'] as const) {
    it('uses live hero MP and true maxima after preceding merc/summon in ' + locale, async () => {
      await i18n.changeLanguage(locale);
      const hero = fixture();
      const before = structuredClone(hero);
      const merc: CombatUnit = { ...hero, id: 'visible-merc', kind: 'merc', mana: 77,
        stats: { ...hero.stats, manaMax: 999 }, gridPosition: { row: 1, col: 0 } };
      const summon: CombatUnit = { ...hero, id: 'visible-summon', kind: 'summon',
        summonOwnerId: hero.id, mana: 88, gridPosition: { row: 1, col: 2 } };
      const enemy: CombatUnit = { ...hero, id: 'visible-enemy', side: 'enemy', kind: 'monster',
        life: 50, stats: { ...hero.stats, life: 50, lifeMax: 200 },
        gridPosition: { row: 0, col: 1 } };
      renderTeams([merc, summon, hero], [enemy]);

      expect.soft(screen.getByTestId('unit-card-visible-hero').querySelector('.bg-red-600'))
        .toHaveStyle({ width: '50%' });
      expect.soft(screen.getByTestId('unit-card-visible-enemy').querySelector('.bg-red-600'))
        .toHaveStyle({ width: '25%' });
      const resources = screen.getByRole('group', { name: i18n.t('combat:mp') });
      expect(within(resources).getByText('53 / 106', { exact: true })).toBeVisible();
      const bar = within(resources).getByRole('progressbar');
      expect(bar).toHaveAttribute('aria-valuenow', '53');
      expect(bar).toHaveAttribute('aria-valuemax', '106');
      expect(bar).toHaveStyle({ width: '50%' });
      expect(hero).toEqual(before);

      act(() => { useCombatStore.setState({ playerTeam: [merc, summon, { ...hero, mana: 0 }] }); });
      expect(within(resources).getByText('0 / 106', { exact: true })).toBeVisible();
      expect(within(resources).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
      act(() => { useCombatStore.setState({ playerTeam: [merc, summon, { ...hero, mana: 61 }] }); });
      expect(within(resources).getByText('61 / 106', { exact: true })).toBeVisible();
      expect(useCombatStore.getState().outcome?.finalPlayerTeam.find(unit => unit.id === hero.id)?.mana).toBe(1);
      expect(usePlayerStore.getState().player?.derivedStats.mana).toBe(102);
    });

    it('preserves extra-row cell identity and first stacked representative in ' + locale, async () => {
      await i18n.changeLanguage(locale);
      const hero = fixture();
      const merc: CombatUnit = { ...hero, id: 'stack-merc', kind: 'merc', gridPosition: { row: 0, col: 0 } };
      const first: CombatUnit = { ...hero, id: 'stack-first', name: 'First Summon', kind: 'summon',
        summonOwnerId: hero.id, gridPosition: { row: 3, col: 2 } };
      const second: CombatUnit = { ...first, id: 'stack-second', name: 'Second Summon' };
      const team = [merc, first, second, hero];
      const before = structuredClone(team);
      renderTeams(team);
      const grid = screen.getByTestId('allies-grid');
      expect(grid.children).toHaveLength(12);
      expect(screen.getByTestId('enemies-grid').children).toHaveLength(9);
      expect(within(screen.getByTestId('player-grid-cell-1-1')).getByTestId('unit-card-visible-hero')).toBeVisible();
      expect(within(screen.getByTestId('player-grid-cell-0-0')).getByTestId('unit-card-stack-merc')).toBeVisible();
      const stack = screen.getByTestId('player-grid-cell-3-2');
      expect(grid.children[11]).toBe(stack);
      expect(within(stack).getByTestId('unit-card-stack-first')).toBeVisible();
      expect(within(stack).queryByTestId('unit-card-stack-second')).not.toBeInTheDocument();
      expect(within(stack).getByText('+1', { exact: true })).toBeVisible();
      expect(useCombatStore.getState().playerTeam).toEqual(before);
      expect(team).toEqual(before);
    });

    it('omits hero MP without a hero in ' + locale, async () => {
      await i18n.changeLanguage(locale);
      const hero = fixture();
      renderTeams([{ ...hero, id: 'merc-only', kind: 'merc' }]);
      expect(screen.queryByRole('group', { name: i18n.t('combat:mp') })).not.toBeInTheDocument();
      expect(screen.getByTestId('unit-card-merc-only')).toBeVisible();
    });

    it('omits zero-capacity MP without hiding its hero in ' + locale, async () => {
      await i18n.changeLanguage(locale);
      const hero = fixture();
      renderTeams([{ ...hero, mana: 0, stats: { ...hero.stats, mana: 50, manaMax: 0 } }]);
      expect(screen.queryByRole('group', { name: i18n.t('combat:mp') })).not.toBeInTheDocument();
      expect(screen.getByTestId('unit-card-visible-hero')).toBeVisible();
    });
  }
});


/** Real receipt refusals and playback UI; synthetic recording, no item payment. */
describe('receipt playback refusal and Retry', () => {
  afterEach(() => { vi.useRealTimers(); });
  const tree = () => <I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CombatScreen /></MemoryRouter>
  </Suspense></I18nextProvider>;
  function fixture(phase: 'prepared' | 'committedPendingPublication' | 'conflict', paused: boolean) {
    const player = createMockPlayer('Playback Retry', 'sorceress'); usePlayerStore.getState().setPlayer(player);
    const hero = playerToCombatUnit(player);
    const plan = synthDefaultPlan({ id: 'ui-receipt', lootTable: 'loot/trash-act1', areaLevel: 1 },
      'monsters/act1.fallen', 1, 7);
    const run: ActiveRun = { plan, act: 1, seed: 7, mode: 'manual', playerUnit: hero,
      waveIdx: 0, carryPlayerTeam: [hero], waveElapsedMs: 1000 };
    const events = [{ kind: 'turn-start' as const, turn: 1, simClockMs: 0, uiDelayMs: 200 },
      { kind: 'end' as const, winner: 'player' as const, simClockMs: 1000, uiDelayMs: 1000 }];
    const outcome = { winner: 'player' as const, finalPlayerTeam: [hero], finalEnemyTeam: [] };
    const publication = stageRecordedBattle({ initialPlayerTeam: [hero], initialEnemyTeam: [],
      events, outcome, unitNameMap: new Map(), currentWave: 1, totalWaves: plan.waves.length,
      subAreaRunId: plan.subAreaId }, useCombatStore.getState());
    useCombatStore.getState().publishStagedRecordedBattle(publication);
    useCombatStore.setState({ isPaused: paused });
    const ownership = { backpack: [], stash: [], equipped: {}, mercEquipment: {} };
    const lease = beginWaveTransition(true);
    try {
      const token = prepareRecordedWave({ candidateRun: run, expectedActiveRun: null, heroId: hero.id,
        targetWaveIdx: 0, waveElapsedMs: 1000, selection: null, ownership, debitIntent: null, attestation: null,
        engineInput: { seed: 7, playerTeam: [hero], enemyTeam: [] }, recording: { events, outcome }, publication }, lease);
      if (phase !== 'prepared') commitPreparedRecordedWave(token, lease, { activeRun: null, heroId: hero.id,
        selection: null, ownership: phase === 'conflict' ? { ...ownership, backpack: [] } : ownership });
    } finally { endWaveTransition(lease); }
    const view = render(tree());
    return () => { view.rerender(tree()); };
  }
  const phases = ['prepared', 'committedPendingPublication', 'conflict'] as const;
  for (const locale of ['en', 'zh-CN'] as const) {
    it.each(phases.flatMap(phase => (['skip-paused', 'pause', 'resume'] as const).map(action => ({ phase, action }))))(
      locale + ' $action refuses $phase without mutating playback', async ({ phase, action }) => {
        await i18n.changeLanguage(locale); vi.useFakeTimers(); fixture(phase, action !== 'pause');
        const before = useCombatStore.getState(); const holder = inspectRecordedWaves();
        fireEvent.click(action === 'skip-paused' ? screen.getByTestId('skip-button') :
          screen.getByRole('button', { name: i18n.t(action === 'pause' ? 'combat:pause' : 'combat:resume') }));
        expect(useCombatStore.getState()).toBe(before); expect(inspectRecordedWaves()).toBe(holder);
        expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('common:error'));
        const retry = screen.getByRole('button', { name: i18n.t('common:retry') });
        if (phase === 'conflict') expect(retry).toBeDisabled();
        else expect(retry).toBeEnabled();
      });

    it.each(phases)(locale + ' timer refusal in %s resumes on Retry after explicit abandonment', async phase => {
      await i18n.changeLanguage(locale); vi.useFakeTimers(); const rerender = fixture(phase, false);
      const before = useCombatStore.getState(); const holder = inspectRecordedWaves();
      act(() => { vi.advanceTimersByTime(1000); });
      expect(useCombatStore.getState()).toBe(before); expect(inspectRecordedWaves()).toBe(holder);
      expect(screen.getByRole('alert')).toBeVisible();
      act(() => { vi.advanceTimersByTime(5000); }); expect(useCombatStore.getState()).toBe(before);
      act(() => { abandonRecordedWaves(); rerender(); });
      fireEvent.click(screen.getByRole('button', { name: i18n.t('common:retry') }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      act(() => { vi.advanceTimersByTime(199); }); expect(useCombatStore.getState().eventCursor).toBe(0);
      act(() => { vi.advanceTimersByTime(1); }); expect(useCombatStore.getState().eventCursor).toBe(1);
      expect(useCombatStore.getState().isPaused).toBe(false);
    });
  }

  it.each(['wave', 'restore'] as const)('%s ownership timer refusal can Retry after release', async ownership => {
    await i18n.changeLanguage('en'); vi.useFakeTimers(); fixture('prepared', false); abandonRecordedWaves();
    const wave = ownership === 'wave' ? beginWaveTransition(true) : null;
    const restore = ownership === 'restore' ? reserveWaveRestore() : null;
    try {
      const before = useCombatStore.getState(); act(() => { vi.advanceTimersByTime(1000); });
      expect(useCombatStore.getState()).toBe(before); expect(screen.getByRole('alert')).toBeVisible();
    } finally {
      if (wave) endWaveTransition(wave);
      if (restore) releaseWaveRestore(restore);
    }
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    act(() => { vi.advanceTimersByTime(1000); }); expect(useCombatStore.getState().eventCursor).toBe(1);
  });
});


/** Development fault fixtures around real producers/UI, not earned or paid-Iron acceptance. */
describe('captured combat transition recovery UI', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en'); loadDefaultSkills();
    registerSkill({ id: 'fixture.ui-finisher', archetype: 'fixture', target: 'all-enemies',
      cooldown: 1, manaCost: 0, minLevel: 1,
      effects: [{ kind: 'damage', damageType: 'physical', base: [100_000, 100_000] }] });
    const player = createMockPlayer('Recovery UI', 'sorceress');
    usePlayerStore.getState().setPlayer({ ...player, comboOrder: ['fixture.ui-finisher'] });
    useMapStore.getState().setCurrentLocation(1, 'areas/act1-blood-moor');
    vi.useFakeTimers();
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); resetRegistry(); });
  const tree = () => <I18nextProvider i18n={i18n}><Suspense fallback={null}>
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><CombatScreen /></MemoryRouter>
  </Suspense></I18nextProvider>;
  function drainUIFixture() {
    while (!useCombatStore.getState().playbackComplete) useCombatStore.getState().advanceEvent();
  }

  it.each(['en', 'zh-CN'] as const)('recovers the displayed pending payload only on explicit Retry in %s', async locale => {
    await i18n.changeLanguage(locale);
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle')
      .mockImplementationOnce(() => { throw new Error('before publication'); });
    expect(performCombatScreenTransition({ kind: 'start', options: { runSeed: 7 } })).toBe(false);
    const pending = inspectRecordedWaves().pending;
    let view = render(tree()); expect(screen.getByRole('alert')).toBeVisible();
    act(() => { vi.advanceTimersByTime(5000); });
    expect(inspectRecordedWaves().pending).toBe(pending); expect(publish).toHaveBeenCalledTimes(1);
    view.unmount(); view = render(tree());
    act(() => { useHydrationStore.getState().setStatus('loading'); });
    act(() => { useHydrationStore.getState().setStatus('ready'); });
    view.rerender(tree());
    expect(inspectRecordedWaves().pending).toBe(pending); expect(engine).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: i18n.t('common:retry') }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(inspectRecordedWaves().currentPublished?.receipt).toBe(pending?.receipt);
    expect(useCombatStore.getState().recordedEvents).toBe(pending?.binding.recording.events);
    expect(publish).toHaveBeenCalledTimes(2); expect(engine).toHaveBeenCalledTimes(1);
  });

  it('resumes existing playback when auto-start publication wrote then threw', () => {
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
    const original = useCombatStore.getState().publishStagedRecordedBattle;
    const publish = vi.spyOn(useCombatStore.getState(), 'publishStagedRecordedBattle').mockImplementationOnce(value => {
      original(value); throw new Error('after publication');
    });
    expect(() => render(tree())).not.toThrow();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(readCombatTransitionRecovery()).toEqual({ kind: 'ready' });
    expect(engine).toHaveBeenCalledTimes(1); expect(publish).toHaveBeenCalledTimes(1);
  });

  it('offers explicit next-wave staging Retry after the completion timer without repeating rewards', () => {
    startSubAreaRun({ runSeed: 7 }); drainUIFixture();
    const engine = vi.spyOn(combatEngine, 'runBattleRecorded').mockImplementationOnce(() => { throw new Error('stage next'); });
    const xp = vi.spyOn(usePlayerStore.getState(), 'gainExperience');
    render(tree()); act(() => { vi.advanceTimersByTime(1500); });
    expect(screen.getByRole('alert')).toBeVisible(); expect(xp).toHaveBeenCalledTimes(1);
    const rewards = useCombatStore.getState().runRewards; const player = usePlayerStore.getState().player;
    expect(useCombatStore.getState().currentWave).toBe(1);
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(engine).toHaveBeenCalledTimes(1); expect(xp).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(useCombatStore.getState().currentWave).toBe(2); expect(engine).toHaveBeenCalledTimes(2);
    expect(xp).toHaveBeenCalledTimes(1); expect(useCombatStore.getState().runRewards).toBe(rewards);
    expect(usePlayerStore.getState().player).toBe(player);
  });

  it('keeps partially finalized idle victory parked across timers, remount and navigation controls', () => {
    useMetaStore.getState().setIdleTarget('areas/act1-blood-moor');
    startSubAreaRun({ mode: 'idle', runSeed: 7 });
    while (useCombatStore.getState().currentWave < useCombatStore.getState().totalWaves) {
      drainUIFixture(); expect(advanceWaveOrFinish()).toBe('next-wave');
    }
    drainUIFixture();
    const original = useCombatStore.getState().markRunVictory;
    vi.spyOn(useCombatStore.getState(), 'markRunVictory').mockImplementation(() => {
      original(); throw new Error('victory subscriber');
    });
    expect(performCombatScreenTransition({ kind: 'advance' })).toBe(false);
    expect(useCombatStore.getState().runVictory).toBe(true);
    const before = useCombatStore.getState(); const holder = inspectRecordedWaves();
    let view = render(tree());
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled();
    for (const id of ['idle-loop-next-run', 'return-to-map', 'return-to-town', 'continue-next-subarea']) {
      expect(screen.getByTestId(id)).toBeDisabled(); fireEvent.click(screen.getByTestId(id));
    }
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(useCombatStore.getState()).toBe(before); expect(inspectRecordedWaves()).toBe(holder);
    view.unmount(); view = render(tree()); act(() => { vi.advanceTimersByTime(10_000); });
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled();
    expect(useCombatStore.getState()).toBe(before); expect(inspectRecordedWaves()).toBe(holder);
    fireEvent.click(screen.getByRole('button', { name: i18n.t('combat:idleLoop.stop') }));
    expect(readCombatTransitionRecovery()).toEqual({ kind: 'ready' });
    expect(useCombatStore.getState().runVictory).toBe(false);
  });
});
