import assert from 'node:assert/strict';
import { loadItemBases } from '@/data/loaders/loot';
import { materialCatalog, materialEconomy } from '@/data/loaders/materials';
import { materialRecipeRules } from '@/data/loaders/material-recipes';
import { gemEffects } from '@/data/loaders/socket-effects';
import { effectiveSocketCapacity } from '@/engine/items/socket-capacity';
import { previewSocketInsertion, validateCanonicalSocketItem } from '@/engine/items/socket-contents';
import type { EquipmentSlot } from '@/engine/types/items';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore } from '@/stores/mercStore';
import { useCombatStore } from '@/stores/combatStore';
import { useMapStore } from '@/stores/mapStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import { isReplacingSave, useHydrationStore } from '@/stores/persistence';
import { assertRecordedWaveNewTransitionAllowed } from '@/stores/recordedWaveAccess';
import { prepareLiveMaterialAction, previewLiveMaterialAction, executeLiveMaterialAction } from '@/stores/materialActions';
import { earnedDelta, observeEarnedState } from '../sim/production/earned-state';
import type { CampaignRecord } from './actions';
import type { CampaignReward } from './economy';
import type { CampaignProfile } from './policy';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import { deriveEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { actionPeriodMs } from '@/engine/combat/combat';
import { usePlayerStore } from '@/stores/playerStore';
import { weaponOffense } from './merc-gear';

/** One bounded, native owned-gem preparation at an idle Nova Tomb boundary. */
export function prepareNovaTombSockets(record: CampaignRecord, onInsertion: (delta: CampaignReward) => void) {
  return prepareOwnedSockets('mercs/act2-prayer', 'prayer', record, onInsertion);
}

/** Use the same bounded paid preparation for the actually fielded Javelin companion. */
export function prepareJavelinArcaneSockets(record: CampaignRecord, onInsertion: (delta: CampaignReward) => void) {
  const merc = useMercStore.getState().getFieldedMerc(); assert.ok(merc, 'Javelin socket preparation requires a fielded merc');
  return prepareOwnedSockets(merc.id, 'merc', record, onInsertion);
}

/** Spend owned Diamonds only in the Javelin hero's empty shield sockets. */
export function prepareJavelinPhysicalShieldSockets(record: CampaignRecord, onInsertion: (delta: CampaignReward) => void) {
  const merc = useMercStore.getState().getFieldedMerc(); assert.ok(merc, 'Javelin socket preparation requires a fielded merc');
  return prepareOwnedSockets(merc.id, 'merc', record, onInsertion, 'hero-shield');
}

/** Fill owned empty sockets at Act II idle boundaries, retaining native costs and current custody. */
export function prepareIntendedActTwoSockets(profile: CampaignProfile,
  record: CampaignRecord, onInsertion: (delta: CampaignReward) => void) {
  const map = useMapStore.getState();
  if (!profile.socketPreparationPolicy || !map.isActUnlocked(2) || map.isActUnlocked(3))
    return { insertions: 0, refused: 0 };
  const merc = useMercStore.getState().getFieldedMerc();
  assert.ok(merc, 'Intended socket preparation requires a fielded merc');
  return prepareOwnedSockets(merc.id, 'merc', record, onInsertion, 'party-defense');
}

/** Spend only owned improving inserts in the fielded merc's empty weapon, across later acts. */
export function prepareIntendedMercWeaponSockets(profile: CampaignProfile,
  record: CampaignRecord, onInsertion: (delta: CampaignReward) => void) {
  if (profile.mercWeaponSocketPolicy !== 'owned-physical-offense-v1' || !useMapStore.getState().isActUnlocked(2))
    return { insertions: 0, refused: 0 };
  const merc = useMercStore.getState().getFieldedMerc();
  assert.ok(merc, 'Intended offensive sockets require a fielded merc');
  return prepareOwnedSockets(merc.id, 'merc', record, onInsertion, 'merc-weapon-offense');
}

/** Fill an empty mainhand using owned inserts once the declared physical role is active. */
export function prepareIntendedHeroWeaponSockets(profile: CampaignProfile,
  record: CampaignRecord, onInsertion: (delta: CampaignReward) => void) {
  const player = usePlayerStore.getState().player, policy = profile.heroWeaponPolicy;
  if (policy?.kind !== 'physical-offense-v1' || !player || player.level < policy.level ||
    !useMapStore.getState().isActUnlocked(2)) return { insertions: 0, refused: 0 };
  return prepareOwnedSockets(null, 'merc', record, onInsertion, 'hero-weapon-offense');
}

function prepareOwnedSockets(mercId: string | null, mercOwner: 'prayer' | 'merc',
  record: CampaignRecord, onInsertion: (delta: CampaignReward) => void,
  mode: 'party-magic' | 'hero-shield' | 'party-defense' | 'merc-weapon-offense' | 'hero-weapon-offense' = 'party-magic') {
  const heroShieldOnly = mode === 'hero-shield', heroOffensive = mode === 'hero-weapon-offense';
  const offensive = mode === 'merc-weapon-offense' || heroOffensive;
  assertRecordedWaveNewTransitionAllowed();
  assert.ok(useHydrationStore.getState().status === 'ready' && !isReplacingSave());
  assert.ok(!useCombatStore.getState().inCombat && !hasActiveSubAreaRun(), 'Socket preparation requires idle combat');
  const bases = loadItemBases();
  const slots: EquipmentSlot[] = ['head', 'chest', 'gloves', 'belt', 'boots', 'weapon', 'offhand'];
  const targets = [
    ...slots.map(slot => ({ owner: 'hero' as const, slot, item: useInventoryStore.getState().equipped[slot] })),
    ...(mercId === null ? [] : slots.map(slot => ({ owner: mercOwner, slot,
      item: useMercStore.getState().getMercEquipment(mercId)[slot] })))
  ];
  let insertions = 0, refused = 0;
  for (const target of targets) {
    const { item, owner, slot } = target;
    if (heroShieldOnly && (owner !== 'hero' || slot !== 'offhand')) continue;
    if (offensive && ((owner === 'hero') !== heroOffensive || slot !== 'weapon')) continue;
    if (!item) { record({ kind: 'campaign-socket-skip', owner, slot, reason: 'no-equipped-item' }); continue; }
    const base = bases.get(item.baseId); assert.ok(base);
    validateCanonicalSocketItem(item, base);
    const shield = base.type === 'armor' && base.slot === 'offhand';
    const capacity = effectiveSocketCapacity(item, base);
    if ((base.type !== 'weapon' && base.type !== 'armor') || !capacity || (item.socketContents?.length ?? 0) > 0 ||
      (offensive && base.type !== 'weapon') || (heroShieldOnly && !shield) || (owner === 'hero' && shield && mode === 'party-magic')) {
      record({ kind: 'campaign-socket-skip', owner, slot, itemId: item.id, reason: 'preserve-or-ineligible' }); continue;
    }
    const family = shield && owner !== 'hero' ? 'topaz' : 'diamond';
    const context = base.type === 'weapon' ? 'weaponEffect' : shield ? 'shieldEffect' : 'armorEffect';
    const choices = [...materialEconomy.gemQualities].reverse().map(quality => `gems/${family}/${quality}`);
    for (const id of offensive ? [] : choices) {
      const bonus = gemEffects.get(id)?.[context]; assert.ok(bonus);
      const value = shield ? owner === 'hero' ? bonus.resistances?.physical : bonus.resistances?.lightning :
        bonus.statMods?.magicResist;
      assert.ok(typeof value === 'number' && value > 0, 'Declared preparation gem needs a fixed positive survival effect');
    }
    const ownedMaterial = () => {
      const inventory = useInventoryStore.getState();
      if (!offensive) return choices.find(id => (inventory.materials[id] ?? 0) >= materialRecipeRules.insertion.quantity);
      const current = inventory.backpack.find(row => row.id === item.id) ?? item;
      const score = (weapon: typeof current) => {
        if (heroOffensive) {
          const player = usePlayerStore.getState().player; assert.ok(player);
          const map = useMapStore.getState();
          const stats = deriveEquippedPlayerStats(player, player.level, { ...inventory.equipped, weapon },
            map.questProgress, inventory.questItems, map.questReceipts);
          const critical = 1 + Math.min(1, stats.critChance) *
            (stats.critDamage + Math.max(0, stats.critChance - 1) / 2 - 1);
          return stats.attack * critical * 1000 / actionPeriodMs(stats.attackSpeed);
        }
        assert.ok(mercId);
        const state = useMercStore.getState(), merc = state.ownedMercs.find(row => row.id === mercId); assert.ok(merc);
        const stars = state.recruitmentProgress[merc.id.split('#')[0] ?? merc.id]?.stars ?? 0;
        return weaponOffense(deriveEquippedMercStats(merc, { ...state.getMercEquipment(mercId), weapon }, stars));
      };
      const beforeScore = score(current);
      return [...materialCatalog.values()]
        .filter(material => (material.kind === 'rune' || material.kind === 'gem') &&
          (inventory.materials[material.id] ?? 0) >= materialRecipeRules.insertion.quantity)
        .map(material => {
          const inserted = previewSocketInsertion({ ...current, equipped: false }, base, material.id);
          return { id: material.id, word: inserted.rarity === 'runeword',
            score: score(inserted) };
        }).filter(candidate => !candidate.word && candidate.score > beforeScore)
        .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0]?.id;
    };
    if (!ownedMaterial() || insertions >= 24) {
      record({ kind: 'campaign-socket-skip', owner, slot, itemId: item.id, reason: offensive ? 'no-owned-offense-or-bound' : 'no-owned-gem-or-bound' }); continue;
    }
    let transfer;
    if (owner === 'hero') transfer = useInventoryStore.getState().unequipItem(slot);
    else {
      assert.ok(mercId);
      transfer = useMercStore.getState().unequipFromMerc(mercId, slot);
    }
    if (!transfer.ok) {
      refused++; record({ kind: 'campaign-socket-refusal', owner, slot, itemId: item.id, transfer }); continue;
    }
    try {
      for (let index = 0; index < capacity && insertions < 24; index++) {
        const materialId = ownedMaterial();
        if (!materialId) { record({ kind: 'campaign-socket-skip', owner, slot, itemId: item.id, reason: offensive ? 'no-owned-offense' : 'no-owned-gem' }); break; }
        const before = observeEarnedState();
        const prior = before.inventory.backpack.find(row => row.id === item.id); assert.ok(prior);
        const request = prepareLiveMaterialAction({ recipeId: 'actions/socket-insert', itemIds: [item.id], materialId });
        const preview = previewLiveMaterialAction(request);
        const result = executeLiveMaterialAction(request);
        const after = observeEarnedState(), delta = earnedDelta(before, after);
        const next = after.inventory.backpack.find(row => row.id === item.id);
        // Preserve a committed cost before assertions or the diagnostic recorder can fail.
        onInsertion({ ...delta, socketInsertion: { ordinal: request.ordinal, materialId,
          before: prior, after: next ?? prior } });
        insertions++;
        assert.ok(next); assert.equal(result.replay, false); assert.deepEqual(result, preview);
        record({ kind: 'campaign-socket-insertion', owner, slot, request, result, delta, before: prior, after: next });
      }
    } finally {
      const current = useInventoryStore.getState().backpack.find(row => row.id === item.id); assert.ok(current);
      let restored;
      if (owner === 'hero') restored = useInventoryStore.getState().equipItem(current, slot);
      else {
        assert.ok(mercId);
        restored = useMercStore.getState().equipOnMerc(mercId, slot, current);
      }
      assert.deepEqual(restored, { ok: true }, 'Socket preparation must restore equipped target');
    }
  }
  record({ kind: 'campaign-socket-preparation', insertions, refused, ...(offensive ? { mode } : {}) });
  return { insertions, refused };
}
