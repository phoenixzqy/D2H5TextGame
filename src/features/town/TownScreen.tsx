/**
 * TownScreen — act-themed hub.
 *
 * Layout:
 *   [ Header: 第 N 章 营地 ]
 *   [ NPC tile grid (mocked) ]
 *   [ Action buttons: Stash / Mercenary / Market ]
 *   [ Set Out (primary) ]
 */
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Panel, ScreenShell } from '@/ui';
import { useMapStore, usePlayerStore } from '@/stores';

interface NPC {
  id: string;
  emoji: string;
  nameKey: string;
}

const NPCS_BY_ACT: Record<number, NPC[]> = {
  1: [
    { id: 'akara', emoji: '🧙‍♀️', nameKey: 'town.npc.akara' },
    { id: 'charsi', emoji: '⚒️', nameKey: 'town.npc.charsi' },
    { id: 'gheed', emoji: '💰', nameKey: 'town.npc.gheed' },
    { id: 'kashya', emoji: '🏹', nameKey: 'town.npc.kashya' },
  ],
};

export function TownScreen() {
  const { t } = useTranslation(['town', 'common']);
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const currentAct = useMapStore((s) => s.currentAct) || 1;
  const npcs = NPCS_BY_ACT[currentAct] ?? NPCS_BY_ACT[1] ?? [];

  return (
    <ScreenShell
      testId="town-screen"
      title={
        <span>
          {t('map:act', { number: currentAct, defaultValue: `第 ${String(currentAct)} 章` })} ·{' '}
          {t('town')}
          {player && <span className="ml-2 text-sm text-d2-white/60">— {player.name}</span>}
        </span>
      }
    >
      <div className="space-y-4 max-w-3xl mx-auto">
        <Panel title={t('npcs')}>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {npcs.map((npc) => (
              <li key={npc.id}>
                <button
                  type="button"
                  className="w-full min-h-[80px] flex flex-col items-center justify-center gap-1
                             border border-d2-border rounded bg-d2-bg/40 hover:border-d2-gold/60
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold p-2"
                  aria-label={t(npc.nameKey, { defaultValue: npc.id })}
                >
                  <span className="text-2xl" aria-hidden>{npc.emoji}</span>
                  <span className="text-xs text-d2-white/80 truncate max-w-full">
                    {t(npc.nameKey, { defaultValue: npc.id })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            variant="secondary"
            className="min-h-[48px]"
            onClick={() => { navigate('/inventory'); }}
          >
            {t('stash')}
          </Button>
          <Button
            variant="secondary"
            className="min-h-[48px]"
            onClick={() => { navigate('/gacha'); }}
          >
            {t('mercenaryRecruiter')}
          </Button>
          <Button
            variant="secondary"
            className="min-h-[48px]"
            onClick={() => { navigate('/inventory'); }}
          >
            {t('market')}
          </Button>
        </div>

        <Button
          variant="primary"
          className="w-full text-lg min-h-[52px]"
          onClick={() => { navigate('/map'); }}
          data-testid="town-set-out"
        >
          {t('setOut')} →
        </Button>
      </div>
    </ScreenShell>
  );
}
