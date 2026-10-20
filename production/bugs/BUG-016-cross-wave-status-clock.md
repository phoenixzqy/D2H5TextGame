# BUG-016 — Rebase carried status clocks at the next wave

Severity: High (status activity, remaining lifetime and combat outcomes).
Owner: engine/store integration. Card: P06c03.
Status: corrected and independently approved, 2026-10-20.
Prepatch HEAD: `32b5b4671ade24c7e476f9d80373e80dc5f5ffab`.
Environment: Node 24.21.0 / Vitest 1.6.1, jsdom production-store project,
seed 7 / challenge ordinal 0 / Blood Moor; no browser or locale dependency.

## Prepatch reproduction

Run `npm run test:ui -- src/stores/combatHelpers.cross-wave.test.ts --no-cache --reporter=dot`.
The two initial real two-wave cases both fail (2.50 seconds). D04 v1d and this
report precede any runtime patch or new helper. The fixture keeps real production
planning, enemies, targeting, status/damage engine and playback; it replaces
skill definitions and hero stats only, then restores the registry/stores.

Wave one genuinely applies seven-stack poison (10 DPS per stack) at 1540ms,
refreshes its expiry to 6740ms, and ends with a player win at 4000ms. Production
copies that record unchanged into a battle whose clock starts at zero. The
correct next-wave start/expiry are -2460 / 2740ms; actual values remain
1540 / 6740ms. Before wave two's first 1740ms action, actual poison damage is
14 instead of `floor(70 * 1.74) = 121`. The second case also asserts corresponding
playback HP after that action event, before its direct damage event.

The first draft fixture used a 100-second finisher cooldown; a valid dodge left
one enemy alive, causing a timeout before the intended transition. A one-second
fixture cooldown permits the real second cast and yields the observed 4000ms
win. No production code was changed to correct that fixture.

Root cause: `advanceWaveOrFinish` carries living non-summon units with absolute
status clocks from the completed battle, while `runBattleWithTimestamps` resets
its clock to zero. The omitted translation turns active statuses into pending
future effects and extends their remaining lifetime.

## Approved correction boundary

D04 v1d controls pure translation of present start/expiry clocks and removal of
already expired records, once on qualified actual next-wave carry. Preserve
missing clocks/legacy indefinite, remaining, status metadata and non-status
unit fields. Capture the trusted original recorded terminal `end` clock before
presentation injection; assert finite `[0, MAX_SIM_MS]`, allow fractions, abort
transient active run before throwing on violation, and publish no new battle.
Never infer elapsed time from actions, rounds, UI delays or fallback zero.

No replay double subtraction, outcome mutation, final-wave rebase, wall/playback
time advancement, result/save API expansion, cooldown/buff/summon policy change,
fractional DoT carry transfer, numeric tuning or broader D04 work. Six-file
exception approved by root and producer: two runtime files, separate Node/jsdom
test files, D04 and this required report.

Security check: pass; pure transient arithmetic and internal engine-output
assertion, no new IO, credentials, permissions, persistence or policy bypass.

## Validation and review

Implemented a pure `rebaseStatusClock` helper and trusted terminal-clock capture
in the production carry path. The completed outcome and current replay input stay
unchanged; only the next wave's living non-summon carry receives translated clocks.

- Focused Node tests: 13 passed. Focused jsdom production tests: 16 passed.
  These cover genuine poison/HP changes, periodic-only terminal time, actual
  control/action boundaries, repeated transitions, replay/pause independence,
  metadata/immutability and invalid/fractional/boundary terminal clocks.
- `npm run test:engine -- --no-cache --reporter=dot`: 41 files / 451 passed,
  7.78 seconds.
- `npm test -- --no-cache --reporter=dot --silent`: 104 files / 1104 passed /
  one existing skip, 58.08 seconds. Existing outcome, replay and playback
  qualification regressions pass, including draw/dead-hero/incomplete playback.
- `npm run typecheck`, `npm run lint`, `npm run build`: pass. Six initial lint
  errors in the new test were corrected; the coverage run includes those final
  tests. Build retains existing Browserslist-age, large-chunk and PWA precache
  size advisories.
- Changed-module V8 coverage: 21 related test files / 284 passed / one existing
  skip. `status.ts`: 99.10% statements/lines, 96.39% branches, 100% functions;
  `combatHelpers.ts`: 93.88% statements/lines, 73.97% branches, 95.45% functions.
  Combined: 95.62% statements/lines, 83.65% branches, 97.14% functions; configured
  coverage gate passes without reducing thresholds.
- Engine/full-suite elapsed times exceed the documented 3/15-second budgets;
  these passing functional gates do not establish performance-budget acceptance.
  No unrelated performance change is included.
- Root and producer independently reviewed the final source/tests/D04 contract:
  APPROVE, no material findings. Producer also reviewed the test-only lint fixes.

Task-owned `dist` and `coverage` directories were removed after all validation
processes finished; deletion was verified. No `node_modules/.vite` remains.
Pre-existing dependencies and shared caches were preserved.
