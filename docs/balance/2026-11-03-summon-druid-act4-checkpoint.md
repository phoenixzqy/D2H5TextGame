# Intended Summon Druid Act IV checkpoint — 2026-11-03

The verified level 47 / next ordinal 685 Act III save reaches level 49 / next
717. All three Plains of Despair route attempts draw at Izual, wave index 4,
after 60,000 logical ms each. No Act IV route clears or reward claims occur;
Act V is unattempted. The three route attempts are exhausted and remain spent.

| Ordinal | Run seed | Izual initial Life | Izual remaining Life | Hero remaining Life |
| --- | --- | --- | --- | --- |
| 714 | 3362502426 | 44,178 | 7,771 | 1,170 |
| 715 | 3389491150 | 43,170 | 2,726 | 1,170 |
| 716 | 3417102472 | 38,122 | 2,094 | 1,169 |

Both ordinary escorts die in each attempt. Hero Mana ends at 636 each time;
the lowest observed Mana is 529. Actual summon direct damage totals
26,120 / 27,793 / 28,276; mercenary damage 14,697 / 16,753 / 11,762.
The hero casts each missing summon batch once per wave, then uses basic
attacks, consistent with the accepted no-normal-resummon contract. Retained
logs show 17 bodies per wave: Grizzly, five Dire Wolves, five Spirit Wolves,
three Ravens and three vines. Current ranks include Grizzly20, DireWolf10,
SpiritWolf10, Raven4, OakSage8 and Heart of Wolverine1. This is a damage
shortfall; an implementation defect has not been established. No formula,
rank-growth, build allocation or numeric tuning change was made from this result.

The 32 admissions comprise 29 training entries in already-cleared Travincal
and three Plains route attempts. They settle 186 victories and three draws,
with no interrupted admission or new unplayed staged suffix. Three quest-start
actions occur. Native rewards grant 3,234,065 XP; 2,012 items are added and
2,038 salvaged; no socket insertion occurs. Original Act I's 40 unplayed staged
suffixes and every earlier cost remain retained.

Scoped strict types, explicit driver lint and no-gameplay preflight pass.
The first frozen V1 readback and nine negative accounting controls pass exact
native save, ordered hero/mercenary item custody, currency/material/XP/points,
quests/Prayer/party and clock/seed/ordinal reconciliation. All 2,151 production
and 131 campaign inputs remain unchanged. No completed-route verification
replay or unrelated test suite occurred.

Retained evidence prefix: `p15-summon-druid-earned-act4-v1`, packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
The 283,288-byte native export has SHA256
`a1592582bd16769718ad641af14c1bcb5555920938af8cff5b26c7533369e143`.
Closure authenticates plan/readback/report/journal/export and scoped checks;
all ten recorded owner/child processes are absent and exact temporary
config/cache removed. This launch measured 38,643.227849155664 wrapper ms;
driver time is 33,261.871868 ms and readback time 4,563.543183030561 ms.

Cumulative costs: 717 admissions, 15,823,158.857719941 combat ms,
479,174.35286 driver ms and 589,786.7728180718 reserved execution ms.
The original Act I unknown wrapper remains an administrative 120,000 ms
reservation, not measured campaign pacing. Preserve this checkpoint for
retained-output diagnosis; do not renew attempts or prepare Act V.

Current intended five-act completions remain three: Corpse/Bone, Summon
Necromancer and Fire Druid. Formal balance acceptance remains 0/210; full
private v1 is incomplete. Browser works; CI is excluded; no answer is pending.
Root retains the claimed human2 worktree and required packet through umbrella
review and owns eventual evidence cleanup/worktree release.
