/**
 * MapScreen — pick an act and a sub-area.
 *
 * Layout:
 *   [ Acts collapsible list (I–V) ]
 *     [ sub-area row × N: name, rec lvl, lock badge, [Farm] [Enter] ]
 *
 * The acts/sub-areas list is derived from the canonical JSON dataset
 * (`src/data/maps/**`) so every UI row maps 1:1 to a data id. This
 * removed a long-running bug where sub-areas listed in the UI but
 * absent from the data could never be marked cleared (their alias
 * resolved to nothing in `subAreaResolver`, so `markCleared` landed on
 * a synthetic id the badge logic never checked).
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Panel, ScreenShell, GameImage, getZoneArtUrl, tDataKey } from '@/ui';
import { useMapStore, useMetaStore } from '@/stores';
import { subAreas as subAreaList, acts as actList, monsters as monsterList } from '@/data/index';
import { ACT_GATE_BOSS_SUB_AREAS } from '@/engine/map/unlock';
import { IdleTickerStrip } from '@/features/idle/IdleTickerStrip';

interface SubArea {
  id: string;
  alias: string;
  nameKey: string;
  recommendedLevel: number;
  bossArchetypeId?: string;
  challengeMonsterMin: number;
  challengeMonsterMax: number;
  difficultyBand: 'none' | 'penultimate' | 'final';
}

interface Act {
  number: number;
  nameKey: string;
  subAreas: SubArea[];
}

function actNumberFromId(id: string): number {
  const match = /act([1-5])/.exec(id);
  return match?.[1] ? Number(match[1]) : 1;
}

function aliasFromId(id: string): string {
  return id.replace(/^areas\/act([1-5])-/, 'a$1-');
}

function monsterNameKeyFromId(id: string): string {
  const last = id.split('/').pop() ?? id;
  const after = last.includes('.') ? last.split('.').slice(1).join('.') : last;
  return after.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function MapScreen() {
  const { t } = useTranslation(['map', 'common', 'monsters']);
  const navigate = useNavigate();
  const setLocation = useMapStore((s) => s.setCurrentLocation);
  const isActUnlocked = useMapStore((s) => s.isActUnlocked);
  const clearedSubAreas = useMapStore((s) => s.clearedSubAreas);
  const setIdleTarget = useMetaStore((s) => s.setIdleTarget);
  const idleTarget = useMetaStore((s) => s.idleState.idleTarget);

  const [openAct, setOpenAct] = useState<number>(1);

  // Build the act/sub-area tree once from the canonical data set so
  // every UI row lines up with a real id (no alias drift).
  const ACTS = useMemo<Act[]>(() => {
    const byAct = new Map<number, SubArea[]>();
    for (const sa of subAreaList) {
      const actNum = actNumberFromId(sa.actId);
      const alias = aliasFromId(sa.id);
      const list = byAct.get(actNum) ?? [];
      list.push({
        id: sa.id,
        alias,
        nameKey: sa.name,
        recommendedLevel: sa.areaLevel,
        challengeMonsterMin: sa.challenge?.monsterCount.min ?? 8,
        challengeMonsterMax: sa.challenge?.monsterCount.max ?? 20,
        difficultyBand: sa.difficulty?.finaleBand ?? 'none',
        ...(sa.chapterBoss ? { bossArchetypeId: sa.chapterBoss.archetypeId } : {})
      });
      byAct.set(actNum, list);
    }
    return actList
      .map((a) => {
        const num = actNumberFromId(a.id);
        return {
          number: num,
          nameKey: a.name,
          subAreas: byAct.get(num) ?? []
        };
      })
      .filter((a) => a.subAreas.length > 0)
      .sort((a, b) => a.number - b.number);
  }, []);

  const enterArea = (act: number, subId: string) => {
    setLocation(act, subId);
    navigate('/combat');
  };
  const farmHere = (act: number, subId: string) => {
    setLocation(act, subId);
    setIdleTarget(subId);
    navigate('/combat');
  };
  const stopFarming = () => { setIdleTarget(undefined); };

  /**
   * `clearedSubAreas` may contain either the canonical id (preferred,
   * emitted by the engine since the data-driven refactor) or its
   * legacy alias (saves from before the refactor). Check both.
   */
  const isSubAreaCleared = (sa: SubArea): boolean =>
    clearedSubAreas.includes(sa.id) || clearedSubAreas.includes(sa.alias);

  // Find the canonical data entry for the current idle target so the banner
  // resolves `maps.area.*` via tDataKey instead of rendering raw data keys.
  const idleSubArea = idleTarget
    ? subAreaList.find((sa) => sa.id === idleTarget || aliasFromId(sa.id) === idleTarget)
    : undefined;
  const idleAreaName = idleSubArea ? tDataKey(t, idleSubArea.name) : null;

  const bossDisplayName = (archetypeId: string | undefined, fallback: string): string => {
    if (!archetypeId) return fallback;
    const def = monsterList.find((m) => m.id === archetypeId);
    const key = monsterNameKeyFromId(def?.id ?? archetypeId);
    return t(`monsters:${key}`, { defaultValue: def?.name ?? fallback });
  };

  const gateBossDisplayName = (act: number): string => {
    const gateSubArea = subAreaList.find((sa) => sa.id === ACT_GATE_BOSS_SUB_AREAS[act]);
    return bossDisplayName(
      gateSubArea?.chapterBoss?.archetypeId,
      gateSubArea ? tDataKey(t, gateSubArea.name) : t('locked')
    );
  };

  return (
    <ScreenShell testId="map-screen" title={t('worldMap')}>
      <div className="space-y-3 max-w-3xl mx-auto pb-12">
        {idleTarget && idleAreaName && (
          <div
            className="sticky top-0 z-20 -mx-3 md:-mx-6 px-3 md:px-6 py-2
                       bg-d2-panel/95 backdrop-blur border-b border-d2-gold/40
                       text-sm text-d2-gold flex items-center gap-2"
            data-testid="idle-location-banner"
          >
            <span aria-hidden>⚙️</span>
            <span className="flex-1 truncate">
              {t('idleHere')}: {idleAreaName}
            </span>
            <button
              type="button"
              onClick={() => { setIdleTarget(undefined); }}
              className="text-xs text-d2-white/70 hover:text-d2-gold underline underline-offset-2"
              data-testid="idle-stop-button"
            >
              {t('stopIdle')}
            </button>
          </div>
        )}
        {ACTS.map((act) => {
          const isOpen = openAct === act.number;
          const actUnlocked = isActUnlocked(act.number);
          return (
            <Panel key={act.number} className="p-0 overflow-hidden">
              <button
                type="button"
                onClick={() => { setOpenAct(isOpen ? -1 : act.number); }}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 px-3 py-2 min-h-[56px]
                           hover:bg-black/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold"
              >
                <GameImage
                  src={getZoneArtUrl(act.number)}
                  alt=""
                  fallbackIcon={String(act.number)}
                  size="lg"
                  className="!w-16 !h-12 !rounded"
                />
                <span className="flex-1 text-left text-d2-gold font-serif">
                  {t('act', { number: act.number })} ·{' '}
                  {tDataKey(t, act.nameKey)}
                </span>
                <span className="flex items-center gap-2 text-xs">
                  {!actUnlocked && (
                    <span
                      className="text-d2-white/50"
                      aria-label={t('defeatBossToUnlockAct', {
                        boss: gateBossDisplayName(act.number),
                        act: act.number
                      })}
                      title={t('defeatBossToUnlockAct', {
                        boss: gateBossDisplayName(act.number),
                        act: act.number
                      })}
                    >
                      🔒 {t('locked')}
                    </span>
                  )}
                  <span aria-hidden>{isOpen ? '▾' : '▸'}</span>
                </span>
              </button>
              {isOpen && (
                <ul className="border-t border-d2-border divide-y divide-d2-border/50">
                  {act.subAreas.map((sa) => {
                    const unlocked = actUnlocked;
                    const cleared = isSubAreaCleared(sa);
                    const isIdleHere = idleTarget === sa.id || idleTarget === sa.alias;
                    const areaName = tDataKey(t, sa.nameKey);
                    const rowCls = !unlocked
                      ? ''
                      : cleared
                      ? 'opacity-80'
                      : 'border-l-2 border-d2-gold/60';
                    return (
                      <li
                        key={sa.id}
                        className={`px-3 py-2 flex flex-wrap items-center gap-2 ${rowCls}`}
                        data-testid={`sub-area-row-${sa.alias}`}
                        data-cleared={cleared || undefined}
                        data-idle-here={isIdleHere || undefined}
                      >
                        <GameImage
                          src={getZoneArtUrl(act.number)}
                          alt=""
                          fallbackIcon={String(act.number)}
                          size="sm"
                          className="!w-10 !h-8 !rounded"
                        />
                        <div className="flex-1 min-w-[140px]">
                          <div className={`text-sm flex items-center gap-2 ${cleared ? 'text-d2-white/70' : 'text-d2-white'}`}>
                            <span className="truncate">
                              {areaName}
                            </span>
                            {unlocked && cleared && (
                              <span
                                className="text-[10px] uppercase text-d2-set border border-d2-set/60 rounded px-1.5 py-0.5"
                                data-testid={`cleared-badge-${sa.alias}`}
                              >
                                ✓ {t('cleared')}
                              </span>
                            )}
                            {unlocked && !cleared && (
                              <span
                                className="text-[10px] uppercase text-d2-gold/80 border border-d2-gold/50 rounded px-1.5 py-0.5"
                                data-testid={`uncleared-badge-${sa.alias}`}
                              >
                                {t('uncleared')}
                              </span>
                            )}
                            {sa.bossArchetypeId && (
                              <span
                                className="text-[10px] uppercase text-orange-300 border border-orange-400/60 rounded px-1.5 py-0.5"
                                title={bossDisplayName(sa.bossArchetypeId, areaName)}
                                data-testid={`boss-badge-${sa.alias}`}
                              >
                                {t('bossBadge')}
                              </span>
                            )}
                            {sa.difficultyBand !== 'none' && (
                              <span
                                className="text-[10px] uppercase text-red-300 border border-red-400/60 rounded px-1.5 py-0.5"
                                data-testid={`difficulty-badge-${sa.alias}`}
                              >
                                {t(`difficulty.${sa.difficultyBand}`)}
                              </span>
                            )}
                            {isIdleHere && (
                              <span className="text-[10px] uppercase text-d2-white/80 border border-d2-white/40 rounded px-1.5 py-0.5">
                                {t('idleHereShort')}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-d2-white/60">
                            {t('recommendedLevel', { level: sa.recommendedLevel })}
                            {' · '}
                            {t('challengeMonsters', { min: sa.challengeMonsterMin, max: sa.challengeMonsterMax })}
                          </div>
                        </div>
                        {!unlocked ? (
                          <span
                            className="text-xs text-d2-white/50"
                            title={t('defeatBossToUnlockAct', {
                              boss: gateBossDisplayName(act.number),
                              act: act.number
                            })}
                          >
                            🔒 {t('locked')}
                          </span>
                        ) : (
                          <div className="flex gap-2">
                            {isIdleHere ? (
                              // Bug #4 — give the row a clearly-visible
                              // "Stop Farming" toggle so the player can
                              // halt idle without leaving the page.
                              <Button
                                variant="danger"
                                className="min-h-[44px] min-w-[44px] text-sm"
                                onClick={stopFarming}
                                data-testid={`stop-farming-${sa.alias}`}
                                aria-pressed={true}
                              >
                                ⏹ {t('stopFarming')}
                              </Button>
                            ) : !cleared ? (
                              // Bug #5 — idle is unlocked only after the
                              // first clear. Render disabled-with-lock so
                              // layout stays stable.
                              <Button
                                variant="secondary"
                                className="min-h-[44px] min-w-[44px] text-sm opacity-60"
                                onClick={() => { /* disabled */ }}
                                disabled
                                aria-disabled={true}
                                title={t('farmLockedHint')}
                                aria-label={t('farmLockedHint')}
                                data-testid={`farm-locked-${sa.alias}`}
                              >
                                🔒 {t('farmHere')}
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                className="min-h-[44px] min-w-[44px] text-sm"
                                onClick={() => { farmHere(act.number, sa.alias); }}
                                data-testid={`farm-here-${sa.alias}`}
                              >
                                {t('farmHere')}
                              </Button>
                            )}
                            <Button
                              variant="primary"
                              className="min-h-[44px] min-w-[44px] text-sm"
                              onClick={() => { enterArea(act.number, sa.alias); }}
                            >
                              {t('enter')}
                            </Button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>
      <IdleTickerStrip />
    </ScreenShell>
  );
}
