import { loadAffixPool, loadSetPieces } from '@/data/loaders/loot';
import { deriveEquippedPlayerStats } from '../progression/equipped-stats';
import type { SaveCurrent } from '../types/save';

type RateKey = 'critChance' | 'critDamage' | 'physDodge' | 'magicDodge';
const RATE_KEYS: readonly RateKey[] = ['critChance', 'critDamage', 'physDodge', 'magicDodge'];

// Historical BUG093 source mask, not item values. Current values come only
// from the canonical equipment projection; already-fractional sources stay out.
const CORRECTED_UNIQUES: ReadonlyMap<string, readonly RateKey[]> = new Map([
  ['items/unique/crushflange', ['critChance']],
  ['items/unique/goblin-toe', ['critChance']],
  ['items/unique/whistan-guard', ['physDodge']],
  ['items/unique/ribcracker', ['critChance']],
  ['items/unique/razor-tine', ['critChance']],
  ['items/unique/hone-sundan', ['critChance']],
  ['items/unique/darksight-helm', ['magicDodge']],
  ['items/unique/spirit-ward', ['magicDodge']],
  ['items/unique/earth-shaker', ['critChance']],
  ['items/unique/gerke-sanctuary', ['magicDodge']],
  ['items/unique/steel-shade', ['magicDodge']],
  ['items/unique/steelshade', ['physDodge']],
  ['items/unique/buriza-do-kyanon', ['physDodge']],
  ['items/unique/kerke-sanctuary', ['magicDodge']],
  ['items/unique/eaglehorn', ['critChance', 'magicDodge']],
  ['items/unique/shadow-dancer', ['magicDodge']],
  ['items/unique/the-stone-crusher', ['critChance']],
  ['items/unique/the-gladiator-bane', ['magicDodge']],
  ['items/unique/the-cranium-basher', ['critChance']],
  ['items/unique/the-cranium-basher-greater', ['critChance']]
]);
const CORRECTED_SET_BONUSES: readonly [string, number, RateKey][] = [
  ['sets/cleglaw-brace', 3, 'physDodge'],
  ['sets/natalyas-odium', 3, 'critChance'],
  ['sets/natalyas-odium', 4, 'critDamage']
];

/**
 * Refresh identifiable BUG091/BUG093 player rate caches after save validation
 * and Map restoration. Preserve raw items, resources, unmasked historical
 * fields and all mercenary state. Removed gear cannot identify a stale cache.
 */
export function repairEquipmentRateCache(save: SaveCurrent): SaveCurrent {
  const equipped = Object.values(save.inventory.equipped).filter(item => item !== null);
  if (!equipped.length) return save;
  const affected = new Set<RateKey>();
  const affixes = new Map(loadAffixPool().map(def => [def.id, def]));
  const pieces = new Map(loadSetPieces().map(piece => [piece.id, piece]));
  const setPieces = new Map<string, Set<string>>();
  for (const item of equipped) {
    for (const roll of item.affixes ?? []) {
      if ('values' in roll || roll.rolledValue === 0) continue;
      const stat = affixes.get(roll.id)?.stat;
      for (const key of RATE_KEYS) if (stat === key) affected.add(key);
    }
    for (const key of CORRECTED_UNIQUES.get(item.uniqueId ?? '') ?? []) affected.add(key);
    if (item.setPieceId) {
      const setId = pieces.get(item.setPieceId)?.setId ?? item.setId;
      if (setId) {
        const worn = setPieces.get(setId) ?? new Set<string>();
        worn.add(item.setPieceId);
        setPieces.set(setId, worn);
      }
    }
  }
  for (const [id, threshold, key] of CORRECTED_SET_BONUSES) {
    if ((setPieces.get(id)?.size ?? 0) >= threshold) affected.add(key);
  }
  if (!affected.size) return save;
  const projected = deriveEquippedPlayerStats(save.player, save.player.level, save.inventory.equipped);
  const changes: Partial<Record<RateKey, number>> = {};
  for (const key of affected) {
    if (!Number.isFinite(projected[key])) throw new Error(`Invalid save: nonfinite equipment ${key}`);
    if (save.player.derivedStats[key] !== projected[key]) changes[key] = projected[key];
  }
  return Object.keys(changes).length ? { ...save, player: { ...save.player,
    derivedStats: { ...save.player.derivedStats, ...changes } } } : save;
}
