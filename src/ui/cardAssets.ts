/**
 * cardAssets — resolver helpers from gameplay IDs to public asset URLs.
 *
 * Source of truth: docs/art/asset-mapping.json. Inlined here as a typed
 * const for tree-shaking + type safety. Keep in sync if the JSON is
 * updated (asset-mapping is append-only).
 *
 * Convention (see docs/art/asset-mapping.json `_comment`):
 *   gameplay IDs are `<category-prefix>/<key>`; the resolver strips the
 *   prefix before lookup. Returns:
 *     - string  → public URL
 *     - null    → intentionally absent → silhouette
 *     - missing → silhouette + dev-only console.warn
 */

/** Prefix-rule table for mercenary archetype proxying. First match wins. */
const MERC_ARCHETYPE_RULES: readonly (readonly [prefix: string, archetype: string | null])[] = [
  ['act1-rogue-', 'rogue-archer'],
  ['act3-iron-wolf-', 'iron-wolf'],
  ['act3-militia-', 'desert-mercenary'],
  ['act5-barbarian-', 'barbarian-warrior'],
  ['act2-', 'desert-mercenary'],
  ['act4-paladin-', null],
  ['tavern-thief-', null],
  ['tavern-acolyte-', null]
];

const CLASSES: Readonly<Record<string, string>> = {
  amazon: '/assets/d2/generated/class-portraits/classes.amazon.png',
  assassin: '/assets/d2/generated/class-portraits/classes.assassin.png',
  barbarian: '/assets/d2/generated/class-portraits/classes.barbarian.png',
  druid: '/assets/d2/generated/class-portraits/classes.druid.png',
  necromancer: '/assets/d2/generated/class-portraits/classes.necromancer.png',
  paladin: '/assets/d2/generated/class-portraits/classes.paladin.png',
  sorceress: '/assets/d2/generated/class-portraits/classes.sorceress.png'
};

const MONSTERS: Readonly<Record<string, string>> = {
  'act1.fallen': '/assets/d2/generated/monsters/monsters.act1.fallen.png',
  'act1.fallen-shaman': '/assets/d2/generated/monsters/monsters.act1.fallen-shaman.png',
  'act1.zombie': '/assets/d2/generated/monsters/monsters.act1.zombie.png',
  'act1.quill-rat': '/assets/d2/generated/monsters/monsters.act1.quill-rat.png',
  'act1.bone-warrior': '/assets/d2/generated/monsters/monsters.act1.bone-warrior.png',
  'act1.dark-stalker': '/assets/d2/generated/monsters/monsters.act1.dark-stalker.png',
  'act1.andariel': '/assets/d2/generated/monsters/bosses.act1.andariel.png',
  'act1.blood-raven': '/assets/d2/generated/monsters/bosses.act1.blood-raven.png'
};

const ITEMS: Readonly<Record<string, string>> = {
  'unique.shako': '/assets/d2/generated/item-icons/items.unique.shako.png',
  'unique.andariels-visage': '/assets/d2/generated/item-icons/items.unique.andariels-visage.png',
  'unique.arreats-face': '/assets/d2/generated/item-icons/items.unique.arreats-face.png',
  'unique.buriza-do-kyanon': '/assets/d2/generated/item-icons/items.unique.buriza-do-kyanon.png',
  'unique.deaths-touch': '/assets/d2/generated/item-icons/items.unique.deaths-touch.png',
  'unique.grandfather': '/assets/d2/generated/item-icons/items.unique.grandfather.png',
  'unique.herald-of-zakarum': '/assets/d2/generated/item-icons/items.unique.herald-of-zakarum.png',
  'unique.lightsabre': '/assets/d2/generated/item-icons/items.unique.lightsabre.png',
  'unique.stone-of-jordan': '/assets/d2/generated/item-icons/items.unique.stone-of-jordan.png',
  'unique.tal-rasha-helm': '/assets/d2/generated/item-icons/items.unique.tal-rasha-helm.png',
  'unique.windforce': '/assets/d2/generated/item-icons/items.unique.windforce.png',
  'unique.wizardspike': '/assets/d2/generated/item-icons/items.unique.wizardspike.png'
};

const ZONES: Readonly<Record<string, string>> = {
  'act1.rogue-encampment': '/assets/d2/generated/zone-art/zones.act1.rogue-encampment.png',
  'act2.lut-gholein': '/assets/d2/generated/zone-art/zones.act2.lut-gholein.png',
  'act3.kurast-docks': '/assets/d2/generated/zone-art/zones.act3.kurast-docks.png',
  'act4.pandemonium-fortress': '/assets/d2/generated/zone-art/zones.act4.pandemonium-fortress.png',
  'act5.harrogath': '/assets/d2/generated/zone-art/zones.act5.harrogath.png'
};

const MERC_ARCHETYPES: Readonly<Record<string, string>> = {
  'rogue-archer': '/assets/d2/generated/class-portraits/classes.amazon.png',
  'desert-mercenary': '/assets/d2/generated/class-portraits/classes.barbarian.png',
  'iron-wolf': '/assets/d2/generated/class-portraits/classes.sorceress.png',
  'barbarian-warrior': '/assets/d2/generated/class-portraits/classes.barbarian.png'
};

/** Strip a `<category>/` prefix if present. */
function stripPrefix(id: string): string {
  const slash = id.indexOf('/');
  return slash === -1 ? id : id.slice(slash + 1);
}

/** dev-only warn helper (no-op in production). Vite-native env check. */
function warnMissing(category: string, key: string): void {
  // import.meta.env.DEV is statically replaced by Vite in production builds.
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(`[cardAssets] missing ${category} key: ${key}`);
  }
}

export function resolveClassPortrait(classId: string): string | null {
  const key = stripPrefix(classId);
  if (key in CLASSES) return CLASSES[key] ?? null;
  warnMissing('class', key);
  return null;
}

export function resolveMonsterArt(monsterId: string): string | null {
  const key = stripPrefix(monsterId);
  if (key in MONSTERS) return MONSTERS[key] ?? null;
  warnMissing('monster', key);
  return null;
}

export function resolveItemIcon(baseId: string): string | null {
  const key = stripPrefix(baseId);
  if (key in ITEMS) return ITEMS[key] ?? null;
  // many bases legitimately have no art — silent silhouette
  return null;
}

export function resolveZoneArt(zoneId: string): string | null {
  const key = stripPrefix(zoneId);
  if (key in ZONES) return ZONES[key] ?? null;
  warnMissing('zone', key);
  return null;
}

/**
 * Resolve a mercenary's portrait. Today no merc has dedicated art; we
 * proxy via class portraits using the prefix-rule table. Falls back to
 * the closest class portrait based on prefix; null if no rule matches.
 */
export function resolveMercArt(mercId: string): string | null {
  const key = stripPrefix(mercId);
  // 1) exact match against canonical archetype keys
  if (key in MERC_ARCHETYPES) return MERC_ARCHETYPES[key] ?? null;
  // 2) prefix-rule walk
  for (const [prefix, archetype] of MERC_ARCHETYPE_RULES) {
    if (key.startsWith(prefix)) {
      if (archetype === null) return null;
      return MERC_ARCHETYPES[archetype] ?? null;
    }
  }
  // 3) classRef-style fallback (e.g. `barbarian` → class portrait)
  const classBase = key.split(/[#-]/)[0] ?? key;
  if (classBase in CLASSES) return CLASSES[classBase] ?? null;
  return null;
}
