# Recruitment acquisition diagnostic — 2026-11-02

Status: bounded native diagnostic complete; representative acquisition/funding
and full-v1 balance remain unaccepted. No economy tuning is made from this study.
[Recruitment implementation](../plans/evidence/2026-11-02-recruitment-stars.md)
now supplies live dual pity, duplicates, stars and signature effects.

## Method

128 independent tuning-label seeds each consume exactly12000 native draws:
1,536,000 total, in18.443 seconds. Every stream begins with empty ownership,
zero pity/history/shards and uses `planRecruitment` for ten-pulls. After each
paid batch, `planStarUpgrade` explicitly spends affordable shards up to five
stars. Each batch costs the authored90 wishes; acquiring a result inside a
batch still costs the whole batch. No simulated wallet is credited or live
store mutated. Fixed horizons avoid stopping when a desired identity appears.

The registered policy, pilot rejection threshold and120-second wall limit are
frozen before execution. No final holdout seed is consumed. All128 streams
complete the fixed horizon. Per-identity first-copy, first-star and fifth-star
milestones retain right-censoring; a missing milestone is not silently discarded.
Identities within a stream are correlated; each identity has128 independent
stream observations, not thousands of independent pooled observations.

A separate Python readback checks registered driver/policy hashes, every
current source-manifest entry, unique declared seeds, exact payment budgets,
all pity/upgrade milestones and every final outcome count. Reconstructing
copies from owned identities plus leftover shards plus100×spent stars matches
all1,536,000 native identity outcomes. The canonical earned save stays exact.
Authority37 source/data remain unchanged; no combat or reward grants are run.

## Results

The following are empirical wishstone quantiles across128 streams, starting
from no owned mercs and using only this banner:

| Milestone | p10 wishes | p50 wishes | p90 wishes | p50 hours at fixed80/hour |
| --- | ---: | ---: | ---: | ---: |
| First SSR | 90 | 450 | 450 | 5.625 |
| First upgrade of any merc | 4680 | 5220 | 5850 | 65.250 |
| All25 identities collected | 1890 | 3150 | 5850 | 39.375 |

The sample first-SSR median is noisy: the exact population median is35 draws,
or360 wishes under bulk payment. Exact mean bulk cost is312.827895 wishes;
the50th-draw floor caps first-SSR bulk cost at450. At a fixed80/hour reference,
the hard cap is5.625 hours. The sample alone is not used to redefine the locked
rates or guarantees.

Native long-run sample counts are SSR48,269, SR248,874 and R1,238,857. Their
rates are3.1425%,16.2027%,80.6548%, consistent descriptively with D10's exact
renewal expectations. Per-identity distributions and fifth-star censoring are
in the readback; collection and first-star milestones finish in all128 streams.

At the fixed80/hour reference, only1/128 streams affords any star by50hours;
none does by30hours. Median first star is580draws/5220wishes/65.25reference
hours. This is a material planning constraint: campaign viability must not
assume stars that have not actually been funded and earned. It is not evidence
that the locked optional star system must be retuned or that a campaign is
required to finish collection or max stars.

## Conditional income variability

Pair each recruitment seed with its same-index, independently seeded retained
native Hell income cohort. The cohort uses one earned70 Foothills cadence/spawn
trace and includes its historical defeat denominator. All relevant loot engine,
loot data, RNG and loader inputs are byte-identical to that study's authority31;
recruitment changes do not warrant repeating its457,728 reward rolls.

This produces conditional first-SSR combat-hour p10/p50/p90 of
1.302/4.520/7.863;93/128 are within six conditional hours. First-star
p10/p50/p90 is44.953/68.140/111.012, and25/128 are within50conditional hours.
This comparison exposes variance hidden by substituting the mean faucet.
It extrapolates each finite cohort rate and is not a new longitudinal income
simulation, observed player playtime or representative build acceptance.

The reference excludes actual early-act faucets, finite quest/first-clear
awards, deterministic hiring, other sinks, menu time and changing build power.
The paired sample remains conditional on one build/route. No30–50active-hour
campaign claim, six-hour population guarantee or balance-cell acceptance follows.

The [chronological funding follow-up](2026-11-02-recruitment-funding.md) now
includes the actual early-act finite rewards, both free hires and free reset
receipts on one retained pilot. Its conditional result does not accept
representative funding or active-hour pacing.

## Evidence and next work

Ongoing packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p15-recruitment-acquisition-v1.policy.json`, registration, native TS driver,
runner, raw JSON/log, independent Python reader and `-readback.json`.
Raw results preserve all128 streams, milestones, budget snapshots and final
shard/star ownership. The native runner closes Vite/esbuild and removes only
its exact task cache. Root retains required evidence through umbrella review.

Next chronological funding must include actual early/late earned sources and
all competing sinks for each build. Representative Hell variance and startup/
inventory/storage performance remain, along with14-build fairness/holdouts,
defeat/retry/manual-idle,30–50active-hour pacing, G0–G7, two-hour soak,
independent review and later ownerplaytest. Accepted balance cells remain0;
no pending question or external blocker; browser works and CI stays excluded.
