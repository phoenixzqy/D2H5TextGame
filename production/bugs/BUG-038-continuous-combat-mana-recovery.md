# BUG-038 — Settle continuous mana recovery at actual combat boundaries

- **Status:** Reproduced; P07a01f tests-only review, runtime not implemented.
- **Severity:** High; learned Warmth advertises mana recovery but grants none.
- **Owner / systems:** engine developer; pure recovery integral and battle
  settlement, with production cross-wave integration tests.
- **Build:** engine baseline `dd236ebcd57f70c5cf06e22a6450cf39e5064ffd`;
  root integration head `5ee37b2` adds accepted UI display only.
- **Environment:** Linux / Node24 / Vitest engine and store suites. No browser
  or viewport claim; engine behavior is locale independent, UI en/zh-CN remains
  separate ordinary-earned acceptance.
- **Seed:**7; controlled combat boundaries and actual production sub-area plan.
- **Contract:** `docs/plans/decisions/D05-warmth-recovery-v1.md`.

## Reproduction

1. Compose an actual Energy20 Sorceress with learned Warmth rank1, producing
   rate4.16MP/s. Start MP0 below capacity, with no available action and a real
   enemy periodic terminal at1250ms. Run `runBattleRecorded` with seed7.
2. Inspect final MP, fractional carry and absolute regeneration events. Repeat
   with rank0/2/20 and exact1000ms,25000ms and partitioned boundary controls.
3. Start7MP with actual production Fire Bolt cost8, rate1MP/s, AS250 and freeze
   through1000ms. The500ms action is blocked; at1000ms recovery must fund the
   real spell before its action, then spend to0MP. A separate same-boundary
   periodic hero death must forbid both recovery and action.
4. Exercise actual production start → playback → advance with controlled E20
   and Warmth1, seed7/ordinal0. First wave ends4000ms, max80 and one4MP orb;
   next wave ends6000ms, fresh max84 and nine4MP orbs. No synthetic outcome
   resources substitute for these new recovery tests.
5. Run `npx vitest run src/engine/combat/mana-recovery-combat.test.ts
   src/stores/combatHelpers.cross-wave.test.ts --reporter=verbose` in worker's
   claimed isolated worktree3, before any runtime change.

## Expected and actual

At4.16MP/s,1000ms grants4MP/.16carry;1250ms grants5MP/.2carry. Rank20 E20 rate7.2
grants exactly9MP at1250ms across1/17/250/unequal partitions.25seconds at4.16
and43.68 grants104 and1092MP. Actual baseline grants0MP and no regeneration
events, leaving recovery state absent. Fire Bolt cannot use the promised
boundary recovery. The existing absolute-event transport is already accepted;
the missing source is continuous simulation settlement.

Production derivation: manaMax=50+(level−1)×4+Energy×1.5, so80 then84; actual
orb=floor(max×.05)=4. First wave0+floor(4.16×4)+4=20MP/.64carry. Next wave
20+floor(.64+4.16×6)+9×4=81MP/.6carry, below84. Baseline instead ends4 then40MP
from orbs alone. Fixture-construction assumptions about2000ms terminal,
3MP orbs and19/71MP were corrected from existing source/recordings before
freezing tests; no runtime change produced those corrections.

## RED evidence

