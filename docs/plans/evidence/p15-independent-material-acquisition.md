# P15 — Independent rune/gem acquisition measurement

2026-11-04. This numeric acquisition component is locally complete. Full P15,
P12b and private v1 remain incomplete. Requirement: work-plan P15's acquisition
and faucet/sink budgets; D10's native material chances, identity caps and RNG
contract. The preceding goal turn was a status report with no implementation
progress.

## Implementation and scope

`tests/sim/production/material-acquisition.ts` measures the existing
`rollCurrencyDrops` function directly. It supplies every native draw, searches
the canonical ordered identity intervals over the unsigned32-bit output grid,
and records integer support counts, boundary numerators, probability mass and
modeled mean/median/95th-percentile kills. No copied drop/weight/cap logic or
replacement sampler is introduced. There are105 act/difficulty/tier contexts,
each with all33 runes and35 gems:7,140 entries, including3,217 zero entries.
Scrap is outside this drop channel. The report preserves source provenance.

This is the baseline independent channel before special reward overrides.
Configured chapter-boss and goblin bundles replace it. Treasure-class picks,
first-kill bonuses, quest rewards, crafting, endgame rewards and Find Item are
excluded. A zero is not a claim that an identity has no acquisition route.

The probabilities are exact interval mass under a **uniform32-bit output-grid
model**. This does not establish uniformity or independence of Mulberry32
outputs across seeds. Waiting estimates additionally assume independent,
identically distributed kills. They are not observed campaign times, recipe
completion times or total acquisition rates. No kills/hour or active hours are
inferred, and no game data, combat, RNG, reward or save behavior is changed.

## Numeric results

Rounded values below describe only that modeled channel; JSON retains exact
integer counts and unrounded values.

| Context | Material | Chance per kill | Mean kills | Median kills | 95th-percentile kills |
| --- | --- | ---: | ---: | ---: | ---: |
| Act I Normal trash | Tir |0.08972% |1,114.58 |773 |3,338 |
| Act I Normal trash | Ral |0.04486% |2,229.17 |1,545 |6,677 |
| Act I Normal trash | Chipped Ruby |0.15000% |666.67 |462 |1,996 |
| Act V Hell elite | Zod |0.00006938% |1,441,264.19 |999,008 |4,317,641 |

These establish repeatable inputs for later all-source and recipe-demand
budgets. They do not establish affordability or justify tuning on their own.
The existing material-source passthrough report remains the authority for
observed source/raw/inventory reconciliation; this does not replace it or the
earned crafting evidence. The obsolete hand-written loot simulator is unused.

## Verification

- Three pre-implementation cases fail because the measurement module does not
  exist. All three pass after implementation, with about1.9seconds of selected
  test execution. No campaign or combat simulation runs.
- All105 contexts have complete68-identity partitions. Each channel's integer
  material counts plus no-drop support equal2^32. Every one of3,923 positive
  material intervals is checked against native rewards at its first and last
  numerators and available neighbouring numerators; strict no-drop endpoints
  are checked too. Both guaranteed baseline channels and capped zeroes appear.
- Separately calculated Act I rune endpoints and folded gem-quality endpoints
  match. High-rune waiting quantiles satisfy their minimal-quantile conditions.
- A separate Python readback checks every partition and every positive row's
  waiting mean/quantiles, all2,216 recorded source-file hashes, and the five
  unchanged baseline gameplay/provenance authority files. This is root
  self-review, not independent QA or formal balance acceptance.
- Scoped strict TypeScript and explicit two-file lint pass. The initial
  deprecated cache flag refused before tests ran; it was replaced with an
  external Vite cache configuration and disabled result cache. Initial lint
  found only the repository's existing tests-path ignore rule; explicit
  per-file inclusion then checked both files without warnings. Original
  failures remain in the evidence packet. No broad suite/build or installs.

To generate another new external report, use the selected diagnostic only:

```sh
MATERIAL_ACQUISITION_REPORT_PATH=/absolute/existing-directory/new-report.json \
  node node_modules/vitest/vitest.mjs run \
  --workspace vitest.diagnostics.workspace.ts --project sim-diagnostics \
  tests/sim/production/material-acquisition.test.ts --no-cache
```

The output parent must exist and resolve outside the repository. Existing
destinations are refused by the established exclusive-output helper. This
command does not admit protected fixtures or reopen older diagnostics.

## Evidence and remaining work

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-material-acquisition-bxx01sf0`.
Report: `acquisition-report.json`, SHA256
`b80f15695de31461d42a74adefc4526084708f89704b6824381306b672c85099`.
Source tree:
`6097c81ecb0e6bdbe93f3863d53fd7984da97317cc51fe2cb9954253da129b87`.
The packet retains the prospective plan/security check, before snapshots,
original failures, selected results, executed configurations, source manifest,
numeric report, readback, task patch and cleanup receipt. Root owns retention
through umbrella review and eventual exact cleanup/worktree release.

All-source material budgets, recipe demand and sinks, earned affordability,
30–50active-hour pacing and independent acceptance remain open. No campaign or
formal balance credit:14/14 intended Act I,8/14 five-act Normal,0/210 formal
balance signoffs. Six routes, higher difficulties/endgame and broader app
acceptance remain open. Full private v1 remains active. No agent, installation,
CI action, commit, push or publication; no pending user answer/browser blocker.

Cleanup receipt confirms all six recorded check PIDs and three exact disposable
paths absent. Executed configuration text is retained as evidence; no task-owned
disposable or cleanup failure remains.
