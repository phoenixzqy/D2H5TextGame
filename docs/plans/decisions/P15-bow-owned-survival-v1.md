# P15 — Owned defensive Bow equipment policy v1

Type: evaluation-policy addition. Date: 2026-11-02. Owner: root, sole writer.
Related: [defensive Bow](P15-bow-survival-profile-v1.md),
[Act II preparation](../../balance/2026-11-02-act2-area-preparation.md).

## Evidence and rule

After BUG602, the frozen defensive Bow pilot clears Rocky Waste and loses
Dry Hills wave3 at level16 with at least167mana. Lightning/cold dominate the
incoming damage. This establishes a failed evaluation policy, not a proven
damage/targeting/mercenary defect. General hero equipment scoring and monotone
mercenary selection omit useful resistance trades against surplus mana.

Add the separately named `amazon-bow-survival-owned-v1`. Its skills, attributes,
rotation, bow fallback and ordinary weapon/merc upgrades equal survival-v1.
While Act II is the latest unlocked act, including cleared Act I training,
reserve hero armor/jewelry for the existing
two-pass owned survival selector; run that selector for hero then fielded merc
after ordinary weapon/charm and monotone merc upgrades. Reuse the already frozen
Act II Javelin threat probes unchanged: physical225/337.5 with50pierce at95/5
weights and fire/cold/lightning/arcane/poison120 at unit weights. These are shared
direct-hit probes, not a forecast of the observed Dry Hills seed.

Preserve stage-entry Attack and attack speed and at least min(entryManaMax,150)
capacity, the existing Javelin reserve. Never require extra mana when entry is
below150. Score mitigation/dodge per maximum Life using the native formula.
Consider only eligible owned backpack/stash armor/jewelry, deterministic score/ID
order; native transfer/equip owns capacity refusals and current-resource clamping.
No shield/weapon trade, sockets, purchases, grants, healing or point reset.
Before Act II unlocks and after Act III unlocks, retain the existing
survival-v1 equipment behavior exactly. This uses native unlock predicates so
returning from an Act I farm cannot silently skip Act II preparation.

## Acceptance and diagnostic limits

Constructed checks must prove actual hero/merc defensive transfers from stash,
capacity/Attack/speed floors, unchanged bow/points/quests/currencies/item custody,
no healing, repeated-preparation stability, separate registration and unchanged
old policies/outside-act behavior. Run affected profile/survival/action checks,
scoped strict types and lint. No combat/engine/data changes are proposed.

Before a fresh pilot, freeze profile/source/campaign/clock/seed/budget. Preserve
every old failed branch and all costs/losses. The new pilot stops on its declared
route loss; it cannot extend an exhausted branch. A paired run is diagnostic;
independent build cohorts/holdouts and full private-v1 scope remain required.
Accepted balance stays0/210.

Plan review: ready; no duplicate selector, explicit quest-unlock boundary and resource
floors, unchanged historical profiles, native custody and bounded losses covered.
Security check: pass; local policy/tests/docs only, no dependencies, network,
credentials, installs, commits, pushes, publication or privileged operations.
The user's existing implementation authorization applies; root-only and affected
checks override generic skill delegation/full-suite/commit suggestions.

Initial GREEN:92affected assertions pass; the merc fixture incorrectly let the
hero take the sole candidate first. Correct the fixture by equipping the other
owner with strictly stronger protection. The corrected merc case also exercises
an Act I farm return while Act II is unlocked, exposing current-act-only gating.
Retain both failures; do not weaken either expected native transfer.

Final focused verification: all five new cases pass after correcting the unlock
boundary; scoped strict types and explicit `eslint --no-ignore` pass. Two lint
corrections express the progression flag as a boolean and assert numeric fixture
output without an unsafe matcher assignment.93distinct affected cases have
passing retained evidence; do not imply one all-green93-case final run.

The declared fresh authority69 pilot fails Rocky Waste133 wave4 at level14:
134admissions/419waves/417wins/two defeats, native state and economy independently
reconciled. The new policy is not promoted to standard Bow or population evidence.
See [complete outcome](../../balance/2026-11-02-bow-owned-survival.md). Keep this
and every preceding failed history terminal; do not tune coefficients to this seed.
