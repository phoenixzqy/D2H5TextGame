# Final finite side-quest wish rewards — 2026-11-02

BUG588 completes the eight remaining finite side bonuses: Cow rumor, Lost
Caravan, Drognan, Summoner's Secret, Ormus, Larzuk, Anya and Nihlathak.
All22 finite side quests now grant10 wishes alongside every original reward;
side220 plus unchanged24-main450 gives670 authored finite quest wishes.
The five repeatable bounties retain one gem-shard and grant0 direct wishes,
including their first claim. Existing claims receive no retrospective payout.

## Implementation

`finiteSideWishParticipant.ts` captures the complete descriptor-safe authored
quest and reserves the existing source-owned currency journal under the caller's
quest transaction. Seven native publishers cover the eight quests, including
the shared two-cache publisher. Wishes reserve before the first actual reward,
revalidate at publication boundaries and settle before claimed-last. Rollback
restores wishes before the original source/physical/actor participants and
verifies the wallet last. All participants are attempted and disposed; unknown
wallet overwrites remain untouched and cause explicit restoration failure.
Independent additions and absent-versus-zero wallet keys remain supported.
There is no new persisted state, whole-wallet snapshot or post-return payment.

All original XP, fielded mercenary XP, retained tools, named unique rewards,
skill points, resistance amounts, socket/personalization charges, catalog
unlocks and source proofs remain. Exact reward contracts accept the extra
wish field. The engine Anya entitlement allowlist also requires that authored
field; its resistance calculation is unchanged. No combat formula changes.

## Verification

The retained initial proof contains16 failures: eight missing authored bonuses
and eight missing native payments. Affected verification then exposes stale
exact reward/wallet expectations. Anya's initial-service observer is restricted
to the initial notification, with an added assertion that wishes observe the
published six-resistance vector before the claim flag. No assertion is skipped
or weakened to hide a product failure.

478 distinct affected cases across25 suites pass incrementally. This includes
native once-only rewards, before/after/noop ingress faults, overflow preflight,
claimed-last rollback, independent currency additions, late claim-flag observer
mutation, unknown wallet overwrites, exact authored contracts, existing recovery
paths, Anya composition/save behavior, and bilingual public UI claims.
Filtered/skipped cases and the preceding BUG587 receipt are excluded. Whole-suite
reruns replace obsolete assertions; the final two recovery corrections rerun
only those two cases. Scoped strict TypeScript and explicit lint for every
changed TypeScript file pass. Real quest loading validates the authored schema.

Removing exactly the eight new wish fields reproduces the previous side JSON
byte-for-byte. The main JSON hash is unchanged, and all bounty rewards remain
exactly `{gemShards:1}`. No completed campaign, prior-act/build route, broad full
suite, install, CI, commit, push or publication is run for this slice.

## Evidence and remaining work

Retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
`bug588-baseline-v1.json`, `bug588-red-v1.json`, raw intermediate failures,
`bug588-final-checks-v1.json` and `p15-finite-side-wish-budget-v3.json` retain
source baselines, executed assertion statuses, scoped check receipts and inverse.
Authority28 will pin the final source; decision47 carries the full objective.

The retained Javelin campaign has no side claims. Its historical wallet98607,
prospective non-kill arithmetic455, completed five-act route and all prior
14-build evidence are unchanged. This slice establishes no accepted balance
cells and no measured L70 Hell income or active-hour pacing result.

Next: actual source-backed L70 Hell income, protected inventory pressure and
performance, chronological14-build acquisition/funding/fairness and independent
holdouts, defeat/retry, manual/idle, calibrated30–50 active-hour pacing,
integratedG0–G7, soak, review, then owner playtest. Browser works; CI is excluded;
there is no pending question or external blocker. Root retains the worktree and
shared packet for full-v1/review consumers and owns their eventual cleanup.
All validation processes are terminal; the exact temporary TypeScript config
has been archived and removed.
