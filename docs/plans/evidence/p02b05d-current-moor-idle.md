# P02b05d — Current-head earned Moor and active idle pilot

2026-10-21. **Failed discovery; gameplay acceptance remains open.** One frozen
ordinary-earned production attempt completes forty preparation wins and manual
waves1–2, then wave3 ends in a native draw with Zombie A alive. No full clear,
idle eligibility/run/repeat/Stop, no-late-award or close/reopen checkpoint was
reached. No retry, stronger preparation, alternate build/seed, refill, injected
state, numerical tuning or product/test change. Full P02/P11/C/G/private v1
remain open. This observation establishes no new gameplay defect or cause for
the historical draw.

## Frozen boundary

Measured source parent `bff6ce1c6f32ff318fb3063fa62cb03c33f36c82` follows the
accepted Chill, Shatter, Rogue Inner Sight and mobile combat repairs. The same
historical [failed candidate](p02b05c-earned-moor-idle.md) is preserved separately.
[Plan](../p02b05d-current-moor-idle.md) limits this child to three ordered outcomes:
ordinary earned manual clear→Farm Here; if reached native idle/repeat/Stop and
no late award; if reached exact saved-state close/Continue. Unreached assertions
are not evidence.

Producer/QA/GD/TD independently approve the bounded plan and unchanged concrete
test/config. Spec SHA256
`4427499f64ab2f2cc9145da308f3937158be8b6246ca618a570f440df661cf34`;
config `96e56e6ddc08989516de52f0e1a978e5ce557da9ab3a64a2486d3b1a0925a660`.
Both are byte-identical to the archived historical pilot. The verified runner
changes only port4347→52991, SHA256
`cb3fd15fe4da515d265480ef493fe8e4f368c7300dedc6bdf2f119712f41993e`.
No missing-capability or runtime RED is invented for this measurement.

Source audit indexes580 exact tracked source/test/config/package records,
canonical manifest `084edde4c1030cadb4aec8b00353db2111cf749202a67ac00f88f6d0adfa7506`.
QA notices the initial historical-change list uses a narrower filter than its
manifest scope. The original audit remains intact; separately reviewed v2 lists
all29 actual changed paths including four accepted upstream browser/config
files. V2 SHA `d6bd1e1d1d8e446ed79770e0e76caecbaa2d9a96f030eb798d38d3bf9471ecc5`.
No source/test/expected assertion changes. Final freeze SHA
`00a2a1ed37126f97cbd3ad19f0df17531bfbc415d4adaeed96e0fad151636d9d`.
All580 current hashes match before execution; all readers release before build.

## Ordinary preparation and observed failure

English/1280×800, fresh Sorceress, actual free/fielded starter Rogue. Date alone
fixed2026-10-20T12:00Z, native timers. Exactly40 ordinary W1 wins followed by
installed W2 Pause/Flee pass every strict reward/progression journal. No clear
is granted by these partial runs. XP11080→L6/67/8818;344unique items and5157
rune shards;mercL9/249/4404. Frost6/Fire1/noWarmth, Frost→Fire, +15Vitality/
10Energy, same exact first-earned hero glove5/boots3 and merc glove4. Full
prepared save matches bag341, hero core10/25/25/45, HP120/190 MP102/137,
defense43, empty clears/no idle target. No Den quest acceptance or save import.

Source-derived seed2330410254 and ordinals0–39prep/40manual/41idle/42repeat
are expectations, never explicit runtime inputs.41/42 are not observations.
Separate victory RNG and unchanged reward/planner/progression data justify
retaining the strict historical prep literals despite repaired combat behavior.

One test fails in106.030s case/108.497s process, exit1, at the all-enemies-dead
assertion for manualW3. It is not a timeout or setup failure:

| Manual wave | Enemy representatives | Hero HP percent | Terminal result |
| --- | --- | --- | --- |
| 1 | 9 | 70 | victory, all enemies dead |
| 2 | 10 | 84.74 | victory, all enemies dead |
| 3 | 11 | 97.37 | draw, one living Zombie A |

Original hero remains present/nondead and merc remains alive. Skip is disabled;
the last visible log says “The battle ends in a draw.” Terminal snapshots retain
up to200 UI log entries, not the complete recording. Root inspects the failure
screenshot. The terminal snapshot precedes the native1500ms settlement; the
test stops before final defeat UI/W3 settlement, so no W3 award/finalization
claim is made. Latest committed W2 save is L6/XP547, bag397, rune shards5850,
gem shard1/wishstones2, no clear/idle target.

Counters at failure:41starts/83installed-computed waves/43Skip/42observed
settlements. Computed waves include40 abandoned prepW2, while terminal manualW3
is not an observed settlement. Failure counters remain labelled lower bounds
for unfinished actions/transitions. No idle run occurred. Browser warning/error/
pageerror arrays are empty. No matrix/mobile/CJK/a11y/balance/campaign acceptance.

## Validation and resource limits

List discovers exactly one case in0.918s. Clean production build/bridge guard
passes in9.301s with four clean JS chunks. Existing large-chunk/art-precache/
Browserslist/Node color warnings remain. The prior P16 current-byte full
3454unit/166files54.907s, typecheck11.211s and lint28.774s apply to identical
product/test bytes; they are inherited evidence, not a new P02b05d U/T/L run.
No source/test edit or new coverage run. Existing15s unit budget remains exceeded.

One worker/retries0/traceoff,180s/case, list30/build210/pilot240s plus2s
exact-owned cleanup,32MiB/log/report,64MiB total taskRAW/dist/.vite remain
unchanged. Pilot report2,919,225bytes; attachments419,318bytes; final monitored
task total44,724,307bytes. All three commands finish without deadline/cap stop,
signals or surviving owned process. Dedicated subreaper/PID-birth identity
tracking remains unchanged. Root owns execution and exact disposable cleanup
after independent final packet verification/readers release. Preserve tools,
shared caches and pre-existing emptycoverage; original checkout untouched.
No push/PR/merge/deployment.

## Durable evidence and next work

[Packet](fixtures/p02b05d-current-moor-idle/packet.json) indexes36safe regular
records/3,813,179raw bytes, three commands and19PID/birth identities verified
nonlive. The adjacent729,215-byte archive preserves frozen/original/corrected
inputs, the source manifest, failed report/137attachments, screenshot, native
journals and command/process evidence. Archive/RAW size/hash/content match.
Packet SHA256 `799aa7c595d8997220277a4db29cd55c29764690534fbb283cdc557f1a821803`;
archive SHA256 `a4ed215e614e0044279e3fa8567316bd44507f47258c98a67d4b8eb74914888d`.
Archived draft documents precede this paragraph/final review/cleanup notes.
Independent producer/QA final whole-packet APPROVE verifies all36records,580source
hashes,137attachments and19nonlive identities. GD/TD approve the bounded failed
outcome. All readers release; [review](fixtures/p02b05d-current-moor-idle/final-review.json)
records this evidence-only acceptance. Exact cleanup rechecks all36records/archive and19nonlive identities, removes
the36RAW files and760taskdist files, and verifies absence. Task .vite was
already absent. [Cleanup](fixtures/p02b05d-current-moor-idle/cleanup.json)
records exact paths; pre-existing emptycoverage/dependencies/tools/sharedcaches
and source/history/durable evidence remain. Root retains the umbrella worktree
claim and owns next source-only RAW
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-armor-melt-jcabtz3k`
until its consumers finish.
No additional pilot or stronger preparation is authorized by this failed card.
Select the next substantive implementation card from reviewed plan/source gaps;
full private-v1 remains the objective.
