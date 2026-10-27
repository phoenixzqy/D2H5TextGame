# D05 — Cold Mastery resistance penetration

2026-10-24. Root implementation decision under the authorized full-v1 goal.
Independent bounded design/source/evidence review approved at `7c01aceb` on
2026-10-27; see the [review scope](../evidence/p07-cold-mastery.md#independent-bounded-review--2026-10-27).
Independent current-head runtime QA and final balance acceptance remain open.
The original earned level24 campaign input was unchanged by this slice.

## Problem and scope

BUG144 reproduces an advertised passive with no effect. Both locales and
`docs/design/skills-spec.md` describe resistance reduction, while current JSON
advertises an unused4%cold damage increase. Preserve the resistance-reduction
identity rather than implementing the contradictory damage bonus.

## Authored values

Keep authoritative `requiredLevel:30`, legacy `minLevel:12`, cap20. Rank1
reduces resistance by15percentage points, preserving the existing promise.
Each additional allocated rank adds4points, giving19at rank2 and91at rank20.
The4point growth is an explicit new design reconciliation using the old.04
growth magnitude; it is not a recovered prior approval or original D2 formula.
JSON owns both values in closed `coldMastery` metadata; remove the contradictory
generic damage payload. Retain an optional empty `scaling:{}` for the uniform
authored catalog shape; schema rejects every scaling entry for this exact
identity. No other skill is retuned.

## Eligibility and allocation

Only the player Sorceress at finite level>=30 with actual allocated ranks is
eligible. Resolve only exact authored/canonical aliases, maximum valid finite
positive integer once, clamp to20. No combo/legacy skill/marker inference.
Never sum aliases. Removed/ineligible allocations explicitly project zero.

## Damage and ownership

Project a transient bearer-owned cold-resistance reduction on the hero at the
normal composition boundary. Subtract it from target cold resistance only for
that source's direct cold damage, before existing act penetration and[-100,75]
clamping, then ordinary magic mitigation and floor. Target stats are never
mutated. This is personal penetration, not a shared curse. It does not affect
mercs, summons, other damage types, recovery, control duration or Attack.
There is no separate immunity rule: the existing resistance clamp still applies.

## Lifecycle and persistence

Automatic passive: no action, payment, cooldown, marker or extra RNG. Current
recording stays frozen. Next wave and explicit replay recompose current ranks;
replay retains original resource/carry baselines, with no refill/accumulation.
Only existing allocations persist; no save version or historical data change.

## Player-facing behavior

Bilingual prose states unlock, base, growth, cap and personal direct-hit scope.
Current/next rows show15/19and91at cap as resistance percentage points, never
as generic cold damage. Allocation aliases in the UI follow the same resolver.

## Verification

Causal production-factory RED precedes runtime edits (6fail/10controls pass).
Verify closed schema/immutable definition, invalid allocations and aliases,
fixed cold100against resistance50/MR10giving40/55/59/131, unchanged noncold
controls, target immutability, real cold spell, exact RNG/replay, native wave
removal/replay and bilingual current/next/cap/unlearned details. Run focused,
engine, full unit, types/lint/build and bounded production browser checks.
Constructed test characters prove functionality, not earned progression or
full cross-build balance. No new Radament attempt belongs to this slice.

## Plan and security review

Plan review: ready after adding explicit new-wave/removal and personal ownership
controls; a damage-only unit test would miss stale carry and shared-target bugs.
Root self-review only. Root-cause fix is one authored definition consumed by
composition, damage and display; no generalized passive framework is needed.
Security check: pass. Local typed/schema-validated deterministic mechanics;
no network/dependency/permission/CI change, save mutation, publication or unsafe
process cleanup. Existing worktree claim remains owned by this thread. Exact
task-owned artifacts are tracked under `d2h5-cold-mastery-z8mtwgmg`.
