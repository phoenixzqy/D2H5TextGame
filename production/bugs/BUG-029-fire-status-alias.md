# BUG-029 — Unify Fire Bolt burn with the ignite status family

- **Status:** Fixed in11eb6b3 (worker ca66d0a), validated and independently approved.
- **Severity:** Medium — fire hits land, but their burn duration, stacking and combo behavior are incorrect.
- **Owner / affected systems:** engine-dev; combat status identity, periodic damage and fire combos.
- **Environment:** Linux, Node/Vitest engine project; no browser, viewport or locale dependency.
- **Reproduction head:** `23d8047` on `fix/fire-status-family-p08a01`.
- **Controlling contract:** `docs/plans/decisions/D04-fire-status-alias-v1.md`.
- **Seed:** 7 for actual production Fire Bolt and alias cases; seed 1 for the miss control.

## Reproduction and genuine RED

1. Use the production registry-loaded `skills-sorceress-fire-bolt` (no replacement spell).
2. Create the fixed regression snapshot in `src/engine/combat/skill-resolution.test.ts`: one cast at 1700ms, exactly 8 mana, a 500-HP zero-defense/resistance target, and later actions held so the full first burn is isolated.
3. Run rank 1 and rank 20 with seed 7. Independently calculated first hit/range/crit draws give literal direct hits 30 and 106; authored damage growth is +4 per rank.
4. Run the alias, legacy, combo and final-interval regressions:

```sh
npx vitest run --project engine src/engine/combat/status.test.ts src/engine/combat/skill-resolution.test.ts src/engine/combat/combo.test.ts src/engine/combat/periodic-timing.test.ts --reporter=dot --silent
```

At **2026-10-20 07:18:04 UTC**, before runtime edits: exit 1, **4 failed files,
17 failed / 60 passed cases**, **1.14s**.

**Expected:** A new burn canonicalizes to ignite, lasts three simulated seconds
and shares its max-five stack bucket and combo identity. Rank 1 applies 9 total
burn damage: 5 at 3400ms and 4 at the exact 4700ms expiry, leaving target HP 461.
Rank 20 applies 30: 17 at 3400ms and 13 at 4700ms, leaving HP 364. Existing
legacy records preserve payload/clocks under the approved refresh policy.

**Actual:** Rank 1 instead applied only 3 at 2700ms (HP 467); rank 20 applied
only 10 at 2700ms (HP 384). Legacy burn physical combo returned 1 rather than
1.25. Alternating applications created separate burn/ignite buckets; alias
lookup/removal/refresh disagreed. The rate-less legacy refresh created a new
99-DPS ignite record instead of retaining the original rate-less record.

Evidence is retained in the regression source and these exact RED results;
there is no disposable output log.

## Root cause and bounded correction

Production JSON declares `burn`, while `STATUS_DEFAULTS` and fire combo queries
recognize `ignite`. Unknown burn takes the one-second/max-one fallback. Resolve
the family centrally in `combat/status.ts`, preserving explicit configuration,
first-match mixed-record policy and active legacy payloads. Fresh/replaced
records use ignite. Explicit removal matches both aliases; no migration,
deduplication, rate invention or global snapshot rewriting is authorized.

Security check: **pass**. The approved content changes local pure status
identity only; no credentials, network, permissions, schema, CI or external
writes are involved. Preserve seeded RNG, immutable inputs and all existing
timing/death rules.

## Resolution and verification

The runtime correction is confined to `combat/status.ts`: one private
canonical-name helper governs configuration, first-match application, presence,
stack lookup and explicit family removal. Active refresh retains the stored
legacy ID and payload. No adapter, data, schema or combat arithmetic changed.

Validation on 2026-10-20 (all final commands exit 0):

- Focused four-file suite: 77 passed / 4 files, 1.20s at 07:19:08 UTC.
  Final confirmation after test-only lint cleanup: 77 passed, 1.10s at
  07:21:16 UTC. Both ranks match literal HP/times; repeated recorded and
  unrecorded execution agrees and inputs remain immutable.
- `npm run test:engine -- --reporter=dot --silent`: 522 passed / 42 files,
  5.30s. Exceeds the 3s engine target.
- `npm run test:related -- src/engine/combat/status.ts --reporter=dot --silent`:
  644 passed / 51 files, 22.91s. Exceeds the 5s related target.
- `npm test -- --reporter=dot --silent`: 1317 passed / 113 files, no skips,
  27.99s. Exceeds the 15s full-suite target. No old fixture failure appeared;
  no gate or expectation was weakened to address timing.
- `npm run typecheck` and `npm run lint`: pass. The first lint run identified
  unnecessary narrowed ternaries and non-null assertions in new tests only;
  those were corrected without changing expected outcomes, then both commands
  passed on the final source.
- `npm run build`: pass, asset rendering 10.03s. Existing stale Browserslist,
  large-chunk and oversized generated-manifest precache warnings remain.
- Changed-module V8 coverage: `status.ts` statements/lines **99.13%**, branches
  **96.52%**, functions **100%**; 124 tests / 4 files, 2.57s. Command:

```sh
npx vitest run --project engine src/engine/combat/status.test.ts src/engine/combat/periodic-timing.test.ts src/engine/combat/boss-duration.test.ts src/engine/combat/cross-wave-status.test.ts --coverage --coverage.include=src/engine/combat/status.ts --coverage.reportsDirectory=coverage/p08a01 --coverage.reporter=text --coverage.reporter=json --reporter=dot --silent
```

Independent root source/test review: **APPROVE**. Independent producer
source/evidence review: **APPROVE**, evidence **ADEQUATE** for the bounded card.
Both reviewers finished consuming coverage evidence before cleanup.

Task-owned `dist`, `coverage/p08a01` (including `coverage-final.json`) and
`node_modules/.vite/vitest` were removed after validation and reviews; empty
task-created `coverage` and `node_modules/.vite` parents were removed. Verified
`dist`, `coverage`, `node_modules/.vite`, `.vite`, `test-results` and
`playwright-report` absent; pre-existing `node_modules` preserved. No task
process or disposable artifact remains. Root integrated11eb6b3 with P03b05a:
1332passed/115files/no skips34.49s, engine522passed/42files7.17s,
typecheck/lint/build pass (build12.49s), started07:23:48UTC. Tests/build/lint
ran concurrently; timing targets remain unmet. Root removed and verified absent
its exact task-owned dist/node_modules/.vite after all processes completed.

Firestorm's missing authored rate, curse/recovery effects, scaling/MR/rounding,
other skill identities and ordinary C1 browser acceptance remain separate.
