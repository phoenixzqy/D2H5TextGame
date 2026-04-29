#!/usr/bin/env node
/**
 * repair-manifest.mjs — Fill in missing manifest entries for existing PNG files.
 *
 * For images that exist on disk but lack a manifest entry (due to race conditions
 * during parallel generation), this script reconstructs the entry from:
 *  - the seed-registry.md (for subjectId)
 *  - the style-presets.json (for seedBase, model, size, prompts)
 *  - the existing PNG file (for bytes, sha256)
 *
 * Run: node scripts/repair-manifest.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const MANIFEST_PATH   = join(ROOT, 'public/assets/d2/generated/manifest.json');
const REGISTRY_PATH   = join(ROOT, 'docs/art/seed-registry.md');
const PRESETS_PATH    = join(ROOT, 'docs/art/style-presets.json');
const ITEM_ICONS_DIR  = join(ROOT, 'public/assets/d2/generated/item-icons');
const MONSTERS_DIR    = join(ROOT, 'public/assets/d2/generated/monsters');
const UNIQUES_JSON    = join(ROOT, 'src/data/items/uniques.json');
const ACT1_JSON       = join(ROOT, 'src/data/monsters/act1.json');
const ACT2_JSON       = join(ROOT, 'src/data/monsters/act2.json');

const DRY_RUN = process.argv.includes('--dry-run');

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function loadJSON(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

// Parse seed registry to get subjectId map
function parseRegistry() {
  const alloc = { 'item-icon': new Map(), 'monster': new Map() };
  let currentCategory = null;
  const text = readFileSync(REGISTRY_PATH, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.replace(/^#+\s*/, '').toLowerCase();
    if (trimmed.startsWith('item-icon'))    currentCategory = 'item-icon';
    else if (trimmed.startsWith('monster')) currentCategory = 'monster';
    // parse table row
    const m = line.match(/^\|\s*(\d+)\s*\|\s*([^\s|]+)\s*\|/);
    if (m && currentCategory) {
      alloc[currentCategory].set(m[2], parseInt(m[1], 10));
    }
  }
  return alloc;
}

