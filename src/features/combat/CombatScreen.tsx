/**
 * CombatScreen — main combat UI.
 *
 * Layout @ 360×640 (portrait):
 *   [ Header: Wave X / Y · Pause / Auto / Flee ]
 *   [ Allies row (HP bars) ]
 *   [ Enemies list  (HP bars, vertical scroll if many) ]
 *   [ Combat log (flex-1 grows, last 200 entries, auto-scroll, pause on hover) ]
 *
 * @ md+:
 *   2-column: left = allies+enemies, right = log
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Panel, ScreenShell, GameCard, getClassPortraitUrl, getMonsterImageUrl, getSummonImageUrl } from '@/ui';
import { useCombatStore, useMapStore, usePlayerStore } from '@/stores';
import {
  startSubAreaRun,
  advanceWaveOrFinish,
  abortSubAreaRun,
  hasActiveSubAreaRun
} from '@/stores/combatHelpers';
import { nextSubAreaInAct } from '@/stores/subAreaResolver';
import type { CombatLogEntry } from '@/stores/combatStore';
import type { CombatUnit } from '@/engine/combat/types';
import { inferKind } from '@/engine/combat/types';

const MAX_LOG = 200;
const SPEED_CYCLE = [1, 2, 4] as const;
type Speed = (typeof SPEED_CYCLE)[number];

const RARITY_COLORS: Record<string, string> = {
  normal: 'text-d2-white',
  magic: 'text-blue-300',
  rare: 'text-yellow-300',
  set: 'text-green-400',
  unique: 'text-d2-gold',
  runeword: 'text-orange-400',
};

export function CombatScreen() {
  const { t } = useTranslation(['combat', 'common']);
  const navigate = useNavigate();

  const player = usePlayerStore((s) => s.player);
  const playerTeam = useCombatStore((s) => s.playerTeam);
  const enemyTeam = useCombatStore((s) => s.enemyTeam);
  const inCombat = useCombatStore((s) => s.inCombat);
  const log = useCombatStore((s) => s.log);
  const currentWave = useCombatStore((s) => s.currentWave);
  const totalWaves = useCombatStore((s) => s.totalWaves);
  const isPaused = useCombatStore((s) => s.isPaused);
  const autoMode = useCombatStore((s) => s.autoMode);
  const togglePause = useCombatStore((s) => s.togglePause);
  const toggleAutoMode = useCombatStore((s) => s.toggleAutoMode);
  const endCombat = useCombatStore((s) => s.endCombat);

  // Recorded-event playback selectors
  const recordedEvents = useCombatStore((s) => s.recordedEvents);
  const eventCursor = useCombatStore((s) => s.eventCursor);
  const playbackComplete = useCombatStore((s) => s.playbackComplete);
  const tick = useCombatStore((s) => s.tick);

  // Sub-area run selectors (Bugs #5/#16/#21)
  const runVictory = useCombatStore((s) => s.runVictory);
  const runDefeat = useCombatStore((s) => s.runDefeat);
  const runRewards = useCombatStore((s) => s.runRewards);
  const subAreaRunId = useCombatStore((s) => s.subAreaRunId);

  const currentAct = useMapStore((s) => s.currentAct);
  const setLocation = useMapStore((s) => s.setCurrentLocation);

  const recentLog = useMemo(() => log.slice(-MAX_LOG), [log]);
  const [speed, setSpeed] = useState<Speed>(1);
  // Inter-wave countdown banner; null = no pending advance.
  const [nextWaveCountingDown, setNextWaveCountingDown] = useState(false);

  // Auto-start a sub-area run if none is in flight.
  useEffect(() => {
    if (!inCombat && player && !runVictory && !runDefeat) {
      startSubAreaRun();
    }
  }, [inCombat, player, runVictory, runDefeat]);

  // Timer-driven playback: schedule the next event after its uiDelayMs
  // (divided by the chosen speed multiplier). Re-runs whenever the cursor,
  // pause state, or speed changes.
  useEffect(() => {
    if (!inCombat || isPaused || playbackComplete) return;
    const next = recordedEvents[eventCursor];
    if (!next) return;
    const delay = Math.max(50, Math.floor(next.uiDelayMs / speed));
    const handle = setTimeout(() => {
      tick();
    }, delay);
    return () => { clearTimeout(handle); };
  }, [inCombat, isPaused, playbackComplete, eventCursor, recordedEvents, tick, speed]);

  // Wave completion → auto-advance to next wave (1.5s pause) OR finalize run.
  // The 1.5s pause is the recommended default per the spec; it gives the
  // player time to read the last log line before the next wave appears.
  useEffect(() => {
    if (!playbackComplete) {
      setNextWaveCountingDown(false);
      return;
    }
    // Run already finalized — nothing to do.
    if (runVictory || runDefeat) return;
    // No active sub-area run (synthetic battle); skip the wave loop.
    if (!hasActiveSubAreaRun()) return;

    setNextWaveCountingDown(true);
    const handle = setTimeout(() => {
      advanceWaveOrFinish();
      setNextWaveCountingDown(false);
    }, 1500);
    return () => { clearTimeout(handle); };
  }, [playbackComplete, runVictory, runDefeat]);

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

  const cycleSpeed = useCallback(() => {
    setSpeed((cur) => {
      const idx = SPEED_CYCLE.indexOf(cur);
      const nextIdx = (idx + 1) % SPEED_CYCLE.length;
      return SPEED_CYCLE[nextIdx] ?? 1;
    });
  }, []);

  const handleSkip = useCallback(() => {
    // Resume if paused so advanceEvent isn't a no-op, then drain.
    const store = useCombatStore.getState();
    if (store.isPaused) store.resumePlayback();
    let safety = 10_000;
    while (!useCombatStore.getState().playbackComplete && safety-- > 0) {
      useCombatStore.getState().advanceEvent();
    }
  }, []);

  // Mid-run flee: a sub-area run is in flight → bail to the world map (#21).
  // Synthetic / no-run battles fall through to the town hub as before.
  const handleFlee = () => {
    const wasInRun = hasActiveSubAreaRun() || subAreaRunId !== null;
    abortSubAreaRun();
    endCombat();
    navigate(wasInRun ? '/map' : '/town');
  };

  // Compute next sub-area for the post-victory CTA.
  const nextSubArea = useMemo(
    () => nextSubAreaInAct(currentAct, subAreaRunId),
    [currentAct, subAreaRunId]
  );

  const handleContinueToNext = () => {
    if (!nextSubArea) return;
    setLocation(currentAct, nextSubArea.id);
    endCombat(); // will trigger auto-start in the mount effect
  };

  const handleReturnToMap = () => {
    endCombat();
    navigate('/map');
  };

  const handleReturnToTown = () => {
    endCombat();
    navigate('/town');
  };

  return (
    <ScreenShell
      testId="combat-screen"
      title={
        <div className="flex items-center justify-between gap-2 w-full">
          <span aria-live="polite">
            {t('wave', {
              current: currentWave || 1,
              total: totalWaves || 1,
              defaultValue: `Wave ${String(currentWave || 1)} / ${String(totalWaves || 1)}`,
            })}
          </span>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="secondary"
              className="min-h-[40px] px-3 text-sm"
              onClick={togglePause}
              aria-pressed={isPaused}
              disabled={playbackComplete}
            >
              {isPaused ? t('resume') : t('pause')}
            </Button>
            <Button
              variant="secondary"
              className="min-h-[40px] px-2 text-sm tabular-nums"
              onClick={cycleSpeed}
              aria-label={t('speed', { defaultValue: '速度' })}
              title={t('speed', { defaultValue: '速度' })}
              disabled={playbackComplete}
            >
              {t('speedX', { x: speed, defaultValue: `${String(speed)}x` })}
            </Button>
            <Button
              variant="secondary"
              className="min-h-[40px] px-3 text-sm"
              onClick={handleSkip}
              disabled={playbackComplete}
            >
              {t('skip', { defaultValue: '跳过' })}
            </Button>
            <label className="flex items-center gap-1 text-xs cursor-pointer min-h-[40px]">
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
              className="min-h-[40px] px-3 text-sm"
              onClick={handleFlee}
            >
              {t('flee')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-5xl mx-auto">
        <div className="space-y-3 min-w-0">
          <Panel title={t('allies', { defaultValue: '我方' })}>
            {playerTeam.length === 0 ? (
              <p className="text-sm text-d2-white/60">
                {t('noAllies', { defaultValue: '无单位' })}
              </p>
            ) : (
              <div className="flex flex-wrap gap-3" data-testid="allies-list">
                {orderAlliesWithSummons(playerTeam).map((u) => (
                  <UnitCard
                    key={u.id}
                    unit={u}
                    size="md"
                    acting={u.id === actingActorId}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title={t('enemies', { defaultValue: '敌人' })}>
            {enemyTeam.length === 0 ? (
              <p className="text-sm text-d2-white/60">
                {t('noEnemies', { defaultValue: '没有敌人' })}
              </p>
            ) : (
              <div className="flex flex-wrap gap-3" data-testid="enemies-list">
                {enemyTeam.map((u) => (
                  <UnitCard
                    key={u.id}
                    unit={u}
                    size="sm"
                    acting={u.id === actingActorId}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>

        <CombatLog entries={recentLog} />
      </div>
      {nextWaveCountingDown && !runVictory && !runDefeat && (
        <div
          className="max-w-5xl mx-auto mt-3 text-center text-d2-gold text-sm"
          data-testid="next-wave-banner"
          aria-live="polite"
        >
          {t('nextWaveIn', { defaultValue: 'Next wave in 1.5s…' })}
        </div>
      )}
      {(runVictory || runDefeat) && (
        <div className="max-w-5xl mx-auto mt-3" data-testid={runVictory ? 'victory-panel' : 'defeat-panel'}>
          <Panel
            title={runVictory
              ? t('runVictoryTitle', { defaultValue: 'Sub-area cleared!' })
              : t('runDefeatTitle', { defaultValue: 'Defeated' })}
          >
            {runVictory && (runRewards.items.length > 0 || runRewards.runeShards > 0) && (
              <div className="mb-2" data-testid="loot-summary">
                {runRewards.runeShards > 0 && (
                  <div className="text-d2-gold text-sm mb-1">
                    +{runRewards.runeShards} {t('runeShard', { defaultValue: '符文碎片' })}
                  </div>
                )}
                {runRewards.items.length > 0 && (
                  <ul className="space-y-1 text-sm" data-testid="loot-items">
                    {runRewards.items.map((it) => (
                      <li key={it.id} className={RARITY_COLORS[it.rarity] ?? 'text-d2-white'}>
                        {it.baseId.split('/').pop()}{' '}
                        <span className="text-xs text-d2-white/50">[{it.rarity} · iLvl {it.level}]</span>
                      </li>
                    ))}
                  </ul>
                )}
                {(runRewards.runes > 0 || runRewards.gems > 0 || runRewards.wishstones > 0) && (
                  <div className="text-xs text-d2-white/70 mt-2">
                    {runRewards.runes > 0 && <span className="mr-2">+{runRewards.runes} rune</span>}
                    {runRewards.gems > 0 && <span className="mr-2">+{runRewards.gems} gem</span>}
                    {runRewards.wishstones > 0 && <span className="mr-2">+{runRewards.wishstones} wishstone</span>}
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {runVictory && nextSubArea && (
                <Button
                  variant="primary"
                  className="min-h-[40px] text-sm"
                  onClick={handleContinueToNext}
                  data-testid="continue-next-subarea"
                >
                  {t('continueToNextSubArea', { defaultValue: 'Continue to next sub-area' })}
                </Button>
              )}
              <Button
                variant="secondary"
                className="min-h-[40px] text-sm"
                onClick={handleReturnToMap}
                data-testid="return-to-map"
              >
                {t('returnToMap', { defaultValue: 'Return to map' })}
              </Button>
              <Button
                variant="secondary"
                className="min-h-[40px] text-sm"
                onClick={handleReturnToTown}
                data-testid="return-to-town"
              >
                {t('returnToTown', { defaultValue: 'Return to town' })}
              </Button>
            </div>
          </Panel>
        </div>
      )}
    </ScreenShell>
  );
}

function UnitCard({
  unit,
  size,
  acting = false,
}: {
  unit: CombatUnit;
  size: 'sm' | 'md';
  acting?: boolean;
}) {
  const { t } = useTranslation('combat');
  const player = usePlayerStore((s) => s.player);
  const kind = inferKind(unit);
  const isSummon = kind === 'summon';
  const isPlayerSide = unit.side === 'player';

  // Derive avatar:
  //  - hero (player-side, non-summon)   → class portrait
  //  - summon (player-side)             → summon portrait helper
  //  - enemy                            → monster image
  let avatarSrc: string | undefined;
  if (isSummon) {
    avatarSrc = getSummonImageUrl(extractMonsterSlug(unit.name, unit.id));
  } else if (isPlayerSide && player) {
    avatarSrc = getClassPortraitUrl(player.class);
  } else {
    avatarSrc = getMonsterImageUrl(extractMonsterSlug(unit.name, unit.id));
  }

  const isDead = unit.life <= 0;
  const variant: 'character' | 'monster' = isPlayerSide ? 'character' : 'monster';
  const rarity = isPlayerSide
    ? isSummon
      ? 'magic'
      : 'unique'
    : 'common';

  const bars: { kind: 'hp' | 'mp'; current: number; max: number }[] = [
    { kind: 'hp', current: unit.life, max: Math.max(1, unit.stats.life) },
  ];
  if (size === 'md' && unit.stats.mana > 0) {
    bars.push({ kind: 'mp', current: unit.mana, max: Math.max(1, unit.stats.mana) });
  }

  const subtitle = isSummon
    ? t('summon', { defaultValue: '召唤物' })
    : `Lv ${String(unit.level)}`;

  const wrapperCls = isDead ? 'opacity-50 grayscale' : '';
  const ringCls = acting && !isDead ? 'ring-2 ring-d2-gold' : '';
  const sideTestId = isPlayerSide ? 'combat-ally-card' : 'combat-enemy-card';

  return (
    <div
      className={`${wrapperCls} ${ringCls} rounded-md transition-opacity`}
      data-acting={acting || undefined}
      data-dead={isDead || undefined}
      data-kind={kind}
      data-testid={`unit-card-${unit.id}`}
      data-side-testid={sideTestId}
    >
      <span className="sr-only" data-testid={sideTestId} />
      <GameCard
        variant={variant}
        size={size}
        name={unit.name}
        subtitle={subtitle}
        rarity={rarity}
        image={avatarSrc}
        bars={bars}
        stats={size === 'md' ? [{ label: 'LV', value: unit.level }] : undefined}
      />
    </div>
  );
}

/** Combat log: virtualized-ish (DOM only renders last MAX_LOG via slice in parent),
 *  auto-scrolls to bottom unless the user is hovering or has scrolled away. */
