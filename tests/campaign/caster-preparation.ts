import assert from 'node:assert/strict';
import { loadMercHireRoster } from '@/data/loaders/mercs';
import { loadItemBases } from '@/data/loaders/loot';
import { BACKPACK_CAPACITY } from '@/stores/inventoryCapacity';
import { useCombatStore } from '@/stores/combatStore';
import { useHydrationStore } from '@/stores/hydrationStore';
import { useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { prepareLiveMaterialAction, executeLiveMaterialAction } from '@/stores/materialActions';
import { RESPEC_POLICY } from '@/data/loaders/respec';
import { mitigateDamage } from '@/engine/combat/damage';
import probes from './caster-gear-probes.json';
import type { EquipmentSlot } from '@/engine/types/items';
import type { DerivedStats } from '@/engine/types/attributes';
import { checkEligibility, slotCandidates, prepareCompareEquip, type CompareResult } from '@/features/inventory/compareEquip';
import { usePlayerStore } from '@/stores/playerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { prepareTownRespec, executeTownRespec } from '@/stores/respecActions';
import { snapshotStores } from '@/stores/persistence';
import { EQUIPMENT_SLOT_ORDER } from '@/ui/EquipmentPanel';
import { earnedDelta, observeEarnedState } from '../sim/production/earned-state';
import type { CampaignProfile } from './policy';
import { growCampaignBuild, type CampaignRecord } from './actions';
import type { CampaignReward } from './economy';
import { retrieveCampaignGear } from './owned-gear';

const scalarKeys = ['lifeMax', 'manaMax', 'attack', 'defense', 'magicResist',
  'attackSpeed', 'critChance', 'critDamage', 'physDodge', 'magicDodge'] as const;
const resistanceKeys = ['fire', 'cold', 'lightning', 'poison', 'arcane', 'physical'] as const;
export type CasterGearScoring = 'elemental-v1' | 'mixed-v4';

/** Frozen elemental score or versioned mixed probes resolved by production mitigation. */
export function casterGearScore(stats: DerivedStats, baseline: DerivedStats,
  scoring: CasterGearScoring = 'elemental-v1'): number {
  if (stats.manaMax < 80 || stats.defense < baseline.defense * .8 ||
    stats.attackSpeed < baseline.attackSpeed * .9) return -Infinity;
  if (scoring === 'mixed-v4') {
    const mean = resistanceKeys.reduce((sum, type) => {
      const magic = type === 'cold' || type === 'lightning' || type === 'arcane';
      const hit = mitigateDamage(magic ? probes.magicRawDamage : probes.armorRawDamage,
        { type, defenderResistances: stats.resistances, defenderArmor: stats.defense,
          defenderMagicResist: stats.magicResist });
      return sum + hit.final * Math.max(probes.minimumHitChance,
        probes.hitChance - (magic ? stats.magicDodge : stats.physDodge));
    }, 0) / resistanceKeys.length;
    return stats.lifeMax * stats.attackSpeed / mean;
  }
  const mean = (['cold', 'lightning', 'arcane'] as const).reduce((sum, type) => sum + Math.max(1,
    Math.floor(60 * (1 - Math.min(75, Math.max(-100, stats.resistances[type])) / 100) - stats.magicResist)), 0) / 3;
  return stats.lifeMax * stats.attackSpeed / (mean * (1 - stats.magicDodge));
}

function candidateStats(current: DerivedStats, comparison: CompareResult): DerivedStats {
  const result = { ...current, resistances: { ...current.resistances } };
  for (const key of scalarKeys) result[key] = comparison.stats[key].candidate;
  for (const key of resistanceKeys) result.resistances[key] = comparison.resistances[key].candidate;
  return result;
}

/** Eligible owned gear only; native mutexes and capacity refusals keep their normal behavior. */
export function equipCampaignCasterGear(baseline: DerivedStats, record: CampaignRecord,
  weaponPolicy: 'survival' | 'critical' | 'critical-all' = 'survival', scoring: CasterGearScoring = 'elemental-v1',
  slots: readonly EquipmentSlot[] = EQUIPMENT_SLOT_ORDER): void {
  const bases = loadItemBases();
  for (const slot of [...slots].sort()) {
    const player = usePlayerStore.getState().player; assert.ok(player);
    const inventory = useInventoryStore.getState(), map = useMapStore.getState();
    const weapon = slot === 'weapon' || slot === 'offhand';
    const critical = weaponPolicy === 'critical-all' || (weaponPolicy === 'critical' && weapon);
    const compare = prepareCompareEquip(player, inventory.equipped, bases,
      map.questProgress, inventory.questItems, map.questReceipts);
    const score = casterGearScore(player.derivedStats, baseline, scoring);
    const candidates = slotCandidates([...inventory.backpack, ...inventory.stash], slot, bases)
      .filter(item => checkEligibility(item, player, bases).eligible &&
        (!critical || !weapon || (bases.get(item.baseId)?.type === 'weapon' && bases.get(item.baseId)?.handedness === 'oneHanded'))).map(item => {
        const stats = candidateStats(player.derivedStats, compare(item, slot));
        return { item, stats, score: casterGearScore(stats, baseline, scoring) };
      }).filter(row => (weaponPolicy !== 'critical-all' || (Number.isFinite(row.score) && resistanceKeys.every(type =>
        row.stats.resistances[type] >= Math.min(75, player.derivedStats.resistances[type])))) && (critical ? row.stats.critChance >= player.derivedStats.critChance &&
        row.stats.critDamage >= player.derivedStats.critDamage &&
        (scoring === 'mixed-v4' ? row.score > score :
          row.stats.critChance > player.derivedStats.critChance || row.stats.critDamage > player.derivedStats.critDamage) :
        row.score > score)).sort((left, right) => (critical && scoring === 'elemental-v1' ?
        right.stats.critChance - left.stats.critChance || right.stats.critDamage - left.stats.critDamage : right.score - left.score) ||
        (left.item.id < right.item.id ? -1 : left.item.id > right.item.id ? 1 : 0));
    record({ kind: 'caster-gear-decision', slot, weaponPolicy, scoring, currentScore: score, candidates,
      selected: candidates[0]?.item.id ?? null });
    for (const candidate of candidates) {
      const item = retrieveCampaignGear(candidate.item.id, record); if (!item) continue;
      const before = observeEarnedState();
      const result = useInventoryStore.getState().equipItem(item, slot);
      record({ kind: 'caster-equip', slot, item: candidate.item, result,
        expectedComparableStats: Object.fromEntries(scalarKeys.map(key => [key, candidate.stats[key]])),
        expectedResistances: candidate.stats.resistances, after: usePlayerStore.getState().player?.derivedStats });
      if (result.ok) {
        const after = usePlayerStore.getState().player; assert.ok(after);
        for (const key of scalarKeys) assert.equal(after.derivedStats[key], candidate.stats[key]);
        assert.deepEqual(after.derivedStats.resistances, candidate.stats.resistances);
        break;
      }
      assert.equal(result.reason, 'backpack_full');
      assert.deepEqual(observeEarnedState(), before, 'Caster capacity refusal changed earned state');
    }
  }
}

/** Opt-in caster sink: keep useful candidates and special gear, then salvage surplus bag items natively. */
export function recoverCampaignCasterCapacity(baseline: DerivedStats, record: CampaignRecord,
  onSink: (delta: CampaignReward) => void): 'ready' | 'protected-capacity-blocked' {
  assert.equal(useHydrationStore.getState().status, 'ready');
  assert.ok(!useCombatStore.getState().inCombat && !hasActiveSubAreaRun(), 'Caster recovery requires an idle boundary');
  const player = usePlayerStore.getState().player; assert.ok(player);
  const inventory = useInventoryStore.getState(), target = BACKPACK_CAPACITY - 3;
  if (inventory.backpack.length <= target) return 'ready';
  const selection = useIronGolemSelectionStore.getState().selection;
  const reserved = selection?.heroId === player.id ? selection.itemId : undefined;
  const retained = new Set([...inventory.backpack, ...inventory.stash].filter(item =>
    item.equipped || (item.socketContents?.length ?? 0) > 0 || !['normal', 'magic', 'rare'].includes(item.rarity) ||
    item.id === reserved).map(item => item.id));
  for (const item of Object.values(inventory.equipped)) if (item) retained.add(item.id);
  const bases = loadItemBases(), map = useMapStore.getState();
  const compare = prepareCompareEquip(player, inventory.equipped, bases,
    map.questProgress, inventory.questItems, map.questReceipts);
  for (const slot of EQUIPMENT_SLOT_ORDER) {
    // Future upgrades participate in retention; native equip gates still apply above.
    const rows = slotCandidates([...inventory.backpack, ...inventory.stash], slot, bases)
      .map(item => {
        const stats = candidateStats(player.derivedStats, compare(item, slot));
        return { item, mixed: casterGearScore(stats, baseline, 'mixed-v4'),
          elemental: casterGearScore(stats, baseline),
          critical: stats.attackSpeed * (1 + stats.critChance * (stats.critDamage - 1)), attack: stats.attack * stats.attackSpeed };
      });
    for (const key of ['mixed', 'elemental', 'critical', 'attack'] as const) {
      const best = rows.filter(row => Number.isFinite(row.mixed) && (key !== 'attack' ||
        row.attack > player.derivedStats.attack * player.derivedStats.attackSpeed)).sort((a,b) => b[key] - a[key] ||
        (a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0))[0];
      if (best) retained.add(best.item.id);
    }
  }
  const ids = inventory.backpack.filter(item => !retained.has(item.id)).map(item => item.id);
  record({ kind: 'caster-capacity-selection', retainedItemIds: [...retained].sort(), itemIds: ids });
  if (ids.length) {
    const before = observeEarnedState(), selected = new Set(ids);
    const request = prepareLiveMaterialAction({ recipeId: 'actions/salvage', itemIds: ids });
    const result = executeLiveMaterialAction(request), delta = earnedDelta(before, observeEarnedState());
    onSink({ ...delta, inventorySink: { policy: 'salvage-caster-overflow-v1', ordinal: request.ordinal,
      retainedItemIds: [...retained].sort(),
      consumedItems: before.inventory.backpack.filter(item => selected.has(item.id)) } });
    assert.equal(result.replay, false); assert.deepEqual(delta.removedItemIds, ids);
    assert.deepEqual(delta.addedItems, []); assert.equal(delta.xp, 0);
    record({ kind: 'campaign-inventory-sink', policy: 'salvage-caster-overflow-v1', request, result, delta });
  }
  assert.deepEqual(useInventoryStore.getState().stash, inventory.stash);
  return useInventoryStore.getState().backpack.length <= target ? 'ready' : 'protected-capacity-blocked';
}

/** Hire the authored Prayer body without replacing old mercenary ownership or supplying equipment. */
export function hireCampaignPrayer(record: CampaignRecord): void {
  const roster = loadMercHireRoster().find(row => row.act === 2); assert.ok(roster);
  const definition = roster.mercs.find(row => row.id === 'mercs/act2-prayer'); assert.ok(definition);
  const before = snapshotStores(); assert.ok(before);
  assert.ok(before.player.level >= roster.unlockReqLevel && useMapStore.getState().isActUnlocked(2),
    'Prayer requires earned Act II and native level access');
  const result = useMercStore.getState().hireMerc(definition); assert.equal(result.ok, true);
  const after = snapshotStores(); assert.ok(after);
  record({ kind: 'act2-native-prayer-hire', definition, result, before, after });
  for (const key of ['player', 'inventory', 'map', 'formation', 'meta', 'endgame'] as const)
    assert.deepEqual(after[key], before[key]);
  assert.deepEqual(after.mercs.ownedMercs.slice(0, -1), before.mercs.ownedMercs);
  const merc = after.mercs.ownedMercs.at(-1); assert.ok(merc);
  assert.equal(merc.level, definition.reqLevel); assert.equal(merc.id, result.mercId);
  assert.deepEqual(after.mercs.mercEquipment, { ...before.mercs.mercEquipment, [merc.id]: {} });
  assert.equal(after.mercs.fieldedMercId, merc.id);
}

/** Consume one native free reset; its refunded points remain available for ordinary allocation. */
export function resetCampaignPoints(kind: 'stat' | 'skill', record: CampaignRecord) {
  const before = snapshotStores(); assert.ok(before);
  const key = String(before.map.currentAct) as keyof typeof RESPEC_POLICY.townNpcs;
  const npcId = RESPEC_POLICY.townNpcs[key]; assert.ok(npcId);
  assert.ok(before.player.respecsRemaining[kind] > 0, 'Diagnostic requires an unused free reset');
  const quote = prepareTownRespec(npcId, kind);
  if (quote.kind !== 'ok') throw new Error(`Native campaign reset refused: ${quote.kind}`);
  assert.equal(quote.cost, 0); assert.equal(executeTownRespec(quote.request), 'ok');
  const after = snapshotStores(); assert.ok(after);
  const audit = { kind, npcId, refund: quote.refund, cost: quote.cost, before, after };
  record({ kind: 'act2-native-point-reset', audit });
  for (const domain of ['inventory', 'map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    assert.deepEqual(after[domain], before[domain]);
  assert.equal(after.player.respecsRemaining[kind], before.player.respecsRemaining[kind] - 1);
  if (kind === 'stat') {
    assert.equal(after.player.statPoints, before.player.statPoints + quote.refund);
    assert.deepEqual(after.player.skillLevels, before.player.skillLevels);
    assert.equal(after.player.skillPoints, before.player.skillPoints);
    assert.equal(after.player.respecsRemaining.skill, before.player.respecsRemaining.skill);
  } else {
    assert.equal(quote.refund, Object.values(before.player.skillLevels ?? {}).reduce((sum, rank) => sum + rank, 0));
    assert.deepEqual(after.player.skillLevels, {});
    assert.equal(after.player.skillPoints, before.player.skillPoints + quote.refund);
    assert.deepEqual(after.player.coreStats, before.player.coreStats);
    assert.equal(after.player.statPoints, before.player.statPoints);
    assert.equal(after.player.respecsRemaining.stat, before.player.respecsRemaining.stat);
  }
  return audit;
}

/** Spend one available native stat reset after earned55; retain the profile before fallible logging. */
export function prepareNovaActFiveResources(initial: CampaignProfile, record: CampaignRecord,
  retain?: (profile: CampaignProfile) => void): CampaignProfile {
  const before = snapshotStores(); assert.ok(before);
  assert.equal(initial.classId, 'sorceress');
  assert.ok(before.player.level >= 55 && useMapStore.getState().isActUnlocked(5), 'Act V resources require earned55/access');
  assert.ok(before.player.respecsRemaining.stat > 0, 'Act V resources require an unused free reset');
  const profile: CampaignProfile = { ...initial,
    statsPerLevel: { strength: 0, dexterity: 2, vitality: 2, energy: 1 } };
  retain?.(profile);
  const reset = resetCampaignPoints('stat', record); growCampaignBuild(profile, record);
  const after = snapshotStores(); assert.ok(after);
  assert.equal(after.player.statPoints + Object.values(after.player.coreStats).reduce<number>((sum: number, value: number)=>sum+value,0),
    before.player.statPoints + Object.values(before.player.coreStats).reduce<number>((sum: number, value: number)=>sum+value,0));
  assert.deepEqual(after.player.skillLevels, before.player.skillLevels);
  assert.equal(after.player.skillPoints, before.player.skillPoints);
  for (const domain of ['inventory','map','mercs','formation','meta','endgame'] as const)
    assert.deepEqual(after[domain], before[domain]);
  record({ kind: 'nova-act5-earned-resource-preparation', profile, reset, before, after });
  return profile;
}

/** Pay the native stat reset once after earned55, then allocate four Dexterity and one Vitality per level. */
export function prepareNovaBaalDexterity(initial: CampaignProfile, record: CampaignRecord,
  onCost: (delta: CampaignReward) => void, retain?: (profile: CampaignProfile) => void): CampaignProfile {
  const before = snapshotStores(); assert.ok(before);
  assert.equal(initial.classId, 'sorceress');
  assert.ok(before.player.level >= 55 && useMapStore.getState().isActUnlocked(5), 'Baal preparation requires earned55/access');
  const statsPerLevel = { strength: 0, dexterity: 4, vitality: 1, energy: 0 };
  if (Object.entries(statsPerLevel).every(([key, value]) =>
    initial.statsPerLevel[key as keyof typeof statsPerLevel] === value)) return initial;
  const basis = observeEarnedState(), quote = prepareTownRespec(RESPEC_POLICY.townNpcs['5'], 'stat');
  if (quote.kind !== 'ok') throw new Error(`Native Baal preparation refused: ${quote.kind}`);
  assert.equal(quote.cost, RESPEC_POLICY.paidCost, 'Baal preparation requires a paid native quote');
  const result = executeTownRespec(quote.request);
  if (result !== 'ok') throw new Error(`Native Baal preparation refused: ${result}`);
  const profile: CampaignProfile = { ...initial, statsPerLevel };
  const cost = earnedDelta(basis, observeEarnedState());
  retain?.(profile); onCost(cost);
  record({ kind: 'nova-baal-paid-stat-reset', profile, refund: quote.refund, cost: quote.cost, delta: cost });
  growCampaignBuild(profile, record);
  const after = snapshotStores(); assert.ok(after);
  const points = (player: typeof before.player) => player.statPoints +
    Object.values(player.coreStats).reduce<number>((sum: number, value: number) => sum + value, 0);
  assert.equal(points(after.player), points(before.player));
  assert.deepEqual(after.player.skillLevels, before.player.skillLevels);
  assert.equal(after.player.skillPoints, before.player.skillPoints);
  assert.deepEqual(after.player.respecsRemaining, before.player.respecsRemaining);
  assert.deepEqual(after.inventory, { ...before.inventory, currencies: { ...before.inventory.currencies,
    [RESPEC_POLICY.currency]: (before.inventory.currencies[RESPEC_POLICY.currency] ?? 0) - quote.cost } });
  for (const domain of ['map', 'mercs', 'formation', 'meta', 'endgame'] as const)
    assert.deepEqual(after[domain], before[domain]);
  record({ kind: 'nova-baal-earned-dexterity-preparation', profile, before, after });
  return profile;
}

/** Install the authored support merc and paid Static target before the next earned training point. */
export function prepareNovaActTwoOpening(profile: CampaignProfile, record: CampaignRecord): CampaignProfile {
  assert.equal(profile.classId, 'sorceress');
  if (useMercStore.getState().getFieldedMerc()?.id !== 'mercs/act2-prayer') hireCampaignPrayer(record);
  const prepared: CampaignProfile = { ...profile,
    targets: [{ id: 'sorceress.static_field', rank: 1, level: 6 },
      ...profile.targets.filter(target => target.id !== 'sorceress.static_field')],
    priority: ['sorceress.static_field', ...profile.priority.filter(id => id !== 'sorceress.static_field')] };
  record({ kind: 'act2-declared-opening-policy', profile: prepared }); return prepared;
}

/** Explicit paid-rank targets; neither profile grants points or bypasses native prerequisites. */
export function novaActTwoProfile(profile: CampaignProfile, cold: boolean): CampaignProfile {
  assert.equal(profile.classId, 'sorceress');
  return { ...profile, statsPerLevel: { strength: 0, dexterity: 0, vitality: 5, energy: 0 },
    targets: cold ? [
      { id: 'sorceress.ice_bolt', rank: 1, level: 1 }, { id: 'sorceress.warmth', rank: 1, level: 1 },
      { id: 'sorceress.static_field', rank: 1, level: 6 }, { id: 'sorceress.ice_blast', rank: 1, level: 6 },
      { id: 'sorceress.glacial_spike', rank: 1, level: 18 }, { id: 'sorceress.blizzard', rank: 20, level: 24 },
      { id: 'sorceress.frost_nova', rank: 20, level: 6 }
    ] : [{ id: 'sorceress.static_field', rank: 1, level: 6 },
      ...profile.targets.filter(target => target.id !== 'sorceress.static_field')],
    priority: cold ? ['sorceress.blizzard', 'sorceress.frost_nova', 'sorceress.static_field',
      'sorceress.ice_blast', 'sorceress.glacial_spike', 'sorceress.ice_bolt']
      : ['sorceress.static_field', ...profile.priority.filter(id => id !== 'sorceress.static_field')] };
}
