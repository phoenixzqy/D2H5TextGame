/**
 * CombatScreen — main combat UI.
 *
 * Layout @ lg+:
 *   [ Header: act / sub-area / wave / pause / auto / flee ]
 *   [ Top row: Allies (left) | Enemies (right) ]
 *   [ Combat log (fixed bottom, scrollable) ]
 *
 * Below lg, each team keeps three formation columns and teams stack
 * vertically so complete names remain readable in the scrolling main.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Panel, ScreenShell, StatBar, GameCard, GameImage, getClassPortraitUrl, getMercPortraitUrl, getMonsterImageUrl, getSummonImageUrl, tDataKey } from '@/ui';
import { CombatRewardSummary } from './CombatRewardSummary';
import { useCombatStore, useFormationStore, useMapStore, useMetaStore, usePlayerStore } from '@/stores';
import {
  performCombatScreenTransition,
  readCombatTransitionRecovery,
  readCombatRunOrigin,
  abortSubAreaRun,
  hasActiveSubAreaRun,
  resetIdleElitePity,
  resolveCombatUnitDisplayName
} from '@/stores/combatHelpers';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { assertRecordedWavePlaybackAllowed, RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { useHydrationStore } from '@/stores/hydrationStore';
import { nextSubAreaInAct } from '@/stores/subAreaResolver';
import type { CombatLogEntry } from '@/stores/combatStore';
import { recordedPlaybackBatch } from '@/stores/combatStore';
import type { RecordedBattleEvent } from '@/engine/combat/combat';
import type { CombatUnit, GridPosition } from '@/engine/combat/types';
import { inferKind } from '@/engine/combat/types';
import { ASSASSIN_CHARGE_DEFINITION } from '@/engine/skills/assassin-charges';
import { ASSASSIN_TRAP_IDS } from '@/engine/skills/assassin-traps';
import { ASSASSIN_FLIGHT_STATUS_ID } from '@/engine/skills/assassin-flight';
import { endgameDefinition } from '@/data/loaders/endgame';
import { readEndgameRequest } from '@/features/endgame/navigation';
import { checkEndgameEntry } from '@/stores/endgameActions';

const MARTIAL_CHARGE_LABELS = new Map(ASSASSIN_CHARGE_DEFINITION.builders.map(id => {
  const slug = id.slice('assassin.'.length).replaceAll('_', '-');
  return ['charge-' + slug, 'skills:assassin.' + slug + '.name'] as const;
}));
const ASSASSIN_TRAP_LABELS = new Map(ASSASSIN_TRAP_IDS.map(id => {
  const slug = id.slice('assassin.'.length).replaceAll('_', '-');
  return ['trap-' + slug, 'skills:assassin.' + slug + '.name'] as const;
}));

const MAX_LOG = 200;
const SPEED_CYCLE = [1, 2, 4] as const;
type Speed = (typeof SPEED_CYCLE)[number];

interface UnitEventFx {
  readonly kind: 'damage' | 'heal' | 'dodge' | 'status' | 'buff' | 'summon' | 'death';
  readonly damageType?: string;
  readonly amount?: number;
  readonly statusId?: string;
  readonly buffId?: string;
}

function mapSubAreaNameKey(id: string): string {
  return `map.subArea.${id.replace(/^areas\/act([1-5])-/, 'a$1-')}`;
}

export function CombatScreen() {
  const { t } = useTranslation(['combat', 'common', 'map', 'endgame']);
  const navigate = useNavigate();
  const { search } = useLocation();
  const request = useMemo(() => readEndgameRequest(search), [search]);

  const player = usePlayerStore((s) => s.player);
  const hydrationStatus = useHydrationStore((s) => s.status);
  const playerTeam = useCombatStore((s) => s.playerTeam);
  const enemyTeam = useCombatStore((s) => s.enemyTeam);
  const inCombat = useCombatStore((s) => s.inCombat);
  const log = useCombatStore((s) => s.log);
  const currentWave = useCombatStore((s) => s.currentWave);
  const totalWaves = useCombatStore((s) => s.totalWaves);
  const wavePresentation = useCombatStore((s) => s.currentWavePresentation);
  const isPaused = useCombatStore((s) => s.isPaused);
  const autoMode = useCombatStore((s) => s.autoMode);
  const togglePause = useCombatStore((s) => s.togglePause);
  const toggleAutoMode = useCombatStore((s) => s.toggleAutoMode);
  const endCombat = useCombatStore((s) => s.endCombat);
  const idleTarget = useMetaStore((s) => s.idleState.idleTarget);
  const setIdleTarget = useMetaStore((s) => s.setIdleTarget);

  // Recorded-event playback selectors
  const recordedEvents = useCombatStore((s) => s.recordedEvents);
  const eventCursor = useCombatStore((s) => s.eventCursor);
  const playbackComplete = useCombatStore((s) => s.playbackComplete);
  const outcome = useCombatStore((s) => s.outcome);
  const tick = useCombatStore((s) => s.tick);

  // Sub-area run selectors (Bugs #5/#16/#21)
  const runVictory = useCombatStore((s) => s.runVictory);
  const runDefeat = useCombatStore((s) => s.runDefeat);
  const runRewards = useCombatStore((s) => s.runRewards);
  const subAreaRunId = useCombatStore((s) => s.subAreaRunId);

  const currentAct = useMapStore((s) => s.currentAct);
  const currentSubAreaId = useMapStore((s) => s.currentSubAreaId);
  const setLocation = useMapStore((s) => s.setCurrentLocation);

  const recentLog = useMemo(() => log.slice(-MAX_LOG), [log]);
  const [speed, setSpeed] = useState<Speed>(1);
  const [formationOpen, setFormationOpen] = useState(false);
  const [exitFailed, setExitFailed] = useState(false);
  const [transitionFailed, setTransitionFailed] = useState(() => readCombatTransitionRecovery().kind !== 'ready');
  const [transitionRetry, setTransitionRetry] = useState(0);
  const [entryRefused, setEntryRefused] = useState(false);
  const origin = readCombatRunOrigin();
  const dungeonModifier = origin?.kind === 'endgame' ? origin.modifierId
    : origin === null && request.kind === 'endgame' ? request.modifierId : null;
  const isDungeon = dungeonModifier !== null;
  const invalidRequest = origin === null && request.kind === 'invalid';
  const recovery = readCombatTransitionRecovery();
  const transitionBlocked = invalidRequest || entryRefused || transitionFailed || recovery.kind !== 'ready' || hydrationStatus !== 'ready';
  // Inter-wave countdown banner; null = no pending advance.
  const [nextWaveCountingDown, setNextWaveCountingDown] = useState(false);
  const isIdleLoop = !isDungeon && Boolean(idleTarget && currentSubAreaId && (idleTarget === currentSubAreaId || idleTarget === currentSubAreaId.replace(/^areas\/act([1-5])-/, 'a$1-')));

  // Explicit exits reset the store before deferred router navigation unmounts us.
  const exiting = useRef(false);

  // Auto-start a sub-area run if none is in flight.
  useEffect(() => {
    if (transitionBlocked || readCombatTransitionRecovery().kind !== 'ready') return;
    if (!exiting.current && !inCombat && player && !runVictory && !runDefeat) {
      if (dungeonModifier !== null) {
        try {
          if (checkEndgameEntry(dungeonModifier) !== 'ok') { setEntryRefused(true); return; }
          setTransitionFailed(!performCombatScreenTransition({ kind: 'endgame', modifierId: dungeonModifier }));
        } catch (error) {
          if (!(error instanceof WaveGuardError || error instanceof RecordedWaveAccessError)) throw error;
          setTransitionFailed(true);
        }
      } else {
        setTransitionFailed(!performCombatScreenTransition({ kind: 'start', options: { mode: isIdleLoop ? 'idle' : 'manual' } }));
      }
    }
  }, [inCombat, isIdleLoop, dungeonModifier, player, runVictory, runDefeat, transitionBlocked, transitionRetry]);

  // Schedule the same atomic timestamp group consumed by the store.
  useEffect(() => {
    if (transitionBlocked || !inCombat || isPaused || playbackComplete) return;
    const batch = recordedPlaybackBatch(recordedEvents, eventCursor, speed);
    if (!batch) return;
    const handle = setTimeout(() => {
      if (readCombatTransitionRecovery().kind !== 'ready') { setTransitionFailed(true); return; }
      try { tick(); }
      catch (error) {
        if (!(error instanceof WaveGuardError || error instanceof RecordedWaveAccessError)) throw error;
        setTransitionFailed(error.code !== 'hydrationNotReady');
      }
    }, batch.delayMs);
    return () => { clearTimeout(handle); };
  }, [inCombat, isPaused, playbackComplete, eventCursor, recordedEvents, tick, speed, transitionBlocked, transitionRetry]);

  // Wave completion → auto-advance to next wave (1.5s pause) OR finalize run.
  // The 1.5s pause is the recommended default per the spec; it gives the
  // player time to read the last log line before the next wave appears.
  useEffect(() => {
    if (transitionBlocked || !playbackComplete) {
      setNextWaveCountingDown(false);
      return;
    }
    // Run already finalized — nothing to do.
    if (runVictory || runDefeat) return;
    // No active sub-area run (synthetic battle); skip the wave loop.
    if (!hasActiveSubAreaRun()) return;

    setNextWaveCountingDown(true);
    const handle = setTimeout(() => {
      if (readCombatTransitionRecovery().kind !== 'ready') {
        setTransitionFailed(true); setNextWaveCountingDown(false); return;
      }
      try { setTransitionFailed(!performCombatScreenTransition({ kind: 'advance' })); }
      finally { setNextWaveCountingDown(false); }
    }, 1500);
    return () => { clearTimeout(handle); };
  }, [playbackComplete, runVictory, runDefeat, transitionBlocked, transitionRetry]);

  // Currently-acting unit id — derived by walking back from the cursor to
  // the most recent `action` event. With the timeline scheduler, turn-start
  // events fire every 5 sim-seconds and no longer bound a "round", so we
  // simply use the most recent action: the highlight follows the active
  // actor and naturally moves to the next when their action resolves.
  const actingActorId = useMemo(() => {
    for (let i = Math.min(eventCursor - 1, recordedEvents.length - 1); i >= 0; i--) {
      const ev = recordedEvents[i];
      if (!ev) continue;
      if (ev.kind === 'action') return ev.actor;
    }
    return null;
  }, [eventCursor, recordedEvents]);

  const unitFx = useMemo(
    () => buildUnitEventFx(recordedEvents, eventCursor),
    [recordedEvents, eventCursor]
  );

  const cycleSpeed = useCallback(() => {
    setSpeed((cur) => {
      const idx = SPEED_CYCLE.indexOf(cur);
      const nextIdx = (idx + 1) % SPEED_CYCLE.length;
      return SPEED_CYCLE[nextIdx] ?? 1;
    });
  }, []);

  const handleSkip = useCallback(() => {
    try {
      assertRecordedWavePlaybackAllowed();
      // Resume if paused so advanceEvent isn't a no-op, then drain.
      const store = useCombatStore.getState();
      if (store.isPaused) store.resumePlayback();
      let safety = 10_000;
      while (!useCombatStore.getState().playbackComplete && safety-- > 0) {
        useCombatStore.getState().advanceEvent();
      }
      setTransitionFailed(false);
    } catch (error) {
      if (!(error instanceof WaveGuardError || error instanceof RecordedWaveAccessError)) throw error;
      setTransitionFailed(error.code !== 'hydrationNotReady');
    }
  }, []);

  const handlePause = useCallback(() => {
    try { togglePause(); setTransitionFailed(false); }
    catch (error) {
      if (!(error instanceof WaveGuardError || error instanceof RecordedWaveAccessError)) throw error;
      setTransitionFailed(error.code !== 'hydrationNotReady');
    }
  }, [togglePause]);

  // Mid-run flee: a sub-area run is in flight → bail to the world map (#21).
  // Synthetic / no-run battles fall through to the town hub as before.
  const handleFlee = () => {
    const wasInRun = hasActiveSubAreaRun() || subAreaRunId !== null;
    try {
      abortSubAreaRun();
    } catch (error) {
      if (!(error instanceof WaveGuardError)) throw error;
      setExitFailed(true);
      return;
    }
    exiting.current = true;
    if (wasInRun && !isDungeon) {
      setIdleTarget(undefined);
      resetIdleElitePity();
    }
    endCombat();
    navigate(wasInRun ? '/map' : '/town');
  };

  // Compute next sub-area for the post-victory CTA.
  const nextSubArea = useMemo(
    () => isDungeon ? null : nextSubAreaInAct(currentAct, subAreaRunId),
    [isDungeon, currentAct, subAreaRunId]
  );

  const handleContinueToNext = () => {
    if (transitionBlocked || readCombatTransitionRecovery().kind !== 'ready' || !nextSubArea) return;
    setLocation(currentAct, nextSubArea.id);
    endCombat(); // will trigger auto-start in the mount effect
  };

  const handleReturn = (destination: '/map' | '/town') => {
    if (transitionBlocked || readCombatTransitionRecovery().kind !== 'ready') return;
    try {
      abortSubAreaRun();
    } catch (error) {
      if (!(error instanceof WaveGuardError)) throw error;
      setExitFailed(true);
      return;
    }
    exiting.current = true;
    if (!isDungeon) { setIdleTarget(undefined); resetIdleElitePity(); }
    endCombat();
    navigate(destination);
  };

  useEffect(() => {
    if (transitionBlocked || !isIdleLoop || readCombatTransitionRecovery().kind !== 'ready') return;
    if (runDefeat) {
      setIdleTarget(undefined);
      resetIdleElitePity();
      return;
    }
    if (!runVictory) return;
    const handle = setTimeout(() => {
      if (readCombatTransitionRecovery().kind !== 'ready') return;
      endCombat();
    }, 1500);
    return () => { clearTimeout(handle); };
  }, [endCombat, isIdleLoop, runDefeat, runVictory, setIdleTarget, transitionBlocked]);

  const handleStopIdle = () => {
    try {
      abortSubAreaRun();
    } catch (error) {
      if (!(error instanceof WaveGuardError)) throw error;
      setExitFailed(true);
      return;
    }
    exiting.current = true;
    setIdleTarget(undefined);
    resetIdleElitePity();
    endCombat();
    navigate('/map');
  };

  // Bug #4 — combat-log hover-pause hint is hoisted to the combat header
  // (top-right). The CombatLog reports pause via this setter so the badge
  // can render compactly next to the action buttons.
  const [logHoverPaused, setLogHoverPaused] = useState(false);

  if (invalidRequest || entryRefused) return <ScreenShell testId="combat-screen" title={tDataKey(t, endgameDefinition.nameKey)}>
    <Panel>
      <p role="alert" data-testid="endgame-entry-refusal" className="mb-3 text-d2-gold">
        {t(invalidRequest ? 'endgame:combat.invalid' : 'endgame:combat.refused')}
      </p>
      <Button type="button" className="min-h-11" onClick={() => { navigate('/map'); }}>{t('returnToMap')}</Button>
    </Panel>
  </ScreenShell>;

  return (
    <ScreenShell
      testId="combat-screen"
      title={
        <div className="flex w-full flex-col items-stretch gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col leading-tight min-w-0">
            <span aria-live="polite" data-testid="wave-counter" className="truncate">
              {t('wave', {
                current: currentWave || 1,
                total: totalWaves || 1,
              })}
              {isIdleLoop && (
                <>
                  {' · '}
                  <span className="text-d2-set" data-testid="idle-loop-label">{t('idleLoop.label')}</span>
                </>
              )}
              {(isDungeon || currentSubAreaId) && (
                <>
                  {' · '}
                  <span data-testid="combat-sub-area-name" className="text-d2-gold">
                    {isDungeon ? tDataKey(t, endgameDefinition.nameKey) : tDataKey(t, mapSubAreaNameKey(currentSubAreaId ?? ''))}
                  </span>
                </>
              )}
              {wavePresentation && (
                <>
                  {' · '}
                  <span
                    className={
                      wavePresentation.isActBoss
                        ? 'text-orange-300'
                        : wavePresentation.kind === 'elite'
                          ? 'text-d2-set'
                          : 'text-d2-white/70'
                    }
                    data-testid="wave-kind-label"
                  >
                    {t(`waveKind.${wavePresentation.isActBoss ? 'boss' : wavePresentation.kind}`)}
                  </span>
                </>
              )}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-d2-white/60" data-testid="combat-act-name">
              {isDungeon ? <>{t(`endgame:modifiers.${dungeonModifier}.name`)} · {t('endgame:combat.manual', { level: endgameDefinition.monsterLevel })}</>
                : <>{t('map:act', { number: currentAct, defaultValue: `Act ${String(currentAct)}` })} · {tDataKey(t, `map.actName.${String(currentAct)}`)}</>}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            {logHoverPaused && (
              <span
                className="text-[10px] uppercase tracking-wide text-d2-gold/90 border border-d2-gold/50 rounded px-2 py-0.5 bg-black/30"
                data-testid="log-hover-paused-hint"
                aria-live="polite"
              >
                {t('logHoverPausedHint')}
              </span>
            )}
            <Button
              variant="secondary"
              className="min-h-11 min-w-11 px-3 text-sm"
              onClick={() => { setFormationOpen(true); }}
              data-testid="formation-editor-open"
            >
              {t('formation.edit')}
            </Button>
            <Button
              variant="secondary"
              className="min-h-11 min-w-11 px-3 text-sm"
              onClick={handlePause}
              aria-pressed={isPaused}
              disabled={playbackComplete}
            >
              {isPaused ? t('resume') : t('pause')}
            </Button>
            <Button
              variant="secondary"
              className="min-h-11 min-w-11 px-2 text-sm tabular-nums"
              onClick={cycleSpeed}
              aria-label={t('speed')}
              title={t('speed')}
              disabled={playbackComplete}
            >
              {t('speedX', { x: speed })}
            </Button>
            <Button
              variant="secondary"
              className="min-h-11 min-w-11 px-3 text-sm"
              onClick={handleSkip}
              disabled={playbackComplete}
              data-testid="skip-button"
            >
              {t('skip')}
            </Button>
            <label className="flex min-h-11 min-w-11 cursor-pointer items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={autoMode}
                onChange={toggleAutoMode}
                className="w-4 h-4 accent-d2-gold"
              />
              {t('autoMode')}
            </label>
            <Button
              variant="danger"
              className="min-h-11 min-w-11 px-3 text-sm"
              onClick={isIdleLoop ? handleStopIdle : handleFlee}
            >
              {isIdleLoop ? t('idleLoop.stop') : t('flee')}
            </Button>
          </div>
        </div>
      }
    >
      {(exitFailed || transitionBlocked) && (
        <div role="alert" className="mx-auto mt-3 flex max-w-6xl flex-wrap items-center gap-3 px-4 text-red-400">
          <p>{t('common:error')}</p>
          {transitionBlocked && <Button className="min-h-11 min-w-11" disabled={hydrationStatus !== 'ready' || recovery.kind === 'parked'}
            onClick={() => {
              setTransitionFailed(!performCombatScreenTransition({ kind: 'retry', recovery }));
              setTransitionRetry(value => value + 1);
            }}>
            {t('common:retry')}
          </Button>}
        </div>
      )}
      <Battlefield
        allies={orderAlliesWithSummons(playerTeam)}
        enemies={enemyTeam}
        actingActorId={actingActorId}
        unitFx={unitFx}
        currentWave={currentWave}
        totalWaves={totalWaves}
      />

      <div className="max-w-6xl mx-auto mt-3">
        {isIdleLoop && (
          <Panel className="mb-3 !p-3" data-testid="idle-loop-panel">
            <div className="flex flex-wrap items-center gap-2 text-xs text-d2-white/80">
              <span className="rounded border border-d2-set/60 px-2 py-1 text-d2-set">
                {t('idleLoop.running')}
              </span>
              <span>{t('idleLoop.realBattles')}</span>
            </div>
          </Panel>
        )}
        <CombatLog entries={recentLog} onHoverPausedChange={setLogHoverPaused} />
      </div>
      {nextWaveCountingDown && !runVictory && !runDefeat && (
        <div
          className="max-w-5xl mx-auto mt-3 text-center text-d2-gold text-sm"
          data-testid="next-wave-banner"
          aria-live="polite"
        >
          {t('nextWaveIn')}
        </div>
      )}
      {(runVictory || runDefeat) && (
        <div className="max-w-5xl mx-auto mt-3" data-testid={runVictory ? 'victory-panel' : 'defeat-panel'}>
          <Panel
            title={runVictory
              ? t('runVictoryTitle')
              : t(outcome?.winner === null ? 'event.draw' : 'runDefeatTitle')}
          >
            {runVictory && <CombatRewardSummary rewards={runRewards} />}
            <div className="flex flex-wrap gap-2 mt-2">
              {dungeonModifier !== null && <Button type="button" className="min-h-11 max-w-full whitespace-normal" disabled={transitionBlocked}
                data-testid="endgame-new-attempt" onClick={() => {
                  if (transitionBlocked || readCombatTransitionRecovery().kind !== 'ready') return;
                  // Clear terminal playback; the captured origin still chooses the fresh admission.
                  endCombat();
                }}>{t('endgame:combat.newAttempt')}</Button>}
              {runVictory && nextSubArea && (
                <Button
                  variant="primary"
                  className="min-h-11 text-sm"
                  onClick={handleContinueToNext}
                  disabled={transitionBlocked}
                  data-testid="continue-next-subarea"
                >
                  {t('continueToNextSubArea')}
                </Button>
              )}
              {runVictory && isIdleLoop && (
                <Button
                  variant="primary"
                  className="min-h-11 text-sm"
                  onClick={() => {
                    if (readCombatTransitionRecovery().kind === 'ready') endCombat();
                  }}
                  disabled={transitionBlocked}
                  data-testid="idle-loop-next-run"
                >
                  {t('idleLoop.continue')}
                </Button>
              )}
              <Button
                variant="secondary"
                className="min-h-11 text-sm"
                  onClick={() => { handleReturn('/map'); }}
                disabled={transitionBlocked}
                data-testid="return-to-map"
              >
                {t('returnToMap')}
              </Button>
              <Button
                variant="secondary"
                className="min-h-11 text-sm"
                  onClick={() => { handleReturn('/town'); }}
                disabled={transitionBlocked}
                data-testid="return-to-town"
              >
                {t('returnToTown')}
              </Button>
            </div>
          </Panel>
        </div>
      )}
      <FormationEditorModal isOpen={formationOpen} onClose={() => { setFormationOpen(false); }} />
    </ScreenShell>
  );
}

function Battlefield({
  allies,
  enemies,
  actingActorId,
  unitFx,
  currentWave,
  totalWaves
}: {
  readonly allies: readonly CombatUnit[];
  readonly enemies: readonly CombatUnit[];
  readonly actingActorId: string | null;
  readonly unitFx: ReadonlyMap<string, UnitEventFx>;
  readonly currentWave: number;
  readonly totalWaves: number;
}) {
  const { t } = useTranslation('combat');
  const hero = allies.find(unit => unit.side === 'player' && inferKind(unit) === 'hero');
  return (
    <Panel title={t('battlefield.title')} className="max-w-6xl mx-auto">
      {hero && hero.stats.manaMax > 0 && (
        <div role="group" aria-label={t('mp')} className="mb-3">
          <StatBar current={hero.mana} max={hero.stats.manaMax} label={t('mp')} color="mp" />
        </div>
      )}
      <div
        className="grid grid-cols-1 items-center gap-2 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
        data-testid="combat-battlefield"
      >
        <BattleSideGrid
          title={t('allies')}
          empty={t('noAllies')}
          units={allies}
          side="player"
          actingActorId={actingActorId}
          unitFx={unitFx}
        />
        <div className="flex h-12 items-center justify-center gap-3 text-center lg:h-auto lg:min-h-[18rem] lg:flex-col">
          <div className="flex items-center gap-2 rounded-full border border-d2-gold/50 bg-black/50 px-3 py-1 shadow-lg shadow-d2-gold/10 lg:block lg:py-2">
            <div className="text-[10px] uppercase tracking-[0.2em] text-d2-white/50">{t('battlefield.wave')}</div>
            <div className="font-serif text-lg text-d2-gold lg:text-xl">{currentWave}/{totalWaves}</div>
          </div>
          <div className="hidden h-24 w-px bg-gradient-to-b from-transparent via-d2-gold/60 to-transparent lg:block" aria-hidden />
          <div className="rounded border border-red-400/40 bg-red-950/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-red-200">
            {t('battlefield.clash')}
          </div>
        </div>
        <BattleSideGrid
          title={t('enemies')}
          empty={t('noEnemies')}
          units={enemies}
          side="enemy"
          actingActorId={actingActorId}
          unitFx={unitFx}
        />
      </div>
    </Panel>
  );
}

function BattleSideGrid({
  title,
  empty,
  units,
  side,
  actingActorId,
  unitFx
}: {
  readonly title: string;
  readonly empty: string;
  readonly units: readonly CombatUnit[];
  readonly side: 'player' | 'enemy';
  readonly actingActorId: string | null;
  readonly unitFx: ReadonlyMap<string, UnitEventFx>;
}) {
  const maxRow = Math.max(
    2,
    ...units.map((unit) => unit.gridPosition?.row ?? 0)
  );
  const cells = Array.from({ length: (maxRow + 1) * 3 }, (_, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    return { row, col };
  });
  return (
    <section aria-label={title} className="min-w-0">
      <div className="mb-2 text-center text-xs uppercase tracking-[0.18em] text-d2-white/60">{title}</div>
      <div
        className="grid grid-cols-3 gap-1.5 sm:gap-2"
        data-testid={side === 'player' ? 'allies-grid' : 'enemies-grid'}
      >
        {cells.map((cell) => {
          const cellUnits = units.filter((candidate) => sameGridPosition(candidate.gridPosition, cell));
          const unit = cellUnits[0];
          return (
            <div
              key={`${String(cell.row)}-${String(cell.col)}`}
              className="min-h-28 rounded-lg border border-d2-border/60 bg-black/25 p-1 lg:min-h-[10.5rem]"
              data-testid={`${side}-grid-cell-${String(cell.row)}-${String(cell.col)}`}
            >
              {unit ? (
                <UnitCard
                  unit={unit}
                  size="sm"
                  compact
                  acting={unit.id === actingActorId}
                  eventFx={unitFx.get(unit.id)}
                  stackCount={cellUnits.length}
                />
              ) : (
                <div className="flex h-full min-h-0 items-center justify-center rounded border border-dashed border-d2-border/40 text-[10px] text-d2-white/25 lg:min-h-[9.5rem]">
                  {empty}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UnitCard({
  unit,
  size,
  compact = false,
  acting = false,
  eventFx,
  stackCount = 1,
}: {
  unit: CombatUnit;
  size: 'sm' | 'md';
  compact?: boolean;
  acting?: boolean;
  eventFx?: UnitEventFx | undefined;
  stackCount?: number;
}) {
  const { t } = useTranslation('combat');
  const player = usePlayerStore((s) => s.player);
  const kind = inferKind(unit);
  const isSummon = kind === 'summon';
  const isPlayerSide = unit.side === 'player';
  const displayName = resolveCombatUnitDisplayName(unit);

  const isDead = unit.life <= 0;
  const variant: 'character' | 'monster' = isPlayerSide ? 'character' : 'monster';
  const isMerc = kind === 'merc';

  // Derive avatar:
  //  - hero (player-side, non-summon, non-merc) → class portrait
  //  - merc (player-side)                       → merc portraitAsset by id
  //  - summon (player-side)                     → summon portrait helper
  //  - enemy                                    → monster image
  let avatarSrc: string | undefined;
  if (isSummon) {
    avatarSrc = getSummonImageUrl(unit.summonTemplateId ?? extractMonsterSlug(unit.name, unit.id));
  } else if (isMerc) {
    // Combat unit id is `merc-<mercDefId>`; strip prefix to recover def id.
    const mercDefId = unit.id.startsWith('merc-') ? unit.id.slice('merc-'.length) : unit.id;
    avatarSrc = getMercPortraitUrl(mercDefId) ?? undefined;
  } else if (isPlayerSide && player) {
    avatarSrc = getClassPortraitUrl(player.class);
  } else {
    avatarSrc = getMonsterImageUrl(extractMonsterSlug(unit.name, unit.id, true)) ?? undefined;
  }

  const rarity = isPlayerSide
    ? isSummon
      ? 'magic'
      : isMerc
      ? 'rare'
      : 'unique'
    : unit.tier === 'champion'
      ? 'champion'
      : unit.tier === 'rare-elite'
        ? 'rareElite'
        : unit.tier === 'boss' || unit.tier === 'chapter-boss'
          ? 'boss'
          : 'common';

  const bars: { kind: 'hp' | 'mp'; current: number; max: number }[] = [
    { kind: 'hp', current: unit.life, max: Math.max(1, unit.stats.lifeMax) },
  ];
  if (size === 'md' && unit.stats.manaMax > 0) {
    bars.push({ kind: 'mp', current: unit.mana, max: Math.max(1, unit.stats.manaMax) });
  }

  const tierKey = unit.tier === 'rare-elite' ? 'rare-elite' : unit.tier;
  const tierLabel = !isPlayerSide && (unit.tier === 'champion' || unit.tier === 'rare-elite')
    ? ` · ${t(`tier.${tierKey}`)}`
    : '';
  const subtitle = isSummon
    ? t('summon')
    : `Lv ${String(unit.level)}${tierLabel}`;

  const wrapperCls = isDead ? 'opacity-50 grayscale' : '';
  const ringCls = [
    acting && !isDead ? 'ring-2 ring-d2-gold motion-safe:animate-pulse' : '',
    eventFx && !isDead ? eventFxRingClass(eventFx) : ''
  ].filter(Boolean).join(' ');
  const sideTestId = isPlayerSide ? 'combat-ally-card' : 'combat-enemy-card';
  const chips = [
    ...unit.activeBuffIds.map((id) => ({ id, label: t(`effect.buff.${id}`, { defaultValue: humanizeEffectId(id) }), kind: 'buff' as const })),
    ...unit.statuses.map((status) => {
      const chargeName = MARTIAL_CHARGE_LABELS.get(status.id);
      const trapName = ASSASSIN_TRAP_LABELS.get(status.id);
      const flight = status.id === ASSASSIN_FLIGHT_STATUS_ID;
      return {
        id: status.id,
        label: chargeName !== undefined ? t('effect.martialCharge', {
          skill: t(chargeName), stacks: status.stacks, maxStacks: ASSASSIN_CHARGE_DEFINITION.maxStacks,
          seconds: Math.max(0, Math.ceil(status.remaining))
        }) : trapName !== undefined ? t('effect.assassinTrap', {
          skill: t(trapName), seconds: Math.max(0, Math.ceil(status.remaining))
        }) : flight ? t('effect.assassinFlight', {
          skill: t('skills:assassin.dragon-flight.name'), seconds: Math.max(0, Math.ceil(status.remaining))
        }) : status.id === 'bone-wall' && status.boneWall
          ? t('effect.boneWallCapacity', { amount: status.boneWall.remaining })
          : t(`effect.status.${status.id}`, { defaultValue: humanizeEffectId(status.id),
            amount: status.boneArmor?.remaining ?? 0 }),
        stacks: chargeName !== undefined || trapName !== undefined || flight ? 1 : status.stacks,
        kind: chargeName !== undefined || trapName !== undefined || flight || status.id === 'battle-command' || status.id === 'grim-ward' || status.id === 'oak-sage' || status.id === 'heart-of-wolverine' || status.id === 'spirit-of-barbs' ||
          ((status.id === 'werewolf' || status.id === 'werebear') && unit.druidForm?.form === status.id) ||
          (status.id === 'burst-of-speed' && status.statBuff !== undefined) ||
          (status.id === 'feral-rage' && status.feralRage === true) ||
          (status.id === 'frenzy' && status.frenzy === true) ||
          (status.id === 'concentrate' && status.concentrate !== undefined) ||
          ((status.id === 'teleport' || status.id === 'enchant') && status.sorceressBuff !== undefined) ||
          (['blaze', 'fire-wall', 'thunder-storm', 'inferno'].includes(status.id) && status.periodicSpell !== undefined) ||
          (status.id === 'bone-armor' && status.boneArmor !== undefined) ||
          (status.id === 'bone-wall' && status.boneWall !== undefined) ? 'buff' as const
          : status.dotPerStack !== undefined || status.id.includes('poison') || status.id.includes('ignite') || status.id.includes('plague') ? 'dot' as const : 'debuff' as const
      };
    })
  ];

  return (
    <div
      className={`${wrapperCls} ${ringCls} relative flex h-full min-w-0 w-full flex-col rounded-md transition-opacity motion-reduce:transition-none`}
      role="group"
      aria-label={displayName}
      data-acting={acting || undefined}
      data-dead={isDead || undefined}
      data-kind={kind}
      data-testid={`unit-card-${unit.id}`}
      data-side-testid={sideTestId}
    >
      <span className="sr-only" data-testid={sideTestId} />
      {isSummon && <span className="sr-only" data-testid="summon-badge" />}
      {compact ? (
        <div
          className={[
            'relative flex min-h-[4.5rem] w-full flex-1 flex-col overflow-hidden rounded border bg-d2-panel text-d2-white',
            rarity === 'boss'
              ? 'border-d2-boss'
              : rarity === 'rareElite'
                ? 'border-d2-runeword'
                : rarity === 'champion'
                  ? 'border-d2-unique'
                  : isPlayerSide
                    ? 'border-d2-gold/60'
                    : 'border-d2-border'
          ].join(' ')}
          title={displayName}
        >
          <div className="h-16 shrink-0 overflow-hidden bg-black/30 lg:h-auto lg:min-h-0 lg:flex-1">
            <GameImage
              src={avatarSrc ?? null}
              alt={displayName}
              fallbackIcon={displayName.slice(0, 2)}
              size="fill"
              className="rounded-none border-0 bg-none"
              imageClassName={[
                'h-full w-full',
                isSummon
                  ? 'object-cover object-top'
                  : isPlayerSide
                    ? 'object-contain p-2'
                    : 'object-cover object-top'
              ].join(' ')}
            />
          </div>
          <div className="space-y-0.5 bg-black/70 px-1 py-0.5">
            <div className="break-words text-sm leading-5 text-d2-white/80 [overflow-wrap:anywhere] lg:truncate lg:text-[10px] lg:leading-tight">{displayName}</div>
            <div
              className="h-1.5 rounded bg-black/60 lg:h-1"
              role="progressbar"
              aria-label={t('hp')}
              aria-valuemin={0}
              aria-valuemax={Math.max(1, unit.stats.lifeMax)}
              aria-valuenow={Math.max(0, Math.min(unit.life, Math.max(1, unit.stats.lifeMax)))}
            >
              <div
                className="h-full rounded bg-red-600"
                style={{ width: `${Math.max(0, Math.min(100, (unit.life / Math.max(1, unit.stats.lifeMax)) * 100)).toFixed(2)}%` }}
              />
            </div>
            {isSummon && unit.stats.manaMax > 0 ? (
              <div>
                <div className="text-[10px] leading-tight text-d2-white/80">
                  {t('mp')} {Math.max(0, Math.min(unit.mana, unit.stats.manaMax))} / {unit.stats.manaMax}
                </div>
                <div
                  className="h-1.5 rounded bg-black/60 lg:h-1"
                  role="progressbar"
                  aria-label={t('mp')}
                  aria-valuemin={0}
                  aria-valuemax={unit.stats.manaMax}
                  aria-valuenow={Math.max(0, Math.min(unit.mana, unit.stats.manaMax))}
                >
                  <div className="h-full rounded bg-blue-600"
                    style={{ width: `${Math.max(0, Math.min(100, (unit.mana / unit.stats.manaMax) * 100)).toFixed(2)}%` }} />
                </div>
              </div>
            ) : null}
          </div>
          {stackCount > 1 ? (
            <div className="absolute left-1 top-1 rounded-full border border-d2-gold/60 bg-black/80 px-1.5 text-[10px] font-bold text-d2-gold">
              +{stackCount - 1}
            </div>
          ) : null}
        </div>
      ) : (
        <GameCard
          variant={variant}
          size={size}
          name={displayName}
          subtitle={subtitle}
          rarity={rarity}
          image={avatarSrc}
          bars={bars}
          stats={size === 'md' ? [{ label: 'LV', value: unit.level }] : undefined}
        />
      )}
      {eventFx ? (
        <div
          className={[
            'pointer-events-none absolute right-1 top-1 max-w-[calc(100%-0.5rem)] break-words rounded border px-2 py-0.5 text-[10px] font-bold shadow-lg',
            'motion-safe:animate-pulse motion-reduce:animate-none',
            eventFxBadgeClass(eventFx)
          ].join(' ')}
          aria-live="polite"
          data-testid="combat-event-fx"
        >
          {eventFxLabel(eventFx, t)}
        </div>
      ) : null}
      {chips.length > 0 ? (
        <div
          className="mt-1 flex w-full min-w-0 flex-wrap gap-1"
          aria-label={t('effect.activeEffects')}
          data-testid="unit-effect-chips"
        >
          {chips.map((chip, index) => (
            <span
              key={`${chip.kind}-${chip.id}-${String(index)}`}
              className={[
                'min-w-0 max-w-full break-words rounded border px-1.5 py-0.5 text-[10px] leading-none [overflow-wrap:anywhere]',
                chip.kind === 'buff'
                  ? 'border-blue-300/50 bg-blue-500/15 text-blue-200'
                  : chip.kind === 'dot'
                    ? 'border-emerald-300/50 bg-emerald-500/15 text-emerald-200'
                    : 'border-purple-300/50 bg-purple-500/15 text-purple-200'
              ].join(' ')}
              title={chip.label}
            >
              {chip.label}{'stacks' in chip && chip.stacks > 1 ? ` ×${String(chip.stacks)}` : ''}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type FormationRole = 'player' | 'merc' | `summon-${number}`;

function FormationEditorModal({ isOpen, onClose }: { readonly isOpen: boolean; readonly onClose: () => void }) {
  const { t } = useTranslation('combat');
  const playerPosition = useFormationStore((s) => s.playerPosition);
  const mercPosition = useFormationStore((s) => s.mercPosition);
  const summonPositions = useFormationStore((s) => s.summonPositions);
  const setPlayerPosition = useFormationStore((s) => s.setPlayerPosition);
  const setMercPosition = useFormationStore((s) => s.setMercPosition);
  const setSummonPosition = useFormationStore((s) => s.setSummonPosition);
  const resetFormation = useFormationStore((s) => s.reset);
  const [selected, setSelected] = useState<FormationRole>('player');

  const roles: readonly FormationRole[] = ['player', 'merc', 'summon-0', 'summon-1', 'summon-2'];
  const selectedPosition = selected === 'player'
    ? playerPosition
    : selected === 'merc'
      ? mercPosition
      : summonPositions[Number(selected.split('-')[1] ?? 0)] ?? summonPositions[0];

  const assign = (position: GridPosition): void => {
    if (selected === 'player') {
      setPlayerPosition(position);
    } else if (selected === 'merc') {
      setMercPosition(position);
    } else {
      setSummonPosition(Number(selected.split('-')[1] ?? 0), position);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('formation.title')} className="max-w-lg">
      <div className="space-y-4">
        <p className="text-sm text-d2-white/70">{t('formation.help')}</p>
        <div className="flex flex-wrap gap-2" role="listbox" aria-label={t('formation.unitSelect')}>
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => { setSelected(role); }}
              className={[
                'min-h-[44px] rounded border px-3 py-2 text-sm',
                selected === role
                  ? 'border-d2-gold bg-d2-gold/20 text-d2-gold'
                  : 'border-d2-border bg-black/30 text-d2-white/80'
              ].join(' ')}
              aria-selected={selected === role}
              role="option"
            >
              {formationRoleLabel(role, t)}
            </button>
          ))}
        </div>
        <div
          className="grid grid-cols-3 gap-2"
          role="grid"
          aria-label={t('formation.grid')}
          data-testid="formation-editor-grid"
        >
          {Array.from({ length: 9 }, (_, index) => {
            const position = { row: Math.floor(index / 3), col: index % 3 };
            const occupant = occupantForFormationCell(position, playerPosition, mercPosition, summonPositions, t);
            const active = sameGridPosition(selectedPosition, position);
            return (
              <button
                key={`${String(position.row)}-${String(position.col)}`}
                type="button"
                className={[
                  'min-h-[64px] rounded-lg border p-2 text-center text-xs transition-colors',
                  active
                    ? 'border-d2-gold bg-d2-gold/20 text-d2-gold'
                    : 'border-d2-border bg-black/40 text-d2-white/70 hover:border-d2-gold/60'
                ].join(' ')}
                onClick={() => { assign(position); }}
                role="gridcell"
                data-testid={`formation-cell-${String(position.row)}-${String(position.col)}`}
              >
                <div className="text-[10px] uppercase tracking-wide text-d2-white/40">
                  {t('formation.cell', { row: position.row + 1, col: position.col + 1 })}
                </div>
                <div className="mt-1 min-h-[1rem] font-semibold">{occupant}</div>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={resetFormation}>{t('formation.reset')}</Button>
          <Button variant="primary" onClick={onClose}>{t('formation.done')}</Button>
        </div>
      </div>
    </Modal>
  );
}

function sameGridPosition(a: GridPosition | undefined, b: GridPosition | undefined): boolean {
  return a !== undefined && b !== undefined && a.row === b.row && a.col === b.col;
}

function formationRoleLabel(role: FormationRole, t: ReturnType<typeof useTranslation>['t']): string {
  if (role === 'player') return t('formation.role.player');
  if (role === 'merc') return t('formation.role.merc');
  const index = Number(role.split('-')[1] ?? 0) + 1;
  return t('formation.role.summon', { index });
}

function occupantForFormationCell(
  position: GridPosition,
  playerPosition: GridPosition,
  mercPosition: GridPosition,
  summonPositions: readonly GridPosition[],
  t: ReturnType<typeof useTranslation>['t']
): string {
  if (sameGridPosition(position, playerPosition)) return t('formation.role.player');
  if (sameGridPosition(position, mercPosition)) return t('formation.role.merc');
  const summonIndex = summonPositions.findIndex((summonPosition) => sameGridPosition(position, summonPosition));
  if (summonIndex >= 0) return t('formation.role.summon', { index: summonIndex + 1 });
  return t('formation.empty');
}

function buildUnitEventFx(events: readonly RecordedBattleEvent[], cursor: number): ReadonlyMap<string, UnitEventFx> {
  const fx = new Map<string, UnitEventFx>();
  let start = cursor, remaining = 4;
  while (start > 0 && remaining > 0) {
    start--;
    if (events[start]?.kind !== 'status-state') remaining--;
  }
  for (let i = start; i < cursor; i++) {
    const ev = events[i];
    if (!ev) continue;
    switch (ev.kind) {
      case 'damage':
        fx.set(ev.target, ev.dodged
          ? { kind: 'dodge', damageType: ev.damageType }
          : { kind: 'damage', damageType: ev.damageType, amount: ev.amount });
        break;
      case 'dot':
        fx.set(ev.target, { kind: 'damage', damageType: 'poison', amount: ev.amount });
        break;
      case 'heal':
        fx.set(ev.target, { kind: 'heal', amount: ev.amount });
        break;
      case 'status':
        fx.set(ev.target, { kind: 'status', statusId: ev.statusId });
        break;
      case 'buff':
        fx.set(ev.target, { kind: 'buff', buffId: ev.buffId });
        break;
      case 'summon':
        fx.set(ev.owner, { kind: 'summon' });
        fx.set(ev.unit.id, { kind: 'summon' });
        break;
      case 'death':
        fx.set(ev.target, { kind: 'death' });
        break;
      default:
        break;
    }
  }
  return fx;
}

function eventFxRingClass(fx: UnitEventFx): string {
  switch (fx.kind) {
    case 'damage':
    case 'dodge':
      return damageTypeRingClass(fx.damageType);
    case 'heal':
      return 'ring-2 ring-green-300/70';
    case 'buff':
    case 'summon':
      return 'ring-2 ring-blue-300/70';
    case 'status':
      return 'ring-2 ring-purple-300/70';
    case 'death':
      return 'ring-2 ring-red-500/80';
  }
}

function eventFxBadgeClass(fx: UnitEventFx): string {
  switch (fx.kind) {
    case 'damage':
    case 'dodge':
      return damageTypeBadgeClass(fx.damageType);
    case 'heal':
      return 'border-green-300/70 bg-green-500/25 text-green-100';
    case 'buff':
    case 'summon':
      return 'border-blue-300/70 bg-blue-500/25 text-blue-100';
    case 'status':
      return 'border-purple-300/70 bg-purple-500/25 text-purple-100';
    case 'death':
      return 'border-red-400/70 bg-red-700/40 text-red-100';
  }
}

function damageTypeRingClass(type: string | undefined): string {
  switch (type) {
    case 'fire': return 'ring-2 ring-orange-400/80 shadow-[0_0_18px_rgba(251,146,60,0.35)]';
    case 'cold': return 'ring-2 ring-cyan-300/80 shadow-[0_0_18px_rgba(103,232,249,0.35)]';
    case 'lightning': return 'ring-2 ring-yellow-300/80 shadow-[0_0_18px_rgba(253,224,71,0.35)]';
    case 'arcane': return 'ring-2 ring-violet-300/80 shadow-[0_0_18px_rgba(196,181,253,0.35)]';
    case 'poison': return 'ring-2 ring-emerald-300/80 shadow-[0_0_18px_rgba(110,231,183,0.35)]';
    case 'thorns': return 'ring-2 ring-lime-300/80 shadow-[0_0_18px_rgba(190,242,100,0.35)]';
    case 'physical':
    default: return 'ring-2 ring-red-300/80 shadow-[0_0_18px_rgba(252,165,165,0.3)]';
  }
}

function damageTypeBadgeClass(type: string | undefined): string {
  switch (type) {
    case 'fire': return 'border-orange-300/70 bg-orange-600/35 text-orange-100';
    case 'cold': return 'border-cyan-200/70 bg-cyan-600/30 text-cyan-50';
    case 'lightning': return 'border-yellow-200/70 bg-yellow-500/25 text-yellow-50';
    case 'arcane': return 'border-violet-200/70 bg-violet-600/35 text-violet-50';
    case 'poison': return 'border-emerald-200/70 bg-emerald-600/35 text-emerald-50';
    case 'thorns': return 'border-lime-200/70 bg-lime-600/30 text-lime-50';
    case 'physical':
    default: return 'border-red-200/70 bg-red-700/35 text-red-50';
  }
}

function eventFxLabel(fx: UnitEventFx, t: ReturnType<typeof useTranslation>['t']): string {
  switch (fx.kind) {
    case 'damage':
      return fx.amount !== undefined ? `-${String(fx.amount)}` : t('effect.hit');
    case 'heal':
      return fx.amount !== undefined ? `+${String(fx.amount)}` : t('effect.heal');
    case 'dodge':
      return t('effect.dodge');
    case 'status':
      return fx.statusId ? t(`effect.status.${fx.statusId}`, { defaultValue: humanizeEffectId(fx.statusId) }) : t('effect.statusApplied');
    case 'buff':
      return fx.buffId ? t(`effect.buff.${fx.buffId}`, { defaultValue: humanizeEffectId(fx.buffId) }) : t('effect.buffApplied');
    case 'summon':
      return t('effect.summon');
    case 'death':
      return t('effect.death');
  }
}

function humanizeEffectId(id: string): string {
  return id.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Combat log: virtualized-ish (DOM only renders last MAX_LOG via slice in parent),
 *  auto-scrolls to bottom unless the user is hovering or has scrolled away.
 *  Bug #4: pause hint is now reported up to the combat header. */
