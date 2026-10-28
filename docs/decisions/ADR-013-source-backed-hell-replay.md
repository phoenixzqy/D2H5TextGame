# ADR-013 — Derive Hell access and version its replay history

## Status

Accepted implementation contract, 2026-10-27. Assigned design-contract owner
and producer technical/plan reviews APPROVE; security check PASS.
[Review evidence](../plans/evidence/hell-replay-contract-review.md) records the
exact proposed-body hashes. Extends ADR-008's current replay boundary; its
historical Normal/Nightmare save contract is retained. Runtime acceptance is
separate.

## Context

BUG355 exposes seven runes with no native source. D10 also requires all32
fusion recipes, whose upper outputs already require selected Hell. A material
cache would leave that requirement unreachable. Maps §11 explicitly describes
Hell+40 after Normal Baal; the GDD §7.2 supersedes its stale independent stat
and TC multipliers. Existing material profiles already support Hell.

[The design contract](../design/hell-replay-contract.md) resolves D03/D08/D10
for this slice. ADR-008's immutable profile/reward and native chapter-growth
pattern remains the shared authority. Worldstone already derives admission
from actual claimed Eve plus its complete validated source graph.

Current23 uses live semantic validators. Supplying the frozen22 domain alone
skips the newer explicit Cain/Malus/Countess validators. Historical map types
also share aliases with live code; widening those aliases would change old
acceptance domains. These are compatibility boundaries, not just enum edits.

## Decision

Derive Hell access from `hasAct5CampaignReward`, without a new reward receipt
or Nightmare-Baal prerequisite. Qualified existing source-complete saves gain
feature access; incomplete historical flags do not. Keep selection a guarded
preference. Capture the finite current profile through native canonical
planning, recordings, rewards, clears, ordinals and crafting context.

Author Hell+40 in the validated JSON; apply it once after Normal adjustments.
Reuse ADR-008 native-growth ratios for chapter anchors, retaining hero cap90,
unclamped monster levels, existing RNG, source IDs and loot-table IDs. Ratify
the existing1.5 Hell boss/chapter wishstone formula. Preserve ordinary material
caps/weights and resolve actual equipment/affix level eligibility through a
reviewed D08 envelope, without alternate tables or clamps.

Freeze literal23 types/content/semantic authority, including its explicit
Cain/Malus/Countess validators and exact two-profile fields. Keep historical
`CampaignMapSaveData`/profile aliases closed. Introduce a separate native24
current map/profile type: selected Normal/Nightmare/Hell, exact three-key
ordinals and required unique canonical `hellClearedSubAreas`.

Validate literal23 before migration. Add only empty Hell clears and ordinal0;
preserve all prior data/selection. Reject reserved24 fields in predecessors.
Native24 requires actual source authority for Hell selection or history; no
backfill, replay, reward grant, active-run restore or silent normalization.
Do not register24 until snapshot/hydration/runtime consumers are connected.

## Alternatives considered

1. Add a Worldstone high-rune cache. Rejected: solves some inputs while leaving
   eleven required upper fusion outputs inaccessible, adding a separate faucet
   and changing endgame rewards without addressing the missing native profile.
2. Raise Normal/Nightmare caps or treat an imported/store flag as Hell.
   Rejected: violates D10's explicit act/difficulty restrictions and source
   authority; catalog reachability is not a native earned source.
3. Add a `difficulty/hell` Claim receipt or require Nightmare Baal. Rejected:
   no ancestry for that extra gate; creates an unnecessary historical grant/
   repair policy. The existing Worldstone derived-access model fits the source.
4. Widen historical shared types/validators in place. Rejected: changes what
   literal23 accepts, can skip newer quest checks and hides forged new fields.
5. Copy stale independent stat/TC multipliers or clamp Hell ilvl to old bands.
   Rejected: conflicts with level-only difficulty or conceals missing content
   eligibility while misrepresenting source/item level.

## Consequences

One upstream replay feature connects both high-rune sources and fusion without
new currencies, caches or weakened recipe rules. Source-complete historical
saves can select Hell without new receipts; their existing Nightmare reward
ownership remains unchanged. Normal/Nightmare retain separate history and rules.

Native24 requires coordinated freeze/migration/validation/runtime work and
finite D08 data extensions. Hell monsters can exceed90; current rune weights
suggest substantial acquisition costs. Mechanics and constructed tests do not
certify balance, earned pacing, build viability or full-v1 acceptance. Older
clients refuse24; retain23 backups rather than stripping state for downgrade.

## Compliance

Test raw literal23/current24 acceptance separately, with negative reserved-key
and Cain/Malus/Countess cases. Assert migration adds only the two Hell defaults.
Audit live binary Normal/Nightmare branches and every profile-bearing type.
Require immutable Hell reward capture, correct three-way clears/ordinals,
quest-credit refusal, authority-checked crafting and failure/reentrancy coverage.

Validate all29 canonical planner level domains, exact chapter scaling/HP factor,
finite equipment/affix eligibility and unchanged lower pools. Cover all33 rune
intervals,32 fusion outputs,35 ordered runewords and native UI/save paths.
Keep Normal/Nightmare and Worldstone regression checks. Required full checks
and reviewed production-browser evidence precede functional handoff; earned
and full-v1 gates remain separately open.
