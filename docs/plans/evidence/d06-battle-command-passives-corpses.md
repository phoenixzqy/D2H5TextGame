# D06 — Battle Command native passive and corpse potency

Status: source `2cb8d1e1`, local increment over `5e7f0e96`. BUG241 remains open. No new skill
credit or independent, earned-build, balance or production-browser acceptance.
[Full provisional contract](../decisions/D06-battle-command-v1.md).
[Earlier paid party ranks](d06-battle-command-party-ranks.md).

## Implemented behavior

Native Barbarian composition runs the same fresh equipment/passive function at
baseline and +1, retaining frozen independent potency profiles. Current-life/
current-mana mirrors are excluded from potency. Only actual private paid Command
bindings select boosted profiles. Imported markers grant no power. Cast/expiry
preserve absolute resources, clamp HP after final shared ambient life layers,
settle old recovery intervals before changing rates, retain exact fractional
carry and preserve pending action phase. Absolute silent stats-state events
keep playback and time-zero staging aligned. Native next-wave setup refreshes
both learned Command authority and profiles from current Player configuration.
Qualified remaining-interval carry is still missing.

All corpse authority maps now enter the shared learned/effective rank resolver,
with existing role/definition/body/cost/cooldown guards intact; zero stays zero.
Find Potion recovery, Find Item probability and Grim Ward duration accept
captured paid +1 provenance including effective21. Plain forged21 remains
invalid. Successful searches strictly copy effective rank and optional bonus;
settlement compares rank-minus-bonus to original allocated authority and checks
original source/body identity. Already-paid ward duration survives Command
expiry. No saved allocations, authored tuning or save version changed.

## Causal and regression evidence

33 new tests:18 native passive integration cases, one native next-wave authority
case and14 corpse cases. Passive coverage includes native rank1/20 and matching
six weapon masteries, absent/wrong-weapon passives, exact recovery/cadence/phase,
healing and final-cap clamping with/without Vigor, repeated nonstacking intervals,
immutable copies, resource-mirror independence, replay/playback and time-zero
absolute observations. Corpse cases cover1/20, exact recovery and ward lifetime,
strict search metadata/settlement, missing native authority, ordinary21 rejection,
post-expiry baseline potency and a fixed chance edge. Seed78's third seeded draw
.3919444624334574 fails learned20 chance.39 and succeeds paid21 chance.40 with
identical paid actions and debits. Fixtures are synthetic legal native inputs;
they do not establish earned builds, campaign completion or numerical balance.

Initial passive RED13failed/one imported-marker control passed. An initial full
run finished17007passed/2failed/2existing skips (763passing/2failing files;
730.55s Vitest/732.105s process) on all1357frozen paths. Iron Skin replay exposed
resource mirrors unnecessarily captured in potency; another whole-unit comparison
predated the new defense profiles. New targeted mirror RED reproduced the cause;
production now excludes mirrors, while exact new profile-defense expectations
retain every other comparison. Corrected focused56/4 and engine8453/314 pass.
The failed full receipt remains preserved; it is not counted as a green run.

Review also found the earlier inert active-rank control had no effects, so the
engine skipped its action/payment. Strengthened tests first failed3cases.
The harmless buff control now pays and asserts identical simulation action rows
and mana debits. UI-delay hints can differ because Command emits more observations.
This corrects the earlier evidence's unproven matched-payment/action claim.

Initial corpse/control RED12failed/13passed included one new late-fixture error:
a400MP cap allowed an MP orb to fund another Command. A100MP cap keeps the
intended one-payment fixture valid. One intermediate exact-action comparison
wrongly included observation-dependent UI-delay hints; it now compares exact
actor/skill/simulation-clock rows. Fixed-seed RED failed once while four controls
passed. No existing assertion, timeout, retry, skip or suppression was weakened.

## Final validation

Focused385tests/15files PASS25.292s process. Two nonexistent CE/PE causal filter
names did not add files; actual native and engine files remain part of full/
engine discovery. Engine8453/314 PASS139.48s Vitest/140.704s process. Whole
typecheck PASS124.579s; repository lint/purity PASS196.679s. Production build
with VITE_E2E unset PASS16.061s. Actual755-URL precache and five-chunk bridge scan
with positive/negative controls PASS. Existing bundle/Browserslist/art-manifest
warnings remain unchanged. No limits relaxed.

Full unit suite PASS:17024tests/766files/two existing skips;802.07s Vitest/803.596s process. The same live session94972 was collected terminal with exit0. Log SHA256:`89c52f9d38083bc706c316a3c35425f6d9caaa3c31279bbabf6c99ea5fd798c5`.

All1358 collected source paths, exact HEAD and porcelain matched the pre-run snapshot after the full run. Committed source blobs were then checked against all1358 hashes, including the previously untracked regressions. Earlier paid-rank source-identity refusal
is documented separately and remains preserved. Inventory and genuine retained
campaign bytes are unchanged.

## Author review and outstanding work

Author five-axis review found no remaining source blocker in this increment;
private paid authority, shared native formulas, bounded transitions, fresh
configuration and strict copies are retained. Security check: pass for local
gameplay changes. No credentials, networking, CI, permissions or dependencies
changed. This is not independent approval or full Battle Command acceptance.

Remaining: qualified paid remaining-interval native carry (including late life
clamping), other reachable specialist consumers, bilingual details and production
mobile/desktop save/offline evidence. Do not close BUG241 or credit Battle
Command before complete behavior is verified. Inventory stays148bounded/
63unverified/one engine-only/one review-needed; Barbarian29/30. C2-C4/fullG0-G7,
all-class earned builds,30-50hour pacing/economy/endgame/privatev1 remain open.
GenuineL33/XP149261/nextNormal402/Nightmare0/Ancients-Rite claimed/Baal uncleared
unchanged. No genuine campaign, replay, remote, PR, merge or deployment action.

## Retained diagnostics and cleanup

Prior passive archive:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-command-passives-rzg__8ms-retained.tar.xz`.
SHA256:`449129b4ed0f3db78a1c1598314ccb36314473bb29eaeec1904b7ea8571f64df`.
Cleanup receipt:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-command-passives-rzg__8ms-cleanup.json`.
All51regular archive members byte-verified;591exact scratch files/seven directories
removed;17recorded identities absent; old scratch absent,remaining[]/failures[].
Root retains archive/receipt until BUG241/full-v1 evidence consumers finish,
then removes them. Earlier paid/rank archives keep their recorded ownership.
Current production build761files/10directories were hash-verified and removed;
exact repository dist absent. Final scratch cleanup completed after collecting the terminal full result.

Final increment archive:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-command-corpses-cyg_0z4z-retained.tar.xz`.
SHA256:`9df076da7a3a197e6ba0dc9d8f07a0d7672db50267e85fcaa3a865083a6ad198`.
All43 regular members byte-verified;583 exact task-owned files/seven directories
removed;12 recorded process identities absent; no runtime users; original scratch
absent, remaining[]/failures[]. Root retains the archive and adjacent cleanup
receipt until BUG241/full-v1 evidence consumers finish, then removes them. The
qualified-carry plan, outside-repository test draft and runner were copied and
byte-verified into the next root-owned task scratch before cleanup. No build
output or abandoned test process remains from this increment.
