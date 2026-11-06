# P15 — Mephisto’s three-stack Poison Cloud

2026-11-05. BUG751. Type: tweak of existing Act III encounter, under the user’s
complete private-v1 implementation authorization. Root works solo in human2.

## Contract and cause

`monster-spec.md` §6 requires AOE three-stack Poison every three turns. Native
manual/idle reproduction instead applies one because Mephisto uses the shared
cloud. The existing status engine already handles stacks, potency, expiry and
cap; correct the authored source rather than add boss-ID combat branches.

Author `monster-mephisto-poison-cloud` / `monster.mephisto_poison_cloud` as an
explicit rank-one skill variant. It shares the existing localized Poison Cloud
name/description/icon; direct Poison15–25, CD3s, MP0, all-enemies, no projectile,
chance1, three stacks,5%mitigated-hit DPS per stack,5000ms. Keep the existing
Poison10cap/refresh/first-positive-potency and all other status/damage semantics.
Use the validated copied/frozen monster-dot resolver and explicit spell delivery.
Only Mephisto’s archetype and chapter list select the variant; Frost Nova4s and
Lightning2s retain the established1540/3080/4620ms repeating cadence atAS120.
Ordinary Poison Cloud and its consumers retain one stack and their exact tuning.
All encounter stats/rewards, immunity and resistance semantics stay unchanged.

This extends the generic seven-spell decision with one explicitly specified
boss variant. BUG749’s no-duplicated-spells boundary was for its cadence-only
correction; this separate payload requirement now adds an authored variant.
A generic actor-payload override framework would add unnecessary combat metadata
and execution branches for this single requirement. No save format change.

## Acceptance and verification

Reproduce native manual/idle wrong stack count before production changes. Then
assert three stacks, per-stack potency/duration/source and exact cadence/stats,
real periodic damage, party-wide targeting, capped refresh, input isolation and
plain/recorded/re-record parity. A bounded single-cast diagnostic covers full
expiry/integration, misses and immunity; ordinary shared cloud remains one stack.
Schema/resolver checks cover absent/duplicate/malformed variant, rejecting wrong
stack counts on both variant and generic skills. Check spell delivery and real
localized action names. Run only these and directly affected existing tests,
scoped strict types and lint. No earned campaign, sample or retry-budget renewal,
CI, broad suite, build, commit or push. Independent/owner acceptance remains open.

## Review

Plan review: ready after including spell-delivery classification, source-owned
chapter and archetype references, strict shared-versus-boss stack constraints,
and real periodic integration/expiry rather than only metadata assertions.
Security check: pass; local authored data/resolver/tests, no credentials/network/
installs/permissions/publication. Preserve inherited changes and CI deletion.
Root retains exact BUG751 evidence through full-v1 acceptance, then removes it;
clean exact disposable processes/caches after checks. Previous turn was a status
report with no implementation progress. Full v1 remains incomplete.
