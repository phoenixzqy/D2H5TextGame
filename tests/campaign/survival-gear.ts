import assert from 'node:assert/strict';
import { loadItemBases } from '@/data/loaders/loot';
import { mitigateDamage } from '@/engine/combat/damage';
import { prepareEquippedPlayerStats } from '@/engine/progression/equipped-stats';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import { isOneHandedWeapon } from '@/engine/inventory/equipValidator';
import type { DamageType, DerivedStats } from '@/engine/types/attributes';
import type { EquipmentSlot } from '@/engine/types/items';
import { checkEligibility, slotCandidates } from '@/features/inventory/compareEquip';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMapStore } from '@/stores/mapStore';
import { useMercStore } from '@/stores/mercStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useIronGolemSelectionStore } from '@/stores/ironGolemSelectionStore';
import { useCombatStore } from '@/stores/combatStore';
import { hasActiveSubAreaRun } from '@/stores/combatHelpers';
import type { CampaignRecord } from './actions';
import { retrieveCampaignGear, type CampaignGearRetrievalPolicy } from './owned-gear';

/** Frozen pre-run threat probes; callers must retain them with the campaign policy. */
export interface CampaignThreat {
  readonly type: DamageType;
  readonly rawDamage: number;
  readonly dodge: 'physical' | 'magical';
  readonly weight: number;
  readonly resistPenalty?: number;
}
const types: readonly DamageType[] = ['physical', 'fire', 'cold', 'lightning', 'arcane', 'poison', 'thorns'];
function validateThreats(threats: readonly CampaignThreat[]): void {
  assert.ok(threats.length > 0 && threats.every(threat => types.includes(threat.type) &&
    ['physical', 'magical'].includes(threat.dodge) &&
    Number.isFinite(threat.rawDamage) && threat.rawDamage >= 0 && threat.rawDamage <= Number.MAX_SAFE_INTEGER &&
    Number.isFinite(threat.weight) && threat.weight > 0 &&
    (threat.resistPenalty === undefined || Number.isFinite(threat.resistPenalty))) &&
    Number.isFinite(threats.reduce((sum, threat) => sum + threat.weight, 0)), 'Invalid campaign threat policy');
}

/** Negative expected Life fraction per probe volley, preserving stage-entry attack/speed/Mana floors. */
export function survivalGearScore(stats: DerivedStats, baseline: DerivedStats,
  threats: readonly CampaignThreat[]): number {
  validateThreats(threats);
  if (stats.attack < baseline.attack || stats.attackSpeed < baseline.attackSpeed || stats.manaMax < baseline.manaMax)
    return -Infinity;
  assert.ok(Number.isFinite(stats.lifeMax) && stats.lifeMax > 0, 'Invalid campaign Life');
  const totalWeight = threats.reduce((sum, threat) => sum + threat.weight, 0);
  const incoming = threats.reduce((sum, threat) => {
    const damage = mitigateDamage(threat.rawDamage, { type: threat.type,
      defenderResistances: stats.resistances, defenderArmor: stats.defense,
      defenderMagicResist: stats.magicResist,
      ...(threat.resistPenalty === undefined ? {} : { resistPenalty: threat.resistPenalty }) }).final;
    const dodge = threat.dodge === 'physical' ? stats.physDodge : stats.magicDodge;
    return sum + threat.weight / totalWeight * damage * Math.max(.05, .85 - dodge);
  }, 0);
  assert.ok(Number.isFinite(incoming), 'Invalid campaign incoming damage');
  return -incoming / stats.lifeMax;
}

/**
 * Bounded two-pass armor/jewelry selection from actually owned backpack/stash items.
 * Every projection uses canonical equipment and eligibility; every transfer is native.
 * Weapons stay with the build policy. Explicit hero shield selection preserves
 * the mainhand and speed, allowing a declared Attack floor for fixed-damage skills.
 * No sockets, purchases, grants or healing.
 * An explicit mana reserve allows surplus capacity to fund defense; the default
 * preserves entry capacity. Current resources are never filled by this policy.
 */
