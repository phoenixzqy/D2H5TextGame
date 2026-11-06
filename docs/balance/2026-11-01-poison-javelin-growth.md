BALANCE-CHECK: CONCERNS

# Poison Javelin earned-route growth correction — 2026-11-01

BUG-543 changes only Poison Javelin damage growth3→15 per rank, with its exact
schema and existing rank20 native/UI expectations updated. Rank1 stays20–35;
rank10 becomes155–170 and rank20 becomes305–320. Mana, cooldown, hit/status rules,
shape and target cap stay unchanged. Save format remains32; no field migration.

The retained level12 earned source, native skill-reset allocation, owned spear,
seven rune insertions, priority and the first three enemy teams are identical.
All forecast income is discarded. The baseline loses W4; the corrected candidate
wins all six, with Andariel19.860s. Native continuation then matches complete
initial teams/events/metrics for all six waves and independently claims Sisters.

| Scenario | Before | After | Time delta |
| --- | ---: | ---: | ---: |
| Catacombs W1 | 14.564s | 6.352s | -56.4% |
| Catacombs W2 | 17.212s | 3.972s | -76.9% |
| Catacombs W3 | 28.138s | 7.205s | -74.4% |
| Whole-area result | Defeat W4 | Victory6/6 | — |

Scoped checks: native20, lifecycle18, bilingual UI40 passed before the schema-only
follow-up; actual Ajv schema88 then passed. This is166 distinct affected checks,
not a broad rerun. The earlier red and schema-mismatch failures remain retained.
All2090 production inputs were rehashed; exactly four source/test paths changed.

This supports the early-route correction. It does not supply cross-class DPS,
p50/p95 distributions, death-rate/drop-rate grids, all tiers/difficulties,
≥1000 seeds per scenario, disjoint holdouts or the full build viability floor.
Those remain required before full balance/release approval. Current Javelin
Arcane Sanctuary still fails mixed caster/poison-resistant physical packs;
further blanket poison tuning is not established by this evidence.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`. Before/after forecasts above, native
`p15-javelin-act1-complete-native-v1.json`, independent Act I readback,
`p15-poison-javelin-growth-source-binding-v2.json` and source-transition audit
retain exact inputs and method hashes. Root retains these through umbrella
acceptance and owns final evidence cleanup.
