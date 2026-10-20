# Merc progress defaults ignore the owned level

- **Status:** Fixed and validated in the bounded P13a correction; ready for integration.
- **Severity:** Medium, gameplay correctness; historically surfaced as a flaky test.
- **Owner:** engine-dev / frontend-dev.
- **Approved contract:** `docs/plans/p13a-merc-progress-defaults.md`.
- **Dependency head:** `d5ca217` (2026-10-20).

## Historical observation retained

QA on `perf/rootcause-quarantined-flakes` observed the formerly skipped
`startSimpleBattle — Bug #12 > shares combat victory XP with the fielded merc`
fail 3/10 isolated runs (~30%). The historical failure was
`expected +0 to be 60` at combatHelpers.test.ts:534. Those line numbers and
failure rate describe that old time-seeded fixture, not current acceptance.
The earlier reproduction removed `.skip` and repeated the named Vitest test
10 times. Its actual slain-enemy XP varied with the rolled wave.

A new level-ten merc received a level-one 60 XP threshold. Shares below 60 escaped
the defect; shares at/above 60 caused a phantom level and spent 60 XP, including
zero residual when the share equaled 60. That is a runtime progression defect,
not merely test timing. Current exact curve values are L1=60, L3=304,
L10=6362 and L11=9098. Previous approximate L10/L11 numbers in this report are
superseded by these exact values.

## Current root cause and compatibility contract

The old `initialProgress()` supplied level-one 60 XP to new merc insertion,
missing-entry reads and missing-entry awards regardless of owned level.
MercCard separately used 50. Authored hire/factory level comes from reqLevel; the prior claim that
the shop scales merc level with player level was inaccurate. No factory or
shop-scaling change belongs to this fix.

Initialize new progress from the actual merc level. Owned missing-entry reads
and positive-XP awards use its current level; unknown-ID reads retain the
harmless level-one fallback and unknown-ID awards remain no-ops. A getter must
not publish store/save state. MercCard uses the authoritative getter outside
its saved-progress selector, preserving subscriptions to explicit progress and
owned-level updates without returning a new default object from the selector.

Explicit stored progress is authoritative, including a custom 50 XP threshold.
Preserve hydration, XP/threshold values, factory reqLevel, schema, existing
curve, floor(heroXP×0.75) merc share and per-level gains. No migration or schema
bump is needed for absent progress. Repairing historical explicit thresholds
or phantom stat gains requires a separate compatibility policy; the former
proposal to rewrite saves/bump schema is superseded. This correction does not
redefine the curve, recruitment economy, art, gacha or MercCard stat display.

## Genuine current RED before runtime changes

At 2026-10-20 06:56:13 UTC, run:

```sh
npx vitest run --project ui src/stores/mercStore.test.ts src/features/mercs/MercsScreen.test.tsx src/stores/combatHelpers.test.ts --reporter=dot --silent
```

Result: 3 failed files, 12 failed / 47 passed cases, 3.25s. Both new and missing
L10 awards of 60 incorrectly returned L11, and the owned missing getter returned
60 instead of 6362. The authored reqLevel 3 hire initialized 60 instead of 304.
The UI showed `经验0 / 50` instead of `0 / 304`. The restored deterministic
real-combat assertion reached the share precondition (>=60 and <6362), then
failed because the original L10 merc was replaced by L11 with phantom stat
gains. The fixed wave grants 160 baseline hero XP and 120 merc XP (later asserted
explicitly as well as the required share bounds). Regression source retains
this reproduction; no disposable log file.

The combat regression now uses actual startSubAreaRun, fixed runSeed 7 and
challengeOrdinal 0 in Blood Moor, a surviving winning hero, real playback and
award finalization. No time-derived seed, synthetic XP replacement, skip,
soft assertion or weaker outcome check. Controlled high-power fixtures prove
wiring, not earned progression or balance.

Security check: pass. Scope is local progress-default arithmetic and shared
UI fallback, with explicit saved values preserved; no credentials, network,
permissions, external writes, CI or agent-behavior change.

## Resolution, validation and cleanup

New merc insertion, owned missing-entry reads and positive awards now derive
their threshold from the owned level. MercCard reads the same store fallback.
The getter publishes no state; explicit saved XP and thresholds remain intact.

Validation on 2026-10-20:

- Focused three-file regression suite: 59 passed, 3 files, 3.30s.
- After adding literal hero 160 / merc 120 assertions, the named combat
  regression passed in 2.77s; the other 26 cases were excluded by the name
  filter, not source skips.
- `npm run test:related -- src/stores/mercStore.ts src/features/mercs/MercsScreen.tsx --reporter=dot --silent`:
  461 passed, 39 files, 20.69s. This exceeds the 5s related-test target.
- `npm test -- --reporter=dot --silent`: 1290 passed, 112 files, no skips,
  26.86s. This exceeds the 15s full-suite target; no expectation or gate was
  weakened to address timing.
- `npm run typecheck`, `npm run lint`, `npm run build` and `git diff --check`:
  passed. Build retained the existing stale Browserslist, large-chunk and
  oversized generated-manifest precache warnings; asset rendering took 9.01s.
- Root and producer independently approved the six-file source/test/evidence
  diff with no material findings.

After all validation processes finished, removed task-owned `dist` and
`node_modules/.vite/vitest`, then its empty `.vite` parent. Verified `dist`,
`coverage`, `node_modules/.vite`, `.vite`, `test-results` and `playwright-report`
absent. Pre-existing `node_modules` is preserved. No task server or temporary
log remains.

No full P13/campaign acceptance is claimed. Ordinary earned recruitment,
fielding and combat L3→L4 at 304 XP, exact gains and save/reload remain a
separate P13 acceptance card.
