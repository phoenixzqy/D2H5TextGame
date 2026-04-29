#!/usr/bin/env node
/**
 * gen-art-batch.mjs — Batch image generation for all D2 unique items and
 * act1/act2 monster archetypes.
 *
 * Usage:
 *   node scripts/gen-art-batch.mjs [--allocate-only] [--dry-run] [--category item-icon|monster]
 *
 * Flags:
 *   --allocate-only   Update seed-registry.md with new allocations and exit.
 *   --dry-run         Show what would be generated; do not fetch images.
 *   --category <cat>  Only run for 'item-icon' or 'monster' (default: both).
 *   --concurrency <n> Parallel batch size (default: 5).
 *   --spacing <ms>    Delay between batches in ms (default: 8000).
 *   --retry <n>       Max retries per failed image (default: 3).
 */

import { readFileSync, writeFileSync, existsSync, appendFileSync, statSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Paths ────────────────────────────────────────────────────────────────────
const UNIQUES_JSON    = join(ROOT, 'src/data/items/uniques.json');
const ACT1_JSON       = join(ROOT, 'src/data/monsters/act1.json');
const ACT2_JSON       = join(ROOT, 'src/data/monsters/act2.json');
const MANIFEST_PATH   = join(ROOT, 'public/assets/d2/generated/manifest.json');
const REGISTRY_PATH   = join(ROOT, 'docs/art/seed-registry.md');
const IMAGE_GEN_SCRIPT = join(ROOT, '.github/skills/image-gen/scripts/image-gen.mjs');
const LOG_PATH        = join(ROOT, 'scripts/gen-art-batch.log');
const ITEM_ICONS_DIR  = join(ROOT, 'public/assets/d2/generated/item-icons');
const MONSTERS_DIR    = join(ROOT, 'public/assets/d2/generated/monsters');

// ─── CLI args ─────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const ALLOCATE_ONLY = argv.includes('--allocate-only');
const DRY_RUN       = argv.includes('--dry-run');
const CAT_FILTER    = (() => { const i = argv.indexOf('--category'); return i >= 0 ? argv[i+1] : null; })();
const CONCURRENCY   = (() => { const i = argv.indexOf('--concurrency'); return i >= 0 ? Number(argv[i+1]) : 5; })();
const SPACING_MS    = (() => { const i = argv.indexOf('--spacing'); return i >= 0 ? Number(argv[i+1]) : 8000; })();
const MAX_RETRY     = (() => { const i = argv.indexOf('--retry'); return i >= 0 ? Number(argv[i+1]) : 3; })();

// ─── Base-type visual descriptions ───────────────────────────────────────────
const BASE_TYPE_INFO = {
  'sh-buckler':          { noun: 'small round buckler shield',           glow: 'faint gold rim' },
  'sh-kite':             { noun: 'kite shield',                          glow: 'weathered iron edges' },
  'sh-dragon-shield':    { noun: 'dragon-motif kite shield',             glow: 'ember red glow' },
  'sh-monarch':          { noun: 'large crowned monarch shield',         glow: 'arcane gold filigree' },
  'sh-aegis':            { noun: 'massive tower aegis shield',           glow: 'cold blue haze' },
  'sh-sacred-targe':     { noun: 'ornate sacred targe shield',           glow: 'holy amber radiance' },
  'wp1h-short-sword':    { noun: 'short straight sword',                 glow: 'keen steel shimmer' },
  'wp1h-scimitar':       { noun: 'curved scimitar blade',                glow: 'cold-steel sheen' },
  'wp1h-long-sword':     { noun: 'broad longsword',                      glow: 'silver edge glow' },
  'wp1h-war-sword':      { noun: 'heavy war sword',                      glow: 'ember-red runes' },
  'wp1h-phase-blade':    { noun: 'ethereal phase blade (energy sword)',   glow: 'lightning-blue energy edge' },
  'wp1h-legend-sword':   { noun: 'legendary ornate one-hand sword',      glow: 'golden rune inlay' },
  'wp2h-colossus-blade': { noun: 'massive two-hand colossus sword',      glow: 'deep crimson runes' },
  'wp2h-giant-thresher': { noun: 'giant two-hand polearm thresher',      glow: 'crackling electricity' },
  'wp2h-thunder-maul':   { noun: 'enormous two-hand thunder maul',       glow: 'crackling lightning' },
  'wp2h-war-pike':       { noun: 'long two-hand war pike',               glow: 'cold ice frost' },
  'weapon-axe':          { noun: 'hand axe with iron head',              glow: 'blood-red sheen' },
  'weapon-mace':         { noun: 'flanged iron mace',                    glow: 'dull iron glint' },
  'weapon-wand':         { noun: 'carved bone wand',                     glow: 'pale necrotic glow' },
  'weapon-bow':          { noun: 'recurve short bow',                    glow: 'taut bowstring gleam' },
  'weapon-crossbow':     { noun: 'heavy mechanical crossbow',            glow: 'frost-blue tipped bolts' },
  'weapon-polearm':      { noun: 'long bladed polearm',                  glow: 'dark steel glint' },
  'weapon-scepter':      { noun: 'ornate holy scepter',                  glow: 'divine amber radiance' },
  'helm-cap':            { noun: 'leather-banded helm cap',              glow: 'subtle arcane shimmer' },
  'helm-skull-cap':      { noun: 'iron skull cap helm',                  glow: 'dark iron surface' },
  'helm-casque':         { noun: 'open-faced steel casque helm',         glow: 'polished steel' },
  'helm-war-hat':        { noun: 'wide-brimmed iron war hat',            glow: 'mystic purple shimmer' },
  'helm-armet':          { noun: 'closed visor armet helm',              glow: 'engraved steel' },
  'helm-giant-conch':    { noun: 'giant ocean conch shell helm',         glow: 'pearl iridescence' },
  'armor-leather':       { noun: 'supple leather body armor',            glow: 'shadowy haze' },
  'armor-light':         { noun: 'light ringmail armor',                 glow: 'faint blue shimmer' },
  'armor-chain-mail':    { noun: 'full chain mail hauberk',              glow: 'silver chain glint' },
  'armor-breast-plate':  { noun: 'polished steel breast plate',          glow: 'bright reflection' },
  'armor-heavy':         { noun: 'heavy iron plate armor',               glow: 'dark iron surface' },
  'armor-dusk-shroud':   { noun: 'shadowy dusk shroud body armor',       glow: 'twilight purple aura' },
  'armor-archon-plate':  { noun: 'ornate archon full plate armor',       glow: 'golden arcane runes' },
  'gloves':              { noun: 'leather combat gauntlets',             glow: 'subtle blood-red stain' },
  'glove-leather':       { noun: 'supple leather gloves',                glow: 'poison-green shimmer' },
  'glove-chain':         { noun: 'chain mail gauntlets',                 glow: 'silver link gleam' },
  'glove-heavy':         { noun: 'heavy iron-plate gauntlets',           glow: 'dark iron glow' },
  'glove-bramble-mitts': { noun: 'spiked briar bramble mitts',           glow: 'thorn-green glow' },
  'glove-vampirebone':   { noun: 'vampirebone carved claw gauntlets',    glow: 'crimson necrotic aura' },
  'glove-light-gauntlets':{ noun: 'light articulated gauntlets',         glow: 'faint silver shimmer' },
  'boots':               { noun: 'worn leather boots',                   glow: 'faint fire glow' },
  'boot-heavy':          { noun: 'heavy iron-shod combat boots',         glow: 'blood-red splash' },
  'boot-chain':          { noun: 'chain mail sabatons',                  glow: 'silver chain gleam' },
  'boot-light-plated':   { noun: 'light plated leather boots',           glow: 'arcane teal shimmer' },
  'boot-demonhide':      { noun: 'dark scaled demonhide boots',          glow: 'infernal red glow' },
  'boot-myrmidon-greaves':{ noun: 'heavy ornate myrmidon greaves',       glow: 'bright polished steel' },
  'belt-light':          { noun: 'cloth sash belt',                      glow: 'mana-blue glow' },
  'belt-heavy':          { noun: 'studded leather belt',                 glow: 'dark iron studs' },
  'belt-plated':         { noun: 'articulated plated steel belt',        glow: 'engraved steel gleam' },
  'belt-demonhide':      { noun: 'dark demonhide scaled belt',           glow: 'blood-red rune glow' },
  'belt-mithril-coil':   { noun: 'interlocked mithril coil belt',        glow: 'silver mithril sheen' },
  'ring':                { noun: 'plain gold ring',                      glow: 'faint golden aura' },
  'ring-amber':          { noun: 'amber-set gold ring',                  glow: 'warm amber glow' },
  'ring-jade':           { noun: 'jade-set silver ring',                 glow: 'verdant green shimmer' },
  'ring-obsidian':       { noun: 'obsidian-set dark ring',               glow: 'deep void shimmer' },
  'ring-silver':         { noun: 'polished silver ring',                 glow: 'cold silver sheen' },
  'ring-zircon':         { noun: 'zircon-set gold ring',                 glow: 'pale ice shimmer' },
  'amu-brass':           { noun: 'brass amulet pendant',                 glow: 'warm brass shimmer' },
  'amu-jade':            { noun: 'jade stone amulet',                    glow: 'green jade glow' },
  'amu-obsidian':        { noun: 'dark obsidian amulet',                 glow: 'deep void aura' },
  'amu-silver':          { noun: 'engraved silver amulet',               glow: 'cold silver radiance' },
  'amu-zircon':          { noun: 'zircon crystal amulet',                glow: 'icy blue shimmer' },
};

// ─── Monster visual descriptions ─────────────────────────────────────────────
const MONSTER_VISUAL = {
  // Act 1 monsters
  'fallen':              { subject: 'Fallen imp demon', desc: 'small red-skinned imp, hunched, tiny clawed hands, wild eyes, mossy forest backdrop, brandishing crude club, act1 Blood Moor ambiance' },
  'zombie':              { subject: 'rotting Zombie', desc: 'decayed shambling corpse, tattered burial rags, greenish putrid skin, exposed bone, outstretched grasping hands, dark forest clearing' },
  'corpsefire':          { subject: 'Corpsefire unique zombie boss', desc: 'fire-wreathed decomposing zombie, burning green flames engulfing torso, glowing ember eyes, scorched burial cloth, boss aura, act1 Den of Evil' },
  'quill-rat':           { subject: 'Quill Rat creature', desc: 'large rat-like creature, long sharp poisoned quills along back and shoulders, yellow eyes, Blood Moor grass, hunched predatory pose' },
  'spike-fiend':         { subject: 'Spike Fiend demon', desc: 'lanky blue-skinned demon with bony spikes protruding from limbs, narrow fanged snout, forest ambiance, coiled to leap' },
  'dark-one':            { subject: 'Dark One fallen variant', desc: 'slightly larger crimson Fallen demon, brass bracers, jagged jaw, cave mouth backdrop, carrying rusty sword' },
  'carver':              { subject: 'Carver fallen demon', desc: 'orange-skinned Fallen carrying a cleaver, tusked lower jaw, mossy ruins backdrop, aggressive leaning posture' },
  'misshapen':           { subject: 'Misshapen fallen imp', desc: 'deformed Fallen with oversized lumpy head, one eye drooping, skeletal hands, dark forest night, shuffling stance' },
  'disfigured':          { subject: 'Disfigured fallen imp', desc: 'burned Fallen imp with scarred hide, charred patches, feral yellow eyes, smoldering ruins backdrop' },
  'devilkin':            { subject: 'Devilkin fallen demon', desc: 'dark purple fallen imp with curled ram horns, sharp claws, glowing red eyes, Blood Moor backdrop at dusk' },
  'fallen-shaman':       { subject: 'Fallen Shaman (Carver)', desc: 'small yellow-robed fallen shaman, staff topped with skull, flames rising from raised hand, resurrecting fallen around it, dim forest glade' },
  'carver-shaman':       { subject: 'Carver Shaman fallen caster', desc: 'orange-robed fallen shaman waving bone staff, crackling fire sigil on chest, ruined shrine backdrop, necromantic aura' },
  'devilkin-shaman':     { subject: 'Devilkin Shaman fallen caster', desc: 'dark-robed devilkin shaman, purple flame aura, bone staff, glowing runes on robe, dim forest night backdrop' },
  'bishibosh':           { subject: 'Bishibosh fallen boss', desc: 'large fire-enchanted fallen shaman boss, orange robes crackling with flames, fire halo, boss aura, ruined Stony Field altar' },
  'rakanishu':           { subject: 'Rakanishu fallen lightning boss', desc: 'small but crackling Fallen leader boss, lightning arcing off body, manic eyes, Stony Field stone-circle backdrop, aura of sparks' },
  'tainted':             { subject: 'Tainted zombie', desc: 'plague-swollen undead figure, boils on skin, dark vomit dripping, cemetery backdrop, lurching forward' },
  'afflicted':           { subject: 'Afflicted zombie', desc: 'emaciated cursed zombie, curse marks on skin, hollow eye sockets, dark catacomb backdrop, dragging limbs' },
  'hungry-dead':         { subject: 'Hungry Dead zombie', desc: 'skeletal gaunt undead with bared ribs, wild matted hair, pale greyish skin, ravenous lunge, Blood Moor' },
  'ghoul':               { subject: 'Ghoul undead', desc: 'hairless grey-skinned ghoul with large black eyes, elongated fingers, hunched on all fours, catacombs backdrop, predatory' },
  'ghost':               { subject: 'Ghost spectral undead', desc: 'translucent drifting spirit, faint silvery wisps, hollow dark eye sockets, monastery ruins backdrop, ethereal glow' },
  'wraith':              { subject: 'Wraith dark specter', desc: 'shadowy wraith figure, black tattered shroud, glowing violet eyes, swirling dark mist, dark dungeon backdrop' },
  'dark-archer':         { subject: 'Dark Archer corrupt Rogue', desc: 'armored corrupt female rogue archer, black-dyed leather, nocked arrow, monastery battlements backdrop, sinister expression' },
  'dark-ranger':         { subject: 'Dark Ranger corrupt Rogue', desc: 'corrupt rogue bowwoman in dark chainmail, quiver at hip, bow drawn, Rogue Encampment corrupted backdrop' },
  'vile-hunter':         { subject: 'Vile Hunter corrupt Rogue', desc: 'veteran corrupt rogue in plate-reinforced dark leather, crossbow leveled, monastery catacombs backdrop, snarling face' },
  'dark-stalker':        { subject: 'Dark Stalker corrupt Rogue', desc: 'lithe corrupt rogue in shadow-black leather, daggers drawn, low-crouching ambush pose, moonlit forest path' },
  'coldcrow':            { subject: 'Coldcrow corrupt Rogue boss', desc: 'powerful corrupt rogue boss in icy blue-edged armor, frost-enchanted bow crackling, boss aura, cold tundra backdrop' },
  'brute':               { subject: 'Brute large beast', desc: 'massive shaggy beast-man, hunched back, oversized fists, thick fur-like hide, Rocky Mountain wilderness backdrop' },
  'yeti':                { subject: 'Yeti beast', desc: 'large white-furred yeti, powerful clawed arms, ice-crusted pelt, snowy mountain backdrop, act1 highlands' },
  'crusher':             { subject: 'Crusher golem beast', desc: 'thick-limbed stone-skinned beast with crude boulder-like fists, heavy brow, rocky highland backdrop, earth-toned hide' },
  'treehead-woodfist':   { subject: 'Treehead WoodFist unique brute boss', desc: 'enormous boss brute with bark-armored hide, fist made of gnarled roots and wood, forest glade backdrop, towering menace' },
  'pitspawn-fouldog':    { subject: 'Pitspawn Fouldog unique beast boss', desc: 'hulking beast boss with fire-enchanted pelt, glowing fire eyes, boss aura, Pit dungeon backdrop, massive claws' },
  'returned':            { subject: 'Returned skeleton warrior', desc: 'armored skeleton soldier, rusted chainmail, shield and short sword, glowing red eye sockets, dark dungeon corridor backdrop' },
  'bone-warrior':        { subject: 'Bone Warrior skeleton', desc: 'ancient skeleton warrior in corroded plate, hollow eye sockets, grasping sword aloft, catacombs backdrop' },
  'returned-archer':     { subject: 'Returned Archer skeleton bowman', desc: 'skeleton archer with crumbling bone-bow, arrow notched, tattered burial armor, dark monastery ruins backdrop' },
  'burning-dead-mage':   { subject: 'Burning Dead Mage skeleton sorcerer', desc: 'robed skeleton necromancer, fire channeled through bony hands, burning skull, flame-lit catacomb backdrop' },
  'bone-ash':            { subject: 'Bone Ash skeleton boss', desc: 'powerful skeleton sorcerer boss, flowing dark robe, crackling fire staff, boss aura, dark altar backdrop, emaciated skull' },
  'the-countess':        { subject: 'The Countess unique boss', desc: 'vampire noblewoman boss, crimson gown, pale skin, blood-dripping hands, baroque dungeon tower chamber, boss aura' },
  'griswold':            { subject: 'Griswold the Smith unique boss', desc: 'massive undead blacksmith boss, plate-clad hulk, glowing forge-fire eyes, blacksmith hammer, tower forge backdrop, boss aura' },
  'the-smith':           { subject: 'The Smith unique boss', desc: 'giant armored smith boss, crude tower-shield and oversized cleaver, furnace backdrop, dark forge, glowing embers, boss aura' },
  'blood-raven':         { subject: 'Blood Raven fallen Rogue captain boss', desc: 'corrupt rogue archer boss in crimson-stained armor, skeleton-summoning aura, black crow motif, graveyard backdrop, boss aura' },
  'andariel':            { subject: 'Andariel Maiden of Anguish boss', desc: 'lesser evil demoness, four blade-tipped arms, blonde hair, twisted feminine torso, poison drip, catacombs backdrop, massive boss form' },

  // Act 2 monsters
  'sand-raider':         { subject: 'Sand Raider desert marauder', desc: 'dark-skinned desert warrior, scimitar, wrapped in sand-colored cloth, desert ruins backdrop, sand dunes, lantern-light' },
  'marauder':            { subject: 'Marauder desert warrior', desc: 'armored marauder raider, curved blade, desert sand dunes backdrop, bronze-toned armor, fierce scowl' },
  'invader':             { subject: 'Invader desert warrior', desc: 'elite desert warrior, chain armor, spiked helm, sandy ruins, aggressive battle stance, act2 desert' },
  'infidel':             { subject: 'Infidel desert raider', desc: 'veteran desert marauder, dark leather armor, jagged edge sword, Lut Gholein outskirts backdrop' },
  'fire-eye':            { subject: 'Fire Eye demon', desc: 'floating cyclopean demon, single enormous burning fire eye, smoky tendrils, desert at night backdrop, hellfire aura' },
  'sand-maggot':         { subject: 'Sand Maggot giant larva', desc: 'enormous fat pale grub-like larva, segmented body, sand-burrowing, multiple rows of stubby legs, sandy desert cave backdrop' },
  'sand-maggot-young':   { subject: 'Sand Maggot Young larva swarm', desc: 'small sand maggot larva, white segmented body, tiny jaw, sandy cave floor, emerging from sand' },
  'rock-worm':           { subject: 'Rock Worm burrowing creature', desc: 'stone-gray armored worm creature, rock-hard segments, desert rock backdrop, burrowing upward through sand' },
  'devourer':            { subject: 'Devourer maggot creature', desc: 'large bloated maggot-like devourer, acid spitting pose, pale yellow skin, sandy dungeon backdrop' },
  'coldworm-the-burrower':{ subject: 'Coldworm the Burrower unique maggot boss', desc: 'massive cold-enchanted sand maggot boss, frost crystals along body, icy breath, boss aura, Sandy Cave backdrop' },
  'dune-beast':          { subject: 'Dune Beast desert creature', desc: 'scaled two-legged desert beast, claws, long tail, sandy beige scales, desert midday sun backdrop' },
  'saber-cat':           { subject: 'Saber Cat predator', desc: 'sleek saber-toothed predator cat, elongated fangs, tawny desert fur, crouching ready to pounce, rocky desert backdrop' },
  'bloodhawk':           { subject: 'Bloodhawk flying creature', desc: 'large crimson hawk with razor talon wings, diving attack pose, red feathers, desert sky backdrop, blood-red eye' },
  'claw-viper':          { subject: 'Claw Viper desert serpent', desc: 'large sandy-scaled viper with hooked claws on wing-like appendages, coiled, desert sands, hissing fanged maw' },
  'salamander':          { subject: 'Salamander fire lizard', desc: 'fire-breathing lizard, flame motif red scales, small stumpy legs, desert rocky backdrop, tongues of flame' },
  'pit-viper':           { subject: 'Pit Viper serpent', desc: 'long dark-scaled pit viper snake, venomous fangs dripping, raised striking pose, desert dungeon floor backdrop' },
  'fangskin':            { subject: 'Fangskin unique viper boss', desc: 'enormous lightning-enchanted claw viper boss, crackling scales, boss aura, serpent temple backdrop, coiled massive body' },
  'mummy':               { subject: 'Mummy undead', desc: 'ancient linen-wrapped mummy, decayed wrappings, glowing golden eyes, sand-filled tomb backdrop, outstretched desiccated hands' },
  'greater-mummy':       { subject: 'Greater Mummy undead sorcerer', desc: 'tall robed mummy with dark stave, curse hand gesture, tomb chamber backdrop, wrapped in dark linen, amber glowing eyes' },
  'burning-dead-archer': { subject: 'Burning Dead Archer skeleton', desc: 'skeleton archer wreathed in fire, flaming arrows nocked, ruined desert tomb backdrop, fire halo' },
  'horadrim-ancient':    { subject: 'Horadrim Ancient skeleton mage', desc: 'ancient Horadrim robed skeleton, arcane staff, glowing horadric runes, dusty tomb backdrop, spectral wisps' },
  'ancient-kaa':         { subject: 'Ancient Kaa the Soulless unique mummy boss', desc: 'enormous mummy boss, glowing amber eyes, linen shredded on towering form, sandy tomb chamber, boss aura, dark curse aura' },
  'radament':            { subject: 'Radament unique Greater Mummy boss', desc: 'massive horadric mummy boss, dark linen robes, staff of dark power, sewers of Lut Gholein backdrop, boss aura' },
  'horror-mage':         { subject: 'Horror Mage dark caster', desc: 'dark-robed skeleton caster, lightning crackling hands, skull face, dry desert dungeon backdrop' },
  'cantor':              { subject: 'Cantor dark cultist', desc: 'hooded desert cultist, dark burgundy robes, chanting pose, desert shrine backdrop, lantern glow' },
  'dark-elder':          { subject: 'Dark Elder undead leader', desc: 'ancient robed undead elder, curved staff, sunken glowing eyes, dark desert ruins, commanding pose' },
  'scarab':              { subject: 'Scarab beetle demon', desc: 'man-sized humanoid scarab beetle, chitinous shell, mandibles, desert tomb backdrop, earthy brown carapace' },
  'steel-scarab':        { subject: 'Steel Scarab beetle demon', desc: 'metallic-armored humanoid scarab, glinting steel carapace, fire-enchanted claws, desert underground backdrop' },
  'plague-bug':          { subject: 'Plague Bug insect demon', desc: 'large plague-carrying insect demon, poisonous bile coating, grotesque multi-limbed body, desert dungeon backdrop' },
  'death-beetle':        { subject: 'Death Beetle scarab', desc: 'hulking dark scarab beetle demon, thick obsidian shell, death aura, sandy tomb floor backdrop' },
  'beetleburst':         { subject: 'Beetleburst unique scarab boss', desc: 'giant fire-enchanted scarab boss, burning carapace, flame aura, boss glow, rocky desert dungeon backdrop' },
  'sand-leaper':         { subject: 'Sand Leaper jumping creature', desc: 'quick sandy-colored quadruped, leaping attack pose, wide hindquarters, sandy desert floor backdrop, yellow eyes' },
  'cave-leaper':         { subject: 'Cave Leaper jumping creature', desc: 'dark stone-gray cave-dwelling leaper, crouching on cave walls, stalactite backdrop, predatory crouch' },
  'vulture-demon':       { subject: 'Vulture Demon flying creature', desc: 'bat-winged demonic vulture, featherless leathery wings, desert ridge backdrop, swooping attack pose, red-orange skin' },
  'undead-scavenger':    { subject: 'Undead Scavenger flying creature', desc: 'skeletal vulture creature, exposed ribcage visible through feathers, desert sky backdrop, swooping' },
  'undead-flayer':       { subject: 'Undead Flayer jungle pygmy undead', desc: 'small skeletal jungle pygmy, long bony arms, desert catacombs backdrop, hollow skull eyes, wielding bone blowgun' },
  'the-summoner':        { subject: 'The Summoner Horadric mage boss', desc: 'pale gaunt mage boss in Horadric robes, surrounded by arcane portals, Arcane Sanctuary backdrop, floating books, boss aura' },
  'duriel':              { subject: 'Duriel Lord of Pain boss', desc: 'massive pale lobster-like demon, segmented carapace, enormous crushing claws, ice-frost aura, Tal Rasha tomb backdrop, boss form' },
};

// ─── Load data ───────────────────────────────────────────────────────────────
function loadJSON(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) return { version: 1, service: 'pollinations.ai', entries: [] };
  return loadJSON(MANIFEST_PATH);
}