function CombatLog({ entries }: { entries: CombatLogEntry[] }) {
  const { t } = useTranslation('combat');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    if (paused || !pinned) return;
    const el = logContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length, paused, pinned]);

  const onScroll = () => {
    const el = logContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    setPinned(atBottom);
  };

  return (
    <Panel
      title={t('log', { defaultValue: '战斗日志' })}
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
            {t('logEmpty', { defaultValue: '战斗即将开始…' })}
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
      {paused && (
        <p className="text-[10px] text-d2-white/50 mt-1 text-right">
          {t('logPaused', { defaultValue: '已暂停滚动 (移开光标继续)' })}
        </p>
      )}
    </Panel>
  );
}

/**
 * Order the allies list so that each summon appears immediately after its
 * owner. Heroes/non-summons keep their relative spawn order; orphan
 * summons (no matching owner in the team) fall through to the end.
 */
function orderAlliesWithSummons(team: readonly CombatUnit[]): CombatUnit[] {
  const heroes: CombatUnit[] = [];
  const summonsByOwner = new Map<string, CombatUnit[]>();
  const orphans: CombatUnit[] = [];

  for (const u of team) {
    if (inferKind(u) === 'summon') {
      const owner = u.summonOwnerId;
      if (owner) {
        const arr = summonsByOwner.get(owner) ?? [];
        arr.push(u);
        summonsByOwner.set(owner, arr);
      } else {
        orphans.push(u);
      }
    } else {
      heroes.push(u);
    }
  }

  const out: CombatUnit[] = [];
  for (const h of heroes) {
    out.push(h);
    const pets = summonsByOwner.get(h.id);
    if (pets) {
      out.push(...pets);
      summonsByOwner.delete(h.id);
    }
  }
  // Any summons whose owner wasn't found (e.g. owner died but engine kept the unit briefly).
  for (const remaining of summonsByOwner.values()) out.push(...remaining);
  out.push(...orphans);
  return out;
}

/**
 * Extract a monster slug for image lookup from a CombatUnit's display name.
 * Strips trailing level/title suffixes like " Lv1", " (Boss)", etc.
 * Falls back to the raw id when name is empty.
 *
 * Examples:
 *   "Fallen Lv1"       → "fallen"
 *   "Bone Warrior Lv5" → "bone-warrior"
 *   "Andariel"         → "andariel"
 */
function extractMonsterSlug(name: string, id: string): string {
  const trimmed = name.replace(/\s+(?:Lv|Lvl|Level|等级)\s*\d+.*$/i, '').trim();
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
