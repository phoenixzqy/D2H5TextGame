import assert from 'node:assert/strict';
import { loadItemBases } from '@/data/loaders/loot';
import { deriveEquippedMercStats } from '@/engine/progression/merc-equipment-stats';
import { projectMercenaryStars } from '@/engine/progression/merc-stars';
import type { DerivedStats } from '@/engine/types/attributes';
import type { Mercenary } from '@/engine/types/entities';
import type { Item } from '@/engine/types/items';
import { checkEligibility } from '@/features/inventory/compareEquip';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useMercStore, MERC_EQUIPMENT_SLOTS, isMercEquipmentSlotCompatible } from '@/stores/mercStore';
import type { CampaignRecord } from './actions';
import { retrieveCampaignGear } from './owned-gear';
import type { CampaignProfile } from './policy';

const scalarKeys = ['lifeMax', 'manaMax', 'attack', 'defense', 'magicResist',
  'attackSpeed', 'critChance', 'critDamage', 'physDodge', 'magicDodge'] as const;
const resistanceKeys = ['fire', 'cold', 'lightning', 'poison', 'arcane', 'physical'] as const;
interface CampaignMercGearCandidate {
  item: Item;
  eligible: boolean;
  after: DerivedStats | null;
  deltas: number[];
  score: number;
  upgrade: boolean;
}
const differences = (before: DerivedStats, after: DerivedStats) => [
  ...scalarKeys.map(key => after[key] - before[key]),
  ...resistanceKeys.map(key => after.resistances[key] - before.resistances[key])
];

/** Pre-mitigation weapon proxy, including native critical overflow; not final DPS. */
export function weaponOffense(stats: DerivedStats): number {
  const chance = Math.min(1, stats.critChance);
  const multiplier = stats.critDamage + Math.max(0, stats.critChance - 1) / 2;
  return stats.attack * stats.attackSpeed * (1 + chance * (multiplier - 1));
}

/** Equip owned upgrades natively; optional weapon offense accepts defensive tradeoffs. */
export function equipCampaignMercGear(record: CampaignRecord, includeStash = false, reservedItemId?: string,
  weaponPolicy?: CampaignProfile['mercWeaponPolicy']): void {
  const fielded = useMercStore.getState().getFieldedMerc(); assert.ok(fielded, 'Campaign fielded merc missing');
  const mercId = fielded.id;
  const bases = loadItemBases();
  for (const slot of [...MERC_EQUIPMENT_SLOTS].filter(value => value !== 'charm').sort()) {
    const state = useMercStore.getState();
    const merc: Mercenary | undefined = state.ownedMercs.find((row): boolean => row.id === mercId);
    assert.ok(merc, 'Campaign fielded merc missing');
    const stars = weaponPolicy ? state.recruitmentProgress[merc.id.split('#')[0] ?? merc.id]?.stars ?? 0 : 0;
    const eligibilityMerc = projectMercenaryStars(merc, stars);
    const current = state.getMercEquipment(merc.id), before = deriveEquippedMercStats(merc, current, stars);
    const offensiveWeapon = slot === 'weapon' && weaponPolicy === 'physical-offense-v1';
    const beforeScore = weaponOffense(before);
    const inventory = useInventoryStore.getState();
    const candidates = [...inventory.backpack, ...(includeStash ? inventory.stash : [])]
      .filter(item => item.id !== reservedItemId)
      .filter(item => isMercEquipmentSlotCompatible(bases.get(item.baseId), slot))
      .map((item): CampaignMercGearCandidate => {
      const eligible = checkEligibility(item, eligibilityMerc, bases).eligible;
      const after = eligible ? deriveEquippedMercStats(merc, { ...current, [slot]: item }, stars) : null;
      const deltas = after ? differences(before, after) : [];
      const score = offensiveWeapon ? (after ? weaponOffense(after) : 0) : deltas.reduce((sum, delta) => sum + delta, 0);
      return { item, eligible, after, deltas, score,
        upgrade: after !== null && (offensiveWeapon ? score > beforeScore :
          deltas.every(delta => delta >= 0) && deltas.some(delta => delta > 0)) };
    }).sort((left, right) => right.score - left.score ||
      (left.item.id < right.item.id ? -1 : left.item.id > right.item.id ? 1 : 0));
    const selected = candidates.find(row => row.upgrade);
    record({ kind: 'merc-gear-decision', mercId: merc.id, slot, before, candidates, selected: selected?.item.id ?? null,
      ...(offensiveWeapon ? { weaponPolicy, beforeScore } : {}) });
    if (!selected) continue;
    const item = retrieveCampaignGear(selected.item.id, record); if (!item) continue;
    const result = state.equipOnMerc(merc.id, slot, item);
    const after = deriveEquippedMercStats(merc, useMercStore.getState().getMercEquipment(merc.id), stars);
    record({ kind: 'merc-equip', mercId: merc.id, slot, item: selected.item, result,
      after, ...(offensiveWeapon ? { weaponPolicy, afterScore: weaponOffense(after) } : {}) });
    assert.equal(result.ok, true, 'Campaign merc equipment refused');
    assert.deepEqual(after, selected.after);
  }
}