/** Convert source JSON id to canonical dot-notation id */
function toCanonicalId(srcId) {
  // 'items/unique/pelta-lunata' → 'items.unique.pelta-lunata'
  // 'monsters/act1.fallen' → 'monsters.act1.fallen'
  return srcId.replace(/\//g, '.').replace(/\s+/g, '-').toLowerCase();
}

/** Convert canonical id to kebab-safe file name segment */
function toSafeId(id) {
  return id.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// ─── Parse existing seed-registry for allocated subjectIds ───────────────────
function parseRegistry(registryText) {
  const alloc = { 'item-icon': new Map(), 'monster': new Map() };
  let currentCategory = null;
  for (const line of registryText.split('\n')) {
    // Handle both ## and ### headers for category sections
    const trimmed = line.replace(/^#+\s*/, '').toLowerCase();
    if (trimmed.startsWith('item-icon'))    currentCategory = 'item-icon';
    else if (trimmed.startsWith('monster')) currentCategory = 'monster';
    else if (line.match(/^## [^#]/))         currentCategory = null;
    if (!currentCategory) continue;
    // Table row: | subjectId | id | subject | ...
    const m = line.match(/^\|\s*(\d+)\s*\|\s*([^\s|]+)\s*\|/);
    if (m) {
      alloc[currentCategory].set(m[2].trim(), Number(m[1]));
    }
  }
  return alloc;
}

// ─── Build to-do list ────────────────────────────────────────────────────────
function buildToDoList() {
  const uniques  = loadJSON(UNIQUES_JSON);
  const act1     = loadJSON(ACT1_JSON);
  const act2     = loadJSON(ACT2_JSON);
  const manifest = loadManifest();
  const manifestIds = new Set(manifest.entries.map(e => e.id));
  const registryText = readFileSync(REGISTRY_PATH, 'utf8');
  const registryAlloc = parseRegistry(registryText);

  const itemAlloc    = registryAlloc['item-icon'];   // id → subjectId
  const monsterAlloc = registryAlloc['monster'];

  // Find highest allocated subjectId to avoid collision
  const maxItemSubjectId    = Math.max(0, ...(itemAlloc.size   ? [...itemAlloc.values()]    : [0]));
  const maxMonsterSubjectId = Math.max(0, ...(monsterAlloc.size ? [...monsterAlloc.values()] : [0]));

  // New subjectId counters — start at 1000 or one above current max if that's higher
  let nextItemSubjectId    = Math.max(1000, maxItemSubjectId    + 1);
  let nextMonsterSubjectId = Math.max(1000, maxMonsterSubjectId + 1);

  // New registry rows to append
  const newRegistryRows = { 'item-icon': [], 'monster': [] };

  const todos = [];

  // ── Item icons ─────────────────────────────────────────────────
  if (!CAT_FILTER || CAT_FILTER === 'item-icon') {
    for (const item of uniques) {
      const canonId = toCanonicalId(item.id); // e.g. items.unique.pelta-lunata
      const safeId  = toSafeId(canonId);
      const outFile = join(ITEM_ICONS_DIR, `${safeId}.png`);

      // Skip if file > 5KB exists (manifest may be incomplete due to race condition)
      const hasManifest = manifestIds.has(canonId);
      const hasFile = existsSync(outFile) && (() => {
        try { return statSync(outFile).size > 5120; } catch { return false; }
      })();
      if (hasFile) continue;

      // Get or allocate subjectId
      let subjectId = itemAlloc.get(canonId);
      if (subjectId === undefined) {
        subjectId = nextItemSubjectId++;
        itemAlloc.set(canonId, subjectId);
        newRegistryRows['item-icon'].push({ subjectId, id: canonId, subject: item.name });
      }

      // Build subject and descriptors
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

      todos.push({
        category: 'item-icon',
        id: canonId,
        subjectId,
        subject,
        descriptors,
        outFile,
        hasManifest,
      });
    }
  }

  // ── Monster portraits ──────────────────────────────────────────
  if (!CAT_FILTER || CAT_FILTER === 'monster') {
    for (const [actId, monsters] of [['act1', act1], ['act2', act2]]) {
      for (const mon of monsters) {
        const canonId = toCanonicalId(mon.id); // monsters.act1.fallen
        const safeId  = toSafeId(canonId);
        const outFile = join(MONSTERS_DIR, `${safeId}.png`);

        const hasManifest = manifestIds.has(canonId);
        const hasFile = existsSync(outFile) && (() => {
          try { return statSync(outFile).size > 5120; } catch { return false; }
        })();
        // Skip if file already exists (manifest may be incomplete due to race condition)
        if (hasFile) continue;

        // Get or allocate subjectId
        let subjectId = monsterAlloc.get(canonId);
        if (subjectId === undefined) {
          subjectId = nextMonsterSubjectId++;
          monsterAlloc.set(canonId, subjectId);
          newRegistryRows['monster'].push({ subjectId, id: canonId, subject: mon.name });
        }

        // Use visual lookup, fallback to name
        const nameKey = mon.id.split('.').pop(); // 'fallen', 'zombie', etc.
        const visual = MONSTER_VISUAL[nameKey] || {
          subject: `${mon.name} monster`,
          desc: `${actId === 'act1' ? 'mossy forest dungeon backdrop, act1 Blood Moor' : 'sandy desert ruins backdrop, act2 Lut Gholein area'}, menacing creature portrait`,
        };
        const subject     = visual.subject;
        const descriptors = visual.desc;

        todos.push({
          category: 'monster',
          id: canonId,
          subjectId,
          subject,
          descriptors,
          outFile,
          hasManifest,
        });
      }
    }
  }

  return { todos, newRegistryRows };
}

// ─── Update seed-registry.md ─────────────────────────────────────────────────
function appendToSeedRegistry(newRows) {
  const lines = [];

  if (newRows['item-icon'].length > 0) {
    lines.push('');
    lines.push('### item-icon — new uniques (subjectIds 1000+)');
    lines.push('');
    lines.push('| subjectId | id | subject | accepted variant | notes |');
    lines.push('|----------:|----|---------|------------------|-------|');
    for (const r of newRows['item-icon']) {
      lines.push(`| ${r.subjectId} | ${r.id} | ${r.subject} | 0 | auto-allocated |`);
    }
  }

  if (newRows['monster'].length > 0) {
    lines.push('');
    lines.push('### monster — new act1/act2 archetypes (subjectIds 1000+)');
    lines.push('');
    lines.push('| subjectId | id | subject | accepted variant | notes |');
    lines.push('|----------:|----|---------|------------------|-------|');
    for (const r of newRows['monster']) {
      lines.push(`| ${r.subjectId} | ${r.id} | ${r.subject} | 0 | auto-allocated |`);
    }
  }

  if (lines.length === 0) {
    console.log('[registry] No new allocations needed.');
    return;
  }

  appendFileSync(REGISTRY_PATH, lines.join('\n') + '\n');
  console.log(`[registry] Appended ${newRows['item-icon'].length + newRows['monster'].length} new allocations to seed-registry.md`);
}

// ─── Run a single image-gen call ──────────────────────────────────────────────
function runImageGen(todo) {
  return new Promise((resolve) => {
    const args = [
      IMAGE_GEN_SCRIPT,
      '--category', todo.category,
      '--id', todo.id,
      '--subjectId', String(todo.subjectId),
      '--subject', todo.subject,
      '--descriptors', todo.descriptors,
    ];
    if (DRY_RUN) args.push('--dry-run');

    const start = Date.now();
    const proc = spawn(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => { stdout += d; process.stdout.write(d); });
    proc.stderr.on('data', d => { stderr += d; process.stderr.write(d); });
    proc.on('close', code => {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      resolve({ ok: code === 0, code, stdout, stderr, elapsed });
    });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_PATH, line + '\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Ensure log dir exists
  mkdirSync(dirname(LOG_PATH), { recursive: true });

  log('=== gen-art-batch starting ===');
  log(`DRY_RUN=${DRY_RUN} ALLOCATE_ONLY=${ALLOCATE_ONLY} CAT_FILTER=${CAT_FILTER||'both'}`);

  const { todos, newRegistryRows } = buildToDoList();

  log(`New registry rows: item-icon=${newRegistryRows['item-icon'].length}, monster=${newRegistryRows['monster'].length}`);
  log(`To-do list: ${todos.length} items`);

  // Phase 1: Update seed-registry.md (skip on dry-run to avoid duplicate entries)
  if (!DRY_RUN && (newRegistryRows['item-icon'].length > 0 || newRegistryRows['monster'].length > 0)) {
    appendToSeedRegistry(newRegistryRows);
  } else if (DRY_RUN && (newRegistryRows['item-icon'].length > 0 || newRegistryRows['monster'].length > 0)) {
    log(`[dry-run] Would append ${newRegistryRows['item-icon'].length + newRegistryRows['monster'].length} rows to seed-registry.md`);
  }

  if (ALLOCATE_ONLY) {
    log('--allocate-only flag set, stopping after registry update.');
    return;
  }

  // Phase 2: Generate images in batches
  const failures = [];
  const successes = [];

  for (let i = 0; i < todos.length; i += CONCURRENCY) {
    const batch = todos.slice(i, i + CONCURRENCY);
    log(`Batch ${Math.floor(i/CONCURRENCY)+1}/${Math.ceil(todos.length/CONCURRENCY)}: ${batch.map(t=>t.id).join(', ')}`);

    const results = await Promise.all(batch.map(async (todo) => {
      let lastErr = '';
      for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
        if (attempt > 1) {
          log(`  RETRY ${attempt}/${MAX_RETRY} for ${todo.id}, backing off 10s...`);
          await sleep(10000);
        }
        const r = await runImageGen(todo);
        if (r.ok) {
          log(`  ✓ ${todo.id} (${r.elapsed}s)`);
          return { todo, ok: true };
        }
        lastErr = (r.stderr + r.stdout).trim().slice(-200);
        log(`  ✗ ${todo.id} attempt ${attempt}: exit=${r.code}`);
      }
      log(`  FAILED ${todo.id}: ${lastErr}`);
      return { todo, ok: false, err: lastErr };
    }));

    for (const r of results) {
      if (r.ok) successes.push(r.todo.id);
      else failures.push({ id: r.todo.id, err: r.err });
    }

    // Spacing between batches
    if (i + CONCURRENCY < todos.length) {
      log(`Sleeping ${SPACING_MS}ms before next batch...`);
      await sleep(SPACING_MS);
    }
  }

  // Summary
  log(`\n=== SUMMARY ===`);
  log(`Successes: ${successes.length}/${todos.length}`);
  log(`Failures:  ${failures.length}`);
  if (failures.length > 0) {
    log('Failed IDs:');
    for (const f of failures) log(`  ${f.id}: ${f.err}`);
  }

  console.log('\n=== FINAL REPORT ===');
  console.log(`Attempted: ${todos.length}`);
  console.log(`Succeeded: ${successes.length}`);
  console.log(`Failed:    ${failures.length}`);
  if (failures.length > 0) {
    console.log('Failures:');
    for (const f of failures) console.log(`  - ${f.id}`);
  }
}

main().catch(e => {
  console.error('[gen-art-batch] Fatal:', e.stack || e.message);
  process.exit(1);
});
