# Earned Radament continuation: four wins, final draw

At runtime `9c84c97`, the [frozen one-attempt card](../d11-earned-radament.md)
imported the unchanged genuine C1 save through production Settings in a fresh
Chromium context, en,360×640. Exact v11→v12 migration adds only the empty ledger.
No gear, points, recruitment, resources or seed were injected or prepared.
Date1792497600000/native timers and fresh session ordinal0 apply. Source-derived
plan seed1283116162 is a reproducibility expectation, not captured private input.

Native Pause/Skip wins waves1–4. Actual awards are:

| Wave | Hero XP | Merc XP | New gear |
| --- | ---: | ---: | ---: |
| 1 | 1440 | 1080 | 3 |
| 2 | 1800 | 1350 | 3 |
| 3 | 2100 | 1575 | 50 |
| 4 | 2420 | 1815 | 24 |

Totals:7760heroXP/5820mercXP/80gear,8715rune-shard/18wishstone/3gem-shard.
All3920 original IDs remain;4000 final owned IDs are unique. Wave5 reaches an
actual draw with Radament alive, four ordinary companions and a summoned minion
dead. The [terminal DOM](fixtures/d11-earned-radament-draw.json.gz) ends with
“The battle ends in a draw.” The test stops at that first nonwin: one failed
result, retry0/skipped0/flaky0,28.53s and zero page errors. No second attempt.

The failure and final exports both equal the complete wave4 export exactly:
no failed-wave rewards, Far Oasis clear, objective completion, quest claim,
points or book grant. The [earned prefix](fixtures/d11-earned-radament-prefix.json.gz)
has SHA256 `041359abf71ff7c7bd44b9b0397ace679970d3280b1d5ff46a854ce6ae841d64`.
The [executed script](fixtures/d11-earned-radament.spec.ts.txt) is retained.

Independent QA APPROVE as evidence of a bounded earned nonwin/security PASS;
input/script/source777/build760 hashes match. The screenshot shows wave5 but
omits the draw line; terminal logs retain200lines. This attempt does not prove
Save-close-Continue of the failed prefix or identify a product/balance defect.
No C2/earned Radament/claim-read persistence acceptance follows.

Required logs, report, raw snapshots, saves, script and manifests remain at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-earned-radament-q_amr773`
through D11/C2/full-v1 consumers; root removes them afterward. All readers and
the browser process finished; port34447 is closed. Exact owned UI/dist and both
browser-output directories were removed; cleanup remaining[]/failures[].
No retry, farming, alternate build or Duriel launch is authorized by this result.
Next: implement the independently diagnosed Summoner identity/quest-data repair;
read-only Radament damage/duration diagnosis remains separate.
