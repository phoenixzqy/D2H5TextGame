/**
 * Image path helpers for D2-generated assets.
 *
 * All paths resolve to `/assets/d2/generated/<category>/<filename>.png`.
 * The helpers normalise IDs (kebab-case, lower-case) so callers don't
 * need to worry about the exact file naming convention.
 */

const BASE = '/assets/d2/generated';

import { loadMercPool } from '@/data/loaders/mercs';

/* ------------------------------------------------------------------ */
/*  Class portraits                                                    */
/* ------------------------------------------------------------------ */
export function getClassPortraitUrl(className: string): string {
  return `${BASE}/class-portraits/classes.${className.toLowerCase()}.png`;
}

/* ------------------------------------------------------------------ */
/*  Monsters / Bosses                                                  */
/* ------------------------------------------------------------------ */
const MONSTER_ACT: Record<string, number> = {
  // act1
  'fallen': 1,
  'fallen-shaman': 1,
  'zombie': 1,
  'bone-warrior': 1,
  'dark-stalker': 1,
  'quill-rat': 1,
  'andariel': 1,
  'blood-raven': 1,
  // act2
  'sand-raider': 2,
  'mummy': 2,
  'beetle': 2,
  'duriel': 2,
  // act3
  'flayer': 3,
  'zakarum-zealot': 3,
  'thorned-hulk': 3,
  'mephisto': 3,
  // act4
  'doom-knight': 4,
  'venom-lord': 4,
  'diablo': 4,
  // act5
  'death-mauler': 5,
  'frenzytaur': 5,
  'baal': 5,
};

const KNOWN_BOSSES = new Set([
  'andariel',
  'blood-raven',
  'duriel',
  'mephisto',
  'diablo',
  'baal',
]);

/** Best-effort mapping from a combat-unit ID / name to an image URL. */
export function getMonsterImageUrl(monsterId: string): string {
  const slug = toKebab(monsterId);
  const act = MONSTER_ACT[slug] ?? 1;
  const prefix = KNOWN_BOSSES.has(slug) ? 'bosses' : 'monsters';
  return `${BASE}/monsters/${prefix}.act${String(act)}.${slug}.png`;
}

/* ------------------------------------------------------------------ */
/*  Summons (player-side pets / skeletons / golems)                    */
/* ------------------------------------------------------------------ */
/**
 * Map a summon ID (or summon unit name) to a portrait URL.
 *
 * Currently only the Necromancer's skeleton warrior has a dedicated asset;
 * unknown summon IDs fall back to the monster image lookup so we still
 * render *something* coherent (e.g. a skeleton-warrior monster portrait).
 *
 * TODO(art-director): replace placeholder once the dedicated summon
 * portraits land at `/assets/d2/generated/summons/summons.<slug>.png`.
 */
export function getSummonImageUrl(summonId: string): string {
  const slug = toKebab(summonId);
  if (slug === 'skeleton' || slug.includes('skeleton')) {
    // Placeholder: reuse the monster slot until art-director ships
    // dedicated summon portraits.
    return `${BASE}/monsters/monsters.act1.skeleton-warrior-summon.png`;
  }
  // Generic fallback — try monster-image lookup (kebab slug).
  return getMonsterImageUrl(slug);
}

/* ------------------------------------------------------------------ */
/*  Mercenary portraits                                                */
/* ------------------------------------------------------------------ */
/**
 * Resolve a mercenary portrait URL from a merc def id (e.g.
 * `mercs/act2-holy-freeze`). Looks up `portraitAsset` on the loaded
 * gacha pool. Returns `null` when the merc id (or its asset) is
 * missing, so callers can render a silhouette fallback exactly like
 * monster cards.
 *
 * Bug #1 (combat-screen) — previously every player-side non-summon
 * unit (including the fielded merc) reused the hero's class portrait,
 * making it impossible to tell merc and player apart.
 */
export function getMercPortraitUrl(mercId: string): string | null {
  if (!mercId) return null;
  const pool = loadMercPool().pool;
  const def = pool.find((m) => m.id === mercId);
  const asset = def?.portraitAsset;
  if (!asset) return null;
  // Asset paths in JSON are stored without a leading slash.
  return asset.startsWith('/') ? asset : `/${asset}`;
}

/* ------------------------------------------------------------------ */
/*  Item icons                                                         */
/* ------------------------------------------------------------------ */
const KNOWN_BASE_ICONS = new Set([
  'sword', 'axe', 'mace', 'bow', 'staff', 'dagger',
  'shield', 'helm', 'armor', 'gloves', 'belt', 'boots',
  'ring', 'amulet',
  'potion-health', 'potion-mana',
  'rune', 'gem', 'scroll',
]);

