/**
 * TownScreen — act-themed hub.
 *
 * Layout:
 *   [ Header: 第 N 章 营地 ]
 *   [ Authored NPC tile grid / inline conversation ]
 *   [ Action buttons: Stash / Mercenary / Market ]
 *   [ Set Out (primary) ]
 */
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Panel, ScreenShell, GameImage, getZoneArtUrl, getNpcPortraitUrl } from '@/ui';
import { useMapStore, usePlayerStore } from '@/stores';
import { loadTownNpcs } from '@/data/loaders/towns';
import { QuestDeliveryPanel } from './QuestDeliveryPanel';

export function TownScreen() {
  const { t } = useTranslation(['town', 'common']);
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const currentAct = useMapStore((s) => s.currentAct);
  const recordNpcTalk = useMapStore((s) => s.recordNpcTalk);
  const den = useMapStore((s) => s.questProgress['quests/act1-den-of-evil']);
  const npcs = loadTownNpcs(currentAct);
  const [selection, setSelection] = useState<{ act: number; npcId: string } | null>(null);
  const conversationTrigger = useRef<HTMLButtonElement | null>(null);
  // Town can stay mounted while the current act changes. Never retain another act's NPC.
  const selectedNpc = selection?.act === currentAct
    ? npcs.find((npc) => npc.id === selection.npcId)
    : undefined;
  const denCopy = den?.rewardClaimed ? 'claimed'
    : den?.status === 'completed' ? 'readyToClaim'
      : den?.status === 'inProgress' ? 'preclear' : 'untracked';

  return (
    <ScreenShell
      testId="town-screen"
      title={
        <span>
          {t('map:act', { number: currentAct })} ·{' '}
          {t('town')}
          {player && <span className="ml-2 text-sm text-d2-white/60">— {player.name}</span>}
        </span>
      }
    >
      {/* Zone-art background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <img
          src={getZoneArtUrl(currentAct)}
          alt=""
          className="w-full h-full object-cover opacity-20"
          loading="lazy"
          decoding="async"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-d2-bg/60 to-d2-bg" />
      </div>

      <div className="space-y-4 max-w-3xl mx-auto">
        <Panel title={t('npcs')}>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {npcs.map((npc) => (
              <li key={npc.id}>
                <button
                  type="button"
                  ref={selectedNpc?.id === npc.id ? conversationTrigger : undefined}
                  className="w-full min-h-[80px] flex flex-col items-center justify-center gap-1
                             border border-d2-border rounded bg-d2-bg/40 hover:border-d2-gold/60
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold p-2"
                  aria-label={t(npc.nameKey)}
                  aria-expanded={selectedNpc?.id === npc.id}
                  aria-controls={selectedNpc?.id === npc.id ? 'town-conversation' : undefined}
                  data-testid={`town-npc-${npc.portraitId}`}
                  onClick={(event) => {
                    recordNpcTalk(npc.id);
                    setSelection({ act: currentAct, npcId: npc.id });
                    event.currentTarget.focus();
                  }}
                >
                  <GameImage
                    src={getNpcPortraitUrl(npc.portraitId, currentAct)}
                    alt={t(npc.nameKey)}
                    fallbackIcon="💬"
                    size="md"
                  />
                  <span className="text-xs text-d2-white/80 truncate max-w-full">
                    {t(npc.nameKey)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {npcs.length === 0 && <p className="text-sm text-d2-white/70">{t('noNpcs')}</p>}
        </Panel>

        {selectedNpc && (
          <section
            id="town-conversation"
            data-testid="town-conversation"
            aria-labelledby="town-conversation-title"
            className="rounded border border-d2-border bg-d2-panel p-4 space-y-3"
          >
            <h3 id="town-conversation-title" className="text-d2-gold font-semibold">
              {t(selectedNpc.nameKey)}
            </h3>
            <div role="status" aria-live="polite" className="space-y-2 text-sm text-d2-white/90">
              <p>{t(`dialogue.greetings.${selectedNpc.portraitId}`)}</p>
              {selectedNpc.id === 'npc/akara' && <p>{t(`dialogue.den.${denCopy}`)}</p>}
            </div>
            <QuestDeliveryPanel key={`${String(currentAct)}:${selectedNpc.id}`} npcId={selectedNpc.id} />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="min-h-[44px] min-w-[44px]"
                data-testid="town-conversation-quests"
                onClick={() => { navigate('/quests'); }}
              >
                {t('quests')}
              </Button>
              <Button
                variant="secondary"
                className="min-h-[44px] min-w-[44px]"
                data-testid="town-conversation-close"
                onClick={() => {
                  setSelection(null);
                  conversationTrigger.current?.focus();
                }}
              >
                {t('close')}
              </Button>
            </div>
          </section>
        )}

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
            onClick={() => { navigate('/mercs'); }}
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
