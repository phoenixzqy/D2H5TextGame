#!/usr/bin/env node
/**
 * sync-asset-maps.mjs
 *
 * Scans `public/assets/d2/generated/<category>/*.png` and emits
 * `src/ui/generatedAssetMaps.ts`, a typed lookup table consumed by
 * `cardAssets.ts` / `imageHelpers.ts`.
 *
 * Run via `npm run sync-asset-maps`. Idempotent: if the output is
 * unchanged, the file is not rewritten (so this can run safely in CI).
 *
 * Naming conventions (see docs/art/style-presets.json):
 *   class-portraits/classes.<slug>[.v<N>].png      → classes[<slug>]
 *   class-portraits/npcs.act<N>.<slug>[.v<N>].png  → npcs[<slug>]
 *   class-portraits/mercs.act<N>.<slug>[.v<N>].png → mercs[act<N>.<slug>]
 *   monsters/monsters.act<N>.<slug>.png      → monsters[act<N>.<slug>]
 *   monsters/bosses.act<N>.<slug>.png        → monsters[act<N>.<slug>]  (bosses are also monsters)
 *   item-icons/items.unique.<slug>.png       → uniques[<slug>]
 *   item-icons/items.base.<slug>.png         → bases[<slug>]
 *   zone-art/zones.act<N>.<slug>.png         → zones[act<N>.<slug>]
 *   skill-icons/skills.<class>.<slug>.png    → skillIcons[skills.<class>.<slug>]
 *
 * Class portraits and skill icons are gated by the art-director seed registry.
 * Their directories may contain rejected variants, so only rows whose accepted
 * variant is numeric are emitted.
 */
import { readdirSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS_DIR = join(ROOT, 'public', 'assets', 'd2', 'generated');
const OUTPUT = join(ROOT, 'src', 'ui', 'generatedAssetMaps.ts');
const SEED_REGISTRY = join(ROOT, 'docs', 'art', 'seed-registry.md');

function listPngs(subdir) {
  const dir = join(ASSETS_DIR, subdir);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.png'))
    .sort();
}

const URL_PREFIX = '/assets/d2/generated';

function url(category, file) {
  return `${URL_PREFIX}/${category}/${file}`;
}

function getRegistrySection(heading) {
  if (!existsSync(SEED_REGISTRY)) return null;
  const registry = readFileSync(SEED_REGISTRY, 'utf8');
  const start = registry.indexOf(`## ${heading}`);
  if (start === -1) return null;

  const rest = registry.slice(start);
  const headingLength = `## ${heading}`.length;
  const nextHeading = rest.slice(headingLength).search(/\n## /);
  return nextHeading === -1
    ? rest
    : rest.slice(0, headingLength + nextHeading);
}

function registryRows(heading) {
  const section = getRegistrySection(heading);
  if (!section) return [];
  const rows = [];

  for (const line of section.split(/\r?\n/)) {
    const cells = line.split('|').map((cell) => cell.trim());
    if (cells[0] === '') cells.shift();
    if (cells[cells.length - 1] === '') cells.pop();
    if (cells.length < 4 || !/^\d+$/.test(cells[0])) continue;

    const [, id, , acceptedVariant] = cells;
    if (!id || !/^\d+$/.test(acceptedVariant)) continue;
    rows.push({ id, acceptedVariant: Number(acceptedVariant) });
  }

  return rows;
}

function acceptedFilename(id, variant) {
  return `${id}${variant > 0 ? `.v${variant}` : ''}.png`;
}

function buildAcceptedClassPortraits() {
  const files = new Set(listPngs('class-portraits'));
  const classes = {};
  const npcs = {};
  const mercs = {};

  for (const row of registryRows('class-portrait')) {
    if (!row.id.startsWith('classes.') && !row.id.startsWith('npcs.') && !row.id.startsWith('mercs.')) {
      continue;
    }

    const filename = acceptedFilename(row.id, row.acceptedVariant);
    if (!files.has(filename)) continue;

    const [, ...rest] = row.id.split('.');
    if (row.id.startsWith('classes.') && rest.length >= 1) {
      classes[rest.join('.')] = url('class-portraits', filename);
    } else if (row.id.startsWith('npcs.') && rest.length >= 2) {
      npcs[rest[rest.length - 1]] = url('class-portraits', filename);
    } else if (row.id.startsWith('mercs.') && rest.length >= 2) {
      const [actSlug, ...slugParts] = rest;
      mercs[`${actSlug}.${slugParts.join('-')}`] = url('class-portraits', filename);
    }
  }

  return { classes, npcs, mercs };
}

function buildAcceptedSkillIcons() {
  const files = new Set(listPngs('skill-icons'));
  if (files.size === 0) return {};

  const skillIcons = {};

  for (const row of registryRows('skill-icon')) {
    if (!row.id.startsWith('skills.')) continue;
    const filename = acceptedFilename(row.id, row.acceptedVariant);
    if (files.has(filename)) {
      skillIcons[row.id] = url('skill-icons', filename);
    }
  }

  return skillIcons;
}

function buildMaps() {
  const { classes, npcs, mercs } = buildAcceptedClassPortraits();
  const monsters = {};
  const uniques = {};
  const bases = {};
  const zones = {};
  const skillIcons = buildAcceptedSkillIcons();

  for (const f of listPngs('monsters')) {
    // monsters.act<N>.<slug>.png  |  bosses.act<N>.<slug>.png
    const [prefix, actSlug, ...rest] = f.replace(/\.png$/, '').split('.');
    if ((prefix === 'monsters' || prefix === 'bosses') && actSlug && rest.length >= 1) {
      const slug = rest.join('-'); // multi-segment ids stay joined
      const key = `${actSlug}.${slug}`;
      // Prefer "bosses.*" art over "monsters.*" when both exist for the
      // same key — the boss painting is intentionally more elaborate.
      const existing = monsters[key];
      if (existing && existing.includes('/bosses.') && prefix === 'monsters') continue;
      monsters[key] = url('monsters', f);
    }
  }

  for (const f of listPngs('item-icons')) {
    // items.<rarity>.<slug>.png
    const [prefix, kind, ...rest] = f.replace(/\.png$/, '').split('.');
    if (prefix !== 'items' || rest.length === 0) continue;
    const slug = rest.join('.');
    if (kind === 'unique') uniques[slug] = url('item-icons', f);
    else if (kind === 'base') bases[slug] = url('item-icons', f);
  }

  for (const f of listPngs('zone-art')) {
    // zones.act<N>.<slug>.png
    const [prefix, actSlug, ...rest] = f.replace(/\.png$/, '').split('.');
    if (prefix === 'zones' && actSlug && rest.length >= 1) {
      zones[`${actSlug}.${rest.join('-')}`] = url('zone-art', f);
    }
  }

  return { classes, npcs, mercs, monsters, uniques, bases, zones, skillIcons };
}

function emit({ classes, npcs, mercs, monsters, uniques, bases, zones, skillIcons }) {
  const ent = (m) =>
    Object.keys(m)
      .sort()
      .map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(m[k])}`)
      .join(',\n');

  return `/* eslint-disable */
// AUTO-GENERATED by scripts/sync-asset-maps.mjs. DO NOT EDIT BY HAND.
// Run \`npm run sync-asset-maps\` to refresh after generating new art.

/** Class portraits — keyed by class id (lowercase, e.g. "barbarian"). */
export const CLASS_PORTRAITS: Readonly<Record<string, string>> = {
${ent(classes)}
};

/** NPC portraits — keyed by NPC id (last dotted segment of filename). */
export const NPC_PORTRAITS: Readonly<Record<string, string>> = {
${ent(npcs)}
};

/** Merc portraits — keyed by "act<N>.<slug>" from mercs.act<N>.<slug>.png. */
export const MERC_PORTRAITS: Readonly<Record<string, string>> = {
${ent(mercs)}
};

/** Monster art — keyed by "act<N>.<slug>" (matches data/monsters ids minus prefix). */
export const MONSTER_ART: Readonly<Record<string, string>> = {
${ent(monsters)}
};

/** Unique item icons — keyed by unique slug ("items/unique/<slug>" with prefix stripped). */
export const UNIQUE_ITEM_ICONS: Readonly<Record<string, string>> = {
${ent(uniques)}
};

/** Base item icons — keyed by base archetype ("sword", "bow", "helm", ...). */
export const BASE_ITEM_ICONS: Readonly<Record<string, string>> = {
${ent(bases)}
};

/** Zone art — keyed by "act<N>.<slug>". */
export const ZONE_ART: Readonly<Record<string, string>> = {
${ent(zones)}
};

/** Skill icons — keyed by "skills.<class>.<slug>" from accepted art-director variants. */
export const SKILL_ICONS: Readonly<Record<string, string>> = {
${ent(skillIcons)}
};
`;
}

function main() {
  if (!existsSync(ASSETS_DIR)) {
    console.error(`assets dir not found: ${ASSETS_DIR}`);
    process.exit(1);
  }
  const maps = buildMaps();
  const output = emit(maps);
  mkdirSync(dirname(OUTPUT), { recursive: true });
  const prev = existsSync(OUTPUT) ? readFileSync(OUTPUT, 'utf8') : '';
  if (prev === output) {
    console.log(`[sync-asset-maps] no change (${OUTPUT})`);
    return;
  }
  writeFileSync(OUTPUT, output, 'utf8');
  const counts = Object.fromEntries(
    Object.entries(maps).map(([k, v]) => [k, Object.keys(v).length])
  );
  console.log(`[sync-asset-maps] wrote ${OUTPUT}`);
  console.log(`[sync-asset-maps] counts: ${JSON.stringify(counts)}`);
}

main();
