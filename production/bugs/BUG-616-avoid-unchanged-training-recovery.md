# BUG-616 — Avoid unchanged training recovery

Status: fixed locally, uncommitted. Severity: Medium. Found:2026-11-03. Owner:root/QA campaign policy.
Build: feat/playable-foundations, HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce
plus accumulated changes. Node24.21.0/WSL Linux; no browser/locale/viewport.

## Reproduction

1. Use intended Bone profile with learned Amplify and the Act V area priority.
2. Settle a living-hero training draw in Frigid or Bloody Foothills.
3. Ask the shared preparation controller for its next ranked training source.

Expected: offensive recovery requires a changed learned order. If ordinary
preparation already submits the same order, exclude the failed source and select
the next ranked cleared source; keep admission/nonwin/ordinal costs unchanged.
Actual: trainingCurseRecovery checks global priority and history only, ignores
priorityByArea and ordinary curse selection, and authorizes an unchanged retry.
Native comparison1485FrigidW4 and1504BloodyW3 repeat Amplify→CE used before them.
Both draw, contributing to the terminal training nonwin limit at66/next1505.
This is a preparation-harness defect, not an established player-engine defect.

Evidence packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Frozen `d02-act5-corpse-native-v2.json`, `.journal.jsonl.gz`, `-readback-v3.json`.
Exact battle seeds/complete inputs remain in the native journal; reproduction of
the selection defect needs no combat or RNG. Source: tests/campaign/training-draw-recovery.ts
and prepareCampaignCombo in tests/campaign/actions.ts.

Fix: share ordinary/recovered curse-priority selection; require declared and
learned Amplify in the area recipe and a changed learned order before issuing
recovery. Preserve valid defensive-to-offensive retry and successful stance carry.
Add focused selection/conservation and Act V ranked-fallback regression coverage.
No reset of terminal1505/1459 or new native run, coefficient or budget changes.

Plan review: ready; compare selected learned orders, including area overrides,
curse preferences and unlearned prefixes. Centralize selection to avoid divergent
controller/admission rules. Historical frozen reports/readers stay immutable.
Security check: pass; authorized local first-party campaign code/evidence only;
no credentials, installs, network, CI, permissions, publication or delegation.

## Verification

Ordinary preparation and recovery now share area-specific curse selection.
Recovery requires a changed learned order; otherwise ranked cleared-source
fallback applies. No production combat formula, reward, budget or terminal changed.

Red receipt `bug616-red-v1.log/.exit.json`: seven failures and two passes.
Green receipt `bug616-green-v1.log/.exit.json`: 48 passes and one incorrect test
expectation. After excluding Frigid at level65, the existing ranking correctly
selects Act IV Chaos Sanctuary, rather than Bloody Foothills. Corrected only that
expectation; `bug616-fallback-green-v2.log/.exit.json` passes the single case.
Together49distinct affected cases pass; the48unchanged passes were not repeated.
Scoped types and explicit unignored lint pass (`bug616-types-v1` and
`bug616-lint-v1` receipts), before the expectation-only correction.

All processes are terminal; exact task cache `bug616-cache-v1` is absent.
Logs/configs/backups remain in the evidence packet for root's umbrella review
and eventual cleanup. This verifies preparation policy only; BUG611 Act V
throughput and full privatev1 acceptance remain unresolved. No campaign rerun.
