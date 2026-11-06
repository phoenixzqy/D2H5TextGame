import { boneCursePriority, hasLearnedOffensiveCurse, trainingCurseRecovery } from './training-draw-recovery';
import type { TrainingCurseRecovery } from './policy';
import assert from 'node:assert/strict';
import { usePlayerStore } from '@/stores/playerStore';
import { getAllocatedSkillLevel } from '@/stores/skillsHelpers';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMetaStore } from '@/stores/metaStore';
import { exportCurrentSave } from '@/stores/persistence';
import { decodeSave } from '@/engine/save/validate';
import { abortSubAreaRun, hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { setIdleEliteMisses } from '@/stores/idleElitePity';
import { loadItemBases } from '@/data/loaders/loot';
import { loadClassStartingStats } from '@/data/loaders/classes';
import { loadQuests } from '@/data/loaders/quests';
import { planEquipMutex, isOneHandedWeapon } from '@/engine/inventory/equipValidator';
import { resolveEquippedWeapon } from '@/engine/items/equipped-weapon';
import { actionPeriodMs } from '@/engine/combat/combat';
import type { Item } from '@/engine/types/items';
import type { PlayerAuraId } from '@/engine/types/auras';
import { checkEligibility, slotCandidates, prepareCompareEquip, isClearNetUpgrade, netEquipDelta,
  type CompareResult } from '@/features/inventory/compareEquip';
import { claimQuestReward, canClaim } from '@/features/quests/claimReward';
import { EQUIPMENT_SLOT_ORDER } from '@/ui/EquipmentPanel';
import { earnedDelta, observeEarnedState } from '../sim/production/earned-state';
import type { CampaignProfile, CampaignWave } from './policy';
import { equipCampaignMercGear } from './merc-gear';
import { earnedJavelinProfile, prepareEarnedJavelinProfile, javelinGearThreats } from './javelin-progression';
import { equipCampaignSurvivalGear, type CampaignThreat } from './survival-gear';
import actOneDefense from './act1-defense-v1.json';
import { retrieveCampaignGear } from './owned-gear';
import { useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import { earnedDoubleThrowProfile, prepareEarnedDoubleThrowProfile } from './throw-progression';

export type CampaignRecord = (record: Readonly<Record<string, unknown>>) => void;

/** Retain a complete native chapter-boss boundary before admission or Claim can commit. */
export function recordCampaignBossCheckpoint(boundary: 'before-admission' | 'before-claim',
  id: string, record: CampaignRecord) {
  const quest = loadQuests().find(row => row.type === 'main' && row.unlocks &&
    row.objectives.some(objective => objective.type === 'kill-boss' &&
      (boundary === 'before-claim' ? row.id === id : objective.areaId === id)));
  if (!quest || useMapStore.getState().questProgress[quest.id]?.rewardClaimed === true ||
    (boundary === 'before-claim' && !canClaim(quest.id))) return;
  const boss = quest.objectives.find(objective => objective.type === 'kill-boss');
  assert.ok(boss && typeof boss.areaId === 'string' && boss.areaId.length > 0);
  const exported = exportCurrentSave();
  assert.ok(exported, 'Chapter boss checkpoint requires a complete native save');
  const snapshot = decodeSave(JSON.parse(exported) as unknown);
  const checkpoint = { kind: 'campaign-boss-checkpoint' as const, boundary, questId: quest.id,
    act: Number(quest.actId.replace('acts/act', '')), area: boss.areaId, snapshot, exported };
  record(checkpoint);
  return checkpoint;
}

/** Same terminal Return sequence as CombatScreen; fresh admission owns resource refill. */
export function returnCampaignToMap() {
  assert.equal(hasActiveSubAreaRun(), false, 'Recovery requires a settled terminal run');
  abortSubAreaRun();
  useMetaStore.getState().setIdleTarget(undefined);
  setIdleEliteMisses(0);
  useCombatStore.getState().endCombat();
}

/** Use only available native points; explicitly retain held and granted starter ranks. */
export function growCampaignBuild(profile: CampaignProfile, record: CampaignRecord) {
  if (profile.progressionPolicy === 'javelin-earned-v1') profile = prepareEarnedJavelinProfile(profile, record);
  if (profile.skillResetPolicy === 'double-throw-unlock-v1') profile = prepareEarnedDoubleThrowProfile(profile, record);
  for (const target of profile.targets) {
    let player = usePlayerStore.getState().player;
    assert.ok(player);
    while (player.skillPoints > 0 && player.level >= target.level &&
      (player.skillLevels?.[target.id] ?? 0) < target.rank) {
      const result = usePlayerStore.getState().allocateSkillPoint(target.id);
      record({ kind: 'allocate-skill', target, result, before: player,
        after: usePlayerStore.getState().player });
      assert.equal(result, 'ok', `Campaign allocation refused: ${target.id}`);
      player = usePlayerStore.getState().player;
      assert.ok(player);
    }
  }
  let player = usePlayerStore.getState().player;
  assert.ok(player);
  let aura: { readonly id: PlayerAuraId; readonly level: number } | undefined = profile.auraSelection;
  // Level alone cannot select a late aura whose prerequisites still consume earned points.
  for (const stage of profile.auraStages ?? []) if (player.level >= stage.level &&
    getAllocatedSkillLevel(player.skillLevels ?? {}, stage.id.replace(/-/g, '_')) > 0) aura = stage;
  if (aura && player.level >= aura.level) {
    if (player.selectedAuraId !== aura.id) {
      const result = usePlayerStore.getState().selectAura(aura.id);
      const after = usePlayerStore.getState().player;
      record({ kind: 'select-aura', id: aura.id, result, selected: after?.selectedAuraId,
        before: player, after });
      assert.equal(result, 'ok', `Campaign aura selection refused: ${aura.id}`);
    }
    assert.equal(usePlayerStore.getState().player?.selectedAuraId, aura.id,
      'Campaign selected aura mismatch');
    player = usePlayerStore.getState().player;
    assert.ok(player);
  }
  const levels = Math.floor(player.statPoints / 5);
  if (levels) {
    const per = profile.statsPerLevel;
    const deltas = { strength: levels * per.strength, dexterity: levels * per.dexterity,
      vitality: levels * per.vitality, energy: levels * per.energy };
    if (profile.statStages?.length) {
      const keys = ['strength', 'dexterity', 'vitality', 'energy'] as const;
      const baseline = loadClassStartingStats(player.class);
      const invested = keys.reduce((sum, key) => sum + player.coreStats[key] - baseline[key], 0);
      for (const key of keys) deltas[key] = 0;
      for (let block = 0; block < levels; block++) {
        // Replay earned blocks after a real reset; ordinary growth retains old investment.
        const level = Math.min(player.level, 2 + Math.floor(invested / 5) + block);
        let distribution = per;
        for (const stage of profile.statStages) if (level >= stage.level) distribution = stage.statsPerLevel;
        for (const key of keys) deltas[key] += distribution[key];
      }
    }
    const result = usePlayerStore.getState().allocateStatPoints(deltas, player);
    record({ kind: 'allocate-stats', deltas, result, before: player,
      after: usePlayerStore.getState().player });
    assert.equal(result, 'ok');
  }
  prepareCampaignCombo(profile, record);
}

/** Submit a learned combo at an idle preparation boundary without spending native points. */
export function prepareCampaignCombo(profile: CampaignProfile, record: CampaignRecord, area?: string,
  context?: { readonly phase: 'farm' | 'route'; readonly previousWave?: CampaignWave | undefined;
    readonly trainingRecovery?: TrainingCurseRecovery | undefined }) {
  const player = usePlayerStore.getState().player; assert.ok(player);
  if (profile.skillResetPolicy === 'double-throw-unlock-v1') profile = earnedDoubleThrowProfile(profile, player.level);
  const declaredPriority = area === undefined ? profile.priority : profile.priorityByArea?.[area] ?? profile.priority;
  let priority = (profile.comboPolicy === 'bow-volley-once-learned-v1' || profile.comboPolicy === 'bow-volley-at-target-v1') &&
    !(player.skillLevels?.['amazon.multiple_shot'] ?? 0)
    ? ['amazon.magic_arrow'] : [...declaredPriority];
  if (profile.comboPolicy === 'bow-volley-at-target-v1') {
    const signature = 'amazon.multiple_shot';
    const target = Math.max(0, ...profile.targets.filter(row => row.id === signature).map(row => row.rank));
    // Keep early support until the declared volley investment is complete.
    if (target > 0 && (player.skillLevels?.[signature] ?? 0) >= target)
      priority = [signature, ...priority.filter(skill => skill !== signature)];
  }
  if (profile.comboPolicy === 'holy-bolt-at-target-v1') {
    const signature = 'paladin.holy_bolt';
    const target = Math.max(0, ...profile.targets.filter(row => row.id === signature).map(row => row.rank));
    // Keep the Hammer bridge until the declared primary-spell investment is complete.
    if (target > 0 && (player.skillLevels?.[signature] ?? 0) >= target &&
      (player.skillLevels?.['paladin.blessed_hammer'] ?? 0) > 0)
      priority = [signature, ...priority.filter(skill => skill !== signature)];
  }
  if (profile.comboPolicy === 'fire-meteor-ball-v1' &&
    (player.skillLevels?.['sorceress.meteor'] ?? 0) > 0 &&
    (player.skillLevels?.['sorceress.fire_ball'] ?? 0) > 0) {
    // Let the invested direct spell use turns between Meteors before periodic support.
    const pair = ['sorceress.meteor', 'sorceress.fire_ball'];
    priority = [...pair, ...priority.filter(skill => !pair.includes(skill))];
  }
  if ((profile.comboPolicy === 'javelin-lightning-impale-v1' || profile.comboPolicy === 'javelin-pair-at-target-v1') &&
    (player.skillLevels?.['amazon.lightning_strike'] ?? 0) > 0 &&
    (player.skillLevels?.['amazon.impale'] ?? 0) > 0) {
    const pair = ['amazon.lightning_strike', 'amazon.impale'];
    if (profile.comboPolicy === 'javelin-lightning-impale-v1' || pair.every(skill => priority.includes(skill))) {
      // Keep the bridge until both investments are complete; then leave mana for the pair.
      const invested = profile.comboPolicy === 'javelin-pair-at-target-v1' && pair.every(skill => {
        const target = Math.max(0, ...profile.targets.filter(row => row.id === skill).map(row => row.rank));
        return target > 0 && (player.skillLevels?.[skill] ?? 0) >= target;
      });
      priority = invested ? pair : [...pair, ...priority.filter(skill => !pair.includes(skill))];
    }
  }
  if (profile.comboPolicy === 'bone-survival-curse-v1') {
    // Alternate short curses can otherwise occupy every turn before the first kill.
    const previousWave = context?.previousWave, nextOrdinal = useMapStore.getState().challengeOrdinals.normal;
    const offensive = 'necromancer.amplify_damage';
    const recovery = profile.drawRecoveryPolicy === 'learned-offensive-curse-v1' &&
      context?.phase === 'route' && previousWave?.phase === 'route' && previousWave.area === area &&
      previousWave.outcome === 'draw' && previousWave.advance === 'defeat' && previousWave.heroLife > 0 &&
      previousWave.ordinal + 1 === nextOrdinal &&
      hasLearnedOffensiveCurse(profile, player.skillLevels ?? {}, area);
    const supplied = context?.trainingRecovery;
    const training = context?.phase === 'farm' && area !== undefined && supplied
      ? trainingCurseRecovery(profile, player.skillLevels ?? {}, area, nextOrdinal, previousWave,
        previousWave?.outcome === 'victory' ? supplied : undefined) : undefined;
    const trainingRecovery = training && supplied &&
      training.area === supplied.area && training.triggerOrdinal === supplied.triggerOrdinal;
    priority = boneCursePriority(profile, player.skillLevels ?? {}, area, recovery || Boolean(trainingRecovery));
    if (trainingRecovery) record({ kind: 'campaign-training-draw-recovery', recovery: training,
      previousWave, nextOrdinal, selectedCurse: offensive });
    if (recovery) record({ kind: 'campaign-draw-recovery', policy: profile.drawRecoveryPolicy,
      area, previousWave, nextOrdinal, selectedCurse: offensive });
  }
  usePlayerStore.getState().setComboOrder(priority);
  record({ kind: 'priority', order: usePlayerStore.getState().player?.comboOrder });
}

function expectedBasicPhysical(comparison: CompareResult, side: 'current' | 'candidate') {
  const attack = comparison.stats.attack[side], speed = comparison.stats.attackSpeed[side];
  const chance = comparison.stats.critChance[side], multiplier = comparison.stats.critDamage[side];
  const critical = 1 + Math.min(1, chance) * (multiplier + Math.max(0, chance - 1) / 2 - 1);
  return attack * critical * 1000 / actionPeriodMs(speed);
}

/** Native owned upgrades with explicit build affinity and physical-support preparation. */
export function equipCampaignGear(record: CampaignRecord, profile: CampaignProfile) {
  const ownedBuild = profile.ownedEquipmentPolicy === 'owned-build-v1';
  if (ownedBuild) assert.ok(!useCombatStore.getState().inCombat && !hasActiveSubAreaRun(),
    'Campaign owned equipment requires an idle boundary');
  if (profile.progressionPolicy === 'javelin-earned-v1') {
    const player = usePlayerStore.getState().player; assert.ok(player);
    profile = earnedJavelinProfile(profile, player.level);
  }
  const bases = loadItemBases();
  const map = useMapStore.getState();
  const ownedActTwoDefense = profile.survivalEquipmentPolicy === 'act2-owned-v1' &&
    map.isActUnlocked(2) && !map.isActUnlocked(3);
  const ownedActOneDefense = profile.earlySurvivalEquipmentPolicy === 'owned-balanced-v1' &&
    !map.isActUnlocked(2);
  const usesBow = (equipped: Readonly<Record<string, Item | null>>) => {
    const { weaponType } = resolveEquippedWeapon(equipped);
    return weaponType === 'bow' || weaponType === 'crossbow';
  };
  if (profile.weaponPolicy) assert.ok(usesBow(useInventoryStore.getState().equipped),
    'Campaign bow fallback missing');
  const slots = [...EQUIPMENT_SLOT_ORDER].sort();
  if (ownedBuild) slots.unshift(...slots.splice(slots.indexOf('weapon'), 1));
  for (const slot of slots) {
    if ((profile.progressionPolicy !== undefined || ownedActTwoDefense || ownedActOneDefense) &&
      !['weapon', 'offhand', 'charm'].includes(slot)) continue;
    const inventory = useInventoryStore.getState(), map = useMapStore.getState();
    const selection = ownedBuild ? useIronGolemSelectionStore.getState().selection : undefined;
    const reserved = selection?.heroId === usePlayerStore.getState().player?.id ? selection?.itemId : undefined;
    const owned = ownedBuild ? [...inventory.backpack, ...inventory.stash].filter(item => item.id !== reserved) : inventory.backpack;
    // Candidate evidence stays detached; unrelated owned items need no copy for this slot.
    const state = structuredClone({ player: { player: usePlayerStore.getState().player },
      inventory: { equipped: inventory.equipped, backpack: slotCandidates(owned, slot, bases),
        questItems: inventory.questItems },
      map: { questProgress: map.questProgress, questReceipts: map.questReceipts } });
    const player = state.player.player; assert.ok(player);
    const physicalWeapon = ownedBuild && slot === 'weapon' &&
      profile.heroWeaponPolicy?.kind === 'physical-offense-v1' && player.level >= profile.heroWeaponPolicy.level;
    const compare = prepareCompareEquip(player, state.inventory.equipped, bases,
      state.map.questProgress, state.inventory.questItems, state.map.questReceipts);
    const affinity = ownedBuild ? profile.weaponAffinity : undefined;
    const hasAffinity = affinity !== undefined && resolveEquippedWeapon(state.inventory.equipped).weaponType === affinity;
    const candidates = state.inventory.backpack.map(item => {
      const eligibility = checkEligibility(item, player, bases);
      const comparison = eligibility.eligible ? compare(item, slot) : null;
      let policyRejection: 'requires-bow-fallback' | 'requires-build-weapon' | null = null;
      let acquiresWeaponAffinity = false;
      if ((profile.weaponPolicy !== undefined || affinity !== undefined) && eligibility.eligible) {
        const base = bases.get(item.baseId); assert.ok(base);
        const mutex = planEquipMutex(slot, base, {
          weapon: state.inventory.equipped.weapon ?? null,
          offhand: state.inventory.equipped.offhand ?? null
        }, bases);
        const next = { ...state.inventory.equipped, [slot]: item };
        for (const cleared of mutex.clear) next[cleared] = null;
        if (profile.weaponPolicy && !usesBow(next)) policyRejection = 'requires-bow-fallback';
        const nextHasAffinity = affinity !== undefined && resolveEquippedWeapon(next).weaponType === affinity;
        if (hasAffinity && !nextHasAffinity) policyRejection = 'requires-build-weapon';
        acquiresWeaponAffinity = slot === 'weapon' && !hasAffinity && nextHasAffinity;
      }
      const offense = comparison && physicalWeapon ? {
        current: expectedBasicPhysical(comparison, 'current'),
        candidate: expectedBasicPhysical(comparison, 'candidate')
      } : undefined;
      return { item, eligibility, comparison, score: offense?.candidate ?? (comparison ? netEquipDelta(comparison) : 0),
        upgrade: comparison !== null && (acquiresWeaponAffinity || (offense ? offense.candidate > offense.current :
          isClearNetUpgrade(comparison))),
        ...(offense ? { physicalOffense: offense } : {}),
        ...(profile.weaponPolicy !== undefined || affinity !== undefined ? { policyRejection } : {}),
        ...(affinity ? { acquiresWeaponAffinity } : {}) };
    });
    const upgrades = candidates.filter(row => row.upgrade && !row.policyRejection).sort((a, b) =>
      Number(b.acquiresWeaponAffinity) - Number(a.acquiresWeaponAffinity) || b.score - a.score ||
      (a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0));
    const refusalGuard = upgrades.length ? observeEarnedState() : null;
    record({ kind: 'gear-decision', slot, candidates, selected: upgrades[0]?.item.id ?? null });
    for (const candidate of upgrades) {
      let item = candidate.item;
      if (ownedBuild) {
        const base = bases.get(item.baseId); assert.ok(base);
        const equipped = useInventoryStore.getState().equipped;
        const mutex = planEquipMutex(slot, base, {
          weapon: equipped.weapon ?? null, offhand: equipped.offhand ?? null
        }, bases);
        const extraRoom = Math.max(0, Number(Boolean(equipped[slot])) + mutex.displaced.length - 1);
        const retrieved = retrieveCampaignGear(item.id, record, 'stash-room-v1', extraRoom);
        if (!retrieved) continue;
        item = retrieved;
      }
      const beforeEquip = ownedBuild ? observeEarnedState() : refusalGuard;
      const result = useInventoryStore.getState().equipItem(item, slot);
      record({ kind: 'equip', slot, item: candidate.item, result, before: player.derivedStats,
        after: usePlayerStore.getState().player?.derivedStats });
      if (result.ok) {
        if (profile.weaponPolicy) assert.ok(usesBow(useInventoryStore.getState().equipped),
          'Campaign equip removed bow fallback');
        if (hasAffinity || candidate.acquiresWeaponAffinity)
          assert.equal(resolveEquippedWeapon(useInventoryStore.getState().equipped).weaponType, affinity,
            'Campaign equip removed build weapon affinity');
        break;
      }
      assert.equal(result.reason, 'backpack_full', 'Unexpected campaign equip refusal');
      assert.deepEqual(observeEarnedState(), beforeEquip, 'Capacity refusal changed earned state');
    }
  }
  if (ownedActOneDefense) {
    equipCampaignSurvivalGear('hero', actOneDefense.threats as readonly CampaignThreat[], record,
      undefined, undefined, profile.survivalRetrievalPolicy);
  }
  if (profile.progressionPolicy === 'javelin-earned-v1') {
    const act = useMapStore.getState().currentAct, threats = javelinGearThreats(act);
    const manaReserve = act === 2 ? 150 : undefined;
    const player = usePlayerStore.getState().player; assert.ok(player);
    const mainhand = useInventoryStore.getState().equipped.weapon;
    // Lightning Strike has fixed rank damage; Impale at 28 restores the Attack floor.
    const shieldPolicy = act === 2 && player.level >= 24 && player.level < 28 &&
      (!mainhand || isOneHandedWeapon(bases.get(mainhand.baseId))) ? { minimumAttack: 0 } : undefined;
    equipCampaignSurvivalGear('hero', threats, record, manaReserve, shieldPolicy);
    equipCampaignSurvivalGear('merc', threats, record, manaReserve);
  } else if (profile.mercEquipmentPolicy === 'monotone-fielded-v1') {
    const selection = ownedBuild ? useIronGolemSelectionStore.getState().selection : undefined;
    const reserved = selection?.heroId === usePlayerStore.getState().player?.id ? selection?.itemId : undefined;
    equipCampaignMercGear(record, false, reserved, profile.mercWeaponPolicy);
  }
  if (ownedActTwoDefense) {
    const threats = javelinGearThreats(2);
    equipCampaignSurvivalGear('hero', threats, record, 150, undefined, profile.survivalRetrievalPolicy);
    equipCampaignSurvivalGear('merc', threats, record, 150, undefined, profile.survivalRetrievalPolicy);
  }
}

/** Same quest Start action as QuestCard, with every objective initially false. */
export function startCampaignQuest(id: string, record: CampaignRecord) {
  const quest = loadQuests().find(row => row.id === id), map = useMapStore.getState();
  assert.ok(quest);
  assert.ok(!map.questProgress[id]);
  assert.ok(!quest.prerequisites?.some(key => map.questProgress[key]?.status !== 'completed'));
  map.updateQuestProgress(id, { status: 'inProgress',
    objectives: Object.fromEntries(quest.objectives.map(objective => [objective.id, false])) });
  record({ kind: 'quest-start', id, progress: useMapStore.getState().questProgress[id] });
}

/** Account actual once-only Claim rewards before fallible diagnostic recording. */
export function claimCampaignQuest(id: string, record: CampaignRecord,
  onReward: (delta: ReturnType<typeof earnedDelta>) => void) {
  assert.equal(canClaim(id), true);
  recordCampaignBossCheckpoint('before-claim', id, record);
  const before = observeEarnedState(), result = claimQuestReward(id);
  const delta = earnedDelta(before, observeEarnedState());
  if (result === 'ok') onReward(delta);
  record({ kind: 'quest-claim', id, result, delta });
  assert.equal(result, 'ok'); assert.equal(canClaim(id), false);
  return delta;
}