export function equipCampaignSurvivalGear(owner: 'hero' | 'merc', threats: readonly CampaignThreat[],
  record: CampaignRecord, manaReserve?: number, shieldPolicy?: { readonly minimumAttack: number },
  retrievalPolicy?: CampaignGearRetrievalPolicy): void {
  validateThreats(threats);
  assert.ok(manaReserve === undefined || Number.isSafeInteger(manaReserve) &&
    manaReserve > 0 && manaReserve <= Number.MAX_SAFE_INTEGER, 'Invalid campaign mana reserve');
  assert.ok(shieldPolicy === undefined || Number.isSafeInteger(shieldPolicy.minimumAttack) &&
    shieldPolicy.minimumAttack >= 0, 'Invalid campaign shield policy');
  assert.ok(shieldPolicy === undefined || owner === 'hero', 'Campaign shield policy requires hero ownership');
  assert.ok(!useCombatStore.getState().inCombat && !hasActiveSubAreaRun(),
    'Campaign survival gear requires an idle boundary');
  const bases = loadItemBases();
  const hero = usePlayerStore.getState().player; assert.ok(hero);
  const selection = useIronGolemSelectionStore.getState().selection;
  const reservedItemId = selection?.heroId === hero.id ? selection.itemId : undefined;
  const merc = owner === 'merc' ? useMercStore.getState().getFieldedMerc() : null;
  assert.ok(owner === 'hero' || merc, 'Campaign fielded merc missing');
  const equipment = () => merc ? useMercStore.getState().getMercEquipment(merc.id) :
    useInventoryStore.getState().equipped;
  const mainhand = equipment().weapon;
  assert.ok(shieldPolicy === undefined || !mainhand || isOneHandedWeapon(bases.get(mainhand.baseId)),
    'Campaign shield policy must preserve the mainhand');
  const projection = () => {
    if (merc) return (equipped: ReturnType<typeof equipment>) => deriveEquippedMercStats(merc, equipped);
    const player = usePlayerStore.getState().player; assert.ok(player);
    const inventory = useInventoryStore.getState(), map = useMapStore.getState();
    const deriveHero = prepareEquippedPlayerStats(player, player.level, map.questProgress,
      inventory.questItems, map.questReceipts);
    return deriveHero;
  };
  const actualStats = () => {
    const player = usePlayerStore.getState().player; assert.ok(player);
    return merc ? deriveEquippedMercStats(merc, equipment()) : player.derivedStats;
  };
  const baseline = projection()(equipment());
  const minimums = { ...baseline, manaMax: Math.min(baseline.manaMax, manaReserve ?? baseline.manaMax),
    attack: Math.min(baseline.attack, shieldPolicy?.minimumAttack ?? baseline.attack) };
  const slots: readonly EquipmentSlot[] = ['head', 'chest', 'gloves', 'belt', 'boots', 'amulet',
    'ring-left', 'ring-right', ...(shieldPolicy ? ['offhand' as const] : [])];
  for (let pass = 0; pass < 2; pass++) {
    let changed = false;
    for (const slot of slots) {
      const derive = projection();
      const current = equipment(), before = derive(current), state = useInventoryStore.getState();
      const score = survivalGearScore(before, minimums, threats);
      const candidates = slotCandidates([...state.backpack, ...state.stash], slot, bases)
        .filter(item => item.id !== reservedItemId &&
          (slot !== 'offhand' || bases.get(item.baseId)?.slot === 'offhand')).map(item => {
        const eligibility = checkEligibility(item, merc ?? hero, bases);
        const after = eligibility.eligible ? derive({ ...current, [slot]: item }) : null;
        return { item, eligibility, after, score: after ? survivalGearScore(after, minimums, threats) : -Infinity };
      }).sort((a, b) => b.score - a.score || (a.item.id < b.item.id ? -1 : a.item.id > b.item.id ? 1 : 0));
      const selected = candidates.find(row => row.score > score);
      record({ kind: 'campaign-survival-gear-decision', owner, mercId: merc?.id ?? null,
        pass, slot, threats, baseline, minimums, shieldPolicy, before, score, candidates, selected: selected?.item.id ?? null });
      for (const candidate of candidates.filter(row => row.score > score)) {
        const item = retrieveCampaignGear(candidate.item.id, record, retrievalPolicy); if (!item) continue;
        const result = merc ? useMercStore.getState().equipOnMerc(merc.id, slot, item) :
          useInventoryStore.getState().equipItem(item, slot);
        record({ kind: 'campaign-survival-equip', owner, slot, item, result, after: actualStats() });
        if (!result.ok) {
          assert.equal(result.reason, 'backpack_full', 'Unexpected survival gear refusal');
          continue;
        }
        assert.deepEqual(actualStats(), candidate.after, 'Survival gear projection differs from native equip');
        changed = true;
        break;
      }
    }
    if (!changed) break;
  }
}
