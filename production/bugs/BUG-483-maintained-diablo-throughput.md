# BUG-483 — Clear Diablo in the maintained Nova continuation

- Severity: Medium; measured campaign throughput frontier with owned recovery pending.
- Status: native recovery verified; maintained fix local, final integration pending.
- Environment: WSL/Node24.21.0; HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce
  plus current human2 changes. Pure native service simulation; browser, viewport
  and locale are not involved. Root owns campaign preparation/QA.
- Reproduction:
  1. Restore the verified earned Act III continuation; earn level40 through324
     native Great Marsh admissions/7032330XP, with no training losses.
  2. Clear Plains765/Claim Fallen Angel and River766/complete Hellforge services.
  3. Enter Chaos767, seed3430922576. All first six waves win; W7 draws60s.
- Expected: earned preparation clears all seven waves, Claims Terror's End and
  unlocks Act V without replaying earlier acts or farming.
- Actual: Diablo6588/44800HP remains. Hero455HP/7mana from542HP/93mana;
  mana reaches0. No Terror Claim or Act V unlock. Cold Mastery6/Blizzard20,
  FrostNova19, five support ranks1; Static/Blizzard/IceBlast casting order.
- Evidence: `d2-counted-source-z3jj3xa1/p15-nova-act4-checkpoint-continuation-v1`
  JSON/raw journal/log/exit and `p15-nova-act4-chaos-failure-controls-v1.json`.
  Native export/economy/combined quest/point/training audits all pass.
- Suspected cause: insufficient cold throughput after flat mitigation and
  depleted boss-entry mana. Earlier BUG458 established the value of earned
  mastery allocation; nineteen Frost Nova points are outside this casting order.
- Next: one native next-admission retry from the retained level40 failure save,
  using its remaining free skill reset to conserve50 paid points and allocate
  mastery20/Blizzard20/five support ranks1/FrostNova5. Retain every cost and loss;
  no new seed sweep, engine/data tuning, grants, earlier-act replay or farming.

Recovery: `p15-nova-diablo-earned-retry-v1` completes the next native admission768
in4.227s (wrapper10.306s), retaining the original failure. All seven waves win;
Diablo dies53.6s, hero572HP/34mana. Actual Terror Claim/Act V unlock and native
export/economy/combined quest/point audits pass. The50-point allocation conserves
all ownership and spends exactly the remaining free skill reset. Maintained
`prepareNovaChaos` and the optional pre-Chaos route callback now apply the same
policy automatically. Fresh five-act and broader build acceptance remain open.
