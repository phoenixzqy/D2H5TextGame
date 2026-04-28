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
import { Button, Panel, StatBar, ScreenShell, GameImage, getClassPortraitUrl, getMonsterImageUrl, getSummonImageUrl } from '@/ui';
import { useCombatStore, usePlayerStore } from '@/stores';
import { startSimpleBattle } from '@/stores/combatHelpers';
import type { CombatLogEntry } from '@/stores/combatStore';
import type { CombatUnit } from '@/engine/combat/types';
import { inferKind } from '@/engine/combat/types';
import type { KillRewards } from '@/engine/loot/award';

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
  const outcome = useCombatStore((s) => s.outcome);
  const tick = useCombatStore((s) => s.tick);

  const recentLog = useMemo(() => log.slice(-MAX_LOG), [log]);
  const [rewards, setRewards] = useState<KillRewards | null>(null);
  const [speed, setSpeed] = useState<Speed>(1);

  // Auto-start battle if not in combat yet
  useEffect(() => {
    if (!inCombat && player) {
      const level = player.level || 1;
      startSimpleBattle(level, 3);
      setRewards(null);
    }
  }, [inCombat, player]);

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

  // Reveal rewards summary only after playback completes.
  useEffect(() => {
    if (playbackComplete && outcome?.rewards) {
      setRewards(outcome.rewards);
    }
  }, [playbackComplete, outcome]);

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

  const handleFlee = () => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-5xl mx-auto h-full">
        <div className="space-y-3">
          <Panel title={t('allies', { defaultValue: '我方' })}>
            {playerTeam.length === 0 ? (
              <p className="text-sm text-d2-white/60">
                {t('noAllies', { defaultValue: '无单位' })}
              </p>
            ) : (
              <ul className="space-y-2">
                {orderAlliesWithSummons(playerTeam).map((u) => (
                  <li
                    key={u.id}
                    className={inferKind(u) === 'summon' ? 'pl-3 border-l-2 border-d2-border/60' : ''}
                  >
                    <UnitBars unit={u} acting={u.id === actingActorId} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={t('enemies', { defaultValue: '敌人' })}>
            {enemyTeam.length === 0 ? (
              <p className="text-sm text-d2-white/60">
                {t('noEnemies', { defaultValue: '没有敌人' })}
              </p>
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {enemyTeam.map((u) => (
                  <li key={u.id}>
                    <UnitBars unit={u} compact acting={u.id === actingActorId} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <CombatLog entries={recentLog} />
      </div>
      {playbackComplete && rewards && (rewards.items.length > 0 || rewards.gold > 0) && (
        <div className="max-w-5xl mx-auto mt-3" data-testid="loot-summary">
          <Panel title={t('loot', { defaultValue: '战利品' })}>
            {rewards.gold > 0 && (
              <div className="text-d2-gold text-sm mb-1">+{rewards.gold} {t('gold', { defaultValue: '金币' })}</div>
            )}
            {rewards.items.length > 0 && (
              <ul className="space-y-1 text-sm" data-testid="loot-items">
                {rewards.items.map((it) => (
                  <li key={it.id} className={RARITY_COLORS[it.rarity] ?? 'text-d2-white'}>
                    {it.baseId.split('/').pop()} <span className="text-xs text-d2-white/50">[{it.rarity} · iLvl {it.level}]</span>
                  </li>
                ))}
              </ul>
            )}
            {(rewards.runes > 0 || rewards.gems > 0 || rewards.wishstones > 0) && (
              <div className="text-xs text-d2-white/70 mt-2">
                {rewards.runes > 0 && <span className="mr-2">+{rewards.runes} rune</span>}
                {rewards.gems > 0 && <span className="mr-2">+{rewards.gems} gem</span>}
                {rewards.wishstones > 0 && <span className="mr-2">+{rewards.wishstones} wishstone</span>}
              </div>
            )}
          </Panel>
        </div>
      )}
    </ScreenShell>
  );
}

function UnitBars({ unit, compact = false, acting = false }: { unit: CombatUnit; compact?: boolean; acting?: boolean }) {
  const { t } = useTranslation('combat');
  const player = usePlayerStore((s) => s.player);
  const kind = inferKind(unit);
  const isSummon = kind === 'summon';

  // Derive avatar:
  //  - hero (player-side, non-summon)   → class portrait
  //  - summon (player-side)             → summon portrait helper
  //  - enemy                            → monster image
  let avatarSrc: string;
  if (isSummon) {
    avatarSrc = getSummonImageUrl(extractMonsterSlug(unit.name, unit.id));
  } else if (unit.side === 'player' && player) {
    avatarSrc = getClassPortraitUrl(player.class);
  } else {
    avatarSrc = getMonsterImageUrl(extractMonsterSlug(unit.name, unit.id));
  }
  const avatarFallback = isSummon ? '💀' : (unit.name.charAt(0) || '?').toUpperCase();

  const isDead = unit.life <= 0;
  const borderClass = isDead
    ? 'border-d2-border opacity-50'
    : acting
      ? 'border-d2-gold ring-2 ring-d2-gold/40 animate-pulse motion-reduce:animate-none'
      : 'border-d2-border';

  return (
    <div
      className={`border ${borderClass} rounded p-2 bg-d2-bg/40 flex items-start gap-2 transition-colors`}
      data-acting={acting || undefined}
      data-dead={isDead || undefined}
      data-kind={kind}
    >
      <GameImage
        src={avatarSrc}
        alt={unit.name}
        fallbackIcon={avatarFallback}
        size={compact ? 'sm' : 'md'}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1 text-sm gap-2">
          <span className="font-serif text-d2-gold truncate flex items-center gap-1">
            {unit.name}
            {isSummon && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded bg-d2-border/60 text-d2-white/80 font-sans uppercase tracking-wide"
                aria-label={t('summon', { defaultValue: '召唤物' })}
                data-testid="summon-badge"
              >
                {t('summon', { defaultValue: '召唤物' })}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 text-xs text-d2-white/60 shrink-0">
            {acting && !isDead && (
              <span
                className="text-d2-gold"
                aria-label={t('acting', { defaultValue: '行动中' })}
                title={t('acting', { defaultValue: '行动中' })}
              >
                💢
              </span>
            )}
            <span>Lv {unit.level}</span>
          </span>
        </div>
        {compact ? (
          <StatBar current={unit.life} max={unit.stats.life} color="hp" showValues={false} />
        ) : (
          <StatBar
            current={unit.life}
            max={unit.stats.life}
            color="hp"
            label={t('hp', { defaultValue: 'HP' })}
          />
        )}
        {!compact && unit.stats.mana > 0 && (
          <div className="mt-1">
            <StatBar
              current={unit.mana}
              max={unit.stats.mana}
              color="mp"
              label={t('mp', { defaultValue: 'MP' })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** Combat log: virtualized-ish (DOM only renders last MAX_LOG via slice in parent),
 *  auto-scrolls to bottom unless the user is hovering or has scrolled away. */
function CombatLog({ entries }: { entries: CombatLogEntry[] }) {
  const { t } = useTranslation('combat');
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    if (paused || !pinned) return;
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, paused, pinned]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    setPinned(atBottom);
  };

  return (
    <Panel
      title={t('log', { defaultValue: '战斗日志' })}
      className="flex flex-col min-h-[240px] md:min-h-[420px]"
    >
      <div
        ref={ref}
        onScroll={onScroll}
        onMouseEnter={() => { setPaused(true); }}
        onMouseLeave={() => { setPaused(false); }}
        className="flex-1 overflow-y-auto bg-black/40 rounded p-2
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
