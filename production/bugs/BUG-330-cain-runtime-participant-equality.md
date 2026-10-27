# BUG-330 — Verify runtime Maps and sparse arrays in Cain Claims

Status: Fixed locally; final combined full suite passed.
Severity: High — silent participating-payload corruption can survive Claim.
Owner: frontend-dev / engine-dev; root integrates the independent review finding.

## Reproduction

Vitest/jsdom store transaction; no browser viewport or locale dependency. No RNG
or genuine gameplay involved. Construct a valid consumed-scroll/rescue/Talk graph.

1. Put a legacy item affix `values: new Map([['strength', 2]])` in hero equipment.
2. Subscribe to the Claim's map publication and change that Map value to999.
3. Claim Cain's side entitlement through `claimQuestReward`.
4. Separately repeat with empty hero equipment; set its array length to1 without
   adding an own index during the publication.

Expected: Both corruptions refuse settlement, restore original participating
payloads, and report a restoration failure if an observer prevents restoration.
Actual: Both return `ok`; the comparator sees no changed enumerable keys.

## Evidence and cause

Independent `/root/review_combat_log` review identified that the original
JSON-only `sameCainData` is now used for full runtime hero/merc snapshots.
Maps have no enumerable keys; array length is non-enumerable. The two regression
cases in `src/features/quests/cainClaim.test.ts` reproduce the defect: the original
`runtime-equality-red` run fails2/passes12. Original log/receipt are retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-cain-1sjuc_zy` until the
card's verified evidence archive replaces that raw root. Root owns cleanup.

No player workaround is needed: the draft has not been published or deployed.

## Local correction and current validation

Runtime Map contents and sparse-array length now participate in equality. The original two causal failures pass with all prior Claim controls; combined focused593/30 and final whole typecheck/lint pass.

Final full `npm test` original72370 terminated0 and was consumed:20,211 passed,
955 files, two existing opt-in skips. All1,841 frozen inputs rehash unchanged.
Final whole types/lint/build and browser8/8 pass; independent review approves.
Original failures and final receipts are retained in the verified Cain/Identify
archives linked in [Cain evidence](../../docs/plans/evidence/d11-cain-recovery-rescue.md)
and [Identify evidence](../../docs/plans/evidence/d11-cain-identify.md).
Both raw roots are absent after exact cleanup, remaining[]/failures[]. No remote
publication or private-v1 completion is claimed.
