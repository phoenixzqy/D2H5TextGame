# D05 — Paid Teleport and weapon Enchant

2026-10-25; BUG238. Provisional author contract. Root sole writer/reviewer;
independent design/QA and earned balance remain open. Full private-v1 scope stays.

## Overview

Replace the two inert personal buff markers with finite source-bound paid
statuses. Preserve unlock18/cap20, prerequisites, costs/cooldowns and reductions.
One cast spends MP/acts/starts CD once; an active paid effect prevents recast.
Both can coexist. Bare markers provide no power and do not prevent a real cast.

## Player fantasy

Teleport is a brief magical evasion blink under the game's no-movement rule;
it never moves a grid position or manipulates locations. Enchant imbues later
weapon attacks with real Fire, rather than merely strengthening Fire spells.

## Detailed rules

Teleport: JSON `timedBuff.durationMs=1000`; retain authored magical dodge
coefficient0.01 per rank, additive to the normal magical dodge pool. Physical,
thorns and already-applied periodic damage are unchanged. Existing hit-floor
rules apply, with no extra RNG draw or guaranteed dodge.

Enchant: JSON `timedBuff.durationMs=10000` and
`enchantOnPhysicalHit.attackPctPerRank=0.02`. This explicitly replaces the unused
passive Fire multiplier with the same coefficient applied to snapshot Attack.
Every hostile direct Physical hit while active gains one Fire component using
the original hit/crit decision. Basic and skill hits qualify; aura pulses,
periodic spells, DoT, armor reactions and thorns do not. Misses gain no Fire
component. The component has normal Fire mastery/combo/resistance/Defense and
personal absorption, without inheriting carrier penetration/status/recovery
metadata. It adds no Burn or extra RNG. Carrier statuses apply once; finite
defenses, death/corpse/orb/reward closure settle once for the combined strike.
Thorns reflects actual Physical HP removed, excluding the Fire component.

## Formulas

Teleport dodge bonus = paid rank ×0.01 (ranks1/2/20:1/2/20 percentage points).
Enchant Fire base = captured normal `stats.attack` × paid rank ×0.02; retain
fractions until ordinary mitigation/minimum damage. Nonpositive Attack grants
no Fire. Capture Attack/rank once at cast, not at each hit or wave.
Existing rounded MP/CD remain: Teleport20/3 at rank1,16/2.0 at rank20;
Enchant22/4 at rank1,19/3.0 at rank20 (existing decimal rounding authoritative).

## Edge cases

Require exact native Sorceress class/unlock/transitive prerequisites, legal
learned aliases, living original hero and exact registered effect/payment shape.
No rank-one fallback, merc/summon/enemy authority or implicit item-proc grant.
Reject malformed/nonfinite payloads and wrong source/clock/duration. Copy paid
payloads; never mutate base stats, resources, prior recordings or caller objects.
Half-open expiry applies before actions at the endpoint. Existing clock rebasing
carries remaining paid duration/potency across waves, including changed Attack or
allocation; new legal allocation controls future casts. Fresh/imported/reopened
runs start unpaid under current transient-status save policy. No save version bump.

## Dependencies

Closed schema → authored JSON → one shared two-buff definition/authority/status
module → native rank projection → buff payment/dodge/typed damage consumers.
Use shared status scheduling/playback and damage settlement. Bilingual current/
next/MAX previews, description and positive combat status chips expose real
duration/bonus/payment, snapshot behavior and next-wave allocation semantics.

## Tuning knobs

Feel: JSON durations (positive bounded milliseconds). Curve: existing per-rank
coefficient, explicitly reinterpreted for weapon Fire. Gate: authored unlock,
prerequisites, mana and cooldown. New duration/weapon conversion are provisional;
earned damage, resource and build balance still require acceptance evidence.

## Acceptance

Retain native five-case RED. Prove causal rank1/2/20 dodge/Fire, exact expiry,
miss/crit/shared RNG, mitigation/mastery, no spell/periodic/reaction leakage,
single statuses/death/reflection, payment/refusal/recast/coexistence, strict
authority/schema/payload copying, immutable recorded/unrecorded replay and exact
playback. Cover real next-wave carry/allocation/Attack changes and save/import.
Types/lint/engine/full/build/precache, bilingual component and production mobile/
desktop save/online+offline Continue precede any bounded skill credit.

Security check: pass — first-party local deterministic gameplay/data/UI only;
no credentials, networking, dependencies, permissions, CI, exports or campaign
actions. Plan review: ready after adding per-component Physical HP accounting
and separating carrier status application from the added Fire component.
Author review is not an independent gate or shipping approval.
