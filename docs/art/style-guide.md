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
- **Style suffix**: `heroic waist-up portrait, single character, centered, three-quarter view, detailed armor, atmospheric background hinting at their homeland, rim lighting, oil painting on aged canvas, ample headroom above subject with safe margin from top edge, head positioned in upper third roughly 25 to 35 percent down from the top, eyes on the upper-third horizon line, torso filling the central safe zone, frame ends at mid-torso or waist, subject survives a center crop at 1:1 and 16:9`
- **Negative additions**: `group shot, multiple characters, full landscape, head touching top of frame, head cropped, headroom too tight, forehead clipped, hair clipped at top, subject flush with top edge, low camera angle looking up`

Canonical subjects: Amazon, Assassin, Barbarian, Druid, Necromancer, Paladin, Sorceress.

### 4.2 `monster`
- **Model**: `flux`
- **Size**: `1024 × 1024` (square card)
- **Seed-base**: `200000`
- **Style suffix**: `menacing creature portrait, single monster, centered, three-quarter view, dim dungeon or wilderness backdrop, anatomically grounded, sinewy musculature or undead decay as appropriate, oil painting, ample headroom above subject with safe margin from top edge, head or skull positioned in upper third roughly 25 to 35 percent down from the top, body centroid centered in frame, full-body creatures fully contained with margin on all sides, subject survives a center crop at 1:1 and 3:4`
- **Negative additions**: `cute, friendly, mascot, cartoon villain, group of monsters, head touching top of frame, head cropped, horns clipped, headroom too tight, subject flush with top edge`

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

### 4.6 `skill-icon`
- **Model**: `flux`
- **Size**: `512 × 512` (square source; intended UI display at 64 × 64 and smaller)
- **Seed-base**: `600000`
- **Reference axis**: dark-fantasy ARPG skill icons, illuminated-manuscript spell emblems, painterly high-contrast fantasy glyphs. Diablo II / D2R skill icons may guide functional readability and class fantasy, but prompts must not copy their specific compositions.
- **Brushwork & medium**: oil-painted miniature icon, visible brushwork, crisp silhouette, magical glow; never photoreal, never anime, never 3D render.
- **Palette**: muted soot / parchment / iron base with one elemental accent: ember `#c3411f`, frost `#9aa9d6`, storm `#f08a2a`, venom `#7fa56e`, bone-spirit `#e6dcc4`, blood-shadow `#7a1f1f`.
- **Lighting direction**: warm internal glow or elemental key light against a dark near-black ground; hard chiaroscuro edge contrast so the icon remains readable at 64 × 64.
- **Composition rules**: one centered floating physical emblem, weapon fragment, creature token, aura object, body fragment, or elemental spell token; high-readability silhouette filling most of the canvas; no UI border/frame baked into the image; no full scene or character portrait. Prefer concrete material tokens (bone, iron, leather, stone, blood) over thin abstract glyphs because they match the monster/item family and survive 64 × 64 display.
- **Subject fidelity musts**: the icon must communicate the skill's game function first — projectile, melee strike, aura, trap, summon, curse, passive mastery, or elemental spell — with class-appropriate motifs.
- **Style suffix**: `single dark-fantasy skill icon, centered floating physical emblem or spell token, close-cropped still-life object on dark near-black painted ground, strong central silhouette filling most of the canvas, thick painterly oil brushwork, gritty bone iron leather stone or blood material, warm key light with cool rim, one muted elemental accent glow, no baked circular frame, no mandala, no UI frame, no text, no character portrait, no full scene, readable at 64px`
- **Negative additions**: `letters, numbers, readable text, ui frame, border, baked circular frame, mandala, thin decorative sigil, occult lettering, signature-like strokes, portrait, full body character, landscape, multiple icons, photoreal, transparent background, glossy mobile-game icon, flat vector art`
- **Note**: source background is dark, not transparent. UI applies node framing, lock overlays, level badges, and hover states.

## 5. Subject framing (preset v2, 2026-04-28)

Card UIs across the game crop generated images with `object-fit: cover`
and `object-position: center` at multiple aspect ratios (square 1:1,
portrait 3:4, landscape 16:9). A subject framed flush against the top
edge of the source image gets its head sliced off the moment any of
those crops shrinks the visible window.

**The rule for every preset that produces a subject (class portraits,
monsters, named NPCs, mercenaries, bosses):**

1. **Headroom**: the subject's head sits ~25–35% from the **top** of
   the canvas. Hair / horns / helm crests stay inside the frame with a
   visible margin above them.
2. **Eye line**: roughly on the upper-third horizon (rule of thirds,
   classical portrait convention).
3. **Torso in the center safe zone**: the chest/upper-torso fills the
   middle vertical band so a centered square crop captures face +
   shoulders + chest, never just-a-face or just-a-belt.
4. **Bottom of frame**: mid-torso or waist for humanoid portraits;
   full-body monsters keep their centroid centered with margin on all
   four sides.
5. **No low up-shots.** A camera pitched up at the subject pushes the
   head into the top edge — explicitly negatived.

These directives are baked into the `class-portrait` and `monster`
category style suffixes and negative additions. Other categories
(`item-icon`, `ui-background`, `zone-art`) are not subject portraits
and follow their own composition rules.

### Existing assets
All currently committed class portraits and monster cards were
generated under preset **v1** (no headroom directive) and will sit
high in the frame. The frontend works around this with
`object-position: center top` on card images. Existing `subjectId`
allocations in [`seed-registry.md`](./seed-registry.md) are **kept
as-is** — we do not invalidate seeds for a framing change. When any
asset is regenerated for unrelated reasons, it should bump `variant`
under preset v2 and inherit the corrected framing automatically.

## 6. Seed strategy

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

## 7. Re-roll policy
If art-director rejects an output:
1. First try `variant=1`.
2. Then `variant=2`, `variant=3`, …
3. If 3 variants fail, escalate to producer — the preset itself may need tuning.

## 8. Source / attribution
All images are AI-generated via **Pollinations.AI**. Manifest at
`public/assets/d2/generated/manifest.json` records prompt, seed, model,
sha256, and timestamp for every file. The project remains private; before
any public release, the manifest must be audited (release blocker).
