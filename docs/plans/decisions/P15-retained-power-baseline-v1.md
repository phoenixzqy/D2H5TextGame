# P15 — Exact retained-power baseline v1

2026-11-05. Freeze inputs before further balance measurement. This is the
conditional baseline for the 210 selected build/act/encounter contexts in
[source availability](../evidence/p15-throw-repeat-source-supplement.md).
It does not replace the target's recommended-power, acquisition, population,
three-attempt adaptation or pacing requirements.

## Selection and exact state

Use the already selected 183 source containers, without outcome-based
reselection. Verify each complete container and extracted UTF-8 save against
its recorded byte length and SHA256. A retained input comprises its exact save
bytes, extraction instructions, all domain fingerprints and a readable power
snapshot: hero allocation/learned skills/order, canonical `inventory.equipped`,
mercenaries and their canonical equipment/progression, formation, resources,
currencies/materials, map progression, settings, saved clock and ordinals.
Backpack/stash and every other field remain pinned even when not reproduced in
the readable snapshot. `player.equipment` is a historical mirror, not equipment
authority. Saved derived stats are historical values, not current combat
projections. No decoding, hydration, entry refill or combat runs in this freeze.

For exactly Bone Necromancer Act V trash and elite, select the two existing
[native order preparations](../evidence/p15-corpse-pack-order-benchmark.md).
Pin both original containers, both prepared exports and the existing native
preparation/readback receipts. Verify the prepared save equals its recorded
decoded predecessor except for `player.comboOrder`, which is:

```json
["necromancer.corpse_explosion", "necromancer.confuse",
 "necromancer.amplify_damage", "necromancer.weaken"]
```

No preparation is repeated. These exports are order-only derivatives, not new
earned successors. Preserve every historical whole-area start/boss boundary,
all five failed branches, the eleven diagnostic sources' noncanonical status,
and Double Throw's distinct intended-lineage costs. No save mutation, farming,
counter padding, reward roll, holdout read or renewed spent allowance is allowed.

## Acquisition and adaptation boundary

The baseline acquisition rule is to condition on each exact retained history.
Pin its source references and retain available lineage/cost receipts. Unknown
ancestral costs remain unknown; neither this freeze's zero gameplay nor the
order preparation's zero currency/point spend makes historical acquisition free.
No typical-player, equal-power or recommended-power distribution is inferred.

For a future isolated first-attempt baseline, permit no additional allocation,
gear/socket/crafting/mercenary/order change, training or out-of-combat resource
edit. Start from the exact selected save and let native entry apply its normal
rules. That specifies zero *additional* preparation spend; ordinary entry costs
and acquired-state costs remain separate. No trial is launched by this decision.
The required within-three-attempt policy remains unfrozen: a one-attempt
baseline cannot establish retry success or replace that requirement.

## Validation and remaining work

The external freeze and separate retained-output reader must verify the complete
14 × 5 × 3 key set, input/source hashes, snapshot joins, both preparations and
all unchanged provenance/failure fields. Record process exit and exact cleanup.
Use packet-local finite-JSON serialization for domain fingerprints; its format
is explicit and is not the engine fixture fingerprint. Exact raw-save SHA256
remains the handoff identity for the production fixture loader.

Keep `powerAcquisitionAdaptationFrozen`, `populationFrozen` and `acceptedBalance`
false in inherited rows. Add a separate exact-input status so this limited
freeze cannot silently close the broader requirements. Current decoding and
combat projection must be checked under any later measurement's source
manifest. Ordinal selection, prefix carry, role populations, manual/idle RNG,
transient pity and three-attempt adaptation still need prospective definitions.
Historical 14/14 Normal completions, 210 source contexts and formal balance
0/210 remain unchanged. Full private v1 stays incomplete.
