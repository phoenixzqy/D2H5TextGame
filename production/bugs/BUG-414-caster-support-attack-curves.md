# BUG-414 — Author explicit low-melee caster/support curves

Status: bounded numeric correction locally verified; numerical balance unaccepted.
Severity: High. Owners: content-designer/engine-dev, game-designer/QA.
Environment: private claimed worktree HEADb5a0898+retained changes, Node24.21.0;
pure deterministic engine, locale/viewport independent, seed13/factory7.

1. Build BurningDeadMage, HorrorMage, Cantor, SerpentMagus, DoomCaster,
   WarpedShaman or Succubus from bundled JSON atL12/trash.
2. Observe missing attack/attackGrowth and generic ordinary Attack87.
3. Apply native ManaBurn and record ordinary physical hits against a passive,
   unmitigated tank; all seven expose the unsupported high-melee fallback.

Expected: explicit provisional low-melee13/+2 caster convention, Attack35 atL12,
with unchanged spells/skill order and native behavior. Actual: missing curves,
generic32/+5 fallback. Six rows normally cover cadence with spells; WarpedShaman
also exposes ordinary actions once its living-minion cap is full. Numeric-only
authoring must not be presented as fixing their unfinished skill payloads.

Cause: incomplete role-level authoring, shared BUG087 catalog gap. Proposed
bounded seven-row adoption is recorded in P15-caster-support-family-v1.md.
Evidence: bundled rows and factory fallback; native RED/paired diagnostic follow.

Native pre-mutation RED:14/14 intended missing-curve/ordinary-damage failures
in p15-caster-red-v1 (8.540s). Added base cadence/coverage/cap and elite controls
give14FAIL/8PASS. Additional contexts give19FAIL/9PASS; two new endgame oracles
first assumed unprefixed `w3` rather than native `worldstone-remnant/w3`.
Correct that fixture before capture; all other source/roster assertions reach
the intended missing curves. Replacement/cap/minion-stat control passes.

Corrected context-red-v2:19intended numeric/damage failures/9passing controls,
10.080s. Initial types/lint found event-union filters lacking explicit type
predicates; annotation-only repair gives types-red-v2/lint-red-v2 PASS.
External harness staticv1 has0diagnostics. Independent preflight APPROVE;
exact driver/recipe now freeze before genuine native baseline capture.


Implemented exact seven13/+2pairs after genuine baseline. Frozen2800fights/arm
completes238/2094/468wins/losses/draws→238/1769/793;325defeats become draws.
All600unchanged control identities and1600covered complete-event/metric pairs
match; payload/runtime/order unchanged. Focused323PASS; final16files/821PASS;
strict types/scoped lint PASS. Independent implementation QA APPROVE, no balance
signoff. Python threaded launcher attempts failed before children; corrected
independent processes pass. Complete28cells, hashes, raw/receipts/failures and
cleanup in [caster evidence](../../docs/plans/evidence/p15-caster-support-family.md).
Inventory74authored/37pending, all111numerical acceptance unaccepted. Deferred
payload/priority and earned campaign/balance work remain tracked separately.
