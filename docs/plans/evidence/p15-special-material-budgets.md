# P15/P12b — Special material sources and recipe demand

2026-11-04. This numeric component is locally complete. Full P15, P12b and
private v1 remain incomplete. The previous goal turn was a status report with
no implementation progress. This resumes the existing owned human2 worktree
and the unfinished diagnostic; no production gameplay, data, RNG or save code
changes.

## Scope and results

`tests/sim/production/material-source-budgets.ts` measures native chapter-boss
and treasure-goblin material rewards across all five acts and three
difficulties: 30 contexts, 2,040 material entries and 746 positive identity
intervals. Binary searches query `rollCurrencyDrops`, retaining exact integer
support on the unsigned 32-bit output grid. Quantity distributions follow the
native inclusive `nextInt` grid. Means and at-least-one chances explicitly
model independent quantity and identity draws within each settlement.

| Authorized settlement | Rune quantity | Gem quantity |
| --- | ---: | ---: |
| Act I chapter boss | 1 | 2 |
| Act II chapter boss | 1–2 | 3 |
| Act III chapter boss | 2 | 4 |
| Act IV chapter boss | 2–3 | 5 |
| Act V chapter boss | 3–5 | 8 |
| Treasure goblin | 1–4 | 5–10 |

Identity caps and weights remain act/difficulty/tier dependent. These bundles
**replace** the ordinary independent rune/gem channel measured in
[the baseline component](p15-independent-material-acquisition.md); adding both
would double-count income. Goblin rewards are conditional on encountering and
settling a goblin, without an occurrence or ordinary-kill denominator.

Four once-only sources have 35 positive intervals: Countess's nine rune
identities, Hellforge's eight rune identities, Jamella's seven perfect gems,
and the Act V Hell first-kill bonus's eleven rune identities. Each grants one
material per authorized claim or first-kill settlement. The native cache
selector uses `<=`, while material sampling uses `<`; native probing and
separate arithmetic retain the endpoint difference. Quest rows do not infer
difficulty eligibility. Accompanying rewards, including Hellforge's three
gem shards, are outside this material-only component.

The demand catalog preserves all 98 validated recipes, including currency
costs, outputs and eligible target predicates; salvage and insertion rules
are retained separately. All 35 runewords preserve ordered rune sequences,
base/socket/level restrictions and repeated rune totals: Infinity needs two
Ber, Last Wish three Jah, and Phoenix two Vex. Caster Amulet retains one Ral,
one Perfect Amethyst, 20 Scrap and 1,000 Rune Shards. Socket clearing destroys
inserted contents, with no fixed value or refund inferred for them.

No expected recipe completion time, total acquisition rate, affordability,
campaign hours or balance signoff follows from these conditional budgets.
Equipment acquisition and its salvage income, other treasure-class picks,
other quest rewards/currencies, endgame and Find Item remain excluded.
Uniform-grid mass does not prove seeded PRNG uniformity or independence.

## Verification

- Four legitimate pre-implementation failures are retained. The catalog case
  passed first; the remaining three cases pass in about 2.4 seconds of test
  execution. The already-passing catalog case was not repeated.
- All positive bundle/cache/first-kill identity intervals are checked at
  first/last and available neighbour numerators through native rewards.
  Every quantity PMF partitions 2^32 outcomes; native lower/upper endpoints
  and same-seed `createRng().nextInt` comparisons pass.
- Full `rollKillRewards` checks both variate extremes for all 30 contexts,
  including the goblin elite-to-boss reward override and suppression of TC
  material picks. Full native first-kill rewards verify all Hell-rune
  boundaries and the first-kill flag across all three difficulties.
- Scoped strict TypeScript and explicit two-file lint pass without warnings.
  No baseline diagnostic, completed act, broad suite, build or browser check
  is repeated; this opt-in Node diagnostic changes no browser behavior.
- A separate Python readback checks every partition, quantity grid, modeled
  mean/chance, all once-only identity endpoints, raw authored recipe/word
  costs, 2,218 source-file hashes, both source fingerprints and nine unchanged
  gameplay/data authority hashes. This is root self-review, not independent
  QA or formal acceptance. Native crafting actions were not replayed; this
  change catalogs unchanged cost definitions rather than changing execution.

To generate a new report, select only the new diagnostic:

```sh
MATERIAL_SOURCE_BUDGET_REPORT_PATH=/absolute/existing-directory/new-report.json \
  node node_modules/vitest/vitest.mjs run \
  --workspace vitest.diagnostics.workspace.ts --project sim-diagnostics \
  tests/sim/production/material-source-budgets.test.ts --no-cache
```

The established exclusive-output helper requires a new leaf outside the repo.

## Evidence and remaining work

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-special-material-budgets-2v7rek4h`.
Report `material-source-budgets.json`, SHA256
`45c5aded04647efec34a52e86c19d2f0679153f0107797e9cb84c605105a9e80`.
Source tree:
`299386e2f5bdb32de8963111c59952f7f2a4f2d3ccabaa2c03406dd8c6eb6e01`.
The packet retains the plan, ownership/before snapshots, RED/GREEN/check logs,
executed configuration text, numeric report, readback script/results, patch and
cleanup receipt. Root retains it and human2 through unfinished umbrella review,
then owns exact evidence cleanup and worktree release.

No campaign or formal balance credit: 14/14 intended Act I, 8/14 five-act Normal,
0/210 formal balance signoffs. Six routes, remaining source channels, earned
affordability, pacing, higher difficulties/endgame and broader app/independent
acceptance remain open. No new agents, installations, CI, commits, pushes or
publication. No pending question or browser blocker. Extended human playtesting
follows implementation.

Cleanup verifies five recorded check PIDs and three exact disposable paths
absent. Required evidence remains at the packet path above; no task-owned
disposable or cleanup failure remains.
