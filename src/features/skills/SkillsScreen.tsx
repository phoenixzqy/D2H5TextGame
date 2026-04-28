/**
 * SkillsScreen — real skill tree loading per class + active priority list.
 *
 * Layout:
 *   md+: 2 columns. Mobile: stacked with skill tree first.
 *   [ Points remaining ]
 *   [ Skill tree (organized by tree, loads from JSON) — allocate buttons ]
 *   [ Active skill priority list (3–5 slots, drag handles) ]
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Panel, ScreenShell } from '@/ui';
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

  // Load skills for the player's class
  const allSkills = useMemo(() => {
    if (!playerClass) return [];
    return getSkillsForClass(playerClass);
  }, [playerClass]);

  // Organize skills by tree
  const skillTrees = useMemo(() => {
    return organizeSkillsByTree(allSkills);
  }, [allSkills]);

  // Build a map of allocated skill levels
  const allocatedSkills = useMemo(() => {
    const map = new Map<string, number>();
    // TODO: This should come from player state when skill allocation is implemented
    // For now, we'll track based on player.skills array if available
    if (player?.skills) {
      player.skills.forEach((skill) => {
        // Skill might have a level property or we assume 1 point if present
        const level = 'level' in skill && typeof skill.level === 'number' ? skill.level : 1;
        map.set(skill.id, level);
      });
    }
    return map;
  }, [player?.skills]);

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
            <p className="text-d2-white/70">{t('common:noPlayer', { defaultValue: 'No character selected' })}</p>
          </Panel>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell testId="skills-screen" title={t('title')}>
      <div className="max-w-5xl mx-auto space-y-4">
        <Panel className="flex items-center justify-between">
          <span className="text-d2-gold">{t('pointsRemaining', { count: skillPoints })}</span>
          <span className="text-xs text-d2-white/50">
            {t('common:level', { defaultValue: '等级' })} {playerLevel}
          </span>
        </Panel>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Skill tree */}
          <div className="space-y-3">
            {Array.from(skillTrees.entries()).map(([treeName, treeSkills]) => {
              const treeKey = treeName === 'all' ? 'skills.tree.all' : `skills.tree.${treeName}`;
              return (
                <Panel key={treeName} title={t(treeKey, { defaultValue: treeName })}>
                  <ul className="space-y-2">
                    {treeSkills.map((skill: SkillTemplate) => {
                      const locked = isSkillLocked(skill, playerLevel, allocatedSkills);
                      const allocatedLevel = allocatedSkills.get(skill.id) ?? 0;
                      const maxed = allocatedLevel >= skill.maxLevel;
                      const canAllocate = !locked && !maxed && skillPoints > 0;

                      // Check for prerequisites to display
                      const hasPrereqs = 'prerequisites' in skill && Array.isArray(skill.prerequisites);
                      const prereqs = hasPrereqs ? (skill.prerequisites as string[]) : [];

                      return (
                        <li
                          key={skill.id}
                          data-testid={`skill-node-${skill.id}`}
                          className={`flex items-center justify-between gap-2 border border-d2-border
                                     rounded p-2 bg-d2-bg/40 ${locked ? 'opacity-50' : ''}`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-serif text-d2-white truncate">
                              {skill.name}
                            </div>
                            <div className="text-xs text-d2-white/60">
                              {allocatedLevel} / {skill.maxLevel}
                              {locked && skill.minLevel && (
                                <span className="ml-2 text-d2-white/40">
                                  🔒 {t('common:requiresLevel', { defaultValue: '需要等级' })} {skill.minLevel}
                                </span>
                              )}
                              {prereqs.length > 0 && (
                                <span className="ml-2 text-d2-white/40 block">
                                  ↳ {prereqs.map(pid => {
                                    const prereqSkill = allSkills.find(s => s.id === pid);
                                    return prereqSkill?.name ?? pid;
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
                            aria-label={t('allocatePoint', { skill: skill.name, defaultValue: `Allocate point to ${skill.name}` })}
                          >
                            {t('allocate', { defaultValue: '+' })}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </Panel>
              );
            })}
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
                    {allSkills.filter(sk => sk.trigger === 'active').map((sk) => (
                      <option key={sk.id} value={sk.id}>
                        {sk.name}
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
