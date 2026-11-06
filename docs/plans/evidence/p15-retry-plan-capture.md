# P15 — Installed retry plans retained

2026-11-05. The previous goal turn was a status report and made no implementation
progress. This increment closes BUG779 locally; full private v1 stays unfinished.

## Result

`measureCampaignRetries` now captures the exact installed native plan immediately
after each admission, before journal callbacks or playback. It validates native
seed, canonical area and wave-count identity, returns `attempt.plan` and includes
the plan in the existing detached `retry-admission` journal. Encounter provenance,
spawns, levels, tiers, affixes, loot and presentation metadata survive even when
defeat prevents playing later waves or native completion disposes the run.
Historical missing plans remain unknown; none is regenerated or backfilled.

The versioned request policy remains v1: only attempt output gains the plan.
Native admissions, adaptation, earned settlement, clocks, loss retention,
1–3 attempt limits and stop-at-victory behavior are unchanged. This is diagnostic
capture, not a population report or production gameplay/save change.

## Verification

Two new `[plan]` controls fail before repair because returned/journal plans are
absent, then pass after repair. Independent read-only copies of the live plan
provide the comparison authority. A constructed initial Sorceress suffers two
contiguous first-wave Catacombs defeats; every returned/published plan retains
the complete unreached suffix, native seed, area and total wave count. Editing
the published area and emptying its waves changes neither the native plan nor
retained results. A separate constructed powerful Sorceress wins Blood Moor,
retains the plan after native disposal and stops after one admission without
adaptation. These are native transport controls, never earned campaign samples.

RED exits 1 in 8.344 seconds; GREEN exits 0 in 8.996 seconds. Exactly the two new
cases run at each stage; six older cases are filtered out. Scoped strict types
cover the two changed files and their 957-file dependency closure with zero
diagnostics. Explicit two-file lint passes with zero warnings. Root self-review
checks the incremental diff and native capture/publication ordering; this is not
independent final QA. No browser check is needed for this Node-only diagnostic.

## Custody and scope

Root retains prospective scope/budgets, preimages, exact RED/GREEN JSON and logs,
process receipts, scoped type/lint evidence, incremental diff and final source
hashes in:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-retry-plan-8q3eyxos`.
Root removes that evidence after full-v1 acceptance and all consumers finish.
All commands are terminal; task-owned Vite cache is removed and absence verified.
The finite control budget closes at two launches/six constructed admissions;
its unused allowance is not renewable. No campaign, population sample, earned
retry, reward-acquisition study, holdout read, broad suite, build, CI or browser
run occurs. Security check passes; plan self-review is ready.

Historical 14/14 intended Normal completions, 210 source contexts and formal
balance 0/210 are unchanged. Population/ordinal/pity/manual-idle and recommended
power/acquisition policy, economy and 30–50 active-hour pacing, remaining gameplay
and difficulty/endgame, integrated mobile/PWA/a11y/performance/soak and independent
review/later owner playtest remain open. Browser works; CI is excluded; no user
answer is pending.
