# P15 — Defensive Bow evaluation policy v1

Type: addition to evaluation policy, not a gameplay coefficient change.
Date:2026-11-02. Owner: root, sole writer in the existing claimed worktree.
Scope: `tests/campaign/profiles.ts`, `profile-registry.json` and one focused
native-allocation regression. Preserve all old policies and failed observations.

## Motivation and rule

The authored-level volley-only branch exhausts three Dry Hills attempts against
lightning/cold pressure without mana starvation. Existing native Slow Missiles
unlocks at12 via Inner Sight and delays missile impacts; Vitality raises life.
These are player choices omitted from the greedy offensive evaluation profile.
No engine defect or need for another Multiple Shot coefficient is established.

Add opt-in `amazon-bow-survival-v1`: spend each earned five attribute points on
2Dexterity/3Vitality; retain the bow fallback and monotone fielded-merc policy.
Use MagicArrow1, CriticalStrike1, MultipleShot1/Dodge1 from6; buy InnerSight1
and SlowMissiles1 from12 before further MultipleShot investment. Then retain
MultipleShot20, CriticalStrike20/Dodge20/MagicArrow20 goals from the original
policy. These remain targets, never grants. Do not silently redistribute spent
points or reset a resumed hero. Use Magic Arrow before volley is learned;
thereafter order Slow Missiles→Multiple Shot. The native engine filters
unlearned/ineligible skills. The original claim that it already prevented live
paid-window refresh was incorrect: the first frozen pilot shows repeated casts
before expiry. [BUG-602](../../../production/bugs/BUG-602-slow-missiles-redundant-automatic-refresh.md)
adds that availability rule at authority67: skip only while all living opponents
have unexpired private paid windows, allowing recast for uncovered/new opponents.
Inner Sight is a paid prerequisite, not another active rotation slot.

## Acceptance and limits

Prove consecutive level1–26 native purchases and exact literal checkpoints,
attribute/skill-point conservation, once-only Den payment, no refund/reset,
unchanged inventory/quest/party/currencies and idempotent repeated preparation.
Check actual combat projection removes locked/unlearned Slow Missiles and
exposes native learned rank1 with prerequisites at12. Retain the old policy
literally; old failures are not converted into successes. Run only the affected
profile tests and scoped strict types/lint. Existing missile mechanics already
have retained native timing/payment checks; do not replay them without changes.

A fresh pilot must have an explicit policy/source/clock/seed/budget manifest
before creation; it is not an extension of either exhausted Bow branch. Freeze
policy before outcomes, retain all losses/costs and evaluate independent cohorts
before any balance acceptance. No fresh trial or balance credit is implied by
constructed allocation tests. Full private-v1 scope and0/210acceptance remain.

Plan review: ready; opt-in registration, native eligibility/projection, earned
points, unchanged historical policies and exhausted limits are covered.
Security check: pass; local policy/tests/docs only, no dependencies, credentials,
network, grants, publication or privileged operations. User's no-agents,
no-installs/no-commits/no-pushes and affected-check-only restrictions prevail.

## First fresh pilot and correction

Authority66's pilot records109 admissions,319 played waves (317 wins/two defeats),
182,490XP and3,099 acquired/2,926 salvaged items. It loses Catacombs106 wave5,
then Dark Wood108 recovery wave5, ending at12/nextNormal109 before Act II.
Independent streaming readback v4 verifies exact exports, reward custody,
clock/ordinals/native seeds and source/campaign freezes without combat replay.
Reader v1–3 failures reflect journal-shape assumptions, not changed gameplay.
The Slow Missiles correction has55 distinct affected passing cases plus scoped
types/lint; it does not prove this policy viable. A separately frozen paired
fresh trial uses authority67 with the same policy and creation clock; all previous failed histories remain retained. The corrected pilot reaches
Act II, clears Rocky Waste, then loses Dry Hills152 wave3 at level16 with mana
available. Its153admissions/509waves (506wins,3defeats) are independently
reconciled without combat replay. It does not accept balance or pacing. See [Bow rotation evidence](../../balance/2026-11-02-bow-survival-rotation.md).