function CombatLog({
  entries,
  onHoverPausedChange,
}: {
  entries: CombatLogEntry[];
  onHoverPausedChange?: (paused: boolean) => void;
}) {
  const { t } = useTranslation('combat');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    if (paused || !pinned) return;
    const el = logContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length, paused, pinned]);

  useEffect(() => {
    onHoverPausedChange?.(paused);
  }, [paused, onHoverPausedChange]);

  const onScroll = () => {
    const el = logContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    setPinned(atBottom);
  };

  return (
    <Panel
      title={t('log')}
      className="flex flex-col"
    >
      <div
        ref={logContainerRef}
        onScroll={onScroll}
        onMouseEnter={() => { setPaused(true); }}
        onMouseLeave={() => { setPaused(false); }}
        className="max-h-[40vh] md:max-h-[28rem] overflow-y-auto bg-black/40 rounded p-2
                   font-mono text-xs leading-relaxed scrollbar-d2"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        data-testid="combat-log"
      >
        {entries.length === 0 ? (
          <p className="text-d2-white/40 italic">
            {t('logEmpty')}
          </p>
        ) : (
          entries.map((e) => (
            <div key={e.id} className={logTypeClass(e.type)}>
              <span className="text-d2-white/40 mr-1">
                {new Date(e.timestamp).toLocaleTimeString([], { hour12: false })}
              </span>
              <span>{e.message}</span>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

/**
 * Order the allies list so cards render in this canonical order:
 *   hero → mercs (ungrouped) → each hero's summons → each merc's summons → orphan summons.
 *
 * Within each group, original spawn order is preserved. Dead summons
 * are filtered out — they don't contribute to combat any more and a
 * greyed-out skeleton card is just visual noise. Hero/merc cards are
 * kept on death so the player can still read their final state.
 */
function orderAlliesWithSummons(team: readonly CombatUnit[]): CombatUnit[] {
  const heroes: CombatUnit[] = [];
  const mercs: CombatUnit[] = [];
  const summonsByOwner = new Map<string, CombatUnit[]>();
  const orphans: CombatUnit[] = [];

  for (const u of team) {
    const kind = inferKind(u);
    if (kind === 'summon') {
      // Skip corpses — summons leave no card behind once they die.
      if (u.life <= 0) continue;
      const owner = u.summonOwnerId;
      if (owner) {
        const arr = summonsByOwner.get(owner) ?? [];
        arr.push(u);
        summonsByOwner.set(owner, arr);
      } else {
        orphans.push(u);
      }
    } else if (kind === 'merc') {
      mercs.push(u);
    } else {
      heroes.push(u);
    }
  }

  const out: CombatUnit[] = [];
  // 1. Heroes first (typically just one).
  for (const h of heroes) out.push(h);
  // 2. Mercs next, in original order.
  for (const m of mercs) out.push(m);
  // 3. Then each hero's pets, then each merc's pets — keeps owners
  //    visually adjacent to their summons without breaking the
  //    hero/merc/pet ordering.
  for (const h of heroes) {
    const pets = summonsByOwner.get(h.id);
    if (pets) {
      out.push(...pets);
      summonsByOwner.delete(h.id);
    }
  }
  for (const m of mercs) {
    const pets = summonsByOwner.get(m.id);
    if (pets) {
      out.push(...pets);
      summonsByOwner.delete(m.id);
    }
  }
  // Any summons whose owner wasn't found (e.g. owner died but engine kept the unit briefly).
  for (const remaining of summonsByOwner.values()) out.push(...remaining);
  out.push(...orphans);
  return out;
}

/**
 * Extract a monster slug for image lookup from a CombatUnit's id/name.
 *
 * Prefers `id` because `monster-factory` stamps it as
 * `enemy-act<N>.<slug>-<idx>-<hex>` (or `enemy-<slug>-<idx>-<hex>`),
 * which is stable regardless of display-name suffixes such as
 *   - instance letter:  "Fallen A", "Fallen B"
 *   - tier badge:       "Fallen (Elite)", "Andariel (Boss)"
 *   - epithet/comma:    "Andariel, Maiden of Anguish"
 *   - level suffix:     "Fallen Lv1", "堕落者 等级 1"
 *
 * Falls back to a name-based slug only when the id pattern doesn't match.
 *
 * Examples:
 *   id="enemy-act1.fallen-0-1a2b"           → "fallen"
 *   id="enemy-act1.andariel-0-cd34"         → "andariel"
 *   id="enemy-act2.sand-maggot-young-2-ef"  → "sand-maggot-young"
 *   name="Fallen Lv1"                       → "fallen"
 */
// Monster portraits retain the act for canonical registry/override lookup.
function extractMonsterSlug(name: string, id: string, includeAct = false): string {
  // Preferred path: parse the engine-stamped id.
  // monster-factory builds: `enemy-${archetypeSlug}-${index}-${hexTag}`
  // where archetypeSlug is `act<N>.<kebab>` (last segment of `monsters/act<N>.<kebab>`).
  const idMatch = /^enemy-((?:act\d+\.)?[a-z0-9-]+?)-\d+-[a-f0-9]+$/i.exec(id);
  if (idMatch?.[1]) {
    const key = idMatch[1].toLowerCase();
    return includeAct ? key : key.replace(/^act\d+\./, '');
  }

  // Fallback: clean the display name. Strip — in this order —
  //   1) tier badge in trailing parens, e.g. " (Elite)", " (Boss)"
  //   2) localized level suffix " Lv1", " 等级 1"
  //   3) lone trailing instance letter " A".."Z"
  //   4) epithet after the first comma ("Andariel, Maiden of Anguish" → "Andariel")
  const trimmed = name
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/\s+(?:Lv|Lvl|Level|等级)\s*\d+.*$/i, '')
    .replace(/\s+[A-Z]$/, '')
    .replace(/,.*$/, '')
    .trim();
  const base = trimmed || id;
  return base.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
}

function logTypeClass(type: CombatLogEntry['type']): string {
  switch (type) {
    case 'damage':
      return 'text-red-300';
    case 'heal':
      return 'text-green-300';
    case 'buff':
      return 'text-blue-300';
    case 'debuff':
      return 'text-purple-300';
    case 'death':
      return 'text-d2-rare';
    case 'skill':
      return 'text-d2-gold';
    case 'system':
    default:
      return 'text-d2-white/80';
  }
}
