#!/usr/bin/env node
/**
 * Art Director — Batch 2 driver.
 *
 * Generates the second wave of art assets:
 *   - Generic item base-type icons (P1, blocks UI elsewhere)
 *   - Act 1 town NPC portraits (P2; reuses class-portrait preset, ids namespaced "npcs.*")
 *   - Act 2-5 signature monsters (P3)
 *   - Act 2-5 end bosses (P3, must-have)
 *
 * Skill icons (P4) are intentionally deferred — they require a brand-new
 * `skill-icon` category preset, which is a meta-design change and needs producer
 * sign-off per the art-director rules.
 *
 * Usage:
 *   node scripts/art-batch2.mjs                # all jobs
 *   node scripts/art-batch2.mjs item-icon      # one category only
 *   node scripts/art-batch2.mjs --only items.base.sword  # one job
 */
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SCRIPT = resolve(REPO_ROOT, '.github/skills/image-gen/scripts/image-gen.mjs');

const jobs = [
  // =========================================================
  // PRIORITY 1 — Generic item base-type icons (subjectIds 500..518)
  //   Neutral, rarity-agnostic plain version of each slot. Subjects
  //   intentionally describe a humble, weathered, non-magical item —
  //   if any glow is allowed it's faint and grey-blue.
  // =========================================================
  { category: 'item-icon', id: 'items.base.sword', subjectId: 500,
    subject: 'plain one-handed iron longsword, generic equipment icon',
    descriptors: 'straight double-edged steel blade, simple cross guard, leather-wrapped grip, brass pommel, weathered metal, no engraving, museum still life on near-black void, no hand, no wielder' },
  { category: 'item-icon', id: 'items.base.axe', subjectId: 501,
    subject: 'plain one-handed war axe, generic equipment icon',
    descriptors: 'crescent steel axe head, oak haft bound with iron rivets, slight nicks on the edge, no engraving, weathered, museum still life on near-black void, no hand, no wielder' },
  { category: 'item-icon', id: 'items.base.mace', subjectId: 502,
    subject: 'plain flanged steel mace, generic equipment icon',
    descriptors: 'six-flanged steel head, riveted iron haft, leather grip, simple pommel ring, weathered metal, no engraving, museum still life on near-black void, no hand, no wielder' },
  { category: 'item-icon', id: 'items.base.bow', subjectId: 503,
    subject: 'plain wooden hunting longbow with bowstring, generic equipment icon',
    descriptors: 'curved yew limbs, leather-wrapped grip, taut hemp string, no arrow, weathered wood grain, no engraving, museum still life on near-black void, no hand, no wielder' },
  { category: 'item-icon', id: 'items.base.staff', subjectId: 504,
    subject: 'plain gnarled wooden quarterstaff, generic equipment icon',
    descriptors: 'tall knotted oak shaft, iron-shod tips, leather grip wrap at center, no gem, no glow, weathered wood, museum still life on near-black void, no hand, no wielder' },
  { category: 'item-icon', id: 'items.base.dagger', subjectId: 505,
    subject: 'plain steel dagger, generic equipment icon',
    descriptors: 'short straight double-edged blade, simple cross guard, dark leather-wrapped hilt, brass pommel, weathered metal, no engraving, museum still life on near-black void, no hand, no wielder' },
  { category: 'item-icon', id: 'items.base.shield', subjectId: 506,
    subject: 'plain wooden round buckler shield, generic equipment icon',
    descriptors: 'circular oak boards, riveted iron rim, central iron boss, leather strap, scratched and battle-worn, no heraldry, museum still life on near-black void' },
  { category: 'item-icon', id: 'items.base.helm', subjectId: 507,
    subject: 'plain iron skullcap helm, generic equipment icon',
    descriptors: 'rounded riveted steel cap, simple nose-guard, dented and weathered, no plume, no engraving, leather chin strap, museum still life on near-black void' },
  { category: 'item-icon', id: 'items.base.armor', subjectId: 508,
    subject: 'plain leather and mail body armor cuirass, generic equipment icon',
    descriptors: 'studded brown leather over riveted chain mail torso, brass buckles, weathered straps, hung as if on a tailor mannequin but no figure visible, museum still life on near-black void' },
  { category: 'item-icon', id: 'items.base.gloves', subjectId: 509,
    subject: 'plain leather and steel gauntlets, generic equipment icon',
    descriptors: 'pair of weathered brown leather gloves with riveted steel knuckle plates, brass buckles at wrist, scuffed metal, museum still life on near-black void, empty gloves no hands inside' },
  { category: 'item-icon', id: 'items.base.belt', subjectId: 510,
    subject: 'plain leather warrior belt with potion loops, generic equipment icon',
    descriptors: 'wide brown leather belt, brass buckle, four small empty potion loops, riveted edges, weathered, museum still life on near-black void' },
  { category: 'item-icon', id: 'items.base.boots', subjectId: 511,
    subject: 'plain pair of leather travel boots, generic equipment icon',
    descriptors: 'pair of mid-calf brown leather boots, scuffed soles, brass buckles, hammered iron toe caps, weathered, no feet inside, museum still life on near-black void' },
  { category: 'item-icon', id: 'items.base.ring', subjectId: 512,
    subject: 'plain silver band ring, generic equipment icon',
    descriptors: 'simple unadorned polished silver ring, no gem, faint cool sheen, hovering at slight angle, museum still life on near-black void' },
  { category: 'item-icon', id: 'items.base.amulet', subjectId: 513,
    subject: 'plain bronze pendant amulet on a chain, generic equipment icon',
    descriptors: 'circular bronze medallion with simple sunburst etching, dark cord chain, weathered patina, hanging straight as if displayed, museum still life on near-black void' },
  { category: 'item-icon', id: 'items.base.potion-health', subjectId: 514,
    subject: 'red health potion in a glass flask',
    descriptors: 'small round glass flask, glowing crimson liquid, cork stopper sealed with wax, faint warm red inner light, slight bubbles, museum still life on near-black void' },
  { category: 'item-icon', id: 'items.base.potion-mana', subjectId: 515,
    subject: 'blue mana potion in a glass flask',
    descriptors: 'small round glass flask, glowing sapphire-blue liquid, cork stopper sealed with wax, faint cool inner light, swirling motes, museum still life on near-black void' },
  { category: 'item-icon', id: 'items.base.rune', subjectId: 516,
    subject: 'a single ancient stone rune tablet, generic rune icon',
    descriptors: 'small flat fragment of weathered grey stone, glowing orange-red Horadric sigil etched on its face, faint ember light, chipped edges, museum still life on near-black void' },
  { category: 'item-icon', id: 'items.base.gem', subjectId: 517,
    subject: 'a single faceted gemstone, generic gem icon',
    descriptors: 'multifaceted clear quartz crystal, refracting cool internal light, slight rainbow caustics, suspended in the void, museum still life on near-black void' },
  { category: 'item-icon', id: 'items.base.scroll', subjectId: 518,
    subject: 'rolled parchment scroll bound with red ribbon, generic scroll icon',
    descriptors: 'aged cream-colored parchment scroll partially unrolled, dark red wax seal, thin red ribbon tie, faint Horadric sigil visible, weathered edges, museum still life on near-black void' },

  // =========================================================
  // PRIORITY 2 — Act 1 NPC portraits (subjectIds 50..53)
  //   Reuses class-portrait preset (no new category yet — NPC bust
  //   composition is close enough to class portrait to share the
  //   look). Files land in class-portraits/ folder, ids namespaced.
  // =========================================================
  { category: 'class-portrait', id: 'npcs.act1.akara', subjectId: 50,
    subject: 'Akara, elder priestess of the Sightless Eye, Act 1 healer NPC',
    descriptors: 'kindly weathered older woman, deep blue priestess robes with silver trim, grey hair drawn back, gentle wise eyes, hands clasped, soft braziers and Sisterhood banners behind, warm temple light, painterly bust portrait' },
  { category: 'class-portrait', id: 'npcs.act1.charsi', subjectId: 51,
    subject: 'Charsi, the Rogue Encampment blacksmith, Act 1 NPC',
    descriptors: 'strong young woman, muscular shoulders and forearms, soot-smudged thick leather apron over linen, hammer resting on shoulder, red hair tied back, freckled cheeks, glowing forge embers behind, sparks rising, painterly bust portrait' },
  { category: 'class-portrait', id: 'npcs.act1.gheed', subjectId: 52,
    subject: 'Gheed, the traveling merchant of the Rogue Encampment, Act 1 NPC',
    descriptors: 'fat balding middle-aged man, sly greedy grin, gold tooth, heavy crimson cloak trimmed with mangy fur, fingers covered in cheap rings, coin pouch on belt, caravan wagon and lantern behind in the dusk, painterly bust portrait' },
  { category: 'class-portrait', id: 'npcs.act1.kashya', subjectId: 53,
    subject: 'Kashya, captain of the Sisters of the Sightless Eye, Act 1 NPC',
    descriptors: 'stern auburn-haired warrior woman, hard scarred face, studded leather armor with red sash, longbow slung across back, quiver of arrows, arms crossed, palisade and rogue archers blurred behind at dusk, painterly bust portrait' },

  // =========================================================
  // PRIORITY 3a — Act 2-5 signature monsters
  // =========================================================
  { category: 'monster', id: 'monsters.act2.sand-raider', subjectId: 20,
    subject: 'Sand Raider, hulking desert demon of Act 2',
    descriptors: 'four-armed muscular demon, rust-red leathery hide, twin pairs of curved scimitars, tusked snarling face, ragged loincloth and bone amulets, sandstorm and ruined sandstone tomb pillars behind, ochre desert dusk light' },
  { category: 'monster', id: 'monsters.act2.mummy', subjectId: 21,
    subject: 'Greater Mummy, embalmed Horadric undead of Act 2',
    descriptors: 'tall withered embalmed corpse wrapped in yellowed linen bandages, gilded death mask, gaunt clawed hands, faint sickly green ichor seeping through wraps, sarcophagus chamber by torchlight, dusty motes' },
  { category: 'monster', id: 'monsters.act2.beetle', subjectId: 22,
    subject: 'giant Sand Beetle of Act 2 desert',
    descriptors: 'enormous segmented dark-chitin beetle, bulbous abdomen crackling with arcs of yellow lightning, mandibles dripping, six clawed legs, scuttling over cracked sandstone slabs, dust haze, low desert sun' },
  { category: 'monster', id: 'monsters.act3.flayer', subjectId: 30,
    subject: 'Flayer, blowgun-wielding jungle pygmy demon of Act 3',
    descriptors: 'small wiry purple-skinned imp, tribal bone fetishes around neck, sharpened blowgun raised to lips, jagged teeth, feral grin, dense Kehjistan jungle ferns and vines behind, humid green light filtering through canopy' },
  { category: 'monster', id: 'monsters.act3.zakarum-zealot', subjectId: 31,
    subject: 'Zakarum Zealot, corrupted holy warrior of Act 3',
    descriptors: 'crazed armored fanatic, tarnished gilded scale armor, twisted sun sigil tabard stained dark, gripping a flanged mace, bloodshot fevered eyes, foaming mouth, ruined Travincal temple pillars and dripping vines behind' },
  { category: 'monster', id: 'monsters.act3.thorned-hulk', subjectId: 32,
    subject: 'Thorned Hulk, lumbering plant-demon of Act 3',
    descriptors: 'massive hunched brute with bark-like grey-green hide bristling with long iron-hard thorns, knobby clublike fists, beady black eyes, mossy overgrowth, jungle swamp at dusk, fireflies' },
  { category: 'monster', id: 'monsters.act4.doom-knight', subjectId: 40,
    subject: 'Doom Knight, fallen hellfire crusader of Act 4',
    descriptors: 'tall armored undead knight, blackened cracked plate armor seeping wisps of orange flame, hollow helm with two glowing red eye-points, two-handed greatsword wreathed in embers, bridge of bone over lava behind, infernal red sky' },
  { category: 'monster', id: 'monsters.act4.venom-lord', subjectId: 41,
    subject: 'Venom Lord, four-armed poison demon of Act 4',
    descriptors: 'tall sinewy demon with sickly green-black scaled skin, four arms each ending in dripping clawed talons, vestigial wings, fanged maw drooling acid, hellish basalt cliffs and toxic green mist behind, infernal embers' },
  { category: 'monster', id: 'monsters.act5.death-mauler', subjectId: 50,
    subject: 'Death Mauler, four-armed mountain ape demon of Act 5',
    descriptors: 'hulking quadrupedal ape-demon with thick blue-grey shaggy fur, four powerful arms with clawed fists, lower tusks, snarling face, snowy ridges of Mount Arreat behind, blizzard wind, grey daylight' },
  { category: 'monster', id: 'monsters.act5.frenzytaur', subjectId: 51,
    subject: 'Frenzytaur, minotaur barbarian-demon of Act 5',
    descriptors: 'massive bipedal bull-headed demon, dark brown fur, curved iron-banded horns, two-handed greataxe raised overhead, bare scarred torso, snowy mountain pass with broken siege weapons behind, overcast sky, blowing snow' },

  // =========================================================
  // PRIORITY 3b — End-of-act bosses (subjectIds already in registry)
  // =========================================================
  { category: 'monster', id: 'bosses.act2.duriel', subjectId: 200,
    subject: 'Duriel, Lord of Pain, lesser evil',
    descriptors: 'enormous bloated maggot-like demon lord, leathery armored grey-blue chitinous plates, twin curved scythe-like forelimbs, eyeless tusked maw drooling slime, frozen tomb chamber of Tal Rasha lit by braziers, frosted breath' },
  { category: 'monster', id: 'bosses.act3.mephisto', subjectId: 300,
    subject: 'Mephisto, Lord of Hatred, prime evil',
    descriptors: 'tall skeletal undead demon-lord, withered violet-grey skin clinging to bone, ribcage exposed, four-fingered claws crackling with deep blue lightning hatred, glowing white eyes, ruined Durance of Hate temple chamber with green torches, blood pool behind' },
  { category: 'monster', id: 'bosses.act4.diablo', subjectId: 400,
    subject: 'Diablo, Lord of Terror, prime evil',
    descriptors: 'towering crimson-skinned demon-lord, seven curved black horns crowning his head, glowing yellow eyes, fanged maw, spined back, clawed tail, hooved legs, lava chamber of Chaos Sanctuary with pentagram floor and infernal red light, embers swirling' },
  { category: 'monster', id: 'bosses.act5.baal', subjectId: 500,
    subject: 'Baal, Lord of Destruction, prime evil',
    descriptors: 'gaunt tall demon-lord with two extra tentacle-arms emerging from his back, sickly grey-green flesh, horned skull-like head, glowing orange eyes, gripping a spectral cleaver of destruction, Worldstone Chamber with cracked obsidian floor and amber arcane light, drifting ash' },
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

// CLI filtering
let onlyCat = null;
let onlyId = null;
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--only') onlyId = process.argv[++i];
  else if (!a.startsWith('--')) onlyCat = a;
}

const results = { ok: [], failed: [] };
for (const j of jobs) {
  if (onlyCat && j.category !== onlyCat) continue;
  if (onlyId && j.id !== onlyId) continue;
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

console.log('\n========== BATCH 2 SUMMARY ==========');
console.log(`OK     (${results.ok.length}):`);
for (const id of results.ok) console.log(`  ✓ ${id}`);
console.log(`FAILED (${results.failed.length}):`);
for (const id of results.failed) console.log(`  ✗ ${id}`);
process.exit(results.failed.length ? 1 : 0);
