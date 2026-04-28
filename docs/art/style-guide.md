# D2 H5 Text Game — Art Style Guide

> Owned by the **art-director** agent. This is the single source of truth for
> the look-and-feel of every generated image in the project. Every call to
> the `image-gen` skill MUST resolve to one of the category presets defined
> below. Free-form prompts are **not allowed** — they break consistency.

The machine-readable companion file is [`style-presets.json`](./style-presets.json).
If you change anything here, update that file in the same commit.

## 0. Project context
This is a private, non-commercial Diablo II-inspired H5 text game. We
intentionally lean on the D2 / D2R aesthetic: dark fantasy, gothic,
painterly, oil-on-canvas, dramatic chiaroscuro, muted earth-tone palette,
no UI chrome inside the artwork itself, no modern items, no text in image.

## 1. Global style preamble
Prepended to **every** prompt:

```
masterpiece dark fantasy oil painting, gothic Diablo II inspired,
painterly brushwork, dramatic chiaroscuro lighting, muted earth tones
with deep shadows and warm highlights, cinematic composition,
high detail, weathered medieval setting, no modern elements
```

## 2. Global negative prompt
Appended (as `negative_prompt` parameter) to every request:

```
text, watermark, signature, logo, ui, hud, frame, border, modern clothing,
modern weapons, sci-fi, neon, anime, chibi, cute, cartoon, low contrast,
oversaturated, plastic skin, smooth skin, extra fingers, extra limbs,
deformed hands, deformed face, blurry, low quality, jpeg artifacts,
out of frame, cropped, multiple subjects when single requested
```

## 3. Palette anchors
Cite these in prompts as needed:

- **Bone & parchment**: `#e6dcc4`, `#c9b88a`
- **Blood & ember**: `#7a1f1f`, `#c3411f`, `#f08a2a`
- **Verdigris & venom**: `#3a5a4a`, `#7fa56e`
- **Storm & arcane**: `#3b4a78`, `#9aa9d6`
- **Shadow & soot**: `#1a1612`, `#2e2924`

## 4. Categories

Each category has a fixed **model**, fixed **canvas size**, fixed
**seed-base** (offset added to a per-subject id to land in a stable seed
range; see [`seed-registry.md`](./seed-registry.md)), a **style suffix**
appended to the prompt, and category-specific **negative additions**.

### 4.1 `class-portrait`
- **Model**: `flux`
- **Size**: `768 × 1024` (3:4 portrait)
- **Seed-base**: `100000`
- **Style suffix**: `full-body heroic portrait, single character, centered, three-quarter view, detailed armor, atmospheric background hinting at their homeland, rim lighting, oil painting on aged canvas`
- **Negative additions**: `group shot, multiple characters, full landscape`

Canonical subjects: Amazon, Assassin, Barbarian, Druid, Necromancer, Paladin, Sorceress.

### 4.2 `monster`
- **Model**: `flux`
- **Size**: `1024 × 1024` (square card)
- **Seed-base**: `200000`
- **Style suffix**: `menacing creature portrait, single monster, three-quarter view, dim dungeon or wilderness backdrop, anatomically grounded, sinewy musculature or undead decay as appropriate, oil painting`
- **Negative additions**: `cute, friendly, mascot, cartoon villain, group of monsters`

### 4.3 `item-icon`
- **Model**: `flux`
- **Size**: `512 × 512` (square; downscaled by UI)
- **Seed-base**: `300000`
- **Style suffix**: `single magic item, floating in dark void, centered, three-quarter view, ornate detail, faint magical glow appropriate to rarity, painterly icon style, dark near-black background, no shadow ground`
- **Negative additions**: `character, person, hand holding item, scene, landscape, transparent background, multiple items`
- **Note**: background is dark, not transparent. UI applies card framing.

### 4.4 `ui-background`
- **Model**: `flux`
- **Size**: `1920 × 1080` (16:9 widescreen) — UI also crops to 9:16 mobile.
- **Seed-base**: `400000`
- **Style suffix**: `wide establishing shot, atmospheric, no people, no readable text, symmetric composition with empty negative space in lower third for UI, oil painting matte, deep depth of field`
- **Negative additions**: `characters, people, monsters, text, ui elements, hud`

### 4.5 `zone-art`
- **Model**: `flux`
- **Size**: `1600 × 900` (16:9)
- **Seed-base**: `500000`
- **Style suffix**: `cinematic establishing shot of a Diablo II zone, atmospheric perspective, small silhouetted hero figure for scale optional, dramatic sky, matte painting style`
- **Negative additions**: `text, ui, hud, modern buildings`

## 5. Seed strategy

The skill computes the final seed as:

```
seed = category.seedBase + subjectId + variant * 10000
```

`subjectId` is a small integer (1..9999) stable per logical subject,
allocated in [`seed-registry.md`](./seed-registry.md). `variant` defaults
to `0`; re-rolls bump it.

This guarantees:
- Same subject regenerates with the same look across the project life.
- Different subjects in the same category cluster in a known seed range,
  so families share a "feel".

## 6. Re-roll policy
If art-director rejects an output:
1. First try `variant=1`.
2. Then `variant=2`, `variant=3`, …
3. If 3 variants fail, escalate to PM — the preset itself may need tuning.

## 7. Source / attribution
All images are AI-generated via **Pollinations.AI**. Manifest at
`public/assets/d2/generated/manifest.json` records prompt, seed, model,
sha256, and timestamp for every file. The project remains private; before
any public release, the manifest must be audited (release blocker).
