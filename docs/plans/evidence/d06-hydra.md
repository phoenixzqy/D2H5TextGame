# D06 — Hydra paid multi-headed summon

Source `5d37d537`. Root is sole author/reviewer. Local bounded functionality; independent design/QA and earned balance remain open.

## Behavior

Hydra prepares one targetable body at each wave start, charging40MP once. It lives10s and attempts three independently rolled Fire/Burn bolts on its own scheduled actions. A killing head reselects the next living hostile. Expiry/body/source death stops it; no same-wave retry, replacement or refund. The original level30/ranks1–20/CD4s/95–140+9per-rank/10%Burn coefficients are preserved. Body/lifetime tuning remains provisional.

JSON-owned body stats and private paid spawn bindings prevent template markers from granting power. Ordinary shared scheduling, damage, control, death and playback remain authoritative. Body control blocks its actions; owner control does not. Paid rank and Fire bonus are captured for each new body.

Native waves recompose current learned rank/mastery and pay again from carried mana, without carrying the old body or mutating issued events. Save22 remains configuration-only. Bilingual current/next/MAX previews distinguish head bolts, body stats and preparation. No art generation.

## Validation

78 new regressions:30 definition/schema,35 causal,5 native,8 bilingual UI. Focused407/7 passes; engine8224/307 passes; types/lint/build/precache/debug-bridge and final production4/4 pass. Full unit suite:16544 passed across747 files, two existing skips;706.03s Vitest/707.797s process.

Final production en/zh-CN × desktop/mobile: one cast and five body Fire hit lines in each case, actual body naming/HP,40MP debit,20geometry checks, eight exact six-domain save pairs and four actual service-worker offline Continues. Synthetic imported characters prove mechanics; no earned campaign/balance inference.

Eight original screenshots and four final targeted body captures inspected. Original mobile captures place the body below fold and fixed navigation overlaps preview edges; targeted body names/HP are readable. General UX/a11y remains open.

## Failures and limits

Original two-test native RED retained. Strict-Ajv local refs, missing required body field, typed schema narrowing, unnecessary test conditions and control/tie fixtures were corrected without relaxing assertions or settings. Native tests exposed/fixed stale next-wave Hydra rank. Other native fixture failures used nonexistent mana-event fields or an unsupported equipment bonus; final tests use real Fire Mastery.

The first browser-file lint was ignored by repository defaults; explicit --no-ignore lint passes. One final lint wrapper exits143 without a receipt; direct/ESLint processes were verified absent before identical serial lint passed. Cause unresolved; interruption is not counted as validation. BUG180/237 and test/build/bundle budgets remain open.

No genuine campaign or remote action; full C2–C4/G0–G7/privatev1 remain unfinished.

## Integrity and inventory credit

All1494 frozen source/config/test/contract files match committed implementation
blobs; all761 build files match recorded hashes. Three post-build test/spec edits
are documented in the packet; production source stayed exact. Hydra is the only
changed Sorceress JSON object, with the other29 raw objects exact.

Only Hydra gains inventory credit:145bounded-functional/66unverified/one
engine-only/one review-needed. Sorceress29/30; Cold Mastery remains review-needed.
Other212 raw CSV rows, all213 IDs and ordering remain exact. This count describes
tested mechanics, not full-v1 completion or independent/earned acceptance.

The retained genuine Ancients401 save has unchanged decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577`:
L33/XP149261/nextNormal402/Nightmare0/Ancients-Rite claimed/Baal uncleared.
C0/C1 retain limited acceptance; C2 is underway, C3/C4/fullG0-G7, all-class earned
builds,30-50hour pacing/economy/endgame and full privatev1 remain unfinished.

[Contract](../decisions/D06-hydra-v1.md),
[BUG240](../../../production/bugs/BUG-240-hydra-creates-no-summon.md),
[terminal results](fixtures/hydra/terminal-results.json),
[browser audit](fixtures/hydra/browser-audit.json),
[source identity](fixtures/hydra/source-delivered.json),
[integrity](fixtures/hydra/integrity-delivered.json),
[inventory audit](fixtures/hydra/inventory-audit.json),
[author review](fixtures/hydra/author-review.json) and
[packet](fixtures/hydra/packet.json) retain the bounded conclusions and limits.

## Raw retention and cleanup

Required raw failures, logs/receipts/process records, reports/attachments,
frozen test/source/build manifests and task scripts are in this root-owned
[diagnostic archive](/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-hydra-retained-hw2sdxfx.tar.xz):202 regular members,
6688292bytes, SHA256
`09765ff5231fc7877effcbe343f71a16e0496bbaa17cf2f2d3d212f2c7f7a94b`. Every member was byte-verified. Disposable production
output and task-local runtime caches were excluded.
[Retention](fixtures/hydra/retention.json) names the exact archive and condition:
root removes it after original failure diagnosis and all full-v1 evidence
consumers finish.

[Cleanup](fixtures/hydra/cleanup.json) removed1504 exact task-owned files,
including761 build and541
runtime-cache files. All678 recorded PID/starttime identities and
4 browser profiles are absent; port4519 is closed. No process was
killed. Scratch is absent, remaining[]/failures[]. Shared caches/tools, source/
history, genuine save, prior archives and umbrella worktree/branch/claim remain.
