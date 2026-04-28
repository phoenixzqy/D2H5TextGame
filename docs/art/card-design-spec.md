# D2 H5 Text Game — Card Design Spec

> Owned by **art-director**. Defines the visual contract for the
> `<GameCard>` React component and every screen that displays a
> character, monster, item, or mercenary as a card. Mobile-first
> (360 × 640 baseline). Style descends from the painterly D2
> aesthetic codified in [`style-guide.md`](./style-guide.md).

This is a *design* spec, not an implementation. Frontend-dev owns the
React/Tailwind implementation; this document tells them exactly what
to build and which existing tokens to consume.

---

## 0. Goals & non-goals

**Goals**

- Make the existing painted assets (class portraits, monster art, item
  icons) feel like a curated card-game collection, not raw images
  sitting on a panel.
- One unified component handles every card type — variant-driven, not
  copy-pasted.
- Reads at 360 × 640 with thumb-reachable hit targets (≥ 44 × 44 dp).
- Degrades gracefully when art is missing (silhouette fallback, never
  a broken image icon).
- Strengthens the D2 dark-fantasy mood: parchment, weathered metal,
  rune-carved frames, gem rarity slots — *not* glossy modern UI.

**Non-goals**

- Not a deckbuilder. We don't need card-back art, hand fan-out, or
  draw/discard animations.
- Not a trading-card game. No power/cost economy, no mana cost gem.
- No fancy parallax or 3D card tilt in v1. Static cards with subtle
  hover/press states only.

---

## 1. Industry references

We are explicitly borrowing the *vocabulary* of mature card-game UI.
None of the artwork or proprietary frame designs is copied — we
reproduce the *information architecture* and ergonomics.

| Game | What we borrow | Reference |
|---|---|---|
| **Hearthstone** | Round portrait inside a heavy ornamental frame; corner stat plates (atk bottom-left, hp bottom-right); rarity gem centered on the title banner. | https://hearthstone.blizzard.com/en-us/cards • design retrospective: https://www.gdcvault.com/play/1020080/The-Design-of |
| **Magic: The Gathering Arena** | Top-aligned name banner with type line under it; flavor text in italic at the bottom; rarity expansion symbol mid-card. The "frame teaches the player what kind of card this is at a glance" principle. | https://magic.wizards.com/en/news/feature/anatomy-magic-card-2018-08-13 |
| **Slay the Spire** | Color-coded card border by category (attack red / skill green / power blue) — instantly readable at a glance, even on small screens. We reuse this for *rarity* and for *monster tier*. | https://slay-the-spire.fandom.com/wiki/Cards |
| **Marvel Snap** | Mobile-first card framing: square-ish art window, oversized stat numerals in the corners, very compact name banner. Proven readable at ~ 350 dp wide. | https://marvelsnap.com/ • UX teardown: https://www.deconstructoroffun.com/blog/2022/10/19/marvel-snap-deconstructed |
| **Legends of Runeterra** | Subtle animated frame "shimmer" on legendary/champion cards used sparingly so it stays an event, not noise. We use this idea for `unique`/`set`/`runeword` rarities only. | https://playruneterra.com/en-us/ • https://www.riotgames.com/en/news/articles/runeterra-art-style-2020 |
| **Diablo II / D2R inventory** | Tooltip-style expanded card: parchment background, bone-white name in rarity color, stat lines in gray, set bonuses indented in green. Our `item` expanded variant mimics this almost 1:1. | https://www.blizzard.com/en-us/games/d2r/ — in-game inventory screenshots |

> **Note on web_search**: the art-director ran the research from
> memory + the linked canonical pages above, all of which document
> publicly observable card layouts. No proprietary frame asset is
> reproduced; we are designing our own frames in the D2 painterly
> style.

---

## 2. Card anatomy (universal)

