/**
 * CombatScreen — real-time card-driven combat playback.
 *
 * Layout @ 360×640 (portrait, mobile-first):
 *   [ Header: Wave · Pause · Speed (1×/2×/4×/Skip) · Flee ]
 *   [ Allies row (character cards) ]
 *   [ Enemies row (monster cards, tap to focus) ]
 *   [ Combat log — virtualized last-200 view, auto-scroll, pause-on-hover ]
 *
 * @ md+: 2-col split — cards on the left, log on the right.
 *
 * Logic policy: this component contains *only* presentation + UI state.
 * The engine resolves the entire battle synchronously via the
 * `runBattleStream` shim (TODO: replace with engine generator). The
 * `useBattlePlayback` hook then animates events into the combatStore
 * log + maintains live HP snapshots for the cards.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  GameCard,
  Panel,
  ScreenShell,
  resolveClassPortrait,
  resolveMonsterArt
} from '@/ui';
import { useCombatStore, usePlayerStore, useMapStore } from '@/stores';
import {
  battleEventToLogEntry,
  createSimpleEnemy,
  playerToCombatUnit,
  awardLootForVictory
} from '@/stores/combatHelpers';
import type { CombatLogEntry } from '@/stores/combatStore';
import type { CombatUnit } from '@/engine/combat/types';
import type { Player } from '@/engine/types/entities';
import type { KillRewards } from '@/engine/loot/award';
import {
  runBattleStream,
  type BattleEventWithTime
} from './runBattleStreamShim';
import {
  useBattlePlayback,
  type PlaybackSpeed
} from './useBattlePlayback';

const MAX_LOG = 200;

const RARITY_COLORS: Record<string, string> = {
  normal: 'text-d2-white',
  magic: 'text-blue-300',
  rare: 'text-yellow-300',
  set: 'text-green-400',
  unique: 'text-d2-gold',
  runeword: 'text-orange-400'
};

const SPEED_CYCLE: readonly PlaybackSpeed[] = [1, 2, 4, 'skip'];

interface BattleSetup {
  readonly playerTeam: readonly CombatUnit[];
  readonly enemyTeam: readonly CombatUnit[];
  readonly events: readonly BattleEventWithTime[];
  readonly seed: number;
}

function buildBattle(player: Player, level: number, enemyCount: number): BattleSetup {
  const playerUnit = playerToCombatUnit(player);
  const enemies: CombatUnit[] = [];
  for (let i = 0; i < enemyCount; i++) {
    enemies.push(createSimpleEnemy(level));
  }
  const seed = Date.now();
  // Derive playback pacing from player attack-speed (D2 IAS curve simplified).
  const attackIntervalMs = Math.max(
    300,
    Math.round(120000 / Math.max(20, player.derivedStats.attackSpeed))
  );
  const { events } = runBattleStream(
    { seed, playerTeam: [playerUnit], enemyTeam: enemies },
    attackIntervalMs
  );
  return { playerTeam: [playerUnit], enemyTeam: enemies, events, seed };
}

export function CombatScreen() {
  const { t } = useTranslation(['combat', 'common', 'card']);
  const navigate = useNavigate();

  const player = usePlayerStore((s) => s.player);
  const isPaused = useCombatStore((s) => s.isPaused);
  const togglePause = useCombatStore((s) => s.togglePause);
  const log = useCombatStore((s) => s.log);
  const addLogEntry = useCombatStore((s) => s.addLogEntry);
  const startCombat = useCombatStore((s) => s.startCombat);
  const endCombat = useCombatStore((s) => s.endCombat);
  const clearLog = useCombatStore((s) => s.clearLog);
  const currentWave = useCombatStore((s) => s.currentWave);
  const totalWaves = useCombatStore((s) => s.totalWaves);

  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [hovered, setHovered] = useState(false);
  const [setup, setSetup] = useState<BattleSetup | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [rewards, setRewards] = useState<KillRewards | null>(null);

  // Build the battle once when the player is available.
  useEffect(() => {
    if (!player || setup) return;
    const level = player.level || 1;
    const built = buildBattle(player, level, 3);
    setSetup(built);
    clearLog();
    startCombat([...built.playerTeam], [...built.enemyTeam], 1);
    const firstEnemy = built.enemyTeam[0];
    if (firstEnemy) setSelectedTargetId(firstEnemy.id);
  }, [player, setup, startCombat, clearLog]);

  const unitNameMap = useMemo(() => {
    const m = new Map<string, string>();
    if (setup) {
      for (const u of setup.playerTeam) m.set(u.id, u.name);
      for (const u of setup.enemyTeam) m.set(u.id, u.name);
    }
    return m;
  }, [setup]);

  // Push events into the combat log as they surface.
  const onEvent = useMemo(
    () => (ev: BattleEventWithTime) => {
      const entry = battleEventToLogEntry(ev, unitNameMap);
      if (entry) addLogEntry(entry);
    },
    [unitNameMap, addLogEntry]
  );

  // Stabilise the initialUnits reference so the playback hook's reset
  // effect doesn't fire on every render (spreading inline made a fresh
  // array each pass and clobbered the cursor → playback never advanced).
  const initialUnits = useMemo(
    () => (setup ? [...setup.playerTeam, ...setup.enemyTeam] : []),
    [setup]
  );

  const playback = useBattlePlayback({
    events: setup?.events ?? [],
    initialUnits,
    speed,
    paused: isPaused,
    hovered,
    onEvent
  });

  // On playback completion, roll loot.
  const lootedSeedRef = useRef<number | null>(null);
  useEffect(() => {
    if (!setup || !playback.done || lootedSeedRef.current === setup.seed) return;
    lootedSeedRef.current = setup.seed;
    // Build a "slain enemy" list from the live unit map (life<=0).
    const slain = setup.enemyTeam.filter((u) => {
      const live = playback.liveUnits.get(u.id);
      return live ? live.life <= 0 : false;
    });
    if (slain.length === 0) return;
    const mapState = useMapStore.getState();
    const act = (Math.min(5, Math.max(1, mapState.currentAct)) as 1 | 2 | 3 | 4 | 5);
    const r = awardLootForVictory({
      slainEnemies: slain,
      act,
      treasureClassId: `loot/trash-act${String(act)}`,
      seed: setup.seed ^ 0x9e3779b1
    });
    setRewards(r);
  }, [setup, playback.done, playback.liveUnits]);

  const recentLog = useMemo(() => log.slice(-MAX_LOG), [log]);

  const cycleSpeed = () => {
    setSpeed((s) => {
      const idx = SPEED_CYCLE.indexOf(s);
      const next = SPEED_CYCLE[(idx + 1) % SPEED_CYCLE.length] ?? 1;
      return next;
    });
  };

  const handleFlee = () => {
    endCombat();
    setSetup(null);
    setRewards(null);
    navigate('/town');
  };

  const speedLabelKey: Record<PlaybackSpeed, string> = {
    1: '1x',
    2: '2x',
    4: '4x',
    skip: 'skip'
  };

  return (
    <ScreenShell
      testId="combat-screen"
      title={
        <div className="flex items-center justify-between gap-2 w-full flex-wrap">
          <span aria-live="polite">
            {t('wave', {
              current: currentWave || 1,
              total: totalWaves || 1,
              defaultValue: `Wave ${String(currentWave || 1)} / ${String(totalWaves || 1)}`
            })}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              className="min-h-[40px] px-3 text-sm"
              onClick={togglePause}
              aria-pressed={isPaused}
            >
              {isPaused ? t('resume') : t('pause')}
            </Button>
            <Button
              variant="secondary"
              className="min-h-[40px] px-3 text-sm tabular-nums"
              onClick={cycleSpeed}
              aria-label={t('speedLabel', { defaultValue: 'Speed' })}
              data-testid="combat-speed-btn"
            >
              {t(`speed.${speedLabelKey[speed]}`, { defaultValue: String(speed) })}
            </Button>
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
            {!setup || setup.playerTeam.length === 0 ? (
              <p className="text-sm text-d2-white/60">
                {t('noAllies', { defaultValue: '无单位' })}
              </p>
            ) : (
              <ul
                className="flex flex-wrap gap-2"
                data-testid="combat-allies"
              >
                {setup.playerTeam.map((u) => (
                  <li key={u.id}>
                    <AllyCard unit={u} liveLife={playback.liveUnits.get(u.id)?.life ?? u.life} liveMana={playback.liveUnits.get(u.id)?.mana ?? u.mana} player={player} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={t('enemies', { defaultValue: '敌人' })}>
            {!setup || setup.enemyTeam.length === 0 ? (
              <p className="text-sm text-d2-white/60">
                {t('noEnemies', { defaultValue: '没有敌人' })}
              </p>
            ) : (
              <ul
                className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto pr-1"
                data-testid="combat-enemies"
              >
                {setup.enemyTeam.map((u) => {
                  const live = playback.liveUnits.get(u.id);
                  return (
                    <li key={u.id}>
                      <EnemyCard
                        unit={u}
                        liveLife={live?.life ?? u.life}
                        selected={selectedTargetId === u.id}
                        onClick={() => { setSelectedTargetId(u.id); }}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <CombatLog entries={recentLog} onHoverChange={setHovered} />
      </div>

      {rewards && (rewards.items.length > 0 || rewards.gold > 0) && (
        <div className="max-w-5xl mx-auto mt-3" data-testid="loot-summary">
          <Panel title={t('loot', { defaultValue: '战利品' })}>
            {rewards.gold > 0 && (
              <div className="text-d2-gold text-sm mb-1">
                +{rewards.gold} {t('gold', { defaultValue: '金币' })}
              </div>
            )}
            {rewards.items.length > 0 && (
              <ul className="space-y-1 text-sm" data-testid="loot-items">
                {rewards.items.map((it) => (
                  <li key={it.id} className={RARITY_COLORS[it.rarity] ?? 'text-d2-white'}>
                    {it.baseId.split('/').pop()}{' '}
                    <span className="text-xs text-d2-white/50">
                      [{it.rarity} · iLvl {it.level}]
                    </span>
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

function AllyCard({
  unit,
  liveLife,
  liveMana,
  player
}: {
  unit: CombatUnit;
  liveLife: number;
  liveMana: number;
  player: Player | null;
}) {
  const portrait = player ? resolveClassPortrait(player.class) ?? undefined : undefined;
  const subtitle = player ? player.class : undefined;
  return (
    <GameCard
      variant="character"
      size="md"
      name={unit.name}
      subtitle={subtitle}
      rarity="unique"
      image={portrait}
      bars={[
        { kind: 'hp', current: liveLife, max: unit.stats.lifeMax },
        ...(unit.stats.manaMax > 0
          ? [{ kind: 'mp' as const, current: liveMana, max: unit.stats.manaMax }]
          : [])
      ]}
      footer={`Lv ${String(unit.level)}`}
      testId={`ally-card-${unit.id}`}
    />
  );
}

function EnemyCard({
  unit,
  liveLife,
  selected,
  onClick
}: {
  unit: CombatUnit;
  liveLife: number;
  selected: boolean;
  onClick: () => void;
}) {
  const tierToRarity: Record<CombatUnit['tier'], 'common' | 'champion' | 'elite' | 'boss'> = {
    trash: 'common',
    champion: 'champion',
    elite: 'elite',
    boss: 'boss'
  };
  // Best-effort monster art lookup — current `createSimpleEnemy` uses
  // `Fallen Lv{n}` names, so we try the act1.fallen key.
  const artKey = unit.name.toLowerCase().includes('fallen') ? 'act1.fallen' : '';
  const image = artKey ? resolveMonsterArt(artKey) ?? undefined : undefined;
  return (
    <GameCard
      variant="monster"
      size="md"
      name={unit.name}
      subtitle={unit.tier}
      rarity={tierToRarity[unit.tier]}
      image={image}
      stats={[
        { label: 'ATK', value: unit.stats.attack, tone: 'atk' },
        { label: 'HP', value: unit.stats.lifeMax, tone: 'hp' }
      ]}
      bars={[{ kind: 'hp', current: liveLife, max: unit.stats.lifeMax }]}
      selected={selected}
      onClick={onClick}
      testId={`enemy-card-${unit.id}`}
    />
  );
}

/** Combat log: auto-scrolls to bottom unless the user hovers/scrolls away. */
function CombatLog({
  entries,
  onHoverChange
}: {
  entries: CombatLogEntry[];
  onHoverChange: (hovered: boolean) => void;
}) {
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
        onMouseEnter={() => {
          setPaused(true);
          onHoverChange(true);
        }}
        onMouseLeave={() => {
          setPaused(false);
          onHoverChange(false);
        }}
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
