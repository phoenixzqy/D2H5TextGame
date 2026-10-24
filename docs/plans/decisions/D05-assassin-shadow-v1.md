# D05 — Assassin Fade and Venom

Local implementation contract for the complete seven-class target. Root plan
review: ready; independent design/QA acceptance and earned balance remain open.
Security check: pass; local game data/code only, no dependency/network/credential,
CI, permissions or save-format change.

## Personal automatic composition

Both skills are automatically active for a level-eligible Assassin with an
explicit positive allocated rank. Exact authored/canonical aliases resolve maximum
once, ignore malformed ranks and cap at the authored maximum. Fade unlocks 18;
Venom unlocks 30; both cap at 20. Learning prerequisites remain enforced by the
existing learning path; imported retained allocations do not acquire a new runtime
prerequisite restriction. No implicit ranks, active slots, casts, mana or cooldown.

Fade follows its authored per-rank tuning: +2 resistance points in all six engine
types and +0.5 percentage points of magical dodge. This agrees with reviewed
rank-5 Last Wish Fade (10 resistance points, 2.5 points magical dodge). It replaces
the contradictory fixed +30% resistance/+15% physical-dodge text. Item grants and
learned bonuses add once over fresh equipment/quest stats; nothing is persisted
or healed.

Venom retains the promised one poison stack on every successful basic hit and
also applies its authored +3% poison damage per rank through the existing increased
poison-damage bucket. Skills, reflection, periodic damage, mercenaries, summons,
enemies, invalid/absent projections, misses and dead sources never proc coating.

## Poison coating

Add explicit JSON-only `venomOnBasicHit` tuning to the exact Venom row: 0.05 of
snapshot Attack per second and 5000ms duration. One stack per eligible landed basic
hit, using the canonical poison stack cap/refresh/source-preservation/spread/death
rules. No new probability roll or RNG draw, extra direct hit, action, mana or CD.

Raw per-stack DPS is snapshot Attack × coating coefficient × (1 + the source's
complete increased poison-damage fraction). Use the existing poison resistance,
act penalty, ordinary-defense mitigation, minimum-one and integer-floor pipeline
once. It is independent of the physical hit's damage, crit and combo multipliers;
do not inherit physical mitigation or damage type. Poison is applied after the
successful hit and before death finalization, so existing poison death-spread
semantics remain valid. Existing periodic integration handles timing/expiry and
never applies damage bonuses or mitigation again. Existing valid poison stacks
retain their first payload/source under the canonical refresh policy.

## Integration and proof

Copy minimal source-ID/rank eligibility into a transient wave-local combat
projection; derive tuning independently from strict immutable JSON. No unit/save
field or version bump. Validate incoming projection identity/rank, then require
its exact living player-side hero, unlock level and non-summon ownership at use.
All ordinary wave and explicit replay inputs compose current eligibility afresh.
Learning/respec never changes an existing recording, refills original resources
or grants replay income. Preserve legacy recordings and all unlearned RNG paths.

Both locale descriptions and current/next details must state actual scaling,
poison-on-basic-hit, five-second duration and next-wave timing. Verify causal RED,
rank/unlock/alias/foreign controls, copied tuning and strict schema, all six Fade
mitigations, real poison DoT/expiry/stacks/spread, skill/miss/source exclusions,
no extra RNG, native next-wave/respec/replay, exact saves and desktop/mobile UI.
Freeze source/Git state for the final full suite. Constructed fixtures do not
prove earned acquisition, build viability, pacing or full-v1 acceptance.
