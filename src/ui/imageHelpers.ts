/**
 * Image path helpers for D2-generated assets.
 *
 * All paths resolve to `/assets/d2/generated/<category>/<filename>.png`.
 * The helpers normalise IDs (kebab-case, lower-case) so callers don't
 * need to worry about the exact file naming convention.
 *
 * Asset existence is read from the auto-generated `generatedAssetMaps.ts`
 * so we never produce dead URLs.
 */

const BASE = '/assets/d2/generated';

import { loadMercPool } from '@/data/loaders/mercs';
import { resolveMercArt, resolveSkillIcon } from './cardAssets';
import {
  CLASS_PORTRAITS,
  MONSTER_ART,
  BASE_ITEM_ICONS,
  UNIQUE_ITEM_ICONS,
  SKILL_ICONS
} from './generatedAssetMaps';

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */
function toKebab(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_/]+/g, '-')
    .toLowerCase();
}

/* ------------------------------------------------------------------ */
/*  Class portraits                                                    */
/* ------------------------------------------------------------------ */
export function getClassPortraitUrl(className: string): string {
  const slug = className.toLowerCase();
  return CLASS_PORTRAITS[slug] ?? `${BASE}/class-portraits/classes.${slug}.png`;
}

/* ------------------------------------------------------------------ */
/*  Monsters / Bosses                                                  */
/* ------------------------------------------------------------------ */
/**
 * Best-effort mapping from a combat-unit ID / name to an image URL.
 *
 * `extractMonsterSlug` typically strips the act prefix (e.g. `fallen`,
 * `quill-rat`, `andariel`). We scan the auto-generated MONSTER_ART map
 * for any `act<N>.<slug>` key and return the first match — so all 90+
 * ready-made monster portraits land automatically.
 */
export function getMonsterImageUrl(monsterId: string): string {
  const slug = toKebab(monsterId);

  if (slug.includes('.') && slug in MONSTER_ART) {
    return MONSTER_ART[slug] ?? `${BASE}/monsters/monsters.act1.${slug}.png`;
  }

  for (const key of Object.keys(MONSTER_ART)) {
    const dot = key.indexOf('.');
    if (dot >= 0 && key.slice(dot + 1) === slug) {
      return MONSTER_ART[key] ?? `${BASE}/monsters/monsters.act1.${slug}.png`;
    }
  }

  return `${BASE}/monsters/monsters.act1.${slug}.png`;
}

/* ------------------------------------------------------------------ */
/*  Summons (player-side pets / skeletons / golems)                    */
/* ------------------------------------------------------------------ */
export function getSummonImageUrl(summonId: string): string {
  const slug = toKebab(summonId);
  if (slug === 'skeleton' || slug.includes('skeleton')) {
    return `${BASE}/monsters/monsters.act1.skeleton-warrior-summon.png`;
  }
  return getMonsterImageUrl(slug);
}

/* ------------------------------------------------------------------ */
/*  Mercenary portraits                                                */
/* ------------------------------------------------------------------ */
/**
 * Resolve a mercenary portrait URL from a merc def id (e.g.
 * `mercs/act2-holy-freeze`).
 *
 * Mercenary-specific portraits have not been generated yet, so we proxy
 * through `resolveMercArt` (archetype → class-portrait fallback). This
 * keeps every merc visually distinct from the player's own class — the
 * original goal of Bug #1 — while still rendering an actual image
 * instead of the silhouette placeholder users were seeing for the
 * Barbarian merc.
 */
export function getMercPortraitUrl(mercId: string): string | null {
  if (!mercId) return null;
  const pool = loadMercPool().pool;
  const def = pool.find((m) => m.id === mercId);

  const localId = mercId.startsWith('mercs/') ? mercId.slice('mercs/'.length) : mercId;
  const fromArchetype = resolveMercArt(localId);
  if (fromArchetype) return fromArchetype;

  if (def?.classRef) {
    const cls = def.classRef.toLowerCase();
    if (cls in CLASS_PORTRAITS) return CLASS_PORTRAITS[cls] ?? null;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Item icons                                                         */
/* ------------------------------------------------------------------ */
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
  offhand: 'shield'
};

function inferBaseFromId(baseId: string): string | null {
  const slug = toKebab(baseId);
  if (slug in BASE_ITEM_ICONS) return slug;
  let best: string | null = null;
  for (const candidate of Object.keys(BASE_ITEM_ICONS)) {
    if (slug.includes(candidate) && (!best || candidate.length > best.length)) {
      best = candidate;
    }
  }
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

export function getBaseItemIconUrl(itemType: string): string | null {
  if (!itemType) return null;
  const slug = toKebab(itemType);
  const resolved = slug in BASE_ITEM_ICONS ? slug : SLOT_TO_BASE[slug];
  if (!resolved || !(resolved in BASE_ITEM_ICONS)) return null;
  return BASE_ITEM_ICONS[resolved] ?? null;
}

export function getItemIconUrl(item: {
  baseId: string;
  rarity: string;
  equipSlot?: string;
  itemType?: string;
}): string | null {
  if (item.rarity === 'unique') {
    const slug = toKebab(item.baseId);
    if (slug in UNIQUE_ITEM_ICONS) return UNIQUE_ITEM_ICONS[slug] ?? null;
  }
  const hint = (item.itemType ?? item.equipSlot ?? '').toString();
  const fromHint = getBaseItemIconUrl(hint);
  if (fromHint) return fromHint;
  const inferred = inferBaseFromId(item.baseId);
  if (inferred && inferred in BASE_ITEM_ICONS) return BASE_ITEM_ICONS[inferred] ?? null;
  return null;
}

/* ------------------------------------------------------------------ */
/*  Skill icons                                                        */
/* ------------------------------------------------------------------ */
export function getSkillIconUrl(skillRef: string): string | null {
  if (!skillRef) return null;
  const fromResolver = resolveSkillIcon(skillRef);
  if (fromResolver) return fromResolver;
  return skillRef in SKILL_ICONS ? SKILL_ICONS[skillRef] ?? null : null;
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
  5: 'harrogath'
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
