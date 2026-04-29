# Uniques — Base Mapping Reference

This document records how each unique item in `src/data/items/uniques.json`
maps onto an existing item base in `src/data/items/bases.json`.

The base catalogue is intentionally small (~70 entries) and does not yet
contain every Diablo II: LoD weapon/armor base. Where the canonical D2
base does not exist in our catalogue, we map the unique to the
**closest-fit** base — same equipment slot, similar tier (reqLevel) — and
flag it with `(closest-fit)`.

This file is a reference for content reviewers. It also serves as the
to-do list for future expansions of `bases.json` (each `(closest-fit)`
mapping is a candidate for a future "real" base).

## Slot tiers (current bases)

| Slot | Bases (reqLevel) |
|------|------------------|
| Helm    | Cap(1), Skull Cap(5), War Hat(22), Casque(28), Armet(45), Giant Conch(55) |
| Chest   | Quilted(1), Leather(6), Light(10), Chain Mail(25), Breast Plate(32), Heavy(40), Dusk Shroud(50), Archon Plate(60) |
| Gloves  | Leather(1), Heavy(7), Chain(24), Light Gauntlets(30), Vampirebone(48), Bramble Mitts(58) |
| Boots   | Boots(1), Heavy(7), Chain(24), Light Plated(30), Demonhide(48), Myrmidon Greaves(58) |
| Belt    | Sash(1), Light(7), Heavy(22), Plated(30), Demonhide(48), Mithril Coil(58) |
| Shield  | Buckler(1), Kite(8), Aegis(25), Dragon(35), Monarch(50), Sacred Targe(60) |
| 1H sword| Short(1), Scimitar(8), Long(22), War(32), Phase(50), Legend(60) |
| 2H wpn  | Two-Handed Sword(1), Great Axe(8), War Pike(24), Giant Thresher(35), Colossus Blade(52), Thunder Maul(62) |
| Ring    | Iron(1), Silver(10), Jade(25), Amber(35), Obsidian(50), Zircon(60) |
| Amulet  | Tin(1), Brass(10), Silver(25), Jade(35), Obsidian(50), Zircon(60) |
| Bow     | Bow(10) — *single tier* |
| Crossbow| Crossbow(15) — *single tier* |
| Polearm | Polearm(20) — *single tier* |
| Wand    | Wand(5) — *single tier* |
| Scepter | Scepter(15) — *single tier* |
| Mace    | Mace(10) — *single tier* |
| Axe     | Axe(12) — *single tier* |

## Closest-fit families

Whenever a D2 unique's canonical base is not listed below, we map it to
the closest existing base. These families collapse multiple D2 base types
onto a single shared base in our data:

| D2 base family | Mapped to | Notes |
|----------------|-----------|-------|
| Daggers (kris, dirk, blade) | `wp1h-*` (closest reqLevel) | No dagger base yet |
| Throwing weapons | (skipped) | No base; quivers also skipped |
| Spears, javelins, lances (Amazon) | `weapon-polearm` | Single polearm tier |
| Brandistocks, voulges, halberds, scythes | `wp2h-*` (closest reqLevel) | No exotic-pole bases yet |
| Druid pelts | `helm-*` | Class-specific base missing |
| Necromancer shrunken heads / trophies | `helm-*` (or `weapon-wand` for orb-style) | Class-specific |
| Barbarian primal helms | `helm-*` | Class-specific |
| Paladin auric / sacred shields | `sh-*` | Sacred Targe is closest |
| Sorceress orbs | `weapon-wand` | No orb base |
| Assassin claws | `wp1h-*` | No claw base |
| Two-handed maces / hammers / mauls | `wp2h-thunder-maul` or `wp2h-colossus-blade` | Closest two-hand bases |
| Charms, jewels | (skipped) | No base; rule #1 forbids inventing bases |

## Skipped (no suitable base)

The following canonical D2 LoD uniques are intentionally **not** in the
dataset because no reasonable base exists yet:

- **All quiver uniques** — no quiver base.
- **All charm uniques** — no charm base (no inventory grid yet).
- **All jewel uniques** — no jewel base.
- **Throwing weapon uniques** (Deathbit, Lacerator-thrown, Demon's Arch,
  Gimmershred, etc.) — no throwing base.

When `bases.json` grows to include any of the above, add the
corresponding uniques in a follow-up commit and remove that line from
this section.

## Closest-fit unique → base mappings

The following uniques are present in `uniques.json` but use a
closest-fit base because their canonical D2 base is missing. Each line
is `unique-id → canonical D2 name (canonical D2 base) → mapped baseId`.

### Daggers / dirks → 1H swords (closest-fit)

