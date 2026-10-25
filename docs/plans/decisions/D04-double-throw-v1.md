# D04 — Double Throw bounded pair

2026-10-25. Preimplementation author contract for [BUG215](../../../production/bugs/BUG-215-double-throw-single-attempt.md).
Root sole writer; independent design/QA and earned balance remain open.

Implement two total independent throws per accepted cast, rotating inside the
original living up-to-two target pool. Preserve the existing unshaped area
selection: enemy summons first, then battle insertion order, first two only.
A lone living original can receive both. This is an explicit author resolution
of the two-weapon promise, not Double Swing's two passes per original target.
No new footprint, cap3, equipment gate or weapon Attack scaling is introduced.

Use the existing default hitSequence rotation with strikes2. Each attempt rolls
hit/base/critical and applies ordinary Defense/resistance, personal shields,
reflection and death/corpse/orb handling. Misses consume attempts. Dead originals
are skipped; the next remaining original can receive a remaining attempt.
Never acquire an enemy outside the original pool. Stop on caster death or when
the pool is dead. Pay12MP/start1sCD once, not per attempt. Preserve Physical50–75
base/+5rank, unlock12/cap20, Double Swing1 prerequisite and the Bash ancestor.
Existing native class/equipment/resource/rank rules remain authoritative.

Extend closed schema capability ownership to this actual skill, require the
exact default pair/active/area/Physical identity and existing eligibility/cost,
and reject shape/per-original mode/contradictory status or recovery payloads.
No shared combat-runtime, type API, dependency, save/version or migration change.
Expose two attempts per cast and per-attempt damage in actual zh-CN/en UI,
including rank0/current/next/MAX, pool selection, misses/death and one payment.

Order: failing native/schema/display tests first; minimal schema/JSON metadata;
causal HP/MP/playback proof; bilingual presentation and UI assertions; production
public allocate/priority/cast/save/reopen at mobile/desktop; focused, compatibility,
actual loader, engine/types/lint/build and full tests. Preserve failed receipts.
Cover ranks1/2/20 ×four seeds ×one/two/four enemies, target-priority order,
independent miss/crit, Defense/resistance, reflection/shield and early deaths,
insufficient resources/cooldown boundary, native prerequisites/rank/aliases,
current-wave immutability/next-wave allocation and save/import. Sibling Swing
and Fury retain distinct modes/counts. Synthetic fixtures prove mechanics only.
Only credit Throw after complete local validation; earned class/build, C2–C4,
G0–G7 and independent acceptance remain open. No genuine campaign/remote action.

Author security check: pass; local first-party gameplay/schema/display/tests,
no credential/network/permission/CI change. Author plan review: ready; reviewed
actual resolveAoeTargets, targetPriority and default sequence loop. These already
implement fixed-pool rotation and ordinary per-attempt settlement. No required
finding remains; this does not represent independent review or balance approval.
