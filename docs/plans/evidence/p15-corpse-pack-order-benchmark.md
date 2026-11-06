# P15 — Learned Corpse Explosion pack orders

2026-11-04. The two Act V pack-order gaps identified by the
[source inventory](p15-checkpoint-source-reuse.md) now have native prepared
exports and bounded combat evidence. Both original earned sources remain
unchanged. Counts remain **14/14 intended Normal, formal balance 0/210**;
full private v1 and its wider acceptance remain incomplete.

## Preparation and observed contribution

For `necromancer-bone`, the selected Bloody Foothills elite source is level 58 /
next Normal ordinal 1671; the trash source is level 56 / ordinal 1559. Both
already cleared the area and learned Corpse Explosion rank 20. Production
`playerStore.setComboOrder` prepares this order:

```json
["necromancer.corpse_explosion", "necromancer.confuse",
 "necromancer.amplify_damage", "necromancer.weaken"]
```

Exact native hydration, save roundtrip and full-domain comparison establish
that each prepared export differs from its decoded source only in
`player.comboOrder`. Preparation changes no points, equipment, currency,
resources, clock or progression. Admission and preceding-wave carry use the
production paths.

Each prepared save supplies identical bytes for its manual/idle pair. Four
`runCheckpointAttempt` benchmark attempts use seed 1, saved-next ordinals, exact
saved timestamps and explicitly declared zero initial idle pity. No adaptation,
retry, tuning population or holdout is used.

| Source role | Waves per mode | Combat seconds per mode | CE casts per mode | CE casts in target role | CE fire damage in target role |
| --- | ---: | ---: | ---: | ---: | ---: |
| Elite | 6 victories | 53.632417 | 22 | 12 | 213,891 |
| Trash | 6 victories | 56.133988 | 23 | 7 | 65,231 |

Total: **24 wave victories, zero nonwins, 90 CE casts**, 219.532810 combat
seconds. Per mode, elite rewards are 301,513 hero XP, 226,133 Prayer XP and 64
items; trash rewards are 207,126 hero XP, 155,343 Prayer XP and 57 items. Native
execution takes 9.56245 seconds; individual measured attempts take 0.50–0.75
seconds with full observations. Final saves are diagnostic outputs, not campaign
successors.

## Verification and limits

The retained-output reader passes original container/raw-save and driver/source
hashes, exact order-only preparation, finite corpse consumption, native journal
and RNG derivations, full final-save reward/XP/item custody reconstruction and
pair combat equality. Idle presentation reports pity 1 then 2 on the first two
trash waves; that metadata difference is checked separately. Process-global
item allocation retains production behavior. A supplementary reader verifies
the target-role damage above and eight helper contracts against both earlier
CLI manifests and current source.

This external driver captured the shared source manifest, which excludes
`tests/sim/contracts`; it did not capture its own before/after contract
manifests. The supplementary equality check is retained as a limitation, not
presented as contemporaneous capture. Future population drivers must record
both manifests, as `scripts/measure-checkpoint.mjs` already does. These one-seed
benchmarks establish pack preparation and contribution, not formal balance,
acquisition policy, pacing or independent final QA.

The initial preflight stopped before hydration or gameplay because its pinned
tree hash preceded a change only to `tests/sim/production/README.md`. Its plan,
error and 0.744015-second spend remain; the successor plan deducts that spend
from the original 180-second aggregate. Two reader corrections also remain:
use the recorded death field `target`, and compare exact mode-specific pity
presentation separately from combat equality. Failed reader versions, stdout
and stderr are preserved. Neither correction replayed gameplay or renewed a
budget.

## Required evidence and cleanup

Root retains these exact packets through umbrella acceptance, then owns their
exact cleanup:

- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-corpse-pack-freeze-v2-1b6k4pik`
  — successful preparation, four attempts, readers and original failures.
- `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-corpse-pack-freeze-fh9xrj7w`
  — stopped initial preflight and its spent allowance.

| Successful-packet artifact | SHA256 |
| --- | --- |
| `plan.json` | `26bbe83c372a101c0ba666003ad115bbb72ef50b79ff45f25f80010597aedffa` |
| `native.json` | `e6fc2661626ead4bff21c587e1176f1af66140b5f96c9c9526866f3db3176ebd` |
| `readback.json` | `92b53bcae7a05ced3df14ea6f6ec43157ea9e4082b9d67953a9ab81bfc4c2f27` |
| `supplement.json` | `989d0dfe3a7db831dc9447ff1f78bc14e59fd3d983ac6b07726e20cea1e357ac` |
| `elite-prepared-save.json` | `50f795fc6b68c423991f7822938f74ab5eafdb40f98626a5223b39224f9d0905` |
| `trash-prepared-save.json` | `b3f8af608e06aed901d7eff8b8598df0c79ce8d24cd0d164ec7da5fd4454d0b7` |

Both recorded native PIDs (4189546 and 4189149) and exact task caches are absent;
both `cleanup.json` records report no disposable paths or cleanup failures.
The successful packet occupies 23,400,464 bytes, below its 96 MiB budget. No
broad tests, build, completed-campaign replay or new agent was needed.
