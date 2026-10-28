# D04 — Static Field current-health damage

2026-10-24. Root design/implementation reconciliation for BUG150. Independent
acceptance pending. Earned L24/SP2/next258 remains unchanged during development.

## Overview and player fantasy
Restore the advertised Sorceress utility: weaken healthy enemies, then finish
with a complementary attack. This serves meaningful builds and experimentation.
The official Arreat Summit reference in BUG150 supplies25% current health and
a33% maximum-health Nightmare floor. No move/range stats, PvP or Hell are added.

## Detailed rules and formulas
An eligible learned Sorceress casts the existing all-enemy active, unlock6,
cap20, mana10−.1×(rank−1), rounded using ordinary skill rules; cooldown
max(1,round-to-tenths(2−.05×(rank−1))) seconds. Higher ranks improve cost/cadence;
there is no radius or unrelated passive lightning-damage bonus.

For each living enemy independently: base=currentHP×.25. Apply the existing
deterministic lightning resistance clamp/penetration, then independent flat MR,
integer floor and minimum1. No Attack, added flat damage, increased damage,
combo multiplier, critical roll, hit/dodge roll or status application. This
bounded utility pulse is deterministic and does not consume combat RNG. Unlike
the canonical D2 formula, H5's independent MR remains effective; this is an
explicit adaptation, not a recovered historical tuning approval.

floor=max(1,ceil(maxHP×difficultyFloor)), where Normal=0 and Nightmare=.33.
damage=max(0,min(currentHP−floor,mitigatedBase)). Example:1000HP, lightning50,
MR10 loses115HP;340/1000HP in Nightmare loses at most10. A2HP Normal target
can lose1, then Static Field yields to the next priority. It cannot kill or
create corpses/orbs/kill credit. Damage events use existing lightning playback.

## Edge cases
Actual finite positive whole learned ranks only; exact aliases resolve maximum
once and clamp to20. Foreign class, under-level, missing/invalid allocations,
mercs and summons receive zero potency. Each hero projects an explicit transient
rank, refreshed next wave/replay without healing or editing issued recordings.
All targets at/below the floor means no cast, payment, cooldown or RNG; another
priority or the ordinary basic attack may run. Dead/nonfinite targets are ignored.

## Dependencies
Closed exact-identity JSON/schema owns fractional tuning. One immutable loader
feeds pure effect calculation and eligibility; catalog supplies the special
effect instead of a marker. Production staging captures difficulty from immutable
run origin; changing selected map difficulty during a run cannot change the
current/replayed wave. Omitted historic snapshot difficulty means Normal.
No save shape/version change; existing learned allocation persists in Save21.

## Tuning knobs
Current-health fraction.25 (curve), Normal floor0 and Nightmare floor.33 (gate)
are exposed in closed JSON metadata; ranges[0,1), fraction strictly positive.
Keep existing unlock, cap, mana and cooldown authored values (feel). No boss,
reward, equipment or global damage-formula tuning belongs to this correction.

## Player-facing behavior and acceptance
Bilingual details show current-health fraction and Nightmare floor at current/
next rank, truthful cost/cadence and nonlethal/mitigation/follow-up rules. Remove
the false generic lightning-damage row. Existing mobile detail controls remain.
Causal actual-catalog one-cast rank1/cap failures precede implementation. Cover
partial life, all enemies, resistance/MR, negative resistance, floor clipping,
floor-aware priorities, exact cooldown/mana, zero/invalid/foreign allocations,
schema identity, deterministic replay/no RNG/input mutation, source-bound native
difficulty/next-wave/replay/removal, save/Continue and en/zh mobile/desktop.
Then screen exact earned state with legal point allocation before one ordinary
campaign continuation. No projected save becomes earned state. Full all-class
balance/pacing and C2–C4/G0–G7 remain open.

## Review
Design review: APPROVE for local implementation; required sections covered by
the above, no identified pillar/stack conflict. Root self-review only.
Plan review: ready after including immutable difficulty and floor-aware priority;
a damage-only change would miss both. Security check: pass; local typed pure
mechanics/data/UI, no credentials, permissions, CI/dependency changes or publishing.


## Native Hell amendment — 2026-10-27

Accepted narrow extension after the H1 compatibility checkpoint. The original
Normal/Nightmare decision above remains historical.

Native Hell extends D04 with a JSON-owned `hellFloorFraction` of `0.5`. For each living target, choose the authored fraction explicitly by captured combat difficulty: Normal `0`, Nightmare `0.33`, Hell `0.5`. Compute `floor = max(1, ceil(maxHP * fraction))` and `damage = max(0, min(currentHP - floor, mitigatedBase))`, using D04's unchanged `currentHP * 0.25` deterministic lightning mitigation pipeline. The pulse is nonlethal, consumes no combat RNG, and retains existing learned eligibility, rank, mana and cooldown rules. If every living target is at or below its floor, yield without casting, payment, cooldown or RNG. Capture actual Hell in the immutable native run, CombatSnapshot and replay context. A later map selection cannot change an issued wave. Only an omitted historic snapshot difficulty defaults to Normal; supplied foreign difficulty values are refused. This is a narrow skill-specific extension of D04, not a monster-stat, resistance, reward or global difficulty multiplier.

The official [Arreat Summit Static Field reference](https://classic.battle.net/diablo2exp/skills/sorceress-lightning.shtml#staticfield)
states the33% Nightmare/50% Hell floors. D04's H5 lightning mitigation and
independent flat-MR adaptation remain authoritative. For Hell,510/1000HP loses
at most10;500/1000HP loses none; maximum1001HP has floor501; maximum1HP
retains floor1. These examples are acceptance requirements, not measured balance.

[Exact design and technical approval evidence](../evidence/hell-static-field-policy-review.md)
records the reviewed paragraph and finite implementation boundary. Require
closed JSON/schema metadata, actual immutable Hell combat context, truthful
bilingual details and meaningful floor/priority/mitigation/no-RNG/capture
regressions. Runtime integration and validation remain H2 work under the
[Hell contract](../../design/hell-replay-contract.md) and
[ADR-013](../../decisions/ADR-013-source-backed-hell-replay.md).
