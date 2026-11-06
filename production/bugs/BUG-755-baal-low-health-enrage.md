# BUG-755 — Apply Baal’s authored low-health enrage

Status: Fixed locally; not committed or independently accepted. Severity: High (missing boss
phase; no player workaround). Date:2026-11-05. Owner:root, solo.
Build:b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited local changes.
Systems:content/monster-factory/native chapter. Environment:WSL/Node deterministic
engine, browser/viewport/locale independent. Seed13, challengeOrdinal450.
Synthetic durable diagnostic controls; no earned campaign/balance claim.

## Reproduction

1. Resolve native manual/idle Throne of Destruction chapter plan.
2. Build Baal and inspect low-health metadata at20%Life.
3. Run recorded/plain combat against a durable stationary party.

Expected: monster-spec§8 gives enrage at20%HP, +150% attack speed (2.5x),
+100% damage. Existing400ms cadence floor remains. Chapter stats/rewards unchanged.
Actual: no authored enrage metadata on ordinary or chapter Baal. Legacy generic
phase can emit enrage, but adds neither this speed multiplier nor damage bonus.
Three focused cases fail for missing rule; above-threshold negative passes.

Evidence:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-baal-enrage-992txn01/red-native.log.
Regression:src/stores/combatHelpers.baal-enrage.test.ts.
Tentacle summoning/status protection and full-v1 acceptance remain open.

## Boundary defect discovered during verification

Native noninteger ordinary/chapter Baal maximum Life makes
`(lifeMax * .2) / lifeMax` round above `.2`; the exact boundary is rejected.
The original post-data check captures this failure. Compare current Life directly
with `lifeMax * fraction` in the shared policy; do not introduce a tolerance or
change the threshold. Existing metadata-only fix cannot resolve this root cause.
Normal magical hit probability remains85% before dodge (damage.ts); the original
test incorrectly assumed guaranteed hits at zero dodge. Correct it to compare
same-seed miss parity and damage of landed first impacts, requiring a landed hit.

## Local resolution

Native Baal now has the authored immutable enrage rule. The shared policy uses
Life versus maximum Life times the threshold, fixing the exact-boundary rounding
defect without changing thresholds or using an epsilon. Six new native cases and
two selected existing shared-policy cases pass; scoped strict types cover600
implementation/data files with zero diagnostics; changed-file lint and strict
monster schema/baseline comparisons pass. No additional browser run: the shared
component is unchanged and native bilingual converter assertions pass.

See docs/plans/evidence/p15-baal-low-health-enrage.md. Packet source review/diff/
hashes retained by root through full-v1 acceptance; no task processes/disposables.
No campaign/sample/retry budget renewed. Wider implementation remains unfinished.
