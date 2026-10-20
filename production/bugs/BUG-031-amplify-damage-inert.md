# BUG-031 — Apply authored Amplify Damage resistance reduction

- **Status:** Runtime fixed and validated locally; reviewed integration pending.
- **Severity:** High — the production physical-resistance curse spends mana but has no resistance effect.
- **Owner / affected systems:** engine-dev; combat debuff metadata, status identity and direct physical damage.
- **Reproduction head:** `f3892e9d04032c4cdbf650893ee4af56cc6a7477` on `feat/amplify-runtime-p08a02c`.
- **Environment:** Linux, Node/Vitest engine project. Browser, viewport and locale are not applicable to this pure-engine reproduction.
- **Controlling contract:** `docs/plans/decisions/D04-amplify-damage-v1.md`.
- **Seed:** 1 for production ranks, resource/cooldown, status and resistance fixtures; 3 for the fixture with all targets.

## Reproduction

1. Resolve the actual registry skill `skills-necromancer-amplify-damage`, whose JSON authors 3000 ms and 50 physical-resistance percentage points.
2. Use `amplifySnapshot` in `src/engine/combat/skill-resolution.test.ts`: caster AS 263 acts once at 400 ms with exactly 15 mana at rank 1 or 11 at rank 20. A pending stun holds every later caster action. The target has HP 500, physical resistance 50 and defense 10, and never acts.
3. An ally with fixed 100 physical damage and AS 100 attacks at 1700 ms and 3400 ms; a pending stun holds later attacks. Separate runs hold the ally at entry or after its first action to prove intermediate HP.
4. Run the production and status regressions before modifying runtime source:

```sh
npx vitest run --project engine src/engine/combat/status.test.ts src/engine/combat/skill-resolution.test.ts --reporter=dot --silent
```

At **2026-10-20 07:56:23 UTC**, exit 1: **31 failed / 48 passed**, two failed files, **1.25 s**. The earlier initial fixture run at 07:55:36 had 30 failed / 46 passed; before this final RED, cooldown HP oracles were corrected from an independent Seed 1 draw calculation, the legacy counter expectation was aligned with existing max-counter refresh, and three metadata-forwarding cases were added. No runtime source changed between these runs.

After explicitly marking the periodic negative control as physical damage, the final pre-runtime repeat at **08:00:37 UTC** remained **31 failed / 48 passed**, **1.22 s**, exit 1. Root and producer approved the RED evidence before any runtime edits.

## Expected and actual

Expected target HP is 500 after the damage-free cast, 410 after the active curse hit at 1700 ms, and 370 after the ordinary hit at the exact 3400 ms expiry. The corresponding uncursed controls are 460 and 420. The literal damage is 90 then 40, with no crit, dodge, periodic damage or other direct damage. Seed 1 hit/crit draws are `.6270739405881613/.002735721180215478`, then `.5274470399599522/.9810509674716741`; the next draw is `.9683778982143849`.

Actual production ranks both leave HP 420, with 40 damage at both 1700 ms and 3400 ms. Fresh direct status applications use the unknown-status one-second expiry at 1400 ms, preserve legacy `amplify` rather than canonicalizing it, and omit potency. Alias refresh/removal do not share a family. The final RED also proves resistance, clamp, default and first-active-record failures. Elemental, thorns and resource-negative cases pass; periodic negative assertions pass before that case's expected terminal-death failure.

Evidence is durable in the two regression files and these exact RED results; no disposable log is required. GREEN exercised and passed the final replay and input-immutability assertions after the original HP failures were fixed.

## Root cause and bounded correction

The debuff application drops authored millisecond duration and resistance metadata. Status defaults do not recognize the curse family, and direct physical damage reads the unmodified target resistance. Forward metadata into a complete scalar on fresh canonical statuses; derive family defaults from the pure JSON definition module. Resolve the first active family record for direct physical damage, subtract once before the existing act penalty/clamp/defense pipeline, and preserve first-stored aggregate refresh semantics. No stat mutation, duplicate summing, combo multiplier, thorns/elemental/periodic changes, save migration or other curse expansion is authorized.

Security check: **pass**. Trusted local deterministic engine work; no external publication, credentials, dependencies, permission changes or validation bypass. Root/producer review of this RED and test diff is required before the runtime fix.

## Workaround

Use ordinary attacks or other functioning skills; there is no way for the player to obtain the intended Amplify resistance effect in this runtime.