```
 ┌────────────────────────────────────────────┐  ← outer border (2 px,
 │ ╔════════════════════════════════════════╗ │    rarity-tinted)
 │ ║   [⬩]  N A M E   O F   C A R D         ║ │  ← name banner +
 │ ║        subtitle / type line             ║ │    rarity gem [⬩]
 │ ╠════════════════════════════════════════╣ │
 │ ║                                        ║ │
 │ ║                                        ║ │
 │ ║          ART  WINDOW                   ║ │  ← inner art frame
 │ ║      (painted asset, cover-fit)        ║ │    (1 px inset, soot
 │ ║                                        ║ │     #1a1612)
 │ ║                                        ║ │
 │ ║                                        ║ │
 │ ╠════════════════════════════════════════╣ │
 │ ║ ┌─────┐                      ┌──────┐  ║ │  ← stat plates
 │ ║ │ ATK │                      │  HP  │  ║ │    (variant-specific)
 │ ║ │  47 │                      │ 312  │  ║ │
 │ ║ └─────┘                      └──────┘  ║ │
 │ ║ ▰▰▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱  hp  280/312  ║ │  ← bars (optional)
 │ ║                                        ║ │
 │ ║  flavor / keywords / footer            ║ │  ← footer slot
 │ ╚════════════════════════════════════════╝ │
 └────────────────────────────────────────────┘
```

**Layers, top to bottom:**

1. **Outer border** — 2 px solid stroke in the rarity color, plus a
   1 px inset highlight (`d2.gold @ 20%`) to give a "metal frame"
   look. Drops to 1 px on `size=sm`.
2. **Background plate** — `d2.panel` (`#1a1410`) with a faint noise
   texture (Tailwind: `bg-d2-panel`; texture via existing
   `bg-[url('/textures/parchment.png')]` if present, else flat).
3. **Name banner** — top strip, height = ~12 % of card. Serif font
   (`font-serif` → Tinos). Name color = rarity color. Subtitle in
   `d2.white @ 70%`, smaller, sans.
4. **Rarity gem / slot** — circular 14 × 14 px gem at the left edge of
   the name banner. Colored per rarity table (§ 5).
5. **Art window** — fills the middle 60–70 % of the card. `object-fit:
   cover` against an image, fallback silhouette otherwise. 1 px inset
   shadow inward (`shadow-inner` + custom `shadow-black/60`).
6. **Stat plates** — small rounded rectangles overlaid on the
   art-window's bottom corners, OR sitting in a footer strip below it
   depending on variant. Numerals in `font-serif` heavy weight.
7. **Bars** — 4 px tall, full-width, segmented look. Used for HP/MP/
   stamina on `character` and `monster` variants only.
8. **Footer** — free slot for flavor text, keywords, or set bonuses.
   Italic serif, `d2.white @ 60 %`. Hidden on `size=sm`.

---

## 3. Variants

All sizes given as Tailwind utility classes; raw px in parentheses
assume root font 16 px.

### 3.1 `character` — class portrait card

- **Aspect**: 3:4 portrait
- **Sizes**:
  - `sm` — `w-24 h-32` (96 × 128) — used in roster / pickers
  - `md` — `w-40 h-56` (160 × 224) — default, fits 2-up at 360 dp
  - `lg` — `w-64 h-[22rem]` (256 × 352) — class select hero card
- **Layout**:
  - Name banner top, art window large (≈ 70 %), stat plates as a
    horizontal row in the footer (STR / DEX / VIT / ENG, 4 plates),
    HP+MP bars under that, flavor hidden on `sm`/`md`.
- **Rarity slot**: shows class title color (e.g. paladin = gold,
  necromancer = bone-white). Treated as `unique` tone.
- **Hit target**: whole card is tappable; selected state adds a 2 px
  outer ring in `d2.gold` and lifts the card by `translate-y-[-2px]`.

```
 ┌──────────────┐    character / md (160×224)
 │ [⬩] PALADIN  │
 │   Holy Order │
 ├──────────────┤
 │              │
 │   portrait   │
 │   (cover)    │
 │              │
 ├──────────────┤
 │ STR DEX VIT ENG │
 │  25  20  25  15 │
 │ ▰▰▰▰▰▰▰▰▱▱ HP   │
 │ ▰▰▰▰▱▱▱▱▱▱ MP   │
 └──────────────┘
```

### 3.2 `monster` — combat enemy card

- **Aspect**: 3:4 portrait
- **Sizes**:
  - `sm` — `w-20 h-28` (80 × 112) — encounter list thumbs
  - `md` — `w-36 h-48` (144 × 192) — default in combat screen
  - `lg` — `w-72 h-96` (288 × 384) — boss reveal / cinematic
