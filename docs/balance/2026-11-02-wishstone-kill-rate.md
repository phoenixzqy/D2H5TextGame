# Wishstone kill income: source audit and provisional rate

Kill rewards now apply one authored 2% coin to the combined direct and
secondary wishstone bundle. Equipment, shards, runes and gems use the existing
native RNG stream; quest rewards bypass the coin. This is a P15 tuning
candidate, not final recruitment-economy acceptance.

## Source diagnosis

After the mini-boss correction, the retained Normal Javelin chain would grant
50,900 wishes over 20.333 combat hours. Read-only production reward generation
reconciles all 18 journals and 7,020 settled waves against recorded ordinals,
spawns, tables, MF/GF and reward totals:

| Source | Wishes before the new coin |
| --- | ---: |
| Direct treasure-class selections | 16,741 |
| Independent secondary rewards | 34,159 |
| Total | 50,900 |

The secondary total includes 32,721 guaranteed awards and 1,438 successful
champion coins. Both sources are authored and intentional. Changing only
direct TC weights would leave guaranteed secondary income above the desired
recruitment cadence.

## Frozen candidate and result

[Decision](../plans/decisions/P15-wishstone-kill-rate-v1.md) freezes 1.5%, 2%
and 2.5% candidates, selecting 2% before the reward-only candidate run. The
parameter is required, closed, schema-validated JSON. Each native enemy gets a
wishstone fork from its existing loot seed and unique ID. Find Item already
uses a separate loot seed; legacy idle uses its per-tick seed. Standalone
kill/batch APIs accept a separate continuous wishstone RNG. The batch API
advances that stream across calls rather than recycling index-based labels.

| Chance | Expected wishes on the fixed Normal trace | Fixed-seed result |
| --- | ---: | ---: |
| 1.5% | 763.5 | 1,009 |
| **2%** | **1,018.0** | **1,297** |
| 2.5% | 1,272.5 | 1,514 |

The selected trace yields 63.787 wishes per combat hour, compared with an
expectation of 50.066. This single adaptive campaign is not a population or
holdout estimate. Its first 10 wishes arrive at 46.013 combat minutes; the
first 90 arrive at 291.259 combat minutes, in Act III. The trace never spends
wishstones, so these are affordability thresholds, not observed recruitment.
No human decision-time calibration or earned replacement save is claimed.

At the same recorded Act V cadence, applying existing Hell boss amount
multipliers gives an expected 75.157 wishes/hour at 2%, about 71.85 combat
minutes per 90-cost bulk pull. Actual L70 Hell enemies, gear, clear times and
failures have not been evaluated by this projection.

## Compatibility and focused verification

The reward-only comparison covers 90,262 slain non-summon enemies. All 74,951
wave-awarded item contents match the original journals exactly after removing
only newly generated instance IDs. Every concrete material ledger and each
wave's shard/rune/gem total also match. The acquisition report's additional 13
gear awards came from non-wave sources and were not regenerated here.
Existing wallets and saves remain unchanged; no save migration is needed.

The initial regression run fails three new behavior assertions before the
implementation. Eight affected suites subsequently pass 81 checks. A final
batch-stream correction and regression pass 38 focused checks, giving 82
distinct current passing checks across those suites. Scoped strict types and
explicit lint pass. The first scoped type config omitted the existing Vite
ambient declaration; correcting that config resolves its ImportMeta errors.

Eight older Act I loot-fixture failures also reproduce with the new gate
bypassed. BUG577 updates exact counts/seeded item expectations for previously
authored bow/javelin sources, retaining rarity, identity, stat and export
assertions. No snapshots were regenerated and no production treasure tables
changed in this increment.

## Evidence and remaining work

The retained external packet is
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Principal receipts are `p15-wishstone-source-split-v2.json`,
`p15-wishstone-kill-rate-v1.json`, `bug576-final-check-readback-v1.json`,
`p15-campaign-harness-source-audit-v22.json` and
`bug576-artifacts-v1.json`. The authority bridges the reward readback's native
kill code to the final batch-only change without repeating reward generation.
Required drivers, receipts and original journals remain for root/full-v1 review;
disposable configs/caches are removed after their consumers finish.

No combat, completed chapter, build route or browser campaign was replayed.
Accepted balance cells remain zero. Remaining work includes the actual L70
Hell faucet and early recruitment budget, class/build acquisition fairness,
inventory pressure, calibrated 30–50 active-hour pacing, retry/manual-idle
populations, integrated gates, soak, review and the later owner playtest.
