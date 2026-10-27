# P18 — Endgame qualification with the genuine L35 build

2026-10-27. Root native executor and separate root artifact audit; independent
acceptance remains open. [Exact metrics/policy](fixtures/earned-endgame-qualification/summary.json).

The exact [earned all-areas next431 save](d11-earned-all-areas431.md) can complete
the authored L90 four-wave dungeon. No new power or balance change is needed
for this bounded route. Original ranks, core, equipment, Holy Freeze mercenary
and Static→IceBlast→Blizzard priority remain unchanged.

This is diagnostic qualification. Genuine endgame attemptOrdinal stays0, both
clear counts stay0 and achievement Claim remains unconsumed. No diagnostic save
is retained as the genuine successor.

## Native execution and artifact audit

The pilot samples ordinals0–3 per modifier. Before further execution, the frozen
policy requires at least26/32 complete wins,12/16 in the second half, and12/16 in
the disjoint holdout64–79. The next run executes4–31 and64–79 per modifier.

| Modifier | Qualification | Second half | Disjoint holdout | Total |
| --- | ---: | ---: | ---: | ---: |
| Ashen | 32/32 | 16/16 | 16/16 | 48/48 |
| Glacial | 32/32 | 16/16 | 16/16 | 48/48 |

All96 routes and384 native wave recordings pass the separate artifact audit:
actual original enemy membership/level, endgame modifier/ordinal origin, four
native player victories, living hero, all original enemies dead, exact wave
transition results and terminal end events. Production import hydration,
startEndgameRun, recorded combat and advanceWaveOrFinish are used. Only the
save-adapter's disk I/O is mocked; no engine/RNG/AI/damage/reward mocks occur.
Only diagnostic attempt ordinals vary to select native seeds.

Source/input hashes and execution HEAD remain exact through terminal checks.
Original pilot64381 and qualification67145 handles finish0 and are consumed.
The same product sources are now committed in4d0397d8 and pass the final whole
unit/types/lint/build checks recorded with the all-areas checkpoint.

## Modifier and timing evidence

The audit traces each source ID to actual Blood Lord/Frozen Terror membership.
It finds1022 Fire Breath actions,1351 positive fire hits on allies and1340
noninitial Ignite status projections from Blood Lords. It separately finds1364
Frost Aura actions,1851 positive cold hits on allies and1275 noninitial Chill
projections from Frozen Terrors. Mercenary chill on enemies is excluded.
These are functional source observations, not a balance acceptance threshold.

The pilot observer incorrectly read nonexistent last.at and reported0seconds.
That timing is invalid. Original source/results are preserved. The audit reads
the original recordings' real RecordedBattleEvent.simClockMs without resimulation;
the qualification harness asserts that contract directly. Combat-only route
seconds are Ashen min51.52/median58.728/max72.688 and Glacial
min67.690/median76.184/max100.011. They do not measure30–50 active-hour pacing.

## Next action and retention

Follow the [frozen genuine protocol](../p18-earned-endgame.md): Ashen0, Ashen1,
Ashen2, Glacial3; preserve the first nonwin/tooling prefix and every consumed
action. Actual ordinary entry, repeated clears, Claim, reward utility and
durability are not established by this qualification.

Root retains archive/manifest/receipt at the exact paths in the summary through
earned-endgame, independent and full-v1 consumers, then removes only those
sidecars after release. Recovery handle85826 finished0 and was consumed: all406
archive members (403 files/three directories including the root) passed streamed
read-back and original-file hash verification before exact raw cleanup.
Remaining[]/failures[] and raw-root absence are verified. Archive SHA256 is
`ceaac2f982b33f5d032100f62d96b00d0c28f9be70176f3de2738ad6c9495773`.

Original combined retainer65632 was interrupted with exit130 before any deletion
because a demonstrated quadratic manifest lookup stalled the first, combat-log
root. That original attempt is not a pass. Recovery reused its closed archive,
indexed the manifest, verified every member and original file, and completed its
4974-member cleanup before archiving this qualification root once. The retained
combat-log interruption sidecar records the original failure and recovery source.
The recovery's three disposable scratch files and their directory are removed;
no shared cache, source, save deliverable or worktree was removed.
Full P18/C2–C4/G0–G7,14builds,independent/human acceptance remain open. Local only.
