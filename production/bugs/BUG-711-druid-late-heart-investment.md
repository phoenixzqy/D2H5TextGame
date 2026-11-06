# BUG-711 — Invest late Summon Druid points in party damage support

Status: Locally fixed allocation policy with earned five-act Normal validation; broader viability and independent acceptance remain open.
Severity: Medium (canonical campaign allocation candidate; players can allocate manually).
Owners: game-designer/level-designer; root implements locally.

## Reproduction

HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited human2 edits.
Pure native allocation/profile readback; browser, viewport and locale do not apply.
No combat seed is consumed by allocation. Retained Ancients admission723 is not replayed.

1. Read `tests/campaign/intended-growth-v1.json`, Summon Druid targets.
2. Observe Heart1 followed by Grizzly20, Dire10, Spirit10, Oak10 and Raven8;
   no later Heart target exists at any level.
3. Read the actual level50/next724 native export in `d2-druid-act5-b99gu3d4`.
4. It has Heart1/Oak10/Grizzly20 and zero free points; the retained Ancients
   fight ends with full hero resources and two surviving enemies.

Expected: the late damage-focused allocation candidate invests in the existing
party Attack/critical aura after its Grizzly/Dire foundation, while respecting
actual point budgets and previously spent ranks.
Actual: even unlimited future levels leave that damage-support skill at rank1.
The engine applies the authored rank correctly; this is a profile design gap,
not evidence of an engine defect or proof of a winning replacement build.

## Correction and evidence

[Decision](../../docs/plans/decisions/P15-druid-late-heart-investment-v1.md)
adds Heart20 from level40 after Dire10 and before late Spirit/Oak/Raven targets.
It preserves early growth and existing allocations; a native reset must be an
explicit separate action. Existing BUG708 and Normal completion remain open.
No stat tuning, campaign admission, reset of earned state or retry is authorized
by this allocation-only slice.

Required packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-druid-heart-growth-k00gaj2z`.
Original profile/test bytes, exact retained-source hash and prospective plan are
saved before edits. Root retains the packet through unfinished umbrella review.

## Local result

Three corrected pre-edit RED cases demonstrate the missing investment. Six
selected cases then pass with scoped strict types and explicit lint. The first
test run had incorrect milestone/starter/sequential-growth expectations; it is
retained separately and is not the accepted RED. Constructed native reset
refunds61 ranks and consumes one free allowance (zero currency), then funds
Heart20/Grizzly20/Dire10/Spirit6/Oak1. No earned reset is performed.

Separate readback proves exactly one inserted target, all old targets/profiles
and pre-existing test cases unchanged, all2100production files unchanged, and
the actual50/next724 source export exact. See
[verification](../../docs/plans/evidence/p15-druid-late-heart-investment.md).
No commit is created; BUG708 and the overall privatev1 goal remain open.


## Earned Normal completion — 2026-11-04

[Native reset, Ancients and Throne evidence](../../docs/plans/evidence/p15-druid-heart-normal-completion.md)
records the actual free reset at level50/next724:61ranks refunded/reallocated,
skill allowance3→2, stat allowance3 unchanged, zero currency. Heart20/Oak1 replaces
Heart1/Oak10. Ancients724 wins7/7waves and first Throne725 wins8/8; both native
Claims, all five Act V main Claims, Baal title and Nightmare unlock reconcile.
Successor is level50/next726;852,382heroXP and151items earned. Separate raw-journal/
save/reward arithmetic readback passes. Prayer31→32→33 also advances naturally;
this route does not isolate Heart's causal contribution. The legacy-threshold
canonical XP projection artifact is explicitly reconciled in the evidence.
BUG708 is locally resolved for this intended Normal route; formal balance0/210,
population viability, pacing and independent acceptance remain open. Required
packet d2-druid-earned-heart-6kb0j4ix and human2 remain root-owned through unfinished
umbrella review. Eight recorded PIDs/four caches absent; no completed-act replay.