- `items/unique/the-diggler` → The Diggler (Dimensional Blade) → `items/base/wp1h-war-sword` *(closest-fit)*
- `items/unique/spectral-shard` → Spectral Shard (Blade) → `items/base/wp1h-long-sword` *(closest-fit)*
- `items/unique/jade-tan-do` → The Jade Tan Do (Kris) → `items/base/wp1h-long-sword` *(closest-fit)*
- `items/unique/black-cleft` → Black Cleft (Dirk) → `items/base/wp1h-long-sword` *(closest-fit)*
- `items/unique/skewer-of-krintiz` → Skewer of Krintiz (Cinquedeas) → `items/base/wp1h-scimitar` *(closest-fit)*

### Sorceress orbs → wands (closest-fit)

- `items/unique/eschuta-temper` → Eschuta's Temper (Eldritch Orb) → `items/base/weapon-wand` *(closest-fit)*
- `items/unique/death-fathom` → Death's Fathom (Dimensional Shard) → `items/base/weapon-wand` *(closest-fit)*
- `items/unique/boneshade` → Boneshade (Lich Wand) → `items/base/weapon-wand` *(closest-fit)*
- `items/unique/the-oculus-orb` → The Oculus (Swirling Crystal) → `items/base/weapon-wand` *(closest-fit)*
- `items/unique/homunculus-orb` → Homunculus (orb variant) → `items/base/weapon-wand` *(closest-fit)*
- `items/unique/torch-of-iros`, `maelstrom`, `gravenspine`, `ume-lament`, `suicide-branch`, `carin-shard`, `ondal-wisdom` → wand uniques whose canonical base (Burnt Wand / Petrified Wand / Tomb Wand / Lich Wand) is collapsed to `items/base/weapon-wand` *(closest-fit)*

### Druid pelts → helms (closest-fit)

- `items/unique/cerebus-bite` → Cerebus' Bite (Blood Spirit) → `items/base/helm-giant-conch` *(closest-fit)*
- `items/unique/ravenlore` → Ravenlore (Sky Spirit) → `items/base/helm-giant-conch` *(closest-fit)*
- `items/unique/spirit-keeper` → Spirit Keeper (Totemic Mask) → `items/base/helm-giant-conch` *(closest-fit)*
- `items/unique/jalal-mane` → Jalal's Mane (Totemic Mask) → `items/base/helm-armet` *(closest-fit)*
- `items/unique/wolfhowl` → Wolfhowl (Alpha Helm / Fury Visor) → `items/base/helm-giant-conch` *(closest-fit)*

### Necromancer shrunken heads → helms / wands

- `items/unique/homunculus-helm` → Homunculus (Hierophant Trophy) → `items/base/helm-monarch`-equivalent → mapped to `items/base/helm-giant-conch` *(closest-fit)*
- `items/unique/blackhand-key` → Blackhand Key (Trophy) → `items/base/helm-armet` *(closest-fit)*
- `items/unique/blackhand-key-2` → Blackhand Key (greater) → `items/base/weapon-wand` *(closest-fit; canonical is a Lich Wand variant)*
- `items/unique/darkforce-spawn` → Darkforce Spawn (Bloodlord Skull) → `items/base/helm-giant-conch` *(closest-fit)*

### Barbarian primal helms → helms (closest-fit)

- `items/unique/arreats-face-uniq` → Arreat's Face (Slayer Guard) → `items/base/helm-giant-conch` *(closest-fit)*
- `items/unique/halaberd-reign-2` → Halaberd's Reign (Conqueror Crown) → `items/base/helm-giant-conch` *(closest-fit)*
- `items/unique/demonhorn-edge-2` → Demonhorn's Edge (Destroyer Helm) → `items/base/helm-giant-conch` *(closest-fit)*
- `items/unique/gore-burnt-skull` → Goreburnt Skull (Bone Helm) → `items/base/helm-giant-conch` *(closest-fit)*

### Paladin auric / sacred shields → shields (closest-fit)

- `items/unique/herald-of-zakarum` → Herald of Zakarum (Gilded Shield) → `items/base/sh-dragon-shield` *(closest-fit)*
- `items/unique/dragonscale` → Dragonscale (Royal Shield) → `items/base/sh-sacred-targe` *(closest-fit)*
- `items/unique/alma-negra` → Alma Negra (Sacred Rondache) → `items/base/sh-sacred-targe` *(closest-fit)*

### Necromancer voodoo shields

- `items/unique/darkforce-spawn-shield` → Darkforce Spawn (Bone Visage) → `items/base/sh-dragon-shield` *(closest-fit)*
- `items/unique/boneflame-shield` → Boneflame (Succubus Skull) → `items/base/sh-sacred-targe` *(closest-fit)*

### Assassin claws → 1H swords (closest-fit)

