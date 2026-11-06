# P15 — Double Swing combined sword preparation

2026-11-04. The prepared ranks/rotation plus an already-owned sword defeat Izual
in all three selected retained failures. This verifies a preparation diagnosis,
not an earned campaign clear, population balance, or renewed encounter allowance.
Production combat formulas are unchanged; existing Swing rank scaling is retained.

## Comparison

The frozen selector considers 142 owned weapons, including 12 eligible sword
upgrades. It selects backpack unique scimitar `it-7web3-2gu` (Skewer of Krintiz,
two Eld runes). The earlier polearm trial predates sword affinity and is ineligible.
Canonical Attack rises 199→391, speed falls 188→178, magic resistance 38→30.
Only stats and Battle Command passives change in the combat projection; opening
absolute resources, statuses, cooldowns, other units and seeds are conserved.

Exactly 12 preceding-wave controls recreate native Battle Command carry and
match original events/outcomes. Exactly three candidate boss fights win:

| Original ordinal | Defeat time | Terminal hero Life/Mana |
| --- | ---: | ---: |
| 708 | 24.985 s | 1368/505 |
| 709 | 25.265 s | 1368/505 |
| 710 | 32.238 s | 1368/505 |

No boss control, campaign admission, settlement, reward or equipment action is
executed in this comparison. `readback-v2.json` passes original-input hashes,
selection/projection checks, outcome accounting and three negative resource
controls without replay. V1's incorrect raw-damage assumption is retained:
lethal overkill is 462/472/172 and V2 clamps effective damage correctly.

## Native action and recovery boundary

The actual partial successor retains 33 earlier staging transfers. The selected
sword is already in its backpack, so no additional staging/retrieval is needed.
One native reset consumes allowance 3→2 at zero cost, 56 point allocations
adopt the prepared ranks, one combo change is applied and one native equip
returns `{ok:true}`. The external verifier then incorrectly expects the old
`player.equipment` mirror, although native `buildSave` reconstructs it from
`inventory.equipped`. It throws before capturing the whole terminal export.
The original launch remains failed (BUG669); these actions are not repeated.

Pure native composition separately reconstructs the deterministic successful
swap. Isolated restore/snapshot/export/decode checks and a separate accounting
reader pass: all 418 items, 116 backpack/272 stash entries, current Life150/Mana65,
56 points, reset allowance and all unrelated progression/economy fields reconcile.
Its canonical combat projection matches the successful diagnostic. Two negative
conservation controls pass. Export SHA256:
`19841b5a5b8df6a6e92325d308840b3c0179e14c04c2059c23f056ee0786ce99`.

This artifact is **reconstructed**, not an observed original terminal export or
earned progression. The corrected future driver is retained unexecuted. Original
attempts 708–710 and staging limits remain exhausted; no income, route retry,
training, rewards or additional native preparation actions occur in recovery.
BUG659 remains Open pending actual intended progression evidence.

## Evidence retention and next work

Required packets under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p15-swing-sword-combination-v1` and `p15-swing-sword-native-v1`.
Their closure manifests authenticate retained outputs, original failures,
terminal process receipts and absent packet-local Vite caches. Root retains
these exact packets and human2 through umbrella review and owns eventual cleanup.
No compiler config, browser or production source change belongs to this slice.

Security check: pass; local retained evidence only, no external action.
Root accounting/self-review is not independent final acceptance. Counts remain
14 intended Act I clears, 3 full Normal completions, formal balance 0/210.
Full private v1 remains incomplete. Continue unfinished integration/gameplay
rather than renew exhausted runs or tune damage despite successful preparation.
