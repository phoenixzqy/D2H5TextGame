/**
 * MapScreen — pick an act and a sub-area.
 *
 * Layout:
 *   [ Acts collapsible list (I–V) ]
 *     [ sub-area row × N: name, rec lvl, lock badge, [Farm] [Enter] ]
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Panel, ScreenShell, GameImage, getZoneArtUrl, tDataKey } from '@/ui';
import { useMapStore, useMetaStore } from '@/stores';
import { resolveSubArea } from '@/stores/subAreaResolver';
import { IdleTickerStrip } from '@/features/idle/IdleTickerStrip';

interface SubArea {
  id: string;
  nameKey: string;
  recommendedLevel: number;
  unlockedByDefault?: boolean;
}

interface Act {
  number: number;
  nameKey: string;
  unlockedByDefault?: boolean;
  subAreas: SubArea[];
}

const ACTS: Act[] = [
  {
    number: 1,
    nameKey: 'map.actName.1',
    unlockedByDefault: true,
    subAreas: [
      { id: 'a1-blood-moor', nameKey: 'map.subArea.a1-blood-moor', recommendedLevel: 1, unlockedByDefault: true },
      { id: 'a1-cold-plains', nameKey: 'map.subArea.a1-cold-plains', recommendedLevel: 5 },
      { id: 'a1-stony-field', nameKey: 'map.subArea.a1-stony-field', recommendedLevel: 8 },
      { id: 'a1-dark-wood', nameKey: 'map.subArea.a1-dark-wood', recommendedLevel: 12 },
      { id: 'a1-tristram', nameKey: 'map.subArea.a1-tristram', recommendedLevel: 15 },
    ],
  },
  {
    number: 2,
    nameKey: 'map.actName.2',
    subAreas: [
      { id: 'a2-rocky-waste', nameKey: 'map.subArea.a2-rocky-waste', recommendedLevel: 16 },
      { id: 'a2-dry-hills', nameKey: 'map.subArea.a2-dry-hills', recommendedLevel: 20 },
    ],
  },
  {
    number: 3,
    nameKey: 'map.actName.3',
    subAreas: [
      { id: 'a3-spider-forest', nameKey: 'map.subArea.a3-spider-forest', recommendedLevel: 24 },
      { id: 'a3-flayer-jungle', nameKey: 'map.subArea.a3-flayer-jungle', recommendedLevel: 28 },
    ],
  },
  {
    number: 4,
    nameKey: 'map.actName.4',
    subAreas: [
      { id: 'a4-outer-steppes', nameKey: 'map.subArea.a4-outer-steppes', recommendedLevel: 32 },
      { id: 'a4-river-of-flame', nameKey: 'map.subArea.a4-river-of-flame', recommendedLevel: 35 },
    ],
  },
  {
    number: 5,
    nameKey: 'map.actName.5',
    subAreas: [
      { id: 'a5-bloody-foothills', nameKey: 'map.subArea.a5-bloody-foothills', recommendedLevel: 38 },
      { id: 'a5-worldstone-keep', nameKey: 'map.subArea.a5-worldstone-keep', recommendedLevel: 45 },
    ],
  },
];

export function MapScreen() {
  const { t } = useTranslation(['map', 'common']);
  const navigate = useNavigate();
  const setLocation = useMapStore((s) => s.setCurrentLocation);
  const isActUnlocked = useMapStore((s) => s.isActUnlocked);
  const clearedSubAreas = useMapStore((s) => s.clearedSubAreas);
  const setIdleTarget = useMetaStore((s) => s.setIdleTarget);
  const idleTarget = useMetaStore((s) => s.idleState.idleTarget);

  const [openAct, setOpenAct] = useState<number>(1);

  const enterArea = (act: number, subId: string) => {
    setLocation(act, subId);
    navigate('/combat');
  };
  const farmHere = (act: number, subId: string) => {
    setLocation(act, subId);
    setIdleTarget(subId);
  };
  const stopFarming = () => { setIdleTarget(undefined); };

  /**
   * Bugs #3 & #5 — `clearedSubAreas` stores canonical plan ids
   * (e.g. `areas/act1-blood-moor`) emitted by the engine, while this
   * screen's UI ids are aliases (e.g. `a1-blood-moor`). Resolve through
   * subAreaResolver so the cleared-badge + idle gate compare apples to
   * apples.
   */
  const isSubAreaCleared = (act: number, alias: string): boolean => {
    if (clearedSubAreas.includes(alias)) return true;
    const def = resolveSubArea(act, alias);
    return def !== null && clearedSubAreas.includes(def.id);
  };

  const idleAreaName = idleTarget
    ? t(`subArea.${idleTarget}`)
    : null;

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
                    <span className="text-d2-white/50" aria-label={t('locked')}>
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
                    const cleared = isSubAreaCleared(act.number, sa.id);
                    const isIdleHere = idleTarget === sa.id;
                    const rowCls = !unlocked
                      ? ''
                      : cleared
                      ? 'opacity-80'
                      : 'border-l-2 border-d2-gold/60';
                    return (
                      <li
                        key={sa.id}
                        className={`px-3 py-2 flex flex-wrap items-center gap-2 ${rowCls}`}
                        data-testid={`sub-area-row-${sa.id}`}
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
                              {tDataKey(t, sa.nameKey)}
                            </span>
                            {unlocked && cleared && (
                              <span
                                className="text-[10px] uppercase text-d2-set border border-d2-set/60 rounded px-1.5 py-0.5"
                                data-testid={`cleared-badge-${sa.id}`}
                              >
                                ✓ {t('cleared')}
                              </span>
                            )}
                            {unlocked && !cleared && (
                              <span
                                className="text-[10px] uppercase text-d2-gold/80 border border-d2-gold/50 rounded px-1.5 py-0.5"
                                data-testid={`uncleared-badge-${sa.id}`}
                              >
                                {t('uncleared')}
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
                          </div>
                        </div>
                        {!unlocked ? (
                          <span className="text-xs text-d2-white/50">🔒 {t('locked')}</span>
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
                                data-testid={`stop-farming-${sa.id}`}
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
                                data-testid={`farm-locked-${sa.id}`}
                              >
                                🔒 {t('farmHere')}
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                className="min-h-[44px] min-w-[44px] text-sm"
                                onClick={() => { farmHere(act.number, sa.id); }}
                                data-testid={`farm-here-${sa.id}`}
                              >
                                {t('farmHere')}
                              </Button>
                            )}
                            <Button
                              variant="primary"
                              className="min-h-[44px] min-w-[44px] text-sm"
                              onClick={() => { enterArea(act.number, sa.id); }}
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
