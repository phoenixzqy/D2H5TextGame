# P15 — Double Throw Act II checkpoint screening

2026-11-04. The [prospective decision](../decisions/P15-throw-act2-checkpoint-screen-v1.md)
is now executed once: seeds 1–100, manual then idle per seed, using the exact
earned level-32/ordinal-452 source. All 200 trials finish, settling 1,200 waves.
This completes screening for one declared earned-power/ordinal/pity stratum;
formal balance remains **0/210**, intended Normal completions **14/14**, and
supplemental source availability **210/210**. Full private v1 remains incomplete.

## Results and next balance action

| Observation | Manual | Idle |
| --- | ---: | ---: |
| Started / terminal trials | 100 / 100 | 100 / 100 |
| Whole-area victories / defeats / draws | 100 / 0 / 0 | 100 / 0 / 0 |
| Hero deaths / unreached bosses | 0 / 0 | 0 / 0 |
| Win-rate 95% Wilson interval | 0.9630065–1 | 0.9630065–1 |
| Whole-area victorious p50 / p95 | 68.351 / 73.775 s | 69.066 / 75.266 s |
| Boss victorious p10 / p50 / p90 / p95 | 9.760 / 10.980 / 12.200 / 12.303 s | 9.760 / 10.980 / 12.200 / 12.288 s |
| Native prefix-inclusive XP total | 4,244,000 | 4,244,000 |
| Minimum observed mana, p50 | 357 | 357 |

No missing/unfinished trials remain. The rate intervals are descriptive,
unadjusted intervals over independent seed trials within each fixed context;
waves are correlated and the modes are paired by seed, not pooled. Native
observations do not identify timeout reasons, so timeout count is unavailable.
Duriel resolves to level 32; prefix trash is level 27, with elite waves through
level 31. Native idle planning also promotes some level-27 waves. All waves
retain native carry; no boss was reconstructed at full resources.

The 10.980-second boss median is below the desired 20–50 seconds. Both win
intervals sit above the desired chapter-boss upper win boundary of 90%.
[BUG-731](../../../production/bugs/BUG-731-duriel-earned32-screening-challenge.md)
records the balance concern. Level 32 matches the selected initial Act II
completion reference, but this exact 452-admission acquisition path is not a
typical-player power distribution. Next compare other builds' retained earned
Act II power and declare acquisition/adaptation/populations before tuning;
do not buff all boss encounters or replace this source based on one result.

The production run takes 68.975 seconds, 69.262 seconds including the launcher,
for 13,829,213.499498341 logical combat ms across the 200 independent diagnostic
trials. That is about 3.84 aggregate combat hours, not observed player time or
one campaign. Native reward deltas and item rarities reconcile; no trial is a
canonical successor. Exact starting/final save hashes, role/RNG/enemy contexts,
compact wave metrics and rewards remain in the journal. Full event recordings
and final save payloads were deliberately omitted, so the packet does not prove
complete per-trial item custody, boss eligibility or upgrade frequency.

No tuning/holdout population is read. No production code, reusable helper,
gear, allocations, saved resources, mercenary, priority or acquisition allowance
changes. Historical failures and original policy availability 208/210 remain.
This does not accept recommended-power balance, other ordinal/pity states,
within-three adaptation, general acquisition/economy, 30–50 active-hour pacing,
higher difficulty/endgame fairness or integrated app/soak/independent acceptance.

## Separate verification and preserved reader failure

The original frozen Python reader fails on its first trial's exact duration
comparison. [BUG-730](../../../production/bugs/BUG-730-checkpoint-reader-duration-fold.md)
identifies Python 3.12 improved summation versus JavaScript ordered binary64
addition: 18/200 totals differ, at most 1.4552e-11 ms. All native totals exactly
match a separate ordered fold; the runtime and reporter need no change.

The versioned `readback-v2.py` verifies that native ordered sum exactly and
cross-checks `math.fsum` under the original numeric tolerance. Guards run its
actual corrected check on all 200 observations, reproduce all 18 original
failures, and reject 200 one-millisecond corruptions. The complete separate
readback passes in 0.406 seconds, reconciling trial order, callbacks/terminals,
streams, outcomes, resources, damage, yields, intervals, percentiles and all
2,248 current source inputs/eight helper contracts. Original plan, reader,
failure logs and native output remain unchanged. No gameplay is repeated.
Root's separate readback is not independent final QA.

## Evidence and cleanup

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-throw-act2-screen-qms4rpxa`.
Root retains this exact packet through unfinished full-v1 acceptance, then
removes it once all consumers finish.

| Artifact | SHA256 |
| --- | --- |
| `plan.json` | `0a740bd38ffa410e38770c4793d2ab4b2970cb44d48dd7b02fd2efe5c15a4d1b` |
| `native.json` | `b940b779b4ae09e1bf392700f89be8a532656f9b3182ed1d01f2e2b06ea8136c` |
| `native.journal.jsonl` | `be540e12ffb3c21d8330e919d799b0a88a2b557e0b1e0ca6489e85ab7aef2dfd` |
| `readback-v2.py` | `3a77216d7f9389c32c63000fc4d45b831be029c7138530b688c5c4331b0f50ea` |
| `readback.json` | `122177ac3b516e3e05136c2eef6e17a87a77f63c4a987bbc388f3b5c3ab8dfb8` |

Native/wrapper PIDs 10578/10577 are terminal and absent. The native server is
closed and exact task cache `native-cache-r5BcJQ` is removed; separate cleanup
checks confirm zero remaining disposables/failures. Retained evidence is about
8.57 MB, below the 64 MiB cap. No broad test/build, campaign replay, new agent,
CI, commit, push or user hold occurs. Browser works; owner playtest follows
implementation. The preceding goal turn was status-only/no progress; this turn
executes and verifies a new bounded screening study and records its concern.
