# Generated Assets

All images in this folder and its subfolders are **AI-generated** via
[Pollinations.AI](https://pollinations.ai) by the `image-gen` skill,
under the supervision of the `art-director` agent.

## Folder layout
- `class-portraits/` — playable class portrait art
- `monsters/` — bestiary cards (mobs and bosses)
- `item-icons/` — inventory icons (uniques, runes, gems, …)
- `ui-backgrounds/` — full-screen UI backdrops
- `zone-art/` — act / zone splash art
- `manifest.json` — append-only record of every generated asset
  (prompt, seed, model, dimensions, source URL, sha256, timestamp).
  This is the source of truth for reproducibility and licensing audit.

## Reproducing an asset
The skill is deterministic given the same `(category, subjectId, variant)`
because the seed is computed from the style guide. To regenerate:

```sh
npm run image-gen -- --category <cat> --id <id> --subject "<subject>" --descriptors "<descriptors>"
```

If an entry already exists in `manifest.json` with the same id + prompt +
seed, the skill skips regeneration and exits successfully.

## Style consistency
See `docs/art/style-guide.md` and `docs/art/seed-registry.md`. The
art-director agent gates every new generation request.

## Release blocker (private → public)
This project is private and non-commercial. If/when we ever go public,
**every entry in `manifest.json` must be audited** for prompt content and
service licensing. Do not delete `manifest.json` — it's our paper trail.
