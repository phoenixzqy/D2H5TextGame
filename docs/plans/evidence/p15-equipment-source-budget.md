# P12a/P15 — Live equipment sources and conditional salvage

2026-11-04. This diagnostic component is locally complete. Full private v1
remains incomplete. Previous goal turn was status-only/no progress. Existing
owned human2 reused; no production source/data/save changes or campaign replay.

`equipment-source-budget.ts` scans actual challenge/replay plans for all 29
areas, planning seed 7, ordinals 0–12, manual/idle and three difficulties.
It deduplicates actual kill-reward inputs, then observes every native
`rollDrops` call without changing its outputs or adding RNG draws. Every
context receives one identity-seeded `rollKillRewards` sample. All sampled
gear, including guarantees, goes through the native pure salvage planner in
a constructed disposable inventory. This confers no earned progress.

## Findings

810 contexts produce 987 TC invocations. Tier counts: 282 trash, 168 champion,
129 rare leaders, 120 rare minions, 42 bosses, 15 chapter bosses and 54 elites.
786 contexts have equipment-only eligible picks; 21 retain mixed sources;
three have no eligible TC picks. 66 contexts contain raw non-equipment entries
that actual equipment projections suppress. Raw entries alone therefore cannot
establish live material income, and suppression is not universal.

All 21 mixed contexts are trash-tier mini-table inputs. Each row below occurs
in Normal, Nightmare and Hell, with level offsets 0, +20 and +40 respectively.
MF/GF are zero. Currency and gem picks remain eligible in all three; the rune
pick remains eligible in Normal only. The complete input/witness records are
in `readback.json`.

| Source | Normal resolved levels | Mixed contexts |
| --- | --- | ---: |
| `loot/mini-act1` | 7, 12 | 6 |
| `loot/mini-act2` | 22, 28 | 6 |
| `loot/mini-act3` | 36, 40 | 6 |
| `loot/mini-act4` | 49 | 3 |

The three empty contexts are Normal champions at levels 2/14/27 using
`loot/trash-act1/2/3` respectively. Their first witnesses are Blood Moor idle0,
Rocky Waste idle7 and Spider Forest idle3. These follow the accepted shifted
minimum rule in [D08](../decisions/D08-nonboss-equipment-v1.md); no fallback,
level alteration or gameplay defect is inferred. Other reward channels can
still grant rewards; an empty TC pool does not mean an empty kill reward.

Constructed samples contain 1,606 items, yielding 11,169 scrap when all are
salvaged. Original native rewards total 1,691,684 rune shards and 29 wishstones.
These are heterogeneous sample totals, **not expected income, rates, earned
resources or affordability evidence**. Salvage is conditional on disposal of
the sampled gear; it is not an independent extra reward channel.

## Verification and limits

Three initial missing-module RED cases were recorded. The first implemented
run passed boss/material-separation and refusal/observer-restoration cases;
the census failed because the diagnostic assumed one pick for absent counts.
Corrected output retains null for native tier defaults. Only that failed case
was rerun and passed (~3.19s test execution); all three distinct cases now pass.
Scoped strict TypeScript and explicit two-file lint pass without warnings.
No broad test/build/browser or completed-act replay.

Separate Python raw-data arithmetic verifies all eligible lists, every sampled
item's salvage, partitions, unique inputs, flags, raw reference entries,
2,221 manifest hashes and all 2,100 unchanged production files. Its initial
raw/normalized field mismatch was corrected without changing the report.
Five-axis root self-review finds no blocking issue within the stated scope;
it is not independent QA. Native observer restoration is checked on refusal,
and an existing mock is rejected rather than overwritten.

The fixed planning scan is not exhaustive RNG/campaign-state coverage or an
encounter-frequency model. No first-kill, special quest projection/cache,
endgame or Find Item source; no kill-rate, acquisition-hours, pacing or balance
acceptance. 195 observed tables retain native pick/noDrop defaults explicitly.
Mixed-source quantities and material identity probabilities are the next
acquisition component, before combining channels and recipe costs.

```sh
EQUIPMENT_SOURCE_BUDGET_REPORT_PATH=/absolute/existing-directory/new-report.json \
  node node_modules/vitest/vitest.mjs run \
  --workspace vitest.diagnostics.workspace.ts --project sim-diagnostics \
  tests/sim/production/equipment-source-budget.test.ts --no-cache
```

## Retained evidence and cleanup

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-equipment-source-budget-udv4g3ke`.
It contains native report, exact implementation patch, RED/initial/final check
outputs, raw arithmetic reader/result, five-axis review, source hashes and
cleanup receipt. Report SHA256:
`dced4f2e03df1958ba60c355c4d5f1bdffd75f96e083b4ff0916ae564d5f0050`.

All five recorded check PIDs are absent. Scoped config archived as text and
deleted; named cache absent. No server started or cleanup failure. Root retains
this packet and human2 through unfinished umbrella review, then owns exact
cleanup/release. Counts remain 14 Act I / 8 Normal / formal 0 of 210; six build
routes, economy/pacing and wider difficulty/endgame/app/independent acceptance
remain open. Browser works; no pending answer or CI requirement in this work.
