# BUG-551 — Honor caster headroom for ordinary inventory

Severity: Medium. Status: fixed in local verification consumers; production game capacity unchanged. Owner: root (QA).
HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce, inherited dirty human2.
Environment: Node24.21.0 production-store harness; browser/locale not applicable.

Reproduce: restore p15-traps-act4-native-v2.json exported state in the retained
packet. It contains89 ordinary unsocketed backpack items and155 stash items,
after12 legal paid insertions and before any admission. Call
p15-caster-stashing-capacity-v2.ts recoverStashingCasterCapacity. Its underlying
recovery returns ready at<=97 items, but the wrapper requires<=88 and only
transfers special/socketed items. It reports protected-capacity-blocked.

Expected: move one ordinary item through native moveToStash, retain every item,
cost, quest, XP and admission ordinal, then report ready with12 free slots.
Actual: false block with345 free stash slots; no combat or reward replay.
Seed: no new admission or RNG use; next ordinal394. Qualification run seed is
retained in p15-traps-act4-plains-earned32-v1.json, not consumed by this failure.
Evidence: p15-traps-act4-native-v2.json/raw.jsonl.gz/run.log and economyAudit
(zero XP, zero added/removed items, exactly12 insertions).

Root cause: wrapper headroom and its special-item-only transfer filter disagree
with the lower helper's early return. Fix the wrapper's transfer eligibility,
preserving native refusal and all custody checks. Do not change production
capacity, item contents, combat math or rewards. Independently audit the saved
partial preparation before resuming; never repeat its insertion costs.

## Correction and verification

The already-existing p15-caster-stashing-capacity-v3.ts handles all retained item types; legacy forecast/route consumers still used mismatched recovery. Reuse v3 through forecast-v13/ActIV-v6/ActV-v4. Keep the existing v2 and failed saved preparation. Regression: old helper fails89ordinary/155stash; v3 transfers exactly one item natively,88ready is a no-op, and a constructed full500stash refuses without mutation. All three pass (bug551-green-v4.json); scoped types/lint pass. Independent partial readback accounts exactly12insertions with zero admissions/XP/quest/item loss; three altered XP/insertion/admission reports are rejected. The prepared save resumes, completes ActIV and all39ActV waves with zero further insertions. Source/data unchanged; no game capacity or reward assertion was relaxed. Root retains the versioned helper/consumer/fixture/reader evidence in the stated packet; see final Trap route evidence.
