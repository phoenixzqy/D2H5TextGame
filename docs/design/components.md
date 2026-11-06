# Shared presentation components

**BottomNav** (`src/ui/BottomNav.tsx`) provides the eight localized game
destinations, a development-only tool link and an optional desktop idle chip.
It has no public props; `ScreenShell.hideNav` controls its presence. Small
co-located SVG paths inherit the existing palette and stay decorative so native
link names/current-page announcements come from text and routing. Below640px,
four columns/two rows keep complete12px labels and44px-plus targets; from640px
it uses a row, and from768px the existing side rail. Keep complete translated
labels, visible focus rings and safe-area padding; do not restore font-dependent
emoji, abbreviate destinations or reduce font size to fit. Actual full-viewport
capture records and bounded checks are in the [navigation evidence](../plans/evidence/p16-navigation-icons.md).

## Gothic material system

`src/styles/remaster.css` loads after the Tailwind entry and owns the shared
chrome. The seven original Pollinations-generated WebP materials total
159,026 bytes: stone, iron, leather, crimson leather, frame, header, and
sanctuary. Generation prompts, seeds, accepted crops, rejected trials, and
source attribution are in the [art brief](../art/ui-remaster-brief.md) and
[source record](../art/ui-remaster-sources/SOURCE.md). Keep text and icons as
live DOM/SVG; the textures contain no labels or copied franchise marks.

| Component / hook | Treatment and constraints |
| --- | --- |
| `ScreenShell`, `.d2-shell`, `.d2-header`, `.d2-footer` | Veiled sanctuary background, carved header band, iron footer; retain safe-area padding and one scrolling main region. |
| `BottomNav`, `.d2-nav-link--active` | Iron rail with an inset leather selected destination, full translated labels, and normal-flow mobile navigation. |
| `Panel`, `.d2-panel`, `.d2-surface` | Stone backing, recessed seams, original brass corners, and a 40px nine-slice frame without center fill. |
| `Button`, `.d2-button--primary/secondary/danger` | Embossed iron edges; crimson primary and danger actions; distinct disabled, hover, pressed, and focus states. |
| `.d2-control`, `.d2-control-selected` | Native buttons/links share the same material vocabulary. The base hook deliberately sets no positioning, display, or fixed dimensions. |
| `Tabs`, `.d2-tab`, `.d2-field` | Raised selected tabs and recessed leather inputs; 16px fields avoid mobile zoom. |
| `Modal`, `.d2-dialog`, `.d2-modal-backdrop` | Opaque stone and frame with a dark blurred backdrop; native and inline dialogs keep their own fixed/absolute positioning. |
| `Tooltip`, `ItemTooltip`, `.d2-tooltip` | Framed stone inspection surface with viewport-bounded width; rarity and comparison colors remain visible. |
| `GameCard`, `.d2-card`, `.d2-slot` | Iron perimeter, leather nameplate, inset art and equipment sockets; retain semantic rarity borders. |
| `StatBar`, `.d2-meter`, `.d2-meter-fill` | Grooved tracks with red health, blue resource, and brass progression fills; compact card tracks remain 8px high so their fill is visible. |
| `.d2-plaque`, `.d2-log`, `.d2-toolbar`, `.d2-section-title` | Consistent treatments for NPCs, quest rows, crafting recipes, logs, filters, notices, and section dividers. |

`Tooltip.referenceClassName` styles the trigger wrapper separately from the
floating panel's `className`. Fluid backpack cards pass `h-full w-full` so the
wrapper fills its square slot; otherwise an inline-block can collapse around
a child whose width and height depend on that wrapper. The default wrapper behavior remains available
for content with intrinsic dimensions.

Do not add an isolated stacking context to `ScreenShell` main or textured
panels: several feature dialogs render inline and must rise above navigation.
Do not set `position` on `.d2-dialog`; native dialogs, full-screen overlays,
and the mobile equipment sheet use different positioning utilities.

The palette and serif stack live in `tailwind.config.ts`. Low-specificity
surface border defaults yield to rarity and selection utilities. Controls
have at least 44px targets, checkbox/radio labels provide the larger target,
and keyboard focus has a visible outline. Reduced motion suppresses decorative
animation and transitions. Increased contrast removes text-surface textures;
stealth mode suppresses artwork and frame images, including dialogs.

Vite rewrites all material URLs for a project Pages base path. WebP is included
in the existing Workbox precache pattern. Keep optimized shipping art under
`public/`; source images and review captures remain under `docs/art/`.

Screen coverage, static browser captures, validation limits, and the final
responsive matrix are recorded in the [remaster evidence](../art/ui-remaster-evidence/validation.md).
