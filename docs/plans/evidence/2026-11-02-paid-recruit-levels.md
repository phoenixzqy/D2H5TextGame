# Paid recruits use the hero's level — 2026-11-02

BUG600 corrects an implementation mismatch with gacha-spec §4: catalog core
stats are L1 values and a new paid identity starts at the hero's level. The
observed level70 hero previously bought a level16 Iron Wolf. The paid boundary
now captures and validates hero level1–90, constructs the L1 baseline, applies
ordinary class growth and starts the fresh actor with full life/mana and zero
XP toward its next level. Existing actors and duplicates remain exact; the
separately accepted deterministic-hire default stays unchanged. No save version
or retrospective actor migration is needed.

## Evidence

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Authority51 records2141 primary inputs and exactly four changed inputs from50:
mercFactory, gachaActions and their tests. Source tree hash
`9fbf58302cc261822e0921130dce498b2f504629c16bec1d97ad86cedf92eace`;
game-data hash remains
`f94fd205da07f4fa8818d38aad5074a97fe7807230bf9c53466faae2f4c6bece`.

| Check | Result | Packet artifact |
| --- | --- | --- |
| Before-fix affected regressions |43pass/9fail; missing level/refusal reproduced|`bug600-red-v1.json`|
| Paid action and factory checks |56/56pass|`bug600-green-v1.json`|
| Related growth/store/star/equipment checks |144/144pass|`bug600-related-v1.json`|
| Scoped strict types |exit0; original strict flags and imported graph|`bug600-tsconfig.json`, `bug600-types-scoped-v1.log`|
| Changed four-file ESLint |exit0|`bug600-lint-v1.log`|
| Engine purity |pass;551 engine test files scanned|`node scripts/check-engine-purity.mjs`|
| Real Chromium147, desktop1280×800/en and mobile360×640/zh |paid actions, exact reload/export, existing roster and no overflow/errors pass|`bug600-browser-v1.json`, two PNGs|

The 200 cases are distinct across nine affected files. No campaign or unrelated
suite was replayed. A full typecheck was stopped with exit130 because of cost;
its empty log is not passing evidence. Final integrated full types remain open.
Browser validation uses disposable copies of the earned level71 successor and
20 of its34 new wishes per copy. Both actual draws are duplicates; no rerolls,
funds grants, forced identities or new-recruit rendering claim. The copies do
not replace the earned economic checkpoint.

Focused five-axis self-review found no required change: the correction lives
at fresh paid construction, reuses shared growth, validates the level before
RNG/payment, preserves rollback and bounds the operation at90. Literal L70 and
L71 assertions supplement the formula oracle. This is not independent review.

## Remaining scope and ownership

The historical trial and all its deaths remain evidence. A subsequent
[earned continuation](../../balance/2026-11-02-earned-levelled-party.md) acquires
a genuine level71 Cold Arrow Rogue and completes its declared three-admission
trial. Separate native and streaming readbacks pass. Additional desktop/en and
mobile/zh ordinary import/field/save/reload checks confirm the new recruit's
level71 and163,574earned XP with exact complete exports, no errors or overflow.
See `bug600-earned-browser-v1.json`; the earlier duplicate-only record is retained.
No saved actor is repaired or re-hired, and no canonical checkpoint is overwritten.

F07/F11/P15, representative Hell income/party viability,14-build fairness and
independent holdouts, defeat/retry/manual-idle, performance,30–50 active-hour
pacing, integratedG0–G7, two-hour soak and independent review remain open; owner
playtest follows implementation. Accepted balance configurations remain0.
Browser works; CI excluded; no pending owner question or external blocker.
Root retains packet and claimed human2 worktree through umbrella review and
owns eventual evidence cleanup/worktree release. Exact task type-info and Vite
cache are removed only after their consumers terminate; `bug600-final-v1.json`
records verified cleanup and current checkpoint references.
