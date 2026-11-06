# BUG-555 — Distinguish ordinary area clears from boss victory provenance

Status: Fixed and locally verified; diagnostics/docs only, uncommitted.
Severity: Medium; the original save contains the exact state needed to correct it.
Owner: root, measurement/QA.

## Reproduction

Branch `feat/playable-foundations`, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`;
production hash `3ec0567f2eb3b29ecdc4d929d0e24b16d7bef11d5cfa84965860f9c24f3bd82c`.
Local metadata/readback analysis; browser, viewport, locale and combat seed do
not affect the error. The affected retained combat controls use seeds1/8.
Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

1. Read the checkpoint-index3 `clearedActs` projection for
   `p15-martial-capacity-native-v1.json`: it contains Act I.
2. Read its implementation: that field projects the act of **every** cleared
   sub-area, not only the canonical chapter-boss area.
3. Decode the same source's export: cleared areas are Den of Evil, Blood Moor,
   Cold Plains and Burial Grounds. Catacombs is absent. The Andariel quest is
   `inProgress`, `obj-kill-andariel` is false, and receipts are empty.
4. Compare the preceding owned-adaptation decision: it incorrectly says a
   same-act boss clear is already owned and uses that to dismiss first-clear
   provenance.

Expected: classify boss history using the exact boss area, exact kill objective,
Claim and relevant native victory receipts. Ordinary area progress is not boss
victory. Pre-victory state still does not establish a first-ever attempt or full
gear/power provenance.

Actual: the external interpretation conflates these fields. The saved source,
six executed native trials, their outcomes and reward audits remain intact.

## Evidence and root cause

`p15-build-act-checkpoint-index-v3.py:state_projection` constructs `clearedActs`
from all `map.clearedSubAreas`. The label is valid at act granularity but was
used as a stronger boss-history claim in
`p15-martial-act1-owned-adaptation-decision-v1.json` and its Markdown report.
Do not change the existing index's meaning or replay combat to repair this.

## Resolution and verification

Original index/trials/v1 decision remain immutable; the preceding report is
archived as `bug555-prior-martial-report-v1.md`. Supplemental
`p15-build-act-boss-history-v1.json` and source readback1 separately authenticate
373 exports and all70 dispositions, with exact pre-victory/post-victory/Claim/
unknown fields. Five controls cover ordinary clear, exact boss clear, kill
objective, Claim and victory receipt. The current report and Martial decision2
retract the incorrect inference while preserving every combat outcome.

Current native source review validates58 pre-victory sources,46 initially
quest-ready. Existing Staff insertions/seal interactions prepare nine more
without combat or reward; exact whole-export readback passes all12 attempted
branches. Three Act III sources still need genuine quest preparation and12
cells lack a tracked pre-victory source in the index. This is not a proof of
original first-ever attempt, power, complete gear provenance or final balance.

Both final drivers pass scoped strict types/focused lint. No production runtime,
source index meaning, earned authority, commit or combat replay changes. See
`docs/balance/2026-11-01-boss-source-and-quest-preparation.md` and exact closure
`p15-build-act-boss-source-artifacts-v1.json`; owned processes terminal and exact
task configs/caches removed. Full v1 acceptance remains open.
