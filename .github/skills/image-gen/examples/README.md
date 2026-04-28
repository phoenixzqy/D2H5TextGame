# image-gen examples

These are runnable examples. Run from the repo root.

```sh
# 1. Necromancer class portrait
npm run image-gen -- \
  --category class-portrait \
  --id classes.necromancer \
  --subjectId 5 \
  --subject "Necromancer, gaunt male, bone armor, summoner of the dead" \
  --descriptors "Rathma's chosen, gnarled bone wand, glowing green eyes, mist of unliving spirits, Eastern Sanctuary backdrop"

# 2. Andariel monster card
npm run image-gen -- \
  --category monster \
  --id bosses.act1.andariel \
  --subjectId 100 \
  --subject "Andariel, Maiden of Anguish" \
  --descriptors "demoness, four bladed arms, poison drool, twisted feminine torso, catacombs of Tristram"

# 3. Shako item icon
npm run image-gen -- \
  --category item-icon \
  --id items.unique.shako \
  --subjectId 1 \
  --subject "Harlequin Crest unique helm (Shako)" \
  --descriptors "weathered leather jester cap, gold trim, three small bells, faint magical aura"

# 4. Rogue Encampment zone art
npm run image-gen -- \
  --category zone-art \
  --id zones.act1.rogue-encampment \
  --subjectId 1 \
  --subject "Rogue Encampment outside the monastery" \
  --descriptors "wooden palisade, campfires, stormy dusk, dark forest beyond, distant monastery silhouette"

# 5. Title screen UI background
npm run image-gen -- \
  --category ui-background \
  --id ui.title-screen \
  --subjectId 1 \
  --subject "Sanctuary at dusk, brooding world map" \
  --descriptors "wide vista of mountains and ruined towers, blood moon, no characters, empty negative space in lower third"
```

To re-roll without overwriting the canonical asset, bump `--variant`:

```sh
npm run image-gen -- --category class-portrait --id classes.necromancer \
  --subjectId 5 --variant 1 \
  --subject "Necromancer..." --descriptors "..."
```

If art-director accepts `variant=1` over `variant=0`, update the
"accepted variant" column in `docs/art/seed-registry.md`.
