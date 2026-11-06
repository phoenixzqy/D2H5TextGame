# BUG-477 — Single Lost City training block stops before the declared cold transition

- Severity: P2 (maintained preparation readiness).
- Status: fixed; focused checks and fresh native campaign verified.
- Repro: matched frozen `p15-maintained-nova-act2-retain-v1` clears Rocky/Dry/
  Oasis, falls back to cleared Dark Wood after an Act II farm nonwin, then tries
  to earn level24 in one 64-admission first-entry block.
- Actual: the block exhausts below24 and allows a bounded entry. Lost City
  loses at levels21/22/23; no cold reset/Blizzard allocation is reached. Full
  native source/export/economy/quest/preparation/recovery audits pass.
- Expected: use authored first-entry level21, then separately bounded earned
  level23 and level24 preparation, as the proven cold-evolution path does.
  The cold targets must actually be earned before entering Lost City.
- Evidence: retained-v1 native attempts246/261/289, terminal23, 147 within-act
  farms, 1179waves/1170wins/9losses. Historical successful diagnostic explicitly
  used separate level23/24 purposes within its 256 total training bound.
- Fix plan: keep64 admissions per purpose,256 total, three training nonwins,
  level28 ceiling and six retry cycles. Add declared cold-evolution purposes
  after authored Lost City readiness; do not waive those targets. Audit exact
  purpose/target binding and require the first Lost City attempt at earned24+.
  Use the unchanged native reset/allocation APIs. No monster or XP tuning.
- Plan review: ready; the global envelope stays fixed, extra earned admissions
  and time remain visible, and a failed cold-training target stops honestly.
- Verified prior native result: owned-stash-v1 retains the same level21/22/23
  Lost City frontier,1179waves/1170wins/9losses and1549100XP, with all technical
  audits passing and no owned descendants left alive.
- Regression: `p15-nova-cold-training-red-v1` retains four expected failures
  before the controller change (15 existing checks pass). Constructed no-XP
  first-entry training does not cause early Lost City entry after the fix;
  mandatory cold-training exhaustion and forged purpose/target/entry-level
  evidence are checked independently of native campaign viability.
- Focused verification: `p15-nova-cold-training-green-v1` passes58checks,
  including20controller/audit regressions,29original route checks and9caster
  checks. Scoped strict types and explicit no-ignore lint both pass. Fresh
  normal-salvage `p15-maintained-nova-act2-cold-earned-v1` is the next measurement.
- Native result: cold-earned-v1 technically passes256.620s with stable source
  and campaign manifests, valid native export and all audits passing.
  First-entry Lost City training54admissions, mandatory23training52 and24
  training31; first Lost City attempt319starts at24 with paid Blizzard20.
  Lost City clears353at25; Arcane clears369at26. The later Tomb packed-wave
  draw and third training nonwin remain honestly retained as BUG478.
  Totals:372admissions,1607waves/1597wins/10losses,2446570XP/15467items;
  227within-act training admissions, all below the unchanged256total bound.