- **Layout**:
  - Same skeleton as character, but stat plates are **2** only —
    `ATK` (bottom-left) and `HP` (bottom-right), Hearthstone-style
    overlaid on the art-window corners. HP bar always visible.
  - Subtitle = monster type ("Demon", "Undead", "Animal").
- **Rarity slot** uses monster-tier color (§ 5):
  `common` → flat gray, `champion` → blue, `elite` → yellow,
  `boss` → red with subtle pulsing border (LoR-style shimmer, single
  4 s loop, `motion-reduce:animate-none`).
- **Element tint**: an optional overlay tint at 8 % opacity over the
  art window — cold = blue, fire = ember, poison = verdigris,
  lightning = arcane. Driven by `monster.elementHint` prop, not a
  separate variant.

```
 ┌────────────┐    monster / md (144×192)
 │ [⬩] FALLEN │
 │   Demon    │
 ├────────────┤
 │            │
 │   beast    │
 │            │
 │ ┌──┐  ┌──┐ │
 │ │12│  │40│ │
 │ └ATK──HP─┘ │
 │ ▰▰▰▰▰▰▰▱▱▱ │
 └────────────┘
```

### 3.3 `item` — inventory icon card

Two visual modes:

**(a) Compact icon — default in inventory grid**

- **Aspect**: 1:1
- **Sizes**:
  - `sm` — `w-12 h-12` (48 × 48)  — equipment slots, hotbar
  - `md` — `w-16 h-16` (64 × 64)  — inventory grid default
  - `lg` — `w-24 h-24` (96 × 96)  — vendor / stash hover preview
- **Layout**: art window fills the whole card; name banner is
  *suppressed* (icon only). Rarity is communicated by:
  1. 1 px outer border tint,
  2. a subtle inner glow in rarity color (16 % opacity radial),
  3. a 6 × 6 rarity gem in the top-right corner.
  Stack count, if any, in bottom-right in `font-serif` 12 px white.

```
 ┌────┐    item / md compact (64×64)
 │  ⬩│  ← rarity gem
 │ 🗡️ │  ← icon
 │  ×3│  ← stack count
 └────┘
```

**(b) Expanded tooltip — D2-style stat card**

- **Aspect**: variable; auto-sized to content. Min `w-56` (224 dp),
  max `w-72` (288 dp) so it stays inside a 360 dp viewport with a
  16 dp gutter.
- Triggered by long-press on mobile / hover on desktop.
- Layout (top to bottom):
  1. Name in rarity color, centered, serif.
  2. Item base type ("Crystal Sword") in white.
  3. Item icon thumbnail (`w-20 h-20`) centered.
  4. Required level / strength / dex (gray; red if unmet).
  5. Stat lines (one per row, blue `d2.magic` for magic affixes).
  6. Set bonuses (green `d2.set`, indented).
  7. Flavor text in italic gold.

This mirrors the in-game D2 inventory tooltip almost verbatim and is
the highest-fidelity nod to the source aesthetic in the whole UI.

### 3.4 `merc` — mercenary card

- **Aspect**: 3:4 portrait, smaller than `character`.
- **Sizes**:
  - `sm` — `w-20 h-28` (80 × 112) — merc roster
  - `md` — `w-32 h-44` (128 × 176) — default, fits 3-up at 360 dp
  - `lg` — `w-48 h-64` (192 × 256) — hire-screen detail
