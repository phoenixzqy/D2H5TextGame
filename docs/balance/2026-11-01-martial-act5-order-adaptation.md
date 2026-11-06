# Martial Assassin Act V: free boss priority adaptation

Status: bounded adaptation qualified; independent acceptance remains open.
The original two Baal draws clear with unchanged gear, ranks, five unspent skill
points and mercenary after a free boss-specific priority change. No production
code/data or authoritative campaign save changes.

## Observed cause and correction

The raw native Baal snapshot has **0% Physical resistance**, **75% Fire
resistance** and560Defense. The original Tail29/Cobra29 order never casts
Talon20. Its one-damage Physical hits are Cobra/builder hits; they do not prove
that the uncast Talon is at the damage floor. Current Talon20 normal attempts
project620–640, or2142–2188 on crit, against that actual boss with current gear.
A preliminary assumption that both finishers faced75% resistance was incorrect.

The pure native equipment projection includes588 hero-owned items,584eligible,
17set families/eight complete sets and335 individual unique/rare-crit slot
alternatives. It includes current equipped pieces and does not borrow merc gear.
No evaluated alternative increases the landed-Talon midpoint above the current
937; complete Sander changes speed185→205, whose actual cadence is untested.
This is a gear comparison, not an exhaustive combination or power-optimality
claim. Existing gear is sufficient for the frozen order controls.

## Frozen four-area screen

Source: `p15-martial-act5-route-native-v3.json`, actual37/XP202272/ordinal481.
Seeds1/8; exact ranks/core/gear/merc/costs, complete native area/carry and ordinary
rewards. No farming, reset, points, sockets or materials spent. Both failed
baselines remain unchanged in the boss-screen packet.

| Policy | Seed1 | Seed8 |
| --- | --- | --- |
| Talon→Cobra→Tail throughout | hero death, prefix wave2 at26.180s | hero death, prefix wave2 at31.750s |
| Tail→Cobra→Talon for groups; Talon→Cobra→Tail for Baal | whole-area victory; Baal24.480s | whole-area victory; Baal28.560s |

Before settling the already-recorded penultimate wave6, the second policy uses
native `setComboOrder`; the next native wave7 captures the boss priority. No
combat unit or recording is patched. All seven prefix waves preserve exact
combat, carry and reward content against their baseline; only newly allocated
reward item IDs differ across processes. Boss-entry party, enemies, HP, MP,
cooldowns, statuses, stats and ranks are identical except hero priority.

Baal24/28Talon casts,70/84attempts,14/22dodges and15/13non-dodged crits; logged
hero damage58221/58993 includes possible overkill. Boss minimumMP271, final
hero828HP/275MP on both. The baseline boss retains53137/53853HP after60s.
The four controls attempt22waves in8.346wall seconds; pure projection4.371s.

## Verification and limits

`p15-martial-act5-order-readback-v1.json` separately verifies all four raw trials,
exact source/canonical ownership and zero spend, rewards, outcomes/events,
RNG streams, cross-wave HP/MP/cooldowns and unchanged prefix/boss input. Negative
comparison controls refuse altered prefix duration and boss MP. Scoped strict
TypeScript/focused no-any/unused lint pass; initial type/lint failures were
corrected before native execution and their receipts retained. Reuse unchanged
210BUG552/112BUG553 checks; no broad suite or earlier-act replay.

Separate author readback is not independent QA. Two conditional seeds do not
prove population balance, recommended power, within-three acceptance or
campaign-first-encounter provenance. The source already owns Throne credit;
original quest-wave carry remains unproven. Keep the failed global priority
control and both original draws. Do not repeat this resolved diagnostic or
extend it automatically to100seeds.

Next inspect Fire Druid ActV's retained Fissure-only cooldown gaps and legal
already-owned skills/gear; both baseline seeds reach Baal and draw with
6638/12603HP left. Full213skills/builds/210roles/22areas, holdouts/economy/
fairness/30–50active-hour pacing and all final integration gates remain open.
Immutable recipe61/75/68/6,68/70decoded and accepted balance0 are unchanged.
Browser works; CI excluded; no pending answer/external blocker. Goal active.

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Decision `p15-martial-act5-order-decision-v1.json`; closure
`p15-martial-act5-order-artifacts-v1.json`. Both exact configs are archived and
removed; both task Vite caches are absent and owned processes terminal. Retain
the required evidence packet and live human2 worktree for umbrella work.
