/**
 * SkillsScreen — mock skill tree + active priority list.
 *
 * Layout:
 *   md+: 2 columns. Mobile: stacked with skill tree first.
 *   [ Points remaining ]
 *   [ Skill tree (mock 3 tabs of 6 skills) — allocate buttons ]
 *   [ Active skill priority list (3–5 slots, drag handles) ]
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Panel, ScreenShell } from '@/ui';
import { usePlayerStore } from '@/stores';

interface MockSkill {
  id: string;
  nameKey: string;
  level: number;
  maxLevel: number;
  prereqLevel?: number;
}

const MOCK_TREE: { tabKey: string; skills: MockSkill[] }[] = [
  {
    tabKey: 'skills.tab.combat',
    skills: [
      { id: 'bash', nameKey: 'skills.s.bash', level: 1, maxLevel: 20 },
      { id: 'cleave', nameKey: 'skills.s.cleave', level: 0, maxLevel: 20, prereqLevel: 6 },
      { id: 'whirlwind', nameKey: 'skills.s.whirlwind', level: 0, maxLevel: 20, prereqLevel: 30 },
    ],
  },
  {
    tabKey: 'skills.tab.passive',
    skills: [
      { id: 'iron-skin', nameKey: 'skills.s.ironSkin', level: 0, maxLevel: 20 },
      { id: 'natural-resist', nameKey: 'skills.s.naturalResist', level: 0, maxLevel: 20, prereqLevel: 30 },
    ],
  },
];

const COMBO_SLOTS = 5;

export function SkillsScreen() {
  const { t } = useTranslation(['skills', 'common']);
  const player = usePlayerStore((s) => s.player);
  const setComboOrder = usePlayerStore((s) => s.setComboOrder);
  const allocateSkillPoint = usePlayerStore((s) => s.allocateSkillPoint);

  const skillPoints = player?.skillPoints ?? 0;

  const combo = useMemo<string[]>(() => {
    const arr = (player?.comboOrder ?? []).slice(0, COMBO_SLOTS);
    while (arr.length < COMBO_SLOTS) arr.push('');
    return arr;
  }, [player?.comboOrder]);

  const moveCombo = (idx: number, dir: -1 | 1) => {
    const next = [...combo];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    const a = next[idx] ?? '';
    const b = next[target] ?? '';
    next[idx] = b;
    next[target] = a;
    setComboOrder(next.filter(Boolean));
  };

  const setComboAt = (idx: number, skillId: string) => {
    const next = [...combo];
    next[idx] = skillId;
    setComboOrder(next.filter(Boolean));
  };

  const allSkills = useMemo(() => MOCK_TREE.flatMap((t) => t.skills), []);

  return (
    <ScreenShell testId="skills-screen" title={t('title')}>
      <div className="max-w-5xl mx-auto space-y-4">
        <Panel className="flex items-center justify-between">
          <span className="text-d2-gold">{t('pointsRemaining', { count: skillPoints })}</span>
          <span className="text-xs text-d2-white/50">
            {t('common:level', { defaultValue: '等级' })} {player?.level ?? 1}
          </span>
        </Panel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Skill tree */}
          <div className="space-y-3">
            {MOCK_TREE.map((tab) => (
              <Panel key={tab.tabKey} title={t(tab.tabKey, { defaultValue: tab.tabKey })}>
                <ul className="space-y-2">
                  {tab.skills.map((sk) => {
                    const locked = sk.prereqLevel !== undefined && (player?.level ?? 1) < sk.prereqLevel;
                    const maxed = sk.level >= sk.maxLevel;
                    const canAllocate = !locked && !maxed && skillPoints > 0;
                    return (
                      <li
                        key={sk.id}
                        className="flex items-center justify-between gap-2 border border-d2-border
                                   rounded p-2 bg-d2-bg/40"
                      >
                        <div className="min-w-0">
                          <div className="font-serif text-d2-white truncate">
                            {t(sk.nameKey, { defaultValue: sk.id })}
                          </div>
                          <div className="text-xs text-d2-white/60">
                            {sk.level} / {sk.maxLevel}
                            {locked && (
                              <span className="ml-2 text-d2-white/40">
                                🔒 Lv {String(sk.prereqLevel)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          className="min-h-[40px] text-xs"
                          disabled={!canAllocate}
                          onClick={() => { allocateSkillPoint(sk.id); }}
                        >
                          {t('allocate')}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            ))}
          </div>

          {/* Active skill priority */}
          <Panel title={t('activeSkills')}>
            <p className="text-xs text-d2-white/60 mb-2">{t('dragToReorder')}</p>
            <ol className="space-y-2">
              {combo.map((id, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 border border-d2-border rounded p-2 bg-d2-bg/40"
                >
                  <span className="w-6 text-center text-d2-gold font-serif">{idx + 1}</span>
                  <select
                    value={id}
                    onChange={(e) => { setComboAt(idx, e.target.value); }}
                    className="flex-1 min-h-[40px] bg-d2-bg border border-d2-border rounded px-2 text-sm
                               focus:outline-none focus:border-d2-gold"
                    aria-label={t('slotN', { n: idx + 1, defaultValue: `Slot ${String(idx + 1)}` })}
                  >
                    <option value="">— {t('common:none', { defaultValue: '无' })} —</option>
                    {allSkills.map((sk) => (
                      <option key={sk.id} value={sk.id}>
                        {t(sk.nameKey, { defaultValue: sk.id })}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { moveCombo(idx, -1); }}
                    disabled={idx === 0}
                    aria-label={t('moveUp', { defaultValue: '上移' })}
                    className="w-10 h-10 flex items-center justify-center rounded border border-d2-border
                               disabled:opacity-30 hover:border-d2-gold/60 focus:outline-none
                               focus-visible:ring-2 focus-visible:ring-d2-gold"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => { moveCombo(idx, 1); }}
                    disabled={idx === combo.length - 1}
                    aria-label={t('moveDown', { defaultValue: '下移' })}
                    className="w-10 h-10 flex items-center justify-center rounded border border-d2-border
                               disabled:opacity-30 hover:border-d2-gold/60 focus:outline-none
                               focus-visible:ring-2 focus-visible:ring-d2-gold"
                  >
                    ▼
                  </button>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </ScreenShell>
  );
}
