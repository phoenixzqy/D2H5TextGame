# BUG-242 — Keep application chunks in the offline precache

- Status: locally repaired and verified at664f8ea4; independent and broader performance acceptance open.
- Severity: High — the production entry bundle is unavailable to offline reload.
- Owner: root, frontend/build/PWA; independent review remains open.
- Reproduced base: `339258e1` plus the uncommitted Battle Command UI increment.
- Environment: Node24.21.0, Vite5.4.21, Workbox7; emitted production assets,
  browser/viewport/locale independent. Final bilingual desktop/mobile offline acceptance passes4/4.
- RNG seed: not applicable; deterministic build/manifest verification.

## Reproduction

1. Build the current source with `VITE_E2E` unset into a task-local directory.
2. Run `node scripts/check-offline-precache.mjs <directory>` against that build.
3. Compare emitted JS/CSS assets with the actual generated `sw.js` precache.

Expected: all application chunks are precached, so a warmed offline reload can
load the application and its saved character.

Actual: the production build exits0 but Workbox excludes
`assets/index-7kCGm61R.js`. Its actual UTF-8 size is2097573bytes,421bytes over
the unchanged2097152-byte Workbox limit. The unchanged checker exits1 with
`Required application assets absent from precache: assets/index-7kCGm61R.js`.
This manifest failure blocks offline acceptance; it is not a measured browser
failure or evidence of save loss.

## Evidence and cause

Raw build/precache logs and terminal receipts are task-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-command-ui-jlln85u7/`
(`ui-build.{log,json}`, `ui-precache.{log,json}`). Root retains these until final
BUG241/242 evidence is archived and exact disposable cleanup is verified.

Static game-data/schema JSON still shares the application entry despite prior
vendor separation. Separate these side-effect-free leaf modules into a game-data
chunk; preserve existing vendor groups, eager data availability, schema checks,
the cache limit and the actual precache checker. Verify emitted bytes and actual
production online/offline browser startup and saves, including clean console.
The existing oversized optional art manifest is a separate recorded limitation.

## Local repair and verification

`664f8ea4` assigns only src/data leaf JSON to an eager game-data chunk, retaining
all four vendor groups and the unchanged2097152-byte Workbox limit/checker.
Final tested entry1399907bytes, data682786bytes; all six JS and CSS are precached
(756unique URLs, missing[]). Official bridge and exact tested-build five-pattern
scan pass. Full17075tests/772files/two existing skips, types/lint/build and
production4/4 pass, including four actual offline reload/Continues and exact saves.

[Evidence](../../docs/plans/evidence/d06-battle-command-ui.md) records original
failed checker, tested/official emission differences and existing500kB,
Browserslist and optional2.57MBart-manifest warnings. Independent acceptance
and broader offline/performance budgets remain open. No cache guard was weakened.
