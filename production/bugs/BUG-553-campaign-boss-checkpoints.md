# BUG-553 — Retain complete chapter-boss boundary checkpoints

Status: Fixed in the current uncommitted worktree. Severity: Medium.
Owner: QA/campaign tooling. No commit was created.

Reproduction: `feat/playable-foundations` at `b5a0898` plus preserved working
changes; Node 24.21.0 native campaign runner. Browser/viewport/locale are not
applicable. Historical fresh-run clock is `1793304000000`; no new gameplay run
is needed to reproduce the missing capture.

1. Inspect `tests/campaign/native-runner.ts`: complete saves are journaled only
   at character creation and terminal stop.
2. Inspect both Claim adapters in `actions.ts` and `quest-actions.ts`: neither
   retains a complete save before granting a chapter-final reward.
3. Inspect the authenticated Nova Act II report and its compressed journal in
   the retained P15 packet. Its terminal save already claims Act II; narrow
   battle/reward observations cannot supply the missing intermediate saves.

Expected: P14's "Export checkpoints after each boss" requirement produces full
native states before chapter-final Claims. Also retain pre-admission states for
chapter-boss route attempts so first-clear inputs are distinct from post-kill
equipment and XP. Refused Claims must not emit successful-boundary evidence.

Actual: the historical lineage offers no usable complete pre-Claim Nova Act I/II
save. A final save cannot be reused as an earlier first-clear fixture.

Root cause: full-state capture exists only in the runner's finalizer, rather
than at the native admission and Claim boundaries shared by the act routes.

Scope: campaign diagnostics only; preserve production code/data, earned saves,
existing historical results, reward accounting, seed/ordinal and route policy.
A checkpoint recorder failure must stop before admission or reward commitment.

Evidence: `docs/balance/2026-11-01-build-act-fixture-catalog.md`;
`p15-maintained-nova-act2-owned-offense-v1/sorceress-cold-nova-focus.json` and
its `.journal.jsonl.gz` under the retained packet. New focused regression
results and retention audit will be appended after verification.

Workaround: keep missing historical cells explicit; do not reconstruct an
earlier save by subtracting rewards or substituting a later character.

## Resolution and verification

`recordCampaignBossCheckpoint` in `tests/campaign/actions.ts` derives the five
chapter-final boss quests from production quest data. It retains a native export
and its decoded complete snapshot before a route admission and before a Claim.
The runner and both Claim adapters use it. Already claimed quests, nonboss areas
and refused Claims receive no boss-boundary record. A failed checkpoint recorder
stops before admission/Claim commitment; existing post-commit reward accounting
is retained.

`actions.regression.test.ts` reproduces missing capture and logger-failure
commitment before the fix. Final affected evidence comprises 111 passing cases
in the six-file run plus the one repaired Guardian post-commit fault case:
112 distinct cases pass. The latter test now injects its failure at the intended
post-commit quest-action record, after the new pre-claim checkpoint succeeds;
its exact reward/receipt/quest-state assertions remain. Strict scoped types and
focused lint pass. The initial entry reproduction used an incorrect callback
argument signature; final typechecking and the corrected entry regression pass.

The original Nova journal retention audit checks all 22,814 records: full saves
exist only at creation (level 1/ordinal 0) and at Act II completion (level 26/
ordinal 371, both Acts I/II claimed). Historical catalog coverage remains 68/70;
this fix supplies future checkpoints, without inventing those two missing saves.

Packet evidence: `p15-nova-checkpoint-retention-audit-v1.json`,
`bug553-checkpoint-green-v2-exit.json`,
`bug553-guardian-post-commit-green-v1-exit.json`,
`bug553-types-final-v1-exit.json`, `bug553-lint-v2-exit.json` and
`bug553-act3-test-lint-final-v1-exit.json`. Exact closure:
`bug553-checkpoint-artifacts-v1.json`.

The 2,091 production inputs remain unchanged at BUG552; reuse its 210 affected
checks and prior campaign measurements. No fresh campaign, farm, reward,
canonical save, dependency, commit, push or publication was introduced.
