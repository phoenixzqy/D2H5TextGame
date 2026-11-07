/**
 * QuestsScreen — real quests grouped by act.
 *
 * Layout (mobile-first 360×640):
 *   [tabs: main | side | bounty]
 *   ── Act I ────────────────
 *     [QuestCard]
 *     [QuestCard]
 *   ── Act II ───────────────
 *     ...
 *
 * Source: `loadQuestsByAct()` (reads `src/data/quests/{main,side}.json`).
 * Progress: `useMapStore.questProgress` (id → { status, objectives }).
 *
 * No business logic in this component — quest definitions and progress are
 * pulled via loaders/stores; rendering only.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Panel, ScreenShell, Tabs, Modal, tDataKey } from '@/ui';
import { PagedList } from '@/ui/PagedList';
import { loadUniques } from '@/data/loaders/loot';
import { loadQuestItems } from '@/data/loaders/quest-items';
import { loadQuestUniqueProfile } from '@/data/loaders/quest-rewards';
import { isQuestResistanceReward } from '@/engine/progression/quest-resistance';
import { ORMUS } from '@/engine/map/ormus-quest';
import { WARBAND } from '@/engine/map/warband-quest';
import { TOWN_ENLISTMENTS } from '@/engine/map/town-enlistment-quest';
import { findCountedQuestById } from '@/data/loaders/counted-quest-items';
import { countedQuestCounters } from './countedQuestActions';
import { hasCountedSourceClaimCompletion } from './countedQuestClaim';
import { CowQuestActionsPanel } from './CowQuestActionsPanel';
import { COW } from '@/engine/map/cow-quest';
import { ANYA } from '@/engine/map/anya-quest';
import { loadAnyaUniqueCatalog } from '@/data/loaders/anya-vendor';
import { findRegionalBounty } from '@/engine/map/regional-bounties';
import { RegionalBountyCard } from './RegionalBountyCard';
import { QuestRewardIcon } from './QuestRewardIcon';
import { useInventoryStore, useMapStore } from '@/stores';
import { claimQuestReward, canClaim, type ClaimResult } from './claimReward';
import { startQuest as activateQuest } from './startQuest';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import {
  loadQuestsByAct,
  questI18nKey,
  actNumber,
  type QuestDef,
  type QuestType
} from '@/data/loaders/quests';

type QuestStatus = 'locked' | 'available' | 'inProgress' | 'completed';

const ACT_ORDER: readonly string[] = [
  'acts/act1',
  'acts/act2',
  'acts/act3',
  'acts/act4',
  'acts/act5'
];

export function QuestsScreen() {
  const { t } = useTranslation(['quests', 'common']);
  const questProgress = useMapStore((s) => s.questProgress);
  useMapStore((s) => s.clearedSubAreas);
  // Claim eligibility also depends on retained source proof and owned/consumed items.
  useMapStore((s) => s.questReceipts);
  useInventoryStore((s) => s.questItems);

  const byAct = useMemo(() => loadQuestsByAct(), []);

  const currentAct = useMapStore((s) => s.currentAct);
  const [selectedAct, setSelectedAct] = useState(`acts/act${String(currentAct)}`);
  const [selectedQuest, setSelectedQuest] = useState<QuestDef | null>(null);

  const renderType = (type: QuestType) => {
    const quests = (byAct.get(selectedAct) ?? []).filter(
      (q) =>
        q.type === type &&
        (!findRegionalBounty(q.id) ||
          useMapStore.getState().isAreaUnlocked(Number(actNumber(q.actId))))
    );
    return (
      <PagedList
        key={`${selectedAct}:${type}`}
        items={quests}
        empty={<p className="p-4 text-d2-white/60">{t('empty')}</p>}
        renderItem={(q) => (
          <li key={q.id}>
            <button
              type="button"
              className="d2-plaque flex min-h-16 w-full items-center justify-between gap-3 rounded border border-d2-border p-3 text-left hover:border-d2-gold focus-visible:ring-2 focus-visible:ring-d2-gold"
              onClick={() => {
                setSelectedQuest(q);
              }}
              data-testid={`quest-summary-${q.id}`}
            >
              <span className="min-w-0 font-serif text-d2-gold">
                {t(`byId.${questI18nKey(q.id)}.name`, { defaultValue: q.name })}
              </span>
              <StatusBadge status={resolveStatus(q, questProgress)} />
            </button>
          </li>
        )}
      />
    );
  };

  const selectedBounty = selectedQuest ? findRegionalBounty(selectedQuest.id) : undefined;
  return (
    <ScreenShell testId="quests-screen" title={t('title')}>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col gap-2">
        <label className="flex shrink-0 items-center gap-3 text-d2-gold">
          <span>{t('map:act', { number: actNumber(selectedAct) })}</span>
          <select
            aria-label={t('map:worldMap')}
            value={selectedAct}
            onChange={(event) => {
              setSelectedAct(event.target.value);
            }}
            className="d2-control min-h-11 min-w-0 flex-1 rounded border border-d2-border bg-d2-bg px-3"
          >
            {ACT_ORDER.map((actId) => (
              <option key={actId} value={actId}>
                {t(`act.${actNumber(actId)}`)}
              </option>
            ))}
          </select>
        </label>
        <Tabs
          tabs={[
            { id: 'main', label: t('main'), content: renderType('main') },
            { id: 'side', label: t('side'), content: renderType('side') },
            { id: 'bounty', label: t('bounty'), content: renderType('bounty') }
          ]}
          defaultTab="main"
        />
      </div>
      <Modal
        isOpen={selectedQuest !== null}
        onClose={() => {
          setSelectedQuest(null);
        }}
        title={t('title')}
      >
        {selectedQuest &&
          (selectedBounty ? (
            <RegionalBountyCard
              key={selectedQuest.id}
              quest={selectedQuest}
              definition={selectedBounty}
            />
          ) : (
            <QuestCard
              key={selectedQuest.id}
              quest={selectedQuest}
              status={resolveStatus(selectedQuest, questProgress)}
            />
          ))}
      </Modal>
    </ScreenShell>
  );
}

function resolveStatus(
  quest: QuestDef,
  progress: Record<string, { status: QuestStatus; objectives: Record<string, boolean> }>
): QuestStatus {
  const stored = progress[quest.id];
  if (stored) return stored.status;
  // Default: locked if a prereq isn't completed; available otherwise.
  if (quest.prerequisites && quest.prerequisites.length > 0) {
    const allDone = quest.prerequisites.every((pid) => progress[pid]?.status === 'completed');
    return allDone ? 'available' : 'locked';
  }
  return 'available';
}

function QuestCard({ quest, status }: { quest: QuestDef; status: QuestStatus }) {
  const { t } = useTranslation(['quests', 'common', 'items', 'inventory']);
  const slug = questI18nKey(quest.id);
  // Quest data files ship with English `name`, `description`, and per-objective
  // `description` strings; locale files override by slug. When the slug has no
  // matching locale entry (e.g. the JSON id `act1-sisters-burial-grounds`
  // doesn't match the locale's `act1-sisters-burial`), fall back to the
  // English text from the data file rather than rendering the literal key.
  const name = t(`byId.${slug}.name`, { defaultValue: quest.name });
  const desc = t(`byId.${slug}.desc`, { defaultValue: quest.description });
  const rewardClaimed = useMapStore((s) => s.questProgress[quest.id]?.rewardClaimed ?? false);
  const [, force] = useState(0);
  const [feedback, setFeedback] = useState('');
  const claimable = status === 'completed' && !rewardClaimed && canClaim(quest.id);
  const counted = findCountedQuestById(quest.id);
  const counts = counted ? countedQuestCounters(counted.key) : undefined;
  const countedComplete =
    counted !== undefined && (rewardClaimed || hasCountedSourceClaimCompletion(quest.id));
  const startQuest = (): void => {
    try {
      const result = activateQuest(quest.id);
      setFeedback(
        t(
          result === 'ok'
            ? 'feedback.started'
            : result === 'not-eligible' || result === 'unknown-quest' || result === 'grant-failed'
              ? `feedback.start.${result}`
              : `inventory:questItems.feedback.${result}`
        )
      );
    } catch (error) {
      setFeedback(
        t(
          error instanceof AggregateError
            ? 'feedback.start.restoration-failed'
            : `inventory:questItems.feedback.${
                error instanceof WaveGuardError || error instanceof RecordedWaveAccessError
                  ? 'busy'
                  : 'action-failed'
              }`
        )
      );
    }
  };
  const claim = (): void => {
    try {
      const result = claimQuestReward(quest.id);
      setFeedback(t(claimFeedbackKey(result)));
      if (result === 'ok') force((n) => n + 1);
    } catch (error) {
      setFeedback(
        t(
          `inventory:questItems.feedback.${
            error instanceof AggregateError ? 'restoration-failed' : 'action-failed'
          }`
        )
      );
    }
  };

  return (
    <Panel
      className={status === 'completed' ? 'border-d2-set' : ''}
      data-testid={`quest-${quest.id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="d2-section-title font-serif text-d2-gold text-sm sm:text-base">{name}</h3>
        <StatusBadge status={status} />
      </div>
      <p className="text-sm text-d2-white/70 mb-2">{desc}</p>
      <div className="text-sm">
        <div className="text-d2-white/60 mb-1">{t('objectives')}</div>
        <ul className="list-disc list-inside space-y-0.5 mb-2">
          {quest.objectives.map((o, i) => {
            const objKey = `byId.${slug}.obj${String(i + 1)}`;
            const done = counted
              ? countedComplete
              : (quest.id !== ORMUS.quest && status === 'completed') ||
                Boolean(useMapStore.getState().questProgress[quest.id]?.objectives[o.id]);
            return (
              <li key={o.id} className={done ? 'line-through text-d2-set' : ''}>
                {t(objKey, { defaultValue: o.description })}
                {typeof o.count === 'number' ? ` (×${String(o.count)})` : ''}
              </li>
            );
          })}
        </ul>
        {quest.id === COW.quest && <CowQuestActionsPanel context="journal" />}
        {counted && counts && (
          <div
            className="mb-3 space-y-1 break-words"
            data-testid={`counted-journal-${counted.key}`}
          >
            <p role="status" aria-live="polite" className="text-sm text-d2-gold">
              {t('counted.progress', { ...counts })}
            </p>
            <p className="text-sm text-d2-white/90">
              {t(
                rewardClaimed
                  ? 'counted.claimed'
                  : counted.key === 'jade'
                    ? 'counted.jade.journal'
                    : 'counted.exchange'
              )}
            </p>
            {status === 'completed' && !rewardClaimed && !countedComplete && (
              <p className="text-sm text-d2-white/90">{t('counted.repair')}</p>
            )}
          </div>
        )}
        {quest.rewards && Object.keys(quest.rewards).length > 0 && (
          <>
            <div className="text-d2-white/60 mb-1">{t('rewards')}</div>
            <ul className="flex flex-wrap gap-1.5 mb-2">
              {Object.entries(quest.rewards)
                // Settlement ignores the legacy zero-Gold compatibility field.
                .filter(([kind, amount]) => kind !== 'gold' || amount !== 0)
                .map(([k, v]) => (
                  <li
                    key={k}
                    className="d2-tag border border-d2-border rounded px-2 py-0.5 bg-d2-bg/40"
                  >
                    <QuestRewardIcon kind={k} />
                    {formatReward(k, v, t, quest.id)}
                  </li>
                ))}
            </ul>
            {quest.unlocks === 'difficulty/nightmare' && (
              <p className="mb-2 text-sm text-d2-white/90">
                {t('rewardValue.difficulty_nightmare')}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {status === 'available' && (
                <Button
                  variant="secondary"
                  className="min-h-[44px] text-sm"
                  onClick={startQuest}
                  data-testid={`quest-start-${quest.id}`}
                >
                  {t('startQuest')}
                </Button>
              )}
              {status === 'inProgress' && (
                <Button
                  variant="secondary"
                  className="min-h-[44px] text-sm"
                  onClick={startQuest}
                  data-testid={`quest-progress-${quest.id}`}
                >
                  {t('viewProgress')}
                </Button>
              )}
              {status === 'locked' && (
                <Button
                  variant="secondary"
                  className="min-h-[44px] text-sm"
                  disabled
                  data-testid={`quest-locked-${quest.id}`}
                >
                  {t('locked')}
                </Button>
              )}
              {status === 'completed' && (
                <Button
                  variant="primary"
                  className="min-h-[44px] text-xs"
                  disabled={!claimable}
                  onClick={claim}
                  data-testid={`quest-claim-${quest.id}`}
                >
                  {rewardClaimed ? t('rewardClaimed') : t('claimReward')}
                </Button>
              )}
            </div>
            {feedback ? (
              <p
                role="status"
                className="mt-2 text-xs text-d2-gold/90"
                data-testid={`quest-feedback-${quest.id}`}
              >
                {feedback}
              </p>
            ) : null}
          </>
        )}
      </div>
    </Panel>
  );
}

function formatReward(
  k: string,
  v: unknown,
  t: ReturnType<typeof useTranslation<'quests'>>['t'],
  questId: string
): string {
  if (k === 'questItem') {
    const item = loadQuestItems().find((row) => row.id === v && row.sourceQuestId === questId);
    if (item && item.kind === undefined && item.effect.maxLife !== undefined) {
      return t('rewardLabel.lifePotion', {
        item: tDataKey(t, item.nameKey),
        maxLife: item.effect.maxLife
      });
    }
    if (item && item.kind === undefined && item.effect.allResist !== undefined) {
      return t('rewardLabel.resistanceScroll', {
        item: tDataKey(t, item.nameKey),
        all: item.effect.allResist
      });
    }
    return item ? tDataKey(t, item.nameKey) : t('inventory:questItems.title');
  }
  if (k === 'xp' && typeof v === 'number') return `${String(v)} ${t('rewardLabel.xp')}`;
  if (k === 'gemShards' && typeof v === 'number')
    return `${String(v)} ${t('rewardLabel.gemShards')}`;
  if (k === 'wishstones' && typeof v === 'number') return `${String(v)} ${t('gacha:wishstones')}`;
  if (k === 'vendorUnlock' && questId === ANYA.quest && v === ANYA.vendorId) {
    return t('rewardLabel.anyaCatalog', {
      items: loadAnyaUniqueCatalog()
        .entries.map((entry) => t(`items:unique.${entry.id}.name`))
        .join(' / ')
    });
  }
  if (k === 'runeShards' && typeof v === 'number') return t('rewardLabel.runeShards', { count: v });
  if (k === 'gold' && typeof v === 'number') return `${String(v)} ${t('rewardLabel.gold')}`;
  if (k === 'skillPoints' && typeof v === 'number')
    return `+${String(v)} ${t('rewardLabel.skillPoint')}`;
  if (k === 'statPoints' && typeof v === 'number')
    return `+${String(v)} ${t('rewardLabel.statPoint')}`;
  if (k === 'mercenaryUnlock' && questId === WARBAND.quest && v === WARBAND.mercId)
    return t('rewardLabel.warbandEnsureOwned');
  if (k === 'mercenaryUnlock') {
    const contract = Object.values(TOWN_ENLISTMENTS).find(
      (row) => row.quest === questId && row.mercId === v
    );
    if (contract)
      return t('rewardLabel.townEnlistmentEnsureOwned', {
        name: t(`mercs:byId.${contract.mercId.slice('mercs/'.length)}.name`)
      });
  }
  if (k === 'mercenaryUnlock' && typeof v === 'string')
    return `${t('rewardLabel.mercenaryUnlock')}: ${formatRewardValue(v, t)}`;
  if (k === 'service' && typeof v === 'string') return formatRewardValue(v, t);
  if (k === 'title' && typeof v === 'string') return formatRewardValue(v, t);
  if (k === 'itemDrop' && typeof v === 'string') return formatRewardValue(v, t);
  if (k === 'itemDrop' && typeof v === 'object' && v !== null && 'profileId' in v) {
    return t(
      v.profileId === loadQuestUniqueProfile().id
        ? 'rewardLabel.uniqueRing'
        : 'rewardLabel.uniqueItem'
    );
  }
  if (k === 'itemDrop' && typeof v === 'object' && v !== null && 'uniqueId' in v) {
    const matches = loadUniques().filter((unique) => unique.id === v.uniqueId);
    const template = matches.length === 1 ? matches[0] : undefined;
    return template ? tDataKey(t, template.name) : t('rewardLabel.uniqueItem');
  }
  if (k === 'lootTable' && typeof v === 'string') return formatRewardValue(v, t);
  if (k === 'lootTable' && typeof v === 'object' && v !== null)
    return t(
      findCountedQuestById(questId)?.key === 'jamella'
        ? 'rewardLabel.perfectGem'
        : 'rewardLabel.rewardCache'
    );
  if (k === 'areaUnlock' && typeof v === 'string') return formatRewardValue(v, t);
  if (k === 'npcUnlock' && typeof v === 'string') return formatRewardValue(v, t);
  if (k === 'stat' && isQuestResistanceReward(v))
    return t('rewardLabel.permanentResistance', { fire: v.fire_resist, cold: v.cold_resist });
  if (k === 'stat' && findCountedQuestById(questId)?.key === 'malah')
    return t('rewardLabel.elixirVitality');
  if (
    k === 'stat' &&
    typeof v === 'object' &&
    v !== null &&
    'all_resist' in v &&
    typeof v.all_resist === 'number'
  )
    return t('rewardLabel.allResistance', { all: v.all_resist });
  if (k === 'stat' && typeof v === 'object' && v !== null) return `+${JSON.stringify(v)}`;
  return `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`;
}

function formatRewardValue(
  value: string,
  t: ReturnType<typeof useTranslation<'quests'>>['t']
): string {
  return t(`rewardValue.${value.replace(/[/.]/g, '_')}`, { defaultValue: humanizeRewardId(value) });
}

function claimFeedbackKey(result: ClaimResult): string {
  return `feedback.claim.${result}`;
}

function humanizeRewardId(value: string): string {
  const lastSegment = value.split('/').pop() ?? value;
  return lastSegment.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function StatusBadge({ status }: { status: QuestStatus }) {
  const { t } = useTranslation('quests');
  const map: Record<QuestStatus, { label: string; cls: string }> = {
    inProgress: { label: t('inProgress'), cls: 'text-d2-rare border-d2-rare/60' },
    completed: { label: t('completed'), cls: 'text-d2-set border-d2-set/60' },
    locked: { label: t('locked'), cls: 'text-d2-white/70 border-d2-border' },
    available: { label: t('available'), cls: 'text-d2-gold border-d2-gold/60' }
  };
  const m = map[status];
  return (
    <span
      className={`d2-tag text-sm uppercase tracking-wide border rounded px-2 py-0.5 whitespace-nowrap ${m.cls}`}
    >
      {m.label}
    </span>
  );
}
