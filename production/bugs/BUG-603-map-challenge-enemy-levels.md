# BUG-603 — Show whole-challenge enemy levels on the map

Status: fixed locally, uncommitted; scoped verification passed. Severity: Medium.
Found: 2026-11-02. Owner: root (engine/frontend responsibility).
Base: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus retained uncommitted
source authority73. Environment: local Linux/WSL, Vitest/jsdom MapScreen,
zh-CN/en. Browser viewport is not involved in this component reproduction;
real-browser responsive verification follows the fix. No combat seed needed
for the static display; retained native planner boundaries use0/7/4294967295.

## Reproduction

1. Render the real MapScreen with Normal selected, in English or Chinese.
2. Expand Act II (the display is also visible while the act is locked).
3. Read the Tomb of Tal Rasha row.

Expected: an enemy range covering the complete ordinary challenge,27–32,
including later waves, the difficulty bonus and Duriel. This is enemy-level
information, not an unmeasured recommendation about adequate player power.
Actual: `Recommended Lv: 25` / `推荐等级: 25`. Lost City similarly hides its
22–26 range. Replay profiles offset only the misleading base level.
Former workaround: prepare against the actual encountered enemies. The fixed
map now displays their complete ordinary-challenge level range.

Evidence: `bug603-ui-red-v2.json` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Six locale/profile regressions fail on the actual old label; six existing
MapScreen cases pass. REDv1 used a mistaken Tomb alias and is retained as a
test-setup failure, not a bug reproduction. Regression: MapScreen.test.tsx.

## Quick design and implementation plan

Replace the misleading label with `Enemy Lv: {{min}}–{{max}}` and
`敌人等级: {{min}}–{{max}}`. Memoize a normal projection per canonical map
row, and apply the existing replay level offset to each endpoint on render.
Keep the current controls/layout. Add a documented engine projection beside
the native planner; share template selection, scaling, caps, elite fitting
and boss authority. Do not select one random sample as the complete range.

For regular prefixes, minimum source counts expose every level that can
survive truncation; increasing counts only moves later sources out. Project
the maximum configured target size. For later-act final rare packs also
project maximum source counts: the special leader can replace the first
body, larger counts can retain a second body, and they can cap away every
eligible leader, restoring the first body as the fallback leader. The union
of minimum/maximum projections covers these cases without an RNG search.
Boss source order/caps, chapter replacement, empty and synthetic fallbacks
follow native planning. Optional quest sources are separate from this range.

Acceptance: literal current Tomb/Lost City ranges; canonical29-area planner
seed/count boundaries with observed endpoints; constructed randomized-count,
prefix/global cap, rare-leader/replaced-first-body, authored/explicit/chapter
boss and fallback cases; real-store MapScreen locale/replay tests; affected
planner tests, scoped strict types/lint/purity; real-browser responsive output.
No campaigns, unrelated suites, coefficient tuning, save or authored-data edits.

Plan review: ready. Completeness requires count extrema and the unusual rare
leader replacement, not seed0 sampling; both are explicit and tested. Existing
native calls retain their RNG draws and counts through a shared private helper.
Security check: pass. Scope: authorized local engine/UI/tests/docs; no actionable
findings, dependencies, secrets, network exports, grants, privilege or publication.
Proceed root-only, without installs/commits/pushes or unrelated tests. This fix
does not accept balance/pacing or shrink the full-v1 objective.

## Resolution and verification

The engine projects reachable level extrema using the same source expansion,
scaling, fitting and boss rules as admission. The map applies the selected
replay offset to both endpoints. Native planner RNG/count behavior is unchanged.
Optional quest encounters remain outside the documented ordinary-challenge range.

Retained packet results: `bug603-engine-green-v1.json` (119 passing planner/
projection cases), `bug603-ui-green-v1.json` (12 passing UI cases), and v2 lint/
strict-types/purity exit receipts (all zero). The later UI-test-only lint edit
replaces a non-null assertion with a required role lookup; production is unchanged.
`bug603-browser-v1.json` passes 18 ordinary UI cases: both locales at nine
viewports from320×640 to1920×1080, including the five required sizes. Keyboard
Act II expansion, actual labels, no row/page overflow, no console/page/request
errors pass. The English360×640 screenshot was visually inspected.

Source authority74 independently enumerates2,142production inputs: exactly the
six projection/map/locale/test changes from73. Authored data and all107campaign
inputs are exact. No combat/campaign or unrelated suite replay. The browser
and owned server have exited; task cache/profile cleanup is recorded in the
closure evidence. Full-v1 balance and pacing acceptance remain open.
