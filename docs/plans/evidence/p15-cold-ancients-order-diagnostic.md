# Cold Sorceress: retained Ancients priority comparison

Verified 2026-11-04. This closes the two-battle diagnostic on the first actual
Ancients failure. The candidate is rejected; no skill order or production
behavior changes. Intended completions remain 4/14 Normal, 14/14 Act I and
formal balance acceptance 0/210.

## Input and frozen limit

The [actual route failure](p15-cold-direct-act5-suffix.md) supplies native
ordinal 1224, run seed 46170775, zero-based wave 4 and engine seed 366338786.
The hero enters at 1326 HP / 750 MP; Prayer died in the preceding wave and is
correctly absent. The native successor remains level 73 / next ordinal 1225.
No admission, training, seed search, other state change or balance credit is
permitted. The exhausted original 200-preparation allowance stays closed.

The frozen schedule permits one exact control and one candidate only:
Frozen Armor → Blizzard → Static Field → Frost Nova → Ice Blast → Ice Bolt.
Acceptance requires exact original control events/final parties and a living
hero victory for the candidate. Both battles are now consumed; no further
candidate or increased cap is authorized on this snapshot. Earlier Crystalline
Passage comparisons remain separately closed and must not be replayed.

## Results

| Measure | Original control | Candidate |
| --- | ---: | ---: |
| Outcome | Draw at 60 s | Draw at 60 s |
| Surviving enemies | 12 | 3 |
| Hero HP | 1125 | 1222 |
| Hero MP | 770 | 767 |
| Blizzard casts | 4 | 12 |
| Static Field casts | 22 | 12 |
| Frost Nova casts | 2 | 4 |

Control reproduces all 3174 original events and complete final parties. The
candidate leaves three elite Frozen Terrors at 522, 765 and 859 HP. More
Blizzard casts improve finishing damage but do not meet the declared victory
condition. No production coefficient, Static floor or selection-engine defect
is established. The documented Static Field contract remains authoritative.

## Failed preflight and correction

The original driver compared raw engineInput parties with published initial
parties, which already include native default grid positions. It exits before
admitted.json or any battle. Preserve that failure. Execution v2 compares via
native withDefaultGridPositions, while running unchanged original engineInput
and retaining full exact-control requirements. This correction consumes no
combat before the two scheduled battles.

## Custody and costs

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-cold-ancients-order-7r3bp652`.
Root artifacts retain the initial failure; execution-v2 contains the corrected
plan/driver/launcher, admitted input/source manifests, both full battle outputs,
result and process/exit receipts. Root retains the packet through umbrella
review and owns eventual cleanup. No repository build or browser was created.

| Artifact | SHA256 |
| --- | --- |
| Original plan | `f2df91472c4ea834a5d23e3066a0206b82bec61c45f25533ebac805878ef7c9d` |
| Corrected plan | `2aca7db230c99265b8d25b32283ddbf1e7d30b0500721d8eb38c110781fceec8` |
| Input | `c29f1e43d4f6943ad2754913d21cf069c18b0e847b181be51c95572129546697` |
| Initial combat snapshot | `814ea6da5887d1abc21a3aa8979947da18eab6253174ed226eb13dcb49703c8c` |

Original preflight launcher: 3159.674 ms, exit 1. Corrected launcher:
3978.395 ms, exit 0; internal diagnostic 979.539 ms. These are separate
additional diagnostic costs, not native campaign admissions or economic
changes. Existing native cumulative costs (1225 admissions and
96525227.265 combat ms) remain unchanged. Production and campaign manifests
are stable during execution. Relative to the original route source, only the
known MercsScreen readability edit differs; combat source is unchanged.

A separate process/filesystem check confirms PIDs 3597971 and 3598142 absent
and both exact vite-cache directories absent. No disposable paths remain for
this slice. Full private v1 remains active; Cold's progression issue stays open.
