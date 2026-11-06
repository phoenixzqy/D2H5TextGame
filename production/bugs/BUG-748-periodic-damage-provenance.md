# BUG-748 — Preserve periodic damage origins without inventing HP shares

- Severity: Medium; missing P15 damage-report provenance, gameplay remains available.
- Status: Fixed locally; affected checks and source self-review pass. Full-v1
  acceptance remains open.
- Owner: root acting as engine-dev/qa-engineer; no delegation.
- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, current dirty source bytes
  pinned in the implementation packet's `plan.json`.
- Environment: pure TypeScript engine on WSL/Node; browser/viewport/locale do
  not apply. This is diagnostic metadata, not a player-visible UI change.
- Seed: deterministic regression7; retained Druid results are not replayed.

## Reproduction

1. Inspect retained Druid Act III `analysis.json` and journal at
   `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-druid-route-first-act3-1r7h9geh`.
2. Observe hero periodic HP loss25/4/71 in the three defeats. `dot` events carry
   target/amount/absorption but no source/status/damage type.
3. Use a seed7 constructed fixture: poison0.5DPS expires at1000ms, ignite0.5DPS
   runs2000–3000ms, both units held. The single dot at3000ms combines both
   statuses, including the expired source. Attributing it to current ignite
   invents an exact fire HP share.

Expected: future P15 reports trace integrated periodic damage by source/status/
type while preserving exact pooled integer damage, timing, absorption and RNG.
Historical absence remains unknown; no retroactive evidence claims.

Actual: source/type evidence is lost at the engine event boundary. Downstream
reports can only show unattributed periodic HP damage.

Root cause: `settlePeriodic` emits a pooled amount from the compensated global
integral without preserving its contributing status intervals.

## Contract and acceptance

Add optional `dot.provenance` for compatibility with historical events. Every
new periodic event records `fromMs`, `toMs`, raw whole `rawAmount`, pooled
`carryInHpMs`/`carryOutHpMs`, and contributions (`source`, `statusId`, optional
`damageType`, integrated `hpMs`). The interval spans since the previous dot or
periodic reset, including intervals without an integer event, expired statuses
and quiet gaps. Contributions are rate-times-overlap integrals, not per-source
integer HP or post-shield HP; rounding/carry/absorption cannot be apportioned as
an exact causal observation. Unknown legacy status types remain unspecified.

Collect only committed intervals, never speculative lethal predictions. No
change to damage arithmetic, timing, RNG, blood-golem recovery, rewards, saves
or event order. Tests cover mixed sources/types, missing type, fractional carry
through expiry/gaps and successive emissions, future starts, exact lethal
timing, absorbed damage, immutable earlier events and repeat determinism.
P15 observation/report exposes integrals separately from actual periodic HP and
counts missing legacy provenance. Small constructed cases only; no campaign
replay, population samples, browser run or exhausted-budget renewal.

Plan/security self-review: ready/pass; local authorized additive diagnostics,
no network/dependency/credential/permission/CI change. Required evidence is root
owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-periodic-provenance-yavz9r44`,
retained through full-v1 acceptance, then removed by root after consumers finish.

## Resolution — 2026-11-05

The engine captures committed status integrals and preserves expired fractional
origins across quiet gaps. P15 wave/population reports aggregate the integrals
separately from actual damage and count missing historical coverage. Terminal
fractions that never emit a dot are outside these emitted-interval totals.

All 92 distinct affected cases pass: six provenance, 40 periodic timing,
23 Holy Shield, seven wave observation and 16 population cases. Final focused
engine check, scoped strict TypeScript (919 files, zero diagnostics) and explicit
six-file lint pass. Self-review found no material issue; this is not independent
release approval. No campaign, population or browser replay; no combat tuning.
See [evidence](../../docs/plans/evidence/p15-periodic-damage-provenance.md).
