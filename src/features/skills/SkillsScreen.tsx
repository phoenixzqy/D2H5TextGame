/**
 * SkillsScreen — class skill tree (with prerequisite arrows) + active skill
 * priority list. Bug #11: the active-skill priority list now lives in its
 * own `<Tabs>` panel instead of a side-by-side column, and the tree panel
 * renders prerequisite chains explicitly so the parent/child structure is
 * visible.
 *
 * Tabs:
 *   1. 技能树 (`tree`)   — full skill tree, grouped by `tree` field, with
 *                          prerequisite badges that link to the upstream node.
 *   2. 主动技能 (`active`) — combo priority editor (3–5 slots).
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Panel, ScreenShell, Tabs, tDataKey } from '@/ui';
import { usePlayerStore } from '@/stores';
import { getSkillsForClass, organizeSkillsByTree, isSkillLocked, type SkillTemplate } from '@/stores/skillsHelpers';

const COMBO_SLOTS = 5;

export function SkillsScreen() {
  const { t } = useTranslation(['skills', 'common']);
  const player = usePlayerStore((s) => s.player);
  const setComboOrder = usePlayerStore((s) => s.setComboOrder);
  const allocateSkillPoint = usePlayerStore((s) => s.allocateSkillPoint);

  const skillPoints = player?.skillPoints ?? 0;
  const playerLevel = player?.level ?? 1;
  const playerClass = player?.class ?? '';

  const allSkills = useMemo(() => {
    if (!playerClass) return [];
    return getSkillsForClass(playerClass);
  }, [playerClass]);

  const skillTrees = useMemo(() => organizeSkillsByTree(allSkills), [allSkills]);

  const allocatedSkills = useMemo(() => {
    const map = new Map<string, number>();
    const levels = player?.skillLevels;
    if (levels) {
      for (const [id, lvl] of Object.entries(levels)) {
        if (lvl > 0) map.set(id, lvl);
      }
    }
    if (map.size === 0 && player?.skills) {
      player.skills.forEach((skill) => {
        const level = 'level' in skill && typeof skill.level === 'number' ? skill.level : 1;
        map.set(skill.id, level);
      });
    }
    return map;
  }, [player?.skillLevels, player?.skills]);

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

  if (!player) {
    return (
      <ScreenShell testId="skills-screen" title={t('title')}>
        <div className="max-w-5xl mx-auto">
          <Panel>
            <p className="text-d2-white/70">{t('common:noPlayer')}</p>
          </Panel>
        </div>
      </ScreenShell>
    );
  }

  const treePanel = (
    <div className="space-y-3" data-testid="skills-tree-panel">
      {Array.from(skillTrees.entries()).map(([treeName, treeSkills]) => {
        // Tree names in skill JSON are free-form (e.g. "Poison and Bone
        // Spells"). Slugify into a stable key for the locale lookup, and
        // fall back to the raw English name if no translation exists so
        // we never render the literal `tree.…` key string.
        const treeSlug = treeName === 'all' ? 'all' : slugifyTreeName(treeName);
        const treeTitle = t(`tree.${treeSlug}`, { defaultValue: treeName });
        return (
          <Panel key={treeName} title={treeTitle}>
            <ul className="space-y-2">
              {treeSkills.map((skill: SkillTemplate) => {
                const locked = isSkillLocked(skill, playerLevel, allocatedSkills);
                const allocatedLevel = allocatedSkills.get(skill.id) ?? 0;
                const maxed = allocatedLevel >= skill.maxLevel;
                const canAllocate = !locked && !maxed && skillPoints > 0;
                const hasPrereqs = 'prerequisites' in skill && Array.isArray(skill.prerequisites);
                const prereqs = hasPrereqs ? (skill.prerequisites as string[]) : [];
                const indent = prereqs.length > 0 ? 'ml-4 border-l-2 border-d2-border/60 pl-3' : '';

                return (
                  <li
                    key={skill.id}
                    data-testid={`skill-node-${skill.id}`}
                    className={`flex items-center justify-between gap-2 border border-d2-border
                               rounded p-2 bg-d2-bg/40 ${locked ? 'opacity-50' : ''} ${indent}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-serif text-d2-white truncate">{tDataKey(t, skill.name)}</div>
                      <div className="text-xs text-d2-white/60">
                        {allocatedLevel} / {skill.maxLevel}
                        {locked && skill.minLevel && (
                          <span className="ml-2 text-d2-white/40">
                            🔒 {t('common:requiresLevel', { level: skill.minLevel })}
                          </span>
                        )}
                        {prereqs.length > 0 && (
                          <span className="ml-2 text-d2-white/40 block">
                            ↳ {prereqs.map(pid => {
                              const p = allSkills.find(s => s.id === pid);
                              return p ? tDataKey(t, p.name) : pid;
                            }).join(', ')}
                          </span>
                        )}
                      </div>
                      {skill.description && (
                        <div className="text-xs text-d2-white/50 mt-1 line-clamp-2">
                          {skill.description}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      className="min-h-[40px] text-xs shrink-0"
                      disabled={!canAllocate}
                      onClick={() => { allocateSkillPoint(skill.id); }}
                      aria-label={t('allocatePoint', { skill: tDataKey(t, skill.name) })}
                    >
                      {t('allocate')}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        );
      })}
    </div>
  );

  const activePanel = (
    <Panel title={t('activeSkills')} data-testid="skills-active-panel">
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
              aria-label={t('slotN', { n: idx + 1 })}
            >
              <option value="">— {t('common:none')} —</option>
              {allSkills.filter(sk => sk.trigger === 'active').map((sk) => (
                <option key={sk.id} value={sk.id}>{tDataKey(t, sk.name)}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { moveCombo(idx, -1); }}
              disabled={idx === 0}
              aria-label={t('moveUp')}
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
              aria-label={t('moveDown')}
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
  );

  return (
    <ScreenShell testId="skills-screen" title={t('title')}>
      <div className="max-w-5xl mx-auto space-y-4">
        <Panel className="flex items-center justify-between">
          <span className="text-d2-gold">{t('pointsRemaining', { count: skillPoints })}</span>
          <span className="text-xs text-d2-white/50">
            {t('common:level')} {playerLevel}
          </span>
        </Panel>

        <Tabs
          tabs={[
            { id: 'tree', label: t('tab.tree'), content: treePanel },
            { id: 'active', label: t('tab.active'), content: activePanel }
          ]}
        />
      </div>
    </ScreenShell>
  );
}

/** Slugify a free-form skill-tree name into a stable i18n key segment. */
function slugifyTreeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
