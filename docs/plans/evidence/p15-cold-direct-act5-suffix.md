# Intended Cold Sorceress: first direct Ancients attempt

Verified 2026-11-04. The earned level 73 / next ordinal 1224 checkpoint
continues into the previously unattempted Ancient's Way. Four waves win;
wave five draws at 60 seconds. The driver stops immediately, preserving the
terminal level 73 / next ordinal 1225 save. No area clear, new quest action,
Rite claim or Baal attempt is recorded. Intended Normal completions remain
4/14, intended Act I clears 14/14 and formal balance acceptance 0/210.

The [previous checkpoint](../../balance/2026-11-03-cold-act5-checkpoint.md)
had exhausted its 200-admission Ancients preparation allowance. This direct
suffix does not reopen training, retry an earlier admission, replay a completed
quest route or change Cold skill order. The existing `resumeActFiveMain` API
authenticates all 16 inherited quest actions and their native state before
continuing. The frozen schedule permits Ancients then Throne once each, with
an immediate stop on the first nonwin; only Ancients ordinal 1224 is consumed.

## Result and diagnosis

One admission settles five waves: four victories and one draw. Earned rewards
are 265,852 XP and 25 items; native inventory preparation salvages 43 items.
No training admission, socket insertion, new quest action or retry occurs.
Combat time is 142,986.089 ms; driver time 2,130.612 ms and launcher time
7,430.218 ms. The original source save and every prior failure remain retained.

The failed wave has run seed 46170775 and zero-based wave index 4. The hero
enters with 1,326 life / 750 mana and finishes alive with 1,125 life / 770 mana.
Twelve enemies survive. Hero actions comprise 22 Static Fields, four Blizzards
and two Frost Novas. Prayer dies in the preceding wave and is correctly absent
from this wave. This supplies a new actual route failure for
[BUG643](../../../production/bugs/BUG-643-cold-static-field-priority-starvation.md),
without proving a sufficient rotation fix or a production damage/AI defect.
Both earlier rejected priority comparisons and their closed limits remain
unchanged. No additional tuning battle was run.

## Verification and retained evidence

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Prefix: `p15-cold-direct-act5-suffix-v1`. Retained artifacts include the frozen
plan, source/campaign/profile manifests, driver, launcher, scoped check receipts,
report, journal, exact native export, both reader versions and closure.

Scoped strict TypeScript, driver lint, no-gameplay preflight and five negative
schedule controls pass. Reader V1 then fails because it directly indexes the
optional `rewardClaimed` property on an in-progress Rite row. The original
reader and failed result remain. A separately frozen V2 uses the native
omitted-false semantics and passes exact save, ordered item custody, currency,
materials, XP/points, quest, living-party/resource, clock, seed and ordinal
reconciliation. It reads the same retained outputs; combat is not replayed.
All 2,204 production and 134 campaign inputs remain unchanged.

| Artifact | SHA256 |
| --- | --- |
| Frozen plan | `23612474b284abd3c3e6c8e4089a7625a9cf75fb085380bcdab2f4810bf1d2e1` |
| Native export | `4a09010c50d5f4f7fa8789e2a286fd088a6d3a7fa2e7b28d270b243f639c192a` |
| Passing reader | `1bbce57b8137b30e91af38939dda4e80d1b8edf2fbed50910905679cfecb5475` |
| Closure | `f6dd59a8741546607a2acb307ab761a7de154d2e87e7ef624ebc14fc92d2166d` |

Cumulative costs now total 1,225 admissions, 96,525,227.265 combat ms,
951,551.444 driver ms and 1,022,795.579 execution ms. The last total includes
the previously retained 13,925.745 ms of rejected diagnostics exactly once.
Original global and exhausted preparation limits remain closed.

All eight recorded child processes are absent. The exact transient type config
was checked against its archive, removed and verified absent; the task cache
is absent. Root retains the required evidence packet and claimed human2
worktree through umbrella review and owns eventual cleanup/release.

Cold remains incomplete, with Ancients now attempted and Throne/Baal still
unattempted. This result gives no population/holdout, pacing, independent
combat/drop-law or formal balance acceptance. Full private v1 remains active.