## Local resolution and validation

The bounded fix forwards defined millisecond duration and potency, adds JSON-derived Amplify defaults and alias identity, stores potency on fresh/replaced records, and reads the first active family's potency for direct physical damage before existing resistance and defense processing. Active refresh preserves stored payload and clocks. Source changes are limited to `types.ts`, `status.ts` and `combat.ts`; the two regression files prove the D04 contract. The helper documents its active-only caller precondition. Public status API comments describe both supported alias families.

All checks below ran on 2026-10-20 against the local fix over reproduction head `f3892e9d04032c4cdbf650893ee4af56cc6a7477`. No runtime or test changes followed the explicit test-kind guards described below.

| Command | Result |
| --- | --- |
| Focused RED command above, after fix | 79 passed, 2 files, 1.40 s; both real ranks produce HP 500 / 410 / 370 and literal hits 90 / 40 |
| `npm run test:engine -- --reporter=dot --silent` | 607 passed, 43 files, 5.09 s |
| `npm run test:related -- src/engine/combat/status.ts src/engine/combat/combat.ts --reporter=dot --silent` | Final frozen-source run: 698 passed, 53 files, 26.09 s |
| `npm test -- --reporter=dot --silent` | 1445 passed, 118 files, 33.36 s |
| `npm run typecheck` | Passed after adding explicit event-kind guards in two new test filters; assertions unchanged |
| `npm run lint` | Passed, including engine-purity check; no warnings |
| `npm run build` | Passed; Vite build phase 10.13 s; PWA generation completed |
| Changed-module coverage command below | 607 passed, 43 files, 4.23 s; all four configured 80% thresholds passed |
| `git diff --check` | Passed |

The first related run had 697 passed / 1 failed because the test-kind-guard edit overlapped production measurement. Its source-stability protection correctly rejected the changed source bytes. The complete rerun above passed with source frozen. No test was skipped, suppressed or weakened. Final typecheck, lint, related, full and coverage runs include the test-only guard correction.

Coverage command:

```sh
npx vitest run --project engine --coverage --coverage.include=src/engine/combat/status.ts --coverage.include=src/engine/combat/combat.ts --coverage.reporter=text --coverage.reporter=json --coverage.reportsDirectory=coverage/p08a02c --reporter=dot --silent
```

| Module | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| `status.ts` | 99.18% | 96.80% | 100% | 99.18% |
| `combat.ts` | 95.79% | 85.05% | 100% | 95.79% |
| Combined | 96.66% | 88.16% | 100% | 96.66% |

The 3 s engine, 5 s related and 15 s full-suite budgets remain unmet; successful assertions do not establish performance-budget compliance. Build warnings were stale Browserslist data, chunks above 500 kB, and the existing 2.57 MB generated asset manifest exceeding the PWA precache file limit. These are recorded without changing unrelated configuration or dependencies. No UI, browser or save-format change was made, so browser acceptance is not claimed.

## Review and cleanup

Final independent verdicts: root **`[P08a02c-FINAL-REVIEW]: APPROVE / ADEQUATE`**; producer **`[P08a02c-FINAL-REVIEW]: APPROVE`**. Both reviewed source, tests, evidence and raw coverage with no material finding, and both confirmed coverage consumption finished. They accepted this bounded runtime slice; performance budgets and browser/full-checkpoint acceptance remain unfulfilled as described above.

The raw coverage SHA256 was `cd18b6b139532c9adc4498477ea9917a7ff4a2300d82d80408b29f4e740ab020`. Independent raw figures were status 367/370 statements, 121/125 branches and 15/15 functions; combat 1026/1071 statements, 296/348 branches and 42/42 functions. The durable evidence is this report and the committed regression tests; no remote publication is authorized. Root will record the exact integrated fix SHA after the reviewed selective commit is integrated.

After both consumers finished, the implementing worker verified exact task-owned paths were real directories resolving inside the claimed worktree, then removed `dist`, `coverage/p08a02c` and `node_modules/.vite/vitest` with portable filesystem APIs. Empty task-created `coverage` and `node_modules/.vite` parents were removed. Final verification found `dist`, `coverage`, `node_modules/.vite`, `.vite`, `test-results` and `playwright-report` absent. Pre-existing `node_modules` was preserved. No task processes, disposable outputs or cleanup failures remain. The selective source/test/report commit and worktree release are the final local handoff steps.
