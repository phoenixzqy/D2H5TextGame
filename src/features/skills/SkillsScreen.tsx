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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { IronGolemPanel } from './IronGolemPanel';
import { Button, Panel, ScreenShell, Tabs, resolveSkillIcon, tDataKey } from '@/ui';
import { usePlayerStore } from '@/stores';
import { useInventoryStore } from '@/stores/inventoryStore';
import {
  canonicalSkillIdFromData,
  dataSkillIdFromCanonical,
  getAllocatedSkillLevel,
  getSkillRequiredLevel,
  getSkillsForClass,
  organizeSkillsByTree,
  isSkillLocked,
  skillIdAliases,
  type SkillTemplate
} from '@/stores/skillsHelpers';
import { refreshActivePlayerCombatConfig, resolveEquippedWeapon } from '@/stores/combatHelpers';
import { WaveGuardError } from '@/stores/waveTransitionGuard';
import { RecordedWaveAccessError } from '@/stores/recordedWaveAccess';
import { getSkill, listSkills } from '@/engine/skills/registry';
import { canCastSkill } from '@/engine/skills/eligibility';
import { isPreparationSummonSkill } from '@/engine/skills/summon-preparation';
import { resolveEquippedRunewordGrants } from '@/engine/items/runeword-grants';
import { governedActiveId, projectGovernedActives } from '@/engine/skills/runeword-actives';
import { AMPLIFY_DAMAGE_DEFINITION } from '@/engine/combat/amplify-damage-definition';
import { STATUS_DEFAULTS } from '@/engine/combat/status';
import { CHILL_DEFINITION } from '@/engine/combat/chill-definition';
import { PLAGUE_DEFINITION } from '@/engine/combat/plague-definition';
import { METEOR_ARMOR_MELT_DEFINITION } from '@/engine/skills/armor-melt';
import { IRON_SKIN_DEFINITION, resolveIronSkinRank } from '@/engine/skills/iron-skin';
import { AMAZON_PASSIVE_DEFINITIONS, AMAZON_PASSIVE_IDENTITIES, AMAZON_PASSIVE_KEYS } from '@/engine/skills/amazon-passives';
import { BARBARIAN_ENDURANCE_DEFINITIONS, BARBARIAN_ENDURANCE_IDENTITIES,
  resolveBarbarianEnduranceRank } from '@/engine/skills/barbarian-endurance';
import { BARBARIAN_WARCRY_DEFINITIONS, BARBARIAN_WARCRY_IDENTITIES,
  resolveBarbarianWarcryRank } from '@/engine/skills/barbarian-warcries';
import { BARBARIAN_WEAPON_MASTERY_DEFINITIONS, BARBARIAN_WEAPON_MASTERY_IDENTITIES, BARBARIAN_WEAPON_MASTERY_KEYS,
  resolveBarbarianWeaponMasteryRank } from '@/engine/skills/barbarian-weapon-masteries';
import { SKELETON_MASTERY_DEFINITION, composeSkeletonMastery, resolveSkeletonMasteryRank } from '@/engine/skills/skeleton-mastery';
import { GOLEM_MASTERY_DEFINITION, composeGolemMastery, resolveGolemMasteryRank } from '@/engine/skills/golem-mastery';
import { LIGHTNING_MASTERY_DEFINITION, resolveLightningMasteryRank } from '@/engine/skills/lightning-mastery';
import { composeSummonPassives, SUMMON_PASSIVE_IDENTITIES, SUMMON_PASSIVE_DEFINITIONS } from '@/engine/skills/summon-passives';
import { ASSASSIN_WEAPON_PASSIVE_DEFINITIONS, ASSASSIN_WEAPON_PASSIVE_IDENTITIES } from '@/engine/skills/assassin-weapon-passives';
import { ASSASSIN_SHADOW_DEFINITIONS, ASSASSIN_SHADOW_IDENTITIES } from '@/engine/skills/assassin-shadow';
import { DRUID_ALLY_AURA_DEFINITIONS, DRUID_ALLY_AURA_IDS, druidAllyAuraRank } from '@/engine/skills/druid-ally-auras';
import { SPIRIT_OF_BARBS_DEFINITION, SPIRIT_OF_BARBS_IDS, spiritOfBarbsRank } from '@/engine/skills/spirit-of-barbs';
import { DRUID_SHAPE_DEFINITIONS, DRUID_SHAPE_IDS, druidFormForId, resolveDruidShapeRank, type DruidShapeKey } from '@/engine/skills/druid-shapeshifting';
import { BURST_OF_SPEED_DEFINITION, BURST_OF_SPEED_IDS } from '@/engine/skills/burst-of-speed';
import { CLOAK_OF_SHADOWS_DEFINITION, CLOAK_OF_SHADOWS_IDS } from '@/engine/skills/cloak-of-shadows';
import { BONE_ARMOR_DEFINITION, BONE_ARMOR_IDS } from '@/engine/skills/bone-armor';
import { ENERGY_SHIELD_DEFINITION, ENERGY_SHIELD_IDS, resolveEnergyShieldRank } from '@/engine/skills/energy-shield';
import { CONVERSION_DEFINITION, CONVERSION_IDS } from '@/engine/skills/conversion';
import { HOLY_SHIELD_DEFINITION, HOLY_SHIELD_IDS } from '@/engine/skills/holy-shield';
import { CYCLONE_ARMOR_DEFINITION, CYCLONE_ARMOR_IDS } from '@/engine/skills/cyclone-armor';
import { DAMAGE_MASTERY_DEFINITIONS, DAMAGE_MASTERY_IDENTITIES } from '@/engine/skills/damage-masteries';
import { COLD_MASTERY_DEFINITION, coldMasteryReductionAtRank, resolveColdMasteryRank } from '@/engine/skills/cold-mastery';
import { resolveStaticFieldRank } from '@/engine/skills/static-field';
import { MIGHT_DEFINITION, resolveEligibleMightRank, resolveMightRank } from '@/engine/skills/might';
import { MEDITATION_DEFINITION, resolveEligibleMeditationRank, resolveMeditationRank } from '@/engine/skills/meditation';
import { isStatAuraId, resolveEligibleStatAuraRank, STAT_AURA_DEFINITIONS, STAT_AURA_IDS } from '@/engine/skills/stat-auras';
import {
  computeSkillDisplayModel,
  type SkillDamageDisplayRow,
  type SkillDisplayModel,
  type SkillRankDisplayStats,
  type SkillSummonStatDisplayRow,
  type SkillUtilityDisplayRow
} from '@/engine/skills/displayStats';

