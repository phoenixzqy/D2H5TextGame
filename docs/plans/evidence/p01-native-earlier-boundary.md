# Earlier earned-gear boundary reaches Catacombs; C1 incomplete

2026-10-23, frozen runtime head `fd2c96e3136807f558ca382f13eb6e7d7d91f333`.
One fresh production Chromium attempt at 360×640 clears Dark Wood, then draws
at Catacombs wave 5 of 6. It stops at the first nonwin. Independent QA:
**ADEQUATE retained failure evidence; C1 INCOMPLETE**.

The [approved route](../decisions/D02-D07-native-earlier-reward-boundary-v1.md)
moves the sole earned reward-gear boundary after Burial Grounds, ordinal 104.
The full pre-boundary save equals the original 104 export; the actual after-save
equals the external audit oracle. Its 15 choices, 15 transfer actions and seven
changed direct swaps conserve all 3862 owned IDs and saved resources. No retry,
extra farming, alternative seed search or combat tuning was performed.

Primary snapshots record **308 victories and one draw**: 40 preparation wins,
four initial Den waves, 244 waves across 61 additional Den runs, then Blood Moor
102 / Cold Plains 103 / Burial Grounds 104 with 3 / 4 / 4 wins, Dark Wood 105
with five wins, and Catacombs 106 with four wins followed by the draw.

Catacombs uses native seed `483175827`, from
`areas/act1-catacombs|1792497600000`. Its fifth wave starts with 14 level-18 Dark
Stalkers. After “Turn 13 begins,” the terminal log says “The battle ends in a
draw.” A, C and D survive at 43.33%, 15.6% and 24.3% HP. Hero HP is 90.08%, Rogue
HP 87%, mana 180; both allies are alive. DOMs supply percentages, not exact
runtime HP or simulation duration. Browser duration: 740881.725ms (12.35 minutes).

The final full export equals the previous wave-4 checkpoint: level 12, XP 21631,
no unspent points, and 3915 distinct owned IDs (3900 backpack, eight hero, seven
mercenary). Awards end at 106W4; no 106W5 award artifact exists.
**The export is pre-deferred-settlement:** no failed-wave XP, loot or currency
is observed in this capture; later terminal settlement was not observed.

Catacombs remains uncleared, Sisters is in progress with Andariel objective
false, and currentAct is 1. Andariel, quest completion/claim, boss reward equip,
Act II and final Save→close→new-page Continue were not reached or passed.

The [combined evidence summary and cleanup receipt](fixtures/p01-native-earlier-boundary-summary.json)
binds the retained raw files. Browser errors/retries/skips/flaky outcomes are
zero; the report's extra message is normal fail-fast after one allowed failure.
Post-run checks record 11 frozen / 1346 source / 760 build hashes with zero
mismatches; QA rechecked all 11 frozen hashes. This evidence applies to the frozen
runtime, not later source edits. Prior 8546-unit/typecheck/lint evidence is inherited.

The [failure screenshot](fixtures/p01-native-earlier-boundary-failure.png) and
[error context](fixtures/p01-native-earlier-boundary-error-context.md) were copied
and hash-verified before cleanup. Exactly `dist`, `tmp`, `cache` and
`browser-output` under the retained root were removed: 875 files, 42625477 bytes;
remaining disposable paths and failures `[]`. No campaign processes or disposable
file handles remained; preview port 44333 was closed. No process was stopped.

Root retains required raw evidence and `retained-manifest.json` at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-native-early-boundary`
until umbrella C1 consumers finish, then removes that exact root. Shared caches
remain untouched. All QA readers are released; root retains the worktree claim.
