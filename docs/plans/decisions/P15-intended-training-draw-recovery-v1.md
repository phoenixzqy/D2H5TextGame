# P15 — Recover a healthy training timeout with a learned offensive curse

Status: implemented and affected checks passed; bounded earned successor completes Act III; independent readback passed.
Date:2026-11-02. Owner:root.

The verified Act III continuation exhausts Durance training at44/next1147.
A healthy Kurast Bazaar draw at985 triggers persistent Dark Wood fallback.
The fixed two-battle diagnostic exactly reconstructs the draw, then the sole
learned Amplify substitution wins at40440ms with full-Life/full-Mana hero.
See BUG608 and retained `p15-bone-act3-training-curse-v1.json`. The source and
seed are fixed before execution; this is no full-area or population acceptance.

Add a separate optional training draw policy, enabled only for intended Bone.
After a native settled same-source farm draw with a living hero, the next
contiguous admission may retry the normal highest prior-cleared source using
already learned/declared Amplify. One failed offensive retry activates the
existing safe fallback. A successful retry keeps its offensive stance only
while consecutive training admissions use the same source; changing source,
route entry, missing/stale history or a default boundary resets that stance.
Retain CE/Wall/Teeth order, native ranks, gear, costs and effects. No change to
production combat, enemy balance, route-only recovery or historical profiles.

Record the triggering ordinal and source on each recovered training attempt.
The controller passes that evidence to the admission callback, which must
submit the combo at its final preparation boundary. Both controller and audit
verify that the trigger is a healthy settled draw or a contiguous victorious
admission carrying the same stance. No recursive retry after a recovery nonwin.
All training admissions, combat time, XP, losses and consecutive loss limits
remain spent. A retry earns no replacement budget and cannot revive1147.

Validation: affected controller transitions/audit forgeries, native combo
selection/conservation, default and route behavior, scoped strict types/lint.
Use constructed custody cases for transitions; do not replay Acts I/II or the
training campaign. A later earned source requires independent authentication
before any native successor. The post985 native domain observation is now independently authenticated and projected explicitly; it is not an original live save/export.

Plan review: ready after making stance evidence explicit at the admission
boundary and requiring both runtime and historical audit to recognize a failed
recovery before fallback. Tests must cover successful carry, source reset,
failed retry, missing policy/skill, forged trigger and unchanged spent bounds.
Security check: pass; authorized local repository and deterministic evidence
only; no install, network, CI, credentials, publication or protected save writes.
Root retains exact task evidence through umbrella review and owns cleanup/release.
Full private v1 remains active; formal balance0/210.

## Verified implementation and source

Thirty-six distinct affected regression cases pass across retained runs; scoped
strict types and explicit lint pass. The original200-entry area cap includes
offensive retries and stance carry. Evidence stems:
`p15-training-draw-recovery-focused-v2`, `-types-v2`, `-lint-v3`.

`p15-training-recovery-prefix-readback-v2.json` authenticates the complete native
observation after985, all433/429 spent admission/training entries,54542814.83752411
combatms,39 Durance entries and one training nonwin. Native projection proof
`p15-training-recovery-prefix-projection-proof-v1.json` checks the normal final
60000ms clock update, canonical equipment mirrors, native derived cache and exact
restore/snapshot/export equality. Original resources remain observed native
store values; battle final Life/Mana are not injected. The original1147 failure
stays retained/exhausted. A separately declared successor must wire both the
training evidence callback and complete carried/new wave history. The bounded successor result is recorded below.

## Earned successor result

`p15-intended-act3-training-recovery-v1` completes Act III at47/next1130:
Durance1128 draws;1129 wins and Guardian is claimed. Independent readback v1
passes exact native export/custody/earned economy/points/quests/mercXP/clock/
seed/party and recovery/fallback/bounds, without combat replay. It adds144
admissions (142training),864waves/one draw and4249860XP. Cumulative577/571
admission/training costs remain spent. Recovery stance carries49 same-source
admissions before the ordinary training source upgrade resets it. The separate
readback-count-correction-v1 supersedes only the displayed Durance counter with
181/200 (39 inherited +142 new); all assertions and gameplay stay retained.
Actual terminal export is the next Act IV source. The projected starting-source
qualification, failed1147 history and formal balance0/210 remain unchanged.
