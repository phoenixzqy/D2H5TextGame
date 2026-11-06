# P12b / P16 — Runeword recipe guide

2026-11-04. Local implementation and affected verification complete; full
private v1 remains incomplete. Requirements: work-plan P12b/P16, playable-target
G4/G5 and D10 Slice B/all 35 runewords. [Quick design](../../design/runeword-guide.md).

## Change

Socket insertion now has a collapsed native recipe disclosure. It reads the
existing schema-validated `socketRunewords` catalog; all 35 localized names are
available before materials are spent. Each recipe shows white/normal rarity,
exact socket capacity, allowed base alternatives, equip level/base requirements,
ordered runes and full-recipe required/owned quantities. Repeated ingredients
are counted: Last Wish requires three Jah. Weapon restrictions apply only to
weapons, preserving Spirit's shield and Fortitude's armor alternatives.

Browsing reads inventory balances without changing targets, insertion material,
economic state or action ordinals. Existing preview/confirmation owns insertion.
No matcher, item stats, catalog, save format, economy or combat rules changed.
Existing discard remains discard under D10. Both languages have the same native
controls, labeled ordered list and ingredient-table headers. New selector text
is 16px with 44px controls; numeric columns leave headings readable at 360px.

## Verification

- Legitimate pre-edit RED: six new bilingual public-panel cases failed because
  the guide did not exist. Fixture rune names were corrected to the canonical
  Chinese translations before GREEN; no behavioral assertions were removed.
- Twelve selected panel cases pass: six new guide cases, two existing ordered
  insertion cases and four existing ratio-valued previews. The original filter
  missed target-preparation titles; only those two missing cases were then run,
  and both pass. No broad suite or completed-act replay.
- Scoped strict types and explicit three-file lint pass. Initial lint rejected
  an unnecessary optional armor-slot fallback; it was removed using the required
  catalog field. The only later source adjustment was a table-width class,
  verified by the layout-only browser pass. Existing Modal `act` warnings from
  the selected older preview tests remain in the test log; they are not browser
  errors or newly claimed fixed behavior.
- Native installed Chromium uses the real app without `VITE_E2E` or a store
  bridge. An unchanged earned Fire Sorceress export (level53, material action
  ordinal908) enters through the public Import Save dialog. Both locales expose
  all 35 names; all 70 recipe observations match canonical rune order, exact
  capacity/level and required/owned totals. Spirit/Fortitude/Dream alternatives,
  native keyboard disclosure/select, preserved target/material and absence for
  other actions pass.
- Geometry passes at 360×640, 412×915, 640×360, 1280×800, 1920×1080, 375×667,
  393×851 and 768×1024 in both languages: no document/guide horizontal overflow,
  guide controls at least44×44 and selector text at least16px. Screenshot review
  found the initial narrow English heading wrap; the width-only refinement
  receives a separate 16-observation layout pass with single-line table headings.
  Viewport captures supplement tall-element captures affected by fixed navigation.
- Before/after public exports match exactly for version, player, inventory, map,
  mercs, formation, endgame and both recruitment/gacha states. Ordinal908 remains
  unchanged. The layout-only continuation also preserves these domains. Successful
  browser passes report zero console/page errors or warnings; screenshots inspected.

The first browser launch failed before character creation: the external helper's
CWD made Tailwind miss the project configuration and return CSS500. The helper
now explicitly enters the claimed worktree before starting Vite. Its failure
report, screenshot, process receipt and diagnosis are retained separately; the
failed entry did not execute gameplay. This is source-browser evidence, not
production-bundle/PWA or independent final acceptance.

## Evidence and cleanup

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-runeword-guide-ot154aur`.
It retains the prospective plan, original file snapshots, source-only task patch,
source/input hashes, RED/GREEN/check receipts, native scripts/reports/exports,
screenshots and cleanup receipt. Earned source export SHA256:
`ac953ed34af41dac8500ce4fbf684db35694cdacbb6c7cf9d556830dd5d0a043`.

Both exact owned servers are closed. All 15 recorded checker/browser/server PIDs
are absent. Exact task browser profile, Vite cache and active type configuration
are removed and absence verified; the configuration is archived as evidence.
No remaining disposables or cleanup failures. Root retains the required packet
and claimed human2 worktree through unfinished umbrella review, and owns later
exact evidence cleanup/worktree release once their consumers finish.

## Remaining scope

This closes recipe discoverability only. It adds no acquisition, all-family
crafting/combat utility, economy/pacing, campaign, formal balance or PWA acceptance
credit. Counts stay14/14 ActI,8/14 Normal and0/210 formal balance signoffs.
Six unfinished builds, broader acquisition/crafting/economy/pacing, higher
difficulties/endgame, PWA/a11y/performance and independent final acceptance remain.
No pending answer or external browser blocker. CI stays excluded; no new agents,
installations, commits, pushes or publication. Extended human playtest follows
implementation.