Frozen checkpoint worker handoff:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/p07a01f-uj2g8lf3/RED-HANDOFF.md`.
Exact tracked plus untracked patch `red-reviewed-tests.patch`, SHA256
`5595dcf331851c6388e23c866ee91499b0743fbdb19be8d35c63b4116aba9690`;
`red-reviewed-proof.json` preserves per-file hashes and source identity.

Executed behavior: **38failed/29passed/67total**, zero skipped, exit1,
Vitest3.01s. Engine:33failed/793passed/826executed, zero skipped, exit1,4.70s;
all780 pre-existing engine cases pass. Missing pure helper separately causes
collection failure, **0 tests executed**; its25 planned API tests are not
counted as behavioral RED. Typecheck exits2 with exactly one expected TS2307
for missing `./mana-recovery`. Executed engine/store test lint and diff check
exit0. Raw logs and exact commands/timings are in the same task directory.

Production combat source unchanged SHA256
`439eb1a86e3c4c68fe69978c623af810d64ac4006d26f4db2ad3412be8e15698`;
new runtime helper absent. Final tests-only worker commit `66bad6601df7ca886a9570890cc5bda999ce7fde`
was integrated as `6f8045e`. The supplemental production playback case advances
strictly before `end`; cursor=endIndex, playbackComplete=false and unchanged
outcome controls pass, while live MP is4 instead of literal20 and actual
regeneration is absent. Final behavior **39failed/29passed/68total**, zero
skipped, exit1, Vitest2.98s (wall4.331s). Other test hashes and runtime remain
unchanged; supplemental test lint exits0.

Final patch `red-supplemental-tests.patch` SHA256
`303f4d36fb642f700084c6b5d07c7ade7f400d2d4ac3375383c5eaa219aed093`;
cross-wave test SHA256
`442358b67ab883ebcadfe5acfc9a55f6425823b22017a1f0680f93a7389e0099`.
Producer and independent QA both APPROVE / ADEQUATE the final frozen RED,
including exact partitions, lifecycle and actual pre-end playback. Root accepts
the tests and authorizes only the two planned runtime paths within the existing
five-file assignment. Runtime correctness and final combined-head validation
remain open.

## Minimal source plan and boundaries

Keep a battle-local cumulative compensated MP-millisecond integral and whole
granted count; seed/export only valid fractional carry and signed finite
compensation across qualified next waves. Repeatedly reducing fractional MP
can lose a whole point under fine partitions. No rounding epsilon.

Capture previous simulation clock, settle complete periodic HP/deaths/orphans/
refunds/orbs/expiry, then recover current living survivors through the boundary
before winner/action checks. Cap discards overflow and carry and deletes the
local integral, including existing cast/refund/orb cap paths. Death removes
local state. No new scheduler pulses, RNG/Date calls, pre-spawn backfill,
wall-clock/pause/offline/between-wave recovery or post-terminal settlement.
Invalid/nonpositive/nonfinite rate/elapsed/max grants nothing and preserves
legacy optional shape. No engine imports from stores.

Exclusive worker scope: new `src/engine/combat/mana-recovery.ts` and test,
`src/engine/combat/combat.ts`, new `mana-recovery-combat.test.ts`, and existing
`src/stores/combatHelpers.cross-wave.test.ts`. Root owns this bug/ledger and
integration. Source authorization follows independent reviewed RED; broader
passives, merc baseline, HP regeneration, economy and campaign remain open.

Security check: **PASS**. Local deterministic resource settlement; no network,
credentials, dependency, permission or validation-bypass changes.

Artifacts retained for root/producer/QA consumption. Worker owns precise
cleanup and managed worktree release after integration/handoff; no publication.


## Source-review precision amendment (not accepted runtime)

Worker's initial minimal implementation passes the original93 focused cases
and851 engine cases, but source review found two missing exact-partition
controls before integration. The first implementation exports
`total / 1000 - wholeGranted`: at7.2MP/s,695ms gives5004MP-ms,5whole and
carry0.0039999999999995595. Reseeding a555ms second battle loses one MP,
granting8 rather than literal9 across1250ms. Subtracting whole MP-ms before
division fixes that example but does not establish all handoff partitions.

Independent QA also identified multiplication rounding:43.68MP/s split into
16ms and24984ms can sum to1091999.9999999998MP-ms, granting1091 rather than
literal1092. Addition compensation alone does not correct this product error.
Root's bounded arithmetic diagnostic reproduced both; worker is adding actual
two-battle and pure-helper RED controls before any source correction. No epsilon,
weakened assertion or campaign tuning is authorized. A reasoned numeric contract
amendment and independently reviewed supplemental RED precede further runtime.
Initial GREEN remains provisional, not acceptance.


Precision supplemental tests-only worker`9aa93c67d1872c48b0e7703d5c0595e23be13a18`
integrated`e5613fb`. Root/producer/QA APPROVE the two-test RED:2failed/93passed/
95executed,zero skipped,2.99s. Tests patch SHA256
`8fe45d5672e2ed280d0790892a027915cd2c06510ebc929d549851c2aa3d32d2`.
Initial source helper`1abb82e168e352843c94e7304bd9aa746879d634e76e0c56f9b932641b80823c`
and combat`26758890f9bd900f2404e79ab501df1d79b2010b78ac55e40dab942a3b9ca103`
remain uncorrected/unintegrated. D05's controlling precision amendment now
specifies explicit transient exact decimal state and exact endpoint arithmetic,
with legacy credit qualification and unchanged death snapshot policy. Producer
and QA reviewed the representation/normalization. New API tests are authorized
before further source edits; no runtime acceptance yet.
