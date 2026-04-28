/**
 * QuestsScreen — Tabs (Main / Side / Bounty), quest list with objectives + rewards.
 */
import { useTranslation } from 'react-i18next';
import { Panel, ScreenShell, Tabs } from '@/ui';
import { useMapStore } from '@/stores';

interface MockQuest {
  id: string;
  category: 'main' | 'side' | 'bounty';
  nameKey: string;
  descKey: string;
  objectives: { key: string; done: boolean }[];
  rewards: { type: 'xp' | 'gold' | 'item'; amount?: number; itemKey?: string }[];
  status: 'available' | 'inProgress' | 'completed' | 'locked';
}

const MOCK_QUESTS: MockQuest[] = [
  {
    id: 'q-den-of-evil',
    category: 'main',
    nameKey: 'quests.q.denOfEvil.name',
    descKey: 'quests.q.denOfEvil.desc',
    objectives: [{ key: 'quests.q.denOfEvil.obj1', done: false }],
    rewards: [{ type: 'xp', amount: 500 }, { type: 'gold', amount: 200 }],
    status: 'inProgress',
  },
  {
    id: 'q-sisters-burial',
    category: 'main',
    nameKey: 'quests.q.sistersBurial.name',
    descKey: 'quests.q.sistersBurial.desc',
    objectives: [{ key: 'quests.q.sistersBurial.obj1', done: false }],
    rewards: [{ type: 'xp', amount: 800 }],
    status: 'available',
  },
  {
    id: 'q-charsi-imbue',
    category: 'side',
    nameKey: 'quests.q.charsi.name',
    descKey: 'quests.q.charsi.desc',
    objectives: [{ key: 'quests.q.charsi.obj1', done: false }],
    rewards: [{ type: 'item', itemKey: 'quests.reward.imbue' }],
    status: 'available',
  },
  {
    id: 'q-bounty-andariel',
    category: 'bounty',
    nameKey: 'quests.q.bountyAndariel.name',
    descKey: 'quests.q.bountyAndariel.desc',
    objectives: [{ key: 'quests.q.bountyAndariel.obj1', done: false }],
    rewards: [{ type: 'gold', amount: 1500 }],
    status: 'locked',
  },
];

export function QuestsScreen() {
  const { t } = useTranslation(['quests', 'common']);
  const questProgress = useMapStore((s) => s.questProgress);

  const merged = MOCK_QUESTS.map((q) => {
    const stored = questProgress[q.id];
    return stored ? { ...q, status: stored.status } : q;
  });

  const renderList = (cat: MockQuest['category']) => {
    const list = merged.filter((q) => q.category === cat);
    if (list.length === 0) {
      return (
        <p className="text-sm text-d2-white/60 italic p-4 text-center">
          {t('empty', { defaultValue: '暂无任务' })}
        </p>
      );
    }
    return (
      <ul className="space-y-2">
        {list.map((q) => (
          <li key={q.id}>
            <QuestCard quest={q} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <ScreenShell testId="quests-screen" title={t('quests')}>
      <div className="max-w-3xl mx-auto">
        <Tabs
          tabs={[
            { id: 'main', label: t('main'), content: renderList('main') },
            { id: 'side', label: t('side'), content: renderList('side') },
            { id: 'bounty', label: t('bounty'), content: renderList('bounty') },
          ]}
          defaultTab="main"
        />
      </div>
    </ScreenShell>
  );
}

function QuestCard({ quest }: { quest: MockQuest }) {
  const { t } = useTranslation('quests');
  return (
    <Panel
      className={
        quest.status === 'locked'
          ? 'opacity-60'
          : quest.status === 'completed'
          ? 'border-d2-set'
          : ''
      }
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-serif text-d2-gold">
          {t(quest.nameKey, { defaultValue: quest.id })}
        </h3>
        <StatusBadge status={quest.status} />
      </div>
      <p className="text-xs text-d2-white/70 mb-2">{t(quest.descKey, { defaultValue: '' })}</p>
      <div className="text-xs">
        <div className="text-d2-white/60 mb-1">{t('objectives')}</div>
        <ul className="list-disc list-inside space-y-0.5 mb-2">
          {quest.objectives.map((o, i) => (
            <li key={i} className={o.done ? 'line-through text-d2-set' : ''}>
              {t(o.key, { defaultValue: o.key })}
            </li>
          ))}
        </ul>
        <div className="text-d2-white/60 mb-1">{t('rewards')}</div>
        <ul className="flex flex-wrap gap-2">
          {quest.rewards.map((r, i) => (
            <li key={i} className="border border-d2-border rounded px-2 py-0.5 bg-d2-bg/40">
              {r.type === 'xp' && `✨ ${String(r.amount ?? 0)} XP`}
              {r.type === 'gold' && `💰 ${String(r.amount ?? 0)}`}
              {r.type === 'item' && `🎁 ${t(r.itemKey ?? '', { defaultValue: 'Item' })}`}
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

function StatusBadge({ status }: { status: MockQuest['status'] }) {
  const { t } = useTranslation('quests');
  const map: Record<MockQuest['status'], { label: string; cls: string }> = {
    inProgress: { label: t('inProgress'), cls: 'text-d2-rare border-d2-rare/60' },
    completed: { label: t('completed'), cls: 'text-d2-set border-d2-set/60' },
    locked: { label: t('locked'), cls: 'text-d2-white/50 border-d2-border' },
    available: { label: t('available', { defaultValue: '可领取' }), cls: 'text-d2-gold border-d2-gold/60' },
  };
  const m = map[status];
  return (
    <span className={`text-[10px] uppercase tracking-wide border rounded px-2 py-0.5 ${m.cls}`}>
      {m.label}
    </span>
  );
}
