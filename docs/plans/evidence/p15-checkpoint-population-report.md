# P15 — Partial checkpoint population reporting

2026-11-04. The reusable [population reporter](../../../tests/sim/production/checkpoint-population.ts)
now consumes settled production checkpoint attempts without running gameplay.
It supports the measurement protocol in [playable-target](../playable-target.md).
Counts remain **14/14 intended Normal, 208/210 repeat-source contexts available,
formal balance 0/210**. Full private v1 remains incomplete.

## Behavior

- One exact source hash/provenance, build/level, area/act/difficulty/mode,
  ordinal, pity counter, clock and sample stage per report. Different fixture
  labels or seeds can share that cell; mixed contexts are rejected.
- Expected seeds are declared explicitly and checked against the same partition
  table used by fixture admission. Duplicate and undeclared observations fail.
  Partial populations retain missing seeds; an empty population has null rates
  and percentiles. Population completeness means the declared seed set was
  observed, not that any acceptance threshold passed.
- Every started, terminal area attempt remains in the area denominator. Victories,
  defeats, draws and hero deaths remain distinct. Win/death/reach rates have
  unadjusted 95% Wilson intervals over seed trials. Native observations do not
  identify timeout reasons, so timeout count remains unavailable.
- Nearest-rank p10/p50/p90/p95 area durations separate all attempts, victories
  and failures. Role waves use native presentation, including its act-boss flag.
  Unreached roles remain visible. Wave counts and victory-only wave timings are
  descriptive correlated observations, not independent trials.
- Per-seed role observations, entry/final HP and mana, minimum mana, direct
  damage by source and periodic damage by target remain available. Direct
  damage includes enemy sources. Full event recordings are not duplicated.
- Actual prefix XP, merc XP, material/currency changes and added item rarities
  survive area losses. XP and rarity rates use logical combat hours only; they
  do not measure upgrades, eligible boss equipment or active-player pacing.
- Inconsistent victory/duration/unreached metadata, missing terminal settlement,
  noncontiguous waves and continued play after a nonwin are rejected.

## Applied to retained observations

One report execution reads exactly the sixteen pinned attempt files from
[earned repeat-source diagnostics](p15-earned-repeat-source-pairing.md).
Each is its own benchmark cell with one observed seed; no cross-cell rate is
computed. Accounting reconciles **11 area victories, five area failures,
81 waves (76 victories/five defeats), 1,047,443.3989533798 logical ms and
1,071,337 XP**. Four failed boss contexts never reach the boss; the failed
trash context reaches trash. All five failures retain their native prefix yields.

For one observed win, the win interval is approximately [0.20655, 1]; for one
nonwin it is [0, 0.79345]. These wide intervals establish no reliability claim.
The report takes 1.299s and creates zero combat attempts/reward rolls/holdout
reads. A separate Python retained-output reader reconciles all sixteen contexts,
intervals, durations, resources, damage and reward summaries in 0.474s. Root's
separate reader is not independent final QA.

## Verification and retained evidence

Fifteen focused reporter cases and 23 existing fixture cases pass. Scoped strict
TypeScript and lint pass. The expected initial missing-module test failure is
retained. The first external typecheck config could not resolve `vite/client`;
its corrected config uses the repository's existing `src/vite-env.d.ts` and
passes. No game code change or broad suite/build/browser/campaign run occurs.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-checkpoint-population-aarumrvq`.
It retains prospective scope/budgets, sources, tests, report, separate reader,
source manifests and cleanup records. Report SHA256:
`2c6aca4c935569329294cfb6b1ed050f3d418241a3a184e250c83225399923f3`.
Current source-tree hash:
`441be64f42573072076f7acb4ba5929c22609d80f0da407a893e67835aadb8e1`.
All 2,245 original inputs other than `checkpoint-fixture.ts` match the native
packet; that module exports its existing seed partition table for reuse. The
two reporter files are added. All 2,248 current source inputs are stable across
reporting and rechecked by the separate reader; game runtime bytes are unchanged.

Both exact disposable bundles were removed after the process exited. The scoped
config is archived as text and removed; no server or native cache was started.
Cleanup passes with zero remaining disposables/failures and about 0.99 MB
retained under the 8 MiB cap. Root retains this exact packet through umbrella
acceptance, then removes it after consumers finish. The claimed human2 worktree
stays in use for the unfinished umbrella.

Next: resolve the two Double Throw repeat-source gaps and freeze actual build
power/acquisition/adaptation, ordinal/carry and manual/idle pity populations
before screening. Economy/acquisition/active-hour pacing, higher difficulty and
endgame fairness, integrated app/PWA/device/a11y/performance checks, soak and
independent acceptance remain open. Browser works; CI is excluded; no pending
owner answer or external hold exists.
