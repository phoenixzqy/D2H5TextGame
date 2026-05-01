/**
 * SkillsScreen — class skill tree + active skill priority list.
 *
 * Layout sketch:
 * - Mobile (360×640): points banner, tabs, one skill-tree panel per row; each
 *   panel contains a compact 3-column node board and sticky-ish detail panel.
 * - Desktop (1280×800): the three class trees sit side-by-side; node boards
 *   keep the same 3-column coordinate system so prerequisite edges stay stable.
 *
 * The tree tab renders a D2-inspired node board with dependency connectors and
 * a level-aware detail panel. Combat/math display is resolved by pure engine
 * helpers; this component only formats and wires player actions.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Panel, ScreenShell, Tabs, resolveSkillIcon, tDataKey } from '@/ui';
import { usePlayerStore } from '@/stores';
import {
  getSkillRequiredLevel,
  getSkillsForClass,
  organizeSkillsByTree,
  isSkillLocked,
  skillIdAliases,
  type SkillTemplate
} from '@/stores/skillsHelpers';
import {
  computeSkillDisplayModel,
  type SkillDamageDisplayRow,
  type SkillDisplayModel,
  type SkillRankDisplayStats
} from '@/engine/skills/displayStats';

const COMBO_SLOTS = 5;
const TREE_WIDTH = 320;
const TREE_ROW_HEIGHT = 84;
const TREE_TOP = 36;
const TREE_COLUMNS = [48, 160, 272] as const;

interface SkillNodeLayout {
  readonly skillId: string;
  readonly column: 0 | 1 | 2;
  readonly row: number;
  readonly x: number;
  readonly y: number;
}

interface SkillPrerequisiteEdge {
  readonly fromSkillId: string;
  readonly toSkillId: string;
  readonly parent: SkillNodeLayout;
  readonly child: SkillNodeLayout;
}

type Translate = ReturnType<typeof useTranslation>['t'];

export function SkillsScreen() {
  const { t } = useTranslation(['skills', 'common', 'damage-types']);
  const player = usePlayerStore((s) => s.player);
  const setComboOrder = usePlayerStore((s) => s.setComboOrder);
  const allocateSkillPoint = usePlayerStore((s) => s.allocateSkillPoint);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [previewSkillId, setPreviewSkillId] = useState<string | null>(null);

  const skillPoints = player?.skillPoints ?? 0;
  const playerLevel = player?.level ?? 1;
  const playerClass = player?.class ?? '';

  const allSkills = useMemo(() => {
    if (!playerClass) return [];
    return getSkillsForClass(playerClass);
  }, [playerClass]);

  const skillById = useMemo(() => new Map(allSkills.map((skill) => [skill.id, skill])), [allSkills]);
  const skillTrees = useMemo(() => organizeSkillsByTree(allSkills), [allSkills]);

  const allocatedSkills = useMemo(() => {
    const map = new Map<string, number>();
    const levels = player?.skillLevels;
    if (levels) {
      for (const [id, lvl] of Object.entries(levels)) {
        if (lvl > 0) addAllocatedLevelAlias(map, id, lvl);
      }
    }
    if (map.size === 0 && player?.skills) {
      player.skills.forEach((skill) => {
        const level = 'level' in skill && typeof skill.level === 'number' ? skill.level : 1;
        addAllocatedLevelAlias(map, skill.id, level);
      });
    }
    return map;
  }, [player?.skillLevels, player?.skills]);

  const defaultSkillId = useMemo(() => {
    const available = allSkills.find((skill) => !isSkillLocked(skill, playerLevel, allocatedSkills));
    return available?.id ?? allSkills[0]?.id ?? '';
  }, [allSkills, allocatedSkills, playerLevel]);

  useEffect(() => {
    if (!selectedSkillId || !skillById.has(selectedSkillId)) {
      setSelectedSkillId(defaultSkillId);
    }
  }, [defaultSkillId, selectedSkillId, skillById]);

  const activeSkillId = previewSkillId ?? (selectedSkillId || defaultSkillId);
  const activeSkill = skillById.get(activeSkillId) ?? allSkills[0];
  const activeModel = activeSkill
    ? computeSkillDisplayModel(activeSkill, allocatedSkills.get(activeSkill.id) ?? 0)
    : null;
  const activeLocked = activeSkill ? isSkillLocked(activeSkill, playerLevel, allocatedSkills) : false;
  const activeCanAllocate = Boolean(
    activeSkill &&
      activeModel &&
      !activeLocked &&
      !activeModel.maxed &&
      skillPoints > 0
  );

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

  const allocateActiveSkill = () => {
    if (!activeSkill || !activeCanAllocate) return;
    const result = allocateSkillPoint(activeSkill.id);
    if (result === 'ok') {
      setSelectedSkillId(activeSkill.id);
      setPreviewSkillId(null);
    }
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
    <div className="space-y-4" data-testid="skills-tree-panel">
      <div className="grid gap-4 lg:grid-cols-3" data-testid="skills-tree-grid">
        {Array.from(skillTrees.entries()).map(([treeName, treeSkills]) => {
          const treeSlug = treeName === 'all' ? 'all' : slugifyTreeName(treeName);
          const treeTitle = t(`tree.${treeSlug}`, { defaultValue: treeName });
          const layout = buildTreeLayout(treeSkills);
          return (
            <Panel key={treeName} title={treeTitle} className="overflow-hidden" data-testid={`skills-tree-column-${treeSlug}`}>
              <p className="mb-3 text-xs text-d2-white/70">{t('details.treeSummary')}</p>
              <SkillTreeBoard
                skills={treeSkills}
                layout={layout}
                allocatedSkills={allocatedSkills}
                playerLevel={playerLevel}
                selectedSkillId={selectedSkillId}
                previewSkillId={previewSkillId}
                onSelect={setSelectedSkillId}
                onPreview={setPreviewSkillId}
                t={t}
              />
            </Panel>
          );
        })}
      </div>

      {activeSkill && activeModel ? (
        <SkillDetailPanel
          skill={activeSkill}
          model={activeModel}
          playerLevel={playerLevel}
          skillPoints={skillPoints}
          allocatedSkills={allocatedSkills}
          skillById={skillById}
          locked={activeLocked}
          canAllocate={activeCanAllocate}
          onAllocate={allocateActiveSkill}
          t={t}
        />
      ) : null}
    </div>
  );

  const activePanel = (
    <Panel title={t('activeSkills')} data-testid="skills-active-panel">
      <p className="text-xs text-d2-white/70 mb-2">{t('dragToReorder')}</p>
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
              className="flex-1 min-h-[44px] bg-d2-bg border border-d2-border rounded px-2 text-sm
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
               className="h-11 w-11 flex items-center justify-center rounded border border-d2-border
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
               className="h-11 w-11 flex items-center justify-center rounded border border-d2-border
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
      <div className="max-w-7xl mx-auto space-y-4">
        <Panel className="flex items-center justify-between">
          <span className="text-d2-gold">{t('pointsRemaining', { count: skillPoints })}</span>
          <span className="text-xs text-d2-white/70">
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

function SkillTreeBoard({
  skills,
  layout,
  allocatedSkills,
  playerLevel,
  selectedSkillId,
  previewSkillId,
  onSelect,
  onPreview,
  t
}: {
  readonly skills: readonly SkillTemplate[];
  readonly layout: Map<string, SkillNodeLayout>;
  readonly allocatedSkills: ReadonlyMap<string, number>;
  readonly playerLevel: number;
  readonly selectedSkillId: string;
  readonly previewSkillId: string | null;
  readonly onSelect: (skillId: string) => void;
  readonly onPreview: (skillId: string | null) => void;
  readonly t: Translate;
}) {
  const maxRow = Math.max(0, ...Array.from(layout.values()).map((node) => node.row));
  const height = TREE_TOP * 2 + maxRow * TREE_ROW_HEIGHT + 64;
  const edges = buildPrerequisiteEdges(skills, layout);
  const orderedSkills = [...skills].sort((a, b) => {
    const aNode = layout.get(a.id);
    const bNode = layout.get(b.id);
    if (!aNode || !bNode) return a.id.localeCompare(b.id);
    const rowDelta = aNode.row - bNode.row;
    return rowDelta !== 0 ? rowDelta : aNode.column - bNode.column;
  });
  return (
    <div
      className="relative mx-auto w-full max-w-[320px] rounded border border-d2-border/70
                 bg-[radial-gradient(circle_at_50%_0%,rgba(210,176,91,0.12),transparent_48%),linear-gradient(135deg,rgba(255,255,255,0.04)_0,transparent_40%)]
                 shadow-inner"
      data-testid="skill-tree-board"
      style={{ height }}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${String(TREE_WIDTH)} ${String(height)}`} aria-hidden="true">
        {edges.map((edge) => {
          const learned = (allocatedSkills.get(edge.fromSkillId) ?? 0) > 0;
          const midY = edge.parent.y + Math.max(18, (edge.child.y - edge.parent.y) / 2);
          const d = `M ${String(edge.parent.x)} ${String(edge.parent.y + 28)} V ${String(midY)} H ${String(edge.child.x)} V ${String(edge.child.y - 28)}`;
          return (
            <path
              key={`${edge.fromSkillId}-${edge.toSkillId}`}
              d={d}
              fill="none"
              stroke={learned ? 'rgba(210,176,91,0.85)' : 'rgba(99,79,54,0.75)'}
              strokeWidth={learned ? 3 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              data-testid="skill-prerequisite-edge"
              data-edge-from={edge.fromSkillId}
              data-edge-to={edge.toSkillId}
            />
          );
        })}
      </svg>

      {orderedSkills.map((skill) => {
        const node = layout.get(skill.id);
        if (!node) return null;
        const name = tDataKey(t, skill.name);
        const level = allocatedSkills.get(skill.id) ?? 0;
        const locked = isSkillLocked(skill, playerLevel, allocatedSkills);
        const selected = selectedSkillId === skill.id;
        const previewed = previewSkillId === skill.id;
        return (
          <button
            key={skill.id}
            type="button"
            data-testid={`skill-node-${skill.id}`}
            title={name}
            aria-describedby="skill-detail-panel"
            aria-label={t('details.nodeAria', {
              skill: name,
              level,
              max: skill.maxLevel,
              state: nodeStateLabel(skill, level, locked, t)
            })}
            onClick={() => {
              onSelect(skill.id);
              onPreview(null);
            }}
            onMouseEnter={() => { onPreview(skill.id); }}
            onMouseLeave={() => { onPreview(null); }}
            onFocus={() => { onPreview(skill.id); }}
            onBlur={() => { onPreview(null); }}
            className={`absolute flex h-14 w-14 flex-col items-center justify-center rounded border-2
                        bg-black/70 text-[10px] transition focus:outline-none focus-visible:ring-2
                        focus-visible:ring-d2-gold motion-safe:hover:-translate-y-0.5
                        ${nodeStateClass(level, locked, selected || previewed)}`}
            style={{ left: node.x - 28, top: node.y - 28 }}
          >
            <SkillIcon skill={skill} label={name} />
            <span className="sr-only">{name}</span>
            {locked ? <span className="absolute right-0.5 top-0.5 text-[10px]" aria-hidden="true">🔒</span> : null}
            <span className="mt-0.5 leading-none text-d2-white/80">{level}/{skill.maxLevel}</span>
          </button>
        );
      })}
    </div>
  );
}

function SkillDetailPanel({
  skill,
  model,
  playerLevel,
  skillPoints,
  allocatedSkills,
  skillById,
  locked,
  canAllocate,
  onAllocate,
  t
}: {
  readonly skill: SkillTemplate;
  readonly model: SkillDisplayModel;
  readonly playerLevel: number;
  readonly skillPoints: number;
  readonly allocatedSkills: ReadonlyMap<string, number>;
  readonly skillById: ReadonlyMap<string, SkillTemplate>;
  readonly locked: boolean;
  readonly canAllocate: boolean;
  readonly onAllocate: () => void;
  readonly t: Translate;
}) {
  const name = tDataKey(t, skill.name);
  const current = model.current;
  const next = model.next;
  const primaryStats = current ?? next;
  const requirementLevel = getSkillRequiredLevel(skill);
  const missingPrereqs = (skill.prerequisites ?? []).filter((id) => (allocatedSkills.get(id) ?? 0) <= 0);
  const buttonLabel = allocationButtonLabel({
    locked,
    maxed: model.maxed,
    skillPoints,
    playerLevel,
    requiredLevel: requirementLevel,
    missingPrereqs,
    t
  });

  return (
    <Panel
      className="border-d2-gold/70 bg-d2-panel/95 shadow-[0_0_28px_rgba(210,176,91,0.16)] backdrop-blur md:sticky md:bottom-2 md:z-10"
      data-testid="skill-detail-panel"
    >
      <div id="skill-detail-panel" aria-live="polite" className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl text-d2-gold">{name}</h2>
            <p className="text-xs text-d2-white/70">
              {model.allocatedLevel > 0
                ? t('details.level', { current: model.allocatedLevel, max: model.maxLevel })
                : t('details.unlearned', { max: model.maxLevel })}
              {' · '}
              {t(`trigger.${skill.trigger}`, { defaultValue: skill.trigger })}
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            disabled={!canAllocate}
            onClick={onAllocate}
            className="min-h-[44px] min-w-[120px]"
          >
            {buttonLabel}
          </Button>
        </div>

        <p className="rounded border border-d2-border/70 bg-black/30 px-3 py-2 text-sm text-d2-white/80">
          {dynamicDescription(name, skill, primaryStats, t)}
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          <StatSection
            title={current ? t('details.current') : t('details.notLearned')}
            stats={current}
            compare={undefined}
            emptyText={t('details.currentEmpty')}
            t={t}
          />
          <StatSection
            title={current ? t('details.next') : t('details.learnPreview')}
            stats={next}
            compare={current}
            emptyText={t('details.maxLevel')}
            t={t}
          />
          <RequirementSection
            skill={skill}
            playerLevel={playerLevel}
            allocatedSkills={allocatedSkills}
            skillById={skillById}
            t={t}
          />
        </div>
      </div>
    </Panel>
  );
}

function StatSection({
  title,
  stats,
  compare,
  emptyText,
  t
}: {
  readonly title: string;
  readonly stats: SkillRankDisplayStats | undefined;
  readonly compare: SkillRankDisplayStats | undefined;
  readonly emptyText: string;
  readonly t: Translate;
}) {
  return (
    <section className="rounded border border-d2-border/70 bg-black/25 p-3">
      <h3 className="mb-2 font-serif text-sm text-d2-gold">{title}</h3>
      {stats ? (
        <dl className="space-y-1 text-xs">
          {stats.damage.map((row) => (
            <StatLine
              key={`damage-${row.type}`}
              label={t('details.damageAttack', { type: t(`damage-types:type.${row.type}`) })}
              value={t('details.percentRange', { min: row.min, max: row.max })}
              delta={damageDelta(row, compare)}
            />
          ))}
          {stats.damage.length > 1 && stats.totalDamage ? (
            <StatLine
              label={t('details.totalPower')}
              value={t('details.percentRange', { min: stats.totalDamage.min, max: stats.totalDamage.max })}
              delta={compare?.totalDamage ? rangeDelta(stats.totalDamage, compare.totalDamage) : null}
            />
          ) : null}
          {stats.summonCap !== undefined ? (
            <StatLine
              label={t('details.summonCap')}
              value={String(stats.summonCap)}
              delta={compare?.summonCap !== undefined ? numberDelta(stats.summonCap, compare.summonCap, t) : null}
            />
          ) : null}
          {stats.manaCost !== undefined ? (
            <StatLine label={t('details.manaCost')} value={String(stats.manaCost)} />
          ) : null}
          {stats.lifeCost !== undefined ? (
            <StatLine label={t('details.lifeCost')} value={String(stats.lifeCost)} />
          ) : null}
          <StatLine label={t('details.cooldown')} value={t('details.turns', { count: stats.cooldown })} />
          {stats.statuses.length > 0 ? (
            <StatLine
              label={t('details.statusEffects')}
              value={stats.statuses.map((id) => t(`damage-types:status.${id}`, { defaultValue: humanizeId(id) })).join(', ')}
            />
          ) : null}
        </dl>
      ) : (
        <p className="text-xs text-d2-white/70">{emptyText}</p>
      )}
    </section>
  );
}

function StatLine({
  label,
  value,
  delta = null
}: {
  readonly label: string;
  readonly value: string;
  readonly delta?: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="text-d2-white/70">{label}</dt>
      <dd className="text-right text-d2-white">
        {value}
        {delta ? <span className="ml-1 text-d2-gold/80">{delta}</span> : null}
      </dd>
    </div>
  );
}

function RequirementSection({
  skill,
  playerLevel,
  allocatedSkills,
  skillById,
  t
}: {
  readonly skill: SkillTemplate;
  readonly playerLevel: number;
  readonly allocatedSkills: ReadonlyMap<string, number>;
  readonly skillById: ReadonlyMap<string, SkillTemplate>;
  readonly t: Translate;
}) {
  const requiredLevel = getSkillRequiredLevel(skill);
  const prereqs = skill.prerequisites ?? [];
  return (
    <section className="rounded border border-d2-border/70 bg-black/25 p-3">
      <h3 className="mb-2 font-serif text-sm text-d2-gold">{t('details.requirements')}</h3>
      <dl className="space-y-1 text-xs">
        <StatLine
          label={t('details.requiredLevel')}
          value={t('details.levelValue', { level: requiredLevel })}
          delta={playerLevel >= requiredLevel ? t('details.met') : t('details.missing')}
        />
        {prereqs.length > 0 ? (
          <StatLine
            label={t('details.prerequisites')}
            value={prereqs.map((id) => {
              const prereq = skillById.get(id);
              const learned = (allocatedSkills.get(id) ?? 0) > 0;
              const label = prereq ? tDataKey(t, prereq.name) : id;
              return learned ? label : t('details.lockedPrereqName', { skill: label });
            }).join(', ')}
          />
        ) : (
          <StatLine label={t('details.prerequisites')} value={t('details.none')} />
        )}
        {skill.requires?.weaponType?.length ? (
          <StatLine label={t('details.weaponRequired')} value={skill.requires.weaponType.join(', ')} />
        ) : null}
      </dl>
    </section>
  );
}

function SkillIcon({ skill, label }: { readonly skill: SkillTemplate; readonly label: string }) {
  const [failed, setFailed] = useState(false);
  const iconSrc = failed ? null : resolveSkillIconSrc(skill.icon, skill.id);
  const fallback = (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded bg-gradient-to-br ${skillIconClass(skill)} font-serif text-sm font-bold shadow-inner`}
      data-testid={`skill-icon-fallback-${skill.id}`}
      aria-hidden="true"
    >
      <SkillFallbackMark skill={skill} />
    </span>
  );

  if (!iconSrc) return fallback;

  return (
    <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded bg-black shadow-inner">
      <img
        src={iconSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="h-full w-full object-cover"
        data-testid={`skill-icon-img-${skill.id}`}
        onError={() => { setFailed(true); }}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function resolveSkillIconSrc(icon: string | undefined, skillId?: string): string | null {
  for (const ref of [icon, skillId]) {
    if (!ref) continue;
    const resolved = resolveSkillIcon(ref);
    if (resolved) return resolved;
  }

  const trimmed = icon?.trim();
  if (!trimmed) return null;
  return /^(https?:|data:|blob:|\/)/i.test(trimmed) ? trimmed : null;
}

export function buildTreeLayout(skills: readonly SkillTemplate[]): Map<string, SkillNodeLayout> {
  const sorted = [...skills].sort((a, b) => {
    const levelDelta = getSkillRequiredLevel(a) - getSkillRequiredLevel(b);
    return levelDelta !== 0 ? levelDelta : a.id.localeCompare(b.id);
  });
  const layout = new Map<string, SkillNodeLayout>();
  const occupied = new Set<string>();

  for (const skill of sorted) {
    const baseRow = requiredLevelRow(getSkillRequiredLevel(skill)) * 2;
    const parentColumns = (skill.prerequisites ?? [])
      .map((id) => layout.get(id)?.column)
      .filter((column): column is 0 | 1 | 2 => column !== undefined);
    const parentRows = (skill.prerequisites ?? [])
      .map((id) => layout.get(id)?.row)
      .filter((row): row is number => row !== undefined);
    const desiredColumn = parentColumns[0] ?? 1;
    const minRow = Math.max(baseRow, parentRows.length > 0 ? Math.max(...parentRows) + 1 : baseRow);
    const slot = findOpenTreeSlot(minRow, desiredColumn, occupied);
    occupied.add(`${String(slot.row)}:${String(slot.column)}`);
    layout.set(skill.id, {
      skillId: skill.id,
      column: slot.column,
      row: slot.row,
      x: TREE_COLUMNS[slot.column],
      y: TREE_TOP + slot.row * TREE_ROW_HEIGHT
    });
  }

  return layout;
}

export function buildPrerequisiteEdges(
  skills: readonly SkillTemplate[],
  layout: ReadonlyMap<string, SkillNodeLayout>
): readonly SkillPrerequisiteEdge[] {
  const edges: SkillPrerequisiteEdge[] = [];

  for (const skill of skills) {
    const child = layout.get(skill.id);
    if (!child) continue;

    for (const prereqId of skill.prerequisites ?? []) {
      const parent = layout.get(prereqId);
      if (!parent) continue;
      edges.push({
        fromSkillId: prereqId,
        toSkillId: skill.id,
        parent,
        child
      });
    }
  }

  return edges;
}

function findOpenTreeSlot(
  startRow: number,
  desiredColumn: 0 | 1 | 2,
  occupied: ReadonlySet<string>
): { readonly row: number; readonly column: 0 | 1 | 2 } {
  const columnOrder = uniqueColumns([desiredColumn, 1, 0, 2]);
  for (let row = startRow; row < startRow + 64; row++) {
    for (const column of columnOrder) {
      if (!occupied.has(`${String(row)}:${String(column)}`)) return { row, column };
    }
  }
  return { row: startRow + 64, column: desiredColumn };
}

function uniqueColumns(values: readonly number[]): (0 | 1 | 2)[] {
  const out: (0 | 1 | 2)[] = [];
  for (const value of values) {
    if ((value === 0 || value === 1 || value === 2) && !out.includes(value)) out.push(value);
  }
  return out;
}

function requiredLevelRow(level: number): number {
  if (level <= 1) return 0;
  if (level <= 6) return 1;
  if (level <= 12) return 2;
  if (level <= 18) return 3;
  if (level <= 24) return 4;
  return 5;
}

function nodeStateClass(level: number, locked: boolean, selected: boolean): string {
  const state = locked
    ? 'border-d2-border text-d2-white/70 grayscale'
    : level > 0
      ? 'border-d2-gold bg-d2-gold/10 text-d2-gold shadow-[0_0_14px_rgba(210,176,91,0.18)]'
      : 'border-d2-border text-d2-white/80 hover:border-d2-gold/70';
  return `${state} ${selected ? 'ring-2 ring-d2-gold ring-offset-2 ring-offset-black' : ''}`;
}

function nodeStateLabel(skill: SkillTemplate, level: number, locked: boolean, t: Translate): string {
  if (locked) return t('details.stateLocked');
  if (level >= skill.maxLevel) return t('details.stateMaxed');
  if (level > 0) return t('details.stateLearned');
  return t('details.stateAvailable');
}

function skillIconClass(skill: SkillTemplate): string {
  switch (skill.damageType) {
    case 'fire': return 'from-orange-900 to-red-950 text-orange-200';
    case 'cold': return 'from-cyan-900 to-slate-950 text-cyan-100';
    case 'lightning': return 'from-violet-900 to-slate-950 text-yellow-100';
    case 'arcane': return 'from-purple-900 to-slate-950 text-violet-100';
    case 'poison': return 'from-emerald-950 to-slate-950 text-emerald-100';
    case 'thorns': return 'from-lime-950 to-stone-950 text-lime-100';
    case 'physical': return 'from-stone-800 to-red-950 text-stone-100';
    default:
      return skill.summon
        ? 'from-stone-900 to-emerald-950 text-emerald-100'
        : skill.trigger === 'passive'
          ? 'from-stone-800 to-black text-d2-gold'
          : 'from-slate-900 to-black text-d2-white';
  }
}

function SkillFallbackMark({ skill }: { readonly skill: SkillTemplate }) {
  if (skill.summon) {
    return (
      <svg viewBox="0 0 36 36" className="h-7 w-7" aria-hidden="true">
        <circle cx="18" cy="17" r="9" fill="currentColor" opacity="0.28" />
        <path d="M12 17c0-5 3-8 6-8s6 3 6 8c0 4-2 6-4 7v3h-4v-3c-2-1-4-3-4-7Z" fill="currentColor" opacity="0.9" />
        <circle cx="15.2" cy="17.5" r="1.5" fill="black" opacity="0.8" />
        <circle cx="20.8" cy="17.5" r="1.5" fill="black" opacity="0.8" />
      </svg>
    );
  }
  if (skill.trigger === 'passive' || skill.trigger === 'aura') {
    return (
      <svg viewBox="0 0 36 36" className="h-7 w-7" aria-hidden="true">
        <path d="M18 5l3.2 9.3H31l-7.8 5.7 3 9.2L18 23.5l-8.2 5.7 3-9.2L5 14.3h9.8L18 5Z" fill="currentColor" opacity="0.9" />
        <circle cx="18" cy="18" r="12" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      </svg>
    );
  }
  switch (skill.damageType) {
    case 'fire':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" aria-hidden="true">
          <path d="M19 4c2 6-5 7-1 13 1.4-3 4-4.5 5-8 5 5 7 11 2 17-4 5-13 5-17-1-4-7 2-12 7-18-.2 5 2 7 4 9 1-4-1-6 0-12Z" fill="currentColor" />
        </svg>
      );
    case 'cold':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" aria-hidden="true">
          <path d="M18 4v28M6 11l24 14M30 11L6 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
          <path d="M18 8l4 4-4 4-4-4 4-4Zm0 12l4 4-4 4-4-4 4-4Z" fill="currentColor" opacity="0.75" />
        </svg>
      );
    case 'lightning':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" aria-hidden="true">
          <path d="M22 3L9 20h8l-3 13 13-18h-8l3-12Z" fill="currentColor" />
        </svg>
      );
    case 'arcane':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" aria-hidden="true">
          <circle cx="18" cy="18" r="10" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.8" />
          <circle cx="18" cy="18" r="3" fill="currentColor" />
          <path d="M18 4v5M18 27v5M4 18h5M27 18h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'poison':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" aria-hidden="true">
          <circle cx="15" cy="15" r="7" fill="currentColor" opacity="0.8" />
          <circle cx="22" cy="20" r="8" fill="currentColor" opacity="0.45" />
          <circle cx="24" cy="10" r="3" fill="currentColor" opacity="0.9" />
        </svg>
      );
    case 'thorns':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" aria-hidden="true">
          <path d="M18 4l4 11 10 3-10 3-4 11-4-11-10-3 10-3 4-11Z" fill="currentColor" opacity="0.9" />
          <path d="M7 8l22 20M29 8L7 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        </svg>
      );
    case 'physical':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" aria-hidden="true">
          <path d="M8 26L26 8l3 3-18 18H8v-3Zm20 2L10 10l2-2 18 18v2h-2Z" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" aria-hidden="true">
          <circle cx="18" cy="18" r="10" fill="currentColor" opacity="0.75" />
          <path d="M18 8v20M8 18h20" stroke="black" strokeWidth="3" strokeLinecap="round" opacity="0.45" />
        </svg>
      );
  }
}

function dynamicDescription(
  skillName: string,
  skill: SkillTemplate,
  stats: SkillRankDisplayStats | undefined,
  t: Translate
): string {
  const firstDamage = stats?.damage[0];
  if (firstDamage) {
    return t('details.descriptionDamage', {
      skill: skillName,
      type: t(`damage-types:type.${firstDamage.type}`),
      min: firstDamage.min,
      max: firstDamage.max
    });
  }
  if (stats?.summonCap !== undefined) {
    return t('details.descriptionSummon', { skill: skillName, count: stats.summonCap });
  }
  return t('details.descriptionUtility', {
    skill: skillName,
    trigger: t(`trigger.${skill.trigger}`, { defaultValue: skill.trigger })
  });
}

function damageDelta(row: SkillDamageDisplayRow, compare: SkillRankDisplayStats | undefined): string | null {
  const old = compare?.damage.find((candidate) => candidate.type === row.type);
  if (!old) return null;
  return rangeDelta(row, old);
}

function rangeDelta(
  next: { readonly min: number; readonly max: number },
  current: { readonly min: number; readonly max: number }
): string | null {
  const minDelta = next.min - current.min;
  const maxDelta = next.max - current.max;
  if (minDelta === 0 && maxDelta === 0) return null;
  return `(+${String(minDelta)}% ~ +${String(maxDelta)}%)`;
}

function numberDelta(next: number, current: number, t: Translate): string | null {
  const delta = next - current;
  if (delta === 0) return t('details.noChange');
  return delta > 0 ? `(+${String(delta)})` : `(${String(delta)})`;
}

function allocationButtonLabel({
  locked,
  maxed,
  skillPoints,
  playerLevel,
  requiredLevel,
  missingPrereqs,
  t
}: {
  readonly locked: boolean;
  readonly maxed: boolean;
  readonly skillPoints: number;
  readonly playerLevel: number;
  readonly requiredLevel: number;
  readonly missingPrereqs: readonly string[];
  readonly t: Translate;
}): string {
  if (maxed) return t('details.maxedButton');
  if (locked && playerLevel < requiredLevel) return t('details.lockedLevelButton', { level: requiredLevel });
  if (locked && missingPrereqs.length > 0) return t('details.lockedPrereqButton');
  if (skillPoints <= 0) return t('details.noPointsButton');
  return t('allocate');
}

function humanizeId(id: string): string {
  return id.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function addAllocatedLevelAlias(map: Map<string, number>, id: string, level: number): void {
  for (const alias of skillIdAliases(id)) {
    map.set(alias, level);
  }
}

/** Slugify a free-form skill-tree name into a stable i18n key segment. */
function slugifyTreeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
