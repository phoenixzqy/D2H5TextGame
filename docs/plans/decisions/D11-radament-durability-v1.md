# D11 — Radament durability calibration

2026-10-24. Root design reconciliation and implementation candidate; independent
design/source/QA acceptance pending. This is local tuning under the full-v1
implementation goal, not a claim that the owner approved these exact numbers.

## Problem and scope

Far Oasis is area18; its native named encounter resolves to level22 with four
ordinary mummies. Radament's old life820–1020 plus82–102 per level is multiplied
by the ordinary boss3× factor:7626–9486HP at22. Previous fixed projections of
the genuinely owned critical-gear build won18/32 in both screen and holdout;
the actual attempt255 cleared the four preceding waves but drew against him.
The retained input is now L24, IceBlast20, next ordinal256. Old notes about
IceBlast9 do not describe this input. Cold Mastery is still locked until30.

The source calculation is internally consistent; no arithmetic defect is
claimed. The unresolved design gap is an uncalibrated early mini-boss life
curve under the existing60-second combat deadline. The maps-spec identifies
Radament as the ActII mini-boss; GDD§7.2 gives each monster one base/growth
configuration. Calibrate that configuration, preserving the shared formula.

## Frozen candidate

| JSON knob | Previous | Candidate | Resolved Normal22 boss envelope |
| --- | --- | --- | --- |
| `monsters/act2.radament.life` |820–1020|500–620| |
| `monsters/act2.radament.lifeGrowth` |82–102|50–62|4650–5766HP, about39% less |

No previously documented bounded tuning range was found for these two knobs.
This explicitly supersedes their authored values only. Attack, armor,
independent MR, resistances, skill order, mummy guards, rewards, encounter levels,
RNG, deadline, chapter-boss anchors and all other archetypes retain their rules.
Nightmare still uses native+20 level growth, resolving42 at7650–9486HP. No
special difficulty multiplier, save change or current-recording rewrite.

The StrongMelee-first priority can starve later spells at its1-second cooldown.
That is a separate behavior/design question; do not change it during life
calibration and accidentally attribute different outgoing damage to life alone.

## Measurement and acceptance

Before applying the candidate, capture64 native full-area projections at fixed
seeds1–64 and ordinal256 from the exact attempt255 final, raw SHA256
`5105a89cc1584baa2a4aea3140147965d1c54bb2570c16e29d70512df7a32573`.
No extra transfers, points, farming, resources or seed selection. Seeds1–32
are the screen,33–64 the holdout; keep failed rows. Repeat after changing only
the JSON life ranges. A separate1000-seed isolated boss-wave scenario per
revision uses the same build with full native maxima; label its optimistic
resource assumption and do not substitute it for the full-area results.

Candidate local target: at least90% full-area wins in each32-seed group,
victory boss TTK p50≤45s/p95≤58s, with no increase in deaths. Non-target
preceding waves must retain exact results/timing/awards. These are a new bounded
calibration target, not acceptance of the broad first-attempt/retry contract.
No multiplying isolated probabilities to assert a three-attempt success rate.
This screening build is over the area's recommended level; on-level/BiS,
other classes/builds and difficulty grids remain required for full balance.

Regression tests must first reject the old production life envelope at the
native planner's real level22, retain the four guards and show that rebuilding
the same old/new seeded monster differs only in life. Validate both levels and
schema; typecheck/lint/full units/build before browser continuation.

If these checks pass, attempt one ordinary production continuation at actual
next256 without supplied seed, debug injection or replay. Stop at its first
nonwin; retain all real prefix rewards. A success must include genuine original
boss kill, native quest admission, explicit Book claim and exact
Save-close-new-page Continue. No constructed projection becomes campaign state.

This is not fresh-current C2 certification. Full earned ActsII–V, seven-class/
213-skill acceptance,30–50-hour pacing and C2–C4/G0–G7 remain open.
