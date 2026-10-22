/** Synthetic ownership/hydration boundaries around real combo edits and recordings. */
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import * as combatEngine from '@/engine/combat/combat';
import { loadDefaultSkills, resetRegistry } from '@/engine/skills/registry';
import { createMockPlayer } from '@/features/character/createMockPlayer';
import { useCombatStore, usePlayerStore, useInventoryStore, useMapStore,
  useMercStore, useFormationStore, useMetaStore } from '@/stores';
import { useHydrationStore } from '@/stores/hydrationStore';
import { abortSubAreaRun, startSubAreaRun } from '@/stores/combatHelpers';
import { combatRunLifecycle } from '@/stores/combatRunLifecycle';
import { stageRecordedBattle } from '@/stores/recordedBattlePublication';
import { prepareRecordedWave, commitPreparedRecordedWave, inspectRecordedWaves } from '@/stores/recordedWaveReceipt';
import { armIronGolemSelection, useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import { beginWaveTransition, endWaveTransition, reserveWaveRestore, releaseWaveRestore } from '@/stores/waveTransitionGuard';
import { SkillsScreen } from './SkillsScreen';

const protectedStores = [useCombatStore, useInventoryStore, useMapStore, useMercStore,
  useFormationStore, useMetaStore, useIronGolemSelectionStore, useHydrationStore] as const;
const fireBolt = 'skills-sorceress-fire-bolt';
beforeEach(() => {
  abortSubAreaRun();
  for (const store of [usePlayerStore, useCombatStore, useInventoryStore, useMapStore,
    useMercStore, useFormationStore, useMetaStore]) store.getState().reset();
  loadDefaultSkills();
  useHydrationStore.getState().setStatus('ready');
});
afterEach(() => {
  cleanup(); abortSubAreaRun(); useHydrationStore.getState().setStatus('idle');
  resetRegistry(); vi.restoreAllMocks(); vi.useRealTimers();
});

describe.each(['en', 'zh-CN'])('combo replay refusal in %s', locale => {
  it.each(['idle', 'loading', 'error', 'wave', 'restore',
    'prepared', 'committedPendingPublication', 'conflict'] as const)(
    'keeps the edit and recording during %s until another explicit edit', async refusal => {
      await i18n.changeLanguage(locale);
      usePlayerStore.getState().setPlayer(createMockPlayer('Replay readiness', 'sorceress'));
      expect(usePlayerStore.getState().allocateSkillPoint(fireBolt)).toBe('ok');
      usePlayerStore.getState().setComboOrder([fireBolt]);
      const player = usePlayerStore.getState().player;
      if (!player) throw new Error('Missing skills fixture');
      armIronGolemSelection(player.id, 'skills-armed-item', true);
      expect(startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', runSeed: 7 })).not.toBeNull();
      render(<I18nextProvider i18n={i18n}><Suspense fallback={null}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SkillsScreen />
        </MemoryRouter>
      </Suspense></I18nextProvider>);
      fireEvent.click(screen.getByRole('tab', { name: i18n.t('skills:tab.active') }));
      const slot = screen.getByRole('combobox', { name: i18n.t('skills:slotN', { n: 1 }) });
      expect(slot).toHaveValue(fireBolt);
      const engine = vi.spyOn(combatEngine, 'runBattleRecorded');
      const receiptPhase = refusal === 'prepared' || refusal === 'committedPendingPublication' || refusal === 'conflict';
      if (receiptPhase) {
        const run = combatRunLifecycle.activeRun; const combat = useCombatStore.getState();
        if (!run?.recording) throw new Error('Missing phase fixture recording');
        const inv = useInventoryStore.getState();
        const ownership = { backpack: inv.backpack, stash: inv.stash, equipped: inv.equipped,
          mercEquipment: useMercStore.getState().mercEquipment };
        const selection = useIronGolemSelectionStore.getState().selection;
        const publication = stageRecordedBattle({ initialPlayerTeam: combat.playerTeam, initialEnemyTeam: combat.enemyTeam,
          events: run.recording.events, outcome: run.recording.outcome, unitNameMap: combat.unitNameMap,
          currentWave: run.waveIdx + 1, totalWaves: run.plan.waves.length, subAreaRunId: run.plan.subAreaId }, combat);
        const lease = beginWaveTransition(true);
        try {
          const token = prepareRecordedWave({ candidateRun: run, expectedActiveRun: run, heroId: run.playerUnit.id,
            targetWaveIdx: run.waveIdx, waveElapsedMs: run.waveElapsedMs, selection, ownership,
            debitIntent: null, attestation: null,
            engineInput: { seed: run.seed, playerTeam: combat.playerTeam, enemyTeam: combat.enemyTeam },
            recording: run.recording, publication }, lease);
          if (refusal !== 'prepared') expect(commitPreparedRecordedWave(token, lease, {
            activeRun: run, heroId: run.playerUnit.id, selection,
            ownership: refusal === 'conflict' ? { ...ownership, backpack: [] } : ownership
          })).toBe(refusal);
        } finally { expect(endWaveTransition(lease)).toBe(false); }
      }
      const wave = refusal === 'wave' ? beginWaveTransition(true) : undefined;
      const restore = refusal === 'restore' ? reserveWaveRestore() : undefined;
      let released = false;
      const release = () => {
        if (released) return;
        if (wave) expect(endWaveTransition(wave)).toBe(false);
        if (restore) releaseWaveRestore(restore);
        if (receiptPhase) abortSubAreaRun();
        released = true;
      };
      act(() => { useHydrationStore.getState().setStatus(
        receiptPhase ? 'ready' : refusal === 'wave' || refusal === 'restore' ? 'error' : refusal, 'skills-unready'); });
      const recording = useCombatStore.getState();
      const holder = inspectRecordedWaves();
      const before = protectedStores.map(store => store.getState());
      const run = combatRunLifecycle.activeRun;
      const runData = structuredClone(run);
      const notified = vi.fn();
      const stops = protectedStores.map(store => store.subscribe(notified));
      try {
        vi.useFakeTimers();
        fireEvent.change(slot, { target: { value: '' } });
        expect(usePlayerStore.getState().player?.comboOrder).toEqual([]);
        expect(slot).toHaveValue('');
        expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('common:error'));
        expect(engine).not.toHaveBeenCalled();
        expect(inspectRecordedWaves()).toBe(holder);
        protectedStores.forEach((store, i) => { expect(store.getState()).toBe(before[i]); });
        expect(notified).not.toHaveBeenCalled();
        expect(combatRunLifecycle.activeRun).toBe(run);
        expect(run).toEqual(runData);
        stops.forEach(stop => { stop(); });
        release();
        act(() => { useHydrationStore.getState().setStatus('ready'); vi.advanceTimersByTime(10000); });
        expect(useCombatStore.getState()).toBe(recording);
        expect(engine).not.toHaveBeenCalled();
        expect(screen.getByRole('alert')).toBeVisible();
        if (receiptPhase) {
          // Explicit abandonment ends the run. Start a fresh authoritative run;
          // readiness recovery itself never publishes or resurrects the old one.
          expect(combatRunLifecycle.activeRun).toBeNull();
          expect(inspectRecordedWaves()).toEqual({ currentPublished: null, pending: null });
          act(() => { expect(startSubAreaRun({ subAreaId: 'areas/act1-blood-moor', runSeed: 7 })).not.toBeNull(); });
          expect(combatRunLifecycle.activeRun).not.toBe(run);
          expect(engine).toHaveBeenCalledTimes(1);
          engine.mockClear();
        }
        const replayRun = combatRunLifecycle.activeRun;
        fireEvent.change(slot, { target: { value: fireBolt } });
        expect(usePlayerStore.getState().player?.comboOrder).toEqual([fireBolt]);
        expect(engine).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(useCombatStore.getState().recordedEvents).not.toBe(recording.recordedEvents);
        expect(combatRunLifecycle.activeRun).toBe(replayRun);
      } finally { stops.forEach(stop => { stop(); }); release(); }
    });
});
