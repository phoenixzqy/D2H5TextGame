# BUG-758 — Apply Diablo’s specific Stun resistance

Status: Fixed locally; not committed or independently accepted. Severity: Medium
(final-boss challenge differs from design).
Date:2026-11-05. Owner:root,solo. Build:b5a0898806bfba369a2d84a1b6c41d0bbb057fce
plus inherited local changes. Systems:monster data/schema/factory, shared status
duration, native chapter/playback. WSL/Node deterministic combat, seed13;
locale/viewport independent.

## Reproduction

1. Build native Diablo at boss or chapter-boss tier with buildMonsterUnit.
2. Apply3000msStun at1000ms through applyStatusWithResult.
3. Inspect expiry.

Expected:monster-spec§10 specifies Stun75%(reduced):750msduration,expiry1750ms.
Actual:generic boss50% gives1500msduration,expiry2500ms. No specific coefficient
is authored/projected. Focused reproduction includes positive1msfloor, legacy
rounding and refresh; default boss/Baal/Freeze/Chill controls are retained.
Evidence:/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-diablo-stun-x8bo46w5/red.log.
Regression:src/engine/combat/diablo-stun-resistance.test.ts. Workaround:none.

## Bounded contract

Interpret75%reduced as duration reduced by75%, not application avoidance chance.
The named boss rule overrides the generic combat-formulas§13 default once.
Author stunDurationMultiplier0.25, schema-valid positive≤1 coefficient, copied
as transient primitive metadata. Shared boss Stun uses it instead of0.5; other
statuses/monsters retain their existing rules. No hardcoded Diablo ID or double
scaling. Detailed decision:docs/plans/decisions/P15-diablo-stun-resistance-v1.md.

## Local verification

Before:5fail/3pass in red.log. After:8focused cases and all87selected cases
pass, including native manual/idle chapter construction, expiry/playback at1900ms,
existing Diablo four-move signature, shared status defaults and Baal protection.
Timed1/3/1000/3000/3501ms, positive floor, both boss tiers, legacy rounding,
refresh, exact half-open expiry and unchanged RNG/input are covered.
Strict scoped604implementation/data files/zero diagnostics; changed-file lint
passes. Strict Ajv validates10ActIV rows, coefficient bounds/types and unknown
key rejection; source comparison changes only Diablo’s coefficient. Base stats,
attacks/rewards/waves preserved. No UI/browser rerun or earned/balance acceptance.
Exact evidence packet retained by root through full-v1 acceptance; check handles
terminal, no task process/disposable remains. Initial mistaken log suffix was
rejected by shell before launch and corrected; no stray path was created.
