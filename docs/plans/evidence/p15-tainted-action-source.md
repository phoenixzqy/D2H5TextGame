# P15 Tainted action-source correction

The generic zero-cost weak-melee entry took every native Tainted action,
preventing its Poison Spit and ordinary fallback. Removing that single entry
from its JSON row restores Spit→ordinary at the native1780ms cadence. Poison
impacts500ms later. Stable2000msChill legitimately permits Spit every action.
No engine, skill registry, numeric stats, rewards or other monster row changed.

The new functional regression first failed5cases with6controls passing. After
the data correction, seven focused files/468tests passed (including the292case
data loader). Two lint errors in matcher callback inference were corrected
after the cohort completed using explicit `unknown` return annotations; all
eleven Tainted tests passed again with unchanged assertions.

The frozen cohort ran once per arm,1000seeds in each of four cells. Heroes use
native starting attributes at the stated level with unspent stat points, no
gear/mercenary/summons; Sorceress allocates only FireBolt1. Both sides use native
crit/dodge/mitigation and factory/combat RNG. These are unearned diagnostic
probes. Native caps are60s/1000actions. Each arm made4012calls including replay
and recorded/plain parity controls. Every4000measured result reconciled.

| Probe | Baseline wins/deaths/draws | Corrected wins/deaths/draws | Enemy median effective DPS, before→after | Winning TTK p50, before→after |
| --- | --- | --- | --- | --- |
| L3 Barbarian basic | 1000/0/0 | 940/60/0 | 0.406→6.234 | 12.32→12.32s |
| L3 Sorceress FireBolt1 | 1000/0/0 | 998/2/0 | 0.375→4.267 | 6.00→6.00s |
| L17 Barbarian basic | 1000/0/0 | 870/130/0 | 0.406→12.013 | 15.40→15.40s |
| L17 Sorceress FireBolt1 | 998/0/2 | 81/919/0 | 0.414→12.338 | 33.25→18.00s |

The winning-TTK denominator changes substantially in the last cell; its smaller
median does not show improvement. Paired both-win TTK deltas and complete3×3
outcome transitions are retained. Landed noncrit physical damage changes from
1to16atL3 and1to44atL17 after native hero defense. Ordinary premitigation
Attack remains42/112. Both corrected action sources occur naturally; short
fights without one source are retained. Source-less periodic events can be
attributed to the sole enemy in these duels only. Drops are unmeasured/null.

This corrects the authored action source but increases threat materially. It
does not accept campaign balance, earned progression, fourteen builds or
30–50hour pacing. Remaining101monster numerical/role reviews stay open.

Evidence retained under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:

- `p15-tainted-cohort-plan-v1.md`, corrected harness and root plan review.
- `p15-tainted-cohort-v1.{baseline,candidate}.raw.jsonl.gz` and manifests.
- `p15-tainted-cohort-v1.paired.{jsonl.gz,summary.json}`: all4000seed pairs.
- `p15-tainted-cohort-analysis-v1.json`: event totals, mana distributions,
  crit/dodge denominators, physical amounts and full outcome transition grids.
- Per-arm full source-before/after inventories:3053inputs each, unchanged
  within arms and only exact act1.json skill-list delta across arms.
- RED/GREEN/check logs and owned-process terminal receipts. No arm timed out;
  all owned descendants exited and per-mode Vite caches were removed.
