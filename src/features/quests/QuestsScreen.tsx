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
import { Button, Panel, ScreenShell, Tabs } from '@/ui';
import { useMapStore } from '@/stores';
import { claimQuestReward, canClaim, type ClaimResult } from './claimReward';
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

  const byAct = useMemo(() => loadQuestsByAct(), []);

  const renderType = (type: QuestType) => {
    const acts = ACT_ORDER.filter((actId) => byAct.has(actId));
    const sections = acts
      .map((actId) => {
        const quests = (byAct.get(actId) ?? []).filter((q) => q.type === type);
        return { actId, quests };
      })
      .filter((s) => s.quests.length > 0);

    if (sections.length === 0) {
      return (
        <p className="text-sm text-d2-white/60 italic p-4 text-center">{t('empty')}</p>
      );
    }

    return (
      <div className="space-y-4">
        {sections.map(({ actId, quests }) => (
          <section key={actId} aria-labelledby={`hdr-${actId}`}>
            <h2
              id={`hdr-${actId}`}
              className="text-sm font-serif text-d2-gold/80 mb-2 border-b border-d2-border pb-1"
            >
              {t(`act.${actNumber(actId)}`)}
            </h2>
            <ul className="space-y-2">
              {quests.map((q) => (
                <li key={q.id}>
                  <QuestCard quest={q} status={resolveStatus(q, questProgress)} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  };

  return (
    <ScreenShell testId="quests-screen" title={t('title')}>
      <div className="max-w-3xl mx-auto">
        <Tabs
          tabs={[
            { id: 'main', label: t('main'), content: renderType('main') },
            { id: 'side', label: t('side'), content: renderType('side') },
            { id: 'bounty', label: t('bounty'), content: renderType('bounty') }
          ]}
          defaultTab="main"
        />
      </div>
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
    const allDone = quest.prerequisites.every(
      (pid) => progress[pid]?.status === 'completed'
    );
    return allDone ? 'available' : 'locked';
  }
  return 'available';
}

function QuestCard({ quest, status }: { quest: QuestDef; status: QuestStatus }) {
  const { t } = useTranslation(['quests', 'common']);
  const slug = questI18nKey(quest.id);
  // Quest data files ship with English `name`, `description`, and per-objective
  // `description` strings; locale files override by slug. When the slug has no
  // matching locale entry (e.g. the JSON id `act1-sisters-burial-grounds`
  // doesn't match the locale's `act1-sisters-burial`), fall back to the
  // English text from the data file rather than rendering the literal key.
  const name = t(`byId.${slug}.name`, { defaultValue: quest.name });
  const desc = t(`byId.${slug}.desc`, { defaultValue: quest.description });
  const rewardClaimed = useMapStore((s) => s.questProgress[quest.id]?.rewardClaimed ?? false);
  const updateQuestProgress = useMapStore((s) => s.updateQuestProgress);
  const [, force] = useState(0);
  const [feedback, setFeedback] = useState('');
  const claimable = status === 'completed' && !rewardClaimed && canClaim(quest.id);
  const startQuest = (): void => {
    if (status !== 'available') {
      setFeedback(t(`feedback.${status}`));
      return;
    }
    updateQuestProgress(quest.id, {
      status: 'inProgress',
      objectives: Object.fromEntries(quest.objectives.map((objective) => [objective.id, false]))
    });
    setFeedback(t('feedback.started'));
  };
  const claim = (): void => {
    const result = claimQuestReward(quest.id);
    setFeedback(t(claimFeedbackKey(result)));
    if (result === 'ok') force((n) => n + 1);
  };

  return (
    <Panel
      className={
        status === 'locked'
          ? 'opacity-60'
          : status === 'completed'
          ? 'border-d2-set'
          : ''
      }
      data-testid={`quest-${quest.id}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-serif text-d2-gold text-sm sm:text-base">{name}</h3>
        <StatusBadge status={status} />
      </div>
      <p className="text-xs text-d2-white/70 mb-2">{desc}</p>
      <div className="text-xs">
        <div className="text-d2-white/60 mb-1">{t('objectives')}</div>
        <ul className="list-disc list-inside space-y-0.5 mb-2">
          {quest.objectives.map((o, i) => {
            const objKey = `byId.${slug}.obj${String(i + 1)}`;
            const done =
              status === 'completed' ||
              Boolean(
                useMapStore.getState().questProgress[quest.id]?.objectives[o.id]
              );
            return (
              <li key={o.id} className={done ? 'line-through text-d2-set' : ''}>
                {t(objKey, { defaultValue: o.description })}
                {typeof o.count === 'number' ? ` (×${String(o.count)})` : ''}
              </li>
            );
          })}
        </ul>
        {quest.rewards && Object.keys(quest.rewards).length > 0 && (
          <>
            <div className="text-d2-white/60 mb-1">{t('rewards')}</div>
            <ul className="flex flex-wrap gap-1.5 mb-2">
              {Object.entries(quest.rewards).map(([k, v]) => (
                <li
                  key={k}
                  className="border border-d2-border rounded px-2 py-0.5 bg-d2-bg/40"
                >
                  {formatReward(k, v, t)}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              {status === 'available' && (
                <Button
                  variant="secondary"
                  className="min-h-[40px] text-xs"
                  onClick={startQuest}
                  data-testid={`quest-start-${quest.id}`}
                >
                  {t('startQuest')}
                </Button>
              )}
              {status === 'inProgress' && (
                <Button
                  variant="secondary"
                  className="min-h-[40px] text-xs"
                  onClick={startQuest}
                  data-testid={`quest-progress-${quest.id}`}
                >
                  {t('viewProgress')}
                </Button>
              )}
              {status === 'locked' && (
                <Button
                  variant="secondary"
                  className="min-h-[40px] text-xs"
                  disabled
                  data-testid={`quest-locked-${quest.id}`}
                >
                  {t('locked')}
                </Button>
              )}
              {status === 'completed' && (
              <Button
                variant="primary"
                className="min-h-[40px] text-xs"
                disabled={!claimable}
                onClick={claim}
                data-testid={`quest-claim-${quest.id}`}
              >
                {rewardClaimed
                  ? t('rewardClaimed')
                  : t('claimReward')}
              </Button>
              )}
            </div>
            {feedback ? (
              <p role="status" className="mt-2 text-xs text-d2-gold/90" data-testid={`quest-feedback-${quest.id}`}>
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
  t: ReturnType<typeof useTranslation<'quests'>>['t']
): string {
  if (k === 'xp' && typeof v === 'number')
    return `✨ ${String(v)} ${t('rewardLabel.xp')}`;
  if (k === 'gold' && typeof v === 'number') return `💰 ${String(v)}`;
  if (k === 'skillPoints' && typeof v === 'number')
    return `🎯 +${String(v)} ${t('rewardLabel.skillPoint')}`;
  if (k === 'mercenaryUnlock' && typeof v === 'string') return `🛡️ ${t('rewardLabel.mercenaryUnlock')}: ${formatRewardValue(v, t)}`;
  if (k === 'service' && typeof v === 'string') return `🏷️ ${formatRewardValue(v, t)}`;
  if (k === 'itemDrop' && typeof v === 'string') return `🎁 ${formatRewardValue(v, t)}`;
  if (k === 'lootTable' && typeof v === 'string') return `📦 ${formatRewardValue(v, t)}`;
  if (k === 'areaUnlock' && typeof v === 'string') return `🗺️ ${formatRewardValue(v, t)}`;
  if (k === 'npcUnlock' && typeof v === 'string') return `👤 ${formatRewardValue(v, t)}`;
  if (k === 'stat' && typeof v === 'object' && v !== null)
    return `📈 +${JSON.stringify(v)}`;
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
  return lastSegment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function StatusBadge({ status }: { status: QuestStatus }) {
  const { t } = useTranslation('quests');
  const map: Record<QuestStatus, { label: string; cls: string }> = {
    inProgress: { label: t('inProgress'), cls: 'text-d2-rare border-d2-rare/60' },
    completed: { label: t('completed'), cls: 'text-d2-set border-d2-set/60' },
    locked: { label: t('locked'), cls: 'text-d2-white/50 border-d2-border' },
    available: { label: t('available'), cls: 'text-d2-gold border-d2-gold/60' }
  };
  const m = map[status];
  return (
    <span
      className={`text-[10px] uppercase tracking-wide border rounded px-2 py-0.5 whitespace-nowrap ${m.cls}`}
    >
      {m.label}
    </span>
  );
}
