# P15 — Retain productive cleared farms after a training failure

Status: implemented and locally verified; opt-in evaluation policy, no new earned run authorized by this record alone.
Date:2026-11-02. Owner:root.

BUG613 proves two distinct defects in the latest Act IV preparation: permanent
Dark Wood fallback discards productive cleared farms, and the level56 target
cannot be earned within200 entries even at a generous native XP upper bound.
This change corrects source selection only. It cannot close the feasibility or
pacing issue, and it does not authorize another farming run.

Add explicit `trainingFallbackPolicy: ranked-cleared-v1` to newly declared
shared Act III/IV controller states. Omission retains historical safe-farm
behavior. Before each training entry, choose the highest previously cleared
challenge maximum within the existing two-level margin, excluding sources
that failed during this route area's preparation. Preserve the existing one
learned offensive retry and consecutive successful stance carry. A recovered
victory restores that source; a failed recovery excludes it. Rank the remaining
cleared sources rather than jumping straight to Dark Wood. Route victory resets
source exclusions; wall continuation reconstructs them from retained attempts.

No target, point, gear, admission, nonwin, combat, wall or retry allowance changes.
Exhausted1434/original1235 and frozen profiles/history stay immutable. Unknown
policy values fail before mutation. The runtime and audit must derive exclusions
from actual retained outcomes; a forged return to an excluded source or a
premature Dark Wood fallback must be rejected.

Validate the new Act IV transition and audit-forgery cases first (red/green),
then run the affected shared-controller Act III/IV regressions, scoped strict
types and explicit lint. These constructed admissions are not earned combat,
earlier-act replay or population acceptance. No native farming follows until
the separate target/reward/pacing feasibility issue has a reviewed correction.

Plan review: ready for this source-selection correction only. Keeping a distinct
state policy preserves frozen history and prevents retrospective relabeling.
The structural11280000XP upper bound is below13597117 required; do not claim
that fixing fallback makes the current preparation plan feasible.
Security check: pass; authorized local campaign controller/evidence only, no
production XP/combat change, credentials, install, network, CI or publication.
Root retains worktree/packet through umbrella review and owns cleanup/release.

## Implemented boundary and affected verification, 2026-11-03

The shared runtime validates policy at creation, retained-state entry and audit
before mutation. Ranked exclusions/recovery survive continuation; the original
three-consecutive-nonwin and spent200-entry bounds remain enforced. Existing
profiles/drivers do not opt in, and frozen histories stay unchanged.

All74 affected constructed cases pass (24ActIV/50ActIII); no earned combat or
earlier-act route is replayed. That pass preceded equivalent validator extraction
and void-callback fixes. Final four targeted boundary cases, scoped strict types
and explicit lint then pass; no broad repeat. Retained red and initial lint
failures are preserved. Evidence:`p15-ranked-fallback-affected-v1`,
`p15-ranked-fallback-boundary-green-v1`, `p15-ranked-fallback-types-v2`,
`p15-ranked-fallback-lint-v2` logs/exit receipts in the retained packet.

[Exact D02 reference and pacing analysis](../../balance/2026-11-03-d02-xp-reference-and-pacing.md)
now reconciles native level costs and documents observed source income. BUG613
remains open; no reward/level-target correction or further farming follows merely
from successful fallback tests.

## Prospective constructor default amendment, 2026-11-03

BUG663 corrects fresh shared Act III/IV/V construction to explicitly record
`ranked-cleared-v1` even without options. This supersedes the opt-in default above
for newly constructed states only. Retained absent-policy states still execute,
resume and audit their historical safe-farm policy; no existing history is
relabeled and no spent allowance is renewed.

The earlier linear-reward feasibility calculation above is historical. The
subsequent shared kill-XP correction and retained Corpse Act IV completion
resolve that structural mismatch for one build, as recorded in BUG613. This
amendment changes neither rewards nor level targets and does not establish
all-build feasibility or30–50-hour pacing.

[Affected evidence](../evidence/p15-ranked-training-default.md): constructor and
source-selection REDs, then45passing selected constructed cases, scoped strict
types and explicit lint. No earned run or new campaign acceptance. Existing
source eligibility, learned offensive recovery, exclusions, continuation and
all limits remain. Security check: pass; plan review: ready.
