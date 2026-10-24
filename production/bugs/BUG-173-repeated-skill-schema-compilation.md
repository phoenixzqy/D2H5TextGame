# BUG-173 — Share compiled skill validation across authored modules

Severity: Medium. Status: fixed locally in `9e643b8`; independent acceptance open.
Owner: engine-dev / performance-analyst. Reproduction build `b713c03`.
Node24.21.0/Vitest; locale/viewport independent; no gameplay RNG or campaign actions.
Production browser validation target: Chromium en/zh×1280×800/360×640.

## Reproduction

1. Cold-load the24dedicated authored skill-definition modules while observing Ajv compile results.
2. Count distinct compiled validators for the same skill schema.
3. Run five fresh-process Vite-node registry imports on the current host.

Expected: reuse compiled code for the identical schema/options; retain all strict
validation, typed narrowing and authored error behavior. Monster validation stays distinct.
Actual:24distinct skill validators, one per Ajv instance; five import samples1453.86–1698.77ms.
Median1526.75ms;284registered entries. These are synthetic host measurements, not device/RUM acceptance.
Evidence: `src/data/loaders/shared-skill-validator.test.ts` fails24→1; monster control passes.
Raw `red-shared.log`, `before-1.log` through `before-5.log` in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-skill-validator-vfh47ty2`.
Root cause: each resolver instantiates a fresh Ajv and recompiles the same imported schema.
Workaround: no gameplay workaround; startup/test cost recurs per isolated module graph.

Plan review: ready. Use a private strict/allErrors Ajv with its built-in schema cache
through a tiny typed factory; no dataset imports, mutable Ajv export, data/result cache,
validation suppression, loader cycle or loader-option changes. Keep Blood Raven's
monster validator separate. Existing family invalid-data tests and new mutation/allErrors
checks protect behavior. Benchmark exact registry import and compare all284serialized
registered definitions before/after. Full engine/unit/types/lint/build and production browser.
Security check: pass; typed local validation reuse, no dependencies/network/credentials,
permissions, CI or persistence changes. Root sole writer; independent acceptance remains open.

Final validation: compiler-only engine5851/185; combined full11915/479 with two
existing skips; types/lint/build pass, four production browser cases/four exact
Continue pairs.284registered definitions remain byte-identical. Five-sample
synthetic import median1526.75→1192.19ms; no device/G7 claim. First full-run
provenance/timeout failures and lint corrections retained. Raw scratch has been
archived to `docs/plans/evidence/fixtures/shared-skill-validator/`; cleanup is
recorded there. [Evidence](../../docs/plans/evidence/shared-skill-validator.md).