const COMBO_SLOTS = 9;
const TREE_WIDTH = 320;
const TREE_ROW_HEIGHT = 104;
const TREE_TOP = 48;
const TREE_COLUMNS = [48, 160, 272] as const;
const SKILL_NODE_RADIUS = 40;
const CONNECTOR_NODE_MASK_RADIUS = 46;

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
  const equipped = useInventoryStore((s) => s.equipped);
  const setComboOrder = usePlayerStore((s) => s.setComboOrder);
  const allocateSkillPoint = usePlayerStore((s) => s.allocateSkillPoint);
  const selectAura = usePlayerStore((s) => s.selectAura);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [previewSkillId, setPreviewSkillId] = useState<string | null>(null);
  const [replayRefused, setReplayRefused] = useState(false);

  const skillPoints = player?.skillPoints ?? 0;
  const playerLevel = player?.level ?? 1;
  const playerClass = player?.class ?? '';
  const eligibleMightRank = player ? resolveEligibleMightRank(player) : 0;
  const eligibleMeditationRank = player ? resolveEligibleMeditationRank(player) : 0;
  const selectedAuraName = player?.selectedAuraId
    ? tDataKey(t, `skills.${player.selectedAuraId}.name`) : t('auraSelection.none');
  const selectedAuraEligible = player?.selectedAuraId === 'paladin.might' ? eligibleMightRank > 0
    : player?.selectedAuraId === 'paladin.meditation' ? eligibleMeditationRank > 0
      : player && isStatAuraId(player.selectedAuraId) ? resolveEligibleStatAuraRank(player, player.selectedAuraId) > 0 : false;

  const allSkills = useMemo(() => {
    if (!playerClass) return [];
    return getSkillsForClass(playerClass);
  }, [playerClass]);

  const skillById = useMemo(() => new Map(allSkills.map((skill) => [skill.id, skill])), [allSkills]);
  const skillTrees = useMemo(() => organizeSkillsByTree(allSkills), [allSkills]);
  const registeredSkillIds = useMemo(() => new Set(listSkills()), []);
  const equippedWeapon = useMemo(
    () => resolveEquippedWeapon(equipped),
    [equipped]
  );

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
    for (const key of Object.keys(DRUID_SHAPE_IDS) as DruidShapeKey[]) {
      const rank = resolveDruidShapeRank(key, levels);
      for (const alias of DRUID_SHAPE_IDS[key]) {
        if (rank > 0) map.set(alias, rank);
        else map.delete(alias);
      }
    }
    for (const key of ['oak', 'heart'] as const) {
      const rank = druidAllyAuraRank(key, levels);
      for (const alias of DRUID_ALLY_AURA_IDS[key]) {
        if (rank > 0) map.set(alias, rank);
        else map.delete(alias);
      }
    }
    const barbsRank = spiritOfBarbsRank(levels);
    for (const alias of SPIRIT_OF_BARBS_IDS) {
      if (barbsRank > 0) map.set(alias, barbsRank);
      else map.delete(alias);
    }
    const mightRank = resolveMightRank(levels);
    for (const alias of ['paladin.might', 'skills-paladin-might']) {
      if (mightRank > 0) map.set(alias, mightRank);
      else map.delete(alias);
    }
    const meditationRank = resolveMeditationRank(levels);
    for (const alias of ['paladin.meditation', 'skills-paladin-meditation']) {
      if (meditationRank > 0) map.set(alias, meditationRank);
      else map.delete(alias);
    }
    const lightningRank = resolveLightningMasteryRank(levels);
    for (const alias of ['sorceress.lightning_mastery', 'skills-sorceress-lightning-mastery']) {
      if (lightningRank > 0) map.set(alias, lightningRank);
      else map.delete(alias);
    }
    const ironSkinRank = resolveIronSkinRank(levels);
    const coldRank = resolveColdMasteryRank(levels);
    const staticRank = resolveStaticFieldRank(levels);
    const shieldRank = resolveEnergyShieldRank(levels);
    for (const alias of ENERGY_SHIELD_IDS) {
      if (shieldRank > 0) map.set(alias, shieldRank);
      else map.delete(alias);
    }
    for (const alias of ['sorceress.static_field', 'skills-sorceress-static-field']) {
      if (staticRank > 0) map.set(alias, staticRank);
      else map.delete(alias);
    }
    for (const alias of ['sorceress.cold_mastery', 'skills-sorceress-cold-mastery']) {
      if (coldRank > 0) map.set(alias, coldRank);
      else map.delete(alias);
    }
    for (const alias of ['barbarian.iron_skin', 'skills-barbarian-iron-skin']) {
      if (ironSkinRank > 0) map.set(alias, ironSkinRank);
      else map.delete(alias);
    }
    for (const key of ['stamina', 'speed', 'resistance'] as const) {
      const rank = resolveBarbarianEnduranceRank(key, levels);
      for (const alias of BARBARIAN_ENDURANCE_IDENTITIES[key]) {
        if (rank > 0) map.set(alias, rank);
        else map.delete(alias);
      }
    }
    for (const key of ['shout', 'orders'] as const) {
      const rank = resolveBarbarianWarcryRank(key, levels);
      for (const alias of BARBARIAN_WARCRY_IDENTITIES[key]) {
        if (rank > 0) map.set(alias, rank);
        else map.delete(alias);
      }
    }
    for (const key of BARBARIAN_WEAPON_MASTERY_KEYS) {
      const rank = resolveBarbarianWeaponMasteryRank(key, levels);
      for (const alias of BARBARIAN_WEAPON_MASTERY_IDENTITIES[key]) {
        if (rank > 0) map.set(alias, rank);
        else map.delete(alias);
      }
    }
    const skeletonMasteryRank = resolveSkeletonMasteryRank(levels);
    for (const alias of ['necromancer.skeleton_mastery', 'skills-necromancer-skeleton-mastery']) {
      if (skeletonMasteryRank > 0) map.set(alias, skeletonMasteryRank);
      else map.delete(alias);
    }
    const golemMasteryRank = resolveGolemMasteryRank(levels);
    for (const alias of ['necromancer.golem_mastery', 'skills-necromancer-golem-mastery']) {
      if (golemMasteryRank > 0) map.set(alias, golemMasteryRank);
      else map.delete(alias);
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
  const selectedSkill = skillById.get(selectedSkillId);
  const activeModel = activeSkill
    ? computeSkillDisplayModel(activeSkill, allocatedSkills.get(activeSkill.id) ?? 0,
      player ? composeSkeletonMastery(player) : undefined, undefined,
      player ? composeGolemMastery(player) : undefined,
      player ? composeSummonPassives(player) : undefined)
    : null;
  const activeLocked = activeSkill ? isSkillLocked(activeSkill, playerLevel, allocatedSkills) : false;
  const activeCanAllocate = Boolean(
    activeSkill &&
      activeModel &&
      !activeLocked &&
      !activeModel.maxed &&
      skillPoints > 0
  );

  const configurableActiveSkills = useMemo(
    () =>
      allSkills.filter((skill) => {
        if (skill.trigger !== 'active') return false;
        if (governedActiveId(skill.id)) return false;
        if (isSkillLocked(skill, playerLevel, allocatedSkills)) return false;
        if (getAllocatedSkillLevel(allocatedSkills, skill.id) <= 0) return false;
        const canonicalId = canonicalSkillIdFromData(skill.id) ?? skill.id;
        if (!registeredSkillIds.has(canonicalId)) return false;
        const registeredSkill = getSkill(canonicalId);
        return registeredSkill ? canCastSkill(registeredSkill, equippedWeapon).ok : false;
      }),
    [allSkills, allocatedSkills, equippedWeapon, playerLevel, registeredSkillIds]
  );

  const sanitizedComboOrder = useMemo<string[]>(() => {
    const validIds = new Set(configurableActiveSkills.map((skill) => skill.id));
    const seen = new Set<string>();
    return (player?.comboOrder ?? [])
      .map((id) => governedActiveId(id) ?? dataSkillIdFromCanonical(id) ?? id)
      .filter((id) => {
        if (!governedActiveId(id)) return validIds.has(id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  }, [configurableActiveSkills, player?.comboOrder]);

  const activeProjection = useMemo(() => projectGovernedActives({
    owner: { kind: 'hero', classId: playerClass, level: playerLevel,
      learnedRanks: player?.skillLevels ?? {} },
    grants: resolveEquippedRunewordGrants(equipped), storedOrder: sanitizedComboOrder
  }), [equipped, playerClass, playerLevel, player?.skillLevels, sanitizedComboOrder]);
  const activeChoices = useMemo(() => [
    ...configurableActiveSkills.map(skill => ({ id: skill.id, nameKey: skill.name, available: true })),
    ...activeProjection.choices.filter(choice => choice.available || activeProjection.configuredOrder.includes(choice.id))
  ], [activeProjection, configurableActiveSkills]);

  const saveComboOrder = useCallback((order: readonly string[]): void => {
    setComboOrder(order.filter(Boolean));
    // Keep a paid form and its current recording intact; form priorities take effect next wave.
    if (playerClass === 'druid' && [...(player?.comboOrder ?? []), ...order]
      .some(id => druidFormForId(id) !== undefined)) {
      setReplayRefused(false);
      return;
    }
    try {
      refreshActivePlayerCombatConfig({ replayCurrentWave: true });
      setReplayRefused(false);
    } catch (error) {
      if (!(error instanceof WaveGuardError) && !(error instanceof RecordedWaveAccessError)) throw error;
      setReplayRefused(true);
    }
  }, [playerClass, player?.comboOrder, setComboOrder]);

  useEffect(() => {
    if (!player) return;
    if (!sameStringArray(sanitizedComboOrder, player.comboOrder)) {
      setComboOrder(sanitizedComboOrder);
    }
  }, [player, sanitizedComboOrder, setComboOrder]);

  const combo = useMemo<string[]>(() => {
    const arr = [...activeProjection.configuredOrder];
    while (arr.length < COMBO_SLOTS) arr.push('');
    return arr;
  }, [activeProjection]);

  const moveCombo = (idx: number, dir: -1 | 1) => {
    const next = [...combo];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    const a = next[idx] ?? '';
    const b = next[target] ?? '';
    next[idx] = b;
    next[target] = a;
    saveComboOrder(next);
  };

  const setComboAt = (idx: number, skillId: string) => {
    const next = [...combo];
    next[idx] = skillId;
    saveComboOrder(next);
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
            <Panel key={treeName} title={treeTitle} className="overflow-x-auto overflow-y-hidden" data-testid={`skills-tree-column-${treeSlug}`}>
              <p className="mb-3 text-xs text-d2-white/70">{t('details.treeSummary')}</p>
              <SkillTreeBoard
                skills={treeSkills}
                layout={layout}
                connectorMaskId={`skill-tree-connector-mask-${treeSlug}`}
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
      {selectedSkill?.id === 'skills-necromancer-iron-golem' ? (
        <IronGolemPanel
          skill={selectedSkill}
          rank={allocatedSkills.get(selectedSkill.id) ?? 0}
        />
      ) : null}
    </div>
  );

  const activePanel = (
    <Panel title={t('activeSkills')} data-testid="skills-active-panel">
      <p className="text-xs text-d2-white/70 mb-2">{t('dragToReorder')}</p>
      {replayRefused ? <p role="alert" className="mb-2 text-d2-red">{t('common:error')}</p> : null}
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
              className="flex-1 min-w-0 min-h-[44px] bg-d2-bg border border-d2-border rounded px-2 text-sm
                         focus:outline-none focus:border-d2-gold"
              aria-label={t('slotN', { n: idx + 1 })}
            >
              <option value="">— {t('common:none')} —</option>
              {activeChoices.map((sk) => (
                <option key={sk.id} value={sk.id} disabled={!sk.available}>{sk.available ? tDataKey(t, sk.nameKey)
                  : t('equipmentUnavailable', { skill: tDataKey(t, sk.nameKey) })}</option>
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

        {player.class === 'paladin' || player.selectedAuraId !== undefined ? (
          <Panel>
            <fieldset className="min-w-0 space-y-3" aria-describedby="aura-selection-timing">
              <legend className="font-serif text-lg text-d2-gold">{t('auraSelection.legend')}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded border border-d2-border bg-d2-bg/40 px-3 py-2 text-base">
                  <input type="radio" name="selected-player-aura" value="none"
                    checked={!Object.hasOwn(player, 'selectedAuraId')}
                    onChange={() => { selectAura(null); }}
                    aria-describedby="aura-selection-timing"
                    className="h-5 w-5 accent-d2-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-d2-gold" />
                  <span>{t('auraSelection.none')}</span>
                </label>
                <label className="flex min-h-[44px] items-center gap-3 rounded border border-d2-border bg-d2-bg/40 px-3 py-2 text-base">
                  <input type="radio" name="selected-player-aura" value="paladin.might"
                    checked={player.selectedAuraId === 'paladin.might'}
                    disabled={eligibleMightRank === 0}
                    onChange={() => { selectAura('paladin.might'); }}
                    aria-describedby="aura-selection-timing aura-selection-eligibility"
                    className="h-5 w-5 accent-d2-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-d2-gold" />
                  <span>{t('auraSelection.might')}</span>
                </label>
                <label className="flex min-h-[44px] items-center gap-3 rounded border border-d2-border bg-d2-bg/40 px-3 py-2 text-base">
                  <input type="radio" name="selected-player-aura" value="paladin.meditation"
                    checked={player.selectedAuraId === 'paladin.meditation'}
                    disabled={eligibleMeditationRank === 0}
                    onChange={() => { selectAura('paladin.meditation'); }}
                    aria-describedby="aura-selection-timing meditation-selection-eligibility"
                    className="h-5 w-5 accent-d2-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-d2-gold" />
                  <span>{t('auraSelection.meditation')}</span>
                </label>
                {STAT_AURA_IDS.map(id => {
                  const name = tDataKey(t, `skills.${id}.name`);
                  return <label key={id} className="flex min-h-[44px] items-center gap-3 rounded border border-d2-border bg-d2-bg/40 px-3 py-2 text-base">
                    <input type="radio" name="selected-player-aura" value={id} aria-label={name}
                      checked={player.selectedAuraId === id} disabled={resolveEligibleStatAuraRank(player, id) === 0}
                      onChange={() => { selectAura(id); }}
                      aria-describedby={`aura-selection-timing aura-eligibility-${id}`}
                      className="h-5 w-5 shrink-0 accent-d2-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-d2-gold" />
                    <span className="min-w-0">
                      <span className="block">{name}</span>
                      <span id={`aura-eligibility-${id}`} className="block text-sm text-d2-white/80">
                        {t('auraSelection.statEligibility', { level: STAT_AURA_DEFINITIONS[id].requiredLevel })}
                      </span>
                    </span>
                  </label>;
                })}
              </div>
              <p role="status" aria-live="polite" className="text-d2-gold">
                {t(player.selectedAuraId && !selectedAuraEligible ? 'auraSelection.genericUnavailable' : 'auraSelection.selected',
                  { aura: selectedAuraName })}
              </p>
              <p id="aura-selection-eligibility" className="text-sm text-d2-white/90">
                {eligibleMightRank > 0 ? null : player.class !== 'paladin'
                  ? t('auraSelection.needsClass')
                  : !Number.isFinite(player.level) || player.level < MIGHT_DEFINITION.requiredLevel
                    ? t('auraSelection.needsLevel', { level: MIGHT_DEFINITION.requiredLevel })
                    : t('auraSelection.needsRank')}
              </p>
              <p id="meditation-selection-eligibility" className="text-sm text-d2-white/90">
                {eligibleMeditationRank > 0 ? null : player.class !== 'paladin'
                  ? t('auraSelection.meditationNeedsClass')
                  : !Number.isFinite(player.level) || player.level < MEDITATION_DEFINITION.requiredLevel
                    ? t('auraSelection.meditationNeedsLevel', { level: MEDITATION_DEFINITION.requiredLevel })
                    : t('auraSelection.meditationNeedsRank')}
              </p>
              <div className="space-y-1 text-sm text-d2-white/90">
                <p id="aura-selection-timing">{t('auraSelection.timing')}</p>
                <p>{t('auraSelection.recipients')}</p>
                <p>{t('auraSelection.source')}</p>
                <p>{t('auraSelection.meditationEarned')}</p>
              </div>
            </fieldset>
          </Panel>
        ) : null}

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
  connectorMaskId,
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
  readonly connectorMaskId: string;
  readonly allocatedSkills: ReadonlyMap<string, number>;
  readonly playerLevel: number;
  readonly selectedSkillId: string;
  readonly previewSkillId: string | null;
  readonly onSelect: (skillId: string) => void;
  readonly onPreview: (skillId: string | null) => void;
  readonly t: Translate;
}) {
  const maxRow = Math.max(0, ...Array.from(layout.values()).map((node) => node.row));
  const height = TREE_TOP * 2 + maxRow * TREE_ROW_HEIGHT + SKILL_NODE_RADIUS * 2;
  const edges = buildPrerequisiteEdges(skills, layout);
  const connectorMasks = Array.from(layout.values());
  const orderedSkills = [...skills].sort((a, b) => {
    const aNode = layout.get(a.id);
    const bNode = layout.get(b.id);
    if (!aNode || !bNode) return a.id.localeCompare(b.id);
    const rowDelta = aNode.row - bNode.row;
    return rowDelta !== 0 ? rowDelta : aNode.column - bNode.column;
  });
  return (
    <div
      className="relative mx-auto w-[320px] min-w-[320px] rounded border border-d2-border/70
                 bg-[radial-gradient(circle_at_50%_0%,rgba(210,176,91,0.12),transparent_48%),linear-gradient(135deg,rgba(255,255,255,0.04)_0,transparent_40%)]
                 shadow-inner"
      data-testid="skill-tree-board"
      style={{ height }}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${String(TREE_WIDTH)} ${String(height)}`} aria-hidden="true">
        <defs>
          <mask id={connectorMaskId} maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width={TREE_WIDTH} height={height} fill="white" />
            {connectorMasks.map((node) => (
              <rect
                key={node.skillId}
                x={node.x - CONNECTOR_NODE_MASK_RADIUS}
                y={node.y - CONNECTOR_NODE_MASK_RADIUS}
                width={CONNECTOR_NODE_MASK_RADIUS * 2}
                height={CONNECTOR_NODE_MASK_RADIUS * 2}
                rx="10"
                fill="black"
                data-testid="skill-connector-mask"
                data-node-id={node.skillId}
              />
            ))}
          </mask>
        </defs>
        <g mask={`url(#${connectorMaskId})`} data-testid="skill-prerequisite-edge-layer">
          {edges.map((edge) => {
            const learned = (allocatedSkills.get(edge.fromSkillId) ?? 0) > 0;
            const midY = edge.parent.y + Math.max(18, (edge.child.y - edge.parent.y) / 2);
            const d = `M ${String(edge.parent.x)} ${String(edge.parent.y + SKILL_NODE_RADIUS)} V ${String(midY)} H ${String(edge.child.x)} V ${String(edge.child.y - SKILL_NODE_RADIUS)}`;
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
        </g>
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
            onKeyDown={(event) => {
              // Restore the committed action before native Tab chooses its target.
              if (event.key === 'Tab') flushSync(() => { onPreview(null); });
            }}
            onFocus={() => { onPreview(skill.id); }}
            onBlur={() => { onPreview(null); }}
            className={`absolute flex h-20 w-20 items-center justify-center rounded border-2
                        bg-black/70 text-[10px] transition focus:outline-none focus-visible:ring-2
                        focus-visible:ring-d2-gold motion-safe:hover:-translate-y-0.5
                        ${nodeStateClass(level, locked, selected || previewed)}`}
            style={{ left: node.x - SKILL_NODE_RADIUS, top: node.y - SKILL_NODE_RADIUS }}
          >
            <SkillIcon skill={skill} label={name} />
            <span className="sr-only">{name}</span>
            {locked ? <span className="absolute right-1 top-1 text-[11px]" aria-hidden="true">🔒</span> : null}
            <span className="absolute bottom-1 rounded bg-black/70 px-1 leading-none text-d2-white/90">
              {level}/{skill.maxLevel}
            </span>
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
      className="h-[34rem] overflow-y-auto border-d2-gold/70 bg-d2-panel/95 shadow-[0_0_28px_rgba(210,176,91,0.16)] backdrop-blur md:h-[21rem]"
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
              {t(`trigger.${skill.id === 'skills-paladin-might' || skill.id === 'skills-paladin-meditation' ||
                isStatAuraId(skill.id.replace('skills-paladin-', 'paladin.')) ? 'aura' : skill.trigger}`, { defaultValue: skill.trigger })}
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
        {primaryStats?.recovery ? (
          <p className="text-sm text-d2-white/90">{t('details.descriptionRecovery', primaryStats.recovery)}</p>
        ) : null}
        {primaryStats?.selfDamage ? (
          <p className="text-sm text-d2-white/90">{t('details.descriptionSelfDamage', primaryStats.selfDamage)}</p>
        ) : null}
        {primaryStats?.feralRage ? (
          <p className="text-sm text-d2-white/90">{t('details.descriptionFeralSpeed', primaryStats.feralRage)}</p>
        ) : null}
        {primaryStats?.burn ? (
          <p className="text-sm text-d2-white/90">{t(primaryStats.burn.component
            ? 'details.descriptionComponentBurn' : 'details.descriptionBurn', primaryStats.burn)}</p>
        ) : null}
        {primaryStats?.periodic ? (
          <p className="text-sm text-d2-white/90">{t(primaryStats.periodic.stacksOnApply
            ? 'details.descriptionPeriodicMultiple' : 'details.descriptionPeriodic', {
            ...primaryStats.periodic, status: t(`combat:effect.status.${primaryStats.periodic.statusId}`)
          })}</p>
        ) : null}
        {skill.id === 'skills-paladin-meditation' ? (
          <p className="text-sm text-d2-white/90">{t('auraSelection.meditationRankBonuses')}</p>
        ) : null}
        {skill.id === 'skills-paladin-might' ? (
          <p className="text-sm text-d2-white/90">{t('auraSelection.rankBonuses')}</p>
        ) : null}
        {isStatAuraId(skill.id.replace('skills-paladin-', 'paladin.')) ? (
          <p className="text-sm text-d2-white/90">{t('auraSelection.statRankBonuses')}</p>
        ) : null}

        {skill.id === 'skills-necromancer-iron-golem' ? (
          <p className="text-sm text-d2-white/90">{t('ironGolem.basePreview')}</p>
        ) : null}
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
  const summonEffect = stats?.summonUnit?.effect;
  return (
    <section className="rounded border border-d2-border/70 bg-black/25 p-3">
      <h3 className="mb-2 font-serif text-sm text-d2-gold">{title}</h3>
      {stats ? (
        <dl className="space-y-1 text-xs">
          {stats.damage.map((row) => (
            <StatLine
              key={`damage-${row.type}`}
              label={t(stats.hydra ? 'details.damagePerHead' : stats.periodicSpell ? 'details.damagePerPulse' : 'details.damageAttack', { type: t(`damage-types:type.${row.type}`) })}
              value={t('details.flatRange', { min: row.min, max: row.max })}
              delta={damageDelta(row, compare, t)}
            />
          ))}
          {stats.skillRankBuff ? <>
            <StatLine label={t('details.skillRankBonus')}
              value={t('details.skillRankBonusValue', { ranks: stats.skillRankBuff.bonusRanks })} />
            <StatLine label={t('details.skillRankDuration')}
              value={t('details.seconds', { seconds: stats.skillRankBuff.durationSeconds })}
              delta={compare?.skillRankBuff ? numberDelta(stats.skillRankBuff.durationSeconds,
                compare.skillRankBuff.durationSeconds, t) : null} />
          </> : null}
          {stats.hydra ? <StatLine label={t('details.hydraBody')}
            value={t('details.hydraBodyValue', { heads: stats.hydra.heads, duration: stats.hydra.durationSeconds })} /> : null}
          {stats.boneWall ? <>
            <StatLine label={t('details.wallCapacity')} value={String(stats.boneWall.capacity)}
              delta={compare?.boneWall ? numberDelta(stats.boneWall.capacity, compare.boneWall.capacity, t) : null} />
            <StatLine label={t('details.wallDuration')}
              value={t('details.seconds', { seconds: stats.boneWall.durationSeconds })} />
          </> : null}
          {stats.corpseWard ? <>
            <StatLine label={t('details.wardDuration')} value={t('details.wardTimingValue', {
              duration: stats.corpseWard.durationSeconds, interval: stats.corpseWard.intervalSeconds })} />
            <StatLine label={t('details.wardFear')} value={t('details.wardFearValue', {
              fear: stats.corpseWard.fearSeconds, boss: stats.corpseWard.bossFearSeconds })} />
          </> : null}
          {stats.corpseSearch ? <StatLine label={t('details.corpseSearchChance')}
            value={t('details.percentValue', { value: stats.corpseSearch.successPercent })} /> : null}
          {stats.corpseRecovery ? <>
            <StatLine label={t('details.corpseRecoveryLife')}
              value={t('details.percentValue', { value: stats.corpseRecovery.lifePercent })} />
            <StatLine label={t('details.corpseRecoveryMana')}
              value={t('details.percentValue', { value: stats.corpseRecovery.manaPercent })} />
          </> : null}
          {stats.periodicSpell ? <StatLine label={t(stats.periodicSpell.channelled ? 'details.channelTiming' : 'details.spellTiming')} value={t('details.spellTimingValue', {
            duration: stats.periodicSpell.durationSeconds, interval: stats.periodicSpell.intervalSeconds,
            pulses: stats.periodicSpell.pulses
          })} /> : null}
          {stats.periodicSpell?.channelled ? <StatLine label={t('details.channelActions')}
            value={t('details.channelActionsValue')} /> : null}
          {stats.damage.length > 1 && stats.totalDamage ? (
            <StatLine
              label={t('details.totalPower')}
              value={t('details.flatRange', { min: stats.totalDamage.min, max: stats.totalDamage.max })}
              delta={compare?.totalDamage ? rangeDelta(stats.totalDamage, compare.totalDamage, t) : null}
            />
          ) : null}
          {stats.summonCap !== undefined ? (
            <StatLine
              label={t('details.summonCap')}
              value={String(stats.summonCap)}
              delta={compare?.summonCap !== undefined ? numberDelta(stats.summonCap, compare.summonCap, t) : null}
            />
          ) : null}
          {stats.maxTargets !== undefined ? (
            <StatLine label={t('details.maxTargets')} value={String(stats.maxTargets)} />
          ) : null}
          {stats.areaShape === 'cone-2' ? (
            <StatLine label={t('details.areaShape')} value={t('details.cone2Value')} />
          ) : null}
          {stats.areaShape === 'cone-3' ? (
            <StatLine label={t('details.areaShape')} value={t('details.cone3Value')} />
          ) : null}
          {stats.summonUnit ? (
            <>
              {summonEffect?.kind === 'lifeLeech' ? (
                <StatLine label={t('details.summonLifeLeech')}
                  value={t('details.summonLifeLeechValue', summonEffect)} />
              ) : null}
              {stats.summonUnit.attackType ? (
                <StatLine label={t('details.summonAttackType')}
                  value={t(`damage-types:type.${stats.summonUnit.attackType}`)} />
              ) : null}
              <StatLine
                label={t('details.summonedUnit')}
                value={t(stats.summonUnit.nameKey, { defaultValue: humanizeId(stats.summonUnit.summonId) })}
              />
              {stats.summonUnit.stats.map((row) => (
                <StatLine
                  key={`summon-${row.id}`}
                  label={t(row.labelKey)}
                  value={formatSummonStat(row)}
                  delta={summonStatDelta(row, compare)}
                />
              ))}
            </>
          ) : null}
          {summonEffect?.kind === 'blind' ? (
            <>
              <StatLine label={t('details.summonBlindPenalty')}
                value={t('details.summonBlindPenaltyValue', summonEffect)} />
              <StatLine label={t('details.summonBlindDuration')}
                value={t('details.seconds', { seconds: summonEffect.durationSeconds })} />
            </>
          ) : null}
          {summonEffect?.kind === 'poison' || summonEffect?.kind === 'burn' ? (
            <>
              <StatLine label={t('details.periodicRate', { status: t(`combat:effect.status.${summonEffect.kind === 'burn' ? 'ignite' : 'poison'}`) })}
                value={t('details.burnRateValue', summonEffect)} />
              <StatLine label={t('details.periodicDuration', { status: t(`combat:effect.status.${summonEffect.kind === 'burn' ? 'ignite' : 'poison'}`) })}
                value={t('details.seconds', { seconds: summonEffect.durationSeconds })} />
              <StatLine label={t('details.periodicMaxStacks', { status: t(`combat:effect.status.${summonEffect.kind === 'burn' ? 'ignite' : 'poison'}`) })}
                value={String(summonEffect.maxStacks)} />
            </>
          ) : null}
          {summonEffect?.kind === 'corpseRecovery' ? (
            <StatLine label={t('details.summonRecovery')}
              value={t('details.summonRecoveryValue', { ...summonEffect,
                resource: t(`details.summonResource.${summonEffect.resource}`) })} />
          ) : null}
          {stats.utility.map((row) => (
            <StatLine
              key={`utility-${row.id}`}
              label={t(row.labelKey)}
              value={formatUtilityStat(row)}
              delta={utilityDelta(row, compare)}
            />
          ))}
          {stats.manaCost !== undefined ? (
            <StatLine label={t('details.manaCost')} value={String(stats.manaCost)} />
          ) : null}
          {stats.lifeCost !== undefined ? (
            <StatLine label={t('details.lifeCost')} value={String(stats.lifeCost)} />
          ) : null}
          <StatLine label={t('details.cooldown')} value={t('details.seconds', { seconds: stats.cooldown })} />
          {stats.sorceressBuff ? <>
            <StatLine label={t('details.personalBuffDuration')} value={t('details.seconds', { seconds: stats.sorceressBuff.durationSeconds })} />
            {stats.sorceressBuff.magicDodgePoints !== undefined ? <StatLine label={t('details.teleportDodge')}
              value={t('details.teleportDodgeValue', { points: stats.sorceressBuff.magicDodgePoints })} /> : null}
            {stats.sorceressBuff.enchantAttackPercent !== undefined ? <StatLine label={t('details.enchantFire')}
              value={t('details.enchantFireValue', { percent: stats.sorceressBuff.enchantAttackPercent })} /> : null}
          </> : null}
          {stats.coldArmor ? <>
            <StatLine label={t('details.armorRetaliation')} value={`${String(stats.coldArmor.min)} ~ ${String(stats.coldArmor.max)}`} />
            <StatLine label={t('details.armorFreeze')} value={t('details.armorFreezeValue', {
              seconds: stats.coldArmor.freezeSeconds, bossSeconds: stats.coldArmor.bossFreezeSeconds
            })} />
          </> : null}
          {stats.coldAttack ? <>
            <StatLine label={t('details.coldChillDuration')} value={t('details.seconds', { seconds: stats.coldAttack.durationSeconds })} />
            <StatLine label={t('details.coldChillSlow')} value={t('details.percentValue', { value: stats.coldAttack.slowPercent })} />
            {stats.coldAttack.freeze ? <StatLine label={t('details.coldFreeze')} value={t('details.coldFreezeValue', {
              chance: stats.coldAttack.freeze.chancePercent, seconds: stats.coldAttack.freeze.durationSeconds,
              bossSeconds: stats.coldAttack.freeze.bossDurationSeconds
            })} /> : null}
          </> : null}
          {stats.warcry ? <>
            <StatLine label={t('details.warcryDuration')} value={t('details.seconds', { seconds: stats.warcry.durationSeconds })} />
            {stats.warcry.damageReductionPercent !== undefined ? <StatLine label={t('details.warcryDamageReduction')}
              value={t('details.percentValue', { value: stats.warcry.damageReductionPercent })} /> : null}
            {stats.warcry.defenseReductionPercent !== undefined ? <StatLine label={t('details.warcryDefenseReduction')}
              value={t('details.percentValue', { value: stats.warcry.defenseReductionPercent })} /> : null}
          </> : null}
          {stats.decrepify ? <>
            <StatLine label={t('details.warcryDuration')} value={t('details.seconds', { seconds: stats.decrepify.durationSeconds })} />
            <StatLine label={t('details.coldChillSlow')} value={t('details.percentValue', { value: stats.decrepify.attackSpeedReductionPercent })} />
            <StatLine label={t('details.warcryDamageReduction')} value={t('details.percentValue', { value: stats.decrepify.damageReductionPercent })} />
          </> : null}
          {stats.weaken ? <>
            <StatLine label={t('details.warcryDuration')} value={t('details.seconds', { seconds: stats.weaken.durationSeconds })} />
            <StatLine label={t('details.warcryDamageReduction')} value={t('details.percentValue', { value: stats.weaken.damageReductionPercent })} />
          </> : null}
          {stats.dimVision ? <>
            <StatLine label={t('details.warcryDuration')} value={t('details.seconds', { seconds: stats.dimVision.durationSeconds })} />
            <StatLine label={t('details.cloakBlindPenalty')} value={t('details.cloakBlindPenaltyValue', { points: stats.dimVision.physicalHitChanceReductionPoints })} />
          </> : null}
          {stats.targetCurse ? <StatLine label={t('details.warcryDuration')}
            value={t('details.seconds', { seconds: stats.targetCurse.durationSeconds })} /> : null}
          {(stats.statuses.includes('terror') || stats.statuses.includes('bone-prison')) && stats.control ? <>
            <StatLine label={t('details.warcryDuration')} value={t('details.seconds', { seconds: stats.control.durationSeconds })} />
            <StatLine label={t('details.bossEffectDuration')} value={t('details.seconds', { seconds: stats.control.bossDurationSeconds })} />
          </> : null}
          {stats.damageCurse ? <>
            <StatLine label={t('details.warcryDuration')} value={t('details.seconds', { seconds: stats.damageCurse.durationSeconds })} />
            <StatLine label={t('details.damageCurse.' + stats.damageCurse.id)}
              value={t(stats.damageCurse.id === 'lower-resist' ? 'details.percentagePoints' : 'details.percentValue',
                { value: stats.damageCurse.percent })} />
          </> : null}
          {stats.concentrate ? <StatLine label={t('details.concentrateDuration')}
            value={t('details.seconds', { seconds: stats.concentrate.durationSeconds })} /> : null}
          {stats.convertedAttackPercent !== undefined ? <StatLine label={t('details.convertedAttack')}
            value={t('details.percentValue', { value: stats.convertedAttackPercent })} /> : null}
          {stats.cloak ? <>
            <StatLine label={t('details.cloakDuration')} value={t('details.seconds', { seconds: stats.cloak.durationSeconds })} />
            <StatLine label={t('details.cloakBlindPenalty')} value={t('details.cloakBlindPenaltyValue', { points: stats.cloak.blindHitPenaltyPoints })} />
          </> : null}
          {stats.strikesPerCast !== undefined ? (
            <StatLine label={t('details.strikesPerCast')} value={String(stats.strikesPerCast)} />
          ) : null}
          {stats.strikesPerTarget !== undefined ? (
            <StatLine label={t('details.strikesPerTarget')} value={String(stats.strikesPerTarget)} />
          ) : null}
          {stats.criticalBonusPoints !== undefined ? (
            <StatLine label={t('details.criticalBonus')} value={t('details.criticalBonusValue', { points: stats.criticalBonusPoints })} />
          ) : null}
          {stats.manaBurn && stats.control ? (
            <>
              <StatLine label={t('details.manaBurnDrain')} value={t('details.manaBurnDrainValue', { percent: stats.manaBurn.drainPercent })} />
              <StatLine label={t('details.manaBurnBonus')} value={t('details.manaBurnBonusValue', { percent: stats.manaBurn.zeroManaArcaneBonusPercent })} />
              <StatLine label={t('details.manaBurnLifetime')} value={t('details.manaBurnLifetimeValue')} />
              <StatLine label={t('details.manaBurnStun')} value={t('details.manaBurnStunValue', {
                seconds: stats.control.durationSeconds, bossSeconds: stats.control.bossDurationSeconds
              })} />
            </>
          ) : null}
          {stats.statuses.length > 0 ? (
            <StatLine
              label={t('details.statusEffects')}
              value={stats.statuses.map((id) =>
                id === AMPLIFY_DAMAGE_DEFINITION.canonicalStatusId || id === AMPLIFY_DAMAGE_DEFINITION.legacyStatusId
                  ? t('necromancer.amplify-damage.name')
                  : id === 'decrepify' ? t('necromancer.decrepify.name')
                  : id === 'weaken' ? t('necromancer.weaken.name')
                  : id === 'dim-vision' ? t('necromancer.dim-vision.name')
                  : id === 'terror' ? t('necromancer.terror.name')
                  : id === 'bone-wall' || id === 'bone-prison' ? t('necromancer.' + id + '.name')
                  : id === 'confuse' || id === 'attract' || id === 'iron-maiden' || id === 'life-tap' || id === 'lower-resist' ? t('necromancer.' + id + '.name')
                  : id === 'burst-of-speed' ? t('assassin.burst-of-speed.name')
                  : id === 'cloak-of-shadows' ? t('assassin.cloak-of-shadows.name')
                  : id === 'blind' ? t('combat:effect.status.blind')
                  : id === 'stun' ? t('combat:effect.status.stun')
                  : id === 'battle-command' || id === 'howl' || id === 'taunt' || id === 'battle-cry' ? t(`combat:effect.status.${id}`)
                  : id === 'leap' ? t('barbarian.leap.name')
                  : id === 'holy-shield' ? t('paladin.holy-shield.name')
                  : id === 'cyclone-armor' ? t('druid.cyclone-armor.name')
                  : id === 'shiver-armor' || id === 'chilling-armor' ? t('sorceress.' + id + '.name')
                  : id === 'teleport' || id === 'enchant' ? t('sorceress.' + id + '.name')
                  : id === 'werewolf' || id === 'werebear' ? t('druid.' + id + '.name')
                  : t(`damage-types:status.${id}`, { defaultValue: humanizeId(id) })).join(', ')}
            />
          ) : null}
          {stats.recovery ? (
            <StatLine label={t('details.recovery')} value={t('details.recoveryValue', stats.recovery)} />
          ) : null}
          {stats.selfDamage ? (
            <StatLine label={t('details.selfDamage')} value={t('details.selfDamageValue', stats.selfDamage)} />
          ) : null}
          {stats.ignoresMagicResist ? (
            <StatLine label={t('details.magicResistBypass')} value={t('details.magicResistBypassValue')} />
          ) : null}
          {stats.ignoresDefense ? (
            <StatLine label={t('details.defenseBypass')} value={t('details.defenseBypassValue')} />
          ) : null}
          {stats.composite ? (
            <StatLine label={t('details.compositeStrike')} value={t('details.compositeStrikeValue')} />
          ) : null}
          {stats.frenzy ? (
            <>
              <StatLine label={t('details.frenzySpeed')} value={t('details.percentValue', { value: stats.frenzy.percentPerStack })} />
              <StatLine label={t('details.frenzyCap')} value={String(stats.frenzy.maxStacks)} />
              <StatLine label={t('details.frenzyDuration')} value={t('details.seconds', { seconds: stats.frenzy.durationSeconds })} />
            </>
          ) : null}
          {stats.feralRage ? (
            <>
              <StatLine label={t('details.feralSpeed')} value={t('details.percentValue', { value: stats.feralRage.percentPerStack })} />
              <StatLine label={t('details.feralCap')} value={String(stats.feralRage.maxStacks)} />
              <StatLine label={t('details.feralDuration')} value={t('details.seconds', { seconds: stats.feralRage.durationSeconds })} />
            </>
          ) : null}
          {stats.burn ? (
            <>
              <StatLine label={t('details.burnRate')} value={t(stats.burn.component
                ? 'details.burnComponentRateValue' : 'details.burnRateValue', stats.burn)} />
              <StatLine label={t('details.burnDuration')} value={t('details.seconds', { seconds: stats.burn.durationSeconds })} />
              <StatLine label={t('details.burnMaxStacks')} value={String(stats.burn.maxStacks)} />
            </>
          ) : null}
          {stats.periodic ? (
            <>
              {stats.periodic.stacksOnApply ? <StatLine label={t('details.periodicAppliedStacks', {
                status: t(`combat:effect.status.${stats.periodic.statusId}`)
              })} value={String(stats.periodic.stacksOnApply)} /> : null}
              <StatLine label={t('details.periodicRate', { status: t(`combat:effect.status.${stats.periodic.statusId}`) })}
                value={t('details.burnRateValue', stats.periodic)} />
              <StatLine label={t('details.periodicDuration', { status: t(`combat:effect.status.${stats.periodic.statusId}`) })}
                value={t('details.seconds', { seconds: stats.periodic.durationSeconds })} />
              <StatLine label={t('details.periodicMaxStacks', { status: t(`combat:effect.status.${stats.periodic.statusId}`) })}
                value={String(stats.periodic.maxStacks)} />
            </>
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
          <StatLine label={t('details.weaponRequired')}
            value={skill.requires.weaponType.map(type => t('details.weaponTypes.' + type)).join(', ')} />
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
      className={`flex h-[72px] w-[72px] items-center justify-center rounded bg-gradient-to-br ${skillIconClass(skill)} font-serif text-sm font-bold shadow-inner`}
      data-testid={`skill-icon-fallback-${skill.id}`}
      aria-hidden="true"
    >
      <SkillFallbackMark skill={skill} />
    </span>
  );

  if (!iconSrc) return fallback;

  return (
    <span className="relative flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded bg-black shadow-inner">
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
      <svg viewBox="0 0 36 36" className="h-14 w-14" aria-hidden="true">
        <circle cx="18" cy="17" r="9" fill="currentColor" opacity="0.28" />
        <path d="M12 17c0-5 3-8 6-8s6 3 6 8c0 4-2 6-4 7v3h-4v-3c-2-1-4-3-4-7Z" fill="currentColor" opacity="0.9" />
        <circle cx="15.2" cy="17.5" r="1.5" fill="black" opacity="0.8" />
        <circle cx="20.8" cy="17.5" r="1.5" fill="black" opacity="0.8" />
      </svg>
    );
  }
  if (skill.trigger === 'passive' || skill.trigger === 'aura') {
    return (
      <svg viewBox="0 0 36 36" className="h-14 w-14" aria-hidden="true">
        <path d="M18 5l3.2 9.3H31l-7.8 5.7 3 9.2L18 23.5l-8.2 5.7 3-9.2L5 14.3h9.8L18 5Z" fill="currentColor" opacity="0.9" />
        <circle cx="18" cy="18" r="12" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      </svg>
    );
  }
  switch (skill.damageType) {
    case 'fire':
      return (
        <svg viewBox="0 0 36 36" className="h-14 w-14" aria-hidden="true">
          <path d="M19 4c2 6-5 7-1 13 1.4-3 4-4.5 5-8 5 5 7 11 2 17-4 5-13 5-17-1-4-7 2-12 7-18-.2 5 2 7 4 9 1-4-1-6 0-12Z" fill="currentColor" />
        </svg>
      );
    case 'cold':
      return (
        <svg viewBox="0 0 36 36" className="h-14 w-14" aria-hidden="true">
          <path d="M18 4v28M6 11l24 14M30 11L6 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
          <path d="M18 8l4 4-4 4-4-4 4-4Zm0 12l4 4-4 4-4-4 4-4Z" fill="currentColor" opacity="0.75" />
        </svg>
      );
    case 'lightning':
      return (
        <svg viewBox="0 0 36 36" className="h-14 w-14" aria-hidden="true">
          <path d="M22 3L9 20h8l-3 13 13-18h-8l3-12Z" fill="currentColor" />
        </svg>
      );
    case 'arcane':
      return (
        <svg viewBox="0 0 36 36" className="h-14 w-14" aria-hidden="true">
          <circle cx="18" cy="18" r="10" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.8" />
          <circle cx="18" cy="18" r="3" fill="currentColor" />
          <path d="M18 4v5M18 27v5M4 18h5M27 18h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'poison':
      return (
        <svg viewBox="0 0 36 36" className="h-14 w-14" aria-hidden="true">
          <circle cx="15" cy="15" r="7" fill="currentColor" opacity="0.8" />
          <circle cx="22" cy="20" r="8" fill="currentColor" opacity="0.45" />
          <circle cx="24" cy="10" r="3" fill="currentColor" opacity="0.9" />
        </svg>
      );
    case 'thorns':
      return (
        <svg viewBox="0 0 36 36" className="h-14 w-14" aria-hidden="true">
          <path d="M18 4l4 11 10 3-10 3-4 11-4-11-10-3 10-3 4-11Z" fill="currentColor" opacity="0.9" />
          <path d="M7 8l22 20M29 8L7 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        </svg>
      );
    case 'physical':
      return (
        <svg viewBox="0 0 36 36" className="h-14 w-14" aria-hidden="true">
          <path d="M8 26L26 8l3 3-18 18H8v-3Zm20 2L10 10l2-2 18 18v2h-2Z" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 36 36" className="h-14 w-14" aria-hidden="true">
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
  const statAuraId = skill.id.replace('skills-paladin-', 'paladin.');
  if (isStatAuraId(statAuraId)) {
    const definition = STAT_AURA_DEFINITIONS[statAuraId];
    return t(`${statAuraId}.desc`, { ...Object.fromEntries(Object.entries(definition.perRank)
      .map(([key, value]) => [key, Number((value * 100).toFixed(4))])),
      level: definition.requiredLevel, cap: definition.maxRank,
      healSeconds: definition.healing ? definition.healing.intervalMs / 1000 : undefined,
      healAmount: definition.healing?.amount,
      redemptionSeconds: definition.redemption ? definition.redemption.intervalMs / 1000 : undefined,
      redemptionLife: definition.redemption?.life, redemptionMana: definition.redemption?.mana,
      sanctuarySeconds: definition.sanctuary ? definition.sanctuary.intervalMs / 1000 : undefined,
      sanctuaryDamage: definition.sanctuary?.damage, repulseMs: definition.sanctuary?.repulseDurationMs,
      bossRepulseMs: definition.sanctuary
        ? Math.max(1, Math.floor(definition.sanctuary.repulseDurationMs * (STATUS_DEFAULTS.stun.bossDurationMult ?? 1))) : undefined,
      durationReductionPct: definition.cleansingDurationMultiplier !== undefined ? (1 - definition.cleansingDurationMultiplier) * 100 : undefined,
      pulseSeconds: definition.pulse ? definition.pulse.intervalMs / 1000 : undefined,
      pulseDamage: definition.pulse?.damage,
      burnSeconds: definition.pulse?.burn ? definition.pulse.burn.durationMs / 1000 : undefined,
      burnPct: definition.pulse?.burn ? definition.pulse.burn.dotPctOfDamage * 100 : undefined,
      burnMaxStacks: STATUS_DEFAULTS.ignite.maxStacks,
      chillSlowPct: (1 - CHILL_DEFINITION.attackSpeedMultiplier) * 100,
      enemyResistReductionPct: definition.enemyResistReductionPct });
  }
  for (const key of Object.keys(DRUID_SHAPE_IDS) as DruidShapeKey[]) {
    if (skill.id === DRUID_SHAPE_IDS[key][0]) {
      const d = DRUID_SHAPE_DEFINITIONS[key];
      return t('druid.' + key + '.desc', { life: d.perRank.lifePct * 100,
        speed: d.perRank.attackSpeedPct * 100, dodge: d.perRank.physDodgePct * 100,
        defense: d.perRank.defensePct * 100, level: d.requiredLevel, cap: d.maxRank });
    }
  }
  for (const key of ['oak', 'heart'] as const) {
    if (skill.id === DRUID_ALLY_AURA_IDS[key][0]) {
      const d = DRUID_ALLY_AURA_DEFINITIONS[key];
      return t('druid.' + (key === 'oak' ? 'oak-sage' : 'heart-of-wolverine') + '.desc', {
        life: d.lifePerRank * 100, attack: d.attackPerRank * 100, critical: d.critPerRank * 100,
        level: d.requiredLevel, cap: d.maxRank });
    }
  }
  if (skill.id === SPIRIT_OF_BARBS_IDS[0]) {
    const d = SPIRIT_OF_BARBS_DEFINITION;
    return t('druid.spirit-of-barbs.desc', { thorns: d.thornsPerRank * 100,
      defense: d.summonDefensePerRank * 100, level: d.requiredLevel, cap: d.maxRank });
  }
  if (skill.id === ENERGY_SHIELD_IDS[0]) {
    const d = ENERGY_SHIELD_DEFINITION;
    return t('sorceress.energy-shield.desc', { absorb: d.absorbPerRank * 100,
      maxAbsorb: d.absorbPerRank * d.maxRank * 100, recovery: d.manaRegenPerRank * 100,
      cap: d.maxRank, level: d.requiredLevel });
  }
  if (skill.id === 'skills-amazon-freezing-arrow') {
    return t('amazon.freezing-arrow.desc', {
      chance: (skill.additionalStatusEffects?.freeze?.chance ?? 0) * 100,
      chillSeconds: STATUS_DEFAULTS.chill.duration,
      freezeSeconds: STATUS_DEFAULTS.freeze.duration,
      bossSeconds: STATUS_DEFAULTS.freeze.duration * (STATUS_DEFAULTS.freeze.bossDurationMult ?? 1)
    });
  }
  if (skill.id === CONVERSION_IDS[0]) {
    return t('paladin.conversion.desc', { seconds: CONVERSION_DEFINITION.durationMs / 1000 });
  }
  if (skill.id === HOLY_SHIELD_IDS[0]) {
    const d = HOLY_SHIELD_DEFINITION;
    return t('paladin.holy-shield.desc', { defense: d.defensePerRank * 100,
      reduction: d.absorbPerRank * 100, maxReduction: d.absorbPerRank * d.maxRank * 100,
      cap: d.maxRank, level: d.requiredLevel });
  }
  if (skill.id === CYCLONE_ARMOR_IDS[0]) {
    const d = CYCLONE_ARMOR_DEFINITION;
    return t('druid.cyclone-armor.desc', { reduction: d.absorbPerRank * 100,
      resistance: d.resistPerRank * 100, maxReduction: d.absorbPerRank * d.maxRank * 100,
      cap: d.maxRank, level: d.requiredLevel });
  }
  if (skill.id === BONE_ARMOR_IDS[0]) {
    const d = BONE_ARMOR_DEFINITION;
    return t('necromancer.bone-armor.desc', { absorb: d.absorbPerRank, cap: d.maxRank, level: d.requiredLevel });
  }
  if (skill.id === BURST_OF_SPEED_IDS[0]) {
    const definition = BURST_OF_SPEED_DEFINITION;
    return t('assassin.burst-of-speed.desc', {
      speed: definition.attackSpeedPerRank * 100, dodge: definition.physDodgePerRank * 100,
      seconds: definition.durationMs / 1000, level: definition.requiredLevel, cap: definition.maxRank
    });
  }
  if (skill.id === CLOAK_OF_SHADOWS_IDS[0] && stats?.cloak) {
    const d = CLOAK_OF_SHADOWS_DEFINITION;
    return t('assassin.cloak-of-shadows.desc', { seconds: stats.cloak.durationSeconds,
      defense: d.defensePerRank * 100, critical: d.critPerRank * 100, dodge: d.magicDodgePerRank * 100,
      penalty: stats.cloak.blindHitPenaltyPoints });
  }
  for (const key of ['fade', 'venom'] as const) {
    if (skill.id === ASSASSIN_SHADOW_IDENTITIES[key][0]) {
      const definition = ASSASSIN_SHADOW_DEFINITIONS[key];
      return t('assassin.' + key + '.desc', {
        resist: definition.resistPerRank * 100, magicDodge: definition.magicDodgePerRank * 100,
        poison: definition.poisonPerRank * 100, coating: definition.coatingAttackPct * 100,
        seconds: definition.coatingDurationMs / 1000, cap: definition.maxRank, level: definition.requiredLevel,
      });
    }
  }
  for (const key of ['claw', 'block'] as const) {
    const [authored] = ASSASSIN_WEAPON_PASSIVE_IDENTITIES[key];
    if (skill.id === authored) {
      const { perRank, requiredLevel, maxRank } = ASSASSIN_WEAPON_PASSIVE_DEFINITIONS[key];
      return t('assassin.' + authored.slice('skills-assassin-'.length) + '.desc', {
        attack: perRank.attackPct * 100, critical: perRank.critChancePct * 100,
        physicalDodge: perRank.physDodgePct * 100, magicDodge: perRank.magicDodgePct * 100,
        level: requiredLevel, cap: maxRank,
      });
    }
  }
  for (const key of ['mastery', 'resist'] as const) {
    if (skill.id === SUMMON_PASSIVE_IDENTITIES[key][0]) {
      const { lifePerRank, attackPerRank, resistPerRank, requiredLevel, maxRank } = SUMMON_PASSIVE_DEFINITIONS[key];
      return t('necromancer.' + (key === 'mastery' ? 'summon-mastery' : 'summon-resist') + '.desc', {
        life: lifePerRank * 100, attack: attackPerRank * 100, resist: resistPerRank * 100,
        level: requiredLevel, cap: maxRank,
      });
    }
  }
  for (const key of ['poison', 'elemental'] as const) {
    const { authored, classId } = DAMAGE_MASTERY_IDENTITIES[key];
    if (skill.id === authored) {
      const { perRank, requiredLevel, maxRank } = DAMAGE_MASTERY_DEFINITIONS[key];
      return t(classId + '.' + authored.slice(('skills-' + classId + '-').length) + '.desc', {
        poison: perRank.poisonDamagePct * 100, arcane: perRank.arcaneDamagePct * 100,
        elemental: perRank.elementalDamagePct * 100, dodge: perRank.magicDodgePct * 100,
        level: requiredLevel, cap: maxRank,
      });
    }
  }
  for (const key of BARBARIAN_WEAPON_MASTERY_KEYS) {
    if (skill.id === BARBARIAN_WEAPON_MASTERY_IDENTITIES[key][0]) {
      const { requiredLevel, maxRank, physicalDamagePctPerRank, critChancePctPerRank, attackSpeedPctPerRank }
        = BARBARIAN_WEAPON_MASTERY_DEFINITIONS[key];
      const slug = BARBARIAN_WEAPON_MASTERY_IDENTITIES[key][0].replace('skills-barbarian-', '');
      return t('barbarian.' + slug + '.desc', { physical: physicalDamagePctPerRank * 100,
        critical: critChancePctPerRank * 100, speed: attackSpeedPctPerRank * 100, cap: maxRank, level: requiredLevel });
    }
  }
  for (const key of ['stamina', 'speed', 'resistance'] as const) {
    const [authored] = BARBARIAN_ENDURANCE_IDENTITIES[key];
    if (skill.id === authored) {
      const { requiredLevel, maxRank, perRank } = BARBARIAN_ENDURANCE_DEFINITIONS[key];
      return t('barbarian.' + authored.slice('skills-barbarian-'.length) + '.desc', {
        life: perRank.lifePct * 100, speed: perRank.attackSpeedPct * 100,
        physicalDodge: perRank.physDodgePct * 100, resist: perRank.resistAllPct * 100,
        magicDodge: perRank.magicDodgePct * 100, cap: maxRank, level: requiredLevel,
      });
    }
  }
  for (const key of ['shout', 'orders'] as const) {
    const [authored] = BARBARIAN_WARCRY_IDENTITIES[key];
    if (skill.id === authored) {
      const { requiredLevel, maxRank, perRank } = BARBARIAN_WARCRY_DEFINITIONS[key];
      return t('barbarian.' + authored.slice('skills-barbarian-'.length) + '.desc', {
        defense: perRank.defensePct * 100, life: perRank.lifePct * 100,
        recovery: perRank.manaRegenPct * 100, level: requiredLevel, cap: maxRank,
      });
    }
  }
  for (const key of AMAZON_PASSIVE_KEYS) {
    const { authored } = AMAZON_PASSIVE_IDENTITIES[key];
    if (skill.id === authored) {
      const { perRank, maxRank, requiredLevel } = AMAZON_PASSIVE_DEFINITIONS[key];
      return t('amazon.' + authored.slice('skills-amazon-'.length) + '.desc', {
        bonus: (perRank.critChancePct || perRank.attackPct || perRank.physDodgePct || perRank.magicDodgePct) * 100,
        physicalDodge: perRank.physDodgePct * 100, magicDodge: perRank.magicDodgePct * 100,
        damage: perRank.physicalDamagePct * 100, attack: perRank.attackPct * 100,
        cap: maxRank, level: requiredLevel,
      });
    }
  }
  if (skill.id === 'skills-sorceress-static-field') return t('sorceress.static-field.desc');
  if (skill.id === 'skills-necromancer-amplify-damage') {
    const { physicalResistReductionPct, durationMs } = AMPLIFY_DAMAGE_DEFINITION;
    return t('necromancer.amplify-damage.desc', {
      reduction: physicalResistReductionPct,
      duration: t('details.seconds', { seconds: durationMs / 1000 })
    });
  }
  if (skill.id === 'skills-paladin-might') {
    const { physicalDamagePctPerRank: physical, attackPctPerRank: attack, maxRank } = MIGHT_DEFINITION;
    return t('paladin.might.desc', { physical: Math.round(physical * 100), attack: Math.round(attack * 100),
      maxPhysical: Math.round(physical * maxRank * 100), maxAttack: Math.round(attack * maxRank * 100), cap: maxRank });
  }
  if (skill.id === 'skills-paladin-meditation') {
    const { manaRegenPctPerRank, maxRank, requiredLevel } = MEDITATION_DEFINITION;
    return t('paladin.meditation.desc', { bonus: Math.round(manaRegenPctPerRank * 100),
      maxBonus: Math.round(manaRegenPctPerRank * maxRank * 100), cap: maxRank, level: requiredLevel });
  }
  if (skill.id === 'skills-sorceress-lightning-mastery') {
    const { lightningDamagePctPerRank, maxRank, requiredLevel } = LIGHTNING_MASTERY_DEFINITION;
    return t('sorceress.lightning-mastery.desc', { bonus: Math.round(lightningDamagePctPerRank * 100),
      maxBonus: Math.round(lightningDamagePctPerRank * maxRank * 100), cap: maxRank, level: requiredLevel });
  }
  if (skill.id === 'skills-sorceress-cold-mastery') {
    const { resistanceReductionPct, resistanceReductionPerRankPct, maxRank, requiredLevel } = COLD_MASTERY_DEFINITION;
    return t('sorceress.cold-mastery.desc', { base: resistanceReductionPct,
      growth: resistanceReductionPerRankPct, max: coldMasteryReductionAtRank(maxRank),
      cap: maxRank, level: requiredLevel });
  }
  if (skill.id === 'skills-barbarian-iron-skin') {
    const { defensePctPerRank, maxRank, requiredLevel } = IRON_SKIN_DEFINITION;
    return t('barbarian.iron-skin.desc', { bonus: Math.round(defensePctPerRank * 100),
      maxBonus: Math.round(defensePctPerRank * maxRank * 100), cap: maxRank, level: requiredLevel });
  }
  if (skill.id === 'skills-necromancer-skeleton-mastery') {
    const { summonLifePctPerRank: life, summonAttackPctPerRank: attack,
      summonDefensePctPerRank: defense, maxRank, requiredLevel } = SKELETON_MASTERY_DEFINITION;
    return t('necromancer.skeleton-mastery.desc', { life: Math.round(life * 100),
      attack: Math.round(attack * 100), defense: Math.round(defense * 100),
      maxLife: Math.round(life * maxRank * 100), maxAttack: Math.round(attack * maxRank * 100),
      maxDefense: Math.round(defense * maxRank * 100), cap: maxRank, level: requiredLevel });
  }
  if (skill.id === 'skills-necromancer-golem-mastery') {
    const { golemLifePctPerRank: life, golemAttackSpeedPerRank: speed, maxRank, requiredLevel } = GOLEM_MASTERY_DEFINITION;
    return t('necromancer.golem-mastery.desc', { life: Math.round(life * 100), speed,
      maxLife: Math.round(life * maxRank * 100), maxSpeed: speed * maxRank, cap: maxRank, level: requiredLevel });
  }
  if (skill.id === 'skills-barbarian-leap' && stats?.leap && stats.control) {
    const physical = stats.utility.find(row => row.id === 'physicalDamagePct')?.value ?? 0;
    return t('barbarian.leap.desc', { bonus: Number((physical * 100).toFixed(4)),
      duration: t('details.seconds', { seconds: stats.leap.durationSeconds }),
      stun: t('details.seconds', { seconds: stats.control.durationSeconds }),
      bossStun: t('details.seconds', { seconds: stats.control.bossDurationSeconds }) });
  }
  if (stats?.skillRankBuff) {
    return t('barbarian.battle-command.desc', { bonus: stats.skillRankBuff.bonusRanks,
      duration: t('details.seconds', { seconds: stats.skillRankBuff.durationSeconds }),
      mana: stats.manaCost, cooldown: stats.cooldown });
  }
  if (stats?.corpseWard) {
    return t('barbarian.grim-ward.desc', { duration: stats.corpseWard.durationSeconds,
      interval: stats.corpseWard.intervalSeconds, fear: stats.corpseWard.fearSeconds,
      boss: stats.corpseWard.bossFearSeconds, mana: stats.manaCost, cooldown: stats.cooldown });
  }
  if (stats?.corpseSearch) {
    return t('barbarian.find-item.desc', { chance: stats.corpseSearch.successPercent,
      mana: stats.manaCost, cooldown: stats.cooldown });
  }
  if (stats?.corpseRecovery) {
    return t('barbarian.find-potion.desc', { life: stats.corpseRecovery.lifePercent,
      manaRecovery: stats.corpseRecovery.manaPercent, mana: stats.manaCost, cooldown: stats.cooldown });
  }
  const firstDamage = stats?.damage[0];
  if (firstDamage && stats.hydra) {
    return t('sorceress.hydra.desc', { min: firstDamage.min, max: firstDamage.max,
      mana: stats.manaCost, cooldown: stats.cooldown,
      heads: stats.hydra.heads, duration: stats.hydra.durationSeconds });
  }
  if (firstDamage && stats.periodicSpell) {
    return t('sorceress.' + skill.id.slice('skills-sorceress-'.length) + '.desc', {
      min: firstDamage.min, max: firstDamage.max, mana: stats.manaCost, cooldown: stats.cooldown,
      duration: stats.periodicSpell.durationSeconds, interval: stats.periodicSpell.intervalSeconds,
      pulses: stats.periodicSpell.pulses
    });
  }
  if (stats?.coldArmor && ['skills-sorceress-shiver-armor', 'skills-sorceress-chilling-armor'].includes(skill.id)) {
    const bonusId = skill.id === 'skills-sorceress-shiver-armor' ? 'coldDamagePct' : 'magicDodgePct';
    return t('sorceress.' + skill.id.slice('skills-sorceress-'.length) + '.desc', {
      min: stats.coldArmor.min, max: stats.coldArmor.max, mana: stats.manaCost, cooldown: stats.cooldown,
      defense: Number(((stats.utility.find(row => row.id === 'defensePct')?.value ?? 0) * 100).toFixed(4)),
      bonus: Number(((stats.utility.find(row => row.id === bonusId)?.value ?? 0) * 100).toFixed(4)),
      seconds: stats.coldArmor.freezeSeconds, bossSeconds: stats.coldArmor.bossFreezeSeconds
    });
  }
  if (firstDamage && ['skills-sorceress-charged-bolt', 'skills-sorceress-lightning',
    'skills-sorceress-nova', 'skills-sorceress-chain-lightning'].includes(skill.id)) {
    return t('sorceress.' + skill.id.slice('skills-sorceress-'.length) + '.desc', {
      min: firstDamage.min, max: firstDamage.max, mana: stats.manaCost, cooldown: stats.cooldown,
      maxTargets: stats.maxTargets,
      ...(stats.control ? { duration: t('details.seconds', { seconds: stats.control.durationSeconds }) } : {})
    });
  }
  if (firstDamage && ['skills-sorceress-fire-bolt', 'skills-sorceress-fire-ball'].includes(skill.id)) {
    return t('sorceress.' + skill.id.slice('skills-sorceress-'.length) + '.desc', {
      min: firstDamage.min, max: firstDamage.max, mana: stats.manaCost, cooldown: stats.cooldown
    });
  }
  if (firstDamage && stats.coldAttack && ['skills-sorceress-ice-bolt', 'skills-sorceress-frost-nova',
    'skills-sorceress-frozen-orb', 'skills-sorceress-blizzard'].includes(skill.id)) {
    const cold = stats.coldAttack;
    return t('sorceress.' + skill.id.slice('skills-sorceress-'.length) + '.desc', {
      min: firstDamage.min, max: firstDamage.max, mana: stats.manaCost, cooldown: stats.cooldown,
      chill: t('details.seconds', { seconds: cold.durationSeconds }), slow: cold.slowPercent,
      ...(cold.freeze ? { freezeChance: cold.freeze.chancePercent,
        freeze: t('details.seconds', { seconds: cold.freeze.durationSeconds }),
        bossFreeze: t('details.seconds', { seconds: cold.freeze.bossDurationSeconds }) } : {})
    });
  }
  if (stats?.sorceressBuff && ['skills-sorceress-teleport', 'skills-sorceress-enchant'].includes(skill.id)) {
    return t('sorceress.' + skill.id.slice('skills-sorceress-'.length) + '.desc', {
      duration: t('details.seconds', { seconds: stats.sorceressBuff.durationSeconds }),
      points: stats.sorceressBuff.magicDodgePoints, percent: stats.sorceressBuff.enchantAttackPercent,
      mana: stats.manaCost, cooldown: stats.cooldown
    });
  }
  if (skill.id === 'skills-sorceress-telekinesis' && stats?.control) {
    return t('sorceress.telekinesis.desc', {
      duration: t('details.seconds', { seconds: stats.control.durationSeconds }),
      bossDuration: t('details.seconds', { seconds: stats.control.bossDurationSeconds }),
      mana: stats.manaCost, cooldown: stats.cooldown
    });
  }
  if (stats?.warcry && ['skills-barbarian-howl', 'skills-barbarian-taunt', 'skills-barbarian-battle-cry'].includes(skill.id)) {
    return t(`barbarian.${skill.id.slice('skills-barbarian-'.length)}.desc`, {
      duration: t('details.seconds', { seconds: stats.warcry.durationSeconds }),
      bossDuration: t('details.seconds', { seconds: stats.control?.bossDurationSeconds }),
      damageReduction: stats.warcry.damageReductionPercent, defenseReduction: stats.warcry.defenseReductionPercent,
      mana: stats.manaCost, cooldown: stats.cooldown
    });
  }
  if (skill.id === 'skills-necromancer-decrepify' && stats?.decrepify) {
    return t('necromancer.decrepify.desc', {
      duration: t('details.seconds', { seconds: stats.decrepify.durationSeconds }),
      slow: stats.decrepify.attackSpeedReductionPercent, reduction: stats.decrepify.damageReductionPercent,
      mana: stats.manaCost, cooldown: stats.cooldown
    });
  }
  if (skill.id === 'skills-necromancer-weaken' && stats?.weaken) {
    return t('necromancer.weaken.desc', {
      duration: t('details.seconds', { seconds: stats.weaken.durationSeconds }),
      reduction: stats.weaken.damageReductionPercent, mana: stats.manaCost, cooldown: stats.cooldown
    });
  }
  if (skill.id === 'skills-necromancer-dim-vision' && stats?.dimVision) {
    return t('necromancer.dim-vision.desc', {
      duration: t('details.seconds', { seconds: stats.dimVision.durationSeconds }),
      penalty: stats.dimVision.physicalHitChanceReductionPoints, mana: stats.manaCost, cooldown: stats.cooldown
    });
  }
  if (stats?.targetCurse) {
    return t('necromancer.' + stats.targetCurse.id + '.desc', {
      duration: t('details.seconds', { seconds: stats.targetCurse.durationSeconds }),
      mana: stats.manaCost, cooldown: stats.cooldown
    });
  }
  if (skill.id === 'skills-necromancer-terror' && stats?.control) {
    return t('necromancer.terror.desc', {
      duration: t('details.seconds', { seconds: stats.control.durationSeconds }),
      bossDuration: t('details.seconds', { seconds: stats.control.bossDurationSeconds }),
      mana: stats.manaCost, cooldown: stats.cooldown
    });
  }
  if (skill.id === 'skills-necromancer-bone-wall' && stats?.boneWall) {
    return t('necromancer.bone-wall.desc', {
      capacity: stats.boneWall.capacity, duration: t('details.seconds', { seconds: stats.boneWall.durationSeconds }),
      mana: stats.manaCost, cooldown: stats.cooldown
    });
  }
  if (skill.id === 'skills-necromancer-bone-prison' && stats?.control) {
    return t('necromancer.bone-prison.desc', {
      duration: t('details.seconds', { seconds: stats.control.durationSeconds }),
      bossDuration: t('details.seconds', { seconds: stats.control.bossDurationSeconds }),
      mana: stats.manaCost, cooldown: stats.cooldown
    });
  }
  if (stats?.damageCurse) {
    return t('necromancer.' + stats.damageCurse.id + '.desc', {
      duration: t('details.seconds', { seconds: stats.damageCurse.durationSeconds }),
      percent: stats.damageCurse.percent, mana: stats.manaCost, cooldown: stats.cooldown
    });
  }
  if (firstDamage && ['skills-barbarian-bash', 'skills-barbarian-whirlwind',
    'skills-barbarian-leap-attack', 'skills-barbarian-war-cry'].includes(skill.id)) {
    return t(`barbarian.${skill.id.slice('skills-barbarian-'.length)}.desc`, {
      min: firstDamage.min, max: firstDamage.max, mana: stats.manaCost,
      cooldown: stats.cooldown,
      ...(stats.control ? {
        duration: t('details.seconds', { seconds: stats.control.durationSeconds }),
        bossDuration: t('details.seconds', { seconds: stats.control.bossDurationSeconds })
      } : {})
    });
  }
  if (firstDamage && skill.id === 'skills-barbarian-concentrate' && stats.concentrate) {
    return t('barbarian.concentrate.desc', { min: firstDamage.min, max: firstDamage.max,
      defense: Number(((stats.utility.find(row => row.id === 'defensePct')?.value ?? 0) * 100).toFixed(4)),
      duration: t('details.seconds', { seconds: stats.concentrate.durationSeconds }) });
  }
  if (firstDamage && skill.id === 'skills-barbarian-berserk' && stats.convertedAttackPercent !== undefined) {
    return t('barbarian.berserk.desc', { min: firstDamage.min, max: firstDamage.max, attack: stats.convertedAttackPercent });
  }
  if (firstDamage && skill.id === 'skills-barbarian-stun' && stats.control) {
    return t('barbarian.stun.desc', { min: firstDamage.min, max: firstDamage.max,
      duration: t('details.seconds', { seconds: stats.control.durationSeconds }),
      bossDuration: t('details.seconds', { seconds: stats.control.bossDurationSeconds }) });
  }
  if (firstDamage && skill.id === 'skills-assassin-psychic-hammer' && stats.control) {
    return t('assassin.psychic-hammer.desc', { min: firstDamage.min, max: firstDamage.max,
      duration: t('details.seconds', { seconds: stats.control.durationSeconds }),
      bossDuration: t('details.seconds', { seconds: stats.control.bossDurationSeconds }) });
  }
  if (firstDamage && skill.id === 'skills-assassin-mind-blast' && stats.manaBurn && stats.control) {
    return t('assassin.mind-blast.desc', { min: firstDamage.min, max: firstDamage.max,
      drain: stats.manaBurn.drainPercent, bonus: stats.manaBurn.zeroManaArcaneBonusPercent,
      seconds: stats.control.durationSeconds, bossSeconds: stats.control.bossDurationSeconds });
  }
  if (firstDamage && skill.id === 'skills-barbarian-double-swing' && stats.strikesPerTarget !== undefined) {
    return t('barbarian.double-swing.desc', { min: firstDamage.min, max: firstDamage.max,
      strikes: stats.strikesPerTarget, maxTargets: stats.maxTargets });
  }
  if (firstDamage && skill.id === 'skills-barbarian-frenzy' && stats.frenzy && stats.strikesPerCast !== undefined) {
    return t('barbarian.frenzy.desc', { min: firstDamage.min, max: firstDamage.max,
      strikes: stats.strikesPerCast, percent: stats.frenzy.percentPerStack,
      cap: stats.frenzy.maxStacks, seconds: stats.frenzy.durationSeconds });
  }
  if (firstDamage && skill.id === 'skills-barbarian-double-throw' && stats.strikesPerCast !== undefined) {
    return t('barbarian.double-throw.desc', { min: firstDamage.min, max: firstDamage.max,
      strikes: stats.strikesPerCast });
  }
  if (firstDamage && skill.id === 'skills-amazon-jab' && stats.strikesPerCast !== undefined) {
    return t('amazon.jab.desc', { min: firstDamage.min, max: firstDamage.max, strikes: stats.strikesPerCast });
  }
  if (firstDamage && skill.id === 'skills-assassin-dragon-talon' && stats.strikesPerCast !== undefined) {
    return t('assassin.dragon-talon.desc', { min: firstDamage.min, max: firstDamage.max, strikes: stats.strikesPerCast });
  }
  if (firstDamage && skill.id === 'skills-assassin-dragon-claw' && stats.strikesPerCast !== undefined && stats.criticalBonusPoints !== undefined) {
    return t('assassin.dragon-claw.desc', { min: firstDamage.min, max: firstDamage.max,
      strikes: stats.strikesPerCast, critical: stats.criticalBonusPoints });
  }
  if (firstDamage && stats.areaShape === 'cone-2' &&
    ['skills-assassin-fire-blast', 'skills-assassin-blade-fury'].includes(skill.id)) {
    return t(skill.id === 'skills-assassin-blade-fury' ? 'assassin.blade-fury.desc' : 'assassin.fire-blast.desc',
      { min: firstDamage.min, max: firstDamage.max });
  }
  if (firstDamage && skill.id === 'skills-amazon-impale') {
    return t('amazon.impale.desc', { min: firstDamage.min, max: firstDamage.max });
  }
  if (stats && firstDamage &&
    ((skill.id === 'skills-amazon-guided-arrow' && stats.alwaysHits === true) ||
      (skill.id === 'skills-amazon-multiple-shot' && stats.areaShape === 'cone-3' && stats.maxTargets === 5) ||
      (skill.id === 'skills-amazon-strafe' && stats.strikesPerTarget !== undefined))) {
    return t('amazon.' + skill.id.slice('skills-amazon-'.length) + '.desc', {
      min: firstDamage.min, max: firstDamage.max, mana: stats.manaCost, cooldown: stats.cooldown,
      maxTargets: stats.maxTargets, strikes: stats.strikesPerTarget
    });
  }
  if (stats && firstDamage && ['skills-amazon-magic-arrow', 'skills-amazon-lightning-bolt',
    'skills-amazon-fire-arrow', 'skills-amazon-cold-arrow'].includes(skill.id)) {
    return t('amazon.' + skill.id.slice('skills-amazon-'.length) + '.desc', {
      min: firstDamage.min, max: firstDamage.max, mana: stats.manaCost, cooldown: stats.cooldown,
      chillSeconds: stats.control?.durationSeconds,
      slowPercent: (1 - CHILL_DEFINITION.attackSpeedMultiplier) * 100
    });
  }
  if (stats && firstDamage && skill.id === 'skills-amazon-plague-javelin') {
    return t('amazon.plague-javelin.desc', {
      min: firstDamage.min, max: firstDamage.max, mana: stats.manaCost, cooldown: stats.cooldown,
      stacks: skill.statusEffect?.stacksOnApply,
      poisonPercent: (skill.statusEffect?.dotPctOfDamage ?? 0) * 100,
      poisonSeconds: STATUS_DEFAULTS.poison.duration, plagueSeconds: STATUS_DEFAULTS.plague.duration,
      cap: STATUS_DEFAULTS.poison.maxStacks, threshold: PLAGUE_DEFINITION.poisonStacksForEpidemic,
      ordinaryPercent: PLAGUE_DEFINITION.ordinarySpreadFraction * 100,
      epidemicPercent: PLAGUE_DEFINITION.epidemicSpreadFraction * 100
    });
  }
  if (firstDamage && skill.id === 'skills-paladin-zeal' && stats.maxTargets !== undefined) {
    return t('paladin.zeal.desc', { min: firstDamage.min, max: firstDamage.max, maxTargets: stats.maxTargets });
  }
  if (firstDamage && stats.control && ['skills-paladin-smite', 'skills-paladin-charge', 'skills-paladin-fist-of-heavens'].includes(skill.id)) {
    return t('paladin.' + skill.id.slice('skills-paladin-'.length) + '.desc', {
      min: firstDamage.min, max: firstDamage.max,
      duration: t('details.seconds', { seconds: stats.control.durationSeconds }),
      bossDuration: t('details.seconds', { seconds: stats.control.bossDurationSeconds })
    });
  }
  if (firstDamage && skill.id === 'skills-paladin-sacrifice') {
    return t('paladin.sacrifice.desc', { min: firstDamage.min, max: firstDamage.max });
  }
  if (firstDamage && (skill.id === 'skills-paladin-holy-bolt' || skill.id === 'skills-paladin-blessed-hammer')) {
    return t('paladin.' + skill.id.slice('skills-paladin-'.length) + '.desc', {
      min: firstDamage.min, max: firstDamage.max
    });
  }
  if (stats?.composite) {
    const fire = stats.damage.find(row => row.type === 'fire');
    const cold = stats.damage.find(row => row.type === 'cold');
    const lightning = stats.damage.find(row => row.type === 'lightning');
    return t('details.descriptionComposite', { fireMin: fire?.min, fireMax: fire?.max,
      coldMin: cold?.min, coldMax: cold?.max, lightningMin: lightning?.min, lightningMax: lightning?.max,
      ...stats.composite });
  }
  if (['skills-druid-werewolf-maul', 'skills-druid-rabies', 'skills-druid-fire-claws'].includes(skill.id) && firstDamage && skill.description) {
    return t(skill.description.replace('skills.', ''), { min: firstDamage.min, max: firstDamage.max });
  }
  if (stats && firstDamage && ['skills-necromancer-teeth', 'skills-necromancer-bone-spear',
    'skills-necromancer-bone-spirit', 'skills-necromancer-poison-nova', 'skills-necromancer-poison-dagger'].includes(skill.id)) {
    return t('necromancer.' + skill.id.slice('skills-necromancer-'.length) + '.desc', {
      min: firstDamage.min, max: firstDamage.max, mana: stats.manaCost, cooldown: stats.cooldown
    });
  }
  if (skill.id === 'skills-necromancer-corpse-explosion' && stats && firstDamage) {
    return t('necromancer.corpse-explosion.desc', {
      min: firstDamage.min, max: firstDamage.max,
      type: t(`damage-types:type.${firstDamage.type}`),
      ignite: t('damage-types:status.ignite'),
      mana: stats.manaCost,
      cooldown: t('details.seconds', { seconds: stats.cooldown })
    });
  }
  if (skill.id === 'skills-necromancer-poison-explosion' && stats && firstDamage) {
    return t('necromancer.poison-explosion.desc', {
      min: firstDamage.min, max: firstDamage.max,
      type: t(`damage-types:type.${firstDamage.type}`),
      poison: t('combat:effect.status.poison'),
      duration: t('details.seconds', { seconds: STATUS_DEFAULTS.poison.duration }),
      stacks: STATUS_DEFAULTS.poison.maxStacks,
      mana: stats.manaCost,
      cooldown: t('details.seconds', { seconds: stats.cooldown })
    });
  }
  if (skill.id === 'skills-sorceress-meteor' && firstDamage) {
    const { statusId, defenseReductionPct, durationMs } = METEOR_ARMOR_MELT_DEFINITION;
    return t('sorceress.meteor.desc', {
      min: firstDamage.min, max: firstDamage.max,
      type: t(`damage-types:type.${firstDamage.type}`),
      burn: t('damage-types:status.burn'),
      melt: t(`damage-types:status.${statusId}`),
      mana: stats.manaCost, cooldown: stats.cooldown,
      reduction: defenseReductionPct,
      duration: t('details.seconds', { seconds: durationMs / 1000 })
    });
  }
  if (firstDamage && (skill.id === 'skills-druid-feral-rage' || skill.id === 'skills-druid-hunger')) {
    return t('druid.' + skill.id.slice('skills-druid-'.length) + '.desc', { min: firstDamage.min, max: firstDamage.max });
  }
  if (firstDamage && ['skills-druid-fury', 'skills-druid-arctic-blast', 'skills-druid-tornado',
    'skills-druid-hurricane', 'skills-druid-twister', 'skills-druid-shock-wave'].includes(skill.id)) {
    return t('druid.' + skill.id.slice('skills-druid-'.length) + '.desc', {
      min: firstDamage.min, max: firstDamage.max, strikes: stats.strikesPerCast,
      duration: t('details.seconds', { seconds: stats.control?.durationSeconds }),
      bossDuration: t('details.seconds', { seconds: stats.control?.bossDurationSeconds })
    });
  }
  if (firstDamage) {
    return t('details.descriptionDamage', {
      skill: skillName,
      type: t(`damage-types:type.${firstDamage.type}`),
      min: firstDamage.min,
      max: firstDamage.max
    });
  }
  if (stats?.summonCap !== undefined) {
    const canonicalId = canonicalSkillIdFromData(skill.id) ?? skill.id;
    if (isPreparationSummonSkill({ id: canonicalId })) {
      const preparation = t('details.descriptionSummonPreparation', {
        skill: skillName, count: stats.summonCap, mana: stats.manaCost
      });
      if (stats.summonUnit?.attackType && skill.description) {
        return `${t(skill.description.replace('skills.', ''), stats.summonUnit.effect ?? {})} ${t('details.descriptionDruidSummon')} ${preparation}`;
      }
      if (['necromancer.raise_skeleton', 'necromancer.raise_skeletal_mage', 'necromancer.revive'].includes(canonicalId) && skill.description) {
        return `${tDataKey(t, skill.description)} ${preparation}`;
      }
      return preparation;
    }
    return t('details.descriptionSummon', { skill: skillName, count: stats.summonCap });
  }
  return t('details.descriptionUtility', {
    skill: skillName,
    trigger: t(`trigger.${skill.trigger}`, { defaultValue: skill.trigger })
  });
}

function damageDelta(row: SkillDamageDisplayRow, compare: SkillRankDisplayStats | undefined, t: Translate): string | null {
  const old = compare?.damage.find((candidate) => candidate.type === row.type);
  if (!old) return null;
  return rangeDelta(row, old, t);
}

function rangeDelta(
  next: { readonly min: number; readonly max: number },
  current: { readonly min: number; readonly max: number },
  t: Translate
): string | null {
  const minDelta = next.min - current.min;
  const maxDelta = next.max - current.max;
  if (minDelta === 0 && maxDelta === 0) return null;
  return t('details.flatRangeDelta', { min: minDelta, max: maxDelta });
}

function numberDelta(next: number, current: number, t: Translate): string | null {
  const delta = next - current;
  if (delta === 0) return t('details.noChange');
  return delta > 0 ? `(+${String(delta)})` : `(${String(delta)})`;
}

function formatSummonStat(row: SkillSummonStatDisplayRow): string {
  return row.valueKind === 'percent' ? `${String(Math.round(row.value * 100))}%` : String(Number(row.value.toFixed(4)));
}

function summonStatDelta(row: SkillSummonStatDisplayRow, compare: SkillRankDisplayStats | undefined): string | null {
  const old = compare?.summonUnit?.stats.find((candidate) => candidate.id === row.id);
  if (!old) return null;
  const delta = Number((row.value - old.value).toFixed(4));
  if (delta === 0) return null;
  return row.valueKind === 'percent'
    ? `(+${String(Math.round(delta * 100))}%)`
    : `(+${String(delta)})`;
}

function formatUtilityStat(row: SkillUtilityDisplayRow): string {
  return row.valueKind === 'percent' ? formatUtilityPercent(row.value) : String(row.value);
}

function formatUtilityPercent(value: number): string {
  return `${String(Number((value * 100).toFixed(2)))}%`;
}

function utilityDelta(row: SkillUtilityDisplayRow, compare: SkillRankDisplayStats | undefined): string | null {
  const old = compare?.utility.find((candidate) => candidate.id === row.id);
  if (!old) return null;
  const delta = row.value - old.value;
  if (delta === 0) return null;
  return row.valueKind === 'percent'
    ? `(+${formatUtilityPercent(delta)})`
    : `(+${String(delta)})`;
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

function sameStringArray(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

/** Slugify a free-form skill-tree name into a stable i18n key segment. */
function slugifyTreeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
