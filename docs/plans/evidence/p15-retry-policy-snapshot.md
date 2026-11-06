# P15 — Preserve the declared retry policy

2026-11-05. BUG778 is fixed locally, uncommitted. The existing contiguous native
retry harness now preserves its declaration before observing outcomes; no new
retry harness or production gameplay path is introduced. Full private v1 remains
unfinished.

## Root fix

`measureCampaignRetries` previously retained the caller's mutable profile, and
its journal exposed private wave/action references. A consumer could change the
build after a loss or corrupt retained outcomes. The first journal entry also
occurred after native admission, without a complete policy declaration.

The harness snapshots the full request at entry, including every nested profile
field, area/act, clock, attempt limit and equipment rule. It publishes
`retry-policy` with `{ version: 1, request }` before admission and returns the
same declaration's private snapshot as `result.policy`. External publications
and stored adaptation actions are separately cloned. No external journal value
aliases the working policy, native wave observation or retained action record.
A failure to publish the initial policy restores the clock without consuming an
admission or changing native stores. Later failures keep the existing partial
journal/live-successor contract; there is no rollback or free retry.

The declaration records the requested policy; it does not certify its balance,
recommended power, acquisition history or appropriateness for every build. The
existing native admission/refill, owned-point allocation/equipment selection,
clock/counter advancement, quest settlement, stop-at-victory and 1–3 attempt
limit remain. Journal consumers are still responsible for durable storage and
must not directly mutate native stores. Historical missing declarations stay
unknown; no reconstruction is performed.

## Affected validation

Exactly three new `[policy]` controls run in
`tests/campaign/retry-measurement.regression.test.ts`. Existing controls in that
file are filtered out. No completed campaign, earned retry sequence, screening,
population sample, holdout, reward sample, broad suite or browser is run.

All three initially fail for the diagnosed causes: a changed target leaves the
owned point unspent, a journal-edited defeat breaks settlement validation, and
the first publication is an admission instead of the policy. After repair,
**all three pass**. The GREEN policy control additionally edits the published
declaration, skill target and adaptation record array; the actual declared
build spends its owned point and the returned policy/action evidence stays
intact. The outcome control retains a defeat despite a consumer writing victory.
The initial-publication failure control proves exact native-state and clock
preservation before any admission.

Two test launches take 23.815 seconds total. Their constructed native work is
seven admissions (RED four, GREEN three); the failed initial journal in RED is
after admission, whereas GREEN fails before it. This is diagnostic work only,
within the prospective 3-launch/9-admission/120-second cap. The unused correction
allowance is closed. Strict scoped TypeScript covers the two changed TS roots
plus Vite declarations, importing 957 files with zero diagnostics. Explicit
two-file ESLint with `--no-ignore` and zero warnings passes; static process wall
time totals 19.042 seconds. No production/source-data/save/tuning edit occurs.

## Review, custody and cleanup

Security check: pass. Plan and source review are root self-review, not final
independent acceptance. The previous goal turn was status-only/no progress;
this turn implements and verifies a missing measurement boundary.

Root retains this exact packet through full-v1 acceptance and removes it after
all consumers finish:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-retry-policy-5o79t7x3`.
It contains the prospective plan, six preimages, causal RED/GREEN JSON and logs,
test/static drivers and process receipts, scoped type/lint results, final source
hashes/diff, separate retained-output readback, inventory and cleanup receipt.
No server, browser, build output or disposable task cache was created. Task
process handles are terminal and exact child PID absence is checked at closeout;
shared caches and inherited worktree changes are preserved. No disposable paths
or cleanup failures remain; the worktree remains in use for the full objective.

## Next required work

Choose the actual population and build-specific legal adaptation policy before
evaluation. This snapshot boundary does not choose those policies or establish
first-attempt/within-three success rates, economy or active-hour pacing. Native
retry attempts still lack the checkpoint adapter's complete plan capture; do
not infer absent/unplayed roles from their wave counts. Historical 14/14 intended
Normal completions, 210 source contexts and formal balance 0/210 remain unchanged.
Difficulty/endgame and integrated app acceptance remain open. No exhausted
allowance is renewed; browser works, CI is excluded and owner playtest follows
implementation, with no pending user decision.
