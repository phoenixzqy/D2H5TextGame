# Shared authored skill validator / BUG173

2026-10-24. Base `b713c03`; root sole writer in existing claimed human worktree.
Implemented in `9e643b8`; local verification complete. Independent review/QA and
full performance acceptance remain open. No skill behavior acceptance advanced.

## Root fix and scope

Twenty-four dedicated skill modules instantiated identical strict/allErrors Ajv
compilers for the same imported JSON schema. One private Ajv now serves a small
typed `createSkillValidator<T>()` factory; Ajv caches the compiled schema code.
Every resolver still validates every incoming row with its original narrowed
source type and error path. No dataset/result cache, mutable Ajv export, schema
change, validation suppression or loading through the dataset loader. That
loader retains its different options and initialization path; no cycle added.
Blood Raven's monster compiler remains separate and unchanged. Other schemas
are outside this scope. No game data, registration, tuning, RNG, combat, save
shape or version changes.

## Evidence

- A real import of all24modules yielded24distinct skill-schema functions at
  baseline:1causal RED; separate monster validator control passed. Exact frozen
  test later passes with one reused function. No source-presence-only assertion.
- Shared helper checks preserve allErrors, strict non-coercion/unknown fields,
  fresh validation after caller row mutation and standard current-call errors.
  Final focused37PASS/5files,2.90s, including unchanged family rejection tests.
- Before/after complete ordered registered catalogs are byte-identical:284entries,
  SHA256 `d42cfcfa8aa520cbe119b4d2d73d85e8bd35a1e424dc541bd71de8bf174e9e83`.
- Five fresh-process Vite-node registry imports each, Node24.21.0, same current host:
  before1453.86–1698.77ms, median1526.75ms; after1085.61–1853.11ms, median1192.19ms.
  Median21.91%lower, with overlap/noise. The test runs include transforms/dependency
  imports and host contention; this is a bounded synthetic startup observation,
  not device/RUM/Core Web Vitals or full G7 acceptance. Raw samples retained.
- Final typecheck and explicit VITE_E2E=false production build pass. Four JS
  chunks scanned with all five repository forbidden bridge patterns; zero matches.
  Existing bundle/PWA manifest/Browserslist warnings remain open.
- Compiler-only engine5851PASS/185files140.71s; final combined full11915PASS/479files,
  two existing skips408.64s, including later `09a2722` mastery work. All42changed
  source/test hashes and full worktree status stayed exact throughout this final run.
  Types, standard lint and production build pass. Existing5s module-import timeout
  passes focused and in the final full suite; no timeout or assertion weakened.
- The initial full run failed three tests: root source edits during measurement
  tripped two provenance checks, and one dynamic-import test timed out. Retained
  original log; final stable run passed all three. Two redundant-null-check lint
  errors were removed from new tests without changing assertions; final focused3/2
  and standard lint pass. Exact pre-correction sources and hashes retained.
- Production en/zh×1280×800/360×640 browser4/4,97.95s; no retries/skips/flaky/errors.
  All four player/inventory/map/mercs/formation Save/close/Continue pairs exact.
  Representative desktop/mobile screenshots inspected. No new gameplay proof claimed.
- Root plan review: ready after preserving typed narrowing, exact schema/options,
  separate monster validation, family invalid-data regressions and catalog parity.
  Security check: pass; no dependencies, network/credentials, permissions, CI or
  persistence changes. Self-review only; independent acceptance remains open.

## Retention and remaining work

Raw commands, logs, benchmark programs/catalogs, exact RED/pre-lint sources,
27final source/test hashes, build hashes, browser report/attachments and process
ownership are retained in [versioned fixtures](fixtures/shared-skill-validator/).
Every raw archive member is verified byte-for-byte before scratch deletion.
Task build/browser staging removed;4455closed. One terminal lint record omitted
by concurrent scratch-runner JSON updates was recovered from its exact terminal
output; all23processes are terminal. No shared compiler/package caches removed.
Final cleanup result is recorded in the fixture cleanup file.

Authoritative earned Rite save must retain decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`.
No genuine campaign action occurs. The subsequent mastery card reduces the inventory to191unverified skill IDs.
Earned build viability, pacing/economy/endgame, independent acceptance/C2–C4/G0–G7
stay open.
Poison/Elemental Mastery is now implemented separately; see [its evidence](d05-poison-elemental-masteries.md).
