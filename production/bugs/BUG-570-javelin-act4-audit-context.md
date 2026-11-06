# BUG-570 — Resumed Act IV audit uses the earlier act's lookup

- Severity: Medium; evidence acceptance only, no gameplay failure.
- Status: Fixed in paired external readback; original native result preserved.
- Owner: external campaign continuation/readback, root sole writer.
- Source: campaign authority17; production/data unchanged.

## Reproduction

Run the frozen `p15-javelin-act4-earned-continuation-v1` driver from the exact
level40/ordinal695 earned checkpoint. Its declared pre-Plains stage earns46
in246 Bazaar victories, then all18 Act IV route waves and13 quest actions
succeed. The terminal save is level46/ordinal944; economy/quest/source and
export-readback checks pass. No combat defeat occurs.

Expected: the staged audit queries `javelinTrainingRequest(stage.entryAct,
stage.entryArea)`, preserving the stage's actual Act IV entry context and
Act III farm context independently. Route recovery uses that validated stage.

Actual: the derivative external driver correctly declares entryAct4 but still
calls `javelinTrainingRequest(3, stage.entryArea)`. It returns null, causing
two audit errors (stagedTraining and its routeRecovery consumer). The native
save and every original result, journal, driver and policy must remain intact.

## Correction plan

Add a read-only companion receipt pinned to the original raw result, driver,
policy and authority. Recompute the complete staged admission/XP/wave/time/
loss bounds with actual entryAct4 and then the original recovery auditor.
Reject a wrong-act stage and corrupted XP/wave evidence with bounded negative
controls. Verify decode/export equality, actual Act IV completion and original
passed economy/quest checks; preserve the two original audit failures. Future
Act V continuation must require this paired receipt, not waive raw errors.
No combat, reward, allocation, farm, source-save mutation or native retry.

Plan review: ready; the defect is in the external lookup, and the original
settled evidence contains the inputs required by the existing pure auditors.
Security check: pass; local read-only evidence/source verification, no network,
dependency, credential, permission, CI or publication change.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.

## Verification and outcome

`p15-javelin-act4-earned-readback-v1.json` passes the existing pure training and
recovery auditors with actual entryAct4, verifies export equality and restores
the saved state only to assert actual completed Act IV quest/item/unlock state.
Wrong entry act, corrupted terminal XP and a route wave substituted into the
farm interval all reject. No combat or reward is replayed. The two original
errors remain in the raw result and in this hash-bound companion receipt.
Both native and readback launchers exit0 and remove their exact Vite caches.
Future continuation requires the companion receipt and uses stage.entryAct.
