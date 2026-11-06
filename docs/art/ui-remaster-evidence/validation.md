# Whole-game UI remaster — validation

Date: 2026-11-06. Branch: `feat/ui-remaster`, built on the completed
`feat/playable-foundations` game with the main-branch Pages setup preserved.

## Scope and requirement audit

| Requirement | Implementation and evidence |
| --- | --- |
| Remaster every player-facing screen | All 12 production routes in `src/app/routes.tsx`: home, character creation, character, town, map, combat, inventory, skills, mercenaries, recruitment, quests, settings. The contact sheets below cover all 12. Development tools are outside the player interface. |
| Textured buttons, backgrounds, headers, and other components | `src/styles/remaster.css`, imported by `src/app/main.tsx`, supplies the shared material system. Button, Panel, ScreenShell, BottomNav, Modal, Tooltip, GameCard, GameImage, CharacterHud, StatBar, Tabs, equipment, stat sheets, and save notices use it. The surface-hook commit `2592a9b9` covers 53 feature/shared files, including crafting, town services, idle notices, endgame, and item inspection. |
| Original Diablo 2/3 inspired visual style | Carved charcoal stone, blackened iron, leather, brass edges, crimson actions, original diamond ornaments, and a veiled sanctuary background. The references informed materials and hierarchy; their logos and UI artwork were not copied. See the [material sheet](materials.webp) and [art brief](../ui-remaster-brief.md). |
| Use the existing image-generation API | Seven optimized original WebPs from the repository image-gen/Pollinations pipeline, totaling 159,026 bytes. Art commit `3dd5e715` retains prompts, seeds, accepted crops, rejected trials, and source images. See [provenance](../ui-remaster-sources/SOURCE.md). |
| Keep useful layouts and preserve game behavior | Existing route and feature layouts remain, with responsive chrome, clearer resource meters, opaque dialogs, and full-size backpack cards. No engine, store, save, game-data, or translation changes in the remaster diff against `65bf839a`. Native translated DOM text remains separate from artwork. |
| Support mobile and desktop | The static layout matrix covers 360×640, 412×915, 915×412, 1280×800, and 1920×1080, in en and zh-CN. Results and limits are below. |

## Checks completed

- `npm run typecheck`: passed.
- Scoped ESLint over the 71 changed TypeScript/TSX source files with
  `--max-warnings 0`: passed.
- `git diff --check`: passed.
- Production Pages build: passed, using
  `VITE_BASE_PATH=/D2H5TextGame/ VITE_GITHUB_PAGES=true npm run build`
  with an isolated temporary output directory.
- Build stylesheet: `index-Dqqz1UJg.css`, 68.48 kB / 14.25 kB gzip.
- All seven shipping WebPs have the correct project Pages base URL, are
  included in the Workbox precache, and match the source files byte for byte.
  See [asset report](assets-report.json).
- All 740 pre-existing generated manifest entries are unchanged. The 17
  appended source/derivative records were checked against their actual
  SHA-256 file hashes.
- The existing reviewer returned `[CODE-REVIEW]: APPROVE` after review of
  the card sizing, dialog positioning/stacking, safe-area padding, resource
  meters, and dialog stealth/increased-contrast fixes.

The build reports existing Browserslist age and large-chunk warnings. The
existing 2.15 MB skill schema exceeds the Workbox individual-file precache
limit. This work does not claim offline gameplay validation.

## Static browser matrix

Real React screen/components were server-rendered with populated stores into
temporary HTML fixtures. Chromium loaded those fixtures with the final
production CSS and assets. Fixtures used a level-18 paladin, normal/magic/rare
equipment, mercenaries, materials, currencies, and a paused battlefield.
No client hydration, React effects, combat loop, game actions, campaign,
gameplay tests, simulations, or soak tests ran.

This verifies presentation and layout. It does not verify game interactions,
focus trapping, combat outcomes, save persistence, or a full playthrough.

22 states × 2 locales × 5 viewports = **220 static checks**:

