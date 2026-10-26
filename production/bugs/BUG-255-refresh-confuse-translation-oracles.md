# BUG-255 — Refresh stale Confuse description oracles

- Status: reproduced before correction; test-only fix pending.
- Severity: Medium — the required full-unit gate fails on two obsolete copy literals; public bilingual UI/native/browser behavior is already separately asserted by other tests. No runtime translation defect is established.
- Owner: root test/frontend author; no delegation or independent approval.
- Build: `6d4f5009`; Node24.21.0/Linux/Vitest1.6.1. Browser/viewport/engine seed: not applicable; localization-helper unit test, both en and zh-CN.

## Reproduction

1. Run `npm test` with the authored finite Confuse descriptions from `da771f12`.
2. Inspect the two `tDataKey` Confuse description cases in `src/ui/i18nKey.test.ts`.

Expected: dotted namespace routing resolves the current authored description in each locale, retaining exact equality and non-key/non-empty controls.

Actual: both cases still expect the former one-sentence copy (`Causes enemies to attack each other.` / `使敌人互相攻击。`), while the helper correctly returns the current targeting/duration/resource template. Full run: 2failed/18053passed/2existing opt-in skips, onefailed/827passed files,1345.413s/exit1.

## Evidence and cause

Required active evidence is retained at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-target-curses-6i4lfede`: `combined-full.log` SHA256 `010d9db80c34190f1a8c2dfc060dd86b1b14c23fe8d10992250eb8a58571f140`, matching terminal/start receipts, and untouched `i18nKey-original.test.ts`. The locale templates changed intentionally in `da771f12`; the helper implementation did not change.

Correct the two demonstrably stale exact literals and their comment only. Preserve all six helper tests and their assertions; no locale/runtime workaround, mocking, skipped test or weaker assertion. Focused RED/GREEN and a fresh full-unit result are required before local closure. This does not add a skill credit or complete BUG254/privatev1. Root retains required raw evidence through BUG254/BUG255/full-v1 consumers and owns final lossless retention/read-back and exact cleanup.
