#!/usr/bin/env node
/**
 * Art Director — Batch 1 driver.
 * Sequentially invokes the image-gen skill for the foundational asset set.
 * Retries each call up to 3 times with backoff on failure.
 */
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SCRIPT = resolve(REPO_ROOT, '.github/skills/image-gen/scripts/image-gen.mjs');

const jobs = [
  // ---------- Class portraits (subjectIds 1..7) ----------
  { category: 'class-portrait', id: 'classes.amazon', subjectId: 1,
    subject: 'Amazon, athletic female warrior of the Askari',
    descriptors: 'tan leather and brass armor over linen, javelins on her back, curved buckler, braided dark hair, war-paint, jungle islands of Skovos behind, late afternoon sun, oil portrait' },
  { category: 'class-portrait', id: 'classes.assassin', subjectId: 2,
    subject: "Viz-Jaq'taar Assassin, hooded female killer",
    descriptors: 'dark cowl casting eye-shadow, twin claw blades (katar) crossed at chest, lithe leather harness with steel buckles, monastery of Travincal at dusk, embers, stealth pose' },
  { category: 'class-portrait', id: 'classes.barbarian', subjectId: 3,
    subject: 'Barbarian of the Northern Steppes, hulking warrior',
    descriptors: 'twin two-handed swords resting on shoulders, fur cloak and braided beard, tribal tattoos, scarred face, snowy ridges of Mount Arreat behind, howling wind' },
  { category: 'class-portrait', id: 'classes.druid', subjectId: 4,
    subject: 'Druid of the Scosglen wilds, bearded shapeshifter',
    descriptors: 'wolf-pelt mantle, gnarled oaken staff, raven on shoulder, bare chest with tribal woad, misty pine forest backdrop, faint green earth-magic glow' },
  { category: 'class-portrait', id: 'classes.necromancer', subjectId: 5,
    subject: 'Necromancer of Rathma, gaunt male summoner of the dead',
    descriptors: 'pale skin, hollow cheeks, bone-plated robes etched with sigils, bone wand wreathed in green soul-mist, skeletal minion silhouette behind, Eastern crypt arches' },
  { category: 'class-portrait', id: 'classes.paladin', subjectId: 6,
    subject: 'Zakarum Paladin, holy warrior',
    descriptors: 'gilded scale armor, kite shield bearing rayed sun sigil, war scepter raised, golden divine aura, stained-glass cathedral of Travincal behind, beams of light' },
  { category: 'class-portrait', id: 'classes.sorceress', subjectId: 7,
    subject: 'Zann Esu Sorceress, young female mage',
    descriptors: 'fitted blue and silver robe, raised hand crackling with arcane lightning, long auburn hair, ornate staff, cold mountain temple of Lut Gholein desert at dawn behind, swirling embers and frost' },

  // ---------- Monsters (subjectIds 1..6, bosses 100..101) ----------
  { category: 'monster', id: 'monsters.act1.fallen', subjectId: 1,
    subject: 'Fallen, small red demon imp of Act 1',
    descriptors: 'crimson skin, sharp horns, mangy loincloth, jagged scimitar, hunched goblin posture, yellow eyes, drool, Blood Moor grass at twilight' },
  { category: 'monster', id: 'monsters.act1.fallen-shaman', subjectId: 2,
    subject: 'Fallen Shaman (Carver Shaman), demonic imp witch-doctor',
    descriptors: 'tribal bone mask, feathered headdress, gnarled staff topped with skull, conjuring orange fireball in palm, ragged shaman robes, smoldering campfire at night' },
  { category: 'monster', id: 'monsters.act1.quill-rat', subjectId: 3,
    subject: 'Quill Rat, oversized porcupine-rodent of the Cold Plains',
    descriptors: 'matted brown fur bristling with iron-tipped quills, beady red eyes, yellowed incisors, hunched feral stance, mossy underbrush, gray overcast light' },
  { category: 'monster', id: 'monsters.act1.zombie', subjectId: 4,
    subject: 'Zombie, shambling Tristram corpse',
    descriptors: 'rotting greenish flesh, exposed ribs, milky eyes, tattered peasant clothing, jaw hanging loose, outstretched grasping hands, foggy graveyard, moonlight' },
  { category: 'monster', id: 'monsters.act1.bone-warrior', subjectId: 5,
    subject: 'Skeleton Warrior risen in the Burial Grounds',
    descriptors: 'bleached yellowed bones, rusted iron helm and pitted scimitar, kite shield with peeling paint, faint green necrotic glow in eye sockets, cobwebbed crypt' },
  { category: 'monster', id: 'monsters.act1.dark-stalker', subjectId: 6,
    subject: 'Corrupt Rogue, fallen Sister of the Sightless Eye',
    descriptors: 'pale tainted female warrior, leather armor stained black, eyes blackened with corruption, twin curved daggers, torn red sash, stone monastery corridor lit by torches' },
  { category: 'monster', id: 'bosses.act1.blood-raven', subjectId: 101,
    subject: 'Blood Raven, fallen Rogue captain risen as undead',
    descriptors: 'corrupted female archer, glowing red eyes, draconic longbow drawn, tattered Sisterhood armor, surrounded by raised zombies in Burial Grounds, blood-red moonlight' },
  { category: 'monster', id: 'bosses.act1.andariel', subjectId: 100,
    subject: 'Andariel, Maiden of Anguish, lesser evil',
    descriptors: 'demoness with twisted feminine torso, four bladed scorpion-like arms, long matted hair, poisonous green drool, infernal red catacomb chamber, sulfur fog' },

  // ---------- Item icons (subjectIds 3..13; shako=1 already done) ----------
  { category: 'item-icon', id: 'items.unique.stone-of-jordan', subjectId: 3,
    subject: 'Stone of Jordan unique ring',
    descriptors: 'plain heavy gold band set with a single large luminous blue sapphire, faint sky-blue arcane glow, ancient runic inscription' },
  { category: 'item-icon', id: 'items.unique.windforce', subjectId: 4,
    subject: 'Windforce, unique hydra bow',
    descriptors: 'long curved composite bow, dark lacquered horn limbs, silver-wrapped grip, faint pale-blue wind aura streaming around the string, etched feather motifs' },
  { category: 'item-icon', id: 'items.unique.buriza-do-kyanon', subjectId: 5,
    subject: 'Buriza-Do Kyanon, unique ballista crossbow',
    descriptors: 'heavy steel crossbow with frosted cyan ice crystals along the prod, dark wooden stock, brass fittings, faint cold mist drifting from the bolt channel' },
  { category: 'item-icon', id: 'items.unique.lightsabre', subjectId: 6,
    subject: 'Lightsabre, unique phase blade',
    descriptors: 'slender straight one-handed sword, blade radiating crackling pale-yellow lightning energy, polished silver guard with lion-head pommel, leather-wrapped grip' },
  { category: 'item-icon', id: 'items.unique.grandfather', subjectId: 7,
    subject: 'The Grandfather, unique colossus blade',
    descriptors: 'enormous two-handed greatsword, broad polished steel blade etched with ancient runes, gold cross guard, ruby in pommel, regal weight, faint warm aura' },
  { category: 'item-icon', id: 'items.unique.wizardspike', subjectId: 8,
    subject: 'Wizardspike, unique bone knife',
    descriptors: 'narrow needle-like dagger of pale ivory bone, sapphire set in gilded crossguard, faint blue arcane spark at the tip, ornate filigree' },
  { category: 'item-icon', id: 'items.unique.andariels-visage', subjectId: 9,
    subject: "Andariel's Visage, unique demonhead helm",
    descriptors: 'sculpted demoness face mask of darkened bronze, hollow snarling mouth, jagged teeth, long stringy black hair, faint green poison ichor dripping' },
  { category: 'item-icon', id: 'items.unique.arreats-face', subjectId: 10,
    subject: "Arreat's Face, unique slayer guard barbarian helm",
    descriptors: 'fierce horned bull-skull helm, weathered ivory bone, twin curved black horns, leather and fur trim, totemic tribal etchings, faint warm aura' },
  { category: 'item-icon', id: 'items.unique.deaths-touch', subjectId: 11,
    subject: "Death's Touch, unique war sword (Death's Disguise set piece)",
    descriptors: 'ornate one-handed war sword, blackened steel blade with skull etchings, bone-white grip, twin skull pommel, faint sickly green deathly aura' },
  { category: 'item-icon', id: 'items.unique.tal-rasha-helm', subjectId: 12,
    subject: "Tal Rasha's Horadric Crest, unique death mask",
    descriptors: 'ancient brass funerary face-mask, beaten and pitted, set with a single ruby in forehead, Horadric sigils etched along the rim, faint amber glow' },
  { category: 'item-icon', id: 'items.unique.herald-of-zakarum', subjectId: 13,
    subject: 'Herald of Zakarum, unique gilded shield',
    descriptors: 'tall gilded kite shield embossed with the rayed sun of Zakarum, gold leaf with deep red lacquer field, ornate filigree edges, faint holy light glow' },

  // ---------- Zone art (subjectIds 1, 100, 200, 300, 400) ----------
  { category: 'zone-art', id: 'zones.act1.rogue-encampment', subjectId: 1,
    subject: 'Rogue Encampment outside the monastery',
    descriptors: 'wooden palisade ring, glowing campfires, Sisterhood banners, stormy dusk sky, dark forest beyond, distant monastery silhouette on a hill' },
  { category: 'zone-art', id: 'zones.act2.lut-gholein', subjectId: 100,
    subject: 'Lut Gholein, jewel of the desert at sunset',
    descriptors: 'sandstone domes and minarets, palm trees, harbor with dhows, golden hour light, dunes beyond, distant mesa with the Arcane Sanctuary floating in the haze' },
  { category: 'zone-art', id: 'zones.act3.kurast-docks', subjectId: 200,
    subject: 'Kurast Docks, ruined jungle port',
    descriptors: 'rotting wooden piers, overgrown stone temple ruins beyond, dense Kehjistan jungle, humid mist, broken Zakarum statues, overcast green-tinted light' },
  { category: 'zone-art', id: 'zones.act4.pandemonium-fortress', subjectId: 300,
    subject: 'Pandemonium Fortress overlooking the Plains of Despair',
    descriptors: 'enormous black basalt citadel jutting from a chasm, infernal red sky, bridges of bone, rivers of lava far below, swirling souls, oppressive scale' },
  { category: 'zone-art', id: 'zones.act5.harrogath', subjectId: 400,
    subject: 'Harrogath, last barbarian bastion on Mount Arreat',
    descriptors: 'walled stone village clinging to a snowy mountain ledge, smoking forges, ancient totems, blizzard winds, looming dark peak above, dim grey daylight' },
];