- `items/unique/bartuc-cut-throat` → Bartuc's Cut-Throat (Greater Talons) → `items/base/wp1h-war-sword` *(closest-fit)*
- `items/unique/jade-talon` → Jade Talon (Wrist Sword) → `items/base/wp1h-phase-blade` *(closest-fit)*
- `items/unique/firelizard-talon` → Firelizard's Talons (Feral Claws) → `items/base/wp1h-phase-blade` *(closest-fit)*
- `items/unique/shadow-killer` → Shadow Killer (Battle Cestus) → `items/base/wp1h-phase-blade` *(closest-fit)*

### Amazon javelins / spears → polearm (closest-fit)

- `items/unique/titan-revenge` → Titan's Revenge (Ceremonial Javelin) → `items/base/weapon-polearm` *(closest-fit)*
- `items/unique/thunderstroke` → Thunderstroke (Matriarchal Javelin) → `items/base/weapon-polearm` *(closest-fit)*
- `items/unique/lycanders-flank` → Lycander's Flank (Ceremonial Pike) → `items/base/weapon-polearm` *(closest-fit)*

### Two-handed exotic poles → 2H weapons / polearm (closest-fit)

- `items/unique/the-meatscraper`, `blackleach-blade`, `athulua-rule` → Two-handed sword variants → `items/base/wp2h-*` *(closest-fit)*
- `items/unique/hone-sundan`, `spire-of-honor`, `the-battlebranch`, `pierre-tombale-couant` → Yari / Halberd / Voulge → mapped to `items/base/wp2h-*` *(closest-fit)*
- `items/unique/woestave` → Woestave (Halberd) → `items/base/wp2h-war-pike` *(closest-fit)*
- `items/unique/messerschmidt-reaver` → Messerschmidt's Reaver (Cryptic Axe) → `items/base/wp2h-colossus-blade` *(closest-fit)*
- `items/unique/the-grim-reaper` → The Grim Reaper (Thresher) → `items/base/wp2h-thunder-maul` *(closest-fit)*

### Two-handed mauls / hammers → 2H mace family (closest-fit)

- `items/unique/the-cranium-basher` → The Cranium Basher (Thunder Maul) → `items/base/weapon-mace` *(closest-fit; canonical is a 2H maul, but our `weapon-mace` is the only mace base)*
- `items/unique/the-cranium-basher-greater`, `nords-tenderizer`, `earthshifter`, `knell-striker-2` → 2H mace variants → `items/base/weapon-mace` *(closest-fit)*

### Bows (collapsed to single bow base)

All bow uniques (Pluckeye, Witherstring, Raven Claw, Rogue's Bow,
Stormstrike, Wizendraw, Hellclap, Blastbark, Skystrike, Riphook, Kuko
Shakaku, Endlesshail, Widowmaker, Goldstrike Arch, Eaglehorn, Windforce,
Lycander's Aim) map to `items/base/weapon-bow` *(closest-fit; only one
bow tier exists)*.

### Crossbows (collapsed to single crossbow base)

All crossbow uniques (Doomslinger, Langer Briser, Pus Spitter,
Buriza-Do Kyanon variant, Hellrack, Demon Machine) map to
`items/base/weapon-crossbow` *(closest-fit; only one crossbow tier
exists)*.

## Notes on de-duplication

The previous dataset contained colliding ids for the same canonical D2
item. The following pairs were merged — we kept the id with the
possessive `-s` suffix (or the more descriptive id) and removed the
sibling:

| Kept | Dropped |
|------|---------|
| `items/unique/verdungos-hearty` | `items/unique/verdungo-cord` |
| `items/unique/arachnids-mesh`   | `items/unique/arachnid-mesh` |
| `items/unique/gore-riders`      | `items/unique/gore-rider` |
| `items/unique/thundergods-vigor`| `items/unique/thundergod-vigor` |
| `items/unique/tyraels-might`    | `items/unique/tyrael-might` |
| `items/unique/lavagout`         | `items/unique/lava-gout` |
| `items/unique/bul-kathos-wedding-band` | `items/unique/bul-kathos` |
| `sets/aldurs-watchtower`        | `sets/aldur-watchtower` |
| `sets/griswolds-legacy`         | `sets/griswold-legacy` |
| `sets/natalyas-odium`           | `sets/natalya-odium` |
| `sets/trang-ouls-avatar`        | `sets/trang-oul-avatar` |

No external code or doc references the dropped ids — all references in
the repository are to the canonical (`-s`) form, so the removal is safe.

## Notes on flavor text

All `flavor` strings in `uniques.json` are short (≤120 chars) and
**original prose** authored for this project. They are *not* verbatim
copies of D2 / Blizzard flavor strings. Stat numbers are factual
(LoD 1.14 most-commonly-cited values where readily known); item names
are the canonical D2 names exactly.
