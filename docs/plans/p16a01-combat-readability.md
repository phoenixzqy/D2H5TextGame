# P16a01 — Readable combat formations on mobile

Status: scoped implementation/final matrix accepted after independent
producer/QA/UX/TD source and complete durable-packet review. Geometry RED577 assertions
and the first failed GREEN are retained in BUG-056 and the evidence packet.
Root owns all edits and execution in the claimed worktree. Producer/QA/UX/TD
review read-only. Full P16/G5/private v1 remain open.

## Surface, goals and pillar

Combat entered normally from the map. Make each combatant's full name, HP,
formation position and feedback readable at360px; keep the toolbar and log
reachable. This serves the text-first/mobile-first requirements in
`Diablo2TextGame.md:58–77`; the referenced standalone pillars and adjacent UX
flow documents are absent. Preserve the existing dark D2 art/palette.

## Flow and decisions

Map Enter → native W1 → Pause → inspect/scroll either team and log → Resume
or Flee → map. Existing secondary controls remain: formation modal/open-close,
speed cycle, auto checkbox, Skip → terminal return to map/town. No flow,
handler, keyboard order, disabled state, engine/store/save or localized copy
change. Close/exit retain existing behavior; offline remains production PWA.

## Wireframe at360×640

Identity / wave / subarea / act
Wrapping toolbar (44px targets,8px gaps)
Scrollable main:
  MP strip
  Allies: existing3×3 base cells / extra rows
  Horizontal wave / clash band
  Enemies: existing3×3 base cells / extra rows
  Combat log / terminal actions

Vertical scroll is expected; all grids/log need not fit above the fold.

## Responsive contract

Below1024px stack allies→separator→enemies; keep all three columns, native
row/column order,9base cells/team, extra rows, stacked-unit identity and
acting/dead/rarity feedback. At360px occupied card width≥84px; at412px≥100px.
Mobile names≥14px/18px line-height, wrapping completely (including long
unbroken names), no ellipsis or reliance on title. Mobile HP track≥6px,
existing true-max/clamp calculation unchanged. Mobile image64px; minimum
cell112px, allow content growth; empty cells cannot impose desktop128px min.
Compact separator40–48px high. Mobile identity above wrapping toolbar;
all toolbar hit areas≥44×44 with8px gaps and no overlap. Landscape main≥120px.
At≥1024px retain existing side-by-side layout, separator, card minimums,
art/typography. Desktop toolbar touch minimum44px is an allowed delta. Keep presentation changes local to CombatScreen.

## Affordances, copy and accessibility

Reuse native buttons/checkbox/modal/log landmarks, labels and live regions.
Pointer, touch and keyboard activation remain. Existing i18n keys only:
combat wave/subarea/act, formation.edit, pause/resume, speed/speedX, skip,
autoMode/flee, battlefield.*, allies/enemies/noAllies/noEnemies, log and
terminal actions. Full localized names must wrap, with no new string limit.
No new gestures or art assets. This slice checks target sizes, modal Escape,
visible labels and reachability, not full contrast/screen-reader certification.
Keyboard order preservation is assigned to final source review, with no runtime
Tab-order acceptance claim.

## Components and verification handoff

Reuse ScreenShell/Panel/Button/StatBar and existing Battlefield/BattleSideGrid/
UnitCard; no shared design-token change. Freeze independently reviewed real
production browser assertions before genuine pre-fix geometry RED; file BUG
before presentation patch. Use ordinary fresh Druid/freeRogue/W1, paused same
state across360×640,412×915,640×360,915×412,1023×768,1024×768,1280×800,1920×1080, en/zh-CN.
Assert geometry, no document/main horizontal overflow, text and feedback
containment, visible cell/representative card/HP-percent/MP/log and readonly saved-state resize
invariance; hidden status records/stack occupants are not observable in compact
DOM. Separate synthetic render controls cover extra-row/stack representative.
Screenshots and native toolbar/Pause/Resume/Flee plus terminal return smoke
supplement geometry; no balance/clear inference. Configure verified host-only
CJK font before screenshot judgment, never add a product font to hide host setup.

Review/freeze → pilot RED → BUG → small presentation fix → pilot GREEN →
full U/T/L → reader release → clean production build and browser locale/size
matrix → independent source/evidence review → commit → exact artifact cleanup.
Bounded runners retain all failed attempts; deadlines/caps unchanged. No remote
push/PR/merge/deployment. Preserve pre-existing emptycoverage/shared caches.

## Frozen execution proposal

Use a supported unbroken16-character hero name to positively witness wrapping.
Measure inner compact card/text Range line rectangles against clipping ancestors,
not outer grid width alone. Scroll a complete occupied card/name/HP into the
unobscured main viewport for each team, then reach log. Save explicitly before
entering; native first feedback then nonterminalW1 Pause establishes stable
visible and readonly-IDB baseline. No timer acceleration/debug bridge/state writes.
Resize route uses only W1Flee. A separate fresh-context control route checks
formation open/Escape without assignments (no rollback claim), exact speed cycle
and checkbox state, native resume/log/resource feedback, then Skip on at most
three waves/one run and either terminal return, with no clear/balance claim.

Retries0/traceoff from start;90s/case; browserpilot150/matrix210s, plus2s exact
owned cleanup. Focused30/unit120/types90/lint90/build210;32MiB/log/report,
64MiB total RAW+dist+.vite. Only360/1280 screenshots perlocale in layout route;
all8sizes numeric evidence. Host font verified against Ubuntu packageSHA256;
temporary font/config/cache/deb and browser artifacts remain task-owned RAW
until durable archive verification and reader release, then exact removal.

QA pre-freeze amendments add computed/actual cell minima112px/mobile and168px/
desktop, empty-placeholder min0/mobile and152px/desktop; actual HP/feedback
containment and metadata-above-toolbar checks. Native controls require valid
HP-percent/MP baseline and naturally reached HP-or-MP change using native timers.
CDP effective-platform-font evidence requires actual WQY glyph usage on the
Chinese subarea label and detaches its session. Initial draft retained in RAW.
