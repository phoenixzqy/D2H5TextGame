---
name: image-gen
description: Generate a styled image (class portrait, monster, item icon, UI background, zone art) by calling Pollinations.AI with a category preset from the project art style guide. Use whenever an agent needs new visual art for the D2 H5 text game. Outputs are deterministic given (category, subjectId, variant) and recorded in an append-only manifest. The art-director agent owns the style guide and seed registry; do not bypass it.
allowed-tools: shell
---

# image-gen Skill

This skill produces consistent on-style images for the D2 H5 text game by
delegating to the free **Pollinations.AI** endpoint. It does not invent
prompts on its own — every call must reference a category preset defined
in `docs/art/style-presets.json` (mirrored in human-readable form at
`docs/art/style-guide.md`).

## When to use
- Adding a new playable class → category `class-portrait`.
- Adding a new monster or boss → category `monster`.
- Adding a new unique / set / rune / gem → category `item-icon`.
- New menu, town, or inventory backdrop → category `ui-background`.
- Act / zone splash art → category `zone-art`.

## When NOT to use
- For UI iconography that is purely vector / informational
  (use SVG instead).
- For one-off mock-ups that won't ship — use a quick browser fetch
  rather than committing assets.
- Without art-director approval. Every request must carry a `subjectId`
  pre-allocated in `docs/art/seed-registry.md`.

## Inputs
| flag | required | notes |
|---|---|---|
| `--category` | yes | one of `class-portrait`, `monster`, `item-icon`, `ui-background`, `zone-art` |
| `--id` | yes | stable, namespaced kebab-case id (e.g. `classes.necromancer`, `bosses.act1.andariel`) |
| `--subject` | yes | the *thing* (e.g. `"Necromancer, master of bone and poison"`) |
| `--subjectId` | yes | integer from `seed-registry.md` for this id |
| `--descriptors` | no | extra free-form descriptors (lore, palette, pose) |
| `--variant` | no | re-roll counter; default `0` |
| `--force` | no | overwrite even if manifest already has this id+seed+prompt |
| `--dry-run` | no | print the URL and prompt; do not fetch |

## How style consistency is enforced
The skill prepends a **global preamble** and appends a **category style
suffix**, then sets the `negative_prompt` query parameter to a global +
category negative list. Model, image size, and seed-base are pinned per
category. The final seed is `seedBase + subjectId + variant*10000`, so
the same `(category, subjectId, variant)` deterministically reproduces.

You **cannot** override the global preamble, model, or size from the CLI.
If you think you need to, file a request with the art-director to update
the preset.

## Examples

```sh
# Necromancer class portrait (subjectId 5 from seed-registry.md)
node .github/skills/image-gen/scripts/image-gen.mjs \
  --category class-portrait \
  --id classes.necromancer \
  --subjectId 5 \
  --subject "Necromancer, gaunt male, bone armor, summoner of the dead" \
  --descriptors "Rathma's chosen, gnarled bone wand, glowing green eyes, mist of unliving spirits, Eastern Sanctuary backdrop"
```

```sh
# Andariel boss card
node .github/skills/image-gen/scripts/image-gen.mjs \
  --category monster \
  --id bosses.act1.andariel \
  --subjectId 100 \
  --subject "Andariel, Maiden of Anguish, lesser evil" \
  --descriptors "demoness, four bladed arms, poison drool, twisted feminine torso, catacombs of Tristram, infernal red light"
```

```sh
# Shako item icon
node .github/skills/image-gen/scripts/image-gen.mjs \
  --category item-icon \
  --id items.unique.shako \
  --subjectId 1 \
  --subject "Harlequin Crest unique helm (Shako)" \
  --descriptors "weathered leather jester cap, gold trim, three small bells, faint magical aura"
```

```sh
# Rogue Encampment splash
node .github/skills/image-gen/scripts/image-gen.mjs \
  --category zone-art \
  --id zones.act1.rogue-encampment \
  --subjectId 1 \
  --subject "Rogue Encampment outside the monastery" \
  --descriptors "wooden palisade, campfires, stormy dusk, dark forest beyond, distant monastery silhouette"
```

## Outputs
- PNG file under `public/assets/d2/generated/<category-folder>/<id>.png`
  (variants suffixed `.v1.png`, `.v2.png`, …).
- Append-only entry in `public/assets/d2/generated/manifest.json` with
  prompt, seed, model, dimensions, source URL, sha256, timestamp.

## Hard rules (also enforced by art-director)
1. Never commit a generated image without a corresponding manifest entry.
2. Never edit historical manifest entries — append only.
3. Never invent a `subjectId`. Allocate it in `seed-registry.md` first.
4. Don't bypass the global preamble / negative prompt.
5. If 3 variants in a row are rejected, escalate to producer — the preset
   itself probably needs tuning.

## Failure modes
- **HTTP 5xx / timeout from Pollinations** → retry with the same args
  later (manifest cache prevents duplicate generation on success).
- **Image too small (<1KB)** → likely an error page; the skill exits
  non-zero. Inspect the URL printed in the log.
- **Cache hit** → skill exits zero without fetching. Use `--force` to
  override (rare; usually you want a new variant instead).

## Reference
- Style guide: [`docs/art/style-guide.md`](../../../docs/art/style-guide.md)
- Seed registry: [`docs/art/seed-registry.md`](../../../docs/art/seed-registry.md)
- Style presets (machine-readable): [`docs/art/style-presets.json`](../../../docs/art/style-presets.json)
- Pollinations API docs: <https://pollinations.ai/docs#image-generation-api>