// Build subject lookup from uniques + monsters
function buildSubjectMap() {
  const map = new Map(); // canonId → { subject, descriptors }
  
  // Base type info for items
  const BASE_TYPE_INFO = {
    'cap': { noun: 'cap helmet', glow: 'faint magical glow' },
    'skull-cap': { noun: 'skull cap', glow: 'dark aura' },
    'helm': { noun: 'helmet', glow: 'gleaming helmet' },
    'full-helm': { noun: 'full helm', glow: 'bright metallic gleam' },
    'great-helm': { noun: 'great helm', glow: 'massive ornate helm' },
    'crown': { noun: 'crown', glow: 'royal golden glow' },
    'mask': { noun: 'mask', glow: 'eerie glow' },
    'bone-helm': { noun: 'bone helm', glow: 'spectral aura' },
    'war-hat': { noun: 'war hat', glow: 'battle-worn glow' },
    'sallet': { noun: 'sallet helm', glow: 'ancient glow' },
    'casque': { noun: 'casque helm', glow: 'polished gleam' },
    'basinet': { noun: 'basinet helm', glow: 'magical shimmer' },
    'winged-helm': { noun: 'winged helm', glow: 'feathered gleam' },
    'grand-crown': { noun: 'grand crown', glow: 'royal radiance' },
    'death-mask': { noun: 'death mask', glow: 'deathly aura' },
    'quilted-armor': { noun: 'quilted armor', glow: 'faint aura' },
    'leather-armor': { noun: 'leather armor', glow: 'dark leather sheen' },
    'hard-leather-armor': { noun: 'hard leather armor', glow: 'rugged sheen' },
    'studded-leather': { noun: 'studded leather', glow: 'metallic studs gleam' },
    'ring-mail': { noun: 'ring mail', glow: 'interlocked rings gleam' },
    'scale-mail': { noun: 'scale mail', glow: 'scale plate gleam' },
    'chain-mail': { noun: 'chain mail', glow: 'chain link shimmer' },
    'breast-plate': { noun: 'breast plate', glow: 'polished chest plate gleam' },
    'splint-mail': { noun: 'splint mail', glow: 'banded metal gleam' },
    'plate-mail': { noun: 'plate mail', glow: 'heavy plate gleam' },
    'field-plate': { noun: 'field plate', glow: 'battle-worn gleam' },
    'gothic-plate': { noun: 'gothic plate', glow: 'ornate gothic gleam' },
    'full-plate-mail': { noun: 'full plate mail', glow: 'blinding plate gleam' },
    'ancient-armor': { noun: 'ancient armor', glow: 'ancient runic glow' },
    'light-plate': { noun: 'light plate', glow: 'nimble plate gleam' },
    'dusk-shroud': { noun: 'dusk shroud', glow: 'shadowy aura' },
    'wyrmhide': { noun: 'wyrmhide armor', glow: 'scaled dragon gleam' },
    'scarab-husk': { noun: 'scarab husk armor', glow: 'chitinous gleam' },
    'wire-fleece': { noun: 'wire fleece armor', glow: 'woven metal gleam' },
    'diamond-mail': { noun: 'diamond mail', glow: 'crystalline gleam' },
    'loricated-mail': { noun: 'loricated mail', glow: 'overlapping plate gleam' },
    'boneweave': { noun: 'boneweave armor', glow: 'osseous aura' },
    'great-hauberk': { noun: 'great hauberk', glow: 'grand mail gleam' },
    'balrog-skin': { noun: 'balrog skin armor', glow: 'demonic red gleam' },
    'hellforge-plate': { noun: 'hellforge plate', glow: 'fiery infernal gleam' },
    'kraken-shell': { noun: 'kraken shell armor', glow: 'deep ocean gleam' },
    'lacquered-plate': { noun: 'lacquered plate', glow: 'lacquered black gleam' },
    'shadow-plate': { noun: 'shadow plate', glow: 'shadow aura' },
    'sacred-armor': { noun: 'sacred armor', glow: 'holy divine radiance' },
    'archon-plate': { noun: 'archon plate', glow: 'ethereal angelic gleam' },
    'buckler': { noun: 'buckler shield', glow: 'faint magical shimmer' },
    'small-shield': { noun: 'small shield', glow: 'protective glow' },
    'large-shield': { noun: 'large shield', glow: 'solid shield gleam' },
    'kite-shield': { noun: 'kite shield', glow: 'kite shaped gleam' },
    'tower-shield': { noun: 'tower shield', glow: 'imposing tower gleam' },
    'gothic-shield': { noun: 'gothic shield', glow: 'ornate gothic gleam' },
    'bone-shield': { noun: 'bone shield', glow: 'osseous aura' },
    'spiked-shield': { noun: 'spiked shield', glow: 'spike gleam' },
    'blade-barrier': { noun: 'blade barrier', glow: 'spinning blade gleam' },
    'aerin-shield': { noun: 'aerin shield', glow: 'light angelic gleam' },
    'luna': { noun: 'luna shield', glow: 'moonlight gleam' },
    'hyperion': { noun: 'hyperion shield', glow: 'titan gleam' },
    'vortex-shield': { noun: 'vortex shield', glow: 'swirling vortex gleam' },
    'monarch': { noun: 'monarch shield', glow: 'regal gleam' },
    'aegis': { noun: 'aegis shield', glow: 'mythic divine gleam' },
    'ward': { noun: 'ward shield', glow: 'protective ward gleam' },
    'troll-nest': { noun: 'troll nest shield', glow: 'gnarled wooden gleam' },
    'bverrit-keep': { noun: 'bverrit keep tower shield', glow: 'dwarven rune gleam' },
    'cut-throat': { noun: 'cut throat shield', glow: 'razor edge gleam' },
    'hand-axe': { noun: 'hand axe', glow: 'iron gleam' },
    'axe': { noun: 'axe', glow: 'sharp metal gleam' },
    'double-axe': { noun: 'double axe', glow: 'twin blade gleam' },
    'military-pick': { noun: 'military pick', glow: 'war pick gleam' },
    'war-axe': { noun: 'war axe', glow: 'battle axe gleam' },
    'large-axe': { noun: 'large axe', glow: 'heavy axe gleam' },
    'broad-axe': { noun: 'broad axe', glow: 'broad blade gleam' },
    'battle-axe': { noun: 'battle axe', glow: 'battle gleam' },
    'great-axe': { noun: 'great axe', glow: 'enormous axe gleam' },
    'giant-axe': { noun: 'giant axe', glow: 'titan axe gleam' },
    'wand': { noun: 'wand', glow: 'arcane energy glow' },
    'yew-wand': { noun: 'yew wand', glow: 'nature magic glow' },
    'bone-wand': { noun: 'bone wand', glow: 'bone magic aura' },
    'grim-wand': { noun: 'grim wand', glow: 'grim arcane aura' },
    'club': { noun: 'club', glow: 'crude solid gleam' },
    'spiked-club': { noun: 'spiked club', glow: 'spiked iron gleam' },
    'mace': { noun: 'mace', glow: 'flanged mace gleam' },
    'morning-star': { noun: 'morning star', glow: 'spiked ball gleam' },
    'flail': { noun: 'flail', glow: 'chained ball gleam' },
    'war-hammer': { noun: 'war hammer', glow: 'massive hammer gleam' },
    'maul': { noun: 'maul', glow: 'blunt force gleam' },
    'great-maul': { noun: 'great maul', glow: 'enormous maul gleam' },
    'short-sword': { noun: 'short sword', glow: 'nimble blade gleam' },
    'scimitar': { noun: 'scimitar', glow: 'curved blade gleam' },
    'sabre': { noun: 'sabre', glow: 'cavalry blade gleam' },
    'falchion': { noun: 'falchion', glow: 'broad curved gleam' },
    'crystal-sword': { noun: 'crystal sword', glow: 'crystalline blade gleam' },
    'broad-sword': { noun: 'broad sword', glow: 'broad steel gleam' },
    'long-sword': { noun: 'long sword', glow: 'long blade gleam' },
    'war-sword': { noun: 'war sword', glow: 'war-forged gleam' },
    'two-handed-sword': { noun: 'two-handed sword', glow: 'immense blade gleam' },
    'claymore': { noun: 'claymore', glow: 'highland blade gleam' },
    'giant-sword': { noun: 'giant sword', glow: 'massive blade gleam' },
    'bastard-sword': { noun: 'bastard sword', glow: 'hand-and-half blade gleam' },
    'flamberge': { noun: 'flamberge', glow: 'flame-bladed gleam' },
    'great-sword': { noun: 'great sword', glow: 'enormous great sword gleam' },
    'dagger': { noun: 'dagger', glow: 'sharp blade gleam' },
    'dirk': { noun: 'dirk', glow: 'highland blade gleam' },
    'kriss': { noun: 'kriss dagger', glow: 'wavy blade gleam' },
    'blade': { noun: 'blade', glow: 'arcane blade gleam' },
    'throwing-knife': { noun: 'throwing knife', glow: 'spinning blade gleam' },
    'balanced-knife': { noun: 'balanced knife', glow: 'precise balance gleam' },
    'throwing-axe': { noun: 'throwing axe', glow: 'spinning axe gleam' },
    'balanced-axe': { noun: 'balanced axe', glow: 'twin head gleam' },
    'javelin': { noun: 'javelin', glow: 'lightning strike gleam' },
    'pilum': { noun: 'pilum javelin', glow: 'roman war gleam' },
    'short-spear': { noun: 'short spear', glow: 'spear tip gleam' },
    'glaive': { noun: 'glaive', glow: 'polearm blade gleam' },
    'spear': { noun: 'spear', glow: 'spear gleam' },
    'trident': { noun: 'trident', glow: 'three-tined gleam' },
    'stiletto': { noun: 'stiletto dagger', glow: 'needle-thin gleam' },
    'short-staff': { noun: 'short staff', glow: 'wooden staff glow' },
    'long-staff': { noun: 'long staff', glow: 'tall staff glow' },
    'gnarled-staff': { noun: 'gnarled staff', glow: 'twisted wood glow' },
    'battle-staff': { noun: 'battle staff', glow: 'war staff glow' },
    'war-staff': { noun: 'war staff', glow: 'arcane war glow' },
    'short-bow': { noun: 'short bow', glow: 'nimble bow gleam' },
    'hunter-bow': { noun: 'hunter bow', glow: 'hunter gleam' },
    'long-bow': { noun: 'long bow', glow: 'archer gleam' },
    'composite-bow': { noun: 'composite bow', glow: 'layered wood gleam' },
    'short-battle-bow': { noun: 'short battle bow', glow: 'battle gleam' },
    'long-battle-bow': { noun: 'long battle bow', glow: 'long battle gleam' },
    'short-war-bow': { noun: 'short war bow', glow: 'war gleam' },
    'long-war-bow': { noun: 'long war bow', glow: 'enormous war gleam' },
    'light-crossbow': { noun: 'light crossbow', glow: 'crossbow gleam' },
    'crossbow': { noun: 'crossbow', glow: 'heavy crossbow gleam' },
    'heavy-crossbow': { noun: 'heavy crossbow', glow: 'iron crossbow gleam' },
    'repeating-crossbow': { noun: 'repeating crossbow', glow: 'rapid crossbow gleam' },
    'sash': { noun: 'sash belt', glow: 'silky gleam' },
    'light-belt': { noun: 'light belt', glow: 'leather gleam' },
    'belt': { noun: 'belt', glow: 'sturdy gleam' },
    'heavy-belt': { noun: 'heavy belt', glow: 'heavy leather gleam' },
    'plated-belt': { noun: 'plated belt', glow: 'plated gleam' },
    'boots': { noun: 'boots', glow: 'leather boot gleam' },
    'heavy-boots': { noun: 'heavy boots', glow: 'iron boot gleam' },
    'chain-boots': { noun: 'chain boots', glow: 'chain mail boot gleam' },
    'light-gauntlets': { noun: 'light gauntlets', glow: 'nimble gauntlet gleam' },
    'gauntlets': { noun: 'gauntlets', glow: 'iron gauntlet gleam' },
    'heavy-gloves': { noun: 'heavy gloves', glow: 'armored glove gleam' },
    'chain-gloves': { noun: 'chain gloves', glow: 'chain mail glove gleam' },
    'ring': { noun: 'ring', glow: 'gemstone glow' },
    'amulet': { noun: 'amulet', glow: 'mystical pendant glow' },
  };
  
  const uniques = loadJSON(UNIQUES_JSON);
  for (const item of uniques) {
    const canonId = item.id.replace(/\//g, '.').replace(/\s+/g, '-').toLowerCase();
    const baseKey = item.baseId ? item.baseId.replace('items/base/', '') : '';
    const typeInfo = BASE_TYPE_INFO[baseKey] || { noun: baseKey || 'item', glow: 'faint magical aura' };
    const subject = `${item.name} (${typeInfo.noun})`;
    const flavorHint = item.flavor ? item.flavor.slice(0, 80) : '';
    const descriptors = [
      typeInfo.noun,
      typeInfo.glow,
      'centered on dark near-black background',
      'painterly D2 item icon style',
      'three-quarter view floating',
      flavorHint ? `flavor: ${flavorHint}` : 'ornate unique quality',
    ].filter(Boolean).join(', ');
    map.set(canonId, { subject, descriptors });
  }
  
  const act1 = loadJSON(ACT1_JSON);
  const act2 = loadJSON(ACT2_JSON);
  for (const mon of [...act1, ...act2]) {
    const canonId = mon.id.replace(/\//g, '.').replace(/\s+/g, '-').toLowerCase();
    map.set(canonId, { subject: mon.name + ' monster', descriptors: 'monster portrait, dark fantasy' });
  }
  
  return map;
}

function buildPrompt(category, subject, descriptors, presets) {
  const cat = presets.categories[category];
  if (!cat) throw new Error(`Unknown category: ${category}`);
  return [cat.promptPrefix, `subject: ${subject}`, descriptors, cat.styleSuffix]
    .filter(Boolean).join(', ');
}

function buildNegative(category, presets) {
  const cat = presets.categories[category];
  if (!cat) return '';
  return [...(presets.globalNegativePrompt || []), ...(cat.negativeAdditions || [])].join(', ');
}

async function main() {
  const manifest = loadJSON(MANIFEST_PATH);
  const presets = loadJSON(PRESETS_PATH);
  const alloc = parseRegistry();
  const subjectMap = buildSubjectMap();
  
  const existingIds = new Set(manifest.entries.map(e => e.id));
  let added = 0;
  
  const tasks = [
    { dir: ITEM_ICONS_DIR, category: 'item-icon', allocMap: alloc['item-icon'], seedBase: presets.categories['item-icon'].seedBase },
    { dir: MONSTERS_DIR, category: 'monster', allocMap: alloc['monster'], seedBase: presets.categories['monster'].seedBase },
  ];
  
  for (const { dir, category, allocMap, seedBase } of tasks) {
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter(f => f.endsWith('.png') && !f.includes('.v'));
    
    for (const file of files) {
      const id = file.replace(/\.png$/, '').replace(/_/g, '-');
      if (existingIds.has(id)) continue;
      
      const filepath = join(dir, file);
      const stat = statSync(filepath);
      if (stat.size < 5120) continue; // skip tiny files
      
      const subjectId = allocMap.get(id);
      if (subjectId === undefined) {
        console.log(`[repair] No subjectId for ${id} — skipping`);
        continue;
      }
      
      const info = subjectMap.get(id);
      if (!info) {
        console.log(`[repair] No subject info for ${id} — skipping`);
        continue;
      }
      
      const seed = seedBase + subjectId;
      const cat = presets.categories[category];
      const prompt = buildPrompt(category, info.subject, info.descriptors, presets);
      const negative = buildNegative(category, presets);
      
      const buf = readFileSync(filepath);
      const hash = createHash('sha256').update(buf).digest('hex');
      
      const entry = {
        id,
        category,
        subject: info.subject,
        descriptors: info.descriptors,
        subjectId,
        variant: 0,
        seed,
        model: cat.model,
        width: cat.width,
        height: cat.height,
        prompt,
        negativePrompt: negative,
        sourceUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${cat.model}&width=${cat.width}&height=${cat.height}&seed=${seed}&negative_prompt=${encodeURIComponent(negative)}&nologo=true&private=true`,
        file: filepath.replace(ROOT + (process.platform === 'win32' ? '\\' : '/'), '').replace(/\\/g, '/'),
        bytes: buf.length,
        sha256: hash,
        generatedAt: new Date().toISOString(),
      };
      
      if (DRY_RUN) {
        console.log(`[repair] [dry-run] Would add: ${id}`);
      } else {
        manifest.entries.push(entry);
        existingIds.add(id);
        added++;
      }
    }
  }
  
  if (!DRY_RUN && added > 0) {
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`[repair] Added ${added} missing entries to manifest.json`);
  } else if (DRY_RUN) {
    console.log(`[repair] Dry-run complete.`);
  } else {
    console.log(`[repair] No missing entries found.`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