- **Layout**: like character but more compact:
  - Name banner shows merc nickname; subtitle shows their archetype
    ("Rogue Archer", "Desert Mercenary", "Iron Wolf", "Barbarian
    Warrior").
  - Single stat row: `LVL`, `ATK`, `DEF`, `AURA`/`SKILL` (label is
    free-form).
  - HP bar only (no MP).
  - Footer can list their granted aura / passive in one line.
- **Art**: today, mercs reuse class portraits — see
  [`asset-mapping.json`](./asset-mapping.json) for the map. The card
  **must not** show the class name as the merc's name; the portrait
  is decorative until dedicated merc art is generated.
- **Rarity slot**: uses gacha rarity (`common`/`magic`/`rare`/`unique`
  — the runeword/set tones don't apply to mercs).

---

## 4. Typography scale

All values map directly to Tailwind utilities. New tokens flagged
with **(NEW)** for frontend-dev to add to `tailwind.config.ts`.

| Role | Class | Notes |
|---|---|---|
| Card title (md/lg) | `font-serif text-base font-semibold tracking-wide` | 16 px |
| Card title (sm)    | `font-serif text-sm font-semibold tracking-wide`  | 14 px |
| Subtitle / type    | `font-sans text-xs uppercase tracking-[0.12em]`   | 12 px, 60 % opacity |
| Stat numeral (lg)  | `font-serif text-2xl font-bold tabular-nums`      | 24 px |
| Stat numeral (md)  | `font-serif text-lg font-bold tabular-nums`       | 18 px |
| Stat numeral (sm)  | `font-serif text-sm font-bold tabular-nums`       | 14 px |
| Stat label         | `font-sans text-[10px] uppercase tracking-widest` | gray-400 |
| Bar value text     | `font-sans text-[10px] tabular-nums`              | white/80 |
| Flavor / footer    | `font-serif italic text-xs`                       | white/60 |
| Tooltip stat line  | `font-sans text-xs`                               | rarity-tinted |
| Tooltip flavor     | `font-serif italic text-xs text-d2-gold`          | |

**(NEW)** Optional addition to `tailwind.config.ts`:

```ts
fontSize: {
  'stat-xl': ['1.75rem', { lineHeight: '1', fontWeight: '700' }], // 28px
  'stat-lg': ['1.5rem',  { lineHeight: '1', fontWeight: '700' }],
  'micro':   ['0.625rem',{ lineHeight: '0.875rem' }],             // 10px
}
```

---

## 5. Color tokens & rarity tinting

Existing tokens (from `tailwind.config.ts`):

```
d2.bg       #0a0a0a   page background
d2.panel    #1a1410   card surface
d2.border   #4a3a2a   default frame
d2.gold     #c8a85a   highlights, selected ring
d2.white    #d0d0d0   normal items, body text
d2.magic    #6a82ff   magic items
d2.rare     #f5e26b   rare items
d2.unique   #b8860b   unique items
d2.set      #00b300   set items
d2.runeword #ff8c1a   runewords
```

**Rarity → token map (items + characters)**

| `rarity` prop | Border / name color | Inner-glow alpha | Gem |
|---|---|---|---|
| `normal`   | `d2.white`     | 0 %   | flat gray  |
| `magic`    | `d2.magic`     | 12 %  | sapphire   |
| `rare`     | `d2.rare`      | 16 %  | citrine    |
| `set`      | `d2.set`       | 14 %  | emerald    |
| `unique`   | `d2.unique`    | 18 %  | amber      |
| `runeword` | `d2.runeword`  | 20 %  | ember (animated, opt-out via prefers-reduced-motion) |

**Monster-tier → token map** *(reuses item palette for color economy
— same gem shapes, different semantic mapping)*

| `rarity` prop | Mapped color   | Behavior |
|---|---|---|
| `common`   | `d2.white`     | thin 1 px border |
| `champion` | `d2.magic`     | 2 px border |
| `elite`    | `d2.rare`      | 2 px border + dotted inner stroke |
| `boss`     | `#9b2222` **(NEW** `d2.boss`**)** | 3 px border + LoR shimmer |

**(NEW)** `d2.boss = '#9b2222'` should be added to
`tailwind.config.ts`. It's a dimmed blood-red, distinct from the
runeword orange and the dark-fantasy palette.

**(NEW)** Element tint overlays for monsters (8 % opacity over art):

```
fire       #c3411f
cold       #9aa9d6
poison     #7fa56e
lightning  #f5e26b   (reuse rare)
physical   none
magic      #6a82ff   (reuse magic)
```

These are not new tokens — they reuse existing palette anchors from
`style-guide.md § 3` and existing rarity colors.

---

## 6. React component contract

```ts
// src/components/cards/GameCard.tsx (frontend-dev to implement)
export interface GameCardProps {
  variant: 'character' | 'monster' | 'item' | 'merc';

  /** Public asset URL (e.g. /assets/d2/generated/...). Falls back to
   *  silhouette when absent or fails to load. */
  image?: string;

  name: string;
  subtitle?: string;

  rarity?:
    | 'normal' | 'magic' | 'rare' | 'set' | 'unique' | 'runeword'
    | 'common' | 'champion' | 'elite' | 'boss';

  /** Up to 4 plates for `character`, exactly 2 (ATK/HP) for `monster`,
   *  up to 4 for `merc`. Ignored for `item`. */
  stats?: Array<{
    label: string;
    value: string | number;
    tone?: 'atk' | 'hp' | 'mp' | 'def';
  }>;

  /** Resource bars. Rendered as 4 px segmented strips. */
  bars?: Array<{
    kind: 'hp' | 'mp' | 'stamina';
    current: number;
    max: number;
  }>;

  /** Free slot under the stat row. Hidden at size=sm. */
  footer?: React.ReactNode;

  size?: 'sm' | 'md' | 'lg';     // default 'md'
  selected?: boolean;             // adds gold ring + lift
  onClick?: () => void;
  className?: string;             // appended last; never overrides border
}
```

### 6.1 Layout decisions per variant

| Variant     | Aspect | Banner | Stat plates location           | Bars |
|-------------|--------|--------|--------------------------------|------|
| `character` | 3:4    | top    | footer row, 4 plates           | HP, MP under plates |
| `monster`   | 3:4    | top    | overlay on art bottom corners  | HP under art |
| `item` (compact)  | 1:1 | suppressed | none (gem only)         | none |
| `item` (expanded) | auto | top  | n/a (replaced by stat lines)   | none |
| `merc`      | 3:4    | top    | footer row, up to 4 plates     | HP only |

### 6.2 Behavior

- **Image fallback**: on `image` missing OR `<img onerror>`, render an
  SVG silhouette in `d2.border` over `d2.panel`. Silhouettes:
  - `character`/`merc` → standing figure
  - `monster` → horned skull
  - `item` → simple chest icon
  - Frontend-dev owns the SVGs. Each is a single path, 24 × 24,
    scaled via `currentColor`.
- **Hit target**: when `onClick` is provided, the card becomes a
  `<button>` element (semantic), with `aria-label` = `name + (subtitle
  ?? variant)`. Whole card is tappable; min 44 × 44 dp on `sm`.
- **Selected**: `selected={true}` adds `ring-2 ring-d2-gold` and
  `translate-y-[-2px]` (skip translate when
  `prefers-reduced-motion`).
- **Disabled / locked** (e.g. unowned class): apply
  `grayscale opacity-60` to the art window only — frame stays sharp
  so the card still reads as "a card".
- **Loading**: when `image` is set but not yet loaded, render a
  shimmer block in `d2.panel` lighter by 6 % — never a spinner inside
  a card.

### 6.3 Slots / sub-components (recommended)

To keep `GameCard` from becoming a 400-line component, frontend-dev
should split out:

```
GameCard            (variant switch + frame)
 ├── CardBanner     (name + subtitle + rarity gem)
 ├── CardArt        (image or silhouette + element tint)
 ├── StatPlate      (atk/hp/def/mp little box)
 ├── ResourceBar    (segmented bar)
 └── ItemTooltip    (the expanded item card; portal-rendered)
```

All purely presentational; no game-state imports.

---

## 7. Spacing & sizing tokens

| Token      | Value | Where |
|------------|-------|-------|
| `card-radius`     | 6 px (`rounded-md`) | all card corners |
| `card-pad-md`     | 8 px (`p-2`)        | inner padding md cards |
| `card-pad-sm`     | 6 px (`p-1.5`)      | inner padding sm cards |
| `card-pad-lg`     | 12 px (`p-3`)       | inner padding lg cards |
| `card-gap-grid`   | 8 px (`gap-2`)      | grids of cards |
| `frame-stroke-md` | 2 px                | border md/lg |
| `frame-stroke-sm` | 1 px                | border sm |
| `bar-height`      | 4 px                | resource bars |

No new Tailwind tokens needed for spacing — all standard utilities.

---

## 8. Accessibility

- Color is **never** the only signal: rarity + gem shape, monster tier
  + border weight, element + small icon glyph (16 × 16) inside the
  art-window top-left.
- Contrast: name text against banner background must hit WCAG AA
  (4.5:1) at all sizes. The rarity colors above all clear AA on
  `d2.panel`; double-check `d2.set` (#00b300 on #1a1410 ≈ 5.6:1, ok)
  and `d2.unique` (#b8860b on #1a1410 ≈ 4.9:1, ok).
- Animated shimmer (runeword, boss) opts out under
  `motion-reduce:animate-none`.
- Cards are real `<button>` elements when interactive; `<article>`
  otherwise. Focus ring identical to selected ring.

---

## 9. Mobile-first sanity check (360 × 640)

| Layout               | Cards/row | Card size       | Gutter |
|----------------------|-----------|-----------------|--------|
| Class select         | 2         | character/md (160×224) | 16 px |
| Combat — enemy zone  | up to 3   | monster/md (144×192)   | 8 px  |
| Combat — party zone  | up to 4   | merc/md (128×176)      | 8 px  |
| Inventory grid       | 4–5       | item/md (64×64)        | 8 px  |
| Vendor list          | 2         | item/lg (96×96) + text | 12 px |

A 360 dp viewport with 16 dp side gutter yields 328 dp working width.
- 2 × character/md (160) + 16 gap = 336 → tight; spec uses md = 152
  on screens ≤ 375 dp via `clamp(8rem, 42vw, 10rem)`. Frontend-dev
  may simply use `w-[42vw] aspect-[3/4]` for mobile-first sizing and
  treat the px values as design intent, not literal CSS.
- 3 × monster/md (144) + 2 × 8 = 448 → too wide. Use 2-up monster
  cards on mobile, 3-up on tablets (≥ 640 dp).

---

## 10. Asset coverage and fallbacks

The asset-mapping JSON co-located with this spec
(`asset-mapping.json`) is the canonical resolver from gameplay ID →
public URL. Cards consume that map at the screen level — `GameCard`
itself does **not** know the map; it only takes an `image` URL.

Fallback rules (in order):
1. Mapping returns a string → use it.
2. Mapping returns `null` (intentionally absent) → silhouette.
3. Key not in mapping → silhouette + `console.warn` in dev only.

---

## 11. Critical missing art (queue, do NOT generate now)

These are gaps the asset-mapping currently fills with `null` or a
proxy. Each is a future image-gen request to be approved by
art-director when we revisit:

| Priority | Category | Subjects | Why |
|---|---|---|---|
| P1 | `class-portrait` | (none — full set complete: 7/7) | — |
| P1 | `monster` (dedicated merc art) | `merc.rogue-archer`, `merc.desert-mercenary`, `merc.iron-wolf`, `merc.barbarian-warrior` | Today proxied by class portraits. Mercs are persistent companions; they deserve their own faces. |
| P1 | `monster` | `act1.dark-archer`, `act1.skeleton`, `act1.corrupted-rogue`, `act1.griswold` | Act 1 monsters referenced by content but no art. |
| P1 | `monster` (boss) | `act1.the-countess`, `act1.the-smith`, `act1.duriel` (act2 boss), `act3.mephisto`, `act4.diablo`, `act5.baal` | Headline bosses — must have hero art before the player ever fights them. |
| P2 | `monster` | full Act 2–5 trash rosters | Currently any non-Act-1 fight uses silhouette. |
| P2 | `item-icon` | All non-unique bases (sword, axe, helm, ring, amulet, gold-pile, potion-red/blue/purple) | Inventory grid is mostly silhouettes today. |
| P2 | `item-icon` | All set items + runewords with art | Currently only ~15 uniques have icons. |
| P3 | `zone-art` | All non-town sub-areas (Blood Moor, Cold Plains, Stony Field, Tristram, …) | Today only the 5 act towns have zone art. |
| P3 | `ui-background` | Main menu, character select, combat backdrop variants per act | Currently no UI backgrounds at all. |

Art-director will allocate `subjectId`s in `seed-registry.md` when PM
green-lights a generation pass.

---

## 12. Open questions for PM

1. Do we want a **card-back** design (for future merc gacha pulls / item
   reveal animations)? Out of v1 scope but trivial to add as a sixth
   variant later.
2. Boss "shimmer" animation — accept the small CPU cost on low-end
   Android, or static-only on mobile and animated on desktop?
3. When mercenary archetypes get their own painted portraits, do we
   keep proxying old saves, or invalidate the mapping and force a
   re-render? (Asset map is append-only; safe to add new keys.)

---

*End of spec. Frontend-dev: please flag tokens marked **(NEW)** during
implementation review so art-director can sign off in the same PR.*
