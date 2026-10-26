# BUG-255 — Refresh stale Confuse description oracles

- Status: test-only correction locally fixed/verified in `c0b20f1d`; focused RED/GREEN and final full/types/lint/audit/raw retention/exact cleanup pass. No independent or full-v1 acceptance claimed.
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

## Test-only correction

`c0b20f1d` changes exactly one source test path:both obsolete equality literals
and their explanatory comment. All six tests and their assertions remain. Reduced
RED2failed/4passed3.220s; GREEN22/2files10.107s and scopedlint7.360sPASS. No runtime
or locale change. Fresh `combined-full-final` and final types/lint are active;
local closure waits for their terminal evidence. Original source/failures retained.

## Final local outcome

Fresh combined full18055passed/828files/two existing opt-in skips,exit0/865.538s;
logSHA256`48d5fb5ee5e2fc961f09bd6de05b3e3705afdc2747f32bd281f0456b7b3481d1`.
Post-copy types130.517s/full lint216.273s and final source/build/command/browser/
protected-state audit PASS. Original failures are preserved in the1896-member
read-back-verified archive;1896exact files/106directories and external driver
cleaned,remaining[]/failures[],28restricted /proc entries disclosed. Root retains
archive/three sidecars through BUG254/BUG255/full-v1 consumers and owns later removal;
original raw directory is absent. [Final evidence and exact retained paths](../../docs/plans/evidence/d04-target-curses.md)
supersede the historical pending checkpoints above.

Exactly Confuse/Attract gain bounded functional credit:164bounded/47unverified/
one engine-only/one review-needed,Necromancer22/32;211other raw rows/header/IDs/order
unchanged. BUG255 itself grants no additional credit. GenuineL33/next402/Baal
uncleared remains unchanged; independent/earned/full privatev1 remain open.