function run(args) {
  return new Promise((res, rej) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], { cwd: REPO_ROOT, stdio: 'inherit' });
    child.on('exit', (code) => code === 0 ? res() : rej(new Error(`exit ${code}`)));
  });
}

async function withRetry(args, label) {
  const delays = [0, 5000, 15000];
  let lastErr;
  for (let i = 0; i < delays.length; i++) {
    if (delays[i]) await new Promise(r => setTimeout(r, delays[i]));
    try {
      console.log(`\n=== [${label}] attempt ${i+1} ===`);
      await run(args);
      return true;
    } catch (e) {
      lastErr = e;
      console.error(`[${label}] failed: ${e.message}`);
    }
  }
  console.error(`[${label}] GIVING UP after 3 attempts`);
  return false;
}

const onlyCat = process.argv[2]; // optional filter
const results = { ok: [], failed: [] };
for (const j of jobs) {
  if (onlyCat && j.category !== onlyCat) continue;
  const args = [
    '--category', j.category,
    '--id', j.id,
    '--subjectId', String(j.subjectId),
    '--subject', j.subject,
    '--descriptors', j.descriptors,
  ];
  const ok = await withRetry(args, `${j.category}/${j.id}`);
  if (ok) results.ok.push(j.id); else results.failed.push(j.id);
}

console.log('\n========== BATCH SUMMARY ==========');
console.log(`OK     (${results.ok.length}):`);
for (const id of results.ok) console.log(`  ✓ ${id}`);
console.log(`FAILED (${results.failed.length}):`);
for (const id of results.failed) console.log(`  ✗ ${id}`);
process.exit(results.failed.length ? 1 : 0);
