# BUG-114 — Diagnose the earned inventory observation timeout

- Status: Fixed; independent source and production-evidence review accepted.
- Severity: Medium; inventory appears in the later screenshot, exact holdings
  survive export/import, but required browser/UI/persistence acceptance stopped.
- Owner: root / QA / frontend performance.
- Build/harness: `96bc8b9`, production Chromium at360×640, English.
- Seed: ordinary earned Normal ordinal252; no supplied seed or rerun.
- Affected: synchronous inventory comparison work with a large earned backpack.

## Reproduction

1. Public-import the exact earned L24 native17 character under the frozen
   production build, preserving all5680 owned original gear payloads.
2. Complete the sole ordinary Catacombs challenge through six native victories.
3. Export the earned v18 state, public-import that exact download and export
   again. Exact persisted gameplay-domain equality passes.
4. Select English and click the ordinary Inventory navigation link. Require
   five concrete material rows under materials-panel within the existing5s.

Expected: inventory renders all owned material rows and their exact quantities.
Actual: the count assertion sees0 rather than5 and times out. A later stopped
screenshot shows Inventory with Eld1; stopped export preserves the exact five
stacks. Browser warnings/errors and page errors are empty. The error-context
snapshot is Settings after catch-path export, not the original failing route.
There is no completed manual-Save/new-page-Continue proof from this invocation.

## Evidence and next diagnosis

Exact raw evidence is root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-earned-materials-_gkzh9u6`:
browser-report.json, failure.json.gz, stopped-screen.png, earned-export.json.gz,
earned-reimport.json.gz and stopped-export.json.gz. The immutable build/source
freeze has2297files and post-run drift is empty. One real test failed; do not
report the whole scenario as passing or repeat combat.

The input retains5677backpack items after this run. A separate storage-only
public import and CDP CPU profile confirms the defect: navigation returns in
77ms, but the panel appears after40.838s. Of the40.793s profile,37.4s is beneath
the backpack comparison memo, with about27.7s in repeated quest entitlement and
catalog validation. This passive diagnostic is not acceptance and does not
relax the original5s assertion. Exact observations/profile are under
`storage-diagnostic/` at the evidence root above.

The fix prepares canonical quest bonuses and current equipment stats once per
inventory comparison batch, then derives each candidate with the same equipment,
core-stat, quest, resistance and resource-clamping rules. React memo dependencies
include the player, equipment and complete quest context. There is no global
cache, hidden gear, discarded item or changed eligibility/upgrade predicate.
Three new regression tests cover parity, constant quest-resolution calls across
100candidates, and a fresh player/quest snapshot; existing actual-equip parity
and quest tests provide independent correctness controls.

The separate `materials-storage` production test uses unchanged retained earned
JSON, preserves the original failure and launches no combat. It retains the5s
panel requirement, checks all5693 owned payloads and five material stacks,
and requires manual Save/read-only IndexedDB/close/new-page Continue plus
bilingual mobile/desktop panels. It passes1/1 in38.216s, retries0 and no browser
warnings/errors. Four route mounts take3232.04/2844.55/3371.35/2869.24ms, all
below the unchanged5000ms boundary. All5693 full owned payloads, currencies,
material counts and ordinals conserve exactly through every barrier.

Final full unit10312/369PASS (two existing opt-in skips), engine4826/134PASS,
typecheck/lint/scoped lint/build and seven-JS bridge scan pass. Existing test
runner budgets remain exceeded. Independent QA returns ADEQUATE, verifies all
1745 frozen hashes and12 absent tracked processes, and inspects all eight
screenshots. [Durable evidence](../../docs/plans/evidence/earned-materials-browser.md)
preserves the original failure, profile and separate passing storage result.
This resolves the measured inventory defect; cache/crafting/campaign acceptance
does not follow.