- 12 production route screens, plus item details, equipment dialog, equip
  picker, save-import dialog, shared control states, offline notices, save
  failure, town services, endgame, and crafting confirmation.
- Zero horizontal overflow failures, zero network errors, zero pages with
  undersized control targets. Checkbox/radio targets include their enclosing
  clickable labels.
- Skill nodes retain absolute positioning.
- Visible dialogs are opaque, within the viewport, and above navigation and
  header chrome at the sampled hit-test points.

Raw measurements: [layout report](layout-report.json).

### Backpack sizing correction

Filled cards previously collapsed to 4×4 px because the tooltip's inline-block
reference wrapper shrink-wrapped a child sized by percentage width and height.
`Tooltip.referenceClassName` now lets BackpackGrid fill the fixed square slot.
The floating tooltip retains its separate sizing.

| Viewport width | Before | Minimum filled card after | Measurements |
| --- | --- | --- | --- |
| 360 | 4×4 px | 75.5×75.5 px | 144 |
| 412 | 4×4 px | 69.1875×69.1875 px | 144 |
| 915 | 4×4 px | 67.296875×67.296875 px | 144 |
| 1280 | 4×4 px | 66.53125×66.53125 px | 144 |
| 1920 | 4×4 px | 64.5×64.5 px | 144 |

Measurements span the populated inventory/dialog fixtures in both locales.
See [mobile backpack](backpack-filled-360.webp),
[desktop backpack](backpack-filled-1280.webp), and
[BUG-794](../../../production/bugs/BUG-794-backpack-tooltip-sizing.md).

### Accessibility and display modes

The crafting dialog was additionally inspected in four modes:

| Mode | Observed result | Capture |
| --- | --- | --- |
| Stealth | Background and border images removed; animation/transition duration 0s. | [Stealth](mode-stealth.webp) |
| Reduced motion | Animation and transition duration 0.00001s. | [Reduced motion](mode-reduced-motion.webp) |
| Increased contrast | Text-surface background image removed. | [Contrast](mode-contrast.webp) |
| Keyboard focus | Focused action has a solid visible outline. | [Focus](mode-focus.webp) |

Safe-area padding remains in the shell/nav CSS. Simulated hardware safe-area
insets were not part of the static measurement matrix.

## Visual evidence

Contact sheets show the top viewport at 360×640. Long screens have additional
content in the main scrolling region. Desktop captures use 1280×800; the skill
and inventory views are scrolled to their main content. Capture fixtures used
eager image loading and waited for image decoding; production lazy loading is
unchanged. A portrait capture was refreshed after waiting for two animation
frames to avoid a capture-only paint delay.

| Coverage | English | Simplified Chinese |
| --- | --- | --- |
| Home, create, character, town, map, combat | [Sheet 0](mobile-en-0.webp) | [Sheet 0](mobile-zh-CN-0.webp) |
| Inventory, skills, mercs, recruitment, quests, settings | [Sheet 1](mobile-en-1.webp) | [Sheet 1](mobile-zh-CN-1.webp) |
| Item details, equipment, equip picker, import, controls, notices | [Sheet 2](mobile-en-2.webp) | [Sheet 2](mobile-zh-CN-2.webp) |
| Save failure, town services, endgame, crafting dialog | [Sheet 3](mobile-en-3.webp) | [Sheet 3](mobile-zh-CN-3.webp) |
| Desktop character | [Character](desktop-character-en.webp) | [Character](desktop-character-zh-CN.webp) |
| Desktop skill tree | [Skills](desktop-skills-en.webp) | [Skills](desktop-skills-zh-CN.webp) |
| Desktop filled inventory | [Inventory](desktop-inventory-en.webp) | [Inventory](desktop-inventory-zh-CN.webp) |
| Desktop paused battlefield | [Combat](desktop-combat-en.webp) | [Combat](desktop-combat-zh-CN.webp) |

The compact WebP evidence and JSON reports are retained here. Temporary raw
PNG captures, fixture HTML, browser scripts, and production build output are
disposable and removed after the final handoff.
