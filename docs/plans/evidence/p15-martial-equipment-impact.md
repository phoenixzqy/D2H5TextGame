# P15 — Martial owned-claw combat impact

2026-11-03. Follow-up to [preparation](p15-martial-owned-weapon.md) and
[BUG652](../../../production/bugs/BUG-652-martial-act4-throughput.md).

The single equipment-only comparison does not establish Martial viability.
All three candidates draw at 60 seconds with a living hero. No earned clear,
route continuation, rewards or accepted balance cell follows.

| Retained ordinal | Encounter | Original enemy Life | Prepared enemy Life |
| --- | --- | ---: | ---: |
| 705 | Izual | 16,277 | 15,366 |
| 706 | Izual | 22,029 | 17,414 |
| 707 | Preceding Pit Lord pack | 3,595 | 5,820 |

## Method and limits

The prospective plan authenticates 2,159 production files, 133 campaign files
and 335 unchanged engine/authored pins. Three previously exact complete-event
and final-party controls are reused; no new control battles run. Exactly three
candidate waves apply the canonical native-save equipment differences to the
retained failed combat inputs. Only six hero stat fields differ: Attack,
CritChance, CritDamage, LifeMax, MagicResist and ManaMax. Absolute top-level
Life987/Mana500 and raw stats.life140/mana87 remain unchanged; skill order,
ranks, parties, enemies, seeds, statuses and cooldowns are conserved.

This is an isolated equipment comparison, not native campaign continuation.
There are zero native admissions/equip actions, rewards or renewed budgets.
Attempts705–707 remain exhausted. BUG664 remains a valid preparation fix;
BUG652 remains Open. The earlier paired-finisher order remains rejected and
no additional ordering variant is authorized by this result. Counts remain
14 individual intended Act I clears / 3 Normal completions / formal0/210.

Separate Python accounting readback verifies complete snapshot conservation,
the exact six differences, casts, winners/resources and health deltas. It is
root accounting verification, not independent engine QA or population evidence.
No broad test suite or completed campaign is replayed.

## Retained evidence and cleanup

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-martial-equipment-impact-v1`.

- `plan.json` SHA256: `721e8b676d6dd701e332cb01ff5094e5794e267758da563cf8cebba8f0febec8`.
- `composition.json` retains canonical native before/after heroes;
  `candidate-705.json` through `candidate-707.json` retain complete events/results.
- `diagnostic.json` SHA256: `a1ec4a2bf2ddd0a2c1f2cad1fbe2f308a41b7ca161c78eafece66c77ded202c6`;
  `allThreeWin:false`, three candidates, zero new controls.
- `readback.json` passes. `wrapper-exit.json` records exit0/7.394s;
  `process-exit.json` and `closure.json` verify process/cache absence.

No compiler config was created. Root retains the required packet and claimed
human2 worktree through umbrella review and owns eventual cleanup/release.
