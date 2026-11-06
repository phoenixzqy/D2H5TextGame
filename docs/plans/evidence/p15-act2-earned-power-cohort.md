# P15 — Actual earned Act II power cohort

2026-11-04. All fourteen intended Act II completion saves qualify with current
production code. Native decoding, exact store hydration, canonical equipped
items and hero/mercenary projection pass for all fourteen sources and twenty-eight
manual/idle descriptors. A separate retained-output reader reconciles source
pins, resources/configuration, journal and 2,248 current production inputs/eight
helper contracts. No combat, reward rolls or holdout reads occur.

Thirteen actual completion saves are level32. Bone's actual completion is
level24 and used a skill-order change at the boss boundary; its saved terminal
order is Corpse Explosion then Decrepify. No qualified level32 completion was
located. Do not invent one, train it to match, or treat a fixed-order area replay
as reproducing that manual strategy.

| Build | Hero level / next ordinal | Projected HP maximum / attack | Prayer level / attack | Filled hero / merc sockets |
| --- | ---: | ---: | ---: | ---: |
| Bow | 32 / 450 | 843 / 144.2 | 26 / 589 | 7 / 15 |
| Javelin | 32 / 447 | 877 / 214 | 26 / 567 | 10 / 12 |
| Martial | 32 / 450 | 783 / 230.62 | 26 / 341 | 10 / 11 |
| Traps | 32 / 461 | 939 / 230 | 26 / 523 | 10 / 9 |
| Double Swing | 32 / 464 | 1071.58 / 366 | 33 / 456 | 10 / 12 |
| Double Throw | 32 / 452 | 1247.12 / 165 | 26 / 554 | 10 / 12 |
| Fire Druid | 32 / 461 | 831 / 193 | 26 / 431 | 10 / 13 |
| Summon Druid | 32 / 461 | 706 / 106 | 26 / 424 | 6 / 9 |
| Bone | 24 / 243 | 447 / 409 | 23 / 134 | 11 / 10 |
| Summon Necromancer | 32 / 452 | 987 / 173 | 26 / 578 | 11 / 13 |
| Holy Bolt | 32 / 450 | 821 / 252 | 26 / 552 | 10 / 12 |
| Zeal | 32 / 455 | 731 / 170 | 26 / 335 | 9 / 9 |
| Cold | 32 / 447 | 834 / 139 | 26 / 558 | 8 / 12 |
| Fire | 32 / 460 | 887 / 126 | 26 / 554 | 10 / 13 |

Projection precedes native challenge-entry refill and temporary combat buffs.
It uses `inventory.equipped`, the canonical gear authority; the legacy
`player.equipment` mirror can be stale. These earned states differ in gear,
companion progression and acquisition history. They establish actual available
power, not equal-power, recommended-power or typical-player distributions.

## Evidence and cleanup

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act2-earned-power-phx87ot5`.
Its plan pins every source, original completion evidence and acquisition summary.

| Artifact | SHA256 |
| --- | --- |
| `plan.json` | `8af0321d21d2c5f61ab7df0fba6bedc77ed497258323a0a25051705ac4b6977a` |
| `native.json` | `d344986f0e30a190523f4ce5593f683db9c511b1db3b36a5b5ba6e9c926acab9` |
| `native.journal.jsonl` | `8a1d602148f3b65c978829f24b413e35f3040507b585a36c8e79098525f9e627` |
| `readback.json` | `e08f283ba7dfed65602b6c92291cfcbb70ae37bb084411a7e75bf7a0239618a2` |

Native exit0; projection execution7.675s, wrapper7.841s. Outer store realm and
clock restoration pass. The server closes and exact native cache is removed;
the final cleanup record verifies process absence and retained evidence.
Root retains this exact packet through full-v1 acceptance, then removes it after
all consumers finish. Root's separate reader is not independent final QA.

Next use the twelve other level32 saves for the prospective
[Act II comparison](../decisions/P15-act2-earned-cohort-screen-v1.md), reuse
[Double Throw's completed screen](p15-throw-act2-checkpoint-screen.md), and keep
Bone24 separate. Counts remain14/14 intended Normal,210/210 supplemental source
availability and0/210 formal balance acceptance. Full privatev1 remains active
and incomplete; general acquisition/economy/pacing, broader populations,
difficulty/endgame and integrated app/acceptance gates remain open.
