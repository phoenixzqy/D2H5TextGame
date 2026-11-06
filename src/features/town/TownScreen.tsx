import { isCainTownPresent, talkToCain } from '@/features/quests/cainQuestActions';
import { talkToOrmus } from '@/features/quests/ormusQuestActions';
import { talkToFara } from '@/features/quests/faraQuestActions';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
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
import { useInventoryStore, useMapStore, usePlayerStore } from '@/stores';
import { loadTownNpcs } from '@/data/loaders/towns';
import { QuestDeliveryPanel } from './QuestDeliveryPanel';
import { TownRespecPanel } from './TownRespecPanel';
import { QuestServicePanel } from './QuestServicePanel';
import { WarbandEnlistPanel } from './WarbandEnlistPanel';
import { AnyaTradePanel } from './AnyaTradePanel';
import { TownEnlistmentPanel } from './TownEnlistmentPanel';
import { CountedJadeDeliveryPanel } from './CountedJadeDeliveryPanel';
import { CowQuestActionsPanel } from '@/features/quests/CowQuestActionsPanel';
import { TOWN_ENLISTMENTS, type TownEnlistmentKey } from '@/engine/map/town-enlistment-quest';
import { CainIdentifyPanel } from './CainIdentifyPanel';
import { QuestTitleControls } from './QuestTitleControls';
import { Act5QuestActionsPanel } from '@/features/quests/Act5QuestActionsPanel';
import { isAnyaThawed, isAnyaTownPresent } from '@/features/quests/act5QuestActions';

export function TownScreen() {
  const { t } = useTranslation(['town', 'common', 'quests']);
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const currentAct = useMapStore((s) => s.currentAct);
  const recordNpcTalk = useMapStore((s) => s.recordNpcTalk);
  const den = useMapStore((s) => s.questProgress['quests/act1-den-of-evil']);
  useMapStore(s => s.questReceipts);
  useInventoryStore(s => s.questItems);
  const selectedTitle = useMapStore(s => s.selectedTitle);
  useMapStore(s => s.questProgress['quests/act5-prison-of-ice']);
  useMapStore(s => s.questProgress['quests/act1-search-for-cain']);
  const [talkFailure, setTalkFailure] = useState<string | null>(null);
  // Presence comes from the quest graph, including the supported legacy dialogue path.
  const npcs = loadTownNpcs(currentAct).filter(npc => (npc.id !== 'npc/anya' || isAnyaTownPresent()) &&
    (npc.id !== 'npc/cain' || isCainTownPresent()));
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
          {player && <span className="ml-2 text-sm text-d2-white/60">— {player.name}{selectedTitle === 'titles/slayer_of_baal' ? ` · ${t('titles.slayer')}` : selectedTitle === 'titles/worldstone-adapt' ? ` · ${t('titles.riftwalker')}` : ''}</span>}
        </span>
      }
    >
      {/* Zone-art background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <GameImage
          src={getZoneArtUrl(currentAct)}
          alt=""
          fallbackIcon=""
          size="fill"
          className="rounded-none border-0 bg-none"
          imageClassName="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-d2-bg/60 to-d2-bg" />
      </div>

      <div className="space-y-4 max-w-3xl mx-auto">
        <QuestTitleControls />
        <Panel title={t('npcs')}>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {npcs.map((npc) => (
              <li key={npc.id}>
                <button
                  type="button"
                  ref={selectedNpc?.id === npc.id ? conversationTrigger : undefined}
                  className="d2-plaque d2-npc-card w-full min-h-[80px] flex flex-col items-center justify-center gap-1
                             border border-d2-border rounded bg-d2-bg/40 hover:border-d2-gold/60
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-d2-gold p-2"
                  aria-label={t(npc.nameKey)}
                  aria-expanded={selectedNpc?.id === npc.id}
                  aria-controls={selectedNpc?.id === npc.id ? 'town-conversation' : undefined}
                  data-testid={`town-npc-${npc.portraitId}`}
                  onClick={(event) => {
                    try {
                      if (npc.id === 'npc/cain' && currentAct === 1) {
                        const result = talkToCain();
                        setTalkFailure(result === 'ok' || result === 'already-read' ? null : result);
                      } else if (npc.id === 'npc/ormus' && currentAct === 3) {
                        const result = talkToOrmus();
                        setTalkFailure(result === 'ok' || result === 'already-read' || result === 'not-eligible' ? null : result);
                      } else if (npc.id === 'npc/fara' && currentAct === 2) {
                        const result = talkToFara();
                        setTalkFailure(result === 'ok' || result === 'already-talked' || result === 'not-eligible' ? null : result);
                      } else { recordNpcTalk(npc.id); setTalkFailure(null); }
                    } catch (error) {
                      if (error instanceof AggregateError) setTalkFailure('restoration-failed');
                      else if (error instanceof WaveGuardError || error instanceof RecordedWaveAccessError) setTalkFailure('busy');
                      else throw error;
                    }
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

        {talkFailure && <p role="alert" className="text-sm text-d2-white/90">{t(`quests:areaObjects.feedback.${talkFailure}`)}</p>}
        {selectedNpc && (
          <section
            id="town-conversation"
            data-testid="town-conversation"
            aria-labelledby="town-conversation-title"
            className="d2-surface rounded border border-d2-border bg-d2-panel p-4 space-y-3"
          >
            <h3 id="town-conversation-title" className="d2-section-title text-d2-gold font-semibold">
              {t(selectedNpc.nameKey)}
            </h3>
            <div role="status" aria-live="polite" data-testid="town-greeting" className="space-y-2 text-sm text-d2-white/90">
              <p>{t([`dialogue.greetings.act${String(currentAct)}.${selectedNpc.portraitId}`, `dialogue.greetings.${selectedNpc.portraitId}`])}</p>
              {selectedNpc.id === 'npc/anya' && !isAnyaThawed() && <p>{t('dialogue.legacyAnya')}</p>}
              {selectedNpc.id === 'npc/akara' && <p>{t(`dialogue.den.${denCopy}`)}</p>}
            </div>
            <QuestDeliveryPanel key={`${String(currentAct)}:${selectedNpc.id}`} npcId={selectedNpc.id} />
            {currentAct === 3 && selectedNpc.id === 'npc/meshif' && <CountedJadeDeliveryPanel />}
            {currentAct === 1 && selectedNpc.id === 'npc/akara' && <CowQuestActionsPanel context="town" />}
            <Act5QuestActionsPanel key={`actions:${String(currentAct)}:${selectedNpc.id}`} npcId={selectedNpc.id} />
            <TownRespecPanel key={`reset:${String(currentAct)}:${selectedNpc.id}`} npcId={selectedNpc.id} />
            <QuestServicePanel key={`services:${String(currentAct)}:${selectedNpc.id}`} npcId={selectedNpc.id} />
            {currentAct === 5 && selectedNpc.id === 'npc/qual-kehk' && <WarbandEnlistPanel />}
            {currentAct === 5 && selectedNpc.id === 'npc/anya' && <AnyaTradePanel />}
            {(Object.keys(TOWN_ENLISTMENTS) as TownEnlistmentKey[]).map(key => {
              const contract = TOWN_ENLISTMENTS[key];
              return contract.actId === `acts/act${String(currentAct)}` && contract.npc === selectedNpc.id
                ? <TownEnlistmentPanel key={key} enlistmentKey={key} /> : null;
            })}
            <CainIdentifyPanel key={`identify:${String(currentAct)}:${selectedNpc.id}`} npcId={selectedNpc.id} />
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
