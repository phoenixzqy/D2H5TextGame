# BUG-617 — Skip ineligible trap registration validation

Status: fixed locally, uncommitted. Severity: Medium. Found:2026-11-03. Owner:root/engine performance.
Build: feat/playable-foundations, HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce
plus accumulated changes. Node24.21.0/WSL Linux; no browser, viewport or locale.

## Reproduction

1. Read the independently authenticated Act V comparison journal, admission1479,
   zero-based wave2. Use its complete original teams and corpse authority.
2. Replay exactly one battle at native seed(runSeed XOR(3 *0x9e3779b1))>>>0,
   collecting a Node CPU profile after module loading.
3. Assert every original event and final team, then inspect trap authority calls.

Expected: units with neither native trap ranks nor a committed shadow binding
are rejected before recursive registered-skill equality. All eligible hero/shadow
checks, altered-registration refusal, targeting, payment and RNG stay exact.
Actual: death settlement asks every unit about Death Sentry. The authority helper
compares the complete registration before checking even hostile side or missing
trap authority. This repeated recursion is visible in the exact battle profile.
Instrumented cold battle took532.731ms; not a browser or release-budget result.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Evidence: `d02-act5-runtime-profile-v1-plan.json`, `.ts`, `.json`, `.cpuprofile`,
`.log`, `.exit.json` and `-process-exit.json`. Every original event and both
complete final teams match. No native admission, reward, save or retry occurred.

## Plan

Short-circuit cheap side/liveness/level and absent native/shadow authority before
exact registration comparison in the existing helper. Keep every accepted path
and exact matching requirement. Preserve the pre-edit source bytes; use existing
trap native/authority/boundary/lifecycle/shadow regressions, scoped types/lint,
and a predeclared alternating exact-wave before/after timing comparison. Do not
change damage, progression, skills, rewards, RNG, controller bounds or saves.

Plan review: ready; the skipped comparison is only reachable on paths that must
return zero under existing checks. Missing native ranks can still be authorized
through the existing committed shadow binding. No persistent cache is introduced.
Security check: pass; authorized local first-party engine/evidence only; the
registration equality gate stays mandatory for eligible sources. No credentials,
installs, networking, publication, CI or delegation.

## Resolution and verification

The authority helper rejects cheap side/liveness/level failures and sources with
neither native rank nor committed shadow binding before recursive registration
equality. Eligible native heroes and committed shadows still require exact
matching. No cache, formula, payment, targeting, RNG or save change.

All104 affected native/authority/boundary/lifecycle/shadow regression cases pass
in five files; scoped strict types and ESLint pass. Five predeclared alternating
pairs reproduce every original event and both complete final teams, as do the
two warmups. Baseline median129.884336ms, candidate115.162739ms:11.334% lower.
All2147 original production inputs authenticate, with combat.ts as the sole
declared candidate difference; preserved baseline matches its original hash.
This is one retained Node/Vite wave, not a campaign/browser performance claim.

Receipts: packet `bug617-comparison-v1-plan.json`, `.ts`, `-launcher.mjs`, `.json`,
`.log`, `.exit.json`, `-process-exit.json`; `bug617-tests-v1.log/.exit.json`,
`bug617-types-v1.log/.exit.json`, `bug617-lint-v1.log/.exit.json`, and
`bug617-cleanup-v1.json`. All processes exited0. Exact test/comparison caches are
absent. Root retains baseline, configs and required evidence through umbrella
review; BUG592 performance budgets and full-v1 acceptance remain open.
