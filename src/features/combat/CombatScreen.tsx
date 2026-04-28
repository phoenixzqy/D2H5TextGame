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
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Panel, StatBar, ScreenShell } from '@/ui';
import { useCombatStore, usePlayerStore } from '@/stores';
import { startSimpleBattle } from '@/stores/combatHelpers';
import type { CombatLogEntry } from '@/stores/combatStore';
import type { CombatUnit } from '@/engine/combat/types';
import type { KillRewards } from '@/engine/loot/award';

const MAX_LOG = 200;

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

  const recentLog = useMemo(() => log.slice(-MAX_LOG), [log]);
  const [rewards, setRewards] = useState<KillRewards | null>(null);

  // Auto-start battle if not in combat yet
  useEffect(() => {
    if (!inCombat && player) {
      const level = player.level || 1;
      const result = startSimpleBattle(level, 3);
      if (result?.rewards) setRewards(result.rewards);
    }
  }, [inCombat, player]);

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
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="min-h-[40px] px-3 text-sm"
              onClick={togglePause}
              aria-pressed={isPaused}
            >
              {isPaused ? t('resume') : t('pause')}
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
                {playerTeam.map((u) => (
                  <li key={u.id}>
                    <UnitBars unit={u} />
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
                    <UnitBars unit={u} compact />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <CombatLog entries={recentLog} />
      </div>
      {rewards && (rewards.items.length > 0 || rewards.gold > 0) && (
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

function UnitBars({ unit, compact = false }: { unit: CombatUnit; compact?: boolean }) {
  const { t } = useTranslation('combat');
  return (
    <div className="border border-d2-border rounded p-2 bg-d2-bg/40">
      <div className="flex items-center justify-between mb-1 text-sm">
        <span className="font-serif text-d2-gold truncate">{unit.name}</span>
        <span className="text-xs text-d2-white/60">
          Lv {unit.level}
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
