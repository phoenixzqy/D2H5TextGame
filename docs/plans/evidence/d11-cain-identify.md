# D11 — Permanent selected-item Cain Identify

2026-10-27. Local integration under the approved
[Act I contract](../decisions/D11-act1-remaining-quests-v1.md), validated together
with [Cain recovery and rescue](d11-cain-recovery-rescue.md). Final combined
full unit check and verified retention pass; private-v1 remains unfinished.

## Behavior

A validated main or side Cain Claim unlocks one permanent free Identify ability.
The selected current-act Cain conversation offers actual eligible unidentified,
unequipped backpack instances, with explicit selection and one-item confirmation.
The operation changes only `identified` to true: no charge, XP, currency, RNG,
reroll or save-version change. It remains usable in replay difficulty.

Ownership checks refuse detached or replaced selections, duplicate ownership,
equipped/quarantined/mirrored targets, malformed definitions and runewords or
materials. Modern affixes require authored IDs and valid rolls; historical
runtime Map affixes preserve opaque predecessor IDs and exact values. The
catalog currently authors no charm base; charm eligibility uses a disclosed
test-local authoritative-loader extension, without inventing gameplay content.

The shared quest lease covers live-context verification, exact participating
postconditions, scoped rollback and all-attempt restoration. BUG332 captures
immutable target identity and original/published references across all ownership
locations. Causal failures cover renamed targets, collisions and silent
reinsertion; rollback preserves unrelated items and explicit restoration errors.

BUG333's proposed null-area guard was withdrawn after owner clarification:
`currentSubAreaId` remembers map selection even while Town is open. The ordinary
rescue → Town → Identify path therefore retains that area. Canonical unlocked
Cain presence, validated entitlement, readiness and selected conversation govern
availability; captured area still participates in transaction verification.

## Validation and limits

- Scratch service/panel: 52 passing tests; strict types and explicit lint pass.
- Independent service, panel and final integration reviews: APPROVE; no new
  security issue. Reviewers inspected source/tests and did not execute tests.
- Actual Town integration earns Recover → Akara Give → Rescue → Claim through
  real APIs and identifies through real TownScreen in en/zh-CN. The identified
  native metal weapon reaches actual Iron Golem eligibility.
- Combined focused integration: 593 passes / 30 files; production build passes.
- Final whole types/lint pass after removing the sole unused React import from
  the promoted Town integration test (BUG337). Original handles63276/17577
  terminated0 and were consumed. All runtime inputs match the passing build,
  focused tests and browser matrix.
- Corrected production browser matrix passes8/8. Original handle11472
  terminated0 and was consumed. Final full npmtest original72370 terminated0
  and was consumed:20,211 passes/955files, two existing opt-in skips,1166.118s
  wrapper. All1,841 frozen input hashes are unchanged after terminal.

The browser matrix uses disclosed constructed fresh/current and claimed/legacy
saves in en/zh-CN at 360×640 and 1280×800. It exercises ordinary source actions,
Claims, explicit selected-item Identify and Save → close → new-page Continue,
with exact item-only deltas and native offline-clock bounds. BUG336 records a
harness navigation error after an otherwise successful first Identify/Continue:
Export Save leaves the browser on Settings. A separate corrected runner returns
to Town and selects Cain before asserting the panel; original output is retained.
Independent review of all eight final artifact sets confirms exactly one
`/inventory/backpack/0/identified` false→true change after timestamp/lastOnline
normalization, empty service wallets, fresh main hero XP+2500 and claimed-legacy
quest XP+0. All eight identified→stored snapshots match under the same
normalization. Sixteen Continue comparisons (eight Identify and four each
legacy recovered/given) have no residual changes after the recorded native
offline-time delta. Page/console/HTTP/external-request error arrays are empty.
Four mobile screenshots across languages and fresh/legacy modes were inspected;
the Identify button fits without observed horizontal overflow. These viewport
portions do not prove the entire panel or physical-device accessibility.

These checks do not establish earned campaign progression, balance, pacing,
physical-device accessibility, offline/PWA acceptance, soak or independent
runtime acceptance. Genuine saves remain protected; no genuine action was run.

## Evidence ownership

Root retains required causal failures, corrected source/test hashes, browser
saves/screenshots and reviews in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-cain-identify-9029ruba.evidence.tar.gz`
(SHA256 `4794c4b6b84429c656278b1a2decf97b303b05ec3dd3564cc4cac6bd7b2ee72b`).
All242 retained members were streamed, read back and hash verified. Exact cleanup
removed1005 task-owned files and15 directories including the raw root;
remaining[]/failures[]. Sibling `.evidence.manifest.json`, `.evidence.retention.json`
and `.evidence.cleanup.json` record member hashes and deletion evidence. Companion
Cain evidence is retained as recorded in its document. All recorded child PIDs
are absent; previews39644/39645 are closed. Root owns retained paths through
dependent/full-v1 and independent evidence consumers and removes them afterward.

Countess, Malus/imbues, C2–C4 and full G0–G7 remain unfinished. The active goal
and umbrella worktree continue; no push, PR or deployment occurred.
