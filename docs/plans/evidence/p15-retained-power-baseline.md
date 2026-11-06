# P15 — Exact retained-power inputs

2026-11-05. All 210 selected build/act/encounter contexts now have a pinned
conditional input baseline under the [prospective policy](../decisions/P15-retained-power-baseline-v1.md).
The previous status turn was no progress; this increment writes the policy,
generates the manifest and verifies every source/snapshot join. It changes no
production runtime or saved state. Full private v1 remains incomplete.

## Result

The manifest contains 183 previously selected source containers plus the two
existing native Bone Necromancer Act V order preparations. It verifies
1,176,325,117 container bytes, their extraction instructions and exact raw-save
SHA256 values. Every save has fingerprints for all root domains and inventory
fields, plus readable allocation/skills/order, canonical hero equipment,
mercenaries/equipment/progression, formation, resources, currencies/materials,
map, settings, clock and ordinals. Backpack/stash contents remain pinned without
duplicating the full inventories. Saved stats are historical, not recomputed
current combat projections; no decoding or native hydration occurs here.

The 14 × 5 × 3 context set is complete. Both CE preparations match their retained
decoded predecessors with only `player.comboOrder` changed; their originals
remain pinned. All inherited context fields are preserved, including whole-area
starts/boss boundaries, five failed branches, eleven noncanonical diagnostic
contexts and Double Throw's distinct lineage/cost receipts. No new earned
successor, normalization of ancestral costs or outcome selection is introduced.

Each context adds `retainedBaseline.exactInputFrozen`. The existing broader
`powerAcquisitionAdaptationFrozen`, `populationFrozen` and `acceptedBalance`
flags stay false. The baseline permits no added preparation for an isolated
first attempt; it cannot establish the required within-three-attempt success.
Unknown historical acquisition costs stay unknown.

## Verification

The external generator exits 0 in 19.084 seconds. A separate reader, which does
not import the generator, rehashes all 185 containers and raw saves and checks
every domain/snapshot, full key set, class/level/ordinal join, preparation and
unchanged ancestry/failure field. It exits 0 in 10.643 seconds. Aggregate
processing is 29.727 seconds within the prospective 120-second limit. Both
programs read only the declared sources/metadata and write the task packet.
There are zero combat starts, reward rolls or holdout reads. Root's separate
reader is not independent final review. No broad test/build/browser run occurs.

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-retained-power-freeze-heny_j_e`.

| Artifact | SHA256 |
| --- | --- |
| `plan.json` | `2afe65c8d8fdf6928fc19461006bde46582db0a1a0f1996764ca9c28860de4bb` |
| `freeze.json` | `c9993ec563a3114104623832e89324295eac396069f585ced4cc9374b1be171e` |
| `readback.json` | `b04179c3707fc5c98437334bdfc8d55e439abfc258c4c6fba1c368d306d5950a` |
| `cleanup.json` | `77c1fec5e2dd1e22e52d37aa02c79bdaf261206b63d6709c42818295bc651167` |

All ten planned artifacts are present, totaling 4,442,187 bytes under the 8 MiB
cap. Tool handles 67339 and 80143 are terminal exit 0; exact PIDs 333366 and
333703 are absent. No server, browser, cache, generated repository output or
disposable directory was created. Cleanup reports no remaining disposable paths
or failures. Root retains this exact required packet through full-v1 acceptance,
then removes it after its consumers finish. The claimed human2 worktree remains
in use for the unfinished umbrella task.

## Remaining requirements

This establishes repeatable exact retained inputs. It does not establish
recommended/typical/equal power, natural acquisition distributions, current
projection, ordinal/prefix carry, encounter populations, manual/idle RNG or pity,
three-attempt adaptation, campaign pacing or balance acceptance. These still
need prospective definitions and evidence; no exhausted campaign, screening,
sample or retry allowance is renewed.

Historical counts remain 14/14 intended Normal completions, 210 source contexts
and formal balance 0/210. Next define the outstanding encounter/population and
adaptation boundaries using this manifest, before any new measurement. Wider
progression/acquisition/economy/30–50 active-hour pacing, difficulty/endgame,
integrated app/mobile/PWA/a11y/performance/soak and independent acceptance remain
open. Browser works; CI is excluded; owner playtest follows implementation.
No pending user answer or external blocker exists.
