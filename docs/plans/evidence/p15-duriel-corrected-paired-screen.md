# P15 — Corrected Duriel paired diagnostic

Status: diagnostic complete; full v1 and balance acceptance incomplete.
Contract: [prospective paired screen](../decisions/P15-duriel-corrected-paired-screen-v1.md).
One launch: twelve actual earned level32 profiles × manual/idle × seed1 only;
24 whole-Tomb attempts/144wave wins,zero deaths/errors/unreached bosses.
Bone24/Double Throw excluded; saved gear,resources,ordinals,clocks,carry/pity0
preserved. The24attempt budget is spent; do not replay.

Native exit0:16.900635337wall seconds,1239837.8269607378logical milliseconds.
Retained readback passes source/fixture/journal/arithmetic/reward/stream checks:
2251production/eight helper inputs stable. Separate analysis runs no game code;
matches all24old/current terminals by fixture,handle and starting-save hash.
All120prefix waves exactly match. Manual/idle boss metrics and diagnostics
agree for every profile; differences are confined to Duriel.

| Build | Old → corrected boss seconds | Recorded incoming hero damage |
| --- | ---: | ---: |
| Bow |13.860→15.276|7|
| Javelin |15.424→18.681|8|
| Martial |19.500→23.225|5|
| Traps |14.600→17.636|8|
| Double Swing |6.312→7.130|2|
| Fire Druid |5.520→5.731|3|
| Summon Druid |7.280→7.460|1|
| Summon Necro |7.760→8.008|2|
| Holy Bolt |14.300→15.823|7|
| Zeal |12.892→13.167|4|
| Cold Sorceress |11.340→12.665|5|
| Fire Sorceress |15.120→13.925|5|

Individual seed observations are not medians/win-rate evidence. Hero final life
is full; incoming event amounts are not net life loss. Healing is rounded/clamped,
direct damage can include overkill,periodic damage lacks source attribution.
Entry party/enemy stats,target-kind/type damage,healing,actions,statuses and
source contribution remain in the report. No holdouts or balance acceptance.

Native Duriel Attack220/Charge60–90falls below heroes' defense244–337 and
physical resistance45–109(cap75). More HP alone would lengthen exposure without
fixing the damage floor. Separate Charge scaling from representative first-clear
acquisition; no universal boss stat buff is justified by this cohort alone.

Required packet retained by root through unfinished full-v1 acceptance:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-duriel-corrected-screen-kiy1aw9w`.
Use `native.json`,journal,`readback.json`,`readback.exit.json`,
`paired-analysis.py`,`paired-analysis.json`,`paired-analysis.exit.json`,
`cleanup.json`. Passing source equality is for tree
`700e8c480172aea8c8f3520ec0b6916f3fc024347e9c7feaf9e3cc47cc115972`;
do not rerun this pinned reader after source edits.
PIDs32988/32987absent,server closed,exact native-cache-EuQEdw absent;
3544590packet bytes before cleanup record,below32MiB,no disposables/failures.
Root removes evidence after acceptance and all consumers finish.