/** Equipment-slot → base icon type. */
const SLOT_TO_BASE: Record<string, string> = {
  head: 'helm',
  chest: 'armor',
  gloves: 'gloves',
  belt: 'belt',
  boots: 'boots',
  amulet: 'amulet',
  'ring-left': 'ring',
  'ring-right': 'ring',
  weapon: 'sword',
  offhand: 'shield',
};

/** Try to infer a base-icon slug from an arbitrary baseId (e.g. `short-sword` → `sword`). */
function inferBaseFromId(baseId: string): string | null {
  const slug = toKebab(baseId);
  // Exact match
  if (KNOWN_BASE_ICONS.has(slug)) return slug;
  // Substring scan (longest match wins)
  let best: string | null = null;
  for (const candidate of KNOWN_BASE_ICONS) {
    if (slug.includes(candidate) && (!best || candidate.length > best.length)) {
      best = candidate;
    }
  }
  // Special cases for potion naming variants
  if (!best) {
    if (slug.includes('potion')) {
      if (slug.includes('health') || slug.includes('life') || slug.includes('red')) {
        best = 'potion-health';
      } else if (slug.includes('mana') || slug.includes('blue')) {
        best = 'potion-mana';
      }
    }
  }
  return best;
}

/** Maps generic equipment type → base icon URL. Returns null for unknown types. */
export function getBaseItemIconUrl(itemType: string): string | null {
  if (!itemType) return null;
  const slug = toKebab(itemType);
  const resolved = KNOWN_BASE_ICONS.has(slug) ? slug : SLOT_TO_BASE[slug];
  if (!resolved) return null;
  return `${BASE}/item-icons/items.base.${resolved}.png`;
}

/**
 * Returns an icon URL for an item. Tries a unique-item icon first
 * (if rarity is `unique`) and otherwise falls back to a generic
 * base-type icon based on `itemType` / `equipSlot` / inferred from `baseId`.
 *
 * Returns `null` when nothing can be resolved (caller should show a fallback).
 */
export function getItemIconUrl(item: {
  baseId: string;
  rarity: string;
  equipSlot?: string;
  itemType?: string;
}): string | null {
  if (item.rarity === 'unique') {
    const slug = toKebab(item.baseId);
    return `${BASE}/item-icons/items.unique.${slug}.png`;
    // Missing uniques → onError fallback in <GameImage>.
  }
  // Try explicit hints first.
  const hint = (item.itemType ?? item.equipSlot ?? '').toString();
  const fromHint = getBaseItemIconUrl(hint);
  if (fromHint) return fromHint;
  // Fall back to inferring from baseId (handles potions/runes/gems/scrolls etc).
  const inferred = inferBaseFromId(item.baseId);
  if (inferred) return `${BASE}/item-icons/items.base.${inferred}.png`;
  return null;
}

/* ------------------------------------------------------------------ */
/*  NPC portraits                                                      */
/* ------------------------------------------------------------------ */
export function getNpcPortraitUrl(npcId: string, act = 1): string {
  return `${BASE}/class-portraits/npcs.act${String(act)}.${toKebab(npcId)}.png`;
}

/* ------------------------------------------------------------------ */
/*  Zone art (town backdrops per act)                                  */
/* ------------------------------------------------------------------ */
const ZONE_MAP: Record<number, string> = {
  1: 'rogue-encampment',
  2: 'lut-gholein',
  3: 'kurast-docks',
  4: 'pandemonium-fortress',
  5: 'harrogath',
};

export function getZoneArtUrl(act: number): string {
  const slug = ZONE_MAP[act] ?? ZONE_MAP[1] ?? 'rogue-encampment';
  return `${BASE}/zone-art/zones.act${String(act)}.${slug}.png`;
}

/* ------------------------------------------------------------------ */
/*  Rarity → Tailwind color class (for icon fallback circles)          */
/* ------------------------------------------------------------------ */
export function rarityBgClass(rarity: string): string {
  switch (rarity) {
    case 'magic':
      return 'bg-blue-600';
    case 'rare':
      return 'bg-yellow-600';
    case 'unique':
      return 'bg-amber-500';
    case 'set':
      return 'bg-green-600';
    case 'runeword':
      return 'bg-orange-500';
    case 'normal':
    default:
      return 'bg-d2-border';
  }
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */
function toKebab(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_/]+/g, '-')
    .toLowerCase();
}
