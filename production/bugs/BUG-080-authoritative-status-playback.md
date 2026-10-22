# BUG-080 — Transport the active status lifecycle into recorded combat

Status: open — reproduced before engine patch; subsequent engine/store/UI cards
retain their own causal REDs. Engine transport alone does not close this bug.
Severity: High — recorded playback cannot show the actual application, refresh
and expiry lifecycle; final outcome snapping cannot establish live status timing.

## Reproduction

Baseline `935d2c1`; Linux, Node24.21.0, Vitest1.6.1 engine project. Browser/viewport
N/A for deterministic engine reproduction. Locale-independent transport; later
UI/browser acceptance requires en/zh-CN and the accepted viewport matrix.
Seed1; real production Poison Explosion rank1, one earned corpse and15MP.

1. Run `node_modules/.bin/vitest run --project engine src/engine/combat/status-lifecycle.test.ts`.
2. Inspect the production Poison case: initial body bleeds out at1000; hero casts
   Poison Explosion at1700, then becomes indefinitely stunned at1701. The same
   surviving target starts1000HP and cannot be refreshed by another hero cast.
3. Compare the actual recorded active-status observations with initial state,
   application1700 and expiry6700 after final periodic settlement.

Expected: complete copied initial prefix in effective registration Map order,
then authoritative active lists on committed changes and exact start/expiry
boundaries. Fresh Poison hits60, deals3HP/s through DoT chunks [[3400,5],[5100,5],
[6700,5]], and disappears at6700 on the same living925HP target. No wall timer or
duration reconstruction; all original gameplay payloads/order/clocks/RNG remain.

Actual: gameplay values above already pass, but all three collected lifecycle
tests fail because the engine emits no complete status-state observations.
ID-only status cues do not describe expiry, future activation, source or potency.
The fractional1300.25/1400.5 case and effective-roster prefix also return[] views.

Evidence: root-owned
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-status-engine-71syvdk6/red-initial.log`
and matching receipt/source captures: genuine3/3 behavioral RED,2.14s, exit1;
collection succeeded. Retain until umbrella consumers finish; root removes it.

## Affected systems and proposed root fix

engine-dev: emit complete copied active views at committed writes, registration,
future/expiry and death boundaries. frontend-dev: strict prefix staging, immutable
replacement, final authoritative overlay, atomic timestamp playback and complete
compact badges. QA: SP01–13 in production/stories/status-playback/qa-plan.md.
Controlling contract: docs/plans/decisions/D04-status-playback-v1.md and ADR-005.

Preserve raw outcomes, save/resource/receipt authority and all seeded combat math.
No numeric balance change or UI-synthesized clock belongs to this fix. The engine
card leaves store, batching, compact UI and production-browser acceptance open.
Workaround: none for authoritative live expiry; final results and status log cues
still work. Do not treat a final snap, death, elapsed wall time or imported fixture
as proof of expiry on a living unrefreshed target.
