# Material chance authoring

Date: 2026-10-28 UTC. Base: `07933d8f9fdcc1fa7ea9c392fc293d76f81495e3`.
Implementation: `f6eb6cebb13d9d8dfab5ebb9cba0a0ff05ad854e`.
Scope: independent rune/gem chance authoring (BUG-361). The playable target
requires [JSON-authored tuning](../playable-target.md); this is a prerequisite
for coherent material economy tuning, without acquisition or pacing acceptance.

## Change and preserved behavior

The validated packaged material economy now requires a closed seven-tier
`independentDropChances` record. Each tier requires exactly `rune` and `gem`,
finite numbers in the inclusive range [0,1]. Descriptions document the gates;
the schema precedes data. The loader exposes the typed record and
`rollCurrencyDrops` consumes it directly. Both old hardcoded maps are removed.
No fallback map, runtime override API or second probability source is introduced.

| Monster tier | Rune | Gem |
| --- | ---: | ---: |
| trash | 0.006 | 0.015 |
| elite | 0.05 | 0.08 |
| rare-minion | 0.05 | 0.08 |
| champion | 0.05 | 0.08 |
| rare-elite | 0.08 | 0.12 |
| boss | 1 | 1 |
| chapter-boss | 1 | 1 |

These are the exact original values. Champion wishstones still draw first;
rune and gem gates each consume one draw before shard variance. Success stays
strict `u < p`; conditional identities use `u / p` without another draw.
Zero probabilities consume their gate draw and skip sampling. One probabilities
sample the full eligible pool. All other reward quantities, wishstone/shard
formulas, multipliers, identity pools/caps/weights/profiles and treasure-class
sources retain their existing code/data. No save shape, save version24, migration,
locale, dependency, runner setting or timeout changes.

Economy version1 is retained: this is one atomic first-party packaged JSON/schema
contract, not an external or persisted economy input. There is no old-data fallback
or save migration requirement. The existing actual Ajv validator is exercised;
this repository has no `validate:data` script, so no such command is claimed.

## Regression and parity

The new isolated `tests/sim/production/material-chances.test.ts` substitutes only
loader-supplied probability data. It preserves real validation, sampling, RNG and
reward calculation. It belongs to sim-contracts (`isolate:true`), avoiding module
mock contamination of engine (`isolate:false`). Every tier covers zero/one gates,
strict changed thresholds, successful normalized residuals, unchanged draw count
and following RNG. Champion cases assert wishstone ordering. Real validation
rejects missing/unknown tiers and fields, malformed objects, nonnumeric/nonfinite
and out-of-range values; all inclusive zero/one combinations pass.

Before the implementation, `focused-red` returns native1: 26 failed,49 passed.
The original code ignores alternate authored probabilities, omits the canonical
field and accepts its absence. After the change, unchanged `focused-green` returns
native0:75 passed across the new41 tests and existing34 material tests.

A separate reward-only probe uses the real loader, sampler and RNG on the original
code, then the final code with identical probe source. It covers16 seeds×5 acts×3
difficulties×7 tiers =1680 contexts, retaining complete seed-labeled outputs and
the next RNG draw. Original/final bytes are equal, SHA256
`dc155e16e36ea3eb8647c23ff8b70475ecbf70520d90b834e73fbc57e8a053d5`.
Both native runs pass. The permanent test binds the same original digest.
The exact disposable probe is removed before broad validation; its source,
original/final outputs and native reports remain external evidence.

## Final checks

All final checks return native0, sequentially, with unchanged source:

| Check | Result | Wall time |
| --- | --- | ---: |
| Focused (session91343) | 75 passed /3 files | 1.881s |
| Engine (session24920) | 10,736 passed /401 files | 187.069s |
| Unfiltered full (session97382) | 21,293 passed,2 skipped /995 files | 946.940s |
| Typecheck (session96910) | no errors | 108.301s |
| Lint (session68739) | zero warnings; engine purity passes | 199.309s |

All five checks bind the same1,874 executable/data/config/test inputs at
`9b8296d522e384dffd55e4b3e228fa59f1e5a6270e408c9d84ca3373b513f16b`.
Every before/after source difference and historical packet difference is empty.
The two pre-existing skipped cases retain their exact full names (each starts
with one suite-space in the raw JSON):

- `fresh-campaign-continuation.test.ts`: ` runs one declared authentic saved-domain Rocky Waste continuation and restores its caller`
- `fresh-campaign-economy.test.ts`: ` runs one bounded authenticated earned farming policy and restores its caller`

No `.once.ts` entry is discovered. The original historical packet's69 file hashes
remain unchanged. The retained launcher record still spends the sole invocation;
the unreached worker marker remains absent. Fixture contents are excluded from
input maps. These checks do not read or replay the protected retained save.

Independent implementation review approves/security pass/findings[]/questions[],
receipt SHA256
`99e4a1d98c0b035c687ac721be70a4f73a7bf82414769dbef5eda6d4513b8bd6`.
It independently checks all7 original probability pairs, unchanged other JSON,
real schema/runtime tests, genuine RED/GREEN and complete baseline/final parity.
BUG-361 is fixed by the implementation commit above; other bugs remain open.


## Limits and retention

This establishes unchanged bounded reward behavior and canonical authored chances.
It does not establish earned source mix, high-rune affordability,30–50 active-hour
pacing,14 builds×five acts, fresh-campaign progression, browser/save/PWA acceptance,
actual Node20 CI or human/soak/full-v1 acceptance. The212 bounded/one unverified
skill inventory and other open bugs remain unchanged. No native launcher,
preflight/retry/replacement experiment, closed-policy execution or browser retry
runs. The historical spent invocation and all frozen evidence remain unchanged.
H3 stays terminal failed-no-app. No publication, merge or deployment occurs.

Root retains exact raw baseline/RED/GREEN/final logs/results/maps, original/final
outputs and source, plan/reviews and cleanup receipts under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-material-chances-9wx3ydph`
through unfinished goal/review consumers; root owns eventual verified cleanup.
All14 logged fixture paths, the disposable probe and applied external draft are
verified absent; recorded owned processes have exited. Cleanup failures are empty.
Shared caches and the claimed worktree are retained.
The umbrella goal and claimed worktree remain active.
