# P15 intended Act I recovery selection v1

Status: shared policy checks pass; one native pilot recovers and clears Act I; earned population viability remains unaccepted.

The held-point Javelin pilot clears the Den and reaches level12, then loses
Dark Wood and its first recovery admission in Burial Grounds. Its full journal
retains both losses, zero loss rewards, late-wave resource attrition and native
state. Clearing an area once is insufficient evidence that it is a safe farm.
This is a route-policy limitation; no production combat defect is established.

For all fourteen intended profiles, select a previously cleared Act I area
whose entire ordinary challenge has maximum enemy level at most hero level
minus2. Use the existing native `challengeEnemyLevelRange` projection, with no
seed search, combat forecast or outcome lookup. Select the greatest eligible
maximum, then canonical area ID for ties. If none qualifies, stop before a new
admission. Re-evaluate only when a recovery cycle starts and retain the chosen
area throughout that cycle. Historical profiles retain latest-cleared training.

Earlier areas cost more earned runs: this policy allows40training admissions
per cycle and80total. Keep at most two recovery cycles, one earned level per
cycle, the level14 ceiling and immediate stop on a training nonwin. No point,
resource, gear or XP grants, refunds, seed resets or loss exclusions are added.

Acceptance: a constructed level12 Dark Wood defeat chooses cleared Cold Plains
instead of Burial Grounds; uncleared or level-ineligible areas never enter;
the new limits stop exactly; the journal auditor rejects ineligible sources,
exceeded bounds and missing prior clear evidence. Existing historical recovery
and continuation cases remain exact. Fixtures prove policy, not earned power.

Plan review: use the existing native projection and recovery loop; an optional
profile policy avoids rewriting earlier evidence. Wider limits account for
the lower XP of earlier areas and remain within the existing global budget.
Security check: pass; authorized local campaign evaluation only, no dependency,
network, CI, credential or publication changes. Root implements and reviews.

Verification:50distinct affected recovery cases,scoped types/lint pass. Fresh
v3Javelin earns13through ten Cold Plains admissions, wins the Dark Wood retry
and clears Act I;terminal20after three Dry Hills losses. Full journal readback
passes. [Evidence](../../balance/2026-11-02-intended-javelin-recovery.md).
